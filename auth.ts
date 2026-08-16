import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
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
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.locale = user.locale;
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
