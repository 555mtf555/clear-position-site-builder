import type { ProblemSection, SectionVariant } from "@clear-position/shared";
import type { SectionPropsPatch, ValidationIssue } from "../usePageEditor";
import { issueForPath, RepeatedFieldList, TextAreaField, TextField } from "./fields";
import { SectionStyleControls } from "./SectionStyleControls";
import { ItemStyleControls } from "./ItemStyleControls";

export function ProblemInspector({
  section,
  validationIssues = [],
  onChange,
  onVariantChange,
}: {
  section: ProblemSection;
  validationIssues?: ValidationIssue[];
  onChange: (patch: SectionPropsPatch) => void;
  onVariantChange?: (variant: SectionVariant | undefined) => void;
}) {
  const { props } = section;

  return (
    <form className="inspector-form" aria-label="Problem inspector">
      <h2>Problem</h2>
      <TextField label="Eyebrow" value={props.eyebrow ?? ""} onChange={(eyebrow) => onChange({ eyebrow })} />
      <TextAreaField label="Headline" value={props.headline} onChange={(headline) => onChange({ headline })} />
      <TextAreaField label="Intro" value={props.intro ?? ""} onChange={(intro) => onChange({ intro })} />
      <RepeatedFieldList
        label="Problems"
        itemLabel="Problem card"
        guidance="Recommended: 3 problem cards"
        emptyMessage="No problem cards yet. Add buyer pain points from the discovery findings."
        items={props.problems}
        createItem={() => ({ title: "New problem", description: "Describe the problem." })}
        onChange={(problems) => onChange({ problems })}
        renderItem={(problem, index, updateProblem) => (
          <>
            <TextField
              label="Title"
              value={problem.title}
              error={issueForPath(validationIssues, `problems.${index}.title`)}
              onChange={(title) => updateProblem({ ...problem, title })}
            />
            <TextAreaField
              label="Description"
              value={problem.description}
              error={issueForPath(validationIssues, `problems.${index}.description`)}
              onChange={(description) => updateProblem({ ...problem, description })}
            />
            <details className="inspector-section">
              <summary>Card style</summary>
              <div className="inspector-section__body">
                <ItemStyleControls
                  style={problem.style}
                  onChange={(style) => updateProblem({ ...problem, style })}
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
