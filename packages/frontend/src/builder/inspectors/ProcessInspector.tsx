import type { ProcessSection, SectionVariant } from "@clear-position/shared";
import type { SectionPropsPatch, ValidationIssue } from "../usePageEditor";
import { issueForPath, RepeatedFieldList, TextAreaField, TextField } from "./fields";
import { SectionStyleControls } from "./SectionStyleControls";
import { ItemStyleControls } from "./ItemStyleControls";

export function ProcessInspector({
  section,
  validationIssues = [],
  onChange,
  onVariantChange,
}: {
  section: ProcessSection;
  validationIssues?: ValidationIssue[];
  onChange: (patch: SectionPropsPatch) => void;
  onVariantChange?: (variant: SectionVariant | undefined) => void;
}) {
  const { props } = section;

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
                <ItemStyleControls
                  style={step.style}
                  onChange={(style) => updateStep({ ...step, style })}
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
