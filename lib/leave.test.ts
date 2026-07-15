import { expect, test } from "vitest";
import { computeWorkingDays } from "./leave";

const d = (day: number) => new Date(Date.UTC(2026, 6, day)); // July 2026; 13th = Monday

test("Mon->Fri same week = 5", () => {
  expect(computeWorkingDays(d(13), d(17))).toBe(5);
});

test("Mon->Mon (one day) = 1", () => {
  expect(computeWorkingDays(d(13), d(13))).toBe(1);
});

test("Fri->Mon spans weekend = 2", () => {
  expect(computeWorkingDays(d(17), d(20))).toBe(2);
});

test("single day with halfDayStart = 0.5", () => {
  expect(computeWorkingDays(d(13), d(13), true, false)).toBe(0.5);
});

test("Mon->Tue with halfDayStart+halfDayEnd = 1.0", () => {
  expect(computeWorkingDays(d(13), d(14), true, true)).toBe(1);
});

test("Sat->Sun weekend-only = 0", () => {
  expect(computeWorkingDays(d(18), d(19))).toBe(0);
});
