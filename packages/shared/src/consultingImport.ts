import { z } from "zod";
import { BrandKit } from "./schemas/brandkit";
import { PageDoc } from "./schemas/page";
import type { PageDoc as PageDocType } from "./schemas/page";
import type { Section } from "./schemas/section";

const TextCard = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

const CtaOption = z.object({
  text: z.string().optional(),
  href: z.string().optional(),
});

const Testimonial = z.object({
  quote: z.string().optional(),
  attribution: z.string().optional(),
});

const ProofPoint = z.object({
  value: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
});

const FaqItem = z.object({
  question: z.string().optional(),
  answer: z.string().optional(),
});

export const ConsultingPacketImport = z.object({
  company_name: z.string().optional(),
  project_name: z.string().optional(),
  positioning_statement: z.string().optional(),
  audience_summary: z.string().optional(),
  customer_problem: z.string().optional(),
  pain_points: z.array(TextCard.or(z.string())).optional(),
  core_messages: z.array(z.string()).optional(),
  offer_summary: z.string().optional(),
  primary_offer: z.string().optional(),
  services: z.array(TextCard.or(z.string())).optional(),
  homepage_headlines: z.array(z.string()).optional(),
  cta_options: z.array(CtaOption.or(z.string())).optional(),
  three_step_process: z.array(TextCard.or(z.string())).optional(),
  proof_points: z.array(ProofPoint.or(z.string())).optional(),
  testimonials: z.array(Testimonial.or(z.string())).optional(),
  faq_items: z.array(FaqItem).optional(),
  homepage_section_outline: z.array(z.string()).optional(),
  brand_kit_suggestions: BrandKit.deepPartial().optional(),
  missing_assets: z.array(z.string()).optional(),
  validation_warnings: z.array(z.string()).optional(),
  source_map: z.record(z.unknown()).optional(),
});
export type ConsultingPacketImport = z.infer<typeof ConsultingPacketImport>;

export interface ConsultingPacketAdapterOptions {
  idPrefix?: string;
}

interface SectionSourceNote {
  section_id: string;
  section_type: Section["type"];
  sources: string[];
  used_fallback: boolean;
  note?: string;
}

export function createPageDraftFromConsultingPacket(
  packet: ConsultingPacketImport,
  options: ConsultingPacketAdapterOptions = {},
): PageDocType {
  const prefix = sanitizeIdPart(options.idPrefix ?? "import");
  const warnings = packet.validation_warnings ?? [];
  const importNotes = [
    ...warnings.map((warning) => `Validation warning: ${warning}`),
    ...(packet.missing_assets ?? []).map((asset) => `Missing asset: ${asset}`),
    ...(packet.brand_kit_suggestions ? ["Packet includes brand kit suggestions; review manually before applying."] : []),
  ];
  const cta = normalizeCta(packet.cta_options?.[0]);
  const headline = firstText(packet.homepage_headlines)
    ?? text(packet.positioning_statement)
    ?? `${text(packet.company_name) ?? "Your business"} helps customers move forward with clarity.`;
  const subhead = compact([
    packet.audience_summary,
    packet.offer_summary ?? packet.primary_offer,
  ]).join(" ");

  const proof = buildProof(packet, warnings);
  if (proof.omittedRiskyProof) {
    importNotes.push("Numeric proof was omitted because validation warnings referenced unverified claims.");
  }

  const sectionSources: SectionSourceNote[] = [];
  const sections: Section[] = [
    {
      id: `${prefix}_hero`,
      type: "hero",
      props: {
        eyebrow: packet.project_name ?? packet.company_name,
        headline,
        subhead: subhead || "A focused website draft generated from the approved strategy packet.",
        cta_text: cta.text,
        cta_href: cta.href,
        background_size: "cover",
        background_position: "center",
        text_align: "left",
      },
      elements: [],
    },
    {
      id: `${prefix}_problem`,
      type: "problem",
      props: {
        eyebrow: "The problem",
        headline: packet.customer_problem ?? "Customers need a clearer reason to choose you.",
        intro: packet.audience_summary,
        problems: cardsFrom(packet.pain_points, [
          { title: "The offer is hard to evaluate", description: packet.customer_problem ?? "Visitors need the page to make the next step obvious." },
        ]),
      },
      elements: [],
    },
    {
      id: `${prefix}_solution`,
      type: "solution",
      props: {
        eyebrow: "The solution",
        headline: packet.primary_offer ?? "A clearer path from interest to action.",
        body: packet.offer_summary ?? packet.positioning_statement ?? "This page turns the packet strategy into a structured buying story.",
        bullets: safeStringArray(packet.core_messages, ["Clarify the audience", "Frame the offer", "Make the next step easy"]),
      },
      elements: [],
    },
    {
      id: `${prefix}_process`,
      type: "process",
      props: {
        eyebrow: "How it works",
        headline: "A simple process customers can understand.",
        steps: cardsFrom(packet.three_step_process, [
          { title: "Clarify", description: "Confirm the audience, problem, and promise." },
          { title: "Shape", description: "Turn the offer into sections that build trust." },
          { title: "Act", description: "Give visitors a direct next step." },
        ]).slice(0, 4),
      },
      elements: [],
    },
    {
      id: `${prefix}_proof`,
      type: "proof",
      props: {
        eyebrow: "Proof",
        headline: "Reasons to believe the promise.",
        quote: proof.quote,
        attribution: proof.attribution,
        metrics: proof.metrics,
      },
      elements: [],
    },
    {
      id: `${prefix}_services`,
      type: "services",
      props: {
        eyebrow: "Services",
        headline: "Ways to work together.",
        services: cardsFrom(packet.services, [
          { title: packet.primary_offer ?? "Primary offer", description: packet.offer_summary ?? "Describe the main service customers can buy." },
        ]),
      },
      elements: [],
    },
    {
      id: `${prefix}_faq`,
      type: "faq",
      props: {
        eyebrow: "FAQ",
        headline: "Common questions before getting started.",
        items: faqFrom(packet.faq_items),
      },
      elements: [],
    },
    {
      id: `${prefix}_final_cta`,
      type: "final_cta",
      props: {
        headline: `Ready to explore ${packet.primary_offer ?? "the next step"}?`,
        subhead: packet.offer_summary,
        cta_text: cta.text,
        cta_href: cta.href,
        background_size: "cover",
        background_position: "center",
        text_align: "center",
      },
      elements: [],
    },
  ];
  sectionSources.push(
    {
      section_id: `${prefix}_hero`,
      section_type: "hero",
      sources: compact([
        hasText(packet.homepage_headlines) ? "homepage_headlines" : undefined,
        text(packet.positioning_statement) ? "positioning_statement" : undefined,
        hasCta(packet.cta_options) ? "cta_options" : undefined,
      ]),
      used_fallback: !hasText(packet.homepage_headlines) && !text(packet.positioning_statement),
      note: "Hero generated from headline, positioning, audience, offer, and CTA packet fields.",
    },
    {
      section_id: `${prefix}_problem`,
      section_type: "problem",
      sources: compact([
        text(packet.customer_problem) ? "customer_problem" : undefined,
        packet.pain_points?.length ? "pain_points" : undefined,
        text(packet.audience_summary) ? "audience_summary" : undefined,
      ]),
      used_fallback: !text(packet.customer_problem) && !packet.pain_points?.length,
      note: "Problem section generated from customer problem and pain-point fields.",
    },
    {
      section_id: `${prefix}_solution`,
      section_type: "solution",
      sources: compact([
        text(packet.primary_offer) ? "primary_offer" : undefined,
        text(packet.offer_summary) ? "offer_summary" : undefined,
        packet.core_messages?.length ? "core_messages" : undefined,
      ]),
      used_fallback: !text(packet.primary_offer) && !text(packet.offer_summary) && !packet.core_messages?.length,
      note: "Solution section generated from offer and core-message fields.",
    },
    {
      section_id: `${prefix}_process`,
      section_type: "process",
      sources: packet.three_step_process?.length ? ["three_step_process"] : [],
      used_fallback: !packet.three_step_process?.length,
      note: "Process section generated from three_step_process or a safe default process.",
    },
    {
      section_id: `${prefix}_proof`,
      section_type: "proof",
      sources: compact([
        packet.proof_points?.length ? "proof_points" : undefined,
        packet.testimonials?.length ? "testimonials" : undefined,
        proof.omittedRiskyProof ? "validation_warnings" : undefined,
      ]),
      used_fallback: (!packet.proof_points?.length && !packet.testimonials?.length) || proof.omittedRiskyProof,
      note: proof.omittedRiskyProof
        ? "Proof was simplified because validation warnings referenced unverified numeric claims."
        : "Proof section generated from proof points and testimonials.",
    },
    {
      section_id: `${prefix}_services`,
      section_type: "services",
      sources: compact([
        packet.services?.length ? "services" : undefined,
        text(packet.primary_offer) ? "primary_offer" : undefined,
        text(packet.offer_summary) ? "offer_summary" : undefined,
      ]),
      used_fallback: !packet.services?.length && !text(packet.primary_offer) && !text(packet.offer_summary),
      note: "Services section generated from services and offer fields.",
    },
    {
      section_id: `${prefix}_faq`,
      section_type: "faq",
      sources: packet.faq_items?.length ? ["faq_items"] : [],
      used_fallback: !packet.faq_items?.length,
      note: "FAQ section generated from faq_items or a safe placeholder question.",
    },
    {
      section_id: `${prefix}_final_cta`,
      section_type: "final_cta",
      sources: compact([
        hasCta(packet.cta_options) ? "cta_options" : undefined,
        text(packet.primary_offer) ? "primary_offer" : undefined,
        text(packet.offer_summary) ? "offer_summary" : undefined,
      ]),
      used_fallback: !hasCta(packet.cta_options) && !text(packet.primary_offer),
      note: "Final CTA generated from CTA and offer fields.",
    },
  );

  return PageDoc.parse({
    version: 1,
    metadata: {
      meta_title: packet.project_name ?? packet.company_name,
      meta_description: packet.positioning_statement ?? packet.offer_summary,
      import_notes: importNotes.length > 0 ? importNotes : undefined,
      import_source: "consulting_packet",
      import_company_name: packet.company_name,
      import_project_name: packet.project_name,
      import_source_map: packet.source_map,
      import_section_sources: sectionSources,
    },
    sections,
  });
}

function buildProof(packet: ConsultingPacketImport, warnings: string[]) {
  const warningText = warnings.join(" ").toLowerCase();
  const avoidNumericProof = /unverified|unsupported|risky|claim|metric|proof|number/.test(warningText);
  let omittedRiskyProof = false;
  const metrics = (packet.proof_points ?? []).flatMap((item) => {
    if (typeof item === "string") {
      if (avoidNumericProof && /\d/.test(item)) {
        omittedRiskyProof = true;
        return [];
      }
      return [{ value: "Proof", label: item }];
    }
    const value = text(item.value) ?? "Proof";
    const label = text(item.label ?? item.description) ?? "Validated point";
    if (avoidNumericProof && /\d/.test(`${value} ${label}`)) {
      omittedRiskyProof = true;
      return [];
    }
    return [{ value, label }];
  });
  const testimonial = packet.testimonials?.map(normalizeTestimonial).find((item) => item.quote);
  return {
    quote: testimonial?.quote ?? (metrics.length === 0 ? "Add a verified customer quote or proof point here." : undefined),
    attribution: testimonial?.attribution,
    metrics,
    omittedRiskyProof,
  };
}

function cardsFrom(input: Array<z.infer<typeof TextCard> | string> | undefined, fallback: Array<{ title: string; description: string }>) {
  const cards = (input ?? []).map((item, index) => {
    if (typeof item === "string") {
      return { title: item, description: "Expand this point with specific customer-facing detail." };
    }
    return {
      title: text(item.title) ?? `Point ${index + 1}`,
      description: text(item.description) ?? "Add the supporting detail from the packet.",
    };
  });
  return cards.length > 0 ? cards : fallback;
}

function faqFrom(input: Array<z.infer<typeof FaqItem>> | undefined) {
  const items = (input ?? [])
    .map((item) => ({
      question: text(item.question),
      answer: text(item.answer),
    }))
    .filter((item): item is { question: string; answer: string } => Boolean(item.question && item.answer));
  return items.length > 0
    ? items
    : [{ question: "What should visitors do next?", answer: "Replace this answer with the clearest next step from the packet." }];
}

function normalizeCta(option: z.infer<typeof CtaOption> | string | undefined) {
  if (typeof option === "string") return { text: option, href: "/contact" };
  return {
    text: text(option?.text) ?? "Book a consultation",
    href: text(option?.href) ?? "/contact",
  };
}

function normalizeTestimonial(item: z.infer<typeof Testimonial> | string) {
  if (typeof item === "string") return { quote: item, attribution: undefined };
  return { quote: text(item.quote), attribution: text(item.attribution) };
}

function firstText(values: string[] | undefined): string | undefined {
  return values?.map(text).find((value): value is string => Boolean(value));
}

function safeStringArray(values: string[] | undefined, fallback: string[]): string[] {
  const cleaned = (values ?? []).map(text).filter((value): value is string => Boolean(value));
  return cleaned.length > 0 ? cleaned : fallback;
}

function hasText(values: string[] | undefined): boolean {
  return Boolean(firstText(values));
}

function hasCta(values: Array<z.infer<typeof CtaOption> | string> | undefined): boolean {
  return Boolean(values?.some((value) => typeof value === "string" ? text(value) : text(value.text)));
}

function compact(values: Array<string | undefined>): string[] {
  return values.map(text).filter((value): value is string => Boolean(value));
}

function text(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function sanitizeIdPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "import";
}
