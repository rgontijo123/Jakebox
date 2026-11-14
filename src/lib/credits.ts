import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/** Base price for a generation up to BASE_DURATION_SECONDS, 1 credit = $0.01.
 * Providers actually bill per generation call regardless of output length
 * (MusicAPI: ~$0.29 for a pair of songs, flat, whether the output is 20s or
 * 4 minutes), so this duration scaling is a deliberate pricing/UX choice
 * (users expect a longer song to cost more), not a reflection of real
 * provider cost -- the markup just gets larger for longer songs. */
export const CREDITS_PER_GENERATION = 100;
export const BASE_DURATION_SECONDS = 60;
export const EXTRA_CREDITS_PER_STEP = 25;
export const EXTRA_DURATION_STEP_SECONDS = 30;
export const MAX_GENERATION_SECONDS = 300; // still caps what we ask providers for

/** 100 credits up to 60s, then +25 credits per 30s (or part thereof) beyond
 * that -- e.g. 90s=125, 120s=150, 300s=300. Used both to charge (per
 * version, since each version is an independent full generation at this
 * duration) and to show the live estimate in GenerationForm. */
export function creditsForDuration(durationSeconds: number): number {
  if (durationSeconds <= BASE_DURATION_SECONDS) return CREDITS_PER_GENERATION;
  const extraSteps = Math.ceil((durationSeconds - BASE_DURATION_SECONDS) / EXTRA_DURATION_STEP_SECONDS);
  return CREDITS_PER_GENERATION + extraSteps * EXTRA_CREDITS_PER_STEP;
}

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

/** Pays for one generation: from the trial/plan songQuota when the user has
 * any left, otherwise from creditBalance. Records which one on the
 * Generation row so refundForGeneration can give back the same thing.
 * Throws "INSUFFICIENT_CREDITS" if neither covers it -- caller should catch
 * and surface that to the user. owner/admin never go through this (see the
 * generations route). */
export async function chargeForGeneration(userId: string, generationId: string, credits: number) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.songQuota >= 1) {
      await tx.user.update({ where: { id: userId }, data: { songQuota: { decrement: 1 } } });
      await tx.generation.update({ where: { id: generationId }, data: { songQuotaUsed: 1, creditsCharged: 0 } });
      return;
    }
    if (user.creditBalance < credits) {
      throw new Error("INSUFFICIENT_CREDITS");
    }
    await applyLedgerEntry(tx, {
      userId,
      type: "generation_charge",
      amount: -credits,
      relatedGenerationId: generationId,
    });
    await tx.generation.update({ where: { id: generationId }, data: { creditsCharged: credits } });
  });
}

/** Gives back whatever chargeForGeneration took for this generation (a
 * quota song or credits), at most once. */
export async function refundForGeneration(userId: string, generationId: string) {
  return db.$transaction(async (tx) => {
    const generation = await tx.generation.findUniqueOrThrow({ where: { id: generationId } });
    if (generation.songQuotaUsed > 0) {
      await tx.user.update({ where: { id: userId }, data: { songQuota: { increment: generation.songQuotaUsed } } });
      await tx.generation.update({ where: { id: generationId }, data: { songQuotaUsed: 0 } });
    }
    const credits = generation.creditsCharged - generation.creditsRefunded;
    if (credits > 0) {
      await applyLedgerEntry(tx, {
        userId,
        type: "generation_refund",
        amount: credits,
        relatedGenerationId: generationId,
      });
      await tx.generation.update({ where: { id: generationId }, data: { creditsRefunded: generation.creditsCharged } });
    }
  });
}
