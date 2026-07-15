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
