import { useState } from "react";
import type { ServicesSection, SectionVariant } from "@clear-position/shared";
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
  const [clipboard, setClipboard] = useState<ItemStyleSnapshot | null>(null);

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
                <CardStyleActions
                  kind="card"
                  clipboard={clipboard}
                  itemsLabel="cards"
                  onApplyPreset={(id) => {
                    const preset = CARD_PRESETS.find((p) => p.id === id);
                    if (preset) updateService(applyCardPreset(service, preset));
                  }}
                  onCopyStyle={() => setClipboard(getCardSnapshot(service))}
                  onPasteStyle={() => {
                    if (clipboard?.kind === "card") updateService(applyCardSnapshot(service, clipboard));
                  }}
                  onResetStyle={() => updateService(clearCardStyle(service))}
                  onApplyToAll={() => {
                    if (!window.confirm("Apply this card's style to all cards in this section? This will replace their current card/text styles.")) return;
                    const snap = getCardSnapshot(service);
                    onChange({ services: props.services.map((s) => applyCardSnapshot(s, snap)) });
                  }}
                />
                <ItemStyleControls
                  style={service.style}
                  onChange={(style) => updateService({ ...service, style })}
                />
                <p className="inspector-section__field-label">Title</p>
                <TextFieldStyleControls
                  fieldLabel="title"
                  style={service.title_style}
                  onChange={(title_style) => updateService({ ...service, title_style })}
                />
                <p className="inspector-section__field-label">Description</p>
                <TextFieldStyleControls
                  fieldLabel="description"
                  style={service.description_style}
                  onChange={(description_style) => updateService({ ...service, description_style })}
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
