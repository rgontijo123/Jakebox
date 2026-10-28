"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { PASSWORD_REQUIREMENTS_HINT } from "@/lib/passwordPolicy";
import OAuthButtons from "@/components/OAuthButtons";
import { PasswordInput } from "@/components/PasswordInput";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, tosAccepted }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? t("signup_generic_error"));
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      setError(t("signup_signin_failed"));
      return;
    }
    router.push("/create");
    router.refresh(); // re-fetch server components (Header) so they see the new session
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-semibold mb-2">{t("signup_title")}</h1>

        <OAuthButtons />

        <label className="flex flex-col gap-1 text-sm">
          {t("login_email")}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {t("login_password")}
          <PasswordInput
            required
            minLength={8}
            pattern="(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
            title={PASSWORD_REQUIREMENTS_HINT}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          />
          <span className="text-xs text-zinc-500">{PASSWORD_REQUIREMENTS_HINT}</span>
        </label>

        <label className="flex items-start gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={tosAccepted}
            onChange={(e) => setTosAccepted(e.target.checked)}
            className="mt-1"
          />
          {t("signup_tos_agree")}{" "}
          <a href="/terms" className="underline">
            {t("footer_terms")}
          </a>
          .
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-white text-black px-6 py-3 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? t("signup_submitting") : t("signup_submit")}
        </button>

        <p className="text-sm text-zinc-500 text-center">
          {t("signup_have_account")}{" "}
          <a href="/login" className="underline">
            {t("nav_login")}
          </a>
        </p>
      </form>
    </main>
  );
}
