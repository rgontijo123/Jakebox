import { pageMetadata } from "@/lib/seo";
import { getLocale, getT } from "@/lib/i18n/server";
import Link from "next/link";
import { PublicPricing } from "@/components/PublicPricing";

export async function generateMetadata() {
  return pageMetadata("pricing", "/pricing", await getLocale());
}

export default async function PricingPage() {
  const { t } = await getT();
  return (
    <>
      <div className="web-only flex flex-1 flex-col">
        <PublicPricing />
      </div>
      {/* inside the Android app: no prices (Google Play billing rules) */}
      <main className="app-only flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <p className="text-zinc-400">{t("app_page_unavailable")}</p>
        <Link href="/create" className="rounded-full bg-[#F5B900] text-black px-6 py-2.5 text-sm font-medium">
          {t("nav_create")}
        </Link>
      </main>
    </>
  );
}
