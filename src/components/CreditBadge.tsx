import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";

export async function CreditBadge({ userId }: { userId: string }) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { creditBalance: true, role: true, songQuota: true } });
  const isUnlimited = user?.role === "owner" || user?.role === "admin";
  const { t } = await getT();

  // owner/admin generations still debit creditBalance for cost-tracking
  // (see chargeForGeneration) without ever being blocked by it, so the raw
  // number can go negative -- showing that as "unlimited" instead avoids it
  // reading as a quota problem for an account that has no quota at all.
  if (isUnlimited) {
    return <span className="text-sm text-zinc-400">{t("badge_unlimited")}</span>;
  }

  return (
    <span className="text-sm text-zinc-400">
      {(user?.songQuota ?? 0) > 0 && (
        <>
          <span className="text-zinc-100 font-medium">{user?.songQuota}</span> {t("badge_songs")} ·{" "}
        </>
      )}
      <span className="text-zinc-100 font-medium">{user?.creditBalance ?? 0}</span> {t("badge_credits")}
    </span>
  );
}
