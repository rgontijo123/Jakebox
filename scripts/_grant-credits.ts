import "dotenv/config";
import { db } from "../src/lib/db";
import { grantPurchase } from "../src/lib/credits";

async function main() {
  const email = process.argv[2];
  const credits = Number(process.argv[3]);
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  await grantPurchase(user.id, credits, `manual-test-${Date.now()}`);
  const updated = await db.user.findUniqueOrThrow({ where: { email }, select: { creditBalance: true } });
  console.log(`Granted ${credits} credits to ${email}, new balance: ${updated.creditBalance}`);
  process.exit(0);
}
main();
