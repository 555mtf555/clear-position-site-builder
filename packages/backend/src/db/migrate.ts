import { db } from "./connection";

export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      slug            TEXT NOT NULL UNIQUE,
      brand_kit_json  TEXT NOT NULL,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sites (
      id                    TEXT PRIMARY KEY,
      company_id            TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      slug                  TEXT NOT NULL,
      name                  TEXT NOT NULL,
      is_core_site          INTEGER NOT NULL DEFAULT 0,
      linked_site_ids_json  TEXT NOT NULL DEFAULT '[]',
      brand_overrides_json  TEXT,
      created_at            TEXT NOT NULL,
      updated_at            TEXT NOT NULL,
      UNIQUE (company_id, slug)
    );

    CREATE TABLE IF NOT EXISTS pages (
      id          TEXT PRIMARY KEY,
      site_id     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
      slug        TEXT NOT NULL,
      title       TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
      doc_json    TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      UNIQUE (site_id, slug)
    );

    CREATE TABLE IF NOT EXISTS assets (
      id            TEXT PRIMARY KEY,
      company_id    TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      filename      TEXT NOT NULL,
      original_filename TEXT NOT NULL DEFAULT '',
      mime          TEXT NOT NULL,
      mime_type     TEXT NOT NULL DEFAULT '',
      size          INTEGER NOT NULL,
      size_bytes    INTEGER NOT NULL DEFAULT 0,
      storage_path  TEXT NOT NULL,
      width         INTEGER,
      height        INTEGER,
      alt_text      TEXT NOT NULL DEFAULT '',
      created_at    TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS sites_company_id ON sites(company_id);
    CREATE INDEX IF NOT EXISTS pages_site_id ON pages(site_id);
    CREATE INDEX IF NOT EXISTS assets_company_id ON assets(company_id);
  `);

  ensureColumn("assets", "original_filename", "TEXT NOT NULL DEFAULT ''");
  ensureColumn("assets", "mime_type", "TEXT NOT NULL DEFAULT ''");
  ensureColumn("assets", "size_bytes", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn("assets", "alt_text", "TEXT NOT NULL DEFAULT ''");

  db.exec(`
    UPDATE assets
    SET
      original_filename = CASE WHEN original_filename = '' THEN filename ELSE original_filename END,
      mime_type = CASE WHEN mime_type = '' THEN mime ELSE mime_type END,
      size_bytes = CASE WHEN size_bytes = 0 THEN size ELSE size_bytes END
  `);

  // Phase 7: additive site columns for multi-site management.
  ensureColumn("sites", "site_type", "TEXT NOT NULL DEFAULT 'custom'");
  ensureColumn("sites", "parent_site_id", "TEXT");
  ensureColumn("sites", "status", "TEXT NOT NULL DEFAULT 'draft'");

  // Backfill site_type for legacy rows where is_core_site is already set.
  db.exec(`
    UPDATE sites SET site_type = 'core'
    WHERE is_core_site = 1 AND site_type = 'custom'
  `);
}

function ensureColumn(table: string, column: string, definition: string): void {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (rows.some((row) => row.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
