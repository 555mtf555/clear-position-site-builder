import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { BrandKit, Slug, SiteType, SiteStatus } from "@clear-position/shared";
import { validateBody } from "../lib/validate";
import { asUniqueConflict } from "../lib/errors";
import * as companies from "../repositories/companies";
import * as sites from "../repositories/sites";

const router = Router();

router.get("/", (_req, res) => {
  res.json(companies.listCompanies());
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Company id required" });
  const company = companies.getCompany(id);
  if (!company) return res.status(404).json({ error: "Company not found" });
  res.json(company);
});

router.get("/:id/brand-kit", (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Company id required" });
  const company = companies.getCompany(id);
  if (!company) return res.status(404).json({ error: "Company not found" });
  res.json(company.brand_kit);
});

router.patch("/:id/brand-kit", validateBody(BrandKit), (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Company id required" });
  const company = companies.updateBrandKit(id, req.body);
  if (!company) return res.status(404).json({ error: "Company not found" });
  res.json(company.brand_kit);
});

const CreateCompany = z.object({
  name: z.string().min(1),
  slug: Slug,
  brand_kit: BrandKit,
});

router.post("/", validateBody(CreateCompany), (req, res, next) => {
  try {
    const id = `co_${randomUUID().slice(0, 8)}`;
    const company = companies.createCompany({ id, ...req.body });
    res.status(201).json(company);
  } catch (err) {
    const conflict = asUniqueConflict(err, "A company with that slug already exists");
    if (conflict) return next(conflict);
    next(err);
  }
});

// Phase 7: nested site management.

router.get("/:id/sites", (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Company id required" });
  const company = companies.getCompany(id);
  if (!company) return res.status(404).json({ error: "Company not found" });
  res.json(sites.listSitesByCompany(id));
});

const CreateCompanySite = z.object({
  name: z.string().min(1),
  slug: Slug,
  site_type: SiteType.optional(),
  is_core_site: z.boolean().optional(),
  parent_site_id: z.string().nullable().optional(),
  status: SiteStatus.optional(),
  linked_site_ids: z.array(z.string()).optional(),
  brand_overrides: BrandKit.partial().optional(),
});

router.post("/:id/sites", validateBody(CreateCompanySite), (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Company id required" });
    const company = companies.getCompany(id);
    if (!company) return res.status(404).json({ error: "Company not found" });

    const siteId = `site_${randomUUID().slice(0, 8)}`;
    const site = sites.createSite({ id: siteId, company_id: id, ...req.body });
    res.status(201).json(site);
  } catch (err) {
    const conflict = asUniqueConflict(err, "A site with that slug already exists in this company");
    if (conflict) return next(conflict);
    next(err);
  }
});

export default router;
