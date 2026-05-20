import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  BrandKit,
  PageDoc,
  PageStatus,
  SiteStatus,
  SiteType,
  Slug,
} from "@clear-position/shared";
import { validateBody } from "../lib/validate";
import { asUniqueConflict } from "../lib/errors";
import * as repo from "../repositories/sites";
import * as pages from "../repositories/pages";
import { exportSite } from "../services/pageExporter";

const router = Router();

router.get("/", (req, res) => {
  const companyId = typeof req.query.company_id === "string" ? req.query.company_id : "";
  if (!companyId) return res.status(400).json({ error: "company_id query param required" });
  res.json(repo.listSitesByCompany(companyId));
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Site id required" });
  const site = repo.getSite(id);
  if (!site) return res.status(404).json({ error: "Site not found" });
  res.json(site);
});

router.post("/:id/export", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Site id required" });
    const site = repo.getSite(id);
    if (!site) return res.status(404).json({ error: "Site not found" });

    const result = await exportSite(site);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message.includes("invalid")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

const CreateSite = z.object({
  company_id: z.string().min(1),
  slug: Slug,
  name: z.string().min(1),
  site_type: SiteType.optional(),
  is_core_site: z.boolean().optional(),
  parent_site_id: z.string().nullable().optional(),
  status: SiteStatus.optional(),
  linked_site_ids: z.array(z.string()).optional(),
  brand_overrides: BrandKit.partial().optional(),
});

router.post("/", validateBody(CreateSite), (req, res, next) => {
  try {
    const id = `site_${randomUUID().slice(0, 8)}`;
    const site = repo.createSite({ id, ...req.body });
    res.status(201).json(site);
  } catch (err) {
    const conflict = asUniqueConflict(err, "A site with that slug already exists in this company");
    if (conflict) return next(conflict);
    next(err);
  }
});

const UpdateSite = z.object({
  name: z.string().min(1).optional(),
  slug: Slug.optional(),
  site_type: SiteType.optional(),
  is_core_site: z.boolean().optional(),
  parent_site_id: z.string().nullable().optional(),
  status: SiteStatus.optional(),
  linked_site_ids: z.array(z.string()).optional(),
  brand_overrides: BrandKit.partial().nullable().optional(),
});

router.patch("/:id", validateBody(UpdateSite), (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Site id required" });
    const updated = repo.updateSite(id, req.body);
    if (!updated) return res.status(404).json({ error: "Site not found" });
    res.json(updated);
  } catch (err) {
    const conflict = asUniqueConflict(err, "A site with that slug already exists in this company");
    if (conflict) return next(conflict);
    next(err);
  }
});

router.patch("/:id/core", (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Site id required" });
  const updated = repo.setCoreSite(id);
  if (!updated) return res.status(404).json({ error: "Site not found" });
  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Site id required" });
  const existed = repo.deleteSite(id);
  if (!existed) return res.status(404).json({ error: "Site not found" });
  res.status(204).end();
});

// Phase 7: nested page management under a site.

router.get("/:id/pages", (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Site id required" });
  const site = repo.getSite(id);
  if (!site) return res.status(404).json({ error: "Site not found" });
  res.json(pages.listPagesBySite(id));
});

const CreateSitePage = z.object({
  slug: Slug,
  title: z.string().min(1),
  status: PageStatus.optional(),
  doc: PageDoc.optional(),
});

router.post("/:id/pages", validateBody(CreateSitePage), (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Site id required" });
    const site = repo.getSite(id);
    if (!site) return res.status(404).json({ error: "Site not found" });

    const pageId = `page_${randomUUID().slice(0, 8)}`;
    const doc = req.body.doc ?? {
      version: 1 as const,
      sections: [],
    };
    const page = pages.createPage({
      id: pageId,
      site_id: id,
      slug: req.body.slug,
      title: req.body.title,
      status: req.body.status,
      doc,
    });
    res.status(201).json(page);
  } catch (err) {
    const conflict = asUniqueConflict(err, "A page with that slug already exists on this site");
    if (conflict) return next(conflict);
    next(err);
  }
});

export default router;
