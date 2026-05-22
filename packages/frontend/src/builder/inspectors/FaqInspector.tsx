import { useState } from "react";
import type { FaqSection, SectionVariant } from "@clear-position/shared";
import type { SectionPropsPatch, ValidationIssue } from "../usePageEditor";
import { issueForPath, RepeatedFieldList, TextAreaField, TextField } from "./fields";
import { SectionStyleControls } from "./SectionStyleControls";
import { ItemStyleControls } from "./ItemStyleControls";
import { TextFieldStyleControls } from "./TextFieldStyleControls";
import { CardStyleActions } from "./CardStyleActions";
import {
  CARD_PRESETS,
  getFaqSnapshot,
  applyFaqSnapshot,
  applyFaqPreset,
  clearFaqStyle,
} from "./itemStylePresets";
import type { ItemStyleSnapshot } from "./itemStylePresets";

export function FaqInspector({
  section,
  validationIssues = [],
  onChange,
  onVariantChange,
  selectedItemIndex,
}: {
  section: FaqSection;
  validationIssues?: ValidationIssue[];
  onChange: (patch: SectionPropsPatch) => void;
  onVariantChange?: (variant: SectionVariant | undefined) => void;
  selectedItemIndex?: number | null;
}) {
  const { props } = section;
  const [clipboard, setClipboard] = useState<ItemStyleSnapshot | null>(null);

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
        selectedItemIndex={selectedItemIndex}
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
            <details className="inspector-section">
              <summary>Item style</summary>
              <div className="inspector-section__body">
                <CardStyleActions
                  kind="faq"
                  clipboard={clipboard}
                  itemsLabel="items"
                  onApplyPreset={(id) => {
                    const preset = CARD_PRESETS.find((p) => p.id === id);
                    if (preset) updateItem(applyFaqPreset(item, preset));
                  }}
                  onCopyStyle={() => setClipboard(getFaqSnapshot(item))}
                  onPasteStyle={() => {
                    if (clipboard?.kind === "faq") updateItem(applyFaqSnapshot(item, clipboard));
                  }}
                  onResetStyle={() => updateItem(clearFaqStyle(item))}
                  onApplyToAll={() => {
                    if (!window.confirm("Apply this item's style to all items in this section? This will replace their current item/text styles.")) return;
                    const snap = getFaqSnapshot(item);
                    onChange({ items: props.items.map((it) => applyFaqSnapshot(it, snap)) });
                  }}
                />
                <ItemStyleControls
                  style={item.style}
                  onChange={(style) => updateItem({ ...item, style })}
                />
                <p className="inspector-section__field-label">Question</p>
                <TextFieldStyleControls
                  fieldLabel="question"
                  style={item.question_style}
                  onChange={(question_style) => updateItem({ ...item, question_style })}
                />
                <p className="inspector-section__field-label">Answer</p>
                <TextFieldStyleControls
                  fieldLabel="answer"
                  style={item.answer_style}
                  onChange={(answer_style) => updateItem({ ...item, answer_style })}
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
