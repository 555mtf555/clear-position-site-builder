import { db } from "../db/connection";
import type { BrandKit, Site, SiteStatus, SiteType } from "@clear-position/shared";

interface SiteRow {
  id: string;
  company_id: string;
  slug: string;
  name: string;
  site_type: SiteType;
  is_core_site: number;
  parent_site_id: string | null;
  status: SiteStatus;
  linked_site_ids_json: string;
  brand_overrides_json: string | null;
  created_at: string;
  updated_at: string;
}

function rowToSite(row: SiteRow): Site {
  return {
    id: row.id,
    company_id: row.company_id,
    slug: row.slug,
    name: row.name,
    site_type: row.site_type ?? "custom",
    is_core_site: row.is_core_site === 1,
    parent_site_id: row.parent_site_id ?? null,
    status: row.status ?? "draft",
    linked_site_ids: JSON.parse(row.linked_site_ids_json) as string[],
    brand_overrides: row.brand_overrides_json
      ? (JSON.parse(row.brand_overrides_json) as Partial<BrandKit>)
      : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function listSitesByCompany(companyId: string): Site[] {
  const rows = db
    .prepare("SELECT * FROM sites WHERE company_id = ? ORDER BY is_core_site DESC, created_at")
    .all(companyId) as SiteRow[];
  return rows.map(rowToSite);
}

export function listChildSites(parentSiteId: string): Site[] {
  const rows = db
    .prepare("SELECT * FROM sites WHERE parent_site_id = ? ORDER BY created_at")
    .all(parentSiteId) as SiteRow[];
  return rows.map(rowToSite);
}

export function getSite(id: string): Site | null {
  const row = db.prepare("SELECT * FROM sites WHERE id = ?").get(id) as SiteRow | undefined;
  return row ? rowToSite(row) : null;
}

export interface CreateSiteInput {
  id: string;
  company_id: string;
  slug: string;
  name: string;
  site_type?: SiteType;
  is_core_site?: boolean;
  parent_site_id?: string | null;
  status?: SiteStatus;
  linked_site_ids?: string[];
  brand_overrides?: Partial<BrandKit>;
}

/**
 * Creates a site. If `is_core_site` is true (or site_type is 'core'), any
 * existing core site for the same company is demoted in the same transaction
 * to preserve the "at most one core site per company" invariant.
 */
export function createSite(input: CreateSiteInput): Site {
  const now = new Date().toISOString();
  const wantsCore = input.is_core_site === true || input.site_type === "core";
  const siteType: SiteType = wantsCore ? "core" : (input.site_type ?? "custom");

  const txn = db.transaction(() => {
    if (wantsCore) {
      db.prepare(
        "UPDATE sites SET is_core_site = 0, site_type = CASE WHEN site_type = 'core' THEN 'custom' ELSE site_type END, updated_at = ? WHERE company_id = ? AND is_core_site = 1",
      ).run(now, input.company_id);
    }
    db.prepare(`
      INSERT INTO sites (
        id, company_id, slug, name, site_type, is_core_site, parent_site_id, status,
        linked_site_ids_json, brand_overrides_json, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input.id,
      input.company_id,
      input.slug,
      input.name,
      siteType,
      wantsCore ? 1 : 0,
      input.parent_site_id ?? null,
      input.status ?? "draft",
      JSON.stringify(input.linked_site_ids ?? []),
      input.brand_overrides ? JSON.stringify(input.brand_overrides) : null,
      now,
      now,
    );
  });

  txn();
  const site = getSite(input.id);
  if (!site) throw new Error("Failed to read back created site");
  return site;
}

export interface UpdateSiteInput {
  name?: string;
  slug?: string;
  site_type?: SiteType;
  is_core_site?: boolean;
  parent_site_id?: string | null;
  status?: SiteStatus;
  linked_site_ids?: string[];
  brand_overrides?: Partial<BrandKit> | null;
}

/**
 * Patch updater. If the patch promotes this site to core, demotes any other
 * core site for the same company atomically.
 */
export function updateSite(id: string, input: UpdateSiteInput): Site | null {
  const existing = getSite(id);
  if (!existing) return null;

  const wantsCore = input.is_core_site === true || input.site_type === "core";
  const wantsDemote = input.is_core_site === false;

  const now = new Date().toISOString();

  const txn = db.transaction(() => {
    if (wantsCore) {
      db.prepare(
        "UPDATE sites SET is_core_site = 0, site_type = CASE WHEN site_type = 'core' THEN 'custom' ELSE site_type END, updated_at = ? WHERE company_id = ? AND is_core_site = 1 AND id != ?",
      ).run(now, existing.company_id, id);
    }

    const nextSiteType: SiteType = wantsCore
      ? "core"
      : input.site_type ?? (wantsDemote && existing.site_type === "core" ? "custom" : existing.site_type);

    const nextIsCore = wantsCore ? 1 : wantsDemote ? 0 : existing.is_core_site ? 1 : 0;

    db.prepare(`
      UPDATE sites SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        site_type = ?,
        is_core_site = ?,
        parent_site_id = ?,
        status = COALESCE(?, status),
        linked_site_ids_json = COALESCE(?, linked_site_ids_json),
        brand_overrides_json = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      input.name ?? null,
      input.slug ?? null,
      nextSiteType,
      nextIsCore,
      input.parent_site_id === undefined ? existing.parent_site_id ?? null : input.parent_site_id,
      input.status ?? null,
      input.linked_site_ids ? JSON.stringify(input.linked_site_ids) : null,
      input.brand_overrides === null
        ? null
        : input.brand_overrides
          ? JSON.stringify(input.brand_overrides)
          : existing.brand_overrides
            ? JSON.stringify(existing.brand_overrides)
            : null,
      now,
      id,
    );
  });

  txn();
  return getSite(id);
}

/**
 * Promotes one site to be the company's core site, demoting any others
 * atomically. Returns the updated site or null if not found.
 */
export function setCoreSite(id: string): Site | null {
  return updateSite(id, { is_core_site: true });
}

export function deleteSite(id: string): boolean {
  const result = db.prepare("DELETE FROM sites WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getCoreSiteForCompany(companyId: string): Site | null {
  const row = db
    .prepare("SELECT * FROM sites WHERE company_id = ? AND is_core_site = 1")
    .get(companyId) as SiteRow | undefined;
  return row ? rowToSite(row) : null;
}
