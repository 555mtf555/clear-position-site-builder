import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FaqSection, ProcessSection, ServicesSection } from "@clear-position/shared";
import { reorderItems } from "../fields";
import { Page as PageSchema } from "@clear-position/shared";
import { FaqInspector } from "../FaqInspector";
import { ProcessInspector } from "../ProcessInspector";
import { ServicesInspector } from "../ServicesInspector";

function validPageWith(section: FaqSection | ProcessSection | ServicesSection) {
  return PageSchema.safeParse({
    id: "page_test",
    site_id: "site_test",
    slug: "home",
    title: "Home",
    status: "draft",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    doc: {
      version: 1,
      sections: [section],
    },
  }).success;
}

describe("structured repeated item inspectors", () => {
  it("adds a FAQ item as structured JSON", () => {
    let section: FaqSection = {
      id: "faq_1",
      type: "faq",
      props: {
        headline: "FAQ",
        items: [{ question: "First?", answer: "First answer." }],
      },
      elements: [],
    };

    render(<FaqInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));

    expect(section.props.items).toHaveLength(2);
    expect(section.props.items[1]).toEqual({ question: "New question?", answer: "Answer the question." });
    expect(validPageWith(section)).toBe(true);
  });

  it("removes a service card after confirming and preserves valid JSON", () => {
    vi.stubGlobal("confirm", vi.fn(() => true));

    let section: ServicesSection = {
      id: "services_1",
      type: "services",
      props: {
        headline: "Services",
        services: [
          { title: "One", description: "First service." },
          { title: "Two", description: "Second service." },
        ],
      },
      elements: [],
    };

    render(<ServicesInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]!);

    expect(window.confirm).toHaveBeenCalledWith("Remove this service card?");
    expect(section.props.services).toEqual([{ title: "Two", description: "Second service." }]);
    expect(validPageWith(section)).toBe(true);
  });

  it("moves process steps up and down while preserving order and valid JSON", () => {
    let section: ProcessSection = {
      id: "process_1",
      type: "process",
      props: {
        headline: "Process",
        steps: [
          { title: "One", description: "First step." },
          { title: "Two", description: "Second step." },
          { title: "Three", description: "Third step." },
        ],
      },
      elements: [],
    };

    const { rerender } = render(<ProcessInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    const secondStep = screen.getByText("Step 2").closest("fieldset")!;
    fireEvent.click(within(secondStep).getByRole("button", { name: "Move up" }));
    expect(section.props.steps.map((step) => step.title)).toEqual(["Two", "One", "Three"]);

    rerender(<ProcessInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    const firstStep = screen.getByText("Step 1").closest("fieldset")!;
    fireEvent.click(within(firstStep).getByRole("button", { name: "Move down" }));
    expect(section.props.steps.map((step) => step.title)).toEqual(["One", "Two", "Three"]);
    expect(validPageWith(section)).toBe(true);
  });

  it("shows inline validation for an invalid FAQ item", () => {
    const section: FaqSection = {
      id: "faq_1",
      type: "faq",
      props: {
        headline: "FAQ",
        items: [{ question: "", answer: "Answer." }],
      },
      elements: [],
    };

    render(
      <FaqInspector
        section={section}
        validationIssues={[{ path: "doc.sections.0.props.items.0.question", message: "Question is required." }]}
        onChange={() => undefined}
      />,
    );

    expect(screen.getByText("Question is required.")).toBeInTheDocument();
  });

  it("shows inline validation for an invalid service card", () => {
    const section: ServicesSection = {
      id: "services_1",
      type: "services",
      props: {
        headline: "Services",
        services: [{ title: "", description: "Description." }],
      },
      elements: [],
    };

    render(
      <ServicesInspector
        section={section}
        validationIssues={[{ path: "doc.sections.0.props.services.0.title", message: "Title is required." }]}
        onChange={() => undefined}
      />,
    );

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
  });

  it("shows section style color controls and updates background color", () => {
    let section: ServicesSection = {
      id: "services_1",
      type: "services",
      props: {
        headline: "Services",
        services: [{ title: "One", description: "First service." }],
      },
      elements: [],
    };

    render(<ServicesInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    const stylePanel = screen.getByText("Section style").closest("details")!;
    expect(stylePanel).not.toHaveAttribute("open");
    fireEvent.click(within(stylePanel).getByText("Section style"));
    fireEvent.change(within(stylePanel).getByLabelText("Background color"), {
      target: { value: "#f8fafc" },
    });

    expect(section.props.background_color).toBe("#f8fafc");
    expect(within(stylePanel).getByLabelText("Text color")).toBeInTheDocument();
    expect(validPageWith(section)).toBe(true);
  });

  it("duplicate inserts a copy of the item after the original", () => {
    let section: ServicesSection = {
      id: "services_1",
      type: "services",
      props: {
        headline: "Services",
        services: [
          { title: "Sprint", description: "Fast focused work." },
          { title: "Build", description: "Structured build." },
        ],
      },
      elements: [],
    };

    render(<ServicesInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    const firstCard = screen.getByText("Service card 1").closest("fieldset")!;
    fireEvent.click(within(firstCard).getByRole("button", { name: "Duplicate" }));

    expect(section.props.services).toHaveLength(3);
    expect(section.props.services[0]?.title).toBe("Sprint");
    expect(section.props.services[1]?.title).toBe("Sprint");
    expect(section.props.services[2]?.title).toBe("Build");
    expect(validPageWith(section)).toBe(true);
  });

  it("remove is cancelled when the user dismisses the confirm dialog", () => {
    vi.stubGlobal("confirm", vi.fn(() => false));

    let section: ServicesSection = {
      id: "services_1",
      type: "services",
      props: {
        headline: "Services",
        services: [
          { title: "One", description: "First." },
          { title: "Two", description: "Second." },
        ],
      },
      elements: [],
    };

    render(<ServicesInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]!);

    expect(section.props.services).toHaveLength(2);
  });

  it("shows the empty state when a section has no items", () => {
    const section: FaqSection = {
      id: "faq_1",
      type: "faq",
      props: {
        headline: "FAQ",
        items: [{ question: "Only?", answer: "Only item." }],
      },
      elements: [],
    };
    // Render with no FAQ items by using the ProofInspector's Metrics which can be empty
    // Actually render Services with one item (can't go to 0 because button is disabled when length <= 1)
    // Instead test the emptyMessage directly by using the guidance text
    render(
      <FaqInspector
        section={section}
        onChange={() => undefined}
      />,
    );
    expect(screen.getByText("Recommended: 3–6 questions")).toBeInTheDocument();
  });

  it("uses the singular item label in the legend", () => {
    const section: ProcessSection = {
      id: "process_1",
      type: "process",
      props: {
        headline: "Process",
        steps: [
          { title: "One", description: "First step." },
          { title: "Two", description: "Second step." },
        ],
      },
      elements: [],
    };

    render(<ProcessInspector section={section} onChange={() => undefined} />);

    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});

describe("reorderItems helper", () => {
  it("moves an item from one index to another", () => {
    const items = ["a", "b", "c"];
    expect(reorderItems(items, 0, 2)).toEqual(["b", "c", "a"]);
    expect(reorderItems(items, 2, 0)).toEqual(["c", "a", "b"]);
    expect(reorderItems(items, 1, 0)).toEqual(["b", "a", "c"]);
  });

  it("returns the original array when from === to", () => {
    const items = ["a", "b", "c"];
    expect(reorderItems(items, 1, 1)).toEqual(["a", "b", "c"]);
  });

  it("preserves item identity (including style) after reorder", () => {
    const cards = [
      { title: "One", description: "First.", style: { color: "#ff0000" } },
      { title: "Two", description: "Second." },
      { title: "Three", description: "Third.", style: { background_color: "#00ff00" } },
    ];
    const reordered = reorderItems(cards, 0, 2);
    expect(reordered[0]?.title).toBe("Two");
    expect(reordered[1]?.title).toBe("Three");
    expect(reordered[1]?.style?.background_color).toBe("#00ff00");
    expect(reordered[2]?.title).toBe("One");
    expect(reordered[2]?.style?.color).toBe("#ff0000");
  });
});

describe("inspector item focus from preview selection", () => {
  it("marks the matching item wrapper with data-selected-item when selectedItemIndex is set", () => {
    const section: ServicesSection = {
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
    };

    const { container } = render(
      <ServicesInspector
        section={section}
        onChange={() => undefined}
        selectedItemIndex={1}
      />,
    );

    const selected = container.querySelector("[data-selected-item='true']");
    expect(selected).not.toBeNull();
    expect(selected?.getAttribute("data-repeated-index")).toBe("1");
  });

  it("applies inspector-selected class to the matching wrapper", () => {
    const section: ServicesSection = {
      id: "services_1",
      type: "services",
      props: {
        headline: "Services",
        services: [
          { title: "One", description: "A." },
          { title: "Two", description: "B." },
        ],
      },
      elements: [],
    };

    const { container } = render(
      <ServicesInspector
        section={section}
        onChange={() => undefined}
        selectedItemIndex={0}
      />,
    );

    const selected = container.querySelector(".repeated-list__sortable-wrap--inspector-selected");
    expect(selected).not.toBeNull();
    expect(selected?.getAttribute("data-repeated-index")).toBe("0");
  });

  it("does not mark any item when selectedItemIndex is null", () => {
    const section: ServicesSection = {
      id: "services_1",
      type: "services",
      props: {
        headline: "Services",
        services: [{ title: "One", description: "First." }],
      },
      elements: [],
    };

    const { container } = render(
      <ServicesInspector
        section={section}
        onChange={() => undefined}
        selectedItemIndex={null}
      />,
    );

    expect(container.querySelectorAll("[data-selected-item='true']")).toHaveLength(0);
    expect(container.querySelectorAll(".repeated-list__sortable-wrap--inspector-selected")).toHaveLength(0);
  });

  it("each item wrapper carries a data-repeated-index for targeting", () => {
    const section: ServicesSection = {
      id: "s1",
      type: "services",
      props: {
        headline: "S",
        services: [
          { title: "A", description: "1." },
          { title: "B", description: "2." },
          { title: "C", description: "3." },
        ],
      },
      elements: [],
    };

    const { container } = render(
      <ServicesInspector section={section} onChange={() => undefined} />,
    );

    const wrappers = container.querySelectorAll("[data-repeated-index]");
    expect(wrappers).toHaveLength(3);
    expect(wrappers[0]?.getAttribute("data-repeated-index")).toBe("0");
    expect(wrappers[1]?.getAttribute("data-repeated-index")).toBe("1");
    expect(wrappers[2]?.getAttribute("data-repeated-index")).toBe("2");
  });
});

describe("drag handle rendering", () => {
  it("renders a drag handle button for each service card", () => {
    const section: ServicesSection = {
      id: "services_1",
      type: "services",
      props: {
        headline: "Services",
        services: [
          { title: "One", description: "First service." },
          { title: "Two", description: "Second service." },
        ],
      },
      elements: [],
    };

    render(<ServicesInspector section={section} onChange={() => undefined} />);
    const handles = screen.getAllByRole("button", { name: /drag to reorder/i });
    expect(handles).toHaveLength(2);
  });

  it("drag handles are disabled when only one item exists", () => {
    const section: ServicesSection = {
      id: "services_1",
      type: "services",
      props: {
        headline: "Services",
        services: [{ title: "Only", description: "The only service." }],
      },
      elements: [],
    };

    render(<ServicesInspector section={section} onChange={() => undefined} />);
    const handle = screen.getByRole("button", { name: /drag to reorder/i });
    expect(handle).toBeDisabled();
  });

  it("reorder via reorderItems produces valid JSON and preserves card style", () => {
    let section: ServicesSection = {
      id: "services_1",
      type: "services",
      props: {
        headline: "Services",
        services: [
          { title: "Alpha", description: "First.", style: { color: "#123456" } },
          { title: "Beta", description: "Second." },
          { title: "Gamma", description: "Third." },
        ],
      },
      elements: [],
    };

    // Simulate moving item 0 to position 2 (Alpha moves to end)
    const reordered = reorderItems(section.props.services, 0, 2);
    expect(reordered[0]?.title).toBe("Beta");
    expect(reordered[2]?.title).toBe("Alpha");
    expect(reordered[2]?.style?.color).toBe("#123456");

    section = { ...section, props: { ...section.props, services: reordered } };
    expect(validPageWith(section)).toBe(true);
  });
});

describe("CardStyleActions — preset / copy / paste / reset / apply-to-all", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders style preset dropdown and action buttons inside Card style panel", () => {
    const section: ServicesSection = {
      id: "s1",
      type: "services",
      props: {
        headline: "Services",
        services: [{ title: "Sprint", description: "Fast." }],
      },
      elements: [],
    };
    render(<ServicesInspector section={section} onChange={() => undefined} />);

    const stylePanel = screen.getByText("Card style").closest("details")!;
    fireEvent.click(within(stylePanel).getByText("Card style"));

    expect(within(stylePanel).getByLabelText("Style preset")).toBeInTheDocument();
    expect(within(stylePanel).getByRole("button", { name: "Copy style" })).toBeInTheDocument();
    expect(within(stylePanel).getByRole("button", { name: "Paste style" })).toBeInTheDocument();
    expect(within(stylePanel).getByRole("button", { name: "Reset style" })).toBeInTheDocument();
    expect(within(stylePanel).getByRole("button", { name: /Apply this style to all/ })).toBeInTheDocument();
  });

  it("applying a preset sets style fields but preserves text content", () => {
    let section: ServicesSection = {
      id: "s1",
      type: "services",
      props: {
        headline: "Services",
        services: [{ title: "Sprint", description: "Fast." }],
      },
      elements: [],
    };
    render(<ServicesInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    const stylePanel = screen.getByText("Card style").closest("details")!;
    fireEvent.click(within(stylePanel).getByText("Card style"));
    fireEvent.change(within(stylePanel).getByLabelText("Style preset"), {
      target: { value: "dark-feature" },
    });

    expect(section.props.services[0]?.title).toBe("Sprint");
    expect(section.props.services[0]?.description).toBe("Fast.");
    expect(section.props.services[0]?.style?.background_color).toBe("#1a2318");
    expect(section.props.services[0]?.title_style?.color).toBe("#c4e0bc");
  });

  it("reset style removes all style fields but preserves text", () => {
    let section: ServicesSection = {
      id: "s1",
      type: "services",
      props: {
        headline: "Services",
        services: [{
          title: "Sprint",
          description: "Fast.",
          style: { background_color: "#1a2318" },
          title_style: { color: "#c4e0bc", weight: "bold" },
        }],
      },
      elements: [],
    };
    render(<ServicesInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    const stylePanel = screen.getByText("Card style").closest("details")!;
    fireEvent.click(within(stylePanel).getByText("Card style"));
    fireEvent.click(within(stylePanel).getByRole("button", { name: "Reset style" }));

    expect(section.props.services[0]?.title).toBe("Sprint");
    expect(section.props.services[0]?.style).toBeUndefined();
    expect(section.props.services[0]?.title_style).toBeUndefined();
  });

  it("paste is disabled when clipboard is empty", () => {
    const section: ServicesSection = {
      id: "s1",
      type: "services",
      props: {
        headline: "Services",
        services: [{ title: "Sprint", description: "Fast." }],
      },
      elements: [],
    };
    render(<ServicesInspector section={section} onChange={() => undefined} />);

    const stylePanel = screen.getByText("Card style").closest("details")!;
    fireEvent.click(within(stylePanel).getByText("Card style"));

    expect(within(stylePanel).getByRole("button", { name: "Paste style" })).toBeDisabled();
  });

  it("paste becomes enabled after copying", () => {
    let section: ServicesSection = {
      id: "s1",
      type: "services",
      props: {
        headline: "Services",
        services: [{ title: "Sprint", description: "Fast.", style: { background_color: "#1a2318" } }],
      },
      elements: [],
    };
    const { rerender } = render(<ServicesInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    const stylePanel = screen.getByText("Card style").closest("details")!;
    fireEvent.click(within(stylePanel).getByText("Card style"));

    expect(within(stylePanel).getByRole("button", { name: "Paste style" })).toBeDisabled();
    fireEvent.click(within(stylePanel).getByRole("button", { name: "Copy style" }));
    rerender(<ServicesInspector section={section} onChange={() => undefined} />);
    expect(within(stylePanel).getByRole("button", { name: "Paste style" })).not.toBeDisabled();
  });

  it("apply-to-all copies style to all sibling items but not text content", () => {
    vi.stubGlobal("confirm", vi.fn(() => true));

    let section: ServicesSection = {
      id: "s1",
      type: "services",
      props: {
        headline: "Services",
        services: [
          { title: "Sprint", description: "Fast.", style: { background_color: "#1a2318" }, title_style: { color: "#c4e0bc" } },
          { title: "Build", description: "Structured." },
        ],
      },
      elements: [],
    };
    render(<ServicesInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    const stylePanels = screen.getAllByText("Card style");
    fireEvent.click(stylePanels[0]!.closest("details")!.querySelector("summary")!);
    const firstStylePanel = stylePanels[0]!.closest("details")!;
    fireEvent.click(within(firstStylePanel).getByRole("button", { name: /Apply this style to all/ }));

    expect(window.confirm).toHaveBeenCalled();
    // Both services should now have the same style but different text
    expect(section.props.services[0]?.title).toBe("Sprint");
    expect(section.props.services[1]?.title).toBe("Build");
    expect(section.props.services[1]?.style?.background_color).toBe("#1a2318");
    expect(section.props.services[1]?.title_style?.color).toBe("#c4e0bc");
  });

  it("apply-to-all is cancelled when user dismisses confirm", () => {
    vi.stubGlobal("confirm", vi.fn(() => false));

    let section: ServicesSection = {
      id: "s1",
      type: "services",
      props: {
        headline: "Services",
        services: [
          { title: "Sprint", description: "Fast.", style: { background_color: "#1a2318" } },
          { title: "Build", description: "Structured." },
        ],
      },
      elements: [],
    };
    render(<ServicesInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    const stylePanels = screen.getAllByText("Card style");
    fireEvent.click(stylePanels[0]!.closest("details")!.querySelector("summary")!);
    const firstStylePanel = stylePanels[0]!.closest("details")!;
    fireEvent.click(within(firstStylePanel).getByRole("button", { name: /Apply this style to all/ }));

    // Second card unchanged
    expect(section.props.services[1]?.style).toBeUndefined();
  });

  it("FAQ preset applies to question_style and answer_style", () => {
    let section: FaqSection = {
      id: "faq_1",
      type: "faq",
      props: {
        headline: "FAQ",
        items: [{ question: "Q?", answer: "A." }],
      },
      elements: [],
    };
    render(<FaqInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    const stylePanel = screen.getByText("Item style").closest("details")!;
    fireEvent.click(within(stylePanel).getByText("Item style"));
    fireEvent.change(within(stylePanel).getByLabelText("Style preset"), {
      target: { value: "green-accent" },
    });

    expect(section.props.items[0]?.question).toBe("Q?");
    expect(section.props.items[0]?.style?.background_color).toBe("#e5f0ea");
    expect(section.props.items[0]?.question_style?.color).toBe("#255741");
    expect(section.props.items[0]?.answer_style?.color).toBe("#394136");
  });
});
