import type {
  Asset,
  Company,
  Page,
  PageDoc,
  Site,
  SiteStatus,
  SiteType,
  BrandKit,
} from "@clear-position/shared";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function listCompanies(): Promise<Company[]> {
  return fetchJson<Company[]>("/api/companies");
}

export function getCompany(companyId: string): Promise<Company> {
  return fetchJson<Company>(`/api/companies/${encodeURIComponent(companyId)}`);
}

export function updateCompanyBrandKit(companyId: string, brandKit: BrandKit): Promise<BrandKit> {
  return fetchJson<BrandKit>(`/api/companies/${encodeURIComponent(companyId)}/brand-kit`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(brandKit),
  });
}

export function listSites(companyId: string): Promise<Site[]> {
  return fetchJson<Site[]>(`/api/sites?company_id=${encodeURIComponent(companyId)}`);
}

export function listCompanySites(companyId: string): Promise<Site[]> {
  return fetchJson<Site[]>(`/api/companies/${encodeURIComponent(companyId)}/sites`);
}

export function getSite(siteId: string): Promise<Site> {
  return fetchJson<Site>(`/api/sites/${encodeURIComponent(siteId)}`);
}

export interface CreateSiteInput {
  name: string;
  slug: string;
  site_type?: SiteType;
  is_core_site?: boolean;
  parent_site_id?: string | null;
  status?: SiteStatus;
}

export function createCompanySite(companyId: string, input: CreateSiteInput): Promise<Site> {
  return fetchJson<Site>(`/api/companies/${encodeURIComponent(companyId)}/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export interface UpdateSiteInput {
  name?: string;
  slug?: string;
  site_type?: SiteType;
  is_core_site?: boolean;
  parent_site_id?: string | null;
  status?: SiteStatus;
}

export function updateSite(siteId: string, input: UpdateSiteInput): Promise<Site> {
  return fetchJson<Site>(`/api/sites/${encodeURIComponent(siteId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function setCoreSite(siteId: string): Promise<Site> {
  return fetchJson<Site>(`/api/sites/${encodeURIComponent(siteId)}/core`, { method: "PATCH" });
}

export async function deleteSite(siteId: string): Promise<void> {
  const response = await fetch(`/api/sites/${encodeURIComponent(siteId)}`, { method: "DELETE" });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed: ${response.status}`);
  }
}

export function listPages(siteId: string): Promise<Page[]> {
  return fetchJson<Page[]>(`/api/pages?site_id=${encodeURIComponent(siteId)}`);
}

export function listSitePages(siteId: string): Promise<Page[]> {
  return fetchJson<Page[]>(`/api/sites/${encodeURIComponent(siteId)}/pages`);
}

export interface CreatePageInput {
  title: string;
  slug: string;
  status?: Page["status"];
  doc?: PageDoc;
}

export function createSitePage(siteId: string, input: CreatePageInput): Promise<Page> {
  return fetchJson<Page>(`/api/sites/${encodeURIComponent(siteId)}/pages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function getPage(pageId: string): Promise<Page> {
  return fetchJson<Page>(`/api/pages/${encodeURIComponent(pageId)}`);
}

export interface UpdatePageInput {
  title?: string;
  status?: Page["status"];
  doc?: Page["doc"];
}

export function updatePage(pageId: string, input: UpdatePageInput): Promise<Page> {
  return fetchJson<Page>(`/api/pages/${encodeURIComponent(pageId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export interface ExportResult {
  export_path: string;
  files_generated: string[];
  page_title?: string;
  site_id?: string;
  manifest_path: string;
  warnings: Array<{
    code: string;
    message: string;
    pageId?: string;
    assetId?: string;
  }>;
}

export function exportPage(pageId: string): Promise<ExportResult> {
  return fetchJson<ExportResult>(`/api/pages/${encodeURIComponent(pageId)}/export`, {
    method: "POST",
  });
}

export function exportSite(siteId: string): Promise<ExportResult> {
  return fetchJson<ExportResult>(`/api/sites/${encodeURIComponent(siteId)}/export`, {
    method: "POST",
  });
}

export function listAssets(companyId = "co_acme"): Promise<Asset[]> {
  return fetchJson<Asset[]>(`/api/assets?company_id=${encodeURIComponent(companyId)}`);
}

export function uploadAsset(file: File, input: { company_id?: string; alt_text?: string } = {}): Promise<Asset> {
  const body = new FormData();
  body.append("file", file);
  body.append("company_id", input.company_id ?? "co_acme");
  body.append("alt_text", input.alt_text ?? "");

  return fetchJson<Asset>("/api/assets", {
    method: "POST",
    body,
  });
}

export function updateAsset(assetId: string, input: { alt_text?: string }): Promise<Asset> {
  return fetchJson<Asset>(`/api/assets/${encodeURIComponent(assetId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteAsset(assetId: string): Promise<void> {
  const response = await fetch(`/api/assets/${encodeURIComponent(assetId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed: ${response.status}`);
  }
}
