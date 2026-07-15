import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Uses the edge-safe config only (no Prisma/bcrypt), since middleware
// runs on the Edge runtime.
const { auth } = NextAuth(authConfig);
export { auth as middleware };

export const config = {
  // "marketing" is excluded too: it's the public/marketing/ screenshot
  // folder used by the public landing page (app/page.tsx). Without this,
  // an anonymous request for those assets 307s to /login — and so does
  // next/image's own internal fetch of the source file, which turns every
  // screenshot into a 400 "not a valid image".
  matcher: ["/((?!api/auth|login|marketing|_next/static|_next/image|favicon.ico).*)"],
};
