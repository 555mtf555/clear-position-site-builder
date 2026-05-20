import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Page as PageSchema, type Page } from "@clear-position/shared";
import { usePageEditor } from "../usePageEditor";

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
      },
    ],
  },
};

function clonePage(overrides: Partial<Page> = {}): Page {
  return {
    ...structuredClone(page),
    ...overrides,
  };
}

function mockFetchSequence(...responses: Page[]) {
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    const fallback = responses[responses.length - 1] ?? page;
    const responsePage = init?.method === "PUT"
      ? {
          ...fallback,
          ...JSON.parse(String(init.body)) as Partial<Page>,
        }
      : responses.shift() ?? fallback;

    return new Response(JSON.stringify(responsePage), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function loadedEditor() {
  const result = renderHook(() => usePageEditor("page_test"));
  await waitFor(() => expect(result.result.current.loadStatus).toBe("loaded"));
  return result;
}

describe("usePageEditor", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not save a draft that fails the shared page schema", async () => {
    const fetchMock = mockFetchSequence(clonePage());
    const { result } = await loadedEditor();

    act(() => {
      result.current.updateSelectedSectionProps({ headline: "" });
    });

    await waitFor(() => expect(result.current.isDirty).toBe(true));

    let saved = true;
    await act(async () => {
      saved = await result.current.save();
    });

    expect(saved).toBe(false);
    expect(result.current.saveStatus).toBe("error");
    expect(result.current.error).toBe("Fix the validation issues before saving.");
    expect(result.current.validationIssues[0]?.message).toBe("Headline is required.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("updateSelectedSectionVariant sets the variant on the selected section", async () => {
    mockFetchSequence(clonePage());
    const { result } = await loadedEditor();

    act(() => {
      result.current.updateSelectedSectionVariant("soft-card");
    });

    expect(result.current.draftPage?.doc.sections[0]?.variant).toBe("soft-card");
    expect(result.current.isDirty).toBe(true);
  });

  it("updateSelectedSectionVariant clears the variant when set to undefined", async () => {
    const pageWithVariant = clonePage({
      doc: {
        version: 1 as const,
        sections: [{ ...clonePage().doc.sections[0]!, variant: "soft-card" as const }],
      },
    });
    mockFetchSequence(pageWithVariant);
    const { result } = await loadedEditor();

    act(() => {
      result.current.updateSelectedSectionVariant(undefined);
    });

    expect(result.current.draftPage?.doc.sections[0]?.variant).toBeUndefined();
  });

  it("blocks an invalid background color", async () => {
    const fetchMock = mockFetchSequence(clonePage());
    const { result } = await loadedEditor();

    act(() => {
      result.current.updateSelectedSectionProps({ background_color: "blue" });
    });

    let saved = true;
    await act(async () => {
      saved = await result.current.save();
    });

    expect(saved).toBe(false);
    expect(result.current.validationIssues[0]?.message).toBe("Background color must be a hex color like #0f172a.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("blocks CTA text without CTA href", async () => {
    const fetchMock = mockFetchSequence(clonePage());
    const { result } = await loadedEditor();

    act(() => {
      result.current.updateSelectedSectionProps({ cta_text: "Buy now", cta_href: "" });
    });

    let saved = true;
    await act(async () => {
      saved = await result.current.save();
    });

    expect(saved).toBe(false);
    expect(result.current.validationIssues[0]?.message).toBe("CTA href is required when CTA text is set.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("blocks CTA href without CTA text", async () => {
    const fetchMock = mockFetchSequence(clonePage());
    const { result } = await loadedEditor();

    act(() => {
      result.current.updateSelectedSectionProps({ cta_text: "", cta_href: "/buy" });
    });

    let saved = true;
    await act(async () => {
      saved = await result.current.save();
    });

    expect(saved).toBe(false);
    expect(result.current.validationIssues[0]?.message).toBe("CTA text is required when CTA href is set.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("saves a valid hero edit", async () => {
    const fetchMock = mockFetchSequence(clonePage());
    const { result } = await loadedEditor();

    act(() => {
      result.current.updateSelectedSectionProps({
        headline: "Updated headline",
        background_color: "#0f172a",
      });
      result.current.updatePageMeta({ title: "Updated Home", status: "published" });
    });

    let saved = false;
    await act(async () => {
      saved = await result.current.save();
    });

    expect(saved).toBe(true);
    expect(result.current.saveStatus).toBe("success");
    expect(result.current.isDirty).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "PUT" });
  });

  it("reset restores server-loaded data after confirmation", async () => {
    mockFetchSequence(clonePage(), clonePage());
    vi.stubGlobal("confirm", vi.fn(() => true));
    const { result } = await loadedEditor();

    act(() => {
      result.current.updateSelectedSectionProps({ headline: "Local only" });
    });
    expect(result.current.draftPage?.doc.sections[0]?.props.headline).toBe("Local only");

    await act(async () => {
      await result.current.resetDraft();
    });

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(result.current.draftPage?.doc.sections[0]?.props.headline).toBe("Original headline");
    expect(result.current.isDirty).toBe(false);
  });

  it("add section creates valid JSON", async () => {
    mockFetchSequence(clonePage());
    const { result } = await loadedEditor();

    act(() => {
      result.current.addSection("faq");
    });

    expect(result.current.draftPage?.doc.sections.at(-1)?.type).toBe("faq");
    expect(PageSchema.safeParse(result.current.draftPage).success).toBe(true);
  });

  it("inserting a section template appends valid JSON and marks dirty", async () => {
    mockFetchSequence(clonePage());
    const { result } = await loadedEditor();

    act(() => {
      result.current.insertSectionTemplate("faq-common-questions");
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.draftPage?.doc.sections.at(-1)?.type).toBe("faq");
    expect(PageSchema.safeParse(result.current.draftPage).success).toBe(true);
  });

  it("applying a full page template replaces sections and marks dirty", async () => {
    mockFetchSequence(clonePage());
    vi.stubGlobal("confirm", vi.fn(() => true));
    const { result } = await loadedEditor();

    act(() => {
      result.current.applyPageTemplate("landing-page");
    });

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(result.current.isDirty).toBe(true);
    expect(result.current.draftPage?.doc.sections.map((section) => section.type)).toEqual([
      "hero",
      "solution",
      "proof",
      "faq",
      "final_cta",
    ]);
    expect(PageSchema.safeParse(result.current.draftPage).success).toBe(true);
  });

  it("move section preserves valid JSON", async () => {
    mockFetchSequence(clonePage({
      doc: {
        version: 1,
        sections: [
          page.doc.sections[0]!,
          {
            id: "solution_1",
            type: "solution",
            props: { headline: "Solution", body: "Body", bullets: [] },
            elements: [],
          },
        ],
      },
    }));
    const { result } = await loadedEditor();

    act(() => {
      result.current.moveSection("solution_1", "up");
    });

    expect(result.current.draftPage?.doc.sections[0]?.id).toBe("solution_1");
    expect(PageSchema.safeParse(result.current.draftPage).success).toBe(true);
  });

  it("drag reorder preserves selected section, marks dirty, and keeps valid JSON", async () => {
    mockFetchSequence(clonePage({
      doc: {
        version: 1,
        sections: [
          page.doc.sections[0]!,
          {
            id: "solution_1",
            type: "solution",
            props: { headline: "Solution", body: "Body", bullets: [] },
            elements: [],
          },
        ],
      },
    }));
    const { result } = await loadedEditor();

    act(() => {
      result.current.setSelectedSectionId("solution_1");
      result.current.reorderSection("solution_1", "hero_1");
    });

    expect(result.current.selectedSectionId).toBe("solution_1");
    expect(result.current.isDirty).toBe(true);
    expect(result.current.draftPage?.doc.sections.map((section) => section.id)).toEqual(["solution_1", "hero_1"]);
    expect(PageSchema.safeParse(result.current.draftPage).success).toBe(true);
  });

  it("invalid drag reorder is safely ignored", async () => {
    mockFetchSequence(clonePage({
      doc: {
        version: 1,
        sections: [
          page.doc.sections[0]!,
          {
            id: "solution_1",
            type: "solution",
            props: { headline: "Solution", body: "Body", bullets: [] },
            elements: [],
          },
        ],
      },
    }));
    const { result } = await loadedEditor();

    act(() => {
      result.current.reorderSection("missing", "hero_1");
    });

    expect(result.current.isDirty).toBe(false);
    expect(result.current.draftPage?.doc.sections.map((section) => section.id)).toEqual(["hero_1", "solution_1"]);
    expect(PageSchema.safeParse(result.current.draftPage).success).toBe(true);
  });

  it("delete section preserves valid JSON", async () => {
    mockFetchSequence(clonePage({
      doc: {
        version: 1,
        sections: [
          page.doc.sections[0]!,
          {
            id: "faq_1",
            type: "faq",
            props: {
              headline: "FAQ",
              items: [{ question: "Q?", answer: "A." }],
            },
            elements: [],
          },
        ],
      },
    }));
    vi.stubGlobal("confirm", vi.fn(() => true));
    const { result } = await loadedEditor();

    act(() => {
      result.current.deleteSection("faq_1");
    });

    expect(result.current.draftPage?.doc.sections.map((section) => section.id)).not.toContain("faq_1");
    expect(PageSchema.safeParse(result.current.draftPage).success).toBe(true);
  });

  it("warns before exporting an imported page with unresolved handoff QA", async () => {
    const importedPage = clonePage({
      doc: {
        ...page.doc,
        metadata: {
          import_source: "consulting_packet",
          import_notes: [
            "Validation warning: Proof metric is unverified.",
            "Missing asset: Founder headshot",
          ],
          import_section_sources: [
            {
              section_id: "hero_1",
              section_type: "hero",
              sources: ["homepage_headlines"],
              used_fallback: false,
            },
            {
              section_id: "faq_1",
              section_type: "faq",
              sources: [],
              used_fallback: true,
              note: "FAQ used fallback content.",
            },
          ],
        },
      },
    });
    const fetchMock = mockFetchSequence(importedPage);
    vi.stubGlobal("confirm", vi.fn(() => false));
    const { result } = await loadedEditor();

    let exported = true;
    await act(async () => {
      exported = await result.current.runExport();
    });

    expect(exported).toBe(false);
    expect(confirm).toHaveBeenCalledWith("This imported page has unresolved handoff QA items. Export anyway?");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.exportStatus).toBe("idle");
  });
});
