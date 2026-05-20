import { z } from "zod";

export const HexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "must be a hex color like #1a6b4a or #fff");
export type HexColor = z.infer<typeof HexColor>;

export const BrandKit = z.object({
  colors: z.object({
    primary: HexColor,
    primary_color: HexColor.default("#1a6b4a"),
    secondary_color: HexColor.default("#255741"),
    accent: HexColor,
    accent_color: HexColor.default("#f0c040"),
    text: HexColor.default("#111111"),
    text_color: HexColor.default("#111111"),
    background: HexColor.default("#ffffff"),
    background_color: HexColor.default("#ffffff"),
    muted: HexColor.optional(),
    muted_text_color: HexColor.default("#4d574a"),
    button_background: HexColor.default("#255741"),
    button_text: HexColor.default("#ffffff"),
  }),
  fonts: z.object({
    heading: z.string().default("system-ui, sans-serif"),
    body: z.string().default("system-ui, sans-serif"),
    font_family: z.string().default("Inter, system-ui, sans-serif"),
  }),
  border_radius: z.number().min(0).max(32).default(7),
  logo_asset_id: z.string().optional(),
});
export type BrandKit = z.infer<typeof BrandKit>;
