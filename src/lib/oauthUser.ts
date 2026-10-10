import { db } from "@/lib/db";
import { grantSignupBonus } from "@/lib/credits";

const SIGNUP_BONUS = Number(process.env.SIGNUP_BONUS_CREDITS ?? 50);
const TOS_VERSION = "2026-07-13";

/** Find-or-create for Google/Facebook sign-in. No Account/Session tables --
 * provider identity isn't persisted, only the resulting User row, matched
 * by email (same identity as a Credentials account with that email, so a
 * user who signed up with a password can also sign in with Google/Facebook
 * using the same address and land on the same account). */
export async function upsertOAuthUser(email: string, name: string | null | undefined) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    if (!existing.displayName && name) {
      return db.user.update({ where: { id: existing.id }, data: { displayName: name } });
    }
    return existing;
  }

  const isOwner = !!process.env.OWNER_EMAIL && normalizedEmail === process.env.OWNER_EMAIL.trim().toLowerCase();

  const user = await db.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: null,
      displayName: name ?? undefined,
      role: isOwner ? "owner" : "user",
      // OAuth sign-in has no separate ToS checkbox step -- treat reaching
      // this point (provider consent screen already shown) as acceptance.
      tosAcceptedAt: new Date(),
      tosVersion: TOS_VERSION,
    },
  });

  await grantSignupBonus(user.id, SIGNUP_BONUS);
  return user;
}
