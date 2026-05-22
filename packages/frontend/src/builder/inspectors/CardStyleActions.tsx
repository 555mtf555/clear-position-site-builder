import { CARD_PRESETS, canPasteSnapshot } from "./itemStylePresets";
import type { ItemStyleSnapshot } from "./itemStylePresets";

interface CardStyleActionsProps {
  kind: "card" | "faq" | "metric";
  clipboard: ItemStyleSnapshot | null;
  /** Plural label for items in this list, e.g. "cards", "steps", "items". */
  itemsLabel?: string;
  onApplyPreset: (presetId: string) => void;
  onCopyStyle: () => void;
  onPasteStyle: () => void;
  onResetStyle: () => void;
  onApplyToAll: () => void;
}

export function CardStyleActions({
  kind,
  clipboard,
  itemsLabel = "items",
  onApplyPreset,
  onCopyStyle,
  onPasteStyle,
  onResetStyle,
  onApplyToAll,
}: CardStyleActionsProps) {
  const pasteable = canPasteSnapshot(clipboard, kind);
  const pasteTitle =
    !pasteable && clipboard != null
      ? "Copied style is for a different item type."
      : undefined;

  return (
    <div className="card-style-actions">
      <label>
        Style preset
        <select
          value=""
          aria-label="Style preset"
          onChange={(e) => {
            if (e.target.value) onApplyPreset(e.target.value);
          }}
        >
          <option value="">— choose a preset —</option>
          {CARD_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <p className="section-variant-field__hint">
        Apply a starting style, then customize fields below.
      </p>
      <div className="card-style-actions__buttons">
        <button
          type="button"
          className="card-style-actions__btn"
          onClick={onCopyStyle}
        >
          Copy style
        </button>
        <button
          type="button"
          className="card-style-actions__btn"
          disabled={!pasteable}
          title={pasteTitle}
          onClick={onPasteStyle}
        >
          Paste style
        </button>
        <button
          type="button"
          className="card-style-actions__btn card-style-actions__btn--reset"
          onClick={onResetStyle}
        >
          Reset style
        </button>
      </div>
      <button
        type="button"
        className="card-style-actions__apply-all"
        onClick={onApplyToAll}
      >
        Apply this style to all {itemsLabel} in this section
      </button>
    </div>
  );
}
