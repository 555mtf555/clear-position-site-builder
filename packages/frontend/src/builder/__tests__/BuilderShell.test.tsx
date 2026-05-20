import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Page, Site } from "@clear-position/shared";

// Mock heavy sub-components so the test only covers BuilderShell's own logic.
vi.mock("../SectionList", () => ({ SectionList: () => null }));
vi.mock("../Inspector", () => ({ Inspector: () => null }));
vi.mock("../../renderer/PageRenderer", () => ({ PageRenderer: () => null }));

// Mock the editor hook and the getSite API call before importing them.
vi.mock("../usePageEditor", () => ({ usePageEditor: vi.fn() }));
vi.mock("../../api/client", () => ({ getSite: vi.fn() }));

import { BuilderShell } from "../BuilderShell";
import { usePageEditor } from "../usePageEditor";
import { getSite } from "../../api/client";

// ─── shared fixtures ────────────────────────────────────────────────────────

const mockPage: Page = {
  id: "page_home",
  site_id: "site_core",
  slug: "home",
  title: "Home",
  status: "draft",
  doc: { version: 1, sections: [] },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const mockSite: Site = {
  id: "site_core",
  company_id: "co_acme",
  slug: "acme-core",
  name: "Acme Core",
  site_type: "core",
  is_core_site: true,
  parent_site_id: null,
  status: "published",
  linked_site_ids: [],
  brand_overrides: undefined,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function setupEditor(overrides: Record<string, unknown> = {}) {
  vi.mocked(usePageEditor).mockReturnValue({
    loadStatus: "loaded",
    saveStatus: "idle",
    exportStatus: "idle",
    isDirty: false,
    draftPage: mockPage,
    selectedSection: null,
    selectedSectionId: null,
    exportResult: null,
    error: null,
    saveMessage: null,
    validationIssues: [],
    usedAssetIds: new Set(),
    addSection: vi.fn(),
    applyPageTemplate: vi.fn(),
    clearAssetReferences: vi.fn(),
    deleteSection: vi.fn(),
    insertSectionTemplate: vi.fn(),
    loadPage: vi.fn(),
    moveSection: vi.fn(),
    reorderSection: vi.fn(),
    resetDraft: vi.fn(),
    runExport: vi.fn(),
    runSiteExport: vi.fn(),
    save: vi.fn(),
    setSelectedSectionId: vi.fn(),
    updatePageMeta: vi.fn(),
    updatePageMetadata: vi.fn(),
    updateSelectedSectionProps: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof usePageEditor>);
}

// ─── tests ──────────────────────────────────────────────────────────────────

describe("BuilderShell back navigation", () => {
  beforeEach(() => {
    vi.mocked(getSite).mockResolvedValue(mockSite);
    // Ensure a clean URL before each test.
    window.history.pushState({}, "", "/editor/page_home");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/editor/page_home");
  });

  it("renders the back link with the correct label", async () => {
    setupEditor();
    render(<BuilderShell pageId="page_home" />);
    const link = await screen.findByRole("link", { name: /Back to site dashboard/ });
    expect(link).toBeInTheDocument();
  });

  it("uses the ?from= query param as the back link href when present", async () => {
    window.history.pushState({}, "", "/editor/page_home?from=/companies/co_test/sites");
    setupEditor();
    render(<BuilderShell pageId="page_home" />);
    const link = await screen.findByRole("link", { name: /Back to site dashboard/ });
    expect(link).toHaveAttribute("href", "/companies/co_test/sites");
  });

  it("derives the back link from getSite when ?from= is absent", async () => {
    vi.mocked(getSite).mockResolvedValue({ ...mockSite, company_id: "co_derived" });
    setupEditor();
    render(<BuilderShell pageId="page_home" />);
    await waitFor(() => {
      expect(vi.mocked(getSite)).toHaveBeenCalledWith("site_core");
    });
    const link = screen.getByRole("link", { name: /Back to site dashboard/ });
    await waitFor(() => {
      expect(link).toHaveAttribute("href", "/companies/co_derived/sites");
    });
  });

  it("falls back to /companies/co_acme/sites when getSite fails", async () => {
    vi.mocked(getSite).mockRejectedValue(new Error("network error"));
    setupEditor();
    render(<BuilderShell pageId="page_home" />);
    await waitFor(() => {
      expect(vi.mocked(getSite)).toHaveBeenCalledWith("site_core");
    });
    const link = screen.getByRole("link", { name: /Back to site dashboard/ });
    await waitFor(() => {
      expect(link).toHaveAttribute("href", "/companies/co_acme/sites");
    });
  });

  it("shows unsaved-changes confirmation when back is clicked while dirty", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    setupEditor({ isDirty: true });
    render(<BuilderShell pageId="page_home" />);
    const link = await screen.findByRole("link", { name: /Back to site dashboard/ });
    fireEvent.click(link);
    expect(window.confirm).toHaveBeenCalledWith(
      "You have unsaved changes. Leave the editor anyway?",
    );
  });

  it("does not show confirmation when back is clicked without unsaved changes", async () => {
    vi.stubGlobal("confirm", vi.fn());
    setupEditor({ isDirty: false });
    render(<BuilderShell pageId="page_home" />);
    const link = await screen.findByRole("link", { name: /Back to site dashboard/ });
    fireEvent.click(link);
    expect(window.confirm).not.toHaveBeenCalled();
  });
});
