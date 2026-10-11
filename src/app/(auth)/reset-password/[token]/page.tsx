"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { PASSWORD_REQUIREMENTS_HINT } from "@/lib/passwordPolicy";
import { PasswordInput } from "@/components/PasswordInput";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-semibold mb-2">Choose a new password</h1>

        {done ? (
          <p className="text-sm text-zinc-400">Password updated. Redirecting you to log in...</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              New password
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

            <label className="flex flex-col gap-1 text-sm">
              Confirm new password
              <PasswordInput
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              />
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-white text-black px-6 py-3 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save new password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
