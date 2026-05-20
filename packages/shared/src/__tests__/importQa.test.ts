import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ConsultingPacketImport,
  createImportQaChecklist,
  createImportQaStatus,
  createPageDraftFromConsultingPacket,
} from "..";

function realisticPage() {
  const packet = ConsultingPacketImport.parse(JSON.parse(
    readFileSync(new URL("../../fixtures/consulting-packet-import.realistic.json", import.meta.url), "utf8"),
  ));
  return createPageDraftFromConsultingPacket(packet, { idPrefix: "brightline" });
}

describe("createImportQaChecklist", () => {
  it("returns an empty checklist for non-imported pages", () => {
    const checklist = createImportQaChecklist({ version: 1, sections: [] });

    expect(checklist.isImported).toBe(false);
    expect(checklist.items).toEqual([]);
    expect(checklist.incompleteBlockingItems).toEqual([]);
  });

  it("creates QA items from realistic imported PageDoc metadata", () => {
    const checklist = createImportQaChecklist(realisticPage());

    expect(checklist.isImported).toBe(true);
    expect(checklist.items.map((item) => item.id)).toEqual(expect.arrayContaining([
      "review-import-warnings",
      "resolve-missing-assets",
      "review-proof-claims",
      "confirm-hero-cta",
      "confirm-proof-safe",
      "review-section-sources",
      "confirm-ready-for-export",
    ]));
    expect(checklist.items.some((item) => item.source === "fallback_section")).toBe(true);
    expect(checklist.items.find((item) => item.id === "review-import-warnings")?.description).toMatch(/Unverified numeric claim/);
    expect(checklist.items.find((item) => item.id === "resolve-missing-assets")?.description).toMatch(/Founder photo/);
    expect(checklist.items.find((item) => item.id === "review-proof-claims")?.description).toMatch(/Numeric proof was omitted/);
    expect(checklist.incompleteBlockingItems.length).toBeGreaterThan(0);
  });

  it("marks persisted checklist completions", () => {
    const page = realisticPage();
    page.metadata = {
      ...page.metadata,
      import_qa: { completed_item_ids: ["review-import-warnings", "confirm-hero-cta"] },
    };

    const checklist = createImportQaChecklist(page);

    expect(checklist.items.find((item) => item.id === "review-import-warnings")?.completed).toBe(true);
    expect(checklist.items.find((item) => item.id === "confirm-hero-cta")?.completed).toBe(true);
    expect(checklist.items.find((item) => item.id === "confirm-ready-for-export")?.completed).toBe(false);
  });
});

describe("createImportQaStatus", () => {
  it("returns not_imported for non-imported pages", () => {
    expect(createImportQaStatus({ version: 1, sections: [] })).toEqual({
      status: "not_imported",
      totalItems: 0,
      completedItems: 0,
      unresolvedRequiredCount: 0,
      unresolvedWarningCount: 0,
    });
  });

  it("returns blocked_or_warning for imported pages with unresolved required items", () => {
    const status = createImportQaStatus(realisticPage());

    expect(status.status).toBe("blocked_or_warning");
    expect(status.unresolvedRequiredCount).toBeGreaterThan(0);
    expect(status.unresolvedWarningCount).toBeGreaterThan(0);
  });

  it("returns ready for imported pages with warning and required items complete", () => {
    const page = realisticPage();
    const checklist = createImportQaChecklist(page);
    page.metadata = {
      ...page.metadata,
      import_qa: {
        completed_item_ids: checklist.items
          .filter((item) => item.severity !== "info")
          .map((item) => item.id),
      },
    };

    const status = createImportQaStatus(page);

    expect(status.status).toBe("ready");
    expect(status.unresolvedRequiredCount).toBe(0);
    expect(status.unresolvedWarningCount).toBe(0);
    expect(status.completedItems).toBeGreaterThan(0);
  });
});
