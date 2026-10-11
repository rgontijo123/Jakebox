"use client";

import { useState, type InputHTMLAttributes } from "react";

/** A password <input> with a show/hide toggle (eye icon) -- shared across
 * login/signup/reset-password so people can check what they typed instead
 * of submitting a typo blind. */
export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${props.className ?? ""} w-full pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l18 18" strokeLinecap="round" />
            <path
              d="M10.58 10.58a2 2 0 0 0 2.83 2.83M6.1 6.1C3.6 7.8 1.9 10.2 1 12c1.6 3.3 5.1 7 11 7 1.9 0 3.6-.4 5.1-1.1M9.5 4.3C10.3 4.1 11.1 4 12 4c5.9 0 9.4 3.7 11 7-.5 1-1.2 2.1-2.1 3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
