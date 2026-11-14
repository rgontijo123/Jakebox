"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/** Filters the admin user list as you type (any part of the email or name),
 * by updating ?q= after a short pause instead of waiting for Enter. */
export function AdminSearch({ initial }: { initial: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (value.trim() === initial) return;
    const timer = setTimeout(() => {
      const q = value.trim();
      router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, initial, pathname, router]);

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={t("admin_search")}
      className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm w-64"
    />
  );
}
