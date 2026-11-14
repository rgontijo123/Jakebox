export type CreditPack = {
  id: "starter" | "standard" | "pro";
  name: string;
  usdCents: number;
  credits: number;
};

// 1 credit = 1 second of audio = $0.01 retail, ~4x markup over ElevenLabs'
// $0.15/min cost. See docs/Jakebox_Architecture_v1.docx for the full model.
export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter", usdCents: 500, credits: 500 },
  { id: "standard", name: "Standard", usdCents: 1500, credits: 1600 },
  { id: "pro", name: "Pro", usdCents: 4000, credits: 4500 },
];

export function getPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

/** Songs every new account gets to try Jakebox before paying. */
export const FREE_TRIAL_SONGS = 2;

export type SubscriptionPlan = {
  id: "basico" | "criador" | "pro";
  name: string;
  brlCents: number;
  songsPerMonth: number;
};

// Priced so that even a subscriber who uses every song still covers the
// provider cost (~US$0.30 per generation incl. cover art) plus Stripe fees.
// Unused songs don't roll over -- each paid invoice resets the quota.
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: "basico", name: "Básico", brlCents: 3990, songsPerMonth: 15 },
  { id: "criador", name: "Criador", brlCents: 6990, songsPerMonth: 30 },
  { id: "pro", name: "Pro", brlCents: 12990, songsPerMonth: 60 },
];

export function getPlan(id: string | null | undefined): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id);
}
