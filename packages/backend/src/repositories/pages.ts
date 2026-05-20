import { db } from "../db/connection";
import type { Page, PageDoc, PageStatus } from "@clear-position/shared";

interface PageRow {
  id: string;
  site_id: string;
  slug: string;
  title: string;
  status: PageStatus;
  doc_json: string;
  created_at: string;
  updated_at: string;
}

function rowToPage(row: PageRow): Page {
  return {
    id: row.id,
    site_id: row.site_id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    doc: JSON.parse(row.doc_json) as PageDoc,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function listPagesBySite(siteId: string): Page[] {
  const rows = db
    .prepare("SELECT * FROM pages WHERE site_id = ? ORDER BY created_at")
    .all(siteId) as PageRow[];
  return rows.map(rowToPage);
}

export function getPage(id: string): Page | null {
  const row = db.prepare("SELECT * FROM pages WHERE id = ?").get(id) as PageRow | undefined;
  return row ? rowToPage(row) : null;
}

export interface CreatePageInput {
  id: string;
  site_id: string;
  slug: string;
  title: string;
  status?: PageStatus;
  doc: PageDoc;
}

export function createPage(input: CreatePageInput): Page {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO pages (id, site_id, slug, title, status, doc_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.id,
    input.site_id,
    input.slug,
    input.title,
    input.status ?? "draft",
    JSON.stringify(input.doc),
    now,
    now,
  );
  const page = getPage(input.id);
  if (!page) throw new Error("Failed to read back created page");
  return page;
}

export interface UpdatePageInput {
  title?: string;
  status?: PageStatus;
  doc?: PageDoc;
}

export function updatePage(id: string, input: UpdatePageInput): Page {
  const existing = getPage(id);
  if (!existing) throw new Error(`Page ${id} not found`);
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE pages SET
      title    = COALESCE(?, title),
      status   = COALESCE(?, status),
      doc_json = COALESCE(?, doc_json),
      updated_at = ?
    WHERE id = ?
  `).run(
    input.title ?? null,
    input.status ?? null,
    input.doc ? JSON.stringify(input.doc) : null,
    now,
    id,
  );
  const page = getPage(id);
  if (!page) throw new Error("Failed to read back updated page");
  return page;
}

export function deletePage(id: string): void {
  db.prepare("DELETE FROM pages WHERE id = ?").run(id);
}
