import type { Page, Section, SectionType } from "@clear-position/shared";
import { Page as PageSchema, Section as SectionSchema } from "@clear-position/shared";

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  category: string;
  recommendedSiteType?: string;
  version: 1;
}

export type TemplateSection = Omit<Section, "id" | "elements"> & {
  elements?: Section["elements"];
};

export interface SectionTemplate extends TemplateMeta {
  section: TemplateSection;
}

export interface PageTemplate extends TemplateMeta {
  sections: TemplateSection[];
}

function hero(props: Extract<Section, { type: "hero" }>["props"]): TemplateSection {
  return { type: "hero", props, elements: [] };
}

function problem(props: Extract<Section, { type: "problem" }>["props"]): TemplateSection {
  return { type: "problem", props, elements: [] };
}

function solution(props: Extract<Section, { type: "solution" }>["props"]): TemplateSection {
  return { type: "solution", props, elements: [] };
}

function process(props: Extract<Section, { type: "process" }>["props"]): TemplateSection {
  return { type: "process", props, elements: [] };
}

function proof(props: Extract<Section, { type: "proof" }>["props"]): TemplateSection {
  return { type: "proof", props, elements: [] };
}

function services(props: Extract<Section, { type: "services" }>["props"]): TemplateSection {
  return { type: "services", props, elements: [] };
}

function faq(props: Extract<Section, { type: "faq" }>["props"]): TemplateSection {
  return { type: "faq", props, elements: [] };
}

function finalCta(props: Extract<Section, { type: "final_cta" }>["props"]): TemplateSection {
  return { type: "final_cta", props, elements: [] };
}

export const sectionTemplates: SectionTemplate[] = [
  {
    id: "hero-direct-cta",
    name: "Hero: Direct CTA",
    description: "A clear promise, short explanation, and primary action.",
    category: "Hero",
    recommendedSiteType: "Service business",
    version: 1,
    section: hero({
      eyebrow: "Your business name",
      headline: "Describe the outcome you help customers achieve.",
      subhead: "Use this space to say who you help, what changes, and why the next step is easy.",
      cta_text: "Book a consultation",
      cta_href: "/contact",
      background_color: "#f6f7f3",
      background_size: "cover",
      background_position: "center",
      text_align: "left",
    }),
  },
  {
    id: "hero-authority-trust",
    name: "Hero: Authority/Trust",
    description: "A credibility-led opening for expert or consultant sites.",
    category: "Hero",
    recommendedSiteType: "Consultant",
    version: 1,
    section: hero({
      eyebrow: "Trusted by focused teams",
      headline: "Make complex decisions feel simple for your buyers.",
      subhead: "Replace this copy with the specific audience, problem, and proof your business can own.",
      cta_text: "See how it works",
      cta_href: "#process",
      background_color: "#eef5ee",
      background_size: "cover",
      background_position: "center",
      text_align: "center",
    }),
  },
  {
    id: "problem-pain-points",
    name: "Problem: Pain Points",
    description: "Three buyer-facing pain points.",
    category: "Problem",
    version: 1,
    section: problem({
      eyebrow: "What is getting in the way",
      headline: "Your best prospects are closer than they look, but the page is making them work too hard.",
      intro: "Use these cards to name the friction your customer already recognizes.",
      problems: [
        { title: "The offer takes too long to understand", description: "Visitors cannot quickly tell whether this is for them." },
        { title: "The next step feels risky", description: "The page does not answer enough objections before asking for action." },
        { title: "Proof is scattered", description: "Credibility exists, but it is not placed where buyers need it." },
      ],
    }),
  },
  {
    id: "solution-offer-framing",
    name: "Solution: Offer Framing",
    description: "A concise offer explanation with supporting bullets.",
    category: "Solution",
    version: 1,
    section: solution({
      eyebrow: "The offer",
      headline: "A focused service that turns uncertainty into a clear next step.",
      body: "Describe your method in plain language. Make the buyer understand what changes and why your approach is safer than doing nothing.",
      bullets: ["Clear scope", "Specific outcome", "Simple path to start"],
    }),
  },
  {
    id: "process-3-steps",
    name: "Process: 3 Steps",
    description: "A simple three-step delivery process.",
    category: "Process",
    version: 1,
    section: process({
      eyebrow: "How it works",
      headline: "A low-friction path from interest to outcome.",
      steps: [
        { title: "Clarify", description: "Define the goal, audience, constraints, and success criteria." },
        { title: "Build", description: "Create the focused page or offer system around those decisions." },
        { title: "Improve", description: "Use feedback to refine copy, sections, and calls to action." },
      ],
    }),
  },
  {
    id: "proof-metrics-testimonial",
    name: "Proof: Metrics/Testimonial",
    description: "A quote plus two measurable proof points.",
    category: "Proof",
    version: 1,
    section: proof({
      eyebrow: "Proof",
      headline: "Give buyers a reason to believe the promise.",
      quote: "Replace this with a specific customer quote about the outcome, the process, or the moment things became clearer.",
      attribution: "Customer name, role",
      metrics: [
        { value: "30%", label: "more qualified inquiries" },
        { value: "2x", label: "faster buying conversations" },
      ],
    }),
  },
  {
    id: "services-3-cards",
    name: "Services: 3 Service Cards",
    description: "A three-card services section.",
    category: "Services",
    version: 1,
    section: services({
      eyebrow: "Services",
      headline: "Choose the level of help that matches the moment.",
      services: [
        { title: "Strategy Sprint", description: "Clarify positioning, audience, and the offer narrative." },
        { title: "Homepage Build", description: "Turn the strategy into a focused, schema-driven page." },
        { title: "Site System", description: "Extend the page into connected sections and supporting pages." },
      ],
    }),
  },
  {
    id: "faq-common-questions",
    name: "FAQ: Common Questions",
    description: "Questions that reduce buying friction.",
    category: "FAQ",
    version: 1,
    section: faq({
      eyebrow: "Questions",
      headline: "Common questions before getting started.",
      items: [
        { question: "How quickly can we start?", answer: "Replace this with your realistic timeline and first step." },
        { question: "What do you need from us?", answer: "List the inputs, access, or decisions that make the work smoother." },
        { question: "Can this grow into a larger site?", answer: "Yes. The page is structured so sections can expand over time." },
      ],
    }),
  },
  {
    id: "final-cta-book-call",
    name: "Final CTA: Book Call",
    description: "A direct closing call to action.",
    category: "Final CTA",
    version: 1,
    section: finalCta({
      headline: "Ready to make the next step obvious?",
      subhead: "Invite the right buyer to take one clear action.",
      cta_text: "Book a consultation",
      cta_href: "/contact",
      background_color: "#255741",
      background_size: "cover",
      background_position: "center",
      text_align: "center",
    }),
  },
];

const directHero = sectionTemplates.find((template) => template.id === "hero-direct-cta")!.section;
const trustHero = sectionTemplates.find((template) => template.id === "hero-authority-trust")!.section;
const painPoints = sectionTemplates.find((template) => template.id === "problem-pain-points")!.section;
const offer = sectionTemplates.find((template) => template.id === "solution-offer-framing")!.section;
const threeSteps = sectionTemplates.find((template) => template.id === "process-3-steps")!.section;
const proofBlock = sectionTemplates.find((template) => template.id === "proof-metrics-testimonial")!.section;
const serviceCards = sectionTemplates.find((template) => template.id === "services-3-cards")!.section;
const commonFaq = sectionTemplates.find((template) => template.id === "faq-common-questions")!.section;
const bookCall = sectionTemplates.find((template) => template.id === "final-cta-book-call")!.section;

export const pageTemplates: PageTemplate[] = [
  {
    id: "core-business-homepage",
    name: "Core Business Homepage",
    description: "A complete homepage for the primary site in a company site system.",
    category: "Homepage",
    recommendedSiteType: "Core site",
    version: 1,
    sections: [directHero, painPoints, offer, serviceCards, proofBlock, commonFaq, bookCall],
  },
  {
    id: "service-business-homepage",
    name: "Service Business Homepage",
    description: "A services-forward page for selling a clear business offer.",
    category: "Homepage",
    recommendedSiteType: "Service business",
    version: 1,
    sections: [directHero, painPoints, serviceCards, threeSteps, proofBlock, bookCall],
  },
  {
    id: "landing-page",
    name: "Landing Page",
    description: "A lean conversion page for one offer or campaign.",
    category: "Landing page",
    recommendedSiteType: "Campaign",
    version: 1,
    sections: [directHero, offer, proofBlock, commonFaq, bookCall],
  },
  {
    id: "multi-site-hub-page",
    name: "Multi-Site Hub Page",
    description: "A hub-style page for a company linking multiple focused child sites.",
    category: "Hub",
    recommendedSiteType: "Core site",
    version: 1,
    sections: [
      hero({
        eyebrow: "Your business name",
        headline: "Find the right path through our focused sites.",
        subhead: "Use this hub to guide visitors to the offer, audience, or location that fits their need.",
        cta_text: "Explore services",
        cta_href: "#services",
        background_color: "#f6f7f3",
        background_size: "cover",
        background_position: "center",
        text_align: "left",
      }),
      services({
        eyebrow: "Choose a path",
        headline: "Start with the site that matches your situation.",
        services: [
          { title: "Core Services", description: "For buyers comparing the main company offer." },
          { title: "Specialized Practice", description: "For visitors who need a focused solution or vertical." },
          { title: "Resources", description: "For people learning before they are ready to talk." },
        ],
      }),
      proofBlock,
      commonFaq,
      bookCall,
    ],
  },
  {
    id: "consultant-authority-homepage",
    name: "Simple Authority / Consultant Homepage",
    description: "A credibility-led homepage for an expert, advisor, or solo consultant.",
    category: "Homepage",
    recommendedSiteType: "Consultant",
    version: 1,
    sections: [trustHero, painPoints, offer, threeSteps, proofBlock, commonFaq, bookCall],
  },
];

function nextId(type: SectionType, usedIds: Set<string>): string {
  let id = "";
  do {
    const random = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    id = `sec_${type}_${random.slice(0, 8)}`;
  } while (usedIds.has(id));
  usedIds.add(id);
  return id;
}

export function instantiateTemplateSection(templateSection: TemplateSection, usedIds = new Set<string>()): Section | null {
  const section = {
    ...structuredClone(templateSection),
    id: nextId(templateSection.type, usedIds),
    elements: templateSection.elements ?? [],
  };
  const result = SectionSchema.safeParse(section);
  return result.success ? result.data : null;
}

export function instantiateTemplateSections(templateSections: TemplateSection[], existingIds: string[] = []): Section[] | null {
  const usedIds = new Set(existingIds);
  const sections: Section[] = [];
  for (const templateSection of templateSections) {
    const section = instantiateTemplateSection(templateSection, usedIds);
    if (!section) return null;
    sections.push(section);
  }
  return sections;
}

export function validateTemplatePage(currentPage: Page, sections: Section[]): Page | null {
  const nextPage: Page = {
    ...currentPage,
    doc: {
      ...currentPage.doc,
      sections,
    },
  };
  const result = PageSchema.safeParse(nextPage);
  return result.success ? result.data : null;
}
