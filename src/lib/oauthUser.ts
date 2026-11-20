import { db } from "@/lib/db";
import { FREE_TRIAL_SONGS } from "@/lib/pricing";
import { sendWelcomeEmail } from "@/lib/email";
import { getLocale } from "@/lib/i18n/server";

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

  // getLocale reads request cookies, which may be unavailable in some auth
  // callback contexts -- fall back to English rather than skip the email.
  const locale = await getLocale().catch(() => "en" as const);
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
      songQuota: FREE_TRIAL_SONGS,
      locale,
    },
  });

  await sendWelcomeEmail(user.email, FREE_TRIAL_SONGS, locale).catch((err) =>
    console.error("welcome email failed", err),
  );
  return user;
}
