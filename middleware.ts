import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Uses the edge-safe config only (no Prisma/bcrypt), since middleware
// runs on the Edge runtime.
const { auth } = NextAuth(authConfig);
export { auth as middleware };

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};
