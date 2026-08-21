import fs from "node:fs/promises";
import { chromium } from "playwright";
import { sanitizeValue } from "./sanitize-report.mjs";

const baseUrl = process.env.HOMOLOG_BASE_URL;
const expectedSha = process.env.EXPECTED_GIT_SHA || null;
if (!baseUrl) throw new Error("HOMOLOG_BASE_URL não configurada.");

const startedAt = Date.now();
const cases = [];
const failureArtifacts = [];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 }
];

await fs.mkdir("runtime-reports", { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    const started = Date.now();
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 300));
    });

    let status = "FAIL";
    let answerPreview = "";
    let error = null;

    try {
      await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30000 });
      await page.locator('[data-testid="ai-interactive"]').waitFor({ state: "visible", timeout: 10000 });
      await page.locator(".onlineBadge.isOnline").waitFor({ state: "visible", timeout: 10000 });

      const input = page.locator('[data-testid="ai-input-form"] input');
      const button = page.locator('[data-testid="ai-input-form"] button[type="submit"]');
      const assistantMessages = page.locator(".message.assistant p");
      const beforeCount = await assistantMessages.count();

      await input.fill("Em uma frase curta, diga o que a OCTOPUS IA faz.");
      await button.click();

      await page.waitForFunction(
        ({ before }) => {
          const nodes = Array.from(document.querySelectorAll(".message.assistant p"));
          if (nodes.length <= before) return false;
          const text = (nodes[nodes.length - 1]?.textContent || "").trim();
          if (!text || text === "...") return false;
          const bad = [
            "não consegui gerar uma resposta visível",
            "não foi possível concluir a resposta",
            "a ia não conseguiu",
            "tente novamente"
          ];
          return text.length >= 15 && !bad.some((term) => text.toLowerCase().includes(term));
        },
        { before: beforeCount },
        { timeout: 45000 }
      );

      const finalMessage = assistantMessages.last();
      answerPreview = ((await finalMessage.textContent()) || "").replace(/\s+/g, " ").trim().slice(0, 180);
      if (!answerPreview) throw new Error("A interface não exibiu texto de resposta.");
      status = "PASS";
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
      const screenshotPath = `runtime-reports/ui-failure-${viewport.name}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => null);
      failureArtifacts.push(screenshotPath);
    } finally {
      cases.push({
        name: `ai-chat-${viewport.name}`,
        viewport: `${viewport.width}x${viewport.height}`,
        status,
        durationMs: Date.now() - started,
        answerPreview,
        consoleErrors: consoleErrors.slice(0, 5),
        error
      });
      await context.close();
    }
  }
} finally {
  await browser.close();
}

const failed = cases.filter((item) => item.status === "FAIL").length;
const report = sanitizeValue({
  schemaVersion: 1,
  kind: "ui-live",
  environment: "homologacao",
  commit: expectedSha,
  baseUrl,
  startedAt: new Date(startedAt).toISOString(),
  finishedAt: new Date().toISOString(),
  durationMs: Date.now() - startedAt,
  summary: {
    total: cases.length,
    passed: cases.length - failed,
    failed,
    warned: 0
  },
  cases,
  failureArtifacts
});

await fs.writeFile("runtime-reports/latest-ui-live.json", JSON.stringify(report, null, 2));
if (failed) process.exit(1);
