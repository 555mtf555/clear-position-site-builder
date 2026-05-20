import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

  it("keeps explicit section background styles over brand defaults", () => {
    render(<PageRenderer page={page} brandKit={brandKit} />);

    const finalCta = screen.getByRole("heading", { name: "Ready to start?" }).closest("section");
    expect(finalCta).toHaveStyle({ backgroundColor: "#255741" });
  });
});
