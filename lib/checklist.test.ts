import { expect, test } from "vitest";
import { checklistProgress } from "./checklist";

test("empty task list", () => {
  expect(checklistProgress([])).toEqual({ done: 0, total: 0, percent: 0 });
});

test("1 of 4 done = 25%", () => {
  const tasks = [{ done: true }, { done: false }, { done: false }, { done: false }];
  expect(checklistProgress(tasks)).toEqual({ done: 1, total: 4, percent: 25 });
});

test("all done = 100%", () => {
  const tasks = [{ done: true }, { done: true }, { done: true }];
  expect(checklistProgress(tasks)).toEqual({ done: 3, total: 3, percent: 100 });
});
