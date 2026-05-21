import { createImportQaChecklist, type ImportQaChecklistItem, type Page, type Section, type SectionVariant } from "@clear-position/shared";
import { HeroInspector } from "./inspectors/HeroInspector";
import { FaqInspector } from "./inspectors/FaqInspector";
import { FinalCtaInspector } from "./inspectors/FinalCtaInspector";
import { ProblemInspector } from "./inspectors/ProblemInspector";
import { ProcessInspector } from "./inspectors/ProcessInspector";
import { ProofInspector } from "./inspectors/ProofInspector";
import { ServicesInspector } from "./inspectors/ServicesInspector";
import { SolutionInspector } from "./inspectors/SolutionInspector";
import type { PageMetadataPatch, PageMetaPatch, SectionPropsPatch, ValidationIssue } from "./usePageEditor";

interface SelectedPreviewItem {
  sectionId: string;
  itemKind: "card" | "step" | "faq" | "metric";
  itemIndex: number;
}

interface InspectorProps {
  error: string | null;
  isDirty: boolean;
  onReload: () => Promise<boolean>;
  onSave: () => Promise<boolean>;
  onAssetDeleted: (assetId: string) => void;
  onUpdateSection: (patch: SectionPropsPatch) => void;
  onVariantChange?: (variant: SectionVariant | undefined) => void;
  onUpdatePageMeta: (patch: Partial<PageMetaPatch>) => void;
  onUpdatePageMetadata: (patch: Partial<PageMetadataPatch>) => void;
  page: Page;
  saveMessage: string | null;
  saveStatus: "idle" | "saving" | "success" | "error";
  section: Section | null;
  usedAssetIds: Set<string>;
  validationIssues: ValidationIssue[];
  /** Item clicked in the preview canvas — drives focus inside repeated lists. */
  selectedPreviewItem?: SelectedPreviewItem | null;
}

export function Inspector({
  error,
  isDirty,
  onReload,
  onSave,
  onAssetDeleted,
  onUpdateSection,
  onUpdatePageMeta,
  onUpdatePageMetadata,
  onVariantChange,
  page,
  saveMessage,
  saveStatus,
  section,
  usedAssetIds,
  validationIssues,
  selectedPreviewItem,
}: InspectorProps) {
  const sectionIssues = validationIssues.filter((issue) => issue.path.includes(".props."));
  const pageIssues = validationIssues.filter((issue) => !issue.path.includes(".props."));

  // Compute the item index to focus inside a given repeated list kind.
  const previewItemIndex = (kind: SelectedPreviewItem["itemKind"]): number | null => {
    if (!selectedPreviewItem || !section) return null;
    if (selectedPreviewItem.sectionId !== section.id) return null;
    if (selectedPreviewItem.itemKind !== kind) return null;
    return selectedPreviewItem.itemIndex;
  };

  return (
    <aside className="builder-sidebar builder-sidebar--right">
      <div className="inspector-actions">
        <button type="button" className="button button--primary" disabled={!isDirty || saveStatus === "saving"} onClick={() => void onSave()}>
          {saveStatus === "saving" ? "Saving..." : "Save"}
        </button>
        <button type="button" className="button button--ghost" disabled={saveStatus === "saving"} onClick={() => void onReload()}>
          Discard
        </button>
      </div>
      {saveMessage ? <p className="inspector-status inspector-status--success">{saveMessage}</p> : null}
      {error ? <p className="inspector-status inspector-status--error">{error}</p> : null}
      {validationIssues.length > 0 ? (
        <div className="validation-summary" role="alert" aria-label="Validation issues">
          <strong>Fix before saving</strong>
          <ul>
            {validationIssues.map((issue) => (
              <li key={`${issue.path}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <form className="inspector-form inspector-form--page" aria-label="Page settings">
        <h2>Page</h2>
        <label>
          Page title
          <input
            value={page.title}
            aria-invalid={pageIssues.some((issue) => issue.path === "title")}
            onChange={(event) => onUpdatePageMeta({ title: event.target.value })}
          />
        </label>
        <label>
          Page status
          <select
            value={page.status}
            onChange={(event) => onUpdatePageMeta({ status: event.target.value as Page["status"] })}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <details className="inspector-advanced">
          <summary>SEO &amp; metadata</summary>
          <div className="inspector-advanced__body">
            <label>
              Meta title
              <input
                value={page.doc.metadata?.meta_title ?? ""}
                placeholder={page.title}
                onChange={(event) => onUpdatePageMetadata({ meta_title: event.target.value || undefined })}
              />
            </label>
            <label>
              Meta description
              <textarea
                value={page.doc.metadata?.meta_description ?? ""}
                onChange={(event) => onUpdatePageMetadata({ meta_description: event.target.value || undefined })}
              />
            </label>
            <label>
              OG image asset ID
              <input
                value={page.doc.metadata?.og_image_asset_id ?? ""}
                onChange={(event) => onUpdatePageMetadata({ og_image_asset_id: event.target.value || undefined })}
              />
            </label>
          </div>
        </details>
      </form>
      <ImportProvenance page={page} />
      <HandoffQaPanel page={page} onUpdatePageMetadata={onUpdatePageMetadata} />
      {!section ? <p className="inspector-empty">Select a section from the left to edit its content.</p> : null}
      {section?.type === "hero" ? (
        <HeroInspector
          section={section}
          usedAssetIds={usedAssetIds}
          validationIssues={sectionIssues}
          onAssetDeleted={onAssetDeleted}
          onChange={onUpdateSection}
          onVariantChange={onVariantChange}
        />
      ) : null}
      {section?.type === "problem" ? (
        <ProblemInspector section={section} validationIssues={sectionIssues} onChange={onUpdateSection} onVariantChange={onVariantChange} selectedItemIndex={previewItemIndex("card")} />
      ) : null}
      {section?.type === "solution" ? (
        <SolutionInspector section={section} validationIssues={sectionIssues} onChange={onUpdateSection} onVariantChange={onVariantChange} />
      ) : null}
      {section?.type === "process" ? (
        <ProcessInspector section={section} validationIssues={sectionIssues} onChange={onUpdateSection} onVariantChange={onVariantChange} selectedItemIndex={previewItemIndex("step")} />
      ) : null}
      {section?.type === "proof" ? (
        <ProofInspector section={section} validationIssues={sectionIssues} onChange={onUpdateSection} onVariantChange={onVariantChange} selectedItemIndex={previewItemIndex("metric")} />
      ) : null}
      {section?.type === "services" ? (
        <ServicesInspector section={section} validationIssues={sectionIssues} onChange={onUpdateSection} onVariantChange={onVariantChange} selectedItemIndex={previewItemIndex("card")} />
      ) : null}
      {section?.type === "faq" ? (
        <FaqInspector section={section} validationIssues={sectionIssues} onChange={onUpdateSection} onVariantChange={onVariantChange} selectedItemIndex={previewItemIndex("faq")} />
      ) : null}
      {section?.type === "final_cta" ? (
        <FinalCtaInspector
          section={section}
          usedAssetIds={usedAssetIds}
          validationIssues={sectionIssues}
          onAssetDeleted={onAssetDeleted}
          onChange={onUpdateSection}
          onVariantChange={onVariantChange}
        />
      ) : null}
    </aside>
  );
}

function HandoffQaPanel({
  page,
  onUpdatePageMetadata,
}: {
  page: Page;
  onUpdatePageMetadata: (patch: Partial<PageMetadataPatch>) => void;
}) {
  const checklist = createImportQaChecklist(page.doc);
  if (!checklist.isImported) return null;

  const completedIds = new Set(page.doc.metadata?.import_qa?.completed_item_ids ?? []);
  const completedCount = checklist.items.filter((item) => item.completed).length;

  const severityOrder: Record<string, number> = { required: 0, warning: 1, info: 2 };
  const sortedItems = [...checklist.items].sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3),
  );

  const toggleItem = (item: ImportQaChecklistItem, checked: boolean) => {
    const next = new Set(completedIds);
    if (checked) {
      next.add(item.id);
    } else {
      next.delete(item.id);
    }
    onUpdatePageMetadata({
      import_qa: {
        completed_item_ids: Array.from(next).sort(),
      },
    });
  };

  return (
    <details className="handoff-qa">
      <summary className="panel-summary-row">
        <span>Handoff QA</span>
        {checklist.incompleteBlockingItems.length > 0 ? (
          <span className="qa-summary-badge qa-summary-badge--review">
            {checklist.incompleteBlockingItems.length} item{checklist.incompleteBlockingItems.length === 1 ? "" : "s"} need review
          </span>
        ) : (
          <span className="qa-summary-badge qa-summary-badge--ready">Ready</span>
        )}
      </summary>
      <div className="handoff-qa__body">
        <p className="handoff-qa__explainer">
          These checks help confirm imported strategy copy is accurate and safe before export.
        </p>
        <p>
          {completedCount} of {checklist.items.length} review items complete.
          {checklist.incompleteBlockingItems.length > 0
            ? ` ${checklist.incompleteBlockingItems.length} required item${checklist.incompleteBlockingItems.length === 1 ? "" : "s"} still need review.`
            : " All required items reviewed. Ready for export."}
        </p>
        <ul>
          {sortedItems.map((item) => (
            <li key={item.id} className={`handoff-qa__item handoff-qa__item--${item.severity}`}>
              <label>
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(event) => toggleItem(item, event.target.checked)}
                />
                <span>
                  <strong>{item.label}</strong>
                  <small>
                    <Badge>{item.severity}</Badge> <Badge>{item.source}</Badge>
                  </small>
                  <small>{item.description}</small>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function Badge({ children }: { children: string }) {
  return <span className="handoff-qa__badge">{children}</span>;
}

function ImportProvenance({ page }: { page: Page }) {
  const metadata = page.doc.metadata;
  const notes = metadata?.import_notes ?? [];
  const sectionSources = metadata?.import_section_sources ?? [];
  const hasProvenance = Boolean(
    metadata?.import_source ||
    metadata?.import_company_name ||
    metadata?.import_project_name ||
    notes.length ||
    sectionSources.length,
  );

  if (!hasProvenance) return null;

  const missingAssets = notes.filter((note) => note.toLowerCase().startsWith("missing asset:"));
  const warningNotes = notes.filter((note) => note.toLowerCase().startsWith("validation warning:"));
  const brandNotes = notes.filter((note) => note.toLowerCase().includes("brand kit"));
  const otherNotes = notes.filter((note) => !missingAssets.includes(note) && !warningNotes.includes(note) && !brandNotes.includes(note));

  const provenanceSummary = [
    metadata?.import_company_name ? `from ${metadata.import_company_name}` : null,
    sectionSources.length > 0 ? `${sectionSources.length} source note${sectionSources.length === 1 ? "" : "s"}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <details className="import-provenance">
      <summary className="panel-summary-row">
        <span>Import provenance</span>
        {provenanceSummary ? <span className="panel-summary-text">{provenanceSummary}</span> : null}
      </summary>
      <div className="import-provenance__body">
        <dl>
          {metadata?.import_project_name ? (
            <>
              <dt>Project</dt>
              <dd>{metadata.import_project_name}</dd>
            </>
          ) : null}
          {metadata?.import_company_name ? (
            <>
              <dt>Company</dt>
              <dd>{metadata.import_company_name}</dd>
            </>
          ) : null}
          {metadata?.import_source ? (
            <>
              <dt>Source</dt>
              <dd>{metadata.import_source}</dd>
            </>
          ) : null}
        </dl>
        <ProvenanceList title="Warnings" items={warningNotes} />
        <ProvenanceList title="Missing assets" items={missingAssets} />
        <ProvenanceList title="Brand suggestions" items={brandNotes} />
        <ProvenanceList title="Import notes" items={otherNotes} />
        {sectionSources.length > 0 ? (
          <section className="import-provenance__sources" aria-label="Section source notes">
            <strong>Section source notes</strong>
            <ul>
              {sectionSources.map((source) => (
                <li className="import-provenance__source-note" key={source.section_id}>
                  <span>
                    <strong>{source.section_type}</strong>{" "}
                    {source.used_fallback ? "Fallback content" : "Packet content"}
                  </span>
                  <small>Sources: {source.sources.length ? source.sources.join(", ") : "fallback"}</small>
                  {source.note ? <small>{source.note}</small> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </details>
  );
}

function ProvenanceList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <strong>{title}</strong>
      <ul>
        {items.map((item) => <li className="import-provenance__note" key={item}>{item}</li>)}
      </ul>
    </section>
  );
}
