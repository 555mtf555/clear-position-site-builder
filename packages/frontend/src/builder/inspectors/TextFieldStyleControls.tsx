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

interface TextFieldStyleControlsProps {
  style?: TextStyle;
  /** Accessible label prefix used in aria-labels (e.g. "title", "description"). */
  fieldLabel?: string;
  onChange: (style: TextStyle | undefined) => void;
}

/**
 * Controls text-only style for a single structured field (title, description,
 * question, answer, etc.). Does not include background_color — that belongs
 * on the card surface (see ItemStyleControls).
 */
export function TextFieldStyleControls({ style, fieldLabel = "field", onChange }: TextFieldStyleControlsProps) {
  const s = style ?? {};

  function update(patch: Partial<TextStyle>) {
    const next: TextStyle = { ...s, ...patch };
    onChange(next);
  }

  return (
    <div className="text-field-style-controls">
      <label>
        Text size
        <select
          value={s.size ?? "default"}
          aria-label={`${fieldLabel} text size`}
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
          aria-label={`${fieldLabel} typeface`}
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
          aria-label={`${fieldLabel} weight`}
          onChange={(e) => update({ weight: e.target.value === "default" ? undefined : e.target.value as TextStyle["weight"] })}
        >
          {WEIGHT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <ColorField
        label="Color"
        value={s.color ?? "#111111"}
        onChange={(color) => update({ color: color === "#111111" ? undefined : color })}
      />
    </div>
  );
}
