import { createContext, useContext, useRef, useEffect, type CSSProperties } from "react";

// ── Inline edit path: identifies which JSON field is being edited ─────────

export interface InlineEditPath {
  sectionId: string;
  /** Top-level prop field name, e.g. "headline", "subhead", "cta_text". */
  field: string;
  /** For array props: the array field name, e.g. "services", "problems", "items". */
  arrayField?: string;
  /** For array props: zero-based index of the item. */
  itemIndex?: number;
  /** If true, the field cannot be saved empty — cancel instead. */
  required?: boolean;
  /** If true, render a textarea; Enter alone does not commit (use Ctrl+Enter). */
  multiline?: boolean;
}

export interface InlineEditState {
  path: InlineEditPath;
}

interface InlineEditContextValue {
  activeEdit: InlineEditState | null;
  startEdit: (path: InlineEditPath, currentValue: string) => void;
  commitEdit: (value: string) => void;
  cancelEdit: () => void;
}

export const InlineEditContext = createContext<InlineEditContextValue | null>(null);

// ── Uncontrolled inline editor (input / textarea) ─────────────────────────

function InlineInputEditor({
  initialValue,
  path,
  className,
  style,
  onCommit,
  onCancel,
}: {
  initialValue: string;
  path: InlineEditPath;
  className?: string;
  style?: CSSProperties;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  function commit() {
    const raw = ref.current?.value ?? "";
    const trimmed = raw.trim();
    if (path.required && !trimmed) {
      onCancel();
      return;
    }
    onCommit(trimmed.length > 0 ? trimmed : initialValue);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    } else if (!path.multiline && e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (path.multiline && e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      commit();
    }
  }

  const baseClass = `inline-editor ${path.multiline ? "inline-editor--multiline" : "inline-editor--input"} ${className ?? ""}`.trim();

  if (path.multiline) {
    return (
      <textarea
        ref={ref}
        defaultValue={initialValue}
        className={baseClass}
        style={style}
        rows={3}
        aria-label={`Edit ${path.field}`}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <input
      ref={ref}
      type="text"
      defaultValue={initialValue}
      className={baseClass}
      style={style}
      aria-label={`Edit ${path.field}`}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

// ── EditableText: renders editable text in editor mode ────────────────────

export function EditableText({
  children,
  tag: Tag,
  className,
  style,
  path,
  href,
}: {
  children: string;
  tag: "h1" | "h2" | "h3" | "p" | "a" | "span";
  className?: string;
  style?: CSSProperties;
  path: InlineEditPath;
  /** For <a> tags: the href rendered when not editing (never edited). */
  href?: string;
}) {
  const ctx = useContext(InlineEditContext);

  // ── Non-editor mode: render normally ──────────────────────────────────
  if (!ctx) {
    if (Tag === "a" && href) {
      return <a className={className} style={style} href={href}>{children}</a>;
    }
    const PlainTag = Tag;
    return <PlainTag className={className} style={style}>{children}</PlainTag>;
  }

  const isActive =
    ctx.activeEdit !== null &&
    ctx.activeEdit.path.sectionId === path.sectionId &&
    ctx.activeEdit.path.field === path.field &&
    ctx.activeEdit.path.arrayField === path.arrayField &&
    ctx.activeEdit.path.itemIndex === path.itemIndex;

  // ── Active edit: show inline input ────────────────────────────────────
  if (isActive) {
    return (
      <InlineInputEditor
        initialValue={children}
        path={path}
        className={className}
        style={style}
        onCommit={ctx.commitEdit}
        onCancel={ctx.cancelEdit}
      />
    );
  }

  // ── Editor mode, not active: editable-on-click ────────────────────────
  const ctxSafe = ctx; // ctx is non-null here (checked above)
  function handleClick(e: React.MouseEvent) {
    e.preventDefault(); // stop <a> navigation
    e.stopPropagation(); // stop section selection
    ctxSafe.startEdit(path, children);
  }

  const editableClass = `${className ?? ""} inline-editable`.trim();

  if (Tag === "a" && href) {
    return (
      <a
        className={editableClass}
        style={style}
        href={href}
        title="Click to edit text"
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }

  const EditTag = Tag;
  return (
    <EditTag
      className={editableClass}
      style={style}
      title="Click to edit"
      onClick={handleClick}
    >
      {children}
    </EditTag>
  );
}
