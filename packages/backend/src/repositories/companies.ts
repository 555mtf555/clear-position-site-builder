import { db } from "../db/connection";
import { BrandKit, type BrandKit as BrandKitType, type Company } from "@clear-position/shared";

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  brand_kit_json: string;
  created_at: string;
  updated_at: string;
}

function rowToCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand_kit: BrandKit.parse(JSON.parse(row.brand_kit_json)),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function listCompanies(): Company[] {
  const rows = db.prepare("SELECT * FROM companies ORDER BY created_at").all() as CompanyRow[];
  return rows.map(rowToCompany);
}

export function getCompany(id: string): Company | null {
  const row = db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as CompanyRow | undefined;
  return row ? rowToCompany(row) : null;
}

export interface CreateCompanyInput {
  id: string;
  name: string;
  slug: string;
  brand_kit: BrandKitType;
}

export function createCompany(input: CreateCompanyInput): Company {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO companies (id, name, slug, brand_kit_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(input.id, input.name, input.slug, JSON.stringify(input.brand_kit), now, now);
  const company = getCompany(input.id);
  if (!company) throw new Error("Failed to read back created company");
  return company;
}

export function updateBrandKit(id: string, brandKit: BrandKitType): Company | null {
  const existing = getCompany(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  db.prepare("UPDATE companies SET brand_kit_json = ?, updated_at = ? WHERE id = ?")
    .run(JSON.stringify(brandKit), now, id);
  return getCompany(id);
}
