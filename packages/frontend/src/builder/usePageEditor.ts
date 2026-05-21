import { useCallback, useEffect, useMemo, useState } from "react";
import type { Page, Section, SectionType } from "@clear-position/shared";
import { Page as PageSchema, createImportQaChecklist } from "@clear-position/shared";
import { exportPage, exportSite, getPage, updatePage, type ExportResult } from "../api/client";
import { createDefaultSection } from "./sectionDefaults";
import { reorderPageSections } from "./reorderSections";
import { instantiateTemplateSections, pageTemplates, sectionTemplates, validateTemplatePage } from "./templates";

type LoadStatus = "idle" | "loading" | "loaded" | "error";
type SaveStatus = "idle" | "saving" | "success" | "error";
type ExportStatus = "idle" | "exporting" | "success" | "error";

export interface ValidationIssue {
  path: string;
  message: string;
}

export type SectionPropsPatch = Record<string, unknown>;
export type PageMetaPatch = Pick<Page, "title" | "status">;
export type PageMetadataPatch = NonNullable<Page["doc"]["metadata"]>;

function formatPath(path: Array<string | number>): string {
  return path.length > 0 ? path.join(".") : "page";
}

function friendlyMessage(path: string, message: string): string {
  if (path.endsWith("headline")) return "Headline is required.";
  if (path.endsWith("background_color")) return "Background color must be a hex color like #0f172a.";
  if (path.endsWith("text_color")) return "Text color must be a hex color like #0f172a.";
  if (path.endsWith("cta_href")) return "CTA href is required when CTA text is set.";
  if (path.endsWith("cta_text")) return "CTA text is required when CTA href is set.";
  if (path === "title") return "Page title is required.";
  return message;
}

export function validatePageForSave(page: Page): ValidationIssue[] {
  const result = PageSchema.safeParse(page);
  if (result.success) return [];
  return result.error.issues.map((issue) => {
    const path = formatPath(issue.path);
    return {
      path,
      message: friendlyMessage(path, issue.message),
    };
  });
}

export function hasUnresolvedImportQa(page: Page): boolean {
  const checklist = createImportQaChecklist(page.doc);
  return checklist.incompleteBlockingItems.length > 0;
}

export function usePageEditor(pageId: string) {
  const [originalPage, setOriginalPage] = useState<Page | null>(null);
  const [draftPage, setDraftPage] = useState<Page | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const validationIssues = useMemo(() => {
    return draftPage ? validatePageForSave(draftPage) : [];
  }, [draftPage]);

  const loadPage = useCallback(async () => {
    setLoadStatus("loading");
    setError(null);
    setSaveMessage(null);
    try {
      const page = await getPage(pageId);
      setOriginalPage(page);
      setDraftPage(page);
      setSelectedSectionId(page.doc.sections[0]?.id ?? null);
      setLoadStatus("loaded");
      setSaveStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The page could not be loaded.");
      setLoadStatus("error");
    }
  }, [pageId]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const isDirty = useMemo(() => {
    if (!originalPage || !draftPage) return false;
    return (
      originalPage.title !== draftPage.title ||
      originalPage.status !== draftPage.status ||
      JSON.stringify(originalPage.doc) !== JSON.stringify(draftPage.doc)
    );
  }, [draftPage, originalPage]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const selectedSection = useMemo(() => {
    return draftPage?.doc.sections.find((section) => section.id === selectedSectionId) ?? null;
  }, [draftPage, selectedSectionId]);

  const updatePageMeta = useCallback((patch: Partial<PageMetaPatch>) => {
    setDraftPage((current) => (current ? { ...current, ...patch } : current));
    setSaveStatus("idle");
    setSaveMessage(null);
    setError(null);
  }, []);

  const updatePageMetadata = useCallback((patch: Partial<PageMetadataPatch>) => {
    setDraftPage((current) => current
      ? {
          ...current,
          doc: {
            ...current.doc,
            metadata: {
              ...current.doc.metadata,
              ...patch,
            },
          },
        }
      : current);
    setSaveStatus("idle");
    setSaveMessage(null);
    setError(null);
  }, []);

  const markEditing = useCallback(() => {
    setSaveStatus("idle");
    setSaveMessage(null);
    setError(null);
  }, []);

  const updateSelectedSectionProps = useCallback((patch: SectionPropsPatch) => {
    setDraftPage((current) => {
      if (!current || !selectedSectionId) return current;

      return {
        ...current,
        doc: {
          ...current.doc,
          sections: current.doc.sections.map((section) => {
            if (section.id !== selectedSectionId) return section;
            return {
              ...section,
              props: {
                ...(section.props as Record<string, unknown>),
                ...patch,
              },
            } as Section;
          }),
        },
      };
    });
    markEditing();
  }, [markEditing, selectedSectionId]);

  const addSection = useCallback((type: SectionType) => {
    const section = createDefaultSection(type);
    setDraftPage((current) => current
      ? {
          ...current,
          doc: {
            ...current.doc,
            sections: [...current.doc.sections, section],
          },
        }
      : current);
    setSelectedSectionId(section.id);
    markEditing();
  }, [markEditing]);

  const insertSectionTemplate = useCallback((templateId: string) => {
    const template = sectionTemplates.find((item) => item.id === templateId);
    if (!template) {
      setError("Template could not be found.");
      return false;
    }

    let nextSectionId: string | null = null;
    let applied = false;
    setDraftPage((current) => {
      if (!current) return current;
      const sections = instantiateTemplateSections([template.section], current.doc.sections.map((section) => section.id));
      if (!sections) {
        setError("Template is not valid and was not applied.");
        return current;
      }
      const nextPage = validateTemplatePage(current, [...current.doc.sections, ...sections]);
      if (!nextPage) {
        setError("Template would create invalid page JSON and was not applied.");
        return current;
      }
      nextSectionId = sections[0]?.id ?? null;
      applied = true;
      return nextPage;
    });

    if (applied) {
      if (nextSectionId) setSelectedSectionId(nextSectionId);
      markEditing();
    }
    return applied;
  }, [markEditing]);

  const applyPageTemplate = useCallback((templateId: string) => {
    const template = pageTemplates.find((item) => item.id === templateId);
    if (!template) {
      setError("Template could not be found.");
      return false;
    }

    if (draftPage && (isDirty || draftPage.doc.sections.length > 0)) {
      const confirmed = window.confirm("Replace the current page sections with this template?");
      if (!confirmed) return false;
    }

    let firstSectionId: string | null = null;
    let applied = false;
    setDraftPage((current) => {
      if (!current) return current;
      const sections = instantiateTemplateSections(template.sections);
      if (!sections) {
        setError("Template is not valid and was not applied.");
        return current;
      }
      const nextPage = validateTemplatePage(current, sections);
      if (!nextPage) {
        setError("Template would create invalid page JSON and was not applied.");
        return current;
      }
      firstSectionId = sections[0]?.id ?? null;
      applied = true;
      return nextPage;
    });

    if (applied) {
      setSelectedSectionId(firstSectionId);
      markEditing();
    }
    return applied;
  }, [draftPage, isDirty, markEditing]);

  const moveSection = useCallback((sectionId: string, direction: "up" | "down") => {
    setDraftPage((current) => {
      if (!current) return current;
      const index = current.doc.sections.findIndex((section) => section.id === sectionId);
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.doc.sections.length) return current;

      const sections = [...current.doc.sections];
      const [section] = sections.splice(index, 1);
      if (!section) return current;
      sections.splice(nextIndex, 0, section);

      return {
        ...current,
        doc: {
          ...current.doc,
          sections,
        },
      };
    });
    markEditing();
  }, [markEditing]);

  const reorderSection = useCallback((activeId: string, overId: string) => {
    let changed = false;

    setDraftPage((current) => {
      if (!current || saveStatus === "saving") return current;
      const nextPage = reorderPageSections(current, activeId, overId);
      if (!nextPage) return current;
      changed = JSON.stringify(nextPage.doc.sections.map((section) => section.id))
        !== JSON.stringify(current.doc.sections.map((section) => section.id));
      return nextPage;
    });

    if (changed) {
      markEditing();
    }
  }, [markEditing, saveStatus]);

  const deleteSection = useCallback((sectionId: string) => {
    if (!window.confirm("Delete this section?")) return false;

    setDraftPage((current) => {
      if (!current) return current;
      const sections = current.doc.sections.filter((section) => section.id !== sectionId);
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(sections[0]?.id ?? null);
      }
      return {
        ...current,
        doc: {
          ...current.doc,
          sections,
        },
      };
    });
    markEditing();
    return true;
  }, [markEditing, selectedSectionId]);

  const clearAssetReferences = useCallback((assetId: string) => {
    setDraftPage((current) => {
      if (!current) return current;
      let changed = false;
      const sections = current.doc.sections.map((section) => {
        const props = section.props as Record<string, unknown>;
        if (props.background_image_asset_id !== assetId) return section;
        changed = true;
        return {
          ...section,
          props: {
            ...props,
            background_image_asset_id: undefined,
          },
        } as Section;
      });
      return changed ? { ...current, doc: { ...current.doc, sections } } : current;
    });
    markEditing();
  }, [markEditing]);

  const usedAssetIds = useMemo(() => {
    if (!draftPage) return new Set<string>();
    return new Set(draftPage.doc.sections
      .map((section) => (section.props as Record<string, unknown>).background_image_asset_id)
      .filter((assetId): assetId is string => typeof assetId === "string" && assetId.length > 0));
  }, [draftPage]);

  const resetDraft = useCallback(async () => {
    if (isDirty && !window.confirm("Discard your unsaved changes and reload the page from the server?")) {
      return false;
    }

    await loadPage();
    return true;
  }, [isDirty, loadPage]);

  const save = useCallback(async () => {
    if (!draftPage) return false;

    const issues = validatePageForSave(draftPage);
    if (issues.length > 0) {
      setError("Fix the validation issues before saving.");
      setSaveStatus("error");
      setSaveMessage(null);
      return false;
    }

    setSaveStatus("saving");
    setError(null);
    setSaveMessage(null);
    try {
      const savedPage = await updatePage(draftPage.id, {
        title: draftPage.title,
        status: draftPage.status,
        doc: draftPage.doc,
      });
      setOriginalPage(savedPage);
      setDraftPage(savedPage);
      setSaveStatus("success");
      setSaveMessage("Changes saved.");
      return true;
    } catch {
      setError("The page could not be saved. Please try again.");
      setSaveStatus("error");
      return false;
    }
  }, [draftPage]);

  const runExport = useCallback(async () => {
    if (!draftPage) return false;
    if (isDirty) {
      setError("Save the page before exporting so the static files match your latest edits.");
      setExportStatus("error");
      setExportResult(null);
      return false;
    }
    if (hasUnresolvedImportQa(draftPage) && !window.confirm("This imported page has unresolved handoff QA items. Export anyway?")) {
      setExportStatus("idle");
      return false;
    }

    setExportStatus("exporting");
    setExportResult(null);
    setError(null);
    try {
      const result = await exportPage(draftPage.id);
      setExportResult(result);
      setExportStatus("success");
      return true;
    } catch {
      setError("The page could not be exported. Save the page and try again.");
      setExportStatus("error");
      return false;
    }
  }, [draftPage, isDirty]);

  const runSiteExport = useCallback(async () => {
    if (!draftPage) return false;
    if (isDirty) {
      setError("Save the page before exporting the site so the static files match your latest edits.");
      setExportStatus("error");
      setExportResult(null);
      return false;
    }
    if (hasUnresolvedImportQa(draftPage) && !window.confirm("This imported page has unresolved handoff QA items. Export site anyway?")) {
      setExportStatus("idle");
      return false;
    }

    setExportStatus("exporting");
    setExportResult(null);
    setError(null);
    try {
      const result = await exportSite(draftPage.site_id);
      setExportResult(result);
      setExportStatus("success");
      return true;
    } catch {
      setError("The site could not be exported. Save the page and try again.");
      setExportStatus("error");
      return false;
    }
  }, [draftPage, isDirty]);

  /** Updates props of a section identified by ID (does not require selectedSectionId). */
  const updateSectionPropById = useCallback((sectionId: string, patch: SectionPropsPatch) => {
    setDraftPage((current) => {
      if (!current) return current;
      return {
        ...current,
        doc: {
          ...current.doc,
          sections: current.doc.sections.map((section) => {
            if (section.id !== sectionId) return section;
            return {
              ...section,
              props: { ...(section.props as Record<string, unknown>), ...patch } as typeof section.props,
            } as Section;
          }),
        },
      };
    });
    markEditing();
  }, [markEditing]);

  /** Updates a single field on one item inside an array prop of a section. */
  const updateSectionItemInArray = useCallback(
    (sectionId: string, arrayField: string, itemIndex: number, patch: Record<string, unknown>) => {
      setDraftPage((current) => {
        if (!current) return current;
        return {
          ...current,
          doc: {
            ...current.doc,
            sections: current.doc.sections.map((section) => {
              if (section.id !== sectionId) return section;
              const arr = (section.props as Record<string, unknown>)[arrayField];
              if (!Array.isArray(arr)) return section;
              const newArr = (arr as unknown[]).map((item, i) =>
                i === itemIndex ? { ...(item as Record<string, unknown>), ...patch } : item,
              );
              return {
                ...section,
                props: { ...(section.props as Record<string, unknown>), [arrayField]: newArr } as typeof section.props,
              } as Section;
            }),
          },
        };
      });
      markEditing();
    },
    [markEditing],
  );

  const updateSelectedSectionVariant = useCallback((variant: Section["variant"]) => {
    setDraftPage((current) => {
      if (!current || !selectedSectionId) return current;
      return {
        ...current,
        doc: {
          ...current.doc,
          sections: current.doc.sections.map((section) =>
            section.id !== selectedSectionId
              ? section
              : ({ ...section, variant }) as Section,
          ),
        },
      };
    });
    markEditing();
  }, [markEditing, selectedSectionId]);

  return {
    draftPage,
    error,
    exportResult,
    exportStatus,
    isDirty,
    loadPage,
    loadStatus,
    resetDraft,
    runExport,
    runSiteExport,
    save,
    saveMessage,
    saveStatus,
    selectedSection,
    selectedSectionId,
    addSection,
    applyPageTemplate,
    deleteSection,
    insertSectionTemplate,
    moveSection,
    reorderSection,
    clearAssetReferences,
    setSelectedSectionId,
    updatePageMeta,
    updatePageMetadata,
    updateSelectedSectionProps,
    updateSelectedSectionVariant,
    updateSectionPropById,
    updateSectionItemInArray,
    usedAssetIds,
    validationIssues,
  };
}
