import { z } from "zod";
import { Id } from "./ids";

export const Asset = z.object({
  id: Id,
  company_id: Id,
  filename: z.string().min(1),
  original_filename: z.string().min(1),
  mime_type: z.string().min(1),
  size_bytes: z.number().int().nonnegative(),
  storage_path: z.string().min(1),
  alt_text: z.string().default(""),
  /** Public URL (e.g. /uploads/<generated-filename>). Server fills this in. */
  url: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  created_at: z.string(),
});
export type Asset = z.infer<typeof Asset>;
