import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "./password";

test("hash roundtrip", async () => {
  const h = await hashPassword("coworkee");
  expect(await verifyPassword("coworkee", h)).toBe(true);
  expect(await verifyPassword("wrong", h)).toBe(false);
});
