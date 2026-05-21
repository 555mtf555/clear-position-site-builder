import clsx from "clsx";
import type { SolutionSection as SolutionSectionType } from "@clear-position/shared";
import { sectionStyle, typographyClasses } from "../sectionStyle";
import { EditableText } from "../InlineEdit";

export function SolutionSection({ section }: { section: SolutionSectionType }) {
  const { props } = section;
  const variant = section.variant ?? "default";

  return (
    <section className={clsx("content-section", "content-section--solution", `section--${variant}`, ...typographyClasses(props))} style={sectionStyle(props)}>
      <div className="content-section__inner content-section__inner--narrow">
        {props.eyebrow ? <p className="content-section__eyebrow">{props.eyebrow}</p> : null}
        <EditableText tag="h2" path={{ sectionId: section.id, field: "headline", required: true }}>
          {props.headline}
        </EditableText>
        <EditableText tag="p" className="content-section__intro" path={{ sectionId: section.id, field: "body", multiline: true, required: true }}>
          {props.body}
        </EditableText>
        {props.bullets.length > 0 ? (
          <ul className="check-list">
            {props.bullets.map((bullet, idx) => (
              <li key={idx}>
                <EditableText tag="span" path={{ sectionId: section.id, field: "_", arrayField: "bullets", itemIndex: idx, required: true, isStringArrayItem: true }}>
                  {bullet}
                </EditableText>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
