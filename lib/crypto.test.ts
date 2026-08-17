import { expect, test, beforeAll } from "vitest";
import { encryptSecret, decryptSecret } from "./crypto";

beforeAll(() => {
  process.env.AUTH_SECRET ??= "test-secret";
});

test("encrypt/decrypt roundtrip", () => {
  const secret = "s3cr3t-smtp-password";
  const enc = encryptSecret(secret);
  expect(enc).not.toContain(secret); // ciphertext, not plaintext
  expect(enc.split(".")).toHaveLength(3); // iv.tag.data
  expect(decryptSecret(enc)).toBe(secret);
});

test("tampered ciphertext fails auth tag", () => {
  const enc = encryptSecret("x");
  const [iv, tag, data] = enc.split(".");
  const bad = `${iv}.${tag}.${Buffer.from("tampered").toString("base64")}`;
  expect(() => decryptSecret(bad)).toThrow();
});
