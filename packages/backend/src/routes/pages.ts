import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { PageDoc, PageStatus, Slug } from "@clear-position/shared";
import { validateBody } from "../lib/validate";
import { asUniqueConflict } from "../lib/errors";
import * as repo from "../repositories/pages";
import { exportPage } from "../services/pageExporter";

const router = Router();

router.get("/", (req, res) => {
  const siteId = typeof req.query.site_id === "string" ? req.query.site_id : "";
  if (!siteId) return res.status(400).json({ error: "site_id query param required" });
  res.json(repo.listPagesBySite(siteId));
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Page id required" });

  const page = repo.getPage(id);
  if (!page) return res.status(404).json({ error: "Page not found" });
  res.json(page);
});

router.post("/:id/export", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Page id required" });

    const page = repo.getPage(id);
    if (!page) return res.status(404).json({ error: "Page not found" });

    const result = await exportPage(page);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message.includes("invalid")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

const CreatePage = z.object({
  site_id: z.string().min(1),
  slug: Slug,
  title: z.string().min(1),
  status: PageStatus.optional(),
  doc: PageDoc,
});

router.post("/", validateBody(CreatePage), (req, res, next) => {
  try {
    const id = `page_${randomUUID().slice(0, 8)}`;
    const page = repo.createPage({ id, ...req.body });
    res.status(201).json(page);
  } catch (err) {
    const conflict = asUniqueConflict(err, "A page with that slug already exists on this site");
    if (conflict) return next(conflict);
    next(err);
  }
});

const UpdatePage = z.object({
  title: z.string().min(1).optional(),
  status: PageStatus.optional(),
  doc: PageDoc.optional(),
});

router.put("/:id", validateBody(UpdatePage), (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Page id required" });

  const existing = repo.getPage(id);
  if (!existing) return res.status(404).json({ error: "Page not found" });
  const page = repo.updatePage(id, req.body);
  res.json(page);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Page id required" });

  const existing = repo.getPage(id);
  if (!existing) return res.status(404).json({ error: "Page not found" });
  repo.deletePage(id);
  res.status(204).end();
});

export default router;
