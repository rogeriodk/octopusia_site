import { NextResponse } from "next/server";
import { OCTOPUS_ASSISTANT_INSTRUCTIONS } from "../../../lib/octopus-knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientMessage = { role: "user" | "assistant"; content: string };
type Bucket = { count: number; resetAt: number };

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
      store: false,
      stream: true
    }),
    signal: AbortSignal.timeout(60000)
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ error: "Não foi possível conectar ao serviço de IA agora." }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    console.error("AI upstream request failed", { status: upstream.status });
    return NextResponse.json({ error: "A IA não conseguiu concluir a solicitação agora." }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split(/\r?\n\r?\n/);
          buffer = blocks.pop() || "";

          for (const block of blocks) {
            const dataLines = block.split(/\r?\n/).filter((line) => line.startsWith("data:"));
            for (const line of dataLines) {
              const raw = line.slice(5).trim();
              if (!raw || raw === "[DONE]") continue;
              try {
                const event = JSON.parse(raw) as { type?: string; delta?: string };
                if (event.type === "response.output_text.delta" && event.delta) {
                  controller.enqueue(encoder.encode(event.delta));
                }
              } catch {
                // Eventos não textuais não são expostos ao navegador.
              }
            }
          }
        }
      } catch {
        controller.enqueue(encoder.encode("\nNão foi possível concluir a resposta. Tente novamente."));
      } finally {
        controller.close();
        reader.releaseLock();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Accel-Buffering": "no"
    }
  });
}
