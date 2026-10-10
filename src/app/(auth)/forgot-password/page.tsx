"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-semibold mb-2">Reset your password</h1>

        {sent ? (
          <p className="text-sm text-zinc-400">
            If an account exists for <span className="text-zinc-200">{email}</span>, we&apos;ve sent a link to reset
            your password. Check your inbox (and spam folder).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-white text-black px-6 py-3 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-sm text-zinc-500 text-center">
          <a href="/login" className="underline">
            Back to log in
          </a>
        </p>
      </div>
    </main>
  );
}
