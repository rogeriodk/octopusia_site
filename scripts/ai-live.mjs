import fs from "node:fs/promises";
import { sanitizeValue } from "./sanitize-report.mjs";

const baseUrl = process.env.HOMOLOG_BASE_URL;
if (!baseUrl) throw new Error("HOMOLOG_BASE_URL não configurada.");

const started = Date.now();
let status = "FAIL";
let httpStatus = null;
let configured = false;
let model = null;
let responsePreview = "";
let error = null;

try {
  const readiness = await fetch(new URL("/api/ai", baseUrl), {
    signal: AbortSignal.timeout(10000),
    cache: "no-store"
  });
  const readinessBody = await readiness.json();
  configured = readiness.ok && readinessBody?.configured === true;
  model = typeof readinessBody?.model === "string" ? readinessBody.model : null;

  if (!configured) {
    throw new Error("OPENAI_API_KEY não está ativa no ambiente implantado.");
  }

  const response = await fetch(new URL("/api/ai", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Teste técnico de disponibilidade. Responda apenas com OCTOPUS_OK.",
      history: []
    }),
    signal: AbortSignal.timeout(70000)
  });

  httpStatus = response.status;
  const text = await response.text();
  responsePreview = text.replace(/\s+/g, " ").trim().slice(0, 120);
  if (!response.ok) throw new Error(`Endpoint de IA respondeu HTTP ${response.status}.`);
  if (!text.trim()) throw new Error("Endpoint de IA retornou resposta vazia.");

  status = "PASS";
} catch (caught) {
  error = caught instanceof Error ? caught.message : String(caught);
}

const report = sanitizeValue({
  schemaVersion: 1,
  kind: "ai-live",
  environment: "homologacao",
  commit: process.env.EXPECTED_GIT_SHA || null,
  baseUrl,
  startedAt: new Date(started).toISOString(),
  finishedAt: new Date().toISOString(),
  durationMs: Date.now() - started,
  summary: { total: 1, passed: status === "PASS" ? 1 : 0, failed: status === "FAIL" ? 1 : 0, warned: 0 },
  cases: [{
    name: "openai-live-conversation",
    status,
    configured,
    model,
    httpStatus,
    responsePreview,
    error
  }]
});

await fs.mkdir("runtime-reports", { recursive: true });
await fs.writeFile("runtime-reports/latest-ai-live.json", JSON.stringify(report, null, 2));
if (status !== "PASS") process.exit(1);
