import path from "path";
import { mkdir } from "fs/promises";
import { randomUUID } from "crypto";

// Private storage dir — deliberately NOT under public/, so files are never
// served by Next's static file handler; the only way out is the guarded
// download route, which enforces the access check below.
export const STORAGE_DIR = path.join(process.cwd(), "storage", "documents");

export async function ensureStorageDir(): Promise<void> {
  await mkdir(STORAGE_DIR, { recursive: true });
}

// Guards path traversal: resolves the candidate path and asserts it stays
// inside STORAGE_DIR. Also rejects any raw ".." segment up front, since a
// stored/display name should never legitimately contain one.
export function safeStoredPath(storedName: string): string {
  if (!storedName || storedName.includes("..") || path.isAbsolute(storedName)) {
    throw new Error("Invalid stored file name");
  }
  const resolved = path.resolve(STORAGE_DIR, storedName);
  if (resolved !== STORAGE_DIR && !resolved.startsWith(STORAGE_DIR + path.sep)) {
    throw new Error("Invalid stored file name");
  }
  return resolved;
}

// Human-readable file size (KB/MB), used wherever Document.sizeBytes is displayed.
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Whitelist of extension characters; anything else (or no match) => no extension.
const EXT_RE = /\.([a-zA-Z0-9]{1,8})$/;

// Never use the client-provided name for the on-disk name — only borrow its
// extension (sanitized) so the OS/browser can still infer a file type.
export function generateStoredName(originalName: string): string {
  const match = EXT_RE.exec(originalName ?? "");
  const ext = match ? `.${match[1].toLowerCase()}` : "";
  return `${randomUUID()}${ext}`;
}
