import crypto from "node:crypto";

export function hashApiToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** New token: raw (show once), hash (store), prefix (display). */
export function generateApiToken() {
  const raw = "cwk_" + crypto.randomBytes(32).toString("base64url");
  return { raw, hash: hashApiToken(raw), prefix: raw.slice(0, 12) };
}
