import { NextResponse } from "next/server";
import { OCTOPUS_ASSISTANT_INSTRUCTIONS } from "../../../lib/octopus-knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientMessage = { role: "user" | "assistant"; content: string };
type Bucket = { count: number; resetAt: number };
type OpenAIContent = { type?: string; text?: string; refusal?: string };
type OpenAIOutput = { type?: string; content?: OpenAIContent[] };
type OpenAIResponsePayload = {
  id?: string;
  status?: string;
  output_text?: string;
  output?: OpenAIOutput[];
  error?: { code?: string; type?: string; message?: string } | null;
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

function extractResponseText(payload: OpenAIResponsePayload | null) {
  if (!payload) return "";
  if (typeof payload.output_text === "string" && payload.output_text.trim()) return payload.output_text.trim();

  const parts: string[] = [];
  for (const item of payload.output || []) {
    if (!Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (typeof content.text === "string" && content.text.trim()) parts.push(content.text.trim());
      else if (typeof content.refusal === "string" && content.refusal.trim()) parts.push(content.refusal.trim());
    }
  }
  return parts.join("\n").trim();
}

function safeUpstreamError(payload: OpenAIResponsePayload | null, status: number) {
  return {
    upstreamStatus: status || null,
    upstreamCode: typeof payload?.error?.code === "string" ? payload.error.code.slice(0, 80) : null,
    upstreamType: typeof payload?.error?.type === "string" ? payload.error.type.slice(0, 80) : null
  };
}

function diagnosticErrorResponse(
  error: string,
  errorCode: string,
  status: number,
  details: { upstreamStatus: number | null; upstreamCode: string | null; upstreamType: string | null }
) {
  return NextResponse.json({ error, errorCode, ...details }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Octopus-AI-Error": errorCode,
      ...(details.upstreamStatus ? { "X-Octopus-AI-Upstream-Status": String(details.upstreamStatus) } : {})
    }
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || "gpt-5.6"
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
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
    const model = process.env.OPENAI_MODEL || "gpt-5.6";

    let upstream: Response;
    try {
      upstream = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          instructions: OCTOPUS_ASSISTANT_INSTRUCTIONS,
          input: [...history, { role: "user", content: message }],
          max_output_tokens: 1200,
          store: false
        }),
        signal: AbortSignal.timeout(60000),
        cache: "no-store"
      });
    } catch (error) {
      const errorName = error instanceof Error ? error.name.slice(0, 80) : "UnknownError";
      console.error("AI transport failed", { errorName });
      return diagnosticErrorResponse(
        "Não foi possível conectar ao serviço de IA agora.",
        "OPENAI_TRANSPORT_ERROR",
        503,
        { upstreamStatus: null, upstreamCode: null, upstreamType: errorName }
      );
    }

    const payload = await upstream.json().catch(() => null) as OpenAIResponsePayload | null;
    if (!upstream.ok) {
      const details = safeUpstreamError(payload, upstream.status);
      console.error("AI upstream request failed", details);
      return diagnosticErrorResponse(
        "A IA não conseguiu concluir a solicitação agora.",
        "OPENAI_UPSTREAM_ERROR",
        424,
        details
      );
    }

    const answer = extractResponseText(payload);
    if (!answer) {
      console.error("AI upstream returned no text", {
        responseId: payload?.id || null,
        status: payload?.status || null
      });
      return diagnosticErrorResponse(
        "A IA concluiu o processamento, mas não retornou texto. Tente novamente.",
        "EMPTY_OUTPUT",
        422,
        { upstreamStatus: upstream.status, upstreamCode: null, upstreamType: payload?.status || null }
      );
    }

    return new Response(answer, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    });
  } catch (error) {
    const errorName = error instanceof Error ? error.name.slice(0, 80) : "UnknownError";
    console.error("AI route failed", { errorName });
    return diagnosticErrorResponse(
      "A IA encontrou uma falha interna temporária.",
      "AI_ROUTE_ERROR",
      500,
      { upstreamStatus: null, upstreamCode: null, upstreamType: errorName }
    );
  }
}
