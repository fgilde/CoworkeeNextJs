import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no Credentials provider, no Prisma/bcrypt imports.
// Middleware runs on the Edge runtime and cannot bundle Node-only
// dependencies (pg, bcryptjs) pulled in via lib/db.ts. The full config
// (auth.ts) extends this with the Credentials provider for Node routes.
export default {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
