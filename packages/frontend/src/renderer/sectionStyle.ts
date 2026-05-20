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
