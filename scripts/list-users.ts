import "dotenv/config";
import { db } from "../src/lib/db";

async function main() {
  const users = await db.user.findMany({
    select: { id: true, email: true, role: true, creditBalance: true },
  });
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

main();
