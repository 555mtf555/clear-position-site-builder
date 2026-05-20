import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { useState } from "react";
import type { Page, Section, SectionType } from "@clear-position/shared";
import { SECTION_LABELS, SECTION_TYPES } from "./sectionDefaults";
import { TemplatesPanel } from "./TemplatesPanel";

interface SectionListProps {
  page: Page;
  selectedSectionId: string | null;
  isReorderDisabled: boolean;
  onAddSection: (type: SectionType) => void;
  onApplyPageTemplate: (templateId: string) => boolean;
  onDeleteSection: (sectionId: string) => boolean;
  onInsertSectionTemplate: (templateId: string) => boolean;
  onMoveSection: (sectionId: string, direction: "up" | "down") => void;
  onReorderSection: (activeId: string, overId: string) => void;
  onSelectSection: (sectionId: string) => void;
}

export function SectionList({
  page,
  selectedSectionId,
  isReorderDisabled,
  onAddSection,
  onApplyPageTemplate,
  onDeleteSection,
  onInsertSectionTemplate,
  onMoveSection,
  onReorderSection,
  onSelectSection,
}: SectionListProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveSectionId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveSectionId(null);
    if (!event.over || isReorderDisabled) return;
    onReorderSection(String(event.active.id), String(event.over.id));
  }

  return (
    <aside className="builder-sidebar builder-sidebar--left">
      <div className="builder-sidebar__header">
        <span>Page</span>
        <strong>{page.title}</strong>
      </div>
      <div className="add-section-panel">
        <label>
          Add section
          <select
            defaultValue=""
            disabled={isReorderDisabled}
            onChange={(event) => {
              if (!event.target.value) return;
              onAddSection(event.target.value as SectionType);
              event.target.value = "";
            }}
          >
            <option value="" disabled>Select type</option>
            {SECTION_TYPES.map((type) => (
              <option key={type} value={type}>{SECTION_LABELS[type]}</option>
            ))}
          </select>
        </label>
      </div>
      <details className="sidebar-collapsible">
        <summary className="sidebar-collapsible__summary">Templates</summary>
        <TemplatesPanel
          onApplyPageTemplate={onApplyPageTemplate}
          onInsertSectionTemplate={onInsertSectionTemplate}
        />
      </details>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragCancel={() => setActiveSectionId(null)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={page.doc.sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
          <nav className="section-list" aria-label="Sections">
            {page.doc.sections.length === 0 ? (
              <p className="section-list__empty">No sections yet. Use "Add section" above or pick a template to get started.</p>
            ) : (
              <p className="section-list__hint">Drag to reorder</p>
            )}
            {page.doc.sections.map((section, index) => (
              <SortableSectionRow
                key={section.id}
                activeSectionId={activeSectionId}
                index={index}
                isDisabled={isReorderDisabled}
                isSelected={section.id === selectedSectionId}
                section={section}
                sectionCount={page.doc.sections.length}
                onDeleteSection={onDeleteSection}
                onMoveSection={onMoveSection}
                onSelectSection={onSelectSection}
              />
            ))}
          </nav>
        </SortableContext>
      </DndContext>
    </aside>
  );
}

interface SortableSectionRowProps {
  activeSectionId: string | null;
  index: number;
  isDisabled: boolean;
  isSelected: boolean;
  section: Section;
  sectionCount: number;
  onDeleteSection: (sectionId: string) => boolean;
  onMoveSection: (sectionId: string, direction: "up" | "down") => void;
  onSelectSection: (sectionId: string) => void;
}

function SortableSectionRow({
  activeSectionId,
  index,
  isDisabled,
  isSelected,
  section,
  sectionCount,
  onDeleteSection,
  onMoveSection,
  onSelectSection,
}: SortableSectionRowProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id, disabled: isDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={clsx("section-list__row", {
        "section-list__row--dragging": isDragging,
        "section-list__row--drop-target": activeSectionId && activeSectionId !== section.id,
        "section-list__row--disabled": isDisabled,
      })}
      ref={setNodeRef}
      style={style}
    >
      <div className="section-list__main">
        <button
          type="button"
          className="section-list__drag-handle"
          aria-label={`Drag ${SECTION_LABELS[section.type]}`}
          disabled={isDisabled}
          {...attributes}
          {...listeners}
        >
          ::
        </button>
        <button
          type="button"
          className="section-list__select"
          aria-pressed={isSelected}
          onClick={() => onSelectSection(section.id)}
        >
          <span>{index + 1}</span>
          <strong>{SECTION_LABELS[section.type]}</strong>
        </button>
      </div>
      <div className="section-list__actions" aria-label={`${SECTION_LABELS[section.type]} actions`}>
        <button type="button" disabled={index === 0 || isDisabled} onClick={() => onMoveSection(section.id, "up")}>Up</button>
        <button type="button" disabled={index === sectionCount - 1 || isDisabled} onClick={() => onMoveSection(section.id, "down")}>Down</button>
        <button type="button" disabled={isDisabled} onClick={() => onDeleteSection(section.id)}>Delete</button>
      </div>
    </div>
  );
}
