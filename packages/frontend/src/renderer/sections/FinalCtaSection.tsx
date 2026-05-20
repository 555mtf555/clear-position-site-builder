import type { FinalCtaSection as FinalCtaSectionType } from "@clear-position/shared";
import clsx from "clsx";

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
        <h2>{props.headline}</h2>
        {props.subhead ? <p>{props.subhead}</p> : null}
        {props.cta_text && props.cta_href ? (
          <a className="hero-section__cta" href={props.cta_href}>
            {props.cta_text}
          </a>
        ) : null}
      </div>
    </section>
  );
}
