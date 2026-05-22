import { useState } from "react";
import type { ProofSection, SectionVariant } from "@clear-position/shared";
import type { SectionPropsPatch, ValidationIssue } from "../usePageEditor";
import { issueForPath, RepeatedFieldList, TextAreaField, TextField } from "./fields";
import { SectionStyleControls } from "./SectionStyleControls";
import { ItemStyleControls } from "./ItemStyleControls";
import { TextFieldStyleControls } from "./TextFieldStyleControls";
import { CardStyleActions } from "./CardStyleActions";
import {
  CARD_PRESETS,
  getMetricSnapshot,
  applyMetricSnapshot,
  applyMetricPreset,
  clearMetricStyle,
} from "./itemStylePresets";
import type { ItemStyleSnapshot } from "./itemStylePresets";

export function ProofInspector({
  section,
  validationIssues = [],
  onChange,
  onVariantChange,
  selectedItemIndex,
}: {
  section: ProofSection;
  validationIssues?: ValidationIssue[];
  onChange: (patch: SectionPropsPatch) => void;
  onVariantChange?: (variant: SectionVariant | undefined) => void;
  selectedItemIndex?: number | null;
}) {
  const { props } = section;
  const [clipboard, setClipboard] = useState<ItemStyleSnapshot | null>(null);

  return (
    <form className="inspector-form" aria-label="Proof inspector">
      <h2>Proof</h2>
      <TextField label="Eyebrow" value={props.eyebrow ?? ""} onChange={(eyebrow) => onChange({ eyebrow })} />
      <TextAreaField label="Headline" value={props.headline} onChange={(headline) => onChange({ headline })} />
      <TextAreaField label="Quote" value={props.quote ?? ""} rows={4} onChange={(quote) => onChange({ quote })} />
      <TextField label="Attribution" value={props.attribution ?? ""} onChange={(attribution) => onChange({ attribution })} />
      <RepeatedFieldList
        label="Metrics"
        itemLabel="Metric"
        emptyMessage="No proof metrics yet. Add verified results or leave this empty until proof is available."
        selectedItemIndex={selectedItemIndex}
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
            <details className="inspector-section">
              <summary>Metric style</summary>
              <div className="inspector-section__body">
                <CardStyleActions
                  kind="metric"
                  clipboard={clipboard}
                  itemsLabel="metrics"
                  onApplyPreset={(id) => {
                    const preset = CARD_PRESETS.find((p) => p.id === id);
                    if (preset) updateMetric(applyMetricPreset(metric, preset));
                  }}
                  onCopyStyle={() => setClipboard(getMetricSnapshot(metric))}
                  onPasteStyle={() => {
                    if (clipboard?.kind === "metric") updateMetric(applyMetricSnapshot(metric, clipboard));
                  }}
                  onResetStyle={() => updateMetric(clearMetricStyle(metric))}
                  onApplyToAll={() => {
                    if (!window.confirm("Apply this metric's style to all metrics in this section? This will replace their current metric/text styles.")) return;
                    const snap = getMetricSnapshot(metric);
                    onChange({ metrics: props.metrics.map((m) => applyMetricSnapshot(m, snap)) });
                  }}
                />
                <ItemStyleControls
                  style={metric.style}
                  onChange={(style) => updateMetric({ ...metric, style })}
                />
                <p className="inspector-section__field-label">Value</p>
                <TextFieldStyleControls
                  fieldLabel="value"
                  style={metric.value_style}
                  onChange={(value_style) => updateMetric({ ...metric, value_style })}
                />
                <p className="inspector-section__field-label">Label</p>
                <TextFieldStyleControls
                  fieldLabel="label"
                  style={metric.label_style}
                  onChange={(label_style) => updateMetric({ ...metric, label_style })}
                />
              </div>
            </details>
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
