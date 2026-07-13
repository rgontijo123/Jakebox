import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/** 1 credit = 1 second of generated audio = $0.01 retail (~4x markup over
 * ElevenLabs' $0.15/min = $0.0025/sec cost). */
export const CREDITS_PER_SECOND = 1;
export const MIN_GENERATION_CREDITS = 30; // 30s floor, blocks trivial-retry abuse
export const MAX_GENERATION_SECONDS = 300; // ElevenLabs cap: 5 min/generation

export function secondsToCredits(seconds: number): number {
  return Math.max(MIN_GENERATION_CREDITS, Math.round(seconds * CREDITS_PER_SECOND));
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

/** Throws if the user can't cover the charge -- caller should catch and
 * surface "insufficient credits" to the user. */
export async function chargeForGeneration(userId: string, generationId: string, credits: number) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.creditBalance < credits) {
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
