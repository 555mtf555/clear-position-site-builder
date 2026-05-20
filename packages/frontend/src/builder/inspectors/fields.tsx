import type { ReactNode } from "react";
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

export function RepeatedFieldList<T>({
  label,
  itemLabel,
  items,
  createItem,
  onChange,
  renderItem,
  guidance,
  emptyMessage,
}: {
  label: string;
  /** Singular label used in the item legend and confirm dialog. Defaults to auto-singularized `label`. */
  itemLabel?: string;
  items: T[];
  createItem: () => T;
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, updateItem: (nextItem: T) => void) => ReactNode;
  /** Guidance hint shown below the header (e.g. "Recommended: 3 cards"). */
  guidance?: string;
  /** Message shown when the list is empty. */
  emptyMessage?: string;
}) {
  const singular = itemLabel ?? (label.endsWith("s") ? label.slice(0, -1) : label);

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
      <div className="repeated-list__items">
        {items.map((item, index) => (
          <fieldset className="repeated-list__item" key={index}>
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
        ))}
      </div>
    </div>
  );
}
