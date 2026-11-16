import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Leads ficam em um arquivo JSONL. Em produção, aponte LEADS_DIR para um volume persistente do EasyPanel.
const LEADS_DIR = process.env.LEADS_DIR || "/tmp/octopus-leads";
// Opcional: encaminha cada lead para outro sistema (ex.: o agente comercial).
const LEAD_WEBHOOK_URL = process.env.LEAD_WEBHOOK_URL || "";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Muitas mensagens em pouco tempo. Tente de novo em alguns minutos." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  // Campo invisível: robôs costumam preencher.
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const lead = {
    name: clean(body.name, 120),
    company: clean(body.company, 120),
    contact: clean(body.contact, 160),
    message: typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "",
    consent: body.consent === true
  };

  if (lead.name.length < 2 || lead.contact.length < 6 || lead.message.length < 10) {
    return NextResponse.json({ error: "Preencha nome, contato e uma mensagem com pelo menos 10 caracteres." }, { status: 400 });
  }
  if (!lead.consent) {
    return NextResponse.json({ error: "Para enviar, marque a concordância com a política de privacidade." }, { status: 400 });
  }

  const record = { ...lead, source: "site", receivedAt: new Date().toISOString() };

  try {
    await mkdir(LEADS_DIR, { recursive: true });
    await appendFile(path.join(LEADS_DIR, "leads.jsonl"), `${JSON.stringify(record)}\n`, "utf8");
  } catch {
    console.error("[lead] falha ao gravar o lead em disco");
    if (!LEAD_WEBHOOK_URL) {
      return NextResponse.json({ error: "Não foi possível registrar agora. Escreva para contato@octopusia.org." }, { status: 500 });
    }
  }

  if (LEAD_WEBHOOK_URL) {
    try {
      await fetch(LEAD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
        signal: AbortSignal.timeout(5000)
      });
    } catch {
      console.error("[lead] falha ao encaminhar o lead ao webhook");
    }
  }

  return NextResponse.json({ ok: true });
}
