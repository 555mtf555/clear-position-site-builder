import { describe, it, expect } from "vitest";
import { Page, PageDoc, BrandKit, Section, Site } from "..";

describe("Page schema", () => {
  it("accepts a valid page with a hero section", () => {
    const result = Page.safeParse({
      id: "p1",
      site_id: "s1",
      slug: "home",
      title: "Home",
      status: "draft",
      doc: {
        version: 1,
        metadata: {
          meta_title: "Custom title",
          meta_description: "Custom search description",
          og_image_asset_id: "asset_123",
        },
        sections: [
          {
            id: "h1",
            type: "hero",
            props: { headline: "Hi", text_align: "left" },
            elements: [],
          },
        ],
      },
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a hero section with no headline", () => {
    const result = PageDoc.safeParse({
      version: 1,
      sections: [
        { id: "h1", type: "hero", props: { text_align: "left" }, elements: [] },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid hero background color", () => {
    const result = PageDoc.safeParse({
      version: 1,
      sections: [
        {
          id: "h1",
          type: "hero",
          props: { headline: "Hi", background_color: "blue", text_align: "left" },
          elements: [],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a hero background asset id", () => {
    const result = PageDoc.safeParse({
      version: 1,
      sections: [
        {
          id: "h1",
          type: "hero",
          props: {
            headline: "Hi",
            background_image_asset_id: "asset_123",
            background_size: "cover",
            background_position: "center",
            text_align: "left",
          },
          elements: [],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("requires CTA text and href to be set together", () => {
    const missingHref = PageDoc.safeParse({
      version: 1,
      sections: [
        {
          id: "h1",
          type: "hero",
          props: { headline: "Hi", cta_text: "Buy", cta_href: "", text_align: "left" },
          elements: [],
        },
      ],
    });
    const missingText = PageDoc.safeParse({
      version: 1,
      sections: [
        {
          id: "h1",
          type: "hero",
          props: { headline: "Hi", cta_text: "", cta_href: "/buy", text_align: "left" },
          elements: [],
        },
      ],
    });

    expect(missingHref.success).toBe(false);
    expect(missingText.success).toBe(false);
  });

  it("accepts a section with an optional variant", () => {
    const result = Section.safeParse({
      id: "sec_services",
      type: "services",
      variant: "soft-card",
      props: {
        headline: "Services",
        services: [{ title: "Sprint", description: "A focused sprint." }],
      },
      elements: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variant).toBe("soft-card");
    }
  });

  it("rejects an unrecognised variant value", () => {
    const result = Section.safeParse({
      id: "sec_services",
      type: "services",
      variant: "sparkle-mode",
      props: {
        headline: "Services",
        services: [{ title: "Sprint", description: "A sprint." }],
      },
      elements: [],
    });
    expect(result.success).toBe(false);
  });

  it("parses a section without a variant (backward-compatible)", () => {
    const result = Section.safeParse({
      id: "sec_faq",
      type: "faq",
      props: {
        headline: "FAQ",
        items: [{ question: "How?", answer: "Like this." }],
      },
      elements: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variant).toBeUndefined();
    }
  });

  it("rejects an unknown section type", () => {
    const result = PageDoc.safeParse({
      version: 1,
      sections: [{ id: "x", type: "spacer", props: {} }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-version-1 page doc", () => {
    const result = PageDoc.safeParse({ version: 2, sections: [] });
    expect(result.success).toBe(false);
  });

  it.each([
    ["problem", { headline: "Problem", problems: [{ title: "Confusion", description: "Buyers cannot tell what to do." }] }],
    ["solution", { headline: "Solution", body: "A clearer path.", bullets: ["One", "Two"] }],
    ["process", { headline: "Process", steps: [{ title: "Plan", description: "Map the page." }] }],
    ["proof", { headline: "Proof", quote: "It worked.", attribution: "Customer", metrics: [{ value: "2x", label: "more leads" }] }],
    ["services", { headline: "Services", services: [{ title: "Sprint", description: "Clarify the offer." }] }],
    ["faq", { headline: "FAQ", items: [{ question: "How?", answer: "With JSON." }] }],
    ["final_cta", { headline: "Final CTA", cta_text: "Start", cta_href: "/contact", background_color: "#0f172a", text_align: "center" }],
  ])("accepts a valid %s section", (type, props) => {
    const result = Section.safeParse({
      id: `sec_${type}`,
      type,
      props,
      elements: [],
    });

    expect(result.success).toBe(true);
  });
});

describe("BrandKit schema", () => {
  it("rejects an invalid hex color", () => {
    const result = BrandKit.safeParse({
      colors: { primary: "red", accent: "#fff" },
      fonts: {},
    });
    expect(result.success).toBe(false);
  });

  it("accepts a minimal valid brand kit and fills defaults", () => {
    const result = BrandKit.safeParse({
      colors: { primary: "#1a6b4a", accent: "#f0c040" },
      fonts: {},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.colors.text).toBe("#111111");
      expect(result.data.colors.background).toBe("#ffffff");
      expect(result.data.colors.button_background).toBe("#255741");
      expect(result.data.border_radius).toBe(7);
    }
  });

  it("accepts expanded brand kit controls", () => {
    const result = BrandKit.safeParse({
      colors: {
        primary: "#1a6b4a",
        primary_color: "#1a6b4a",
        secondary_color: "#0f172a",
        accent: "#f0c040",
        accent_color: "#f59e0b",
        background_color: "#ffffff",
        text_color: "#111111",
        muted_text_color: "#4d574a",
        button_background: "#0f172a",
        button_text: "#ffffff",
      },
      fonts: { font_family: "Inter, system-ui, sans-serif" },
      border_radius: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid expanded brand kit colors", () => {
    const result = BrandKit.safeParse({
      colors: {
        primary: "#1a6b4a",
        accent: "#f0c040",
        button_background: "green",
      },
      fonts: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("Site schema", () => {
  it("accepts a core site with linked children", () => {
    const result = Site.safeParse({
      id: "s_core",
      company_id: "c1",
      slug: "acme-core",
      name: "Acme Core",
      is_core_site: true,
      linked_site_ids: ["s_child"],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid slug", () => {
    const result = Site.safeParse({
      id: "s1",
      company_id: "c1",
      slug: "Acme Core!",
      name: "Acme Core",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    expect(result.success).toBe(false);
  });
});
