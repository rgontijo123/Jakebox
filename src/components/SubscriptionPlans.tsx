"use client";

import { track } from "@/lib/analytics";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SUBSCRIPTION_PLANS, currencyForLocale, formatMoney, priceCents, type Currency } from "@/lib/pricing";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useCardSelection } from "@/components/useCardSelection";

export type CurrentPlan = {
  planId: string | null;
  planStatus: string | null;
  periodEnd: string | null; // ISO date
  cancelAtPeriodEnd: boolean;
  songQuota: number;
  /** currency the active subscription is actually billed in */
  currency: Currency | null;
};

const POPULAR_PLAN_ID = "criador";

/** Monthly plan cards. `current` undefined = public pricing page (CTA goes to
 * signup); otherwise the signed-in billing page (subscribe / cancel). */
export function SubscriptionPlans({ current }: { current?: CurrentPlan }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const cards = useCardSelection(POPULAR_PLAN_ID);
  const currency = currencyForLocale(locale);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const hasPlan = !!current?.planId && current.planStatus !== "canceled";
  const activePlan = hasPlan ? SUBSCRIPTION_PLANS.find((p) => p.id === current?.planId) : undefined;
  const periodEnd = current?.periodEnd
    ? new Date(current.periodEnd).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US")
    : "";

  async function post(url: string, body: object, loadingKey: string) {
    setError(null);
    setNotice(null);
    setLoadingId(loadingKey);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? t("pack_checkout_error"));
        return null;
      }
      return data;
    } catch {
      setError(t("pack_checkout_unexpected"));
      return null;
    } finally {
      setLoadingId(null);
    }
  }

  async function subscribe(planId: string) {
    track("begin_checkout", { item_id: planId, kind: "plan", currency: currency.toUpperCase() });
    const data = await post("/api/stripe/subscribe", { planId }, planId);
    if (data?.url) window.location.assign(data.url);
  }

  async function setCancel(resume: boolean) {
    const data = await post("/api/stripe/cancel-subscription", { resume }, "cancel");
    if (!data) return;
    if (!resume) setNotice(t("plan_cancel_done"));
    router.refresh();
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{t("plan_section_title")}</h2>
        <p className="text-sm text-zinc-500">{t("plan_section_subtitle")}</p>
      </div>

      {activePlan && current && (
        <div className="rounded-2xl border border-[#F5B900] p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{t("plan_current")}</p>
            <p className="text-lg font-semibold">
              {activePlan.name} · {formatMoney(priceCents(activePlan, current.currency ?? currency), current.currency ?? currency)}
              {t("plan_per_month")}
            </p>
            <p className="text-sm text-zinc-400">
              {current.planStatus === "past_due" || current.planStatus === "unpaid"
                ? t("plan_status_past_due")
                : `${current.cancelAtPeriodEnd ? t("plan_status_canceling") : t("plan_status_active")} ${periodEnd}`}
            </p>
            <p className="text-sm text-zinc-100 mt-1">
              <span className="font-medium">{current.songQuota}</span> {t("plan_songs_left")}
            </p>
          </div>
          <button
            onClick={() => setCancel(current.cancelAtPeriodEnd)}
            disabled={loadingId !== null}
            className="rounded-full bg-zinc-800 text-zinc-100 px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {current.cancelAtPeriodEnd ? t("plan_resume") : t("plan_cancel")}
          </button>
        </div>
      )}

      {!hasPlan && (
        <div className="grid sm:grid-cols-3 gap-4">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isPopular = plan.id === POPULAR_PLAN_ID;
            const active = cards.isActive(plan.id);
            const buttonClass = `mt-auto text-center rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              active ? "bg-[#F5B900] text-black hover:bg-[#ffcc33]" : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            }`;

            return (
              <div
                key={plan.id}
                {...cards.cardProps(plan.id)}
                className={`relative rounded-2xl border p-5 flex flex-col gap-4 transition-colors ${
                  active
                    ? "cursor-pointer border-[#F5B900] bg-gradient-to-b from-[#F5B900]/10 to-transparent"
                    : "cursor-pointer border-zinc-800 hover:border-zinc-600"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-5 rounded-full bg-[#F5B900] text-black text-xs font-semibold px-3 py-1">
                    {t("pack_most_popular_badge")}
                  </span>
                )}

                <p className="text-lg font-semibold">{plan.name}</p>

                <div>
                  <span className="text-3xl font-semibold">{formatMoney(priceCents(plan, currency), currency)}</span>
                  <span className="text-sm text-zinc-500">{t("plan_per_month")}</span>
                </div>

                <div className="rounded-lg bg-zinc-900/60 px-3 py-2">
                  <p className="text-sm text-zinc-100">
                    <span className="font-medium">{plan.songsPerMonth}</span> {t("plan_songs_per_month")}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatMoney(Math.round(priceCents(plan, currency) / plan.songsPerMonth), currency)}/{locale === "pt" ? "música" : "song"}
                  </p>
                </div>

                <ul className="flex flex-col gap-1.5 text-xs text-zinc-400">
                  {(["plan_feature_1", "plan_feature_2", "plan_feature_3"] as const).map((key) => (
                    <li key={key} className="flex items-start gap-1.5">
                      <span className="text-[#F5B900] shrink-0">✓</span>
                      {t(key)}
                    </li>
                  ))}
                </ul>

                {current ? (
                  <button onClick={() => subscribe(plan.id)} disabled={loadingId !== null} className={buttonClass}>
                    {loadingId === plan.id ? t("pack_redirecting") : t("plan_subscribe")}
                  </button>
                ) : (
                  <a href="/signup" className={buttonClass}>
                    {t("plan_signup_cta")}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {notice && <p className="text-sm text-green-400">{notice}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
