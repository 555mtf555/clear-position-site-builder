import type { TextStyle } from "@clear-position/shared";

// ── Preset definitions ────────────────────────────────────────────────────

/**
 * A named style preset for cards, steps, FAQ items, and metrics.
 * `primary` maps to title/question/value; `secondary` maps to description/answer/label.
 */
export interface CardStylePreset {
  id: string;
  label: string;
  surface_background?: string;
  primary?: TextStyle;
  secondary?: TextStyle;
}

export const CARD_PRESETS: CardStylePreset[] = [
  {
    id: "clean-light",
    label: "Clean Light",
    surface_background: "#f8faf7",
    primary: { weight: "bold" },
  },
  {
    id: "dark-feature",
    label: "Dark Feature",
    surface_background: "#1a2318",
    primary: { color: "#c4e0bc", weight: "bold" },
    secondary: { color: "#7a9474" },
  },
  {
    id: "green-accent",
    label: "Green Accent",
    surface_background: "#e5f0ea",
    primary: { color: "#255741", weight: "bold" },
    secondary: { color: "#394136" },
  },
  {
    id: "gold-accent",
    label: "Gold Accent",
    surface_background: "#fdf3e4",
    primary: { color: "#8a5810", weight: "bold" },
    secondary: { color: "#5a3d10" },
  },
  {
    id: "muted",
    label: "Muted",
    surface_background: "#f2f4f0",
    primary: { color: "#394136", size: "small" },
    secondary: { color: "#677064", size: "small" },
  },
  {
    id: "minimal",
    label: "Minimal",
    primary: { weight: "medium" },
    secondary: { size: "small" },
  },
];

// ── Style snapshot for copy/paste ─────────────────────────────────────────

/**
 * Normalised snapshot of an item's style fields.
 * `kind` prevents incompatible paste operations.
 */
export interface ItemStyleSnapshot {
  kind: "card" | "faq" | "metric";
  surface_background?: string;
  primary?: TextStyle;
  secondary?: TextStyle;
}

// ── Card items (services, problems, process steps) ────────────────────────

type CardItem = {
  style?: TextStyle;
  title_style?: TextStyle;
  description_style?: TextStyle;
  [key: string]: unknown;
};

export function getCardSnapshot(item: CardItem): ItemStyleSnapshot {
  return {
    kind: "card",
    surface_background: item.style?.background_color,
    primary: item.title_style,
    secondary: item.description_style,
  };
}

export function applyCardSnapshot<T extends CardItem>(item: T, snap: ItemStyleSnapshot): T {
  return {
    ...item,
    style: snap.surface_background
      ? { ...(item.style ?? {}), background_color: snap.surface_background }
      : undefined,
    title_style: snap.primary,
    description_style: snap.secondary,
  };
}

export function applyCardPreset<T extends CardItem>(item: T, preset: CardStylePreset): T {
  return {
    ...item,
    style: preset.surface_background ? { background_color: preset.surface_background } : undefined,
    title_style: preset.primary ? { ...preset.primary } : undefined,
    description_style: preset.secondary ? { ...preset.secondary } : undefined,
  };
}

export function clearCardStyle<T extends CardItem>(item: T): T {
  return { ...item, style: undefined, title_style: undefined, description_style: undefined };
}

// ── FAQ items ─────────────────────────────────────────────────────────────

type FaqItem = {
  style?: TextStyle;
  question_style?: TextStyle;
  answer_style?: TextStyle;
  [key: string]: unknown;
};

export function getFaqSnapshot(item: FaqItem): ItemStyleSnapshot {
  return {
    kind: "faq",
    surface_background: item.style?.background_color,
    primary: item.question_style,
    secondary: item.answer_style,
  };
}

export function applyFaqSnapshot<T extends FaqItem>(item: T, snap: ItemStyleSnapshot): T {
  return {
    ...item,
    style: snap.surface_background
      ? { ...(item.style ?? {}), background_color: snap.surface_background }
      : undefined,
    question_style: snap.primary,
    answer_style: snap.secondary,
  };
}

export function applyFaqPreset<T extends FaqItem>(item: T, preset: CardStylePreset): T {
  return {
    ...item,
    style: preset.surface_background ? { background_color: preset.surface_background } : undefined,
    question_style: preset.primary ? { ...preset.primary } : undefined,
    answer_style: preset.secondary ? { ...preset.secondary } : undefined,
  };
}

export function clearFaqStyle<T extends FaqItem>(item: T): T {
  return { ...item, style: undefined, question_style: undefined, answer_style: undefined };
}

// ── Proof metrics ─────────────────────────────────────────────────────────

type MetricItem = {
  style?: TextStyle;
  value_style?: TextStyle;
  label_style?: TextStyle;
  [key: string]: unknown;
};

export function getMetricSnapshot(item: MetricItem): ItemStyleSnapshot {
  return {
    kind: "metric",
    surface_background: item.style?.background_color,
    primary: item.value_style,
    secondary: item.label_style,
  };
}

export function applyMetricSnapshot<T extends MetricItem>(item: T, snap: ItemStyleSnapshot): T {
  return {
    ...item,
    style: snap.surface_background
      ? { ...(item.style ?? {}), background_color: snap.surface_background }
      : undefined,
    value_style: snap.primary,
    label_style: snap.secondary,
  };
}

export function applyMetricPreset<T extends MetricItem>(item: T, preset: CardStylePreset): T {
  return {
    ...item,
    style: preset.surface_background ? { background_color: preset.surface_background } : undefined,
    value_style: preset.primary ? { ...preset.primary } : undefined,
    label_style: preset.secondary ? { ...preset.secondary } : undefined,
  };
}

export function clearMetricStyle<T extends MetricItem>(item: T): T {
  return { ...item, style: undefined, value_style: undefined, label_style: undefined };
}

// ── Compatibility check ───────────────────────────────────────────────────

export function canPasteSnapshot(
  clipboard: ItemStyleSnapshot | null,
  kind: "card" | "faq" | "metric",
): boolean {
  return clipboard !== null && clipboard.kind === kind;
}
