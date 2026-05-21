import clsx from "clsx";
import type { ServicesSection as ServicesSectionType } from "@clear-position/shared";
import { sectionStyle, typographyClasses, itemStyle } from "../sectionStyle";
import { EditableText } from "../InlineEdit";

export function ServicesSection({ section }: { section: ServicesSectionType }) {
  const { props } = section;
  const variant = section.variant ?? "default";

  return (
    <section className={clsx("content-section", `section--${variant}`, ...typographyClasses(props))} style={sectionStyle(props)}>
      <div className="content-section__inner">
        {props.eyebrow ? <p className="content-section__eyebrow">{props.eyebrow}</p> : null}
        <h2>{props.headline}</h2>
        <div className="card-grid">
          {props.services.map((service, idx) => (
            <article className="section-card" key={idx} style={itemStyle(service.style)}>
              <EditableText tag="h3" path={{ sectionId: section.id, field: "title", arrayField: "services", itemIndex: idx, required: true }}>
                {service.title}
              </EditableText>
              <EditableText tag="p" path={{ sectionId: section.id, field: "description", arrayField: "services", itemIndex: idx, multiline: true }}>
                {service.description}
              </EditableText>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
