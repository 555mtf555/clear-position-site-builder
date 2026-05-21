import clsx from "clsx";
import type { ProofSection as ProofSectionType } from "@clear-position/shared";
import { sectionStyle, typographyClasses, itemStyle } from "../sectionStyle";
import { EditableText } from "../InlineEdit";

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
            <blockquote>
              <EditableText tag="span" path={{ sectionId: section.id, field: "quote", multiline: true }}>
                {props.quote}
              </EditableText>
            </blockquote>
            {props.attribution ? (
              <figcaption>
                <EditableText tag="span" path={{ sectionId: section.id, field: "attribution" }}>
                  {props.attribution}
                </EditableText>
              </figcaption>
            ) : null}
          </figure>
        ) : null}
        {props.metrics.length > 0 ? (
          <div className="metric-grid">
            {props.metrics.map((metric, idx) => (
              <div className="metric" key={idx} style={itemStyle(metric.style)}>
                <EditableText tag="strong" path={{ sectionId: section.id, field: "value", arrayField: "metrics", itemIndex: idx, required: true }}>
                  {metric.value}
                </EditableText>
                <EditableText tag="span" path={{ sectionId: section.id, field: "label", arrayField: "metrics", itemIndex: idx, required: true }}>
                  {metric.label}
                </EditableText>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
