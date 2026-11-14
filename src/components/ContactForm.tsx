"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { DictionaryKey } from "@/lib/i18n/translations";

const ERROR_KEYS: Record<string, DictionaryKey> = {
  missing_fields: "contact_err_missing",
  too_many: "contact_err_too_many",
  send_failed: "contact_err_send",
};

const INPUT_CLASS = "rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm";

export function ContactForm() {
  const { t } = useLocale();
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", country: "", message: "", website: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(t(ERROR_KEYS[data?.error] ?? "contact_err_send"));
        return;
      }
      setSent(true);
    } catch {
      setError(t("contact_err_send"));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return <p className="rounded-2xl border border-zinc-800 p-5 text-sm text-green-400">{t("contact_sent")}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {t("contact_name")} *
          <input required maxLength={120} value={form.name} onChange={set("name")} autoComplete="name" className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("login_email")} *
          <input required type="email" maxLength={200} value={form.email} onChange={set("email")} autoComplete="email" className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("contact_phone")} *
          <input required type="tel" maxLength={40} value={form.phone} onChange={set("phone")} autoComplete="tel" className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("contact_city")}
          <input maxLength={120} value={form.city} onChange={set("city")} autoComplete="address-level2" className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          {t("contact_country")}
          <input maxLength={120} value={form.country} onChange={set("country")} autoComplete="country-name" className={INPUT_CLASS} />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        {t("contact_message")} *
        <textarea
          required
          maxLength={5000}
          rows={6}
          value={form.message}
          onChange={set("message")}
          placeholder={t("contact_message_placeholder")}
          className={`${INPUT_CLASS} resize-y`}
        />
      </label>

      {/* honeypot: hidden from people, often filled in by bots */}
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.website}
        onChange={set("website")}
        className="hidden"
      />

      <p className="text-xs text-zinc-500">{t("contact_required_note")}</p>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={sending}
        className="self-start rounded-full bg-[#F5B900] text-black px-6 py-2.5 text-sm font-medium hover:bg-[#ffcc33] transition-colors disabled:opacity-50"
      >
        {sending ? t("forgot_sending") : t("contact_send")}
      </button>
    </form>
  );
}
