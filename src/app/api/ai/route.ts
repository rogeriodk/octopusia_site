import { NextResponse } from "next/server";
import { OCTOPUS_ASSISTANT_INSTRUCTIONS } from "../../../lib/octopus-knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientMessage = { role: "user" | "assistant"; content: string };
type Bucket = { count: number; resetAt: number };
type ResponseContent = { type?: string; text?: string; refusal?: string };
type ResponseOutput = { type?: string; content?: ResponseContent[] };
type OpenAIResponsePayload = { output_text?: string; output?: ResponseOutput[] };
type StreamEvent = {
  type?: string;
  delta?: string;
  response?: OpenAIResponsePayload;
};

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

function extractResponseText(payload: OpenAIResponsePayload | undefined) {
  if (!payload) return "";
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
      let emitted = "";
      let completedText = "";

      const processLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) return;
        const raw = trimmed.slice(5).trim();
        if (!raw || raw === "[DONE]") return;

        try {
          const event = JSON.parse(raw) as StreamEvent;
          if (event.type === "response.output_text.delta" && typeof event.delta === "string" && event.delta) {
            emitted += event.delta;
            controller.enqueue(encoder.encode(event.delta));
            return;
          }

          if (event.type === "response.completed") {
            completedText = extractResponseText(event.response);
          }
        } catch {
          // Linhas SSE não textuais ou desconhecidas são ignoradas.
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex = buffer.indexOf("\n");
          while (newlineIndex >= 0) {
            const line = buffer.slice(0, newlineIndex).replace(/\r$/, "");
            buffer = buffer.slice(newlineIndex + 1);
            processLine(line);
            newlineIndex = buffer.indexOf("\n");
          }
        }

        buffer += decoder.decode();
        if (buffer.trim()) processLine(buffer);

        if (!emitted.trim() && completedText.trim()) {
          emitted = completedText;
          controller.enqueue(encoder.encode(completedText));
        }

        if (!emitted.trim()) {
          controller.enqueue(encoder.encode("Não consegui gerar uma resposta visível desta vez. Tente novamente."));
        }
      } catch {
        controller.enqueue(encoder.encode("Não foi possível concluir a resposta. Tente novamente."));
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
