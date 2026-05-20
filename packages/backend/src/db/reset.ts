import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR ?? path.resolve(__dirname, "../../data");
const dbPath = process.env.DB_PATH ?? path.join(dataDir, "site-builder.sqlite");

let removed = 0;
for (const f of [dbPath, `${dbPath}-shm`, `${dbPath}-wal`]) {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log(`Removed ${f}`);
    removed++;
  }
}

if (removed === 0) {
  console.log("No database files found; nothing to reset.");
} else {
  console.log("Database reset. Next `npm run dev:backend` will recreate and re-seed it.");
}
