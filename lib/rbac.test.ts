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

test("EMPLOYEE can track time but not view team time", () => {
  expect(can("EMPLOYEE", "time:track")).toBe(true);
  expect(can("EMPLOYEE", "time:view-team")).toBe(false);
});

test("MANAGER, HR, ADMIN can view team time", () => {
  expect(can("MANAGER", "time:view-team")).toBe(true);
  expect(can("HR", "time:view-team")).toBe(true);
  expect(can("ADMIN", "time:view-team")).toBe(true);
});

test("EMPLOYEE and MANAGER can read own documents but not manage", () => {
  expect(can("EMPLOYEE", "document:read-own")).toBe(true);
  expect(can("EMPLOYEE", "document:manage")).toBe(false);
  expect(can("MANAGER", "document:read-own")).toBe(true);
  expect(can("MANAGER", "document:manage")).toBe(false);
});

test("HR and ADMIN can manage documents", () => {
  expect(can("HR", "document:manage")).toBe(true);
  expect(can("HR", "document:read-own")).toBe(true);
  expect(can("ADMIN", "document:manage")).toBe(true);
  expect(can("ADMIN", "document:read-own")).toBe(true);
});

test("HR and ADMIN can manage announcements, MANAGER and EMPLOYEE cannot", () => {
  expect(can("HR", "announcement:manage")).toBe(true);
  expect(can("ADMIN", "announcement:manage")).toBe(true);
  expect(can("MANAGER", "announcement:manage")).toBe(false);
  expect(can("EMPLOYEE", "announcement:manage")).toBe(false);
});

test("HR and ADMIN can manage onboarding, MANAGER and EMPLOYEE cannot", () => {
  expect(can("HR", "onboarding:manage")).toBe(true);
  expect(can("ADMIN", "onboarding:manage")).toBe(true);
  expect(can("MANAGER", "onboarding:manage")).toBe(false);
  expect(can("EMPLOYEE", "onboarding:manage")).toBe(false);
});

test("MANAGER, HR, ADMIN can manage goals and reviews, EMPLOYEE cannot", () => {
  expect(can("MANAGER", "goal:manage")).toBe(true);
  expect(can("HR", "goal:manage")).toBe(true);
  expect(can("ADMIN", "goal:manage")).toBe(true);
  expect(can("EMPLOYEE", "goal:manage")).toBe(false);

  expect(can("MANAGER", "review:manage")).toBe(true);
  expect(can("HR", "review:manage")).toBe(true);
  expect(can("ADMIN", "review:manage")).toBe(true);
  expect(can("EMPLOYEE", "review:manage")).toBe(false);
});

test("HR and ADMIN can view analytics, MANAGER and EMPLOYEE cannot", () => {
  expect(can("HR", "analytics:view")).toBe(true);
  expect(can("ADMIN", "analytics:view")).toBe(true);
  expect(can("MANAGER", "analytics:view")).toBe(false);
  expect(can("EMPLOYEE", "analytics:view")).toBe(false);
});
