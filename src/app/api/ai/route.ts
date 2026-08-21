import { NextResponse } from "next/server";
import { OCTOPUS_ASSISTANT_INSTRUCTIONS } from "../../../lib/octopus-knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientMessage = { role: "user" | "assistant"; content: string };
type Bucket = { count: number; resetAt: number };
type ResponseContent = { type?: string; text?: string; refusal?: string };
type ResponseOutput = { type?: string; content?: ResponseContent[] };
type OpenAIResponsePayload = { output_text?: string; output?: ResponseOutput[] };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
}

function rateLimited(key: string) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  buckets.set(key, current);
  return current.count > MAX_REQUESTS;
}

function validHistory(value: unknown): ClientMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is ClientMessage => {
      if (!item || typeof item !== "object") return false;
      const record = item as Record<string, unknown>;
      return (record.role === "user" || record.role === "assistant") && typeof record.content === "string";
    })
    .map((item) => ({ role: item.role, content: item.content.slice(0, 3000) }))
    .slice(-8);
}

function extractResponseText(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts: string[] = [];
  for (const item of payload.output || []) {
    if (item.type !== "message" || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (typeof content.text === "string" && content.text.trim()) parts.push(content.text);
      else if (typeof content.refusal === "string" && content.refusal.trim()) parts.push(content.refusal);
    }
  }
  return parts.join("\n").trim();
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || "gpt-5.6"
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (rateLimited(clientKey(request))) {
    return NextResponse.json({ error: "Muitas solicitações em sequência. Aguarde alguns minutos e tente novamente." }, { status: 429 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "A IA do site ainda não está configurada neste ambiente." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { message?: unknown; history?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 3000) : "";
  if (!message) {
    return NextResponse.json({ error: "Digite uma pergunta para continuar." }, { status: 400 });
  }

  const history = validHistory(body?.history);
  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6",
      instructions: OCTOPUS_ASSISTANT_INSTRUCTIONS,
      input: [...history, { role: "user", content: message }],
      max_output_tokens: 700,
      store: false
    }),
    signal: AbortSignal.timeout(60000)
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ error: "Não foi possível conectar ao serviço de IA agora." }, { status: 502 });
  }
  if (!upstream.ok) {
    console.error("AI upstream request failed", { status: upstream.status });
    return NextResponse.json({ error: "A IA não conseguiu concluir a solicitação agora." }, { status: 502 });
  }

  const payload = await upstream.json().catch(() => null) as OpenAIResponsePayload | null;
  if (!payload) {
    return NextResponse.json({ error: "A IA retornou uma resposta inválida." }, { status: 502 });
  }

  const answer = extractResponseText(payload);
  if (!answer) {
    console.error("AI upstream returned no visible text");
    return NextResponse.json({ error: "A IA concluiu o processamento, mas não retornou texto. Tente novamente." }, { status: 502 });
  }

  return new Response(answer, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Accel-Buffering": "no"
    }
  });
}
