import fs from "node:fs";
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { validateBody } from "../lib/validate";
import { isSafeUploadPath, resolveUploadPath } from "../lib/uploads";
import * as repo from "../repositories/assets";

const router = Router();

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const extensionByMimeType: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

router.get("/", (req, res) => {
  const companyId = typeof req.query.company_id === "string" ? req.query.company_id : undefined;
  res.json(repo.listAssets(companyId));
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Asset id required" });

  const asset = repo.getAsset(id);
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  res.json(asset);
});

router.get("/:id/file", (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Asset id required" });

  const asset = repo.getAsset(id);
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  res.type(asset.mime_type);
  res.sendFile(asset.storage_path);
});

router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const companyId = typeof req.body.company_id === "string" && req.body.company_id
      ? req.body.company_id
      : "co_acme";
    const altText = typeof req.body.alt_text === "string" ? req.body.alt_text : "";

    if (!req.file) return res.status(400).json({ error: "Image file is required" });
    if (!allowedMimeTypes.has(req.file.mimetype)) {
      return res.status(400).json({ error: "Only png, jpg, webp, and gif images are allowed" });
    }

    const metadata = await sharp(req.file.buffer, { animated: req.file.mimetype === "image/gif" }).metadata();
    if (!metadata.format) return res.status(400).json({ error: "Uploaded file is not a valid image" });

    const detectedMime = metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format}`;
    if (!allowedMimeTypes.has(detectedMime)) {
      return res.status(400).json({ error: "Only png, jpg, webp, and gif images are allowed" });
    }

    const id = `asset_${randomUUID().slice(0, 8)}`;
    const filename = `${id}${extensionByMimeType[detectedMime]}`;
    const storagePath = resolveUploadPath(filename);
    await fs.promises.writeFile(storagePath, req.file.buffer, { flag: "wx" });

    const asset = repo.createAsset({
      id,
      company_id: companyId,
      filename,
      original_filename: req.file.originalname || filename,
      mime_type: detectedMime,
      size_bytes: req.file.size,
      storage_path: storagePath,
      width: metadata.width,
      height: metadata.height,
      alt_text: altText,
    });

    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
});

const UpdateAsset = z.object({
  alt_text: z.string().optional(),
});

router.patch("/:id", validateBody(UpdateAsset), (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Asset id required" });

  const asset = repo.updateAsset(id, req.body);
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  res.json(asset);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Asset id required" });

  const asset = repo.deleteAsset(id);
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  if (isSafeUploadPath(asset.storage_path)) {
    await fs.promises.unlink(asset.storage_path).catch(() => undefined);
  }
  res.status(204).end();
});

router.use((err: unknown, _req: unknown, res: { status: (status: number) => { json: (body: unknown) => void } }, next: (err: unknown) => void) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Image is too large. Maximum size is 5 MB." });
  }
  next(err);
});

export default router;
