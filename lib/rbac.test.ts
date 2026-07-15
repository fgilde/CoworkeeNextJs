import { expect, test } from "vitest";
import { can } from "./rbac";

test("HR can write employees + settings, not users", () => {
  expect(can("HR", "employee:write")).toBe(true);
  expect(can("HR", "settings:write")).toBe(true);
  expect(can("HR", "users:manage")).toBe(false);
});

test("EMPLOYEE and MANAGER read-only", () => {
  expect(can("EMPLOYEE", "employee:write")).toBe(false);
  expect(can("MANAGER", "employee:write")).toBe(false);
  expect(can("MANAGER", "employee:read")).toBe(true);
});

test("ADMIN can everything incl users:manage", () => {
  expect(can("ADMIN", "users:manage")).toBe(true);
  expect(can("ADMIN", "settings:write")).toBe(true);
});
