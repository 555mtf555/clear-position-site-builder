import clsx from "clsx";
import type { ProblemSection as ProblemSectionType } from "@clear-position/shared";
import { sectionStyle, typographyClasses } from "../sectionStyle";

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
          {props.problems.map((problem) => (
            <article className="section-card" key={problem.title}>
              <h3>{problem.title}</h3>
              <p>{problem.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
