import { db } from "../db/connection";
import type { Asset } from "@clear-position/shared";

interface AssetRow {
  id: string;
  company_id: string;
  filename: string;
  original_filename: string;
  mime: string;
  mime_type: string;
  size: number;
  size_bytes: number;
  storage_path: string;
  width: number | null;
  height: number | null;
  alt_text: string;
  created_at: string;
}

function rowToAsset(row: AssetRow): Asset {
  const mimeType = row.mime_type || row.mime;
  const sizeBytes = row.size_bytes || row.size;

  return {
    id: row.id,
    company_id: row.company_id,
    filename: row.filename,
    original_filename: row.original_filename || row.filename,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    storage_path: row.storage_path,
    url: `/uploads/${row.filename}`,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    alt_text: row.alt_text ?? "",
    created_at: row.created_at,
  };
}

export function listAssets(companyId?: string): Asset[] {
  const rows = companyId
    ? db.prepare("SELECT * FROM assets WHERE company_id = ? ORDER BY created_at DESC").all(companyId) as AssetRow[]
    : db.prepare("SELECT * FROM assets ORDER BY created_at DESC").all() as AssetRow[];
  return rows.map(rowToAsset);
}

export function listAssetsByCompany(companyId: string): Asset[] {
  return listAssets(companyId);
}

export function getAsset(id: string): Asset | null {
  const row = db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as AssetRow | undefined;
  return row ? rowToAsset(row) : null;
}

export interface CreateAssetInput {
  id: string;
  company_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  width?: number;
  height?: number;
  alt_text?: string;
}

export function createAsset(input: CreateAssetInput): Asset {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO assets (
      id, company_id, filename, original_filename, mime, mime_type, size, size_bytes,
      storage_path, width, height, alt_text, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.id,
    input.company_id,
    input.filename,
    input.original_filename,
    input.mime_type,
    input.mime_type,
    input.size_bytes,
    input.size_bytes,
    input.storage_path,
    input.width ?? null,
    input.height ?? null,
    input.alt_text ?? "",
    now,
  );

  const asset = getAsset(input.id);
  if (!asset) throw new Error("Failed to read back created asset");
  return asset;
}

export function updateAsset(id: string, input: { alt_text?: string }): Asset | null {
  const existing = getAsset(id);
  if (!existing) return null;

  db.prepare("UPDATE assets SET alt_text = COALESCE(?, alt_text) WHERE id = ?")
    .run(input.alt_text ?? null, id);
  return getAsset(id);
}

export function deleteAsset(id: string): Asset | null {
  const asset = getAsset(id);
  if (!asset) return null;
  db.prepare("DELETE FROM assets WHERE id = ?").run(id);
  return asset;
}
