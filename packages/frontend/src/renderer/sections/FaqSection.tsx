import clsx from "clsx";
import type { FaqSection as FaqSectionType } from "@clear-position/shared";
import { sectionStyle, typographyClasses } from "../sectionStyle";

export function FaqSection({ section }: { section: FaqSectionType }) {
  const { props } = section;
  const variant = section.variant ?? "default";

  return (
    <section className={clsx("content-section", "content-section--faq", `section--${variant}`, ...typographyClasses(props))} style={sectionStyle(props)}>
      <div className="content-section__inner content-section__inner--narrow">
        {props.eyebrow ? <p className="content-section__eyebrow">{props.eyebrow}</p> : null}
        <h2>{props.headline}</h2>
        <div className="faq-list">
          {props.items.map((item) => (
            <article key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
