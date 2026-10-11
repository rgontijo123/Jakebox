import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CreditPacks } from "@/components/CreditPacks";

const TYPE_LABELS: Record<string, string> = {
  purchase: "Purchase",
  signup_bonus: "Signup bonus",
  generation_charge: "Generation",
  generation_refund: "Refund",
  admin_adjustment: "Adjustment",
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, transactions] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { creditBalance: true, role: true } }),
    db.creditTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  // owner/admin generations still debit creditBalance for cost-tracking
  // (see chargeForGeneration) without ever being blocked by it, so the raw
  // number can go negative -- shown as "Unlimited" instead, same as
  // CreditBadge. A non-staff balance can't actually go negative (charges are
  // blocked once insufficient), but clamp defensively anyway.
  const isUnlimited = user?.role === "owner" || user?.role === "admin";
  const displayBalance = isUnlimited ? "Unlimited" : Math.max(0, user?.creditBalance ?? 0);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 gap-8">
      <div className="w-full max-w-2xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-sm text-zinc-500 mt-1">
            100 credits = one full song generation, audio and video clip included.
          </p>
        </div>
        <span className="text-sm text-zinc-400 text-right shrink-0 pl-4">
          <span className="block text-2xl text-zinc-100 font-semibold">{displayBalance}</span>
          {!isUnlimited && "credits left"}
        </span>
      </div>

      <CreditPacks />

      <div className="w-full max-w-2xl">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">History</h2>
        <div className="flex flex-col divide-y divide-zinc-800 border border-zinc-800 rounded-md">
          {transactions.length === 0 && (
            <p className="p-4 text-sm text-zinc-500">No activity yet.</p>
          )}
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p>{TYPE_LABELS[tx.type] ?? tx.type}</p>
                <p className="text-xs text-zinc-500">{tx.createdAt.toLocaleString()}</p>
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
