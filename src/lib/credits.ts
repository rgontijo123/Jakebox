import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/** Flat price per generation, 1 credit = $0.01. Providers now bill per
 * generation call regardless of output length (MusicAPI: ~$0.29 for a pair
 * of songs, flat, whether the output is 20s or 4 minutes) rather than per
 * second -- charging users by requested duration stopped matching real cost
 * once MusicAPI became the primary provider. 100 credits (~3-4x markup over
 * that per-generation cost) replaces the old duration-based math; a
 * generation either succeeds and keeps the charge, or fails and gets fully
 * refunded (see runGenerationJob's catch path) -- there's no partial refund
 * to compute anymore since price no longer depends on output length. */
export const CREDITS_PER_GENERATION = 100;
export const MAX_GENERATION_SECONDS = 300; // still caps what we ask providers for

type Tx = Prisma.TransactionClient;

async function applyLedgerEntry(
  tx: Tx,
  params: {
    userId: string;
    type: "purchase" | "signup_bonus" | "generation_charge" | "generation_refund" | "admin_adjustment";
    amount: number; // signed
    relatedPaymentId?: string;
    relatedGenerationId?: string;
  },
) {
  const user = await tx.user.update({
    where: { id: params.userId },
    data: { creditBalance: { increment: params.amount } },
  });

  await tx.creditTransaction.create({
    data: {
      userId: params.userId,
      type: params.type,
      amount: params.amount,
      balanceAfter: user.creditBalance,
      relatedPaymentId: params.relatedPaymentId,
      relatedGenerationId: params.relatedGenerationId,
    },
  });

  return user.creditBalance;
}

export async function grantSignupBonus(userId: string, credits: number) {
  return db.$transaction((tx) =>
    applyLedgerEntry(tx, { userId, type: "signup_bonus", amount: credits }),
  );
}

export async function grantPurchase(userId: string, credits: number, paymentId: string) {
  return db.$transaction((tx) =>
    applyLedgerEntry(tx, { userId, type: "purchase", amount: credits, relatedPaymentId: paymentId }),
  );
}

/** Manual top-up outside the normal purchase flow -- used for owner/admin
 * accounts testing the product, where charging themselves through Stripe
 * makes no sense but provider usage still costs real money and stays
 * worth tracking in the ledger. */
export async function grantAdminAdjustment(userId: string, credits: number) {
  return db.$transaction((tx) => applyLedgerEntry(tx, { userId, type: "admin_adjustment", amount: credits }));
}

/** Throws if the user can't cover the charge -- caller should catch and
 * surface "insufficient credits" to the user. owner/admin accounts skip the
 * balance check (their usage still costs real provider money and stays
 * tracked in the ledger below, but it should never block them mid-test). */
export async function chargeForGeneration(userId: string, generationId: string, credits: number) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const isUnlimited = user.role === "owner" || user.role === "admin";
    if (!isUnlimited && user.creditBalance < credits) {
      throw new Error("INSUFFICIENT_CREDITS");
    }
    return applyLedgerEntry(tx, {
      userId,
      type: "generation_charge",
      amount: -credits,
      relatedGenerationId: generationId,
    });
  });
}

export async function refundForGeneration(userId: string, generationId: string, credits: number) {
  if (credits <= 0) return;
  return db.$transaction((tx) =>
    applyLedgerEntry(tx, {
      userId,
      type: "generation_refund",
      amount: credits,
      relatedGenerationId: generationId,
    }),
  );
}
