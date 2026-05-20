import type { SectionVariant } from "@clear-position/shared";

const VARIANT_OPTIONS: Array<{ value: SectionVariant | ""; label: string; description: string }> = [
  { value: "", label: "Default", description: "" },
  { value: "soft-card", label: "Soft cards", description: "Adds lifted card styling." },
  { value: "contrast-band", label: "Contrast band", description: "Uses a darker section background." },
  { value: "centered", label: "Centered", description: "Centers the section introduction." },
  { value: "editorial", label: "Editorial", description: "Uses larger type and more spacing." },
  { value: "minimal", label: "Minimal", description: "Uses a lighter, stripped-down layout." },
];

export function SectionVariantField({
  value,
  onChange,
}: {
  value: SectionVariant | undefined;
  onChange: (variant: SectionVariant | undefined) => void;
}) {
  const selectValue = value ?? "";
  const description = VARIANT_OPTIONS.find((opt) => opt.value === selectValue)?.description;

  return (
    <div className="section-variant-field">
      <label>
        Visual style
        <select
          value={selectValue}
          aria-label="Visual style"
          onChange={(event) => {
            const val = event.target.value;
            onChange(val ? (val as SectionVariant) : undefined);
          }}
        >
          {VARIANT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <p className="section-variant-field__hint">
        Changes the visual treatment without changing the section content.
      </p>
      {description ? (
        <p className="section-variant-field__description">{description}</p>
      ) : null}
    </div>
  );
}
