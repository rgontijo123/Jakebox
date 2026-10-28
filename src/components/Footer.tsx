"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-zinc-800 py-8 px-6 flex items-center justify-center gap-3 text-sm text-zinc-500">
      <span>&copy; {new Date().getFullYear()} Jakebox</span>
      <span className="text-zinc-700">&middot;</span>
      <Link href="/terms" className="hover:text-zinc-300">
        {t("footer_terms")}
      </Link>
      <span className="text-zinc-700">&middot;</span>
      <Link href="/privacy" className="hover:text-zinc-300">
        {t("footer_privacy")}
      </Link>
      <span className="text-zinc-700">&middot;</span>
      <Link href="/contact" className="hover:text-zinc-300">
        {t("footer_contact")}
      </Link>
    </footer>
  );
}
