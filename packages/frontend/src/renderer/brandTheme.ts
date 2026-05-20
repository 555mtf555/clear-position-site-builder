import type { BrandKit } from "@clear-position/shared";
import type { CSSProperties } from "react";

export const defaultBrandKit: BrandKit = {
  colors: {
    primary: "#1a6b4a",
    primary_color: "#1a6b4a",
    secondary_color: "#255741",
    accent: "#f0c040",
    accent_color: "#f0c040",
    text: "#111111",
    text_color: "#111111",
    background: "#ffffff",
    background_color: "#ffffff",
    muted_text_color: "#4d574a",
    button_background: "#255741",
    button_text: "#ffffff",
  },
  fonts: {
    heading: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
    font_family: "Inter, system-ui, sans-serif",
  },
  border_radius: 7,
};

export function brandKitToCssVars(brandKit?: BrandKit): CSSProperties {
  const brand = brandKit ?? defaultBrandKit;
  return {
    "--cpsb-primary": brand.colors.primary_color ?? brand.colors.primary,
    "--cpsb-secondary": brand.colors.secondary_color,
    "--cpsb-accent": brand.colors.accent_color ?? brand.colors.accent,
    "--cpsb-background": brand.colors.background_color ?? brand.colors.background,
    "--cpsb-text": brand.colors.text_color ?? brand.colors.text,
    "--cpsb-muted-text": brand.colors.muted_text_color ?? brand.colors.muted ?? "#4d574a",
    "--cpsb-button-background": brand.colors.button_background,
    "--cpsb-button-text": brand.colors.button_text,
    "--cpsb-border-radius": `${brand.border_radius ?? 7}px`,
    "--cpsb-font-family": brand.fonts.font_family ?? brand.fonts.body,
  } as CSSProperties;
}
