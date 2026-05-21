import { useCallback, useEffect, useMemo, useState } from "react";
import { createImportQaStatus } from "@clear-position/shared";
import { Inspector } from "./Inspector";
import { SectionList } from "./SectionList";
import { usePageEditor } from "./usePageEditor";
import type { ItemKind } from "../renderer/PageRenderer";
import { PageRenderer } from "../renderer/PageRenderer";
import { getSite } from "../api/client";

interface SelectedPreviewItem {
  sectionId: string;
  itemKind: ItemKind;
  itemIndex: number;
}

interface BuilderShellProps {
  pageId: string;
}

/**
 * Reads the optional `?from=` query param the dashboard adds when linking into
 * the editor. Only allows same-origin relative paths so the back link can't be
 * abused to send users to an arbitrary URL.
 */
function safeBackLink(): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("from");
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export function BuilderShell({ pageId }: BuilderShellProps) {
  const editor = usePageEditor(pageId);
  const fromParam = useMemo(safeBackLink, []);
  const [derivedSiteHref, setDerivedSiteHref] = useState<string | null>(null);
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<SelectedPreviewItem | null>(null);

  // When there is no ?from= param, derive the dashboard URL from the page's site_id.
  useEffect(() => {
    if (fromParam || !editor.draftPage?.site_id) return;
    getSite(editor.draftPage.site_id)
      .then((site) => setDerivedSiteHref(`/companies/${site.company_id}/sites`))
      .catch(() => setDerivedSiteHref("/companies/co_acme/sites"));
  }, [fromParam, editor.draftPage?.site_id]);

  const backHref = fromParam ?? derivedSiteHref ?? "/companies/co_acme/sites";

  const handleBackClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!editor.isDirty) return;
      event.preventDefault();
      if (window.confirm("You have unsaved changes. Leave the editor anyway?")) {
        window.location.href = backHref;
      }
    },
    [editor.isDirty, backHref],
  );

  if (editor.loadStatus === "loading" || editor.loadStatus === "idle") {
    return <div className="app-shell">Loading editor...</div>;
  }

  if (editor.loadStatus === "error" || !editor.draftPage) {
    return <div className="app-shell app-shell--error">Editor failed: {editor.error}</div>;
  }

  const qaStatus = createImportQaStatus(editor.draftPage.doc);
  const unresolved = qaStatus.unresolvedRequiredCount + qaStatus.unresolvedWarningCount;
  const reviewText = editor.isDirty
    ? "Unsaved changes — save before export"
    : unresolved > 0
      ? `Review status: ${unresolved} QA item${unresolved === 1 ? "" : "s"} need review`
      : "Review status: Ready";
  const reviewHintClass = editor.isDirty
    ? "export-hint export-hint--warn"
    : unresolved > 0
      ? "export-hint export-hint--review"
      : "export-hint";

  return (
    <div className="builder-shell">
      <SectionList
        page={editor.draftPage}
        selectedSectionId={editor.selectedSectionId}
        onAddSection={editor.addSection}
        onApplyPageTemplate={editor.applyPageTemplate}
        onDeleteSection={editor.deleteSection}
        onInsertSectionTemplate={editor.insertSectionTemplate}
        onMoveSection={editor.moveSection}
        onReorderSection={editor.reorderSection}
        onSelectSection={editor.setSelectedSectionId}
        isReorderDisabled={editor.saveStatus === "saving" || editor.loadStatus !== "loaded"}
      />
      <main className="builder-preview">
        <header className="builder-preview__bar">
          <div>
            <a
              href={backHref}
              className="builder-preview__back"
              title="Return to the site dashboard to create pages, import packets, or export the site."
              onClick={handleBackClick}
            >
              ← Back to site dashboard
            </a>
            <strong>{editor.draftPage.title}</strong>
            <span aria-live="polite">{editor.isDirty ? "Unsaved changes" : "No unsaved changes"}</span>
          </div>
          <div className="builder-preview__actions">
            <button type="button" className="button" disabled={editor.exportStatus === "exporting"} onClick={() => void editor.runExport()}>
              {editor.exportStatus === "exporting" ? "Exporting..." : "Export page"}
            </button>
            <button type="button" className="button" disabled={editor.exportStatus === "exporting"} onClick={() => void editor.runSiteExport()}>
              {editor.exportStatus === "exporting" ? "Exporting..." : "Export site"}
            </button>
            <a href={`/preview/${editor.draftPage.id}`}>Open preview</a>
          </div>
        </header>
        <p className={reviewHintClass} aria-label="Review status">
          {reviewText}
        </p>
        {editor.exportResult ? (
          <div className="export-status">
            <strong>Export saved locally</strong>
            <span>{editor.exportResult.export_path}</span>
            <span>
              {editor.exportResult.files_generated.length} file{editor.exportResult.files_generated.length === 1 ? "" : "s"} generated (HTML, CSS, and any images).
              To publish, upload this folder to any static web host.
            </span>
            {editor.exportResult.warnings.length > 0 ? (
              <ul>
                {editor.exportResult.warnings.map((warning, index) => (
                  <li key={`${warning.code}-${index}`}>
                    <code>{warning.code}</code> {warning.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <div className="builder-preview__canvas">
          {editor.draftPage.doc.sections.length === 0 ? (
            <div className="canvas-empty" aria-label="Empty page">
              <p className="canvas-empty__title">This page has no sections yet</p>
              <p className="canvas-empty__hint">
                Use <strong>Add section</strong> in the left panel to add content,
                or pick a template to start with a complete layout.
              </p>
            </div>
          ) : null}
          <PageRenderer
            page={editor.draftPage}
            editorContext={{
              selectedSectionId: editor.selectedSectionId,
              onSelectSection: (id) => {
                editor.setSelectedSectionId(id);
                setSelectedPreviewItem(null);
              },
              onSelectItem: (sectionId, itemKind, itemIndex) => {
                editor.setSelectedSectionId(sectionId);
                setSelectedPreviewItem({ sectionId, itemKind, itemIndex });
              },
              onMoveSection: editor.moveSection,
              onDeleteSection: (sectionId) => {
                editor.deleteSection(sectionId);
              },
              selectedPreviewItem,
            }}
          />
        </div>
      </main>
      <Inspector
        error={editor.error}
        isDirty={editor.isDirty}
        onReload={editor.resetDraft}
        onSave={editor.save}
        onAssetDeleted={editor.clearAssetReferences}
        onUpdatePageMeta={editor.updatePageMeta}
        onUpdatePageMetadata={editor.updatePageMetadata}
        onUpdateSection={editor.updateSelectedSectionProps}
        onVariantChange={editor.updateSelectedSectionVariant}
        page={editor.draftPage}
        saveMessage={editor.saveMessage}
        saveStatus={editor.saveStatus}
        section={editor.selectedSection}
        usedAssetIds={editor.usedAssetIds}
        validationIssues={editor.validationIssues}
        selectedPreviewItem={selectedPreviewItem}
      />
    </div>
  );
}
