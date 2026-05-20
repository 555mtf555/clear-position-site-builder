import type { PageDoc } from "./schemas/page";

export type ImportQaSeverity = "info" | "warning" | "required";
export type ImportQaSource =
  | "import_warning"
  | "missing_asset"
  | "fallback_section"
  | "proof"
  | "brand"
  | "general";

export interface ImportQaChecklistItem {
  id: string;
  label: string;
  description: string;
  severity: ImportQaSeverity;
  source: ImportQaSource;
  completed: boolean;
}

export interface ImportQaChecklist {
  isImported: boolean;
  items: ImportQaChecklistItem[];
  incompleteBlockingItems: ImportQaChecklistItem[];
}

export type ImportQaDashboardStatus = "not_imported" | "ready" | "needs_review" | "blocked_or_warning";

export interface ImportQaStatus {
  status: ImportQaDashboardStatus;
  totalItems: number;
  completedItems: number;
  unresolvedRequiredCount: number;
  unresolvedWarningCount: number;
}

export function createImportQaChecklist(page: PageDoc): ImportQaChecklist {
  const metadata = page.metadata;
  const notes = metadata?.import_notes ?? [];
  const sectionSources = metadata?.import_section_sources ?? [];
  const completed = new Set(metadata?.import_qa?.completed_item_ids ?? []);
  const isImported = Boolean(metadata?.import_source || notes.length || sectionSources.length);
  if (!isImported) {
    return { isImported: false, items: [], incompleteBlockingItems: [] };
  }

  const items: ImportQaChecklistItem[] = [];
  const warningNotes = notes.filter((note) => startsWithLower(note, "validation warning:"));
  const missingAssets = notes.filter((note) => startsWithLower(note, "missing asset:"));
  const brandNotes = notes.filter((note) => note.toLowerCase().includes("brand kit"));
  const proofNotes = notes.filter((note) => /proof|claim|metric|numeric/i.test(note));
  const fallbackSources = sectionSources.filter((source) => source.used_fallback);

  if (warningNotes.length > 0) {
    items.push(item({
      id: "review-import-warnings",
      label: "Review imported validation warnings",
      description: warningNotes.join(" "),
      severity: "required",
      source: "import_warning",
      completed,
    }));
  }

  if (missingAssets.length > 0) {
    items.push(item({
      id: "resolve-missing-assets",
      label: "Confirm missing assets are resolved or deferred",
      description: missingAssets.join(" "),
      severity: "warning",
      source: "missing_asset",
      completed,
    }));
  }

  if (proofNotes.length > 0) {
    items.push(item({
      id: "review-proof-claims",
      label: "Review omitted or simplified proof claims",
      description: proofNotes.join(" "),
      severity: "required",
      source: "proof",
      completed,
    }));
  }

  for (const source of fallbackSources) {
    items.push(item({
      id: `approve-fallback-${source.section_id}`,
      label: `Approve fallback ${source.section_type} section`,
      description: source.note ?? "This section used fallback content and should be edited or explicitly approved.",
      severity: "warning",
      source: "fallback_section",
      completed,
    }));
  }

  items.push(item({
    id: "confirm-hero-cta",
    label: "Confirm hero headline and CTA are accurate",
    description: "Review the first-screen message and primary call to action before export.",
    severity: "required",
    source: "general",
    completed,
  }));

  items.push(item({
    id: "confirm-proof-safe",
    label: "Confirm proof section contains no unverified claims",
    description: "Review testimonials, metrics, and proof language against the packet warnings.",
    severity: "required",
    source: "proof",
    completed,
  }));

  if (sectionSources.length > 0) {
    items.push(item({
      id: "review-section-sources",
      label: "Review section source notes",
      description: `${sectionSources.length} section source note(s) are available in import provenance.`,
      severity: "info",
      source: "general",
      completed,
    }));
  }

  if (brandNotes.length > 0) {
    items.push(item({
      id: "confirm-brand-suggestions",
      label: "Confirm brand suggestions were applied or intentionally ignored",
      description: brandNotes.join(" "),
      severity: "info",
      source: "brand",
      completed,
    }));
  }

  items.push(item({
    id: "confirm-ready-for-export",
    label: "Confirm page is ready for export",
    description: "Final operator review is complete for this imported page.",
    severity: "required",
    source: "general",
    completed,
  }));

  return {
    isImported: true,
    items,
    incompleteBlockingItems: items.filter((check) => !check.completed && check.severity !== "info"),
  };
}

export function createImportQaStatus(page: PageDoc): ImportQaStatus {
  const checklist = createImportQaChecklist(page);
  if (!checklist.isImported) {
    return {
      status: "not_imported",
      totalItems: 0,
      completedItems: 0,
      unresolvedRequiredCount: 0,
      unresolvedWarningCount: 0,
    };
  }

  const unresolvedRequiredCount = checklist.items.filter((item) => !item.completed && item.severity === "required").length;
  const unresolvedWarningCount = checklist.items.filter((item) => !item.completed && item.severity === "warning").length;
  const completedItems = checklist.items.filter((item) => item.completed).length;

  return {
    status: unresolvedRequiredCount > 0
      ? "blocked_or_warning"
      : unresolvedWarningCount > 0
        ? "needs_review"
        : "ready",
    totalItems: checklist.items.length,
    completedItems,
    unresolvedRequiredCount,
    unresolvedWarningCount,
  };
}

function item(input: Omit<ImportQaChecklistItem, "completed"> & { completed: Set<string> }): ImportQaChecklistItem {
  return {
    id: input.id,
    label: input.label,
    description: input.description,
    severity: input.severity,
    source: input.source,
    completed: input.completed.has(input.id),
  };
}

function startsWithLower(value: string, prefix: string): boolean {
  return value.toLowerCase().startsWith(prefix);
}
