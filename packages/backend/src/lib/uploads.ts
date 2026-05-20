import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const uploadsDir = process.env.UPLOADS_DIR ?? path.resolve(__dirname, "../../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

export function resolveUploadPath(filename: string): string {
  const resolved = path.resolve(uploadsDir, filename);
  if (!isSafeUploadPath(resolved)) {
    throw new Error("Invalid upload path");
  }
  return resolved;
}

export function isSafeUploadPath(filePath: string): boolean {
  const resolvedUploadsDir = path.resolve(uploadsDir);
  const resolvedFilePath = path.resolve(filePath);
  return resolvedFilePath === resolvedUploadsDir || resolvedFilePath.startsWith(`${resolvedUploadsDir}${path.sep}`);
}
