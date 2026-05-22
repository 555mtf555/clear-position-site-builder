import { useState } from "react";
import type { ProcessSection, SectionVariant } from "@clear-position/shared";
import type { SectionPropsPatch, ValidationIssue } from "../usePageEditor";
import { issueForPath, RepeatedFieldList, TextAreaField, TextField } from "./fields";
import { SectionStyleControls } from "./SectionStyleControls";
import { ItemStyleControls } from "./ItemStyleControls";
import { TextFieldStyleControls } from "./TextFieldStyleControls";
import { CardStyleActions } from "./CardStyleActions";
import {
  CARD_PRESETS,
  getCardSnapshot,
  applyCardSnapshot,
  applyCardPreset,
  clearCardStyle,
} from "./itemStylePresets";
import type { ItemStyleSnapshot } from "./itemStylePresets";

export function ProcessInspector({
  section,
  validationIssues = [],
  onChange,
  onVariantChange,
  selectedItemIndex,
}: {
  section: ProcessSection;
  validationIssues?: ValidationIssue[];
  onChange: (patch: SectionPropsPatch) => void;
  onVariantChange?: (variant: SectionVariant | undefined) => void;
  selectedItemIndex?: number | null;
}) {
  const { props } = section;
  const [clipboard, setClipboard] = useState<ItemStyleSnapshot | null>(null);

  return (
    <form className="inspector-form" aria-label="Process inspector">
      <h2>Process</h2>
      <TextField label="Eyebrow" value={props.eyebrow ?? ""} onChange={(eyebrow) => onChange({ eyebrow })} />
      <TextAreaField label="Headline" value={props.headline} onChange={(headline) => onChange({ headline })} />
      <RepeatedFieldList
        label="Steps"
        itemLabel="Step"
        guidance="Recommended: 3 steps"
        emptyMessage="No process steps yet. Add steps to explain how you deliver the work."
        selectedItemIndex={selectedItemIndex}
        items={props.steps}
        createItem={() => ({ title: "New step", description: "Describe this step." })}
        onChange={(steps) => onChange({ steps })}
        renderItem={(step, index, updateStep) => (
          <>
            <TextField
              label="Title"
              value={step.title}
              error={issueForPath(validationIssues, `steps.${index}.title`)}
              onChange={(title) => updateStep({ ...step, title })}
            />
            <TextAreaField
              label="Description"
              value={step.description}
              error={issueForPath(validationIssues, `steps.${index}.description`)}
              onChange={(description) => updateStep({ ...step, description })}
            />
            <details className="inspector-section">
              <summary>Step style</summary>
              <div className="inspector-section__body">
                <CardStyleActions
                  kind="card"
                  clipboard={clipboard}
                  itemsLabel="steps"
                  onApplyPreset={(id) => {
                    const preset = CARD_PRESETS.find((p) => p.id === id);
                    if (preset) updateStep(applyCardPreset(step, preset));
                  }}
                  onCopyStyle={() => setClipboard(getCardSnapshot(step))}
                  onPasteStyle={() => {
                    if (clipboard?.kind === "card") updateStep(applyCardSnapshot(step, clipboard));
                  }}
                  onResetStyle={() => updateStep(clearCardStyle(step))}
                  onApplyToAll={() => {
                    if (!window.confirm("Apply this step's style to all steps in this section? This will replace their current card/text styles.")) return;
                    const snap = getCardSnapshot(step);
                    onChange({ steps: props.steps.map((s) => applyCardSnapshot(s, snap)) });
                  }}
                />
                <ItemStyleControls
                  style={step.style}
                  onChange={(style) => updateStep({ ...step, style })}
                />
                <p className="inspector-section__field-label">Title</p>
                <TextFieldStyleControls
                  fieldLabel="title"
                  style={step.title_style}
                  onChange={(title_style) => updateStep({ ...step, title_style })}
                />
                <p className="inspector-section__field-label">Description</p>
                <TextFieldStyleControls
                  fieldLabel="description"
                  style={step.description_style}
                  onChange={(description_style) => updateStep({ ...step, description_style })}
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
