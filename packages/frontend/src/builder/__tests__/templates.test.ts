import { describe, expect, it } from "vitest";
import { Page as PageSchema, Section as SectionSchema, type Page } from "@clear-position/shared";
import {
  instantiateTemplateSections,
  pageTemplates,
  sectionTemplates,
  validateTemplatePage,
} from "../templates";

const basePage: Page = {
  id: "page_test",
  site_id: "site_test",
  slug: "home",
  title: "Home",
  status: "draft",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  doc: {
    version: 1,
    sections: [],
  },
};

describe("templates", () => {
  it("every section template produces valid Section JSON", () => {
    for (const template of sectionTemplates) {
      const sections = instantiateTemplateSections([template.section]);
      expect(sections, template.id).not.toBeNull();
      expect(SectionSchema.safeParse(sections?.[0]).success, template.id).toBe(true);
    }
  });

  it("every full page template produces valid Page JSON", () => {
    for (const template of pageTemplates) {
      const sections = instantiateTemplateSections(template.sections);
      expect(sections, template.id).not.toBeNull();
      const page = sections ? validateTemplatePage(basePage, sections) : null;
      expect(page, template.id).not.toBeNull();
      expect(PageSchema.safeParse(page).success, template.id).toBe(true);
    }
  });

  it("generated section IDs are unique", () => {
    const template = pageTemplates[0]!;
    const sections = instantiateTemplateSections(template.sections);
    const ids = sections?.map((section) => section.id) ?? [];

    expect(new Set(ids).size).toBe(ids.length);
  });
});
