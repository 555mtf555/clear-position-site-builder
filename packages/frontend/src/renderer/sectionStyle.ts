import type { CSSProperties } from "react";

type StyleProps = {
  background_color?: string;
  text_color?: string;
  font_size_scale?: string;
  font_family_preset?: string;
};

function fontFamilyValue(preset?: string): string | undefined {
  switch (preset) {
    case "serif": return "Georgia, 'Times New Roman', serif";
    case "sans": return "'Helvetica Neue', Helvetica, Arial, sans-serif";
    case "display": return "Impact, Anton, 'Bebas Neue', sans-serif";
    default: return undefined;
  }
}

/** Returns React inline styles for section colour + font-family overrides. */
export function sectionStyle(props: StyleProps): CSSProperties | undefined {
  const fontFamily = fontFamilyValue(props.font_family_preset);
  if (!props.background_color && !props.text_color && !fontFamily) return undefined;
  return {
    backgroundColor: props.background_color,
    color: props.text_color,
    "--cpsb-text": props.text_color,
    "--cpsb-muted-text": props.text_color,
    "--cpsb-font-family": fontFamily,
  } as CSSProperties;
}

// ── Per-item text style ───────────────────────────────────────────────────

type ItemStyleInput = {
  color?: string;
  background_color?: string;
  size?: string;
  font?: string;
  weight?: string;
} | undefined;

/** Converts a TextStyle object to React inline CSS properties for a card/item. */
export function itemStyle(style: ItemStyleInput): CSSProperties | undefined {
  if (!style) return undefined;
  const css: CSSProperties = {};
  if (style.color) css.color = style.color;
  if (style.background_color) css.backgroundColor = style.background_color;
  if (style.size && style.size !== "default") {
    const sizes: Record<string, string> = { small: "0.875rem", large: "1.2rem", display: "1.625rem" };
    if (sizes[style.size]) css.fontSize = sizes[style.size];
  }
  if (style.font && style.font !== "brand") {
    css.fontFamily = fontFamilyValue(style.font);
  }
  if (style.weight && style.weight !== "default") {
    const weights: Record<string, number> = { medium: 500, bold: 700 };
    if (weights[style.weight]) css.fontWeight = weights[style.weight];
  }
  return Object.keys(css).length > 0 ? css : undefined;
}

/** Returns CSS class names for typography scale and typeface preset. */
export function typographyClasses(props: StyleProps): string[] {
  const classes: string[] = [];
  if (props.font_size_scale && props.font_size_scale !== "default") {
    classes.push(`section--font-size-${props.font_size_scale}`);
  }
  if (props.font_family_preset && props.font_family_preset !== "brand") {
    classes.push(`section--font-${props.font_family_preset}`);
  }
  return classes;
}
