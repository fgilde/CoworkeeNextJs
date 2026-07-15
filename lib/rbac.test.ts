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

test("EMPLOYEE can request leave but not approve/manage", () => {
  expect(can("EMPLOYEE", "leave:request")).toBe(true);
  expect(can("EMPLOYEE", "leave:approve")).toBe(false);
  expect(can("EMPLOYEE", "leave:manage")).toBe(false);
});

test("MANAGER can request+approve leave but not manage", () => {
  expect(can("MANAGER", "leave:request")).toBe(true);
  expect(can("MANAGER", "leave:approve")).toBe(true);
  expect(can("MANAGER", "leave:manage")).toBe(false);
});

test("HR can manage leave", () => {
  expect(can("HR", "leave:request")).toBe(true);
  expect(can("HR", "leave:approve")).toBe(true);
  expect(can("HR", "leave:manage")).toBe(true);
});

test("ADMIN can manage leave", () => {
  expect(can("ADMIN", "leave:manage")).toBe(true);
});
