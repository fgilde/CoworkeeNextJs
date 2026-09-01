import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import authConfig from "@/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// A valid bcrypt hash to compare against when no user is found, so an unknown
// email costs the same as a wrong password — no timing side-channel that leaks
// whether an email exists.
const DUMMY_HASH = "$2b$10$FKl3cXEZmU5amWZC9vOKmuVWFMqqRxPVgCqqyOZyLQGf8yMBeFiV.";

// Optional enterprise SSO via a generic OIDC provider (Keycloak, Entra ID,
// Okta, Authentik, Google Workspace, …). It is added ONLY when the three env
// vars are present — with none set, auth behaves exactly as before (Credentials
// only). Sign-in is restricted to emails that already have a Coworkee user: SSO
// authenticates existing accounts, it never auto-provisions new ones.
export const ssoEnabled = !!(
  process.env.SSO_ISSUER &&
  process.env.SSO_CLIENT_ID &&
  process.env.SSO_CLIENT_SECRET
);

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: {},
      password: {},
    },
    async authorize(credentials) {
      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;
      const user = await db.user.findUnique({ where: { email } });

      // Always run bcrypt so an unknown email and a wrong password take the
      // same time. Never reveal which field was wrong.
      const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !valid) return null;

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        locale: user.locale,
      };
    },
  }),
];

if (ssoEnabled) {
  providers.push({
    id: "sso",
    name: process.env.SSO_NAME || "SSO",
    type: "oidc",
    issuer: process.env.SSO_ISSUER!,
    clientId: process.env.SSO_CLIENT_ID!,
    clientSecret: process.env.SSO_CLIENT_SECRET!,
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    // Gate OIDC sign-ins to known users — no silent account creation.
    async signIn({ account, profile }) {
      if (account?.provider !== "sso") return true;
      const email = profile?.email;
      if (!email) return false;
      const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
      return !!existing;
    },
    async jwt({ token, user }) {
      if (user) {
        // Credentials returns our shape (carries role); the OIDC provider returns
        // a raw profile without it, so resolve the Coworkee user by email.
        if ("role" in user && user.role) {
          token.id = user.id as string;
          token.role = user.role;
          token.locale = user.locale;
        } else if (user.email) {
          const dbUser = await db.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true, locale: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.locale = dbUser.locale;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.locale = token.locale;
      }
      return session;
    },
  },
});
