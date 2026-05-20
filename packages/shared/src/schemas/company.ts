import { z } from "zod";
import { Id, Slug } from "./ids";
import { BrandKit } from "./brandkit";

export const Company = z.object({
  id: Id,
  name: z.string().min(1),
  slug: Slug,
  brand_kit: BrandKit,
  created_at: z.string(),
  updated_at: z.string(),
});
export type Company = z.infer<typeof Company>;
