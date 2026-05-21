import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ValidationIssue } from "../usePageEditor";

export interface InspectorBaseProps<TProps> {
  validationIssues?: ValidationIssue[];
  onChange: (patch: Partial<TProps>) => void;
}

export function issueFor(issues: ValidationIssue[], field: string): string | null {
  return issues.find((issue) => issue.path.endsWith(`props.${field}`))?.message ?? null;
}

export function issueForPath(issues: ValidationIssue[], pathPart: string): string | null {
  return issues.find((issue) => issue.path.includes(pathPart))?.message ?? null;
}

export function TextField({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input value={value} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

export function UrlField(props: {
  label: string;
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
}) {
  return <TextField {...props} />;
}

export function ColorField({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
}) {
  // The color picker only accepts a valid 6-digit hex; fall back to black while the user types.
  const safePickerValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
  return (
    <div className="color-field">
      <span className="color-field__label">{label}</span>
      <div className="color-field__inputs">
        <input
          type="color"
          value={safePickerValue}
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          type="text"
          value={value}
          aria-label={label}
          aria-invalid={Boolean(error)}
          placeholder="#000000"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  error,
  rows = 3,
  onChange,
}: {
  label: string;
  value: string;
  error?: string | null;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <textarea value={value} aria-invalid={Boolean(error)} rows={rows} onChange={(event) => onChange(event.target.value)} />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

export function replaceItem<T>(items: T[], index: number, nextItem: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
}

export function removeItem<T>(items: T[], index: number): T[] {
  return items.filter((_item, itemIndex) => itemIndex !== index);
}

export function moveItem<T>(items: T[], index: number, direction: "up" | "down"): T[] {
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  if (item === undefined) return items;
  next.splice(nextIndex, 0, item);
  return next;
}

/** Reorders an array by moving the item at `fromIndex` to `toIndex`. */
export function reorderItems<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items;
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  if (item === undefined) return items;
  next.splice(toIndex, 0, item);
  return next;
}

export function duplicateItem<T>(items: T[], index: number): T[] {
  const item = items[index];
  if (item === undefined) return items;
  const copy = structuredClone(item) as T;
  const next = [...items];
  next.splice(index + 1, 0, copy);
  return next;
}

function isItemPopulated(item: unknown): boolean {
  if (typeof item === "string") return item.trim().length > 0;
  if (item !== null && typeof item === "object") {
    return Object.values(item as Record<string, unknown>).some(
      (v) => typeof v === "string" && (v as string).trim().length > 0,
    );
  }
  return false;
}

// ── Sortable wrapper for each repeated item ───────────────────────────────

interface SortableItemRowProps {
  id: string;
  activeId: string | null;
  disabled: boolean;
  dragLabel: string;
  isInspectorSelected: boolean;
  children: ReactNode;
}

function SortableItemRow({ id, activeId, disabled, dragLabel, isInspectorSelected, children }: SortableItemRowProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-repeated-index={id}
      data-selected-item={isInspectorSelected ? "true" : undefined}
      className={clsx("repeated-list__sortable-wrap", {
        "repeated-list__sortable-wrap--dragging": isDragging,
        "repeated-list__sortable-wrap--over": activeId && activeId !== id && !isDragging,
        "repeated-list__sortable-wrap--inspector-selected": isInspectorSelected,
      })}
    >
      <button
        type="button"
        className="repeated-list__drag-handle"
        aria-label={dragLabel}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <span aria-hidden="true">⠿</span>
        Drag to reorder
      </button>
      {children}
    </div>
  );
}

// ── RepeatedFieldList with drag-and-drop reordering ───────────────────────

export function RepeatedFieldList<T>({
  label,
  itemLabel,
  items,
  createItem,
  onChange,
  renderItem,
  guidance,
  emptyMessage,
  selectedItemIndex,
}: {
  label: string;
  /** Singular label used in the item legend and confirm dialog. Defaults to auto-singularized `label`. */
  itemLabel?: string;
  items: T[];
  createItem: () => NoInfer<T>;
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, updateItem: (nextItem: T) => void) => ReactNode;
  /** Guidance hint shown below the header (e.g. "Recommended: 3 cards"). */
  guidance?: string;
  /** Message shown when the list is empty. */
  emptyMessage?: string;
  /** When set, the matching item is highlighted and scrolled into view. */
  selectedItemIndex?: number | null;
}) {
  const singular = itemLabel ?? (label.endsWith("s") ? label.slice(0, -1) : label);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll the selected item into view when selectedItemIndex changes.
  useEffect(() => {
    if (selectedItemIndex == null || !containerRef.current) return;
    const el = containerRef.current.querySelector(
      `[data-repeated-index="${selectedItemIndex}"]`,
    );
    if (el) {
      try {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } catch {
        // jsdom / older environments may not support scrollIntoView options.
      }
    }
  }, [selectedItemIndex]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Use string-index IDs (e.g. "0","1","2") — rebuilt on each render after reorder.
  const itemIds = items.map((_, i) => String(i));

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onChange(reorderItems(items, Number(active.id), Number(over.id)));
  }

  function handleRemove(index: number) {
    const item = items[index];
    if (item !== undefined && isItemPopulated(item)) {
      if (!window.confirm(`Remove this ${singular.toLowerCase()}?`)) return;
    }
    onChange(removeItem(items, index));
  }

  return (
    <div className="repeated-list">
      <div className="repeated-list__header">
        <strong>{label}</strong>
        <button type="button" className="button" onClick={() => onChange([...items, createItem()])}>
          Add item
        </button>
      </div>
      {guidance ? <p className="repeated-list__guidance">{guidance}</p> : null}
      {items.length === 0 ? (
        <p className="repeated-list__empty">
          {emptyMessage ?? `No ${label.toLowerCase()} yet. Add one to get started.`}
        </p>
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="repeated-list__items" ref={containerRef}>
            {items.map((item, index) => (
              <SortableItemRow
                key={index}
                id={String(index)}
                activeId={activeId}
                disabled={items.length <= 1}
                dragLabel={`Drag to reorder ${singular.toLowerCase()}`}
                isInspectorSelected={index === selectedItemIndex}
              >
                <fieldset className="repeated-list__item">
                  <legend>{singular} {index + 1}</legend>
                  {renderItem(item, index, (nextItem) => onChange(replaceItem(items, index, nextItem)))}
                  <div className="repeated-list__actions">
                    <button type="button" disabled={index === 0} onClick={() => onChange(moveItem(items, index, "up"))}>
                      Move up
                    </button>
                    <button type="button" disabled={index === items.length - 1} onClick={() => onChange(moveItem(items, index, "down"))}>
                      Move down
                    </button>
                    <button type="button" onClick={() => onChange(duplicateItem(items, index))}>
                      Duplicate
                    </button>
                    <button type="button" disabled={items.length <= 1} onClick={() => handleRemove(index)}>
                      Remove
                    </button>
                  </div>
                </fieldset>
              </SortableItemRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
