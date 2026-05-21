import clsx from "clsx";
import type { ProblemSection as ProblemSectionType } from "@clear-position/shared";
import { sectionStyle, typographyClasses, itemStyle } from "../sectionStyle";
import { EditableText } from "../InlineEdit";

export function ProblemSection({ section }: { section: ProblemSectionType }) {
  const { props } = section;
  const variant = section.variant ?? "default";

  return (
    <section className={clsx("content-section", "content-section--problem", `section--${variant}`, ...typographyClasses(props))} style={sectionStyle(props)}>
      <div className="content-section__inner">
        {props.eyebrow ? <p className="content-section__eyebrow">{props.eyebrow}</p> : null}
        <h2>{props.headline}</h2>
        {props.intro ? <p className="content-section__intro">{props.intro}</p> : null}
        <div className="card-grid">
          {props.problems.map((problem, idx) => (
            <article className="section-card" key={idx} style={itemStyle(problem.style)}>
              <EditableText tag="h3" path={{ sectionId: section.id, field: "title", arrayField: "problems", itemIndex: idx, required: true }}>
                {problem.title}
              </EditableText>
              <EditableText tag="p" path={{ sectionId: section.id, field: "description", arrayField: "problems", itemIndex: idx, multiline: true }}>
                {problem.description}
              </EditableText>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
