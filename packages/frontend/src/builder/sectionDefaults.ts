import type { Section, SectionType } from "@clear-position/shared";

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero",
  problem: "Problem",
  solution: "Solution",
  process: "Process",
  proof: "Proof",
  services: "Services",
  faq: "FAQ",
  final_cta: "Final CTA",
};

export const SECTION_TYPES: SectionType[] = [
  "hero",
  "problem",
  "solution",
  "process",
  "proof",
  "services",
  "faq",
  "final_cta",
];

function newId(type: SectionType): string {
  const random = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `sec_${type}_${random.slice(0, 8)}`;
}

export function createDefaultSection(type: SectionType): Section {
  const id = newId(type);

  switch (type) {
    case "hero":
      return {
        id,
        type,
        props: {
          eyebrow: "New offer",
          headline: "A clearer homepage starts here.",
          subhead: "Use this hero to introduce the main promise.",
          cta_text: "Get started",
          cta_href: "/contact",
          background_color: "#f6f7f3",
          background_size: "cover",
          background_position: "center",
          text_align: "left",
        },
        elements: [],
      };
    case "problem":
      return {
        id,
        type,
        variant: "soft-card" as const,
        props: {
          eyebrow: "Problem",
          headline: "Name the costly problem your customer already feels.",
          intro: "Use this section to show you understand the stakes.",
          problems: [
            { title: "Unclear message", description: "Customers leave before they understand the offer." },
            { title: "Slow decisions", description: "Prospects need more confidence before they act." },
          ],
        },
        elements: [],
      };
    case "solution":
      return {
        id,
        type,
        props: {
          eyebrow: "Solution",
          headline: "Show the better path.",
          body: "Explain the mechanism that makes your approach easier, safer, or more effective.",
          bullets: ["Clearer positioning", "Reusable website sections", "A cleaner path to action"],
        },
        elements: [],
      };
    case "process":
      return {
        id,
        type,
        props: {
          eyebrow: "Process",
          headline: "Make the next step feel simple.",
          steps: [
            { title: "Discover", description: "Clarify goals and constraints." },
            { title: "Build", description: "Create the page structure and message." },
            { title: "Launch", description: "Publish and improve from real feedback." },
          ],
        },
        elements: [],
      };
    case "proof":
      return {
        id,
        type,
        props: {
          eyebrow: "Proof",
          headline: "Give buyers evidence they can trust.",
          quote: "The site finally explains what we do in a way customers understand.",
          attribution: "Example customer",
          metrics: [
            { value: "32%", label: "more qualified inquiries" },
            { value: "2x", label: "faster sales conversations" },
          ],
        },
        elements: [],
      };
    case "services":
      return {
        id,
        type,
        variant: "soft-card" as const,
        props: {
          eyebrow: "Services",
          headline: "Package the work into clear choices.",
          services: [
            { title: "Positioning sprint", description: "Clarify the audience, offer, and message." },
            { title: "Homepage build", description: "Turn the message into a structured page." },
          ],
        },
        elements: [],
      };
    case "faq":
      return {
        id,
        type,
        props: {
          eyebrow: "FAQ",
          headline: "Answer the questions that block action.",
          items: [
            { question: "How long does this take?", answer: "Most first pages can be shaped in a focused sprint." },
            { question: "Can this expand later?", answer: "Yes. The page is stored as structured JSON for future editing." },
          ],
        },
        elements: [],
      };
    case "final_cta":
      return {
        id,
        type,
        props: {
          headline: "Ready to move forward?",
          subhead: "End the page with a clear next step.",
          cta_text: "Book a call",
          cta_href: "/contact",
          background_color: "#255741",
          background_size: "cover",
          background_position: "center",
          text_align: "center",
        },
        elements: [],
      };
  }
}
