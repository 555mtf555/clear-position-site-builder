import { z } from "zod";
import { Id, Slug } from "./ids";
import { Section } from "./section";
import { BrandKit } from "./brandkit";

export const PageStatus = z.enum(["draft", "published"]);
export type PageStatus = z.infer<typeof PageStatus>;

/**
 * PageDoc is the JSON document the editor mutates and the renderer reads.
 * Stored as a single JSON column on the `pages` row.
 */
export const PageDoc = z.object({
  version: z.literal(1),
  metadata: z.object({
    meta_title: z.string().min(1).optional(),
    meta_description: z.string().min(1).optional(),
    meta_canonical: z.string().optional(),
    og_image_asset_id: Id.optional(),
    import_notes: z.array(z.string()).optional(),
    import_source: z.string().optional(),
    import_company_name: z.string().optional(),
    import_project_name: z.string().optional(),
    import_source_map: z.record(z.unknown()).optional(),
    import_section_sources: z.array(z.object({
      section_id: Id,
      section_type: z.string(),
      sources: z.array(z.string()).default([]),
      used_fallback: z.boolean().default(false),
      note: z.string().optional(),
    })).optional(),
    import_qa: z.object({
      completed_item_ids: z.array(z.string()).default([]),
    }).optional(),
  }).optional(),
  sections: z.array(Section).default([]),
  /** Optional per-page brand overrides; merged on top of site and company in the renderer (later phase). */
  brand_overrides: BrandKit.partial().optional(),
});
export type PageDoc = z.infer<typeof PageDoc>;

export const Page = z.object({
  id: Id,
  site_id: Id,
  slug: Slug,
  title: z.string().min(1),
  status: PageStatus.default("draft"),
  doc: PageDoc,
  created_at: z.string(),
  updated_at: z.string(),
});
export type Page = z.infer<typeof Page>;
