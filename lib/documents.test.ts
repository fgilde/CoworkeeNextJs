import { expect, test } from "vitest";
import { safeStoredPath, STORAGE_DIR } from "./documents";
import path from "path";

test("safeStoredPath accepts a normal cuid-like name", () => {
  const p = safeStoredPath("cln1a2b3c4d5e6f7g8h9.pdf");
  expect(p.startsWith(STORAGE_DIR + path.sep) || p === STORAGE_DIR).toBe(true);
});

test("safeStoredPath rejects a relative traversal", () => {
  expect(() => safeStoredPath("../etc/passwd")).toThrow();
});

test("safeStoredPath rejects an absolute path", () => {
  const abs = process.platform === "win32" ? "C:\\Windows\\system32\\config" : "/etc/passwd";
  expect(() => safeStoredPath(abs)).toThrow();
});

test("safeStoredPath rejects a name containing ..", () => {
  expect(() => safeStoredPath("foo/../../bar.pdf")).toThrow();
  expect(() => safeStoredPath("bar..pdf")).toThrow();
});
