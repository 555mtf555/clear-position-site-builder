import type { TextStyle } from "@clear-position/shared";
import { ColorField } from "./fields";

const SIZE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "small", label: "Small" },
  { value: "large", label: "Large" },
  { value: "display", label: "Display" },
] as const;

const FONT_OPTIONS = [
  { value: "brand", label: "Brand (default)" },
  { value: "serif", label: "Serif" },
  { value: "sans", label: "Sans" },
  { value: "display", label: "Display" },
] as const;

const WEIGHT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "medium", label: "Medium" },
  { value: "bold", label: "Bold" },
] as const;

interface ItemStyleControlsProps {
  style?: TextStyle;
  onChange: (style: TextStyle | undefined) => void;
}

export function ItemStyleControls({ style, onChange }: ItemStyleControlsProps) {
  const s = style ?? {};

  function update(patch: Partial<TextStyle>) {
    const next: TextStyle = { ...s, ...patch };
    onChange(next);
  }

  return (
    <div className="item-style-controls">
      <label>
        Text size
        <select
          value={s.size ?? "default"}
          aria-label="Item text size"
          onChange={(e) => update({ size: e.target.value === "default" ? undefined : e.target.value as TextStyle["size"] })}
        >
          {SIZE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        Typeface
        <select
          value={s.font ?? "brand"}
          aria-label="Item typeface"
          onChange={(e) => update({ font: e.target.value === "brand" ? undefined : e.target.value as TextStyle["font"] })}
        >
          {FONT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        Weight
        <select
          value={s.weight ?? "default"}
          aria-label="Item weight"
          onChange={(e) => update({ weight: e.target.value === "default" ? undefined : e.target.value as TextStyle["weight"] })}
        >
          {WEIGHT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <ColorField
        label="Text color"
        value={s.color ?? "#111111"}
        onChange={(color) => update({ color: color === "#111111" ? undefined : color })}
      />
      <p className="section-variant-field__hint">Item style overrides section defaults for this card only.</p>
    </div>
  );
}
