import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { upsertOAuthUser } from "@/lib/oauthUser";

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Required outside Vercel (Render, Railway, etc. aren't auto-trusted) --
  // without this, Auth.js rejects the request's host header and every auth
  // route fails with a generic "Configuration" error page.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user || user.status === "banned" || !user.passwordHash) return null;

        // Owner/admin accounts are exempt from the failed-attempt lockout --
        // they're trusted operators, not the audience the lockout protects
        // against, and getting locked out themselves is just an outage.
        const exemptFromLockout = user.role === "owner" || user.role === "admin";

        if (!exemptFromLockout && user.lockedUntil && user.lockedUntil > new Date()) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          if (!exemptFromLockout) {
            const attempts = user.failedLoginAttempts + 1;
            await db.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: attempts,
                lockedUntil:
                  attempts >= MAX_FAILED_ATTEMPTS
                    ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
                    : undefined,
              },
            });
          }
          return null;
        }

        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await db.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? undefined,
          role: user.role,
        };
      },
    }),
    // Only registered once real credentials exist -- an empty clientId
    // would otherwise throw at startup before the user has created the
    // OAuth app in Google/Meta's developer console.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [Facebook({ clientId: process.env.FACEBOOK_CLIENT_ID, clientSecret: process.env.FACEBOOK_CLIENT_SECRET })]
      : []),
  ],
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (account && (account.provider === "google" || account.provider === "facebook")) {
        // No Account/Session tables -- OAuth identity isn't persisted, just
        // the resulting User row, found-or-created by email on every sign-in.
        const dbUser = await upsertOAuthUser(user.email ?? "", user.name);
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.name = dbUser.displayName ?? user.name ?? undefined;
        return token;
      }
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        // The Credentials provider doesn't get the same automatic
        // name/email-to-token copy OAuth providers get -- without this,
        // session.user.name stays undefined and the UI always falls back
        // to showing the email instead of the display name.
        token.name = user.name;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string | undefined;
        session.user.name = token.name as string | undefined;
      }
      return session;
    },
  },
});
