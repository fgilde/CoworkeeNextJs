import { expect, test } from "vitest";
import { buildTree } from "./org-tree";

test("nests reports under manager", () => {
  const t = buildTree([
    { id: "1", managerId: null, firstName: "C", lastName: "EO" },
    { id: "2", managerId: "1", firstName: "D", lastName: "ev" },
    { id: "3", managerId: "1", firstName: "A", lastName: "da" },
  ]);
  expect(t.length).toBe(1);
  expect(t[0].id).toBe("1");
  expect(t[0].children.map((c) => c.id)).toEqual(["3", "2"]); // sorted by lastName: "da" < "ev"
});

test("orphan (missing manager) becomes root, nothing dropped", () => {
  const t = buildTree([{ id: "9", managerId: "nonexistent", firstName: "X", lastName: "Y" }]);
  expect(t.length).toBe(1);
  expect(t[0].id).toBe("9");
});

test("multiple roots", () => {
  const t = buildTree([
    { id: "1", managerId: null, firstName: "A", lastName: "A" },
    { id: "2", managerId: null, firstName: "B", lastName: "B" },
  ]);
  expect(t.length).toBe(2);
});
