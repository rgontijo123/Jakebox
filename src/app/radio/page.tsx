import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { RadioLive } from "@/components/RadioLive";

export async function generateMetadata() {
  return pageMetadata("radio", "/radio", await getLocale());
}

export default async function RadioPage() {
  const { t } = await getT();
  return (
    <main className="flex flex-1 flex-col items-center px-4 sm:px-6 py-10 sm:py-16">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{t("radio_title")}</h1>
          <p className="mt-2 text-zinc-400">{t("radio_subtitle")}</p>
        </div>
        <RadioLive />
        <Link
          href="/signup"
          className="self-center rounded-full border border-zinc-700 px-5 py-2.5 text-sm text-zinc-200 hover:border-zinc-500 text-center"
        >
          {t("radio_cta")} →
        </Link>
      </div>
    </main>
  );
}
