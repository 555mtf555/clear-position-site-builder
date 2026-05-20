import type { FinalCtaSection, SectionVariant } from "@clear-position/shared";
import type { SectionPropsPatch, ValidationIssue } from "../usePageEditor";
import { BackgroundControls } from "./BackgroundControls";
import { issueFor, TextAreaField, TextField } from "./fields";
import { SectionVariantField } from "./SectionVariantField";

export function FinalCtaInspector({
  section,
  usedAssetIds,
  validationIssues = [],
  onAssetDeleted,
  onChange,
  onVariantChange,
}: {
  section: FinalCtaSection;
  usedAssetIds?: Set<string>;
  validationIssues?: ValidationIssue[];
  onAssetDeleted?: (assetId: string) => void;
  onChange: (patch: SectionPropsPatch) => void;
  onVariantChange?: (variant: SectionVariant | undefined) => void;
}) {
  const { props } = section;
  const headlineError = issueFor(validationIssues, "headline");
  const ctaTextError = issueFor(validationIssues, "cta_text");
  const ctaHrefError = issueFor(validationIssues, "cta_href");

  return (
    <form className="inspector-form" aria-label="Final CTA inspector">
      <h2>Final CTA</h2>
      <TextField label="Eyebrow" value={props.eyebrow ?? ""} onChange={(eyebrow) => onChange({ eyebrow })} />
      <TextAreaField label="Headline" value={props.headline} error={headlineError} onChange={(headline) => onChange({ headline })} />
      <TextAreaField label="Subhead" value={props.subhead ?? ""} rows={4} onChange={(subhead) => onChange({ subhead })} />
      <TextField label="CTA text" value={props.cta_text ?? ""} error={ctaTextError} onChange={(cta_text) => onChange({ cta_text })} />
      <TextField label="CTA href" value={props.cta_href ?? ""} error={ctaHrefError} onChange={(cta_href) => onChange({ cta_href })} />
      <details className="inspector-section">
        <summary>Background &amp; style</summary>
        <div className="inspector-section__body">
          <BackgroundControls
            props={props}
            usedAssetIds={usedAssetIds}
            validationIssues={validationIssues}
            onAssetDeleted={onAssetDeleted}
            onChange={onChange}
          />
          <label>
            Text alignment
            <select
              value={props.text_align}
              onChange={(event) => onChange({ text_align: event.target.value as FinalCtaSection["props"]["text_align"] })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <SectionVariantField
            value={section.variant}
            onChange={onVariantChange ?? (() => {})}
          />
        </div>
      </details>
    </form>
  );
}
