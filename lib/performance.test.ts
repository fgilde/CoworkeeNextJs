import { expect, test } from "vitest";
import { ratingLabel } from "./performance";

test("null rating is unrated", () => {
  expect(ratingLabel(null)).toBe("unrated");
});

test("1..5 map to stable keys", () => {
  expect(ratingLabel(1)).toBe("poor");
  expect(ratingLabel(2)).toBe("fair");
  expect(ratingLabel(3)).toBe("good");
  expect(ratingLabel(4)).toBe("veryGood");
  expect(ratingLabel(5)).toBe("excellent");
});

test("out-of-range clamps to nearest valid label", () => {
  expect(ratingLabel(0)).toBe("unrated");
  expect(ratingLabel(-3)).toBe("unrated");
  expect(ratingLabel(6)).toBe("excellent");
  expect(ratingLabel(100)).toBe("excellent");
});
