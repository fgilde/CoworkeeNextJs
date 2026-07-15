import { expect, test } from "vitest";
import { entryHours, sumHours, startOfWeek } from "./time";

const t = (h: number, m = 0) => new Date(Date.UTC(2026, 6, 13, h, m));

test("09:00->17:00 with 60 min break = 7.0", () => {
  expect(entryHours(t(9), t(17), 60)).toBe(7);
});

test("09:00->17:30 with 0 break = 8.5", () => {
  expect(entryHours(t(9), t(17, 30), 0)).toBe(8.5);
});

test("end before start clamps to 0", () => {
  expect(entryHours(t(17), t(9), 0)).toBe(0);
});

test("sumHours over two closed entries adds up", () => {
  const entries = [
    { start: t(9), end: t(17), breakMinutes: 60 },
    { start: t(9), end: t(17, 30), breakMinutes: 0 },
  ];
  expect(sumHours(entries)).toBe(15.5);
});

test("open entry (end null) contributes 0 to sumHours", () => {
  const entries = [
    { start: t(9), end: t(17), breakMinutes: 60 },
    { start: t(9), end: null, breakMinutes: 0 },
  ];
  expect(sumHours(entries)).toBe(7);
});

test("startOfWeek returns the Monday of the same week", () => {
  // 2026-07-15 is a Wednesday.
  const monday = startOfWeek(new Date(2026, 6, 15));
  expect(monday).toEqual(new Date(2026, 6, 13));
});

test("startOfWeek on a Sunday returns the preceding Monday", () => {
  const monday = startOfWeek(new Date(2026, 6, 19));
  expect(monday).toEqual(new Date(2026, 6, 13));
});

test("startOfWeek on a Monday returns the same date, midnight", () => {
  const monday = startOfWeek(new Date(2026, 6, 13, 15, 30));
  expect(monday).toEqual(new Date(2026, 6, 13));
});
