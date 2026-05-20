import type { SolutionSection, SectionVariant } from "@clear-position/shared";
import type { SectionPropsPatch, ValidationIssue } from "../usePageEditor";
import { RepeatedFieldList, TextAreaField, TextField } from "./fields";
import { SectionStyleControls } from "./SectionStyleControls";

export function SolutionInspector({
  section,
  validationIssues = [],
  onChange,
  onVariantChange,
}: {
  section: SolutionSection;
  validationIssues?: ValidationIssue[];
  onChange: (patch: SectionPropsPatch) => void;
  onVariantChange?: (variant: SectionVariant | undefined) => void;
}) {
  const { props } = section;

  return (
    <form className="inspector-form" aria-label="Solution inspector">
      <h2>Solution</h2>
      <TextField label="Eyebrow" value={props.eyebrow ?? ""} onChange={(eyebrow) => onChange({ eyebrow })} />
      <TextAreaField label="Headline" value={props.headline} onChange={(headline) => onChange({ headline })} />
      <TextAreaField label="Body" value={props.body} rows={4} onChange={(body) => onChange({ body })} />
      <RepeatedFieldList
        label="Bullets"
        items={props.bullets}
        createItem={() => "New bullet"}
        onChange={(bullets) => onChange({ bullets })}
        renderItem={(bullet, _index, updateBullet) => (
          <TextField label="Bullet" value={bullet} onChange={updateBullet} />
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
