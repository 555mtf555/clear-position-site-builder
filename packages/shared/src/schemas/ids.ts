import { z } from "zod";

export const Id = z.string().min(1);
export type Id = z.infer<typeof Id>;

/** lowercase letters, digits, hyphens; no leading/trailing hyphen */
export const Slug = z
  .string()
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "must be lowercase letters/numbers/hyphens with no leading or trailing hyphen");
export type Slug = z.infer<typeof Slug>;
