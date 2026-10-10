"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

// Auth.js serves /api/auth/providers automatically, listing only the
// providers actually registered in src/auth.ts -- Google/Facebook only
// show up there once their client id/secret env vars are set, so the
// buttons stay hidden instead of rendering broken until that's done.
export default function OAuthButtons() {
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((data) => setProviders(Object.keys(data ?? {})))
      .catch(() => setProviders([]));
  }, []);

  const hasGoogle = providers.includes("google");
  const hasFacebook = providers.includes("facebook");
  if (!hasGoogle && !hasFacebook) return null;

  return (
    <div className="flex flex-col gap-2">
      {hasGoogle && (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/create" })}
          className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium hover:bg-zinc-900 transition-colors"
        >
          Continue with Google
        </button>
      )}
      {hasFacebook && (
        <button
          type="button"
          onClick={() => signIn("facebook", { callbackUrl: "/create" })}
          className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium hover:bg-zinc-900 transition-colors"
        >
          Continue with Facebook
        </button>
      )}
      <div className="flex items-center gap-3 text-xs text-zinc-600 my-1">
        <div className="h-px flex-1 bg-zinc-800" />
        or
        <div className="h-px flex-1 bg-zinc-800" />
      </div>
    </div>
  );
}
