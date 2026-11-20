"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Preview of the feedback email exactly as this person gets it, plus the
 * button that sends it. */
export function AdminFeedbackSend({
  userId,
  email,
  subject,
  html,
  sentAt,
  pt,
}: {
  userId: string;
  email: string;
  subject: string;
  html: string;
  sentAt: string | null;
  pt: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const L = (a: string, b: string) => (pt ? a : b);

  async function send() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/feedback-request`, { method: "POST" });
      if (!res.ok) throw new Error();
      setMsg({ text: L(`Enviado para ${email}.`, `Sent to ${email}.`) });
      setConfirming(false);
      router.refresh();
    } catch {
      setMsg({ text: L("Não foi possível enviar. Tente de novo.", "Couldn't send it. Try again."), error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-400">
        <b className="text-zinc-200">{L("Para:", "To:")}</b> {email}
        <br />
        <b className="text-zinc-200">{L("Assunto:", "Subject:")}</b> {subject}
      </p>
      <iframe title="preview" srcDoc={html} sandbox="" className="w-full h-[560px] rounded-md border border-zinc-800 bg-white" />
      {sentAt && (
        <p className="text-xs text-amber-400">
          {L("Já foi enviado em", "Already sent on")} {new Date(sentAt).toLocaleString(pt ? "pt-BR" : "en-US")}.
        </p>
      )}
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="self-start rounded-full bg-[#F5B900] text-black px-5 py-2 text-sm font-medium hover:bg-[#ffcc33]"
        >
          {sentAt ? L("Enviar de novo", "Send again") : L("Enviar este e-mail", "Send this email")}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-700 p-3 text-sm">
          <span>{L(`Enviar para ${email}?`, `Send to ${email}?`)}</span>
          <button
            type="button"
            disabled={busy}
            onClick={send}
            className="rounded-full bg-[#F5B900] text-black px-4 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {busy ? L("Enviando...", "Sending...") : L("Sim, enviar", "Yes, send")}
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs">
            {L("Cancelar", "Cancel")}
          </button>
        </div>
      )}
      {msg && <p className={`text-sm ${msg.error ? "text-red-400" : "text-green-400"}`}>{msg.text}</p>}
    </div>
  );
}
