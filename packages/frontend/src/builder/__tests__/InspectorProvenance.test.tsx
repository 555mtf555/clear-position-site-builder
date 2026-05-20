import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  ConsultingPacketImport,
  createPageDraftFromConsultingPacket,
  type Page,
} from "@clear-position/shared";
import { Inspector } from "../Inspector";

const importedPage: Page = {
  id: "page_imported",
  site_id: "site_core",
  slug: "imported-home",
  title: "Imported Home",
  status: "draft",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  doc: {
    version: 1,
    metadata: {
      import_source: "consulting_packet",
      import_company_name: "Northstar Advisory",
      import_project_name: "Homepage Draft",
      import_notes: [
        "Validation warning: Revenue claim is unverified.",
        "Missing asset: Founder headshot",
        "Packet includes brand kit suggestions; review manually before applying.",
      ],
      import_section_sources: [
        {
          section_id: "hero_1",
          section_type: "hero",
          sources: ["homepage_headlines", "cta_options"],
          used_fallback: false,
          note: "Hero generated from packet headline and CTA fields.",
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
    sections: [],
  },
};

describe("Inspector import provenance", () => {
  it("displays import provenance and section source notes for imported pages", () => {
    const updateMetadata = vi.fn();
    render(
      <Inspector
        error={null}
        isDirty={false}
        onAssetDeleted={vi.fn()}
        onReload={vi.fn()}
        onSave={vi.fn()}
        onUpdatePageMeta={vi.fn()}
        onUpdatePageMetadata={updateMetadata}
        onUpdateSection={vi.fn()}
        page={importedPage}
        saveMessage={null}
        saveStatus="idle"
        section={null}
        usedAssetIds={new Set()}
        validationIssues={[]}
      />,
    );

    const provenance = screen.getByText("Import provenance").closest("details");
    expect(provenance).not.toBeNull();
    expect(within(provenance!).getByText("Homepage Draft")).toBeInTheDocument();
    expect(within(provenance!).getByText("Northstar Advisory")).toBeInTheDocument();
    expect(within(provenance!).getByText("Validation warning: Revenue claim is unverified.")).toBeInTheDocument();
    expect(within(provenance!).getByText("Missing asset: Founder headshot")).toBeInTheDocument();
    expect(within(provenance!).getByText("Packet includes brand kit suggestions; review manually before applying.")).toBeInTheDocument();
    expect(within(provenance!).getByText("Section source notes")).toBeInTheDocument();
    expect(within(provenance!).getByText(/Packet content/)).toBeInTheDocument();
    expect(within(provenance!).getByText(/Fallback content/)).toBeInTheDocument();
    expect(within(provenance!).getByText("Sources: homepage_headlines, cta_options")).toBeInTheDocument();
    expect(within(provenance!).getByText("Sources: fallback")).toBeInTheDocument();

    const qa = screen.getByText("Handoff QA").closest("details");
    expect(qa).not.toBeNull();
    expect(within(qa!).getByText("Review imported validation warnings")).toBeInTheDocument();
    expect(within(qa!).getByText("Confirm missing assets are resolved or deferred")).toBeInTheDocument();

    fireEvent.click(within(qa!).getByRole("checkbox", { name: /Review imported validation warnings/i }));
    expect(updateMetadata).toHaveBeenCalledWith({
      import_qa: { completed_item_ids: ["review-import-warnings"] },
    });
  });

  it("displays provenance generated from the realistic handoff fixture", () => {
    const packet = ConsultingPacketImport.parse(JSON.parse(
      readFileSync(resolve(process.cwd(), "../shared/fixtures/consulting-packet-import.realistic.json"), "utf8"),
    ));
    const page: Page = {
      ...importedPage,
      doc: createPageDraftFromConsultingPacket(packet, { idPrefix: "brightline" }),
    };

    render(
      <Inspector
        error={null}
        isDirty={false}
        onAssetDeleted={vi.fn()}
        onReload={vi.fn()}
        onSave={vi.fn()}
        onUpdatePageMeta={vi.fn()}
        onUpdatePageMetadata={vi.fn()}
        onUpdateSection={vi.fn()}
        page={page}
        saveMessage={null}
        saveStatus="idle"
        section={null}
        usedAssetIds={new Set()}
        validationIssues={[]}
      />,
    );

    const provenance = screen.getByText("Import provenance").closest("details");
    expect(provenance).not.toBeNull();
    expect(within(provenance!).getByText("Brightline Operations Website Messaging Sprint")).toBeInTheDocument();
    expect(within(provenance!).getByText("Brightline Operations")).toBeInTheDocument();
    expect(within(provenance!).getByText(/Unverified numeric claim/)).toBeInTheDocument();
    expect(within(provenance!).getByText(/Founder photo/)).toBeInTheDocument();
    expect(within(provenance!).getByText("Section source notes")).toBeInTheDocument();
    expect(within(provenance!).getByText("Sources: homepage_headlines, positioning_statement, cta_options")).toBeInTheDocument();
  });

  it("shows a purpose explanation in the Handoff QA panel", () => {
    render(
      <Inspector
        error={null}
        isDirty={false}
        onAssetDeleted={vi.fn()}
        onReload={vi.fn()}
        onSave={vi.fn()}
        onUpdatePageMeta={vi.fn()}
        onUpdatePageMetadata={vi.fn()}
        onUpdateSection={vi.fn()}
        page={importedPage}
        saveMessage={null}
        saveStatus="idle"
        section={null}
        usedAssetIds={new Set()}
        validationIssues={[]}
      />,
    );

    const qa = screen.getByText("Handoff QA").closest("details");
    expect(qa).not.toBeNull();
    expect(within(qa!).getByText(/These checks help confirm/)).toBeInTheDocument();
    expect(within(qa!).getByText(/review items complete/)).toBeInTheDocument();
  });

  it("lists required QA items before info items", () => {
    render(
      <Inspector
        error={null}
        isDirty={false}
        onAssetDeleted={vi.fn()}
        onReload={vi.fn()}
        onSave={vi.fn()}
        onUpdatePageMeta={vi.fn()}
        onUpdatePageMetadata={vi.fn()}
        onUpdateSection={vi.fn()}
        page={importedPage}
        saveMessage={null}
        saveStatus="idle"
        section={null}
        usedAssetIds={new Set()}
        validationIssues={[]}
      />,
    );

    const qa = screen.getByText("Handoff QA").closest("details");
    expect(qa).not.toBeNull();
    const checkboxes = within(qa!).getAllByRole("checkbox");
    const requiredIdx = checkboxes.findIndex((cb) =>
      cb.closest("li")?.classList.contains("handoff-qa__item--required"),
    );
    const infoIdx = checkboxes.findIndex((cb) =>
      cb.closest("li")?.classList.contains("handoff-qa__item--info"),
    );
    expect(requiredIdx).toBeGreaterThanOrEqual(0);
    expect(infoIdx).toBeGreaterThanOrEqual(0);
    expect(requiredIdx).toBeLessThan(infoIdx);
  });

  it("Import provenance is collapsed by default", () => {
    render(
      <Inspector
        error={null}
        isDirty={false}
        onAssetDeleted={vi.fn()}
        onReload={vi.fn()}
        onSave={vi.fn()}
        onUpdatePageMeta={vi.fn()}
        onUpdatePageMetadata={vi.fn()}
        onUpdateSection={vi.fn()}
        page={importedPage}
        saveMessage={null}
        saveStatus="idle"
        section={null}
        usedAssetIds={new Set()}
        validationIssues={[]}
      />,
    );

    const provenance = screen.getByText("Import provenance").closest("details");
    expect(provenance).not.toBeNull();
    expect(provenance).not.toHaveAttribute("open");
  });

  it("Import provenance summary includes company name", () => {
    render(
      <Inspector
        error={null}
        isDirty={false}
        onAssetDeleted={vi.fn()}
        onReload={vi.fn()}
        onSave={vi.fn()}
        onUpdatePageMeta={vi.fn()}
        onUpdatePageMetadata={vi.fn()}
        onUpdateSection={vi.fn()}
        page={importedPage}
        saveMessage={null}
        saveStatus="idle"
        section={null}
        usedAssetIds={new Set()}
        validationIssues={[]}
      />,
    );

    expect(screen.getByText(/from Northstar Advisory/)).toBeInTheDocument();
  });

  it("Handoff QA panel is collapsed by default", () => {
    render(
      <Inspector
        error={null}
        isDirty={false}
        onAssetDeleted={vi.fn()}
        onReload={vi.fn()}
        onSave={vi.fn()}
        onUpdatePageMeta={vi.fn()}
        onUpdatePageMetadata={vi.fn()}
        onUpdateSection={vi.fn()}
        page={importedPage}
        saveMessage={null}
        saveStatus="idle"
        section={null}
        usedAssetIds={new Set()}
        validationIssues={[]}
      />,
    );

    const qa = screen.getByText("Handoff QA").closest("details");
    expect(qa).not.toBeNull();
    expect(qa).not.toHaveAttribute("open");
  });

  it("QA summary badge shows unresolved item count when items need review", () => {
    render(
      <Inspector
        error={null}
        isDirty={false}
        onAssetDeleted={vi.fn()}
        onReload={vi.fn()}
        onSave={vi.fn()}
        onUpdatePageMeta={vi.fn()}
        onUpdatePageMetadata={vi.fn()}
        onUpdateSection={vi.fn()}
        page={importedPage}
        saveMessage={null}
        saveStatus="idle"
        section={null}
        usedAssetIds={new Set()}
        validationIssues={[]}
      />,
    );

    const qa = screen.getByText("Handoff QA").closest("details");
    expect(qa).not.toBeNull();
    expect(within(qa!).getAllByText(/need review/).length).toBeGreaterThan(0);
  });

  it("does not show handoff QA for non-imported pages", () => {
    render(
      <Inspector
        error={null}
        isDirty={false}
        onAssetDeleted={vi.fn()}
        onReload={vi.fn()}
        onSave={vi.fn()}
        onUpdatePageMeta={vi.fn()}
        onUpdatePageMetadata={vi.fn()}
        onUpdateSection={vi.fn()}
        page={{ ...importedPage, doc: { version: 1, sections: [] } }}
        saveMessage={null}
        saveStatus="idle"
        section={null}
        usedAssetIds={new Set()}
        validationIssues={[]}
      />,
    );

    expect(screen.queryByText("Handoff QA")).not.toBeInTheDocument();
    expect(screen.queryByText("Import provenance")).not.toBeInTheDocument();
  });

  it("HandoffQA and ImportProvenance summaries carry the panel-summary-row class that provides chevron arrows", () => {
    render(
      <Inspector
        error={null}
        isDirty={false}
        onAssetDeleted={vi.fn()}
        onReload={vi.fn()}
        onSave={vi.fn()}
        onUpdatePageMeta={vi.fn()}
        onUpdatePageMetadata={vi.fn()}
        onUpdateSection={vi.fn()}
        page={importedPage}
        saveMessage={null}
        saveStatus="idle"
        section={null}
        usedAssetIds={new Set()}
        validationIssues={[]}
      />,
    );

    const qaSummary = screen.getByText("Handoff QA").closest("summary");
    expect(qaSummary).not.toBeNull();
    expect(qaSummary).toHaveClass("panel-summary-row");

    const provenanceSummary = screen.getByText("Import provenance").closest("summary");
    expect(provenanceSummary).not.toBeNull();
    expect(provenanceSummary).toHaveClass("panel-summary-row");
  });
});
