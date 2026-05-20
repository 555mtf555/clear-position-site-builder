import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const exportsDir = process.env.EXPORTS_DIR ?? path.resolve(__dirname, "../../exports");
fs.mkdirSync(exportsDir, { recursive: true });

export function safeSegment(value: string): string {
  const segment = value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return segment || "export";
}

export function resolveExportPath(...segments: string[]): string {
  const resolvedExportsDir = path.resolve(exportsDir);
  const resolved = path.resolve(resolvedExportsDir, ...segments.map(safeSegment));
  if (resolved !== resolvedExportsDir && !resolved.startsWith(`${resolvedExportsDir}${path.sep}`)) {
    throw new Error("Invalid export path");
  }
  return resolved;
}
