import type { FinalCtaSection as FinalCtaSectionType } from "@clear-position/shared";
import clsx from "clsx";
import { EditableText } from "../InlineEdit";

export function FinalCtaSection({ section }: { section: FinalCtaSectionType }) {
  const { props } = section;

  const variant = section.variant ?? "default";

  return (
    <section
      className={clsx("final-cta-section", `final-cta-section--${props.text_align}`, variant !== "default" && `section--${variant}`)}
      style={{
        backgroundColor: props.background_color ?? "var(--cpsb-secondary)",
        backgroundImage: props.background_image_asset_id ? `url(/api/assets/${props.background_image_asset_id}/file)` : undefined,
        backgroundSize: props.background_size ?? "cover",
        backgroundPosition: props.background_position ?? "center",
      }}
    >
      <div className="final-cta-section__inner">
        {props.eyebrow ? <p className="content-section__eyebrow">{props.eyebrow}</p> : null}
        <EditableText tag="h2" path={{ sectionId: section.id, field: "headline", required: true }}>
          {props.headline}
        </EditableText>
        {props.subhead ? (
          <EditableText tag="p" path={{ sectionId: section.id, field: "subhead", multiline: true }}>
            {props.subhead}
          </EditableText>
        ) : null}
        {props.cta_text && props.cta_href ? (
          <EditableText tag="a" className="hero-section__cta" href={props.cta_href} path={{ sectionId: section.id, field: "cta_text" }}>
            {props.cta_text}
          </EditableText>
        ) : null}
      </div>
    </section>
  );
}
