import clsx from "clsx";
import type { ProofSection as ProofSectionType } from "@clear-position/shared";
import { sectionStyle, typographyClasses, itemStyle } from "../sectionStyle";

export function ProofSection({ section }: { section: ProofSectionType }) {
  const { props } = section;
  const variant = section.variant ?? "default";

  return (
    <section className={clsx("content-section", "content-section--proof", `section--${variant}`, ...typographyClasses(props))} style={sectionStyle(props)}>
      <div className="content-section__inner">
        {props.eyebrow ? <p className="content-section__eyebrow">{props.eyebrow}</p> : null}
        <h2>{props.headline}</h2>
        {props.quote ? (
          <figure className="quote-block">
            <blockquote>{props.quote}</blockquote>
            {props.attribution ? <figcaption>{props.attribution}</figcaption> : null}
          </figure>
        ) : null}
        {props.metrics.length > 0 ? (
          <div className="metric-grid">
            {props.metrics.map((metric) => (
              <div className="metric" key={`${metric.value}-${metric.label}`} style={itemStyle(metric.style)}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
