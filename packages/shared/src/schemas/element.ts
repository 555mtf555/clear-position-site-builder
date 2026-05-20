import { z } from "zod";
import { Id } from "./ids";

/**
 * Generic Element. The smallest unit inside a Section.
 *
 * Phase 0 does not use Elements at the renderer level — `hero` is composed via
 * typed Section props. Element exists in the schema so future sections (cards,
 * grids, freeform canvases) can hold child items without another model change.
 */
export const Element = z.object({
  id: Id,
  type: z.string().min(1),
  props: z.record(z.unknown()).default({}),
});
export type Element = z.infer<typeof Element>;
