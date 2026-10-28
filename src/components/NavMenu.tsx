"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type NavLink = { href: string; label: string };

function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  return (
    <button
      onClick={() => setLocale(locale === "en" ? "pt" : "en")}
      className="text-xs font-medium border border-zinc-700 rounded-full px-2.5 py-1 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
      aria-label="Switch language"
    >
      {locale === "en" ? "PT" : "EN"}
    </button>
  );
}

// Plain Unicode symbols (Character Map style) rather than an icon library --
// one glyph per link, purely decorative.
const NAV_ICONS: Record<string, string> = {
  "/create": "✎",
  "/video": "▶",
  "/studio": "✂",
  "/library": "▤",
  "/billing": "¤",
  "/admin": "⚙",
};
const LOGOUT_ICON = "⏻";

export function NavMenu({
  isAuthed,
  isStaff,
  userLabel,
  onLogout,
}: {
  isAuthed: boolean;
  isStaff: boolean;
  userLabel?: string;
  onLogout?: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  const links: NavLink[] = isAuthed
    ? [
        { href: "/create", label: t("nav_create") },
        { href: "/video", label: t("nav_video") },
        { href: "/studio", label: t("nav_studio") },
        { href: "/library", label: t("nav_library") },
        { href: "/billing", label: t("nav_billing") },
        ...(isStaff ? [{ href: "/admin", label: t("nav_admin") }] : []),
      ]
    : [];

  // Video/Studio depend on the local VideoSubtitles service the owner runs
  // on their own machine -- not something a regular customer account can
  // use, so keep those two out of the menu for anyone but staff.
  const visibleLinks = isStaff ? links : links.filter((l) => l.href !== "/video" && l.href !== "/studio");

  return (
    <>
      <nav className="hidden sm:flex items-center gap-5 text-sm text-zinc-400">
        {isAuthed ? (
          <>
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 ${pathname === link.href ? "text-zinc-100" : "hover:text-zinc-100"}`}
              >
                <span aria-hidden="true">{NAV_ICONS[link.href]}</span>
                {link.label}
              </Link>
            ))}
            {userLabel && (
              <span className="text-xs text-zinc-200 truncate max-w-[120px]" title={userLabel}>
                {userLabel}
              </span>
            )}
            <button onClick={onLogout} className="flex items-center gap-1.5 hover:text-zinc-100">
              <span aria-hidden="true">{LOGOUT_ICON}</span>
              {t("nav_logout")}
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-zinc-100">
              {t("nav_login")}
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-white text-black px-4 py-1.5 font-medium hover:bg-zinc-200"
            >
              {t("nav_signup")}
            </Link>
          </>
        )}
        <LanguageSwitch />
      </nav>

      <button
        onClick={() => setOpen((v) => !v)}
        className="sm:hidden text-zinc-400 hover:text-zinc-100 p-1"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <nav className="sm:hidden absolute top-full left-0 right-0 flex flex-col gap-1 bg-black border-b border-zinc-800 px-6 py-4 text-sm text-zinc-400">
          {isAuthed ? (
            <>
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-1.5 py-2 ${pathname === link.href ? "text-zinc-100" : "hover:text-zinc-100"}`}
                >
                  <span aria-hidden="true">{NAV_ICONS[link.href]}</span>
                  {link.label}
                </Link>
              ))}
              {userLabel && (
                <span className="py-2 text-xs text-zinc-200 truncate" title={userLabel}>
                  {userLabel}
                </span>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  onLogout?.();
                }}
                className="flex items-center gap-1.5 py-2 text-left hover:text-zinc-100"
              >
                <span aria-hidden="true">{LOGOUT_ICON}</span>
                {t("nav_logout")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="py-2 hover:text-zinc-100">
                {t("nav_login")}
              </Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="py-2 hover:text-zinc-100">
                {t("nav_signup")}
              </Link>
            </>
          )}
          <div className="py-2">
            <LanguageSwitch />
          </div>
        </nav>
      )}
    </>
  );
}
