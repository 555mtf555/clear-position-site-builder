import type { ServicesSection, SectionVariant } from "@clear-position/shared";
import type { SectionPropsPatch, ValidationIssue } from "../usePageEditor";
import { issueForPath, RepeatedFieldList, TextAreaField, TextField } from "./fields";
import { SectionStyleControls } from "./SectionStyleControls";
import { ItemStyleControls } from "./ItemStyleControls";

export function ServicesInspector({
  section,
  validationIssues = [],
  onChange,
  onVariantChange,
  selectedItemIndex,
}: {
  section: ServicesSection;
  validationIssues?: ValidationIssue[];
  onChange: (patch: SectionPropsPatch) => void;
  onVariantChange?: (variant: SectionVariant | undefined) => void;
  selectedItemIndex?: number | null;
}) {
  const { props } = section;

  return (
    <form className="inspector-form" aria-label="Services inspector">
      <h2>Services</h2>
      <TextField label="Eyebrow" value={props.eyebrow ?? ""} onChange={(eyebrow) => onChange({ eyebrow })} />
      <TextAreaField label="Headline" value={props.headline} onChange={(headline) => onChange({ headline })} />
      <RepeatedFieldList
        label="Services"
        itemLabel="Service card"
        guidance="Recommended: 3–6 service cards"
        emptyMessage="No service cards yet. Add one to describe an offer."
        selectedItemIndex={selectedItemIndex}
        items={props.services}
        createItem={() => ({ title: "New service", description: "Describe this service." })}
        onChange={(services) => onChange({ services })}
        renderItem={(service, index, updateService) => (
          <>
            <TextField
              label="Title"
              value={service.title}
              error={issueForPath(validationIssues, `services.${index}.title`)}
              onChange={(title) => updateService({ ...service, title })}
            />
            <TextAreaField
              label="Description"
              value={service.description}
              error={issueForPath(validationIssues, `services.${index}.description`)}
              onChange={(description) => updateService({ ...service, description })}
            />
            <details className="inspector-section">
              <summary>Card style</summary>
              <div className="inspector-section__body">
                <ItemStyleControls
                  style={service.style}
                  onChange={(style) => updateService({ ...service, style })}
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
