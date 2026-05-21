import type { TextStyle } from "@clear-position/shared";
import { ColorField } from "./fields";

interface ItemStyleControlsProps {
  style?: TextStyle;
  onChange: (style: TextStyle | undefined) => void;
}

/**
 * Controls the card/item surface style — currently only background color.
 * Text-level styles (color, size, font, weight) are now set per-field
 * using TextFieldStyleControls.
 */
export function ItemStyleControls({ style, onChange }: ItemStyleControlsProps) {
  const s = style ?? {};

  function update(patch: Partial<TextStyle>) {
    const next: TextStyle = { ...s, ...patch };
    onChange(next);
  }

  return (
    <div className="item-style-controls">
      <ColorField
        label="Card background"
        value={s.background_color ?? "#ffffff"}
        onChange={(background_color) => update({ background_color: background_color === "#ffffff" ? undefined : background_color })}
      />
      <p className="section-variant-field__hint">Sets the card surface color.</p>
    </div>
  );
}
