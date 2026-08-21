"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { QUICK_PROMPTS } from "../lib/octopus-knowledge";

type Message = { role: "user" | "assistant"; content: string };
type AiStatus = { configured: boolean; model?: string };

const initialMessage: Message = {
  role: "assistant",
  content: "Olá! Eu sou a IA da OCTOPUS. Posso explicar nossos projetos, analisar uma oportunidade de automação ou fazer um diagnóstico rápido do seu negócio."
};

export default function AIInteractive() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Pronta para conversar");
  const [aiStatus, setAiStatus] = useState<AiStatus>({ configured: false });
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ai", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: AiStatus) => setAiStatus(data))
      .catch(() => setAiStatus({ configured: false }));
  }, []);

  useEffect(() => {
    const node = conversationRef.current;
    if (!node) return;
    const frame = requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, busy]);

  const recentHistory = useMemo(() => messages.slice(-8), [messages]);

  async function sendMessage(value: string) {
    const message = value.trim();
    if (!message || busy) return;

    const history = recentHistory;
    setInput("");
    setBusy(true);
    setStatus("Entendendo sua pergunta...");
    setMessages((current) => [...current, { role: "user", content: message }, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || "A IA não conseguiu responder agora.");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("A resposta da IA não pôde ser transmitida.");

      const decoder = new TextDecoder();
      setStatus("Respondendo...");
      let receivedText = false;

      while (true) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        const delta = decoder.decode(chunk, { stream: true });
        if (!delta) continue;
        receivedText = true;
        setMessages((current) => {
          const next = [...current];
          const last = next[next.length - 1];
          next[next.length - 1] = { role: "assistant", content: `${last?.content || ""}${delta}` };
          return next;
        });
      }

      if (!receivedText) {
        throw new Error("A IA concluiu o processamento, mas não retornou texto. Tente novamente.");
      }

      setStatus("Pronta para continuar");
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Não foi possível concluir a conversa.";
      setMessages((current) => {
        const next = [...current];
        next[next.length - 1] = { role: "assistant", content: messageText };
        return next;
      });
      setStatus("Tente novamente");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <section className="aiPanel" id="ia" aria-label="Área de IA Interativa" data-testid="ai-interactive">
      <div className="aiPanelHeader">
        <div>
          <span className="aiSpark">✦</span>
          <div><strong>Área de IA Interativa</strong><small>{status}</small></div>
        </div>
        <span className={`onlineBadge ${aiStatus.configured ? "isOnline" : "isPending"}`}>
          <i /> {aiStatus.configured ? "IA ao vivo" : "Pronta para ativação"}
        </span>
      </div>

      <div className="aiConversation" ref={conversationRef} aria-live="polite" aria-busy={busy}>
        {messages.slice(-5).map((message, index) => (
          <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
            <span className="messageAvatar">{message.role === "assistant" ? "O" : "Você"}</span>
            <p>{message.content || (busy ? "Pensando..." : "")}</p>
          </div>
        ))}
      </div>

      <div className="quickPrompts" aria-label="Sugestões de perguntas" data-testid="ai-quick-prompts">
        {QUICK_PROMPTS.map((prompt, index) => (
          <button key={prompt} type="button" onClick={() => void sendMessage(prompt)} disabled={busy}>
            <span>{index === 0 ? "↗" : index === 1 ? "▤" : "⌘"}</span>{prompt}
          </button>
        ))}
      </div>

      <form className="aiInput" onSubmit={onSubmit} data-testid="ai-input-form">
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Descreva seu problema ou ideia..." maxLength={3000} aria-label="Mensagem para a IA da OCTOPUS" />
        <button type="submit" aria-label="Enviar mensagem" disabled={busy || !input.trim()}>➤</button>
      </form>

      <p className="aiPrivacy">Não envie senhas, documentos pessoais ou dados sensíveis. As conversas desta demonstração não são usadas como cadastro comercial automático.</p>
    </section>
  );
}
