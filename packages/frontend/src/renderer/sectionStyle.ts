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

/**
 * Extracts only background_color from a style object — for the card/article container.
 * Text properties (color, size, font, weight) belong on individual text elements.
 */
export function cardSurface(style: ItemStyleInput): CSSProperties | undefined {
  if (!style?.background_color) return undefined;
  return { backgroundColor: style.background_color };
}

/**
 * Converts text-only style properties to React CSSProperties for a text element
 * (h3, p, span, etc.). Does NOT apply background_color — that goes on the container.
 *
 * @param fieldStyle  Field-specific style (title_style, description_style, etc.).
 * @param legacyFallback  Legacy card-level style, used as fallback for existing content.
 */
export function textFieldStyle(
  fieldStyle: ItemStyleInput,
  legacyFallback?: ItemStyleInput,
): CSSProperties | undefined {
  const s = fieldStyle ?? legacyFallback;
  if (!s) return undefined;
  const css: CSSProperties = {};
  if (s.color) css.color = s.color;
  if (s.size && s.size !== "default") {
    const sizes: Record<string, string> = { small: "0.875rem", large: "1.2rem", display: "1.625rem" };
    if (sizes[s.size]) css.fontSize = sizes[s.size];
  }
  if (s.font && s.font !== "brand") {
    css.fontFamily = fontFamilyValue(s.font);
  }
  if (s.weight && s.weight !== "default") {
    const weights: Record<string, number> = { medium: 500, bold: 700 };
    if (weights[s.weight]) css.fontWeight = weights[s.weight];
  }
  return Object.keys(css).length > 0 ? css : undefined;
}

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
