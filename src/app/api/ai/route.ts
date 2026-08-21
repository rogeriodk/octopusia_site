import OpenAI from "openai";
import { NextResponse } from "next/server";
import { OCTOPUS_ASSISTANT_INSTRUCTIONS } from "../../../lib/octopus-knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientMessage = { role: "user" | "assistant"; content: string };
type Bucket = { count: number; resetAt: number };
type SafeOpenAIError = { status?: unknown; code?: unknown; type?: unknown; name?: unknown };

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

function safeErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { upstreamStatus: null, upstreamCode: null, upstreamType: null, errorName: "UnknownError" };
  }

  const candidate = error as SafeOpenAIError;
  const upstreamStatus = typeof candidate.status === "number" ? candidate.status : null;
  const upstreamCode = typeof candidate.code === "string" ? candidate.code.slice(0, 80) : null;
  const upstreamType = typeof candidate.type === "string" ? candidate.type.slice(0, 80) : null;
  const errorName = typeof candidate.name === "string" ? candidate.name.slice(0, 80) : "UnknownError";
  return { upstreamStatus, upstreamCode, upstreamType, errorName };
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

  try {
    const response = await client.responses.create({
      model,
      instructions: OCTOPUS_ASSISTANT_INSTRUCTIONS,
      input,
      max_output_tokens: 1200,
      store: false
    });

    const answer = response.output_text?.trim() || "";
    if (!answer) {
      console.error("AI upstream returned no output_text", {
        responseId: response.id,
        status: response.status
      });
      return NextResponse.json({
        error: "A IA concluiu o processamento, mas não retornou texto. Tente novamente.",
        errorCode: "EMPTY_OUTPUT"
      }, { status: 502 });
    }

    return new Response(answer, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    });
  } catch (error) {
    const details = safeErrorDetails(error);
    console.error("AI request failed", details);
    return NextResponse.json({
      error: "A IA não conseguiu concluir a solicitação agora.",
      errorCode: "OPENAI_UPSTREAM_ERROR",
      upstreamStatus: details.upstreamStatus,
      upstreamCode: details.upstreamCode,
      upstreamType: details.upstreamType
    }, {
      status: 502,
      headers: {
        "X-Octopus-AI-Error": "OPENAI_UPSTREAM_ERROR",
        "X-Octopus-AI-Upstream-Status": details.upstreamStatus ? String(details.upstreamStatus) : "unknown"
      }
    });
  }
}
