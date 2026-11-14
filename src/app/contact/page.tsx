export const metadata = {
  title: "Contact Us — Jakebox",
};

import { getT } from "@/lib/i18n/server";

export default async function ContactPage() {
  const { t } = await getT();
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2">{t("contact_title")}</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {t("contact_body")}
          </p>
        </div>

        <a
          href="mailto:contact@jakeboxmusic.com"
          className="self-start rounded-full bg-[#F5B900] text-black px-6 py-2.5 text-sm font-medium hover:bg-[#ffcc33] transition-colors"
        >
          contact@jakeboxmusic.com
        </a>
      </div>
    </main>
  );
}
