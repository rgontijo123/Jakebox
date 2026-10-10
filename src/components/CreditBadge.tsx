import { db } from "@/lib/db";

export async function CreditBadge({ userId }: { userId: string }) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { creditBalance: true, role: true } });
  const isUnlimited = user?.role === "owner" || user?.role === "admin";

  // owner/admin generations still debit creditBalance for cost-tracking
  // (see chargeForGeneration) without ever being blocked by it, so the raw
  // number can go negative -- showing that as "unlimited" instead avoids it
  // reading as a quota problem for an account that has no quota at all.
  if (isUnlimited) {
    return <span className="text-sm text-zinc-400">Unlimited credits</span>;
  }

  return (
    <span className="text-sm text-zinc-400">
      <span className="text-zinc-100 font-medium">{user?.creditBalance ?? 0}</span> credits
    </span>
  );
}
