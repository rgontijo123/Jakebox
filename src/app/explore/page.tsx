import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { ExploreList } from "@/components/ExploreList";

export async function generateMetadata() {
  return pageMetadata("explore", "/explore", await getLocale());
}

export default async function ExplorePage() {
  const { t } = await getT();
  return (
    <main className="flex flex-1 flex-col items-center px-4 sm:px-6 py-10 sm:py-14">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t("explore_title")}</h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400 leading-relaxed">{t("explore_subtitle")}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/radio" className="rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-500">
              📻 {t("radio_title")}
            </Link>
            <Link href="/signup" className="rounded-full bg-[#F5B900] text-black px-4 py-2 text-sm font-semibold hover:bg-[#ffd23f]">
              {t("explore_share_cta")}
            </Link>
          </div>
        </div>
        <ExploreList />
      </div>
    </main>
  );
}
