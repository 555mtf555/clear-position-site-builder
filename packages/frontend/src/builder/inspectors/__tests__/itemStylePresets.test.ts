import { describe, expect, it } from "vitest";
import type { TextStyle } from "@clear-position/shared";
import {
  CARD_PRESETS,
  applyCardPreset,
  applyCardSnapshot,
  applyFaqPreset,
  applyFaqSnapshot,
  applyMetricPreset,
  applyMetricSnapshot,
  canPasteSnapshot,
  clearCardStyle,
  clearFaqStyle,
  clearMetricStyle,
  getCardSnapshot,
  getFaqSnapshot,
  getMetricSnapshot,
} from "../itemStylePresets";

// Minimal typed helpers so generic T includes the style fields TypeScript can see.
type CardLike = { title: string; description: string; style?: TextStyle; title_style?: TextStyle; description_style?: TextStyle };
type FaqLike = { question: string; answer: string; style?: TextStyle; question_style?: TextStyle; answer_style?: TextStyle };
type MetricLike = { value: string; label: string; style?: TextStyle; value_style?: TextStyle; label_style?: TextStyle };

// ── applyCardPreset ───────────────────────────────────────────────────────

describe("applyCardPreset", () => {
  it("applies surface background and primary/secondary styles", () => {
    const item: CardLike = { title: "Sprint", description: "Fast work." };
    const preset = CARD_PRESETS.find((p) => p.id === "dark-feature")!;
    const result = applyCardPreset(item, preset);
    // text content is preserved
    expect(result.title).toBe("Sprint");
    expect(result.description).toBe("Fast work.");
    // style fields are set
    expect(result.style?.background_color).toBe("#1a2318");
    expect(result.title_style?.color).toBe("#c4e0bc");
    expect(result.title_style?.weight).toBe("bold");
    expect(result.description_style?.color).toBe("#7a9474");
  });

  it("clears surface when preset has no surface_background", () => {
    const item: CardLike = {
      title: "T",
      description: "D",
      style: { background_color: "#ff0000" },
    };
    const preset = CARD_PRESETS.find((p) => p.id === "minimal")!;
    const result = applyCardPreset(item, preset);
    expect(result.style).toBeUndefined();
    expect(result.title_style?.weight).toBe("medium");
    expect(result.description_style?.size).toBe("small");
  });

  it("overwrites only style fields, not unrelated item properties", () => {
    const item: CardLike & { someOtherField: string } = { title: "T", description: "D", someOtherField: "keep me" };
    const preset = CARD_PRESETS.find((p) => p.id === "green-accent")!;
    const result = applyCardPreset(item, preset);
    expect(result.someOtherField).toBe("keep me");
  });
});

// ── clearCardStyle ────────────────────────────────────────────────────────

describe("clearCardStyle", () => {
  it("removes style, title_style, and description_style", () => {
    const item: CardLike = {
      title: "Sprint",
      description: "Fast.",
      style: { background_color: "#f0fff8" },
      title_style: { color: "#255741", weight: "bold" },
      description_style: { size: "small" },
    };
    const result = clearCardStyle(item);
    expect(result.title).toBe("Sprint");
    expect(result.description).toBe("Fast.");
    expect(result.style).toBeUndefined();
    expect(result.title_style).toBeUndefined();
    expect(result.description_style).toBeUndefined();
  });

  it("is safe to call on an item with no styles", () => {
    const item: CardLike = { title: "T", description: "D" };
    const result = clearCardStyle(item);
    expect(result.title).toBe("T");
    expect(result.style).toBeUndefined();
  });
});

// ── getCardSnapshot / applyCardSnapshot ───────────────────────────────────

describe("getCardSnapshot", () => {
  it("captures surface, primary, and secondary from a card item", () => {
    const item: CardLike = {
      title: "T",
      description: "D",
      style: { background_color: "#e5f0ea" },
      title_style: { color: "#255741", weight: "bold" },
      description_style: { size: "small" },
    };
    const snap = getCardSnapshot(item);
    expect(snap.kind).toBe("card");
    expect(snap.surface_background).toBe("#e5f0ea");
    expect(snap.primary?.color).toBe("#255741");
    expect(snap.primary?.weight).toBe("bold");
    expect(snap.secondary?.size).toBe("small");
  });

  it("produces undefined fields when item has no styles", () => {
    const item: CardLike = { title: "T", description: "D" };
    const snap = getCardSnapshot(item);
    expect(snap.kind).toBe("card");
    expect(snap.surface_background).toBeUndefined();
    expect(snap.primary).toBeUndefined();
    expect(snap.secondary).toBeUndefined();
  });
});

describe("applyCardSnapshot", () => {
  it("applies snapshot to a target item without changing its text", () => {
    const snap = {
      kind: "card" as const,
      surface_background: "#e5f0ea",
      primary: { color: "#255741" },
      secondary: { size: "small" as const },
    };
    const target: CardLike = { title: "Other", description: "Other desc." };
    const result = applyCardSnapshot(target, snap);
    expect(result.title).toBe("Other");
    expect(result.description).toBe("Other desc.");
    expect(result.style?.background_color).toBe("#e5f0ea");
    expect(result.title_style?.color).toBe("#255741");
    expect(result.description_style?.size).toBe("small");
  });

  it("clears surface when snapshot has no surface_background", () => {
    const snap = { kind: "card" as const, primary: { weight: "bold" as const } };
    const target: CardLike = { title: "T", description: "D", style: { background_color: "#ff0000" } };
    const result = applyCardSnapshot(target, snap);
    expect(result.style).toBeUndefined();
    expect(result.title_style?.weight).toBe("bold");
  });
});

// ── FAQ presets / snapshot ─────────────────────────────────────────────────

describe("applyFaqPreset", () => {
  it("maps primary to question_style and secondary to answer_style", () => {
    const item: FaqLike = { question: "Q?", answer: "A." };
    const preset = CARD_PRESETS.find((p) => p.id === "green-accent")!;
    const result = applyFaqPreset(item, preset);
    expect(result.question).toBe("Q?");
    expect(result.answer).toBe("A.");
    expect(result.style?.background_color).toBe("#e5f0ea");
    expect(result.question_style?.color).toBe("#255741");
    expect(result.answer_style?.color).toBe("#394136");
  });
});

describe("clearFaqStyle", () => {
  it("removes style, question_style, answer_style but keeps text", () => {
    const item: FaqLike = {
      question: "Q?",
      answer: "A.",
      style: { background_color: "#fff" },
      question_style: { weight: "bold" },
      answer_style: { size: "small" },
    };
    const result = clearFaqStyle(item);
    expect(result.question).toBe("Q?");
    expect(result.answer).toBe("A.");
    expect(result.style).toBeUndefined();
    expect(result.question_style).toBeUndefined();
    expect(result.answer_style).toBeUndefined();
  });
});

describe("getFaqSnapshot / applyFaqSnapshot", () => {
  it("round-trips question/answer styles", () => {
    const item: FaqLike = {
      question: "Q?",
      answer: "A.",
      style: { background_color: "#e5f0ea" },
      question_style: { color: "#255741" },
      answer_style: { size: "small" },
    };
    const snap = getFaqSnapshot(item);
    expect(snap.kind).toBe("faq");
    expect(snap.surface_background).toBe("#e5f0ea");

    const target: FaqLike = { question: "Other?", answer: "Other." };
    const result = applyFaqSnapshot(target, snap);
    expect(result.question).toBe("Other?");
    expect(result.style?.background_color).toBe("#e5f0ea");
    expect(result.question_style?.color).toBe("#255741");
    expect(result.answer_style?.size).toBe("small");
  });
});

// ── Metric presets / snapshot ─────────────────────────────────────────────

describe("applyMetricPreset", () => {
  it("maps primary to value_style and secondary to label_style", () => {
    const metric: MetricLike = { value: "2x", label: "faster" };
    const preset = CARD_PRESETS.find((p) => p.id === "gold-accent")!;
    const result = applyMetricPreset(metric, preset);
    expect(result.value).toBe("2x");
    expect(result.label).toBe("faster");
    expect(result.style?.background_color).toBe("#fdf3e4");
    expect(result.value_style?.color).toBe("#8a5810");
    expect(result.label_style?.color).toBe("#5a3d10");
  });
});

describe("clearMetricStyle", () => {
  it("removes style, value_style, label_style but keeps text", () => {
    const metric: MetricLike = {
      value: "2x",
      label: "faster",
      style: { background_color: "#fdf3e4" },
      value_style: { weight: "bold" },
      label_style: { size: "small" },
    };
    const result = clearMetricStyle(metric);
    expect(result.value).toBe("2x");
    expect(result.label).toBe("faster");
    expect(result.style).toBeUndefined();
    expect(result.value_style).toBeUndefined();
    expect(result.label_style).toBeUndefined();
  });
});

describe("getMetricSnapshot / applyMetricSnapshot", () => {
  it("round-trips value/label styles", () => {
    const metric: MetricLike = {
      value: "2x",
      label: "faster",
      style: { background_color: "#fdf3e4" },
      value_style: { color: "#8a5810" },
      label_style: { size: "small" },
    };
    const snap = getMetricSnapshot(metric);
    expect(snap.kind).toBe("metric");

    const target: MetricLike = { value: "10x", label: "conversion" };
    const result = applyMetricSnapshot(target, snap);
    expect(result.value).toBe("10x");
    expect(result.style?.background_color).toBe("#fdf3e4");
    expect(result.value_style?.color).toBe("#8a5810");
    expect(result.label_style?.size).toBe("small");
  });
});

// ── canPasteSnapshot ──────────────────────────────────────────────────────

describe("canPasteSnapshot", () => {
  it("returns false when clipboard is null", () => {
    expect(canPasteSnapshot(null, "card")).toBe(false);
    expect(canPasteSnapshot(null, "faq")).toBe(false);
    expect(canPasteSnapshot(null, "metric")).toBe(false);
  });

  it("returns true when clipboard kind matches target kind", () => {
    expect(canPasteSnapshot({ kind: "card" }, "card")).toBe(true);
    expect(canPasteSnapshot({ kind: "faq" }, "faq")).toBe(true);
    expect(canPasteSnapshot({ kind: "metric" }, "metric")).toBe(true);
  });

  it("returns false when clipboard kind does not match target kind", () => {
    expect(canPasteSnapshot({ kind: "card" }, "faq")).toBe(false);
    expect(canPasteSnapshot({ kind: "faq" }, "metric")).toBe(false);
    expect(canPasteSnapshot({ kind: "metric" }, "card")).toBe(false);
  });
});
