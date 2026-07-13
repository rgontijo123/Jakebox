import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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
    db.user.findUnique({ where: { id: session.user.id }, select: { creditBalance: true } }),
    db.creditTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 gap-8">
      <div className="w-full max-w-2xl flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <span className="text-sm text-zinc-400">
          <span className="text-zinc-100 font-medium">{user?.creditBalance ?? 0}</span> credits
        </span>
      </div>

      <div className="w-full max-w-2xl rounded-md border border-zinc-800 p-6 text-center text-sm text-zinc-500">
        Credit purchases aren&apos;t open yet — this is still an early build. Come back soon.
      </div>

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
