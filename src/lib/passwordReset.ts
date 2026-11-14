import crypto from "crypto";
import { db } from "@/lib/db";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Creates a single-use reset token and returns the link to put in the
 * email. Only the hash is stored, so a database leak can't be replayed. */
export async function createPasswordResetUrl(userId: string, origin: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  await db.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  return `${origin}/reset-password/${rawToken}`;
}
