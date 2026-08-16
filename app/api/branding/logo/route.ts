import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { safeBrandingPath } from "@/lib/documents";

// Public: the logo is shown on login/marketing before auth. 404 when none set.
const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET() {
  const cs = await db.companySettings.findUnique({
    where: { id: "singleton" },
    select: { logoPath: true },
  });
  if (!cs?.logoPath) return new Response("Not found", { status: 404 });

  let bytes: Buffer;
  try {
    bytes = await readFile(safeBrandingPath(cs.logoPath));
  } catch (err: any) {
    if (err?.code === "ENOENT") return new Response("Not found", { status: 404 });
    throw err;
  }

  const ext = path.extname(cs.logoPath).toLowerCase();
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "no-cache",
    },
  });
}
