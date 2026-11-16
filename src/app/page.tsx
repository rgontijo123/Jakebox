import Image from "next/image";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { SUBSCRIPTION_PLANS as PLANS, priceCents, currencyForLocale } from "@/lib/pricing";

export async function generateMetadata() {
  return pageMetadata("home", "/", await getLocale());
}

const STEPS = [
  { n: 1, title: "home_step1_title", body: "home_step1_body" },
  { n: 2, title: "home_step2_title", body: "home_step2_body" },
  { n: 3, title: "home_step3_title", body: "home_step3_body" },
] as const;

const FAQ = [
  ["home_faq1_q", "home_faq1_a"],
  ["home_faq2_q", "home_faq2_a"],
  ["home_faq3_q", "home_faq3_a"],
  ["home_faq4_q", "home_faq4_a"],
  ["home_faq5_q", "home_faq5_a"],
] as const;

export default async function Home() {
  const { t, locale } = await getT();
  const currency = currencyForLocale(locale);
  const lowest = Math.min(...PLANS.map((p) => priceCents(p, currency)));

  // Structured data: lets search engines show the app, its price and the FAQ.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Jakebox",
      url: SITE_URL,
      inLanguage: locale === "pt" ? "pt-BR" : "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Jakebox",
      url: SITE_URL,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      description: t("home_subtitle"),
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: currency.toUpperCase(),
        lowPrice: (lowest / 100).toFixed(2),
        offerCount: PLANS.length,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map(([q, a]) => ({
        "@type": "Question",
        name: t(q),
        acceptedAnswer: { "@type": "Answer", text: t(a) },
      })),
    },
  ];

  return (
    <main className="flex flex-1 flex-col items-center px-5 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <section className="flex flex-col items-center text-center gap-5 sm:gap-6 py-16 sm:py-24 max-w-2xl">
        <Image src="/branding/jake-logo.svg" alt={t("home_logo_alt")} width={96} height={96} priority />
        <p className="text-sm font-semibold tracking-[0.2em] uppercase text-[#F5B900]">Jakebox</p>
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-tight text-balance">{t("home_h1")}</h1>
        <p className="max-w-md text-base sm:text-lg text-zinc-400">{t("home_subtitle")}</p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <a
            href="/signup"
            className="rounded-full bg-white text-black px-6 py-3 text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            {t("home_get_started")}
          </a>
          <a
            href="/pricing"
            className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium hover:border-zinc-500 transition-colors"
          >
            {t("home_pricing")}
          </a>
        </div>
        <p className="text-xs text-emerald-400">{t("home_free_note")}</p>
        <a href="/radio" className="text-sm text-zinc-400 hover:text-zinc-100 underline underline-offset-4">
          📻 {t("radio_listen")} — {t("radio_title")}
        </a>
      </section>

      <section className="w-full max-w-5xl pb-16 sm:pb-20">
        <h2 className="text-xl sm:text-2xl font-semibold text-center mb-8">{t("home_how_title")}</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 sm:p-6 flex flex-col gap-2">
              <span className="w-8 h-8 rounded-full bg-[#F5B900] text-black text-sm font-semibold flex items-center justify-center">
                {s.n}
              </span>
              <h3 className="font-semibold text-zinc-100">{t(s.title)}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{t(s.body)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="w-full max-w-3xl pb-20 sm:pb-24">
        <h2 className="text-xl sm:text-2xl font-semibold text-center mb-8">{t("home_faq_title")}</h2>
        <div className="flex flex-col divide-y divide-zinc-800 rounded-2xl border border-zinc-800">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-medium text-zinc-100">
                {t(q)}
                <span className="text-zinc-500 transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{t(a)}</p>
            </details>
          ))}
        </div>
        <div className="flex justify-center mt-10">
          <a
            href="/signup"
            className="rounded-full bg-[#F5B900] text-black px-6 py-3 text-sm font-semibold hover:bg-[#ffd23f] transition-colors"
          >
            {t("home_get_started")}
          </a>
        </div>
      </section>
    </main>
  );
}
