import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { RadioLive } from "@/components/RadioLive";
import { ShareRadio } from "@/components/ShareRadio";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/staff";

export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getT();
  return {
    ...(await pageMetadata("radio", "/radio", locale)),
    manifest: "/radio-app.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: t("radio_title") },
  };
}

export default async function RadioPage() {
  const { t } = await getT();
  // The promo/share kit is a tool for the station owner, not for listeners.
  const session = await auth();
  const isStaff = isStaffRole((session?.user as { role?: string } | undefined)?.role);
  return (
    <main className="radio-app flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <h1 className="text-sm text-zinc-400 truncate">
          <span className="font-semibold text-zinc-200">{t("radio_title")}</span> · {t("radio_subtitle")}
        </h1>
        <RadioLive />
        {isStaff && <ShareRadio />}
        <Link
          href="/explore"
          className="self-center rounded-full border border-zinc-700 px-5 py-2.5 text-sm text-zinc-200 hover:border-zinc-500 text-center"
        >
          {t("radio_cta")} →
        </Link>
      </div>
    </main>
  );
}
