"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export default function LeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, consent: data.consent === "on" })
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || "Não foi possível enviar agora.");
      form.reset();
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar agora.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="leadForm leadSent" role="status" data-testid="lead-sent">
        <strong>Mensagem recebida.</strong>
        <p>Obrigado! Respondemos em até 1 dia útil pelo contato que você informou.</p>
      </div>
    );
  }

  return (
    <form className="leadForm" onSubmit={onSubmit} data-testid="lead-form">
      <div className="leadRow">
        <label>Nome<input name="name" required minLength={2} maxLength={120} autoComplete="name" /></label>
        <label>Empresa<input name="company" maxLength={120} autoComplete="organization" /></label>
      </div>
      <label>E-mail ou WhatsApp<input name="contact" required minLength={6} maxLength={160} autoComplete="email" /></label>
      <label>O que você quer resolver?<textarea name="message" required minLength={10} maxLength={2000} rows={4} /></label>
      <label className="honeypot" aria-hidden="true">Site<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="consent">
        <input type="checkbox" name="consent" required />
        <span>Concordo que a OCTOPUS IA use estes dados para responder meu contato, conforme a <Link href="/privacidade">política de privacidade</Link>.</span>
      </label>
      {status === "error" && <p className="leadError" role="alert">{error}</p>}
      <button className="btn primary" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Enviando..." : "Enviar mensagem"} <span>→</span>
      </button>
    </form>
  );
}
