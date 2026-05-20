import type { ProblemSection, SectionVariant } from "@clear-position/shared";
import type { SectionPropsPatch, ValidationIssue } from "../usePageEditor";
import { issueForPath, RepeatedFieldList, TextAreaField, TextField } from "./fields";
import { SectionVariantField } from "./SectionVariantField";

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
          </>
        )}
      />
      <details className="inspector-section">
        <summary>Section style</summary>
        <div className="inspector-section__body">
          <SectionVariantField
            value={section.variant}
            onChange={onVariantChange ?? (() => {})}
          />
        </div>
      </details>
    </form>
  );
}
