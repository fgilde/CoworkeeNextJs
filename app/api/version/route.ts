import { APP_VERSION, GIT_SHA } from "@/lib/version";

export function GET() {
  return Response.json({ version: APP_VERSION, gitSha: GIT_SHA });
}
