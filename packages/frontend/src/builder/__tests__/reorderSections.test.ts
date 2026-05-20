import { describe, expect, it } from "vitest";
import type { Section } from "@clear-position/shared";
import { reorderSections } from "../reorderSections";

const sections: Section[] = [
  {
    id: "hero_1",
    type: "hero",
    props: { headline: "Hero", background_size: "cover", background_position: "center", text_align: "left" },
    elements: [],
  },
  {
    id: "problem_1",
    type: "problem",
    props: {
      headline: "Problem",
      problems: [{ title: "Problem", description: "Description." }],
    },
    elements: [],
  },
  {
    id: "faq_1",
    type: "faq",
    props: {
      headline: "FAQ",
      items: [{ question: "Q?", answer: "A." }],
    },
    elements: [],
  },
];

describe("reorderSections", () => {
  it("preserves all section IDs", () => {
    const result = reorderSections(sections, "faq_1", "hero_1");

    expect(result?.map((section) => section.id).sort()).toEqual(["faq_1", "hero_1", "problem_1"]);
  });

  it("changes order correctly", () => {
    const result = reorderSections(sections, "faq_1", "hero_1");

    expect(result?.map((section) => section.id)).toEqual(["faq_1", "hero_1", "problem_1"]);
  });

  it("safely ignores an invalid reorder", () => {
    const result = reorderSections(sections, "missing", "hero_1");

    expect(result).toBeNull();
  });
});
