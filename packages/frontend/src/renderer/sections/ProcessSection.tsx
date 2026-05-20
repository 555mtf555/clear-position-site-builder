import clsx from "clsx";
import type { ProcessSection as ProcessSectionType } from "@clear-position/shared";
import { sectionStyle, typographyClasses } from "../sectionStyle";

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
            <article className="step-card" key={step.title}>
              <span>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
