import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BrandKit, Page } from "@clear-position/shared";
import { PageRenderer } from "../PageRenderer";

const page: Page = {
  id: "page_test",
  site_id: "site_test",
  slug: "home",
  title: "Home",
  status: "draft",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  doc: {
    version: 1,
    sections: [
      {
        id: "hero_1",
        type: "hero",
        props: {
          headline: "A sharper business website",
          subhead: "Built from structured JSON.",
          cta_text: "Preview it",
          cta_href: "/preview",
          background_image_asset_id: "asset_123",
          background_size: "cover",
          background_position: "center",
          text_align: "center",
        },
        elements: [],
      },
      {
        id: "problem_1",
        type: "problem",
        props: {
          headline: "The message is hard to buy",
          problems: [{ title: "Unclear offer", description: "Prospects do not know what happens next." }],
        },
        elements: [],
      },
      {
        id: "solution_1",
        type: "solution",
        props: {
          headline: "Create a clearer path",
          body: "A structured page makes the buying decision easier.",
          bullets: ["Message", "Sections"],
        },
        elements: [],
      },
      {
        id: "process_1",
        type: "process",
        props: {
          headline: "How it works",
          steps: [{ title: "Plan", description: "Choose the right sections." }],
        },
        elements: [],
      },
      {
        id: "proof_1",
        type: "proof",
        props: {
          headline: "Proof it works",
          quote: "This made the offer obvious.",
          attribution: "A customer",
          metrics: [{ value: "2x", label: "more clarity" }],
        },
        elements: [],
      },
      {
        id: "services_1",
        type: "services",
        props: {
          headline: "Services",
          services: [{ title: "Homepage sprint", description: "Build the first page." }],
        },
        elements: [],
      },
      {
        id: "faq_1",
        type: "faq",
        props: {
          headline: "Questions",
          items: [{ question: "Can it expand?", answer: "Yes, the JSON model grows section by section." }],
        },
        elements: [],
      },
      {
        id: "final_cta_1",
        type: "final_cta",
        props: {
          headline: "Ready to start?",
          cta_text: "Book a call",
          cta_href: "/contact",
          background_color: "#255741",
          background_size: "cover",
          background_position: "center",
          text_align: "center",
        },
        elements: [],
      },
    ],
  },
};

const brandKit: BrandKit = {
  colors: {
    primary: "#123456",
    primary_color: "#123456",
    secondary_color: "#234567",
    accent: "#345678",
    accent_color: "#345678",
    text: "#111111",
    text_color: "#111111",
    background: "#fafafa",
    background_color: "#fafafa",
    muted_text_color: "#555555",
    button_background: "#123456",
    button_text: "#ffffff",
  },
  fonts: {
    heading: "Inter",
    body: "Inter",
    font_family: "Inter, system-ui, sans-serif",
  },
  border_radius: 12,
};

describe("PageRenderer", () => {
  it("renders a hero section from page JSON", () => {
    render(<PageRenderer page={page} />);

    expect(screen.getByRole("main", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "A sharper business website" })).toBeInTheDocument();
    expect(screen.getByText("Built from structured JSON.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Preview it" })).toHaveAttribute("href", "/preview");
    expect(screen.getByRole("heading", { name: "A sharper business website" }).closest("section")).toHaveStyle({
      backgroundImage: "url(/api/assets/asset_123/file)",
    });
    expect(screen.getByRole("heading", { name: "The message is hard to buy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create a clearer path" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How it works" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Proof it works" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Services" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Questions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ready to start?" })).toBeInTheDocument();
  });

  it("renders process steps in JSON order", () => {
    render(<PageRenderer page={page} />);

    const stepCard = screen.getByText("Plan").closest("article");
    expect(stepCard).toHaveTextContent("1");
    expect(stepCard).toHaveTextContent("Choose the right sections.");
  });

  it("applies brand kit defaults as renderer CSS variables", () => {
    render(<PageRenderer page={page} brandKit={brandKit} />);

    expect(screen.getByRole("main", { name: "Home" })).toHaveStyle({
      "--cpsb-button-background": "#123456",
      "--cpsb-background": "#fafafa",
      "--cpsb-border-radius": "12px",
    });
  });

  it("applies the variant CSS class when a section has a variant set", () => {
    const pageWithVariant: typeof page = {
      ...page,
      doc: {
        ...page.doc,
        sections: [
          {
            id: "services_v",
            type: "services",
            variant: "soft-card",
            props: {
              headline: "Polished services",
              services: [{ title: "Sprint", description: "Quick focused work." }],
            },
            elements: [],
          },
        ],
      },
    };
    render(<PageRenderer page={pageWithVariant} />);
    const section = screen.getByRole("heading", { name: "Polished services" }).closest("section");
    expect(section).toHaveClass("section--soft-card");
  });

  it("applies font_size_scale CSS class when set on a section", () => {
    const pageWithTypography: typeof page = {
      ...page,
      doc: {
        ...page.doc,
        sections: [
          {
            id: "services_typo",
            type: "services",
            props: {
              headline: "Typography services",
              services: [{ title: "Sprint", description: "Quick work." }],
              font_size_scale: "large",
            },
            elements: [],
          },
        ],
      },
    };
    render(<PageRenderer page={pageWithTypography} />);
    const section = screen.getByRole("heading", { name: "Typography services" }).closest("section");
    expect(section).toHaveClass("section--font-size-large");
  });

  it("applies font_family_preset CSS class when set on a section", () => {
    const pageWithFont: typeof page = {
      ...page,
      doc: {
        ...page.doc,
        sections: [
          {
            id: "faq_font",
            type: "faq",
            props: {
              headline: "Font FAQ",
              items: [{ question: "Q?", answer: "A." }],
              font_family_preset: "serif",
            },
            elements: [],
          },
        ],
      },
    };
    render(<PageRenderer page={pageWithFont} />);
    const section = screen.getByRole("heading", { name: "Font FAQ" }).closest("section");
    expect(section).toHaveClass("section--font-serif");
  });

  it("keeps explicit section background styles over brand defaults", () => {
    render(<PageRenderer page={page} brandKit={brandKit} />);

    const finalCta = screen.getByRole("heading", { name: "Ready to start?" }).closest("section");
    expect(finalCta).toHaveStyle({ backgroundColor: "#255741" });
  });

  it("applies explicit background and text colors on content sections", () => {
    const pageWithContentColors: typeof page = {
      ...page,
      doc: {
        ...page.doc,
        sections: [
          {
            id: "services_colors",
            type: "services",
            props: {
              headline: "Styled services",
              background_color: "#f8fafc",
              text_color: "#0f172a",
              services: [{ title: "Sprint", description: "Quick focused work." }],
            },
            elements: [],
          },
        ],
      },
    };

    render(<PageRenderer page={pageWithContentColors} brandKit={brandKit} />);
    const section = screen.getByRole("heading", { name: "Styled services" }).closest("section");

    expect(section).toHaveStyle({
      backgroundColor: "#f8fafc",
      color: "#0f172a",
      "--cpsb-text": "#0f172a",
    });
  });
});

describe("PageRenderer inline editing", () => {
  const inlineEditorPage: typeof page = {
    ...page,
    doc: {
      ...page.doc,
      sections: [
        {
          id: "hero_1",
          type: "hero",
          props: {
            headline: "A sharper business website",
            subhead: "Built from JSON.",
            cta_text: "Get started",
            cta_href: "/contact",
            text_align: "left",
            background_size: "cover",
            background_position: "center",
          },
          elements: [],
        },
      ],
    },
  };

  it("hero headline has inline-editable class in editor mode", () => {
    const { container } = render(
      <PageRenderer
        page={inlineEditorPage}
        editorContext={{
          selectedSectionId: null,
          onSelectSection: vi.fn(),
          onStartInlineEdit: vi.fn(),
          onCommitInlineEdit: vi.fn(),
          onCancelInlineEdit: vi.fn(),
        }}
      />,
    );
    const heading = container.querySelector("h1");
    expect(heading).toHaveClass("inline-editable");
  });

  it("hero headline has no inline-editable class without editorContext", () => {
    const { container } = render(<PageRenderer page={inlineEditorPage} />);
    const heading = container.querySelector("h1");
    expect(heading).not.toHaveClass("inline-editable");
  });

  it("clicking hero headline calls onStartInlineEdit with correct path", () => {
    const onStartInlineEdit = vi.fn();
    const { container } = render(
      <PageRenderer
        page={inlineEditorPage}
        editorContext={{
          selectedSectionId: null,
          onSelectSection: vi.fn(),
          onStartInlineEdit,
          onCommitInlineEdit: vi.fn(),
          onCancelInlineEdit: vi.fn(),
        }}
      />,
    );
    const heading = container.querySelector("h1.inline-editable") as HTMLElement;
    fireEvent.click(heading);
    expect(onStartInlineEdit).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: "hero_1", field: "headline" }),
      "A sharper business website",
    );
  });

  it("renders an input when the inline edit path matches the headline", () => {
    const { container } = render(
      <PageRenderer
        page={inlineEditorPage}
        editorContext={{
          selectedSectionId: null,
          onSelectSection: vi.fn(),
          onStartInlineEdit: vi.fn(),
          onCommitInlineEdit: vi.fn(),
          onCancelInlineEdit: vi.fn(),
          inlineEdit: { path: { sectionId: "hero_1", field: "headline", required: true } },
        }}
      />,
    );
    const input = container.querySelector("input.inline-editor");
    expect(input).not.toBeNull();
    expect((input as HTMLInputElement)?.value).toBe("A sharper business website");
  });

  it("pressing Enter on the inline input calls onCommitInlineEdit", () => {
    const onCommitInlineEdit = vi.fn();
    const { container } = render(
      <PageRenderer
        page={inlineEditorPage}
        editorContext={{
          selectedSectionId: null,
          onSelectSection: vi.fn(),
          onStartInlineEdit: vi.fn(),
          onCommitInlineEdit,
          onCancelInlineEdit: vi.fn(),
          inlineEdit: { path: { sectionId: "hero_1", field: "headline", required: true } },
        }}
      />,
    );
    const input = container.querySelector("input.inline-editor") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Updated headline" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCommitInlineEdit).toHaveBeenCalledWith("Updated headline");
  });

  it("pressing Escape calls onCancelInlineEdit", () => {
    const onCancelInlineEdit = vi.fn();
    const { container } = render(
      <PageRenderer
        page={inlineEditorPage}
        editorContext={{
          selectedSectionId: null,
          onSelectSection: vi.fn(),
          onStartInlineEdit: vi.fn(),
          onCommitInlineEdit: vi.fn(),
          onCancelInlineEdit,
          inlineEdit: { path: { sectionId: "hero_1", field: "headline" } },
        }}
      />,
    );
    const input = container.querySelector("input.inline-editor") as HTMLInputElement;
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onCancelInlineEdit).toHaveBeenCalled();
  });

  it("export-mode page has no inline-editable classes (no editorContext)", () => {
    const { container } = render(<PageRenderer page={inlineEditorPage} />);
    expect(container.querySelectorAll(".inline-editable")).toHaveLength(0);
    expect(container.querySelectorAll(".inline-editor")).toHaveLength(0);
  });
});

describe("PageRenderer editor context", () => {
  it("does not add editor-selectable elements when editorContext is absent", () => {
    const { container } = render(<PageRenderer page={page} />);
    expect(container.querySelectorAll(".editor-selectable")).toHaveLength(0);
  });

  it("wraps each section in an editor-selectable div when editorContext is provided", () => {
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{ selectedSectionId: null, onSelectSection: vi.fn() }}
      />,
    );
    expect(container.querySelectorAll(".editor-selectable").length).toBe(page.doc.sections.length);
  });

  it("adds editor-selected class to the section matching selectedSectionId", () => {
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{ selectedSectionId: "hero_1", onSelectSection: vi.fn() }}
      />,
    );
    const selected = container.querySelector(".editor-selected");
    expect(selected).not.toBeNull();
    expect(selected?.getAttribute("data-section-id")).toBe("hero_1");
  });

  it("calls onSelectSection with the section id when a selectable section is clicked", () => {
    const onSelectSection = vi.fn();
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{ selectedSectionId: null, onSelectSection }}
      />,
    );
    const heroWrapper = container.querySelector("[data-section-id='hero_1']") as HTMLElement;
    expect(heroWrapper).not.toBeNull();
    fireEvent.click(heroWrapper);
    expect(onSelectSection).toHaveBeenCalledWith("hero_1");
  });

  it("each selectable wrapper carries a data-editor-label attribute", () => {
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{ selectedSectionId: null, onSelectSection: vi.fn() }}
      />,
    );
    const heroWrapper = container.querySelector("[data-section-id='hero_1']");
    expect(heroWrapper?.getAttribute("data-editor-label")).toBe("Hero");
  });

  it("no section has editor-selected when selectedSectionId does not match any section", () => {
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{ selectedSectionId: "nonexistent_id", onSelectSection: vi.fn() }}
      />,
    );
    expect(container.querySelectorAll(".editor-selected")).toHaveLength(0);
  });

  it("calls onSelectItem with kind='card' and index when a section-card is clicked", () => {
    const onSelectSection = vi.fn();
    const onSelectItem = vi.fn();
    const pageWithServices: typeof page = {
      ...page,
      doc: {
        ...page.doc,
        sections: [
          {
            id: "services_1",
            type: "services",
            props: {
              headline: "Services",
              services: [
                { title: "Alpha", description: "First." },
                { title: "Beta", description: "Second." },
                { title: "Gamma", description: "Third." },
              ],
            },
            elements: [],
          },
        ],
      },
    };

    const { container } = render(
      <PageRenderer
        page={pageWithServices}
        editorContext={{ selectedSectionId: null, onSelectSection, onSelectItem }}
      />,
    );

    const cards = container.querySelectorAll(".section-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    // Click the second card (index 1)
    fireEvent.click(cards[1]!);
    expect(onSelectSection).toHaveBeenCalledWith("services_1");
    expect(onSelectItem).toHaveBeenCalledWith("services_1", "card", 1);
  });

  it("calls onSelectSection but not onSelectItem when clicking outside a card", () => {
    const onSelectSection = vi.fn();
    const onSelectItem = vi.fn();
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{ selectedSectionId: null, onSelectSection, onSelectItem }}
      />,
    );
    // Click the section wrapper (hero heading)
    const heroWrapper = container.querySelector("[data-section-id='hero_1']") as HTMLElement;
    const heading = heroWrapper.querySelector("h1") as HTMLElement;
    fireEvent.click(heading);
    expect(onSelectSection).toHaveBeenCalledWith("hero_1");
    // onSelectItem should NOT be called — heading is not a card/step/faq/metric
    expect(onSelectItem).not.toHaveBeenCalled();
  });

  it("shows a mini-toolbar when a section is selected", () => {
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{ selectedSectionId: "hero_1", onSelectSection: vi.fn() }}
      />,
    );
    expect(container.querySelector(".editor-toolbar")).not.toBeNull();
  });

  it("does not show a mini-toolbar when no section is selected", () => {
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{ selectedSectionId: null, onSelectSection: vi.fn() }}
      />,
    );
    expect(container.querySelector(".editor-toolbar")).toBeNull();
  });

  it("does not render a toolbar without editorContext", () => {
    const { container } = render(<PageRenderer page={page} />);
    expect(container.querySelector(".editor-toolbar")).toBeNull();
  });

  it("toolbar Move up button calls onMoveSection with 'up'", () => {
    const onMoveSection = vi.fn();
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{
          selectedSectionId: "problem_1",
          onSelectSection: vi.fn(),
          onMoveSection,
        }}
      />,
    );
    const btn = container.querySelector("[aria-label='Move section up']") as HTMLElement;
    expect(btn).not.toBeNull();
    fireEvent.click(btn);
    expect(onMoveSection).toHaveBeenCalledWith("problem_1", "up");
  });

  it("toolbar Move up button is disabled for the first section", () => {
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{
          selectedSectionId: "hero_1",
          onSelectSection: vi.fn(),
          onMoveSection: vi.fn(),
        }}
      />,
    );
    const btn = container.querySelector("[aria-label='Move section up']") as HTMLButtonElement;
    expect(btn?.disabled).toBe(true);
  });

  it("toolbar Move down button calls onMoveSection with 'down'", () => {
    const onMoveSection = vi.fn();
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{
          selectedSectionId: "problem_1",
          onSelectSection: vi.fn(),
          onMoveSection,
        }}
      />,
    );
    const btn = container.querySelector("[aria-label='Move section down']") as HTMLElement;
    fireEvent.click(btn);
    expect(onMoveSection).toHaveBeenCalledWith("problem_1", "down");
  });

  it("toolbar Delete button calls onDeleteSection", () => {
    const onDeleteSection = vi.fn();
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{
          selectedSectionId: "hero_1",
          onSelectSection: vi.fn(),
          onDeleteSection,
        }}
      />,
    );
    const btn = container.querySelector("[aria-label='Delete section']") as HTMLElement;
    expect(btn).not.toBeNull();
    fireEvent.click(btn);
    expect(onDeleteSection).toHaveBeenCalledWith("hero_1");
  });

  it("toolbar button clicks stop propagation and do not re-trigger selection", () => {
    const onSelectSection = vi.fn();
    const onMoveSection = vi.fn();
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{
          selectedSectionId: "hero_1",
          onSelectSection,
          onMoveSection,
        }}
      />,
    );
    const btn = container.querySelector("[aria-label='Move section up']") as HTMLElement;
    fireEvent.click(btn);
    // onSelectSection should NOT be called again from toolbar button click
    expect(onSelectSection).not.toHaveBeenCalled();
  });

  it("toolbar shows item badge when selectedPreviewItem matches the selected section", () => {
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{
          selectedSectionId: "services_1",
          onSelectSection: vi.fn(),
          selectedPreviewItem: { sectionId: "services_1", itemKind: "card", itemIndex: 1 },
        }}
      />,
    );
    const itemInfo = container.querySelector(".editor-toolbar__item-info");
    expect(itemInfo?.textContent).toContain("Card 2");
  });

  it("toolbar does not show item badge for a different section", () => {
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{
          selectedSectionId: "hero_1",
          onSelectSection: vi.fn(),
          selectedPreviewItem: { sectionId: "services_1", itemKind: "card", itemIndex: 0 },
        }}
      />,
    );
    // hero is selected but selectedPreviewItem is for services → no item badge in hero toolbar
    expect(container.querySelector(".editor-toolbar__item-info")).toBeNull();
  });

  it("clicking a section from sidebar clears and does not call onSelectItem", () => {
    const onSelectSection = vi.fn();
    const onSelectItem = vi.fn();
    const { container } = render(
      <PageRenderer
        page={page}
        editorContext={{ selectedSectionId: null, onSelectSection, onSelectItem }}
      />,
    );
    const sectionWrapper = container.querySelector(".editor-selectable") as HTMLElement;
    fireEvent.click(sectionWrapper);
    expect(onSelectSection).toHaveBeenCalled();
    expect(onSelectItem).not.toHaveBeenCalled();
  });
});
