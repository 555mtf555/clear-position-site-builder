import clsx from "clsx";
import type { FaqSection as FaqSectionType } from "@clear-position/shared";
import { sectionStyle, typographyClasses, itemStyle } from "../sectionStyle";
import { EditableText } from "../InlineEdit";

export function FaqSection({ section }: { section: FaqSectionType }) {
  const { props } = section;
  const variant = section.variant ?? "default";

  return (
    <section className={clsx("content-section", "content-section--faq", `section--${variant}`, ...typographyClasses(props))} style={sectionStyle(props)}>
      <div className="content-section__inner content-section__inner--narrow">
        {props.eyebrow ? <p className="content-section__eyebrow">{props.eyebrow}</p> : null}
        <h2>{props.headline}</h2>
        <div className="faq-list">
          {props.items.map((item, idx) => (
            <article key={idx} style={itemStyle(item.style)}>
              <EditableText tag="h3" path={{ sectionId: section.id, field: "question", arrayField: "items", itemIndex: idx, required: true }}>
                {item.question}
              </EditableText>
              <EditableText tag="p" path={{ sectionId: section.id, field: "answer", arrayField: "items", itemIndex: idx, multiline: true }}>
                {item.answer}
              </EditableText>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
