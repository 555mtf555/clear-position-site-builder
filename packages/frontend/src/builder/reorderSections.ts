import type { Page, Section } from "@clear-position/shared";
import { Page as PageSchema } from "@clear-position/shared";

export function reorderSections(sections: Section[], activeId: string, overId: string): Section[] | null {
  if (activeId === overId) return sections;

  const activeIndex = sections.findIndex((section) => section.id === activeId);
  const overIndex = sections.findIndex((section) => section.id === overId);

  if (activeIndex < 0 || overIndex < 0) return null;

  const next = [...sections];
  const [moved] = next.splice(activeIndex, 1);
  if (!moved) return null;
  next.splice(overIndex, 0, moved);

  return next;
}

export function reorderPageSections(page: Page, activeId: string, overId: string): Page | null {
  const sections = reorderSections(page.doc.sections, activeId, overId);
  if (!sections) return null;

  const nextPage: Page = {
    ...page,
    doc: {
      ...page.doc,
      sections,
    },
  };

  return PageSchema.safeParse(nextPage).success ? nextPage : null;
}
