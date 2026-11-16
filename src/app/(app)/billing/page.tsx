import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CreditPacks } from "@/components/CreditPacks";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { TrackOnLoad } from "@/components/TrackOnLoad";
import { getT } from "@/lib/i18n/server";
import type { DictionaryKey } from "@/lib/i18n/translations";

const TYPE_LABELS: Record<string, DictionaryKey> = {
  purchase: "billing_tx_purchase",
  signup_bonus: "billing_tx_signup_bonus",
  generation_charge: "billing_tx_generation",
  generation_refund: "billing_tx_refund",
  admin_adjustment: "billing_tx_adjustment",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; purchase?: string }>;
}) {
  const { plan: planResult, purchase: purchaseResult } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { t, locale } = await getT();

  const [user, transactions, lastPlanPayment] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        creditBalance: true,
        role: true,
        songQuota: true,
        planId: true,
        planStatus: true,
        planCurrentPeriodEnd: true,
        planCancelAtPeriodEnd: true,
      },
    }),
    db.creditTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.payment.findFirst({
      where: { userId: session.user.id, stripeInvoiceId: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { currency: true },
    }),
  ]);

  // owner/admin generations still debit creditBalance for cost-tracking
  // (see chargeForGeneration) without ever being blocked by it, so the raw
  // number can go negative -- shown as "Unlimited" instead, same as
  // CreditBadge. A non-staff balance can't actually go negative (charges are
  // blocked once insufficient), but clamp defensively anyway.
  const isUnlimited = user?.role === "owner" || user?.role === "admin";
  const displayBalance = isUnlimited ? t("billing_unlimited") : Math.max(0, user?.creditBalance ?? 0);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 gap-8">
      {planResult === "success" && <TrackOnLoad event="purchase" params={{ kind: "plan" }} />}
      {purchaseResult === "success" && <TrackOnLoad event="purchase" params={{ kind: "credit_pack" }} />}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("billing_title")}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {t("billing_price_explainer")}
          </p>
          {!isUnlimited && (user?.songQuota ?? 0) > 0 && !user?.planId && (
            <p className="text-sm text-green-400 mt-1">
              {t("billing_free_songs", { n: user?.songQuota ?? 0 })}
            </p>
          )}
        </div>
        <span className="text-sm text-zinc-400 text-right shrink-0 pl-4">
          <span className="block text-2xl text-zinc-100 font-semibold">{displayBalance}</span>
          {!isUnlimited && t("billing_credits_left")}
        </span>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-10">
        <SubscriptionPlans
          current={{
            planId: user?.planId ?? null,
            planStatus: user?.planStatus ?? null,
            periodEnd: user?.planCurrentPeriodEnd?.toISOString() ?? null,
            cancelAtPeriodEnd: user?.planCancelAtPeriodEnd ?? false,
            songQuota: user?.songQuota ?? 0,
            currency: lastPlanPayment?.currency === "brl" ? "brl" : lastPlanPayment ? "usd" : null,
          }}
        />
        <CreditPacks showHeading />
      </div>

      <div className="w-full max-w-2xl">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">{t("billing_history")}</h2>
        <div className="flex flex-col divide-y divide-zinc-800 border border-zinc-800 rounded-md">
          {transactions.length === 0 && (
            <p className="p-4 text-sm text-zinc-500">{t("billing_no_activity")}</p>
          )}
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p>{TYPE_LABELS[tx.type] ? t(TYPE_LABELS[tx.type]) : tx.type}</p>
                <p className="text-xs text-zinc-500">{tx.createdAt.toLocaleString(locale === "pt" ? "pt-BR" : "en-US")}</p>
              </div>
              <span className={tx.amount >= 0 ? "text-green-400" : "text-zinc-400"}>
                {tx.amount >= 0 ? "+" : ""}
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
