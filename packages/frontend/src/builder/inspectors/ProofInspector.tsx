import type { ProofSection, SectionVariant } from "@clear-position/shared";
import type { SectionPropsPatch, ValidationIssue } from "../usePageEditor";
import { issueForPath, RepeatedFieldList, TextAreaField, TextField } from "./fields";
import { SectionStyleControls } from "./SectionStyleControls";

export function ProofInspector({
  section,
  validationIssues = [],
  onChange,
  onVariantChange,
}: {
  section: ProofSection;
  validationIssues?: ValidationIssue[];
  onChange: (patch: SectionPropsPatch) => void;
  onVariantChange?: (variant: SectionVariant | undefined) => void;
}) {
  const { props } = section;

  return (
    <form className="inspector-form" aria-label="Proof inspector">
      <h2>Proof</h2>
      <TextField label="Eyebrow" value={props.eyebrow ?? ""} onChange={(eyebrow) => onChange({ eyebrow })} />
      <TextAreaField label="Headline" value={props.headline} onChange={(headline) => onChange({ headline })} />
      <TextAreaField label="Quote" value={props.quote ?? ""} rows={4} onChange={(quote) => onChange({ quote })} />
      <TextField label="Attribution" value={props.attribution ?? ""} onChange={(attribution) => onChange({ attribution })} />
      <RepeatedFieldList
        label="Metrics"
        items={props.metrics}
        createItem={() => ({ value: "1x", label: "new metric" })}
        onChange={(metrics) => onChange({ metrics })}
        renderItem={(metric, index, updateMetric) => (
          <>
            <TextField
              label="Value"
              value={metric.value}
              error={issueForPath(validationIssues, `metrics.${index}.value`)}
              onChange={(value) => updateMetric({ ...metric, value })}
            />
            <TextField
              label="Label"
              value={metric.label}
              error={issueForPath(validationIssues, `metrics.${index}.label`)}
              onChange={(label) => updateMetric({ ...metric, label })}
            />
          </>
        )}
      />
      <details className="inspector-section">
        <summary>Section style</summary>
        <div className="inspector-section__body">
          <SectionStyleControls
            variant={section.variant}
            props={props}
            validationIssues={validationIssues}
            onChange={onChange}
            onVariantChange={onVariantChange}
          />
        </div>
      </details>
    </form>
  );
}
