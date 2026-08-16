import { expect, test } from "vitest";
import { adjustAccentForDark } from "./theming";

const perceivedLightness = (hex: string) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
};

test("dark-mode lightens a too-dark accent into a readable band", () => {
  // A very dark accent must not stay dark-on-dark: its lightness is raised.
  const dark = adjustAccentForDark("#1e293b");
  expect(dark).not.toBe("#1e293b");
  expect(perceivedLightness(dark)).toBeGreaterThanOrEqual(0.55);
});

test("dark-mode leaves an already-light accent untouched", () => {
  expect(adjustAccentForDark("#6366f1")).toBe("#6366f1");
  expect(adjustAccentForDark("#ffffff")).toBe("#ffffff");
});
