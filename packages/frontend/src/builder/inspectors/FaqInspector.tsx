import type { FaqSection, SectionVariant } from "@clear-position/shared";
import type { SectionPropsPatch, ValidationIssue } from "../usePageEditor";
import { issueForPath, RepeatedFieldList, TextAreaField, TextField } from "./fields";
import { SectionStyleControls } from "./SectionStyleControls";

export function FaqInspector({
  section,
  validationIssues = [],
  onChange,
  onVariantChange,
}: {
  section: FaqSection;
  validationIssues?: ValidationIssue[];
  onChange: (patch: SectionPropsPatch) => void;
  onVariantChange?: (variant: SectionVariant | undefined) => void;
}) {
  const { props } = section;

  return (
    <form className="inspector-form" aria-label="FAQ inspector">
      <h2>FAQ</h2>
      <TextField label="Eyebrow" value={props.eyebrow ?? ""} onChange={(eyebrow) => onChange({ eyebrow })} />
      <TextAreaField label="Headline" value={props.headline} onChange={(headline) => onChange({ headline })} />
      <RepeatedFieldList
        label="Items"
        itemLabel="FAQ item"
        guidance="Recommended: 3–6 questions"
        emptyMessage="No FAQ items yet. Add common questions buyers ask before getting started."
        items={props.items}
        createItem={() => ({ question: "New question?", answer: "Answer the question." })}
        onChange={(items) => onChange({ items })}
        renderItem={(item, index, updateItem) => (
          <>
            <TextField
              label="Question"
              value={item.question}
              error={issueForPath(validationIssues, `items.${index}.question`)}
              onChange={(question) => updateItem({ ...item, question })}
            />
            <TextAreaField
              label="Answer"
              value={item.answer}
              error={issueForPath(validationIssues, `items.${index}.answer`)}
              onChange={(answer) => updateItem({ ...item, answer })}
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
