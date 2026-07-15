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
    authorized({ auth, request }) {
      // Root path is the public marketing page — no page exists yet (404), but it
      // must never redirect to /login. Every other matched route stays protected.
      if (request.nextUrl.pathname === "/") return true;
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
