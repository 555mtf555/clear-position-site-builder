import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { Page } from "@clear-position/shared";
import { SectionList } from "../SectionList";

const emptyPage: Page = {
  id: "page_test",
  site_id: "site_test",
  slug: "home",
  title: "Test Page",
  status: "draft",
  doc: { version: 1, sections: [] },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const noop = () => {};
const noopBool = () => false;

function renderSectionList(page: Page = emptyPage) {
  return render(
    <SectionList
      page={page}
      selectedSectionId={null}
      isReorderDisabled={false}
      onAddSection={noop}
      onApplyPageTemplate={noopBool}
      onDeleteSection={noopBool}
      onInsertSectionTemplate={noopBool}
      onMoveSection={noop}
      onReorderSection={noop}
      onSelectSection={noop}
    />,
  );
}

describe("SectionList", () => {
  it("renders the sections navigation landmark", () => {
    renderSectionList();
    expect(screen.getByRole("navigation", { name: "Sections" })).toBeInTheDocument();
  });

  it("shows an empty state when the page has no sections", () => {
    renderSectionList();
    expect(screen.getByText(/No sections yet/)).toBeInTheDocument();
  });

  it("renders the Add section control", () => {
    renderSectionList();
    expect(screen.getByLabelText("Add section")).toBeInTheDocument();
  });

  it("wraps the Templates panel in a collapsible group that is closed by default", () => {
    renderSectionList();
    const summary = screen.getByText("Templates");
    const details = summary.closest("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");
  });

  it("Templates summary carries the sidebar-collapsible__summary class that provides the chevron arrow", () => {
    renderSectionList();
    const summary = screen.getByText("Templates");
    expect(summary).toHaveClass("sidebar-collapsible__summary");
  });
});
