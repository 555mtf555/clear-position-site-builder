import type { BrandKit, Page, Section } from "@clear-position/shared";
import { FaqSection } from "./sections/FaqSection";
import { FinalCtaSection } from "./sections/FinalCtaSection";
import { HeroSection } from "./sections/HeroSection";
import { ProblemSection } from "./sections/ProblemSection";
import { ProcessSection } from "./sections/ProcessSection";
import { ProofSection } from "./sections/ProofSection";
import { ServicesSection } from "./sections/ServicesSection";
import { SolutionSection } from "./sections/SolutionSection";
import { brandKitToCssVars } from "./brandTheme";

// ── Editor context (absent = public/export mode, no selection UI) ─────────

/** The kind of repeated item that was clicked in the preview. */
export type ItemKind = "card" | "step" | "faq" | "metric";

export interface EditorContext {
  selectedSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  /** Called when a specific card/item is clicked inside a section. */
  onSelectItem?: (sectionId: string, itemKind: ItemKind, itemIndex: number) => void;
}

interface PageRendererProps {
  page: Page;
  brandKit?: BrandKit;
  /** When provided, enables click-to-select in the editor canvas. */
  editorContext?: EditorContext;
}

export function PageRenderer({ page, brandKit, editorContext }: PageRendererProps) {
  return (
    <main className="page-renderer" aria-label={page.title} style={brandKitToCssVars(brandKit)}>
      {page.doc.sections.map((section) =>
        editorContext ? (
          <SelectableSection
            key={section.id}
            section={section}
            isSelected={section.id === editorContext.selectedSectionId}
            onSelect={() => editorContext.onSelectSection(section.id)}
            onSelectItem={editorContext.onSelectItem}
          />
        ) : (
          <SectionRenderer key={section.id} section={section} />
        ),
      )}
    </main>
  );
}

// ── Friendly label shown in the floating hover badge ──────────────────────

const EDITOR_SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  problem: "Problem",
  solution: "Solution",
  process: "Process",
  proof: "Proof",
  services: "Services",
  faq: "FAQ",
  final_cta: "Final CTA",
};

// ── Selectable wrapper (editor mode only) ─────────────────────────────────

function SelectableSection({
  section,
  isSelected,
  onSelect,
  onSelectItem,
}: {
  section: Section;
  isSelected: boolean;
  onSelect: () => void;
  onSelectItem?: EditorContext["onSelectItem"];
}) {
  const label = EDITOR_SECTION_LABELS[section.type] ?? section.type;

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    // Prevent CTA / internal links from navigating in the editor canvas.
    const link = (e.target as Element).closest("a");
    if (link) e.preventDefault();

    onSelect();

    // Visual highlight for the clicked card/item (editor-only, no JSON change).
    const wrapper = e.currentTarget;
    wrapper.querySelectorAll(".editor-item-selected").forEach((el) => {
      el.classList.remove("editor-item-selected");
    });
    const itemEl = (e.target as Element).closest(
      ".section-card, .step-card, .faq-list article, .metric",
    );
    if (itemEl && wrapper.contains(itemEl)) {
      itemEl.classList.add("editor-item-selected");

      // Report item kind and index so the inspector can focus the matching item.
      if (onSelectItem) {
        const parent = itemEl.parentElement;
        const siblings = parent ? Array.from(parent.children) : [];
        const itemIndex = siblings.indexOf(itemEl as HTMLElement);
        if (itemIndex >= 0) {
          const kind: ItemKind =
            itemEl.classList.contains("step-card") ? "step"
            : itemEl.closest(".faq-list") ? "faq"
            : itemEl.classList.contains("metric") ? "metric"
            : "card";
          onSelectItem(section.id, kind, itemIndex);
        }
      }
    }
  }

  return (
    <div
      className={isSelected ? "editor-selectable editor-selected" : "editor-selectable"}
      data-editor-label={label}
      data-section-id={section.id}
      onClick={handleClick}
    >
      <SectionRenderer section={section} />
    </div>
  );
}

function SectionRenderer({ section }: { section: Section }) {
  switch (section.type) {
    case "hero":
      return <HeroSection section={section} />;
    case "problem":
      return <ProblemSection section={section} />;
    case "solution":
      return <SolutionSection section={section} />;
    case "process":
      return <ProcessSection section={section} />;
    case "proof":
      return <ProofSection section={section} />;
    case "services":
      return <ServicesSection section={section} />;
    case "faq":
      return <FaqSection section={section} />;
    case "final_cta":
      return <FinalCtaSection section={section} />;
  }
}
