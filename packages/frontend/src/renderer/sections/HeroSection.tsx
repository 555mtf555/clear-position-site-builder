import type { HeroSection as HeroSectionType } from "@clear-position/shared";
import clsx from "clsx";

interface HeroSectionProps {
  section: HeroSectionType;
}

export function HeroSection({ section }: HeroSectionProps) {
  const { props } = section;
  const style = {
    backgroundColor: props.background_color ?? "var(--cpsb-background)",
    backgroundImage: props.background_image_asset_id ? `url(/api/assets/${props.background_image_asset_id}/file)` : undefined,
    backgroundSize: props.background_size ?? "cover",
    backgroundPosition: props.background_position ?? "center",
  };

  const variant = section.variant ?? "default";

  return (
    <section className={clsx("hero-section", `hero-section--${props.text_align}`, variant !== "default" && `section--${variant}`)} style={style}>
      <div className="hero-section__inner">
        {props.eyebrow ? <p className="hero-section__eyebrow">{props.eyebrow}</p> : null}
        <h1>{props.headline}</h1>
        {props.subhead ? <p className="hero-section__subhead">{props.subhead}</p> : null}
        {props.cta_text && props.cta_href ? (
          <a className="hero-section__cta" href={props.cta_href}>
            {props.cta_text}
          </a>
        ) : null}
      </div>
    </section>
  );
}
