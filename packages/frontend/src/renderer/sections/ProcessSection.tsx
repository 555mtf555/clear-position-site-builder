import clsx from "clsx";
import type { ProcessSection as ProcessSectionType } from "@clear-position/shared";
import { sectionStyle, typographyClasses, itemStyle } from "../sectionStyle";
import { EditableText } from "../InlineEdit";

export function ProcessSection({ section }: { section: ProcessSectionType }) {
  const { props } = section;
  const variant = section.variant ?? "default";

  return (
    <section className={clsx("content-section", `section--${variant}`, ...typographyClasses(props))} style={sectionStyle(props)}>
      <div className="content-section__inner">
        {props.eyebrow ? <p className="content-section__eyebrow">{props.eyebrow}</p> : null}
        <h2>{props.headline}</h2>
        <div className="step-list">
          {props.steps.map((step, index) => (
            <article className="step-card" key={index} style={itemStyle(step.style)}>
              <span>{index + 1}</span>
              <EditableText tag="h3" path={{ sectionId: section.id, field: "title", arrayField: "steps", itemIndex: index, required: true }}>
                {step.title}
              </EditableText>
              <EditableText tag="p" path={{ sectionId: section.id, field: "description", arrayField: "steps", itemIndex: index, multiline: true }}>
                {step.description}
              </EditableText>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
