/** Prices follow the site language: Portuguese pays in reais, everything
 * else (the default) in US dollars -- never mixed on the same page. */
export type Currency = "usd" | "brl";

export function currencyForLocale(locale: string): Currency {
  return locale === "pt" ? "brl" : "usd";
}

export function priceCents(item: { usdCents: number; brlCents: number }, currency: Currency): number {
  return currency === "brl" ? item.brlCents : item.usdCents;
}

export function formatMoney(cents: number, currency: Currency): string {
  return currency === "brl"
    ? (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export type CreditPack = {
  id: "starter" | "standard" | "pro";
  name: string;
  usdCents: number;
  brlCents: number;
  credits: number;
};

// 1 credit = 1 second of audio = $0.01 retail, ~4x markup over ElevenLabs'
// $0.15/min cost. See docs/Jakebox_Architecture_v1.docx for the full model.
export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter", usdCents: 500, brlCents: 2790, credits: 500 },
  { id: "standard", name: "Standard", usdCents: 1500, brlCents: 7990, credits: 1600 },
  { id: "pro", name: "Pro", usdCents: 4000, brlCents: 21990, credits: 4500 },
];

export function getPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

/** Songs every new account gets to try Jakebox before paying. */
export const FREE_TRIAL_SONGS = 2;

export type SubscriptionPlan = {
  id: "basico" | "criador" | "pro";
  name: string; // Portuguese
  nameEn: string;
  usdCents: number;
  brlCents: number;
  songsPerMonth: number;
};

export function planName(plan: SubscriptionPlan, locale: string): string {
  return locale === "pt" ? plan.name : plan.nameEn;
}

// Priced so that even a subscriber who uses every song still covers the
// provider cost (~US$0.30 per generation incl. cover art) plus Stripe fees.
// Unused songs don't roll over -- each paid invoice resets the quota.
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "basico", name: "Básico", nameEn: "Basic", usdCents: 799, brlCents: 3990, songsPerMonth: 15 },
  { id: "criador", name: "Criador", nameEn: "Creator", usdCents: 1399, brlCents: 6990, songsPerMonth: 30 },
  { id: "pro", name: "Pro", nameEn: "Pro", usdCents: 2499, brlCents: 12990, songsPerMonth: 60 },
];

export function getPlan(id: string | null | undefined): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id);
}
