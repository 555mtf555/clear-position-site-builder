import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import type { HeroSection } from "@clear-position/shared";
import { HeroInspector } from "../HeroInspector";
import type { SectionPropsPatch } from "../../usePageEditor";

const initialSection: HeroSection = {
  id: "hero_1",
  type: "hero",
  props: {
    headline: "Original headline",
    subhead: "Original subhead",
    cta_text: "Start",
    cta_href: "/start",
    background_color: "#f6f7f3",
    background_size: "cover",
    background_position: "center",
    text_align: "left",
  },
  elements: [],
};

function Harness() {
  const [section, setSection] = useState(initialSection);

  function update(patch: SectionPropsPatch) {
    setSection((current) => ({
      ...current,
      props: {
        ...current.props,
        ...patch,
      },
    }));
  }

  return <HeroInspector section={section} onChange={update} />;
}

describe("HeroInspector", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates the local hero draft", () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));
    render(<Harness />);

    fireEvent.change(screen.getByLabelText("Headline"), {
      target: { value: "Updated headline" },
    });
    fireEvent.change(screen.getByLabelText("Text alignment"), {
      target: { value: "center" },
    });

    expect(screen.getByLabelText("Headline")).toHaveValue("Updated headline");
    expect(screen.getByLabelText("Text alignment")).toHaveValue("center");
  });

  it("assigns and clears a background image asset", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([
      {
        id: "asset_123",
        company_id: "co_acme",
        filename: "asset_123.png",
        original_filename: "hero.png",
        mime_type: "image/png",
        size_bytes: 12,
        storage_path: "uploads/asset_123.png",
        url: "/uploads/asset_123.png",
        width: 2,
        height: 2,
        alt_text: "Hero image",
        created_at: "2026-01-01T00:00:00Z",
      },
    ]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));

    let section = initialSection;
    const { rerender } = render(<HeroInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Hero image" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Hero image" }));

    expect(section.props.background_image_asset_id).toBe("asset_123");

    rerender(<HeroInspector section={section} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(section.props.background_image_asset_id).toBeUndefined();
  });

  it("shows a friendly upload error on failed upload", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        return new Response(JSON.stringify({ error: "Image upload failed. Please try again." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Harness />);

    const input = screen.getByLabelText("Upload image");
    const file = new File(["not really an image"], "bad.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText("Image upload failed. Please try again.")).toBeInTheDocument();
  });

  it("variant select is inside the Background & style collapsible section", () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));
    render(<Harness />);
    const details = screen.getByText("Background & style").closest("details");
    expect(details).not.toBeNull();
    expect(within(details!).getByLabelText("Visual style")).toBeInTheDocument();
  });

  it("groups background and style controls in a collapsible section closed by default", () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));
    render(<Harness />);
    const section = screen.getByText("Background & style").closest("details");
    expect(section).not.toBeNull();
    expect(section).not.toHaveAttribute("open");
  });

  it("deleting the selected asset clears the background image", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "DELETE") {
        return new Response(null, { status: 204 });
      }
      return new Response(JSON.stringify([
        {
          id: "asset_123",
          company_id: "co_acme",
          filename: "asset_123.png",
          original_filename: "hero.png",
          mime_type: "image/png",
          size_bytes: 12,
          storage_path: "uploads/asset_123.png",
          url: "/uploads/asset_123.png",
          width: 2,
          height: 2,
          alt_text: "Hero image",
          created_at: "2026-01-01T00:00:00Z",
        },
      ]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("confirm", vi.fn(() => true));

    let section: HeroSection = {
      ...initialSection,
      props: {
        ...initialSection.props,
        background_image_asset_id: "asset_123",
      },
    };
    render(<HeroInspector section={section} usedAssetIds={new Set(["asset_123"])} onChange={(patch) => {
      section = { ...section, props: { ...section.props, ...patch } };
    }} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(section.props.background_image_asset_id).toBeUndefined());
    expect(confirm).toHaveBeenCalledWith("This image is used on the current page. Delete it and clear those references?");
  });
});
