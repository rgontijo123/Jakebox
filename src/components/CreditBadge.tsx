import { db } from "@/lib/db";

export async function CreditBadge({ userId }: { userId: string }) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { creditBalance: true } });
  return (
    <span className="text-sm text-zinc-400">
      <span className="text-zinc-100 font-medium">{user?.creditBalance ?? 0}</span> credits
    </span>
  );
}
