import type { HeroSection, SectionVariant } from "@clear-position/shared";
import type { SectionPropsPatch, ValidationIssue } from "../usePageEditor";
import { BackgroundControls } from "./BackgroundControls";
import { SectionVariantField } from "./SectionVariantField";

interface HeroInspectorProps {
  section: HeroSection;
  usedAssetIds?: Set<string>;
  validationIssues?: ValidationIssue[];
  onAssetDeleted?: (assetId: string) => void;
  onChange: (patch: SectionPropsPatch) => void;
  onVariantChange?: (variant: SectionVariant | undefined) => void;
}

function issueFor(issues: ValidationIssue[], field: string): string | null {
  return issues.find((issue) => issue.path.endsWith(`props.${field}`))?.message ?? null;
}

export function HeroInspector({ section, usedAssetIds, validationIssues = [], onAssetDeleted, onChange, onVariantChange }: HeroInspectorProps) {
  const { props } = section;
  const headlineError = issueFor(validationIssues, "headline");
  const ctaTextError = issueFor(validationIssues, "cta_text");
  const ctaHrefError = issueFor(validationIssues, "cta_href");

  return (
    <form className="inspector-form" aria-label="Hero inspector">
      <h2>Hero</h2>
      <label>
        Headline
        <textarea
          value={props.headline}
          aria-invalid={Boolean(headlineError)}
          onChange={(event) => onChange({ headline: event.target.value })}
          rows={3}
        />
        {headlineError ? <span className="field-error">{headlineError}</span> : null}
      </label>
      <label>
        Subhead
        <textarea
          value={props.subhead ?? ""}
          onChange={(event) => onChange({ subhead: event.target.value })}
          rows={4}
        />
      </label>
      <label>
        CTA text
        <input
          value={props.cta_text ?? ""}
          aria-invalid={Boolean(ctaTextError)}
          onChange={(event) => onChange({ cta_text: event.target.value })}
        />
        {ctaTextError ? <span className="field-error">{ctaTextError}</span> : null}
      </label>
      <label>
        CTA href
        <input
          value={props.cta_href ?? ""}
          aria-invalid={Boolean(ctaHrefError)}
          onChange={(event) => onChange({ cta_href: event.target.value })}
        />
        {ctaHrefError ? <span className="field-error">{ctaHrefError}</span> : null}
      </label>
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
              onChange={(event) => onChange({ text_align: event.target.value as HeroSection["props"]["text_align"] })}
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
