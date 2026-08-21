import OpenAI from "openai";
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
  const input = [...history, { role: "user" as const, content: message }];
  const model = process.env.OPENAI_MODEL || "gpt-5.6";
  const client = new OpenAI({ apiKey, timeout: 60000, maxRetries: 1 });

  let upstream;
  try {
    upstream = await client.responses.create({
      model,
      instructions: OCTOPUS_ASSISTANT_INSTRUCTIONS,
      input,
      max_output_tokens: 900,
      reasoning: { effort: "minimal" },
      store: false,
      stream: true
    });
  } catch (error) {
    console.error("AI upstream request failed", {
      name: error instanceof Error ? error.name : "UnknownError"
    });
    return NextResponse.json({ error: "A IA não conseguiu concluir a solicitação agora." }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let emitted = "";
      try {
        for await (const event of upstream) {
          if (event.type === "response.output_text.delta" && event.delta) {
            emitted += event.delta;
            controller.enqueue(encoder.encode(event.delta));
          }
        }

        if (!emitted.trim()) {
          const fallback = await client.responses.create({
            model,
            instructions: OCTOPUS_ASSISTANT_INSTRUCTIONS,
            input,
            max_output_tokens: 900,
            reasoning: { effort: "minimal" },
            store: false
          });
          const fallbackText = fallback.output_text?.trim() || "";
          if (fallbackText) {
            emitted = fallbackText;
            controller.enqueue(encoder.encode(fallbackText));
          }
        }

        if (!emitted.trim()) {
          controller.enqueue(encoder.encode("A IA concluiu o processamento, mas não retornou texto. Tente novamente."));
        }
      } catch (error) {
        console.error("AI response stream failed", {
          name: error instanceof Error ? error.name : "UnknownError"
        });
        controller.enqueue(encoder.encode("Não foi possível concluir a resposta. Tente novamente."));
      } finally {
        controller.close();
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
