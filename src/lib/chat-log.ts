import { appendFile, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";

// Registro anônimo das conversas com a IA do site, para entender o que os visitantes perguntam.
// Um arquivo por dia (chats-AAAA-MM-DD.jsonl); arquivos com mais de RETENTION_DAYS são apagados.
// Em produção, aponte CHAT_LOG_DIR para um volume persistente do EasyPanel.
const CHAT_LOG_DIR = process.env.CHAT_LOG_DIR || "/tmp/octopus-chats";
const RETENTION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

let lastPrune = 0;

// Remove contatos e documentos que o visitante possa ter digitado.
export function redact(text: string) {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[e-mail]")
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[documento]")
    .replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, "[documento]")
    .replace(/(\+?\(?\d[\d\s().-]{7,}\d)/g, "[telefone]");
}

export function validSession(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(value) ? value : null;
}

async function prune() {
  const now = Date.now();
  if (now - lastPrune < DAY_MS) return;
  lastPrune = now;
  const files = await readdir(CHAT_LOG_DIR).catch(() => [] as string[]);
  for (const file of files) {
    const match = /^chats-(\d{4}-\d{2}-\d{2})\.jsonl$/.exec(file);
    if (match && now - Date.parse(match[1]) > RETENTION_DAYS * DAY_MS) {
      await unlink(path.join(CHAT_LOG_DIR, file)).catch(() => undefined);
    }
  }
}

export async function logChatTurn(entry: { session: string | null; question: string; answer: string }) {
  try {
    await mkdir(CHAT_LOG_DIR, { recursive: true });
    const now = new Date();
    const record = {
      at: now.toISOString(),
      session: entry.session,
      question: redact(entry.question).slice(0, 3000),
      answer: redact(entry.answer).slice(0, 4000)
    };
    await appendFile(path.join(CHAT_LOG_DIR, `chats-${now.toISOString().slice(0, 10)}.jsonl`), `${JSON.stringify(record)}\n`, "utf8");
    await prune();
  } catch {
    console.error("[chat-log] falha ao registrar a conversa");
  }
}
