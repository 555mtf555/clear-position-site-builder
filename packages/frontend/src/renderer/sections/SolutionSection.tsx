import clsx from "clsx";
import type { SolutionSection as SolutionSectionType } from "@clear-position/shared";
import { sectionStyle, typographyClasses } from "../sectionStyle";

export function SolutionSection({ section }: { section: SolutionSectionType }) {
  const { props } = section;
  const variant = section.variant ?? "default";

  return (
    <section className={clsx("content-section", "content-section--solution", `section--${variant}`, ...typographyClasses(props))} style={sectionStyle(props)}>
      <div className="content-section__inner content-section__inner--narrow">
        {props.eyebrow ? <p className="content-section__eyebrow">{props.eyebrow}</p> : null}
        <h2>{props.headline}</h2>
        <p className="content-section__intro">{props.body}</p>
        {props.bullets.length > 0 ? (
          <ul className="check-list">
            {props.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
