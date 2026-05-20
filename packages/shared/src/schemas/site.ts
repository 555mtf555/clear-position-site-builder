import { z } from "zod";
import { Id, Slug } from "./ids";
import { BrandKit } from "./brandkit";

/** Phase 7 enumeration for the kind of website a site represents. */
export const SiteType = z.enum([
  "core",
  "service",
  "location",
  "campaign",
  "landing",
  "custom",
]);
export type SiteType = z.infer<typeof SiteType>;

/** Lifecycle status of a site. Editor-managed; orthogonal to per-page status. */
export const SiteStatus = z.enum(["draft", "published", "archived"]);
export type SiteStatus = z.infer<typeof SiteStatus>;

export const Site = z.object({
  id: Id,
  company_id: Id,
  slug: Slug,
  name: z.string().min(1),
  /** Phase 7: descriptive type of the site. `core` is paired with `is_core_site=true`. */
  site_type: SiteType.default("custom"),
  /** A company may mark exactly one Site as its core site. Enforced in the repo. */
  is_core_site: z.boolean().default(false),
  /** Optional pointer to a parent site (typically the core site for a child relationship). */
  parent_site_id: Id.nullable().optional(),
  /** Lifecycle status. */
  status: SiteStatus.default("draft"),
  /** IDs of other sites this site links to. Used for core <-> child relationships in both directions. */
  linked_site_ids: z.array(Id).default([]),
  /** Optional per-site brand overrides. */
  brand_overrides: BrandKit.partial().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Site = z.infer<typeof Site>;
