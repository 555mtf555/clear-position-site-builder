import clsx from "clsx";
import type { ServicesSection as ServicesSectionType } from "@clear-position/shared";

export function ServicesSection({ section }: { section: ServicesSectionType }) {
  const { props } = section;
  const variant = section.variant ?? "default";

  return (
    <section className={clsx("content-section", `section--${variant}`)}>
      <div className="content-section__inner">
        {props.eyebrow ? <p className="content-section__eyebrow">{props.eyebrow}</p> : null}
        <h2>{props.headline}</h2>
        <div className="card-grid">
          {props.services.map((service) => (
            <article className="section-card" key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
