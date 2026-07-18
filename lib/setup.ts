import { db } from "@/lib/db";

// Fresh self-hosted install (no seed) has zero users: show the setup wizard instead of login.
export async function needsSetup(): Promise<boolean> {
  return (await db.user.count()) === 0;
}
