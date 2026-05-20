import type { SectionVariant } from "@clear-position/shared";
import type { SectionPropsPatch, ValidationIssue } from "../usePageEditor";
import { ColorField, issueFor } from "./fields";
import { SectionVariantField } from "./SectionVariantField";

interface SectionStyleControlsProps {
  variant: SectionVariant | undefined;
  props: {
    background_color?: string;
    text_color?: string;
    font_size_scale?: string;
    font_family_preset?: string;
  };
  validationIssues?: ValidationIssue[];
  onChange: (patch: SectionPropsPatch) => void;
  onVariantChange?: (variant: SectionVariant | undefined) => void;
}

export function SectionStyleControls({
  variant,
  props,
  validationIssues = [],
  onChange,
  onVariantChange,
}: SectionStyleControlsProps) {
  return (
    <>
      <SectionVariantField
        value={variant}
        onChange={onVariantChange ?? (() => {})}
      />
      <label>
        Text size
        <select
          value={props.font_size_scale ?? "default"}
          aria-label="Text size"
          onChange={(event) => {
            const val = event.target.value;
            onChange({ font_size_scale: val === "default" ? undefined : val });
          }}
        >
          <option value="default">Default</option>
          <option value="compact">Compact</option>
          <option value="large">Large</option>
          <option value="editorial">Editorial</option>
        </select>
      </label>
      <label>
        Typeface
        <select
          value={props.font_family_preset ?? "brand"}
          aria-label="Typeface"
          onChange={(event) => {
            const val = event.target.value;
            onChange({ font_family_preset: val === "brand" ? undefined : val });
          }}
        >
          <option value="brand">Brand default</option>
          <option value="serif">Serif</option>
          <option value="sans">Sans</option>
          <option value="display">Display</option>
        </select>
      </label>
      <ColorField
        label="Background color"
        value={props.background_color ?? "#ffffff"}
        error={issueFor(validationIssues, "background_color")}
        onChange={(background_color) => onChange({ background_color })}
      />
      <ColorField
        label="Text color"
        value={props.text_color ?? "#111111"}
        error={issueFor(validationIssues, "text_color")}
        onChange={(text_color) => onChange({ text_color })}
      />
      <p className="section-variant-field__hint">
        Typography and colors override Brand Kit defaults for this section only.
      </p>
    </>
  );
}
