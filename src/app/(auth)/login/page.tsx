"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import OAuthButtons from "@/components/OAuthButtons";
import { PasswordInput } from "@/components/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });

    if (res?.error) {
      // authorize() doesn't surface a distinct "locked" error through
      // NextAuth's own error codes (collapsed for security reasons), so
      // this cross-checks separately to show the right message.
      const statusRes = await fetch("/api/auth/login-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const status = await statusRes.json().catch(() => null);
      setLoading(false);

      if (status?.locked) {
        const until = new Date(status.lockedUntil).toLocaleTimeString();
        setError(`Too many failed attempts. Try again after ${until}, or reset your password below.`);
      } else {
        setError("Invalid email or password");
      }
      return;
    }
    setLoading(false);
    router.push("/create");
    router.refresh(); // re-fetch server components (Header) so they see the new session
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-semibold mb-2">Log in</h1>

        <OAuthButtons />

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

        <label className="flex flex-col gap-1 text-sm">
          <div className="flex items-center justify-between">
            Password
            <a href="/forgot-password" className="text-xs text-zinc-500 underline">
              Forgot password?
            </a>
          </div>
          <PasswordInput
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-white text-black px-6 py-3 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        <p className="text-sm text-zinc-500 text-center">
          No account yet?{" "}
          <a href="/signup" className="underline">
            Sign up
          </a>
        </p>
      </form>
    </main>
  );
}
