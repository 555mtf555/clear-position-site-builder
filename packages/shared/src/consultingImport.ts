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

  // Hero uses the strongest CTA option; final CTA uses the second when available to avoid repetition.
  const heroCta = normalizeCta(packet.cta_options?.[0]);
  const finalCtaOption = normalizeCta(packet.cta_options?.[1] ?? packet.cta_options?.[0]);

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

  const builtServices = buildServices(packet);
  const servicesFromCoreMessages = !packet.services?.length && Boolean(packet.core_messages?.length);
  const servicesNote = packet.services?.length
    ? "Generated from the services field."
    : packet.core_messages?.length
      ? "Generated from core_messages as placeholder service cards. Review and rename titles before publishing."
      : text(packet.primary_offer) || text(packet.offer_summary)
        ? "Generated from offer fields as a single service card."
        : "Fallback content used — no services, messages, or offer content was provided.";

  const sectionSources: SectionSourceNote[] = [];
  const sections: Section[] = [
    {
      id: `${prefix}_hero`,
      type: "hero",
      props: {
        eyebrow: packet.project_name ?? packet.company_name,
        headline,
        subhead: subhead || "Edit this subhead to explain what makes this offer different and who it serves.",
        cta_text: heroCta.text,
        cta_href: heroCta.href,
        background_size: "cover",
        background_position: "center",
        text_align: "left",
      },
      elements: [],
    },
    {
      id: `${prefix}_problem`,
      type: "problem",
      variant: "soft-card",
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
      variant: "centered",
      props: {
        eyebrow: "The solution",
        headline: packet.primary_offer ?? "A clearer path from interest to action.",
        body: packet.offer_summary ?? packet.positioning_statement ?? "Describe the key mechanism that makes this offer effective and how it helps your target customer.",
        bullets: safeStringArray(packet.core_messages, ["Clarify the audience", "Frame the offer", "Make the next step easy"]),
      },
      elements: [],
    },
    {
      id: `${prefix}_process`,
      type: "process",
      variant: "centered",
      props: {
        eyebrow: "How it works",
        headline: "A simple process customers can understand.",
        steps: cardsFrom(packet.three_step_process, [
          { title: "Understand the need", description: "Confirm the customer's problem and what a good outcome looks like." },
          { title: "Apply the method", description: "Describe the core approach and what makes it effective." },
          { title: "Deliver the result", description: "Explain what customers receive and what changes for them." },
        ]).slice(0, 4),
      },
      elements: [],
    },
    {
      id: `${prefix}_proof`,
      type: "proof",
      variant: "minimal",
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
      variant: "soft-card",
      props: {
        eyebrow: "Services",
        headline: "Ways to work together.",
        services: builtServices,
      },
      elements: [],
    },
    {
      id: `${prefix}_faq`,
      type: "faq",
      variant: "minimal",
      props: {
        eyebrow: "FAQ",
        headline: "Common questions before getting started.",
        items: packet.faq_items?.length
          ? faqFrom(packet.faq_items)
          : buildFaqFallback(packet, warnings),
      },
      elements: [],
    },
    {
      id: `${prefix}_final_cta`,
      type: "final_cta",
      props: {
        headline: buildFinalCtaHeadline(packet),
        subhead: packet.offer_summary,
        cta_text: finalCtaOption.text,
        cta_href: finalCtaOption.href,
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
      note: "Generated from homepage_headlines, positioning_statement, and cta_options. Edit the headline to match the final approved copy.",
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
      note: "Generated from customer_problem and pain_points. Review problem cards against the approved discovery findings.",
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
      note: "Generated from primary_offer, offer_summary, and core_messages. Edit bullets to match the final offer framing.",
    },
    {
      section_id: `${prefix}_process`,
      section_type: "process",
      sources: packet.three_step_process?.length ? ["three_step_process"] : [],
      used_fallback: !packet.three_step_process?.length,
      note: packet.three_step_process?.length
        ? "Generated from three_step_process. Verify step descriptions match the approved delivery process."
        : "Fallback content used because no three_step_process was provided. Replace with the real delivery steps.",
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
        : packet.testimonials?.length
          ? "Generated from testimonials and proof points."
          : "Fallback content used — no approved testimonials or proof points were provided. Add verified evidence before publishing.",
    },
    {
      section_id: `${prefix}_services`,
      section_type: "services",
      sources: compact([
        packet.services?.length ? "services" : undefined,
        servicesFromCoreMessages ? "core_messages" : undefined,
        text(packet.primary_offer) ? "primary_offer" : undefined,
        text(packet.offer_summary) ? "offer_summary" : undefined,
      ]),
      used_fallback: !packet.services?.length && !packet.core_messages?.length && !text(packet.primary_offer) && !text(packet.offer_summary),
      note: servicesNote,
    },
    {
      section_id: `${prefix}_faq`,
      section_type: "faq",
      sources: packet.faq_items?.length
        ? ["faq_items"]
        : compact([
            packet.missing_assets?.length ? "missing_assets" : undefined,
            warnings.length ? "validation_warnings" : undefined,
            text(packet.offer_summary) || text(packet.primary_offer) ? "offer_summary" : undefined,
            text(packet.audience_summary) || text(packet.customer_problem) ? "audience_summary" : undefined,
            hasCta(packet.cta_options) ? "cta_options" : undefined,
          ]),
      used_fallback: !packet.faq_items?.length,
      note: packet.faq_items?.length
        ? "Generated from faq_items. Add or remove questions based on what buyers most commonly ask."
        : "Fallback FAQ generated from missing_assets, validation_warnings, and offer context. Review and replace with real buyer questions before publishing.",
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
      note: "Generated from cta_options and offer fields. Uses a different CTA option from the hero where available.",
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
      // Non-numeric proof strings are not metric cards — skip them.
      if (!/\d/.test(item)) return [];
      if (avoidNumericProof) {
        omittedRiskyProof = true;
        return [];
      }
      return [{ value: "—", label: item }];
    }
    const value = text(item.value) ?? "";
    const label = text(item.label ?? item.description) ?? "Validated point";
    // Skip items with no meaningful numeric value.
    if (!value) return [];
    if (avoidNumericProof && /\d/.test(`${value} ${label}`)) {
      omittedRiskyProof = true;
      return [];
    }
    return [{ value, label }];
  });

  const testimonial = packet.testimonials?.map(normalizeTestimonial).find((item) => item.quote);
  return {
    quote: testimonial?.quote ?? (metrics.length === 0 ? "Add an approved client quote here. The proof section is ready for a verified testimonial." : undefined),
    attribution: testimonial?.attribution,
    metrics,
    omittedRiskyProof,
  };
}

function buildServices(packet: ConsultingPacketImport): Array<{ title: string; description: string }> {
  // 1. Use explicit services list when present.
  if (packet.services?.length) {
    return dedupeCards(cardsFrom(packet.services, []));
  }
  // 2. Fall back to core_messages as placeholder service topics.
  if (packet.core_messages?.length) {
    return packet.core_messages.slice(0, 3).map((msg) => ({
      title: msg,
      description: "Expand with specific deliverables and client outcomes.",
    }));
  }
  // 3. Single card from offer fields.
  if (text(packet.offer_summary) || text(packet.primary_offer)) {
    return [{
      title: text(packet.primary_offer) ?? "Core offer",
      description: text(packet.offer_summary) ?? "Describe what customers receive and what changes as a result.",
    }];
  }
  // 4. Minimal fallback.
  return [{ title: "Core offer", description: "Describe the primary service or deliverable customers can choose." }];
}

function dedupeCards(cards: Array<{ title: string; description: string }>): Array<{ title: string; description: string }> {
  const seen = new Set<string>();
  return cards.filter((card) => {
    const key = card.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildFinalCtaHeadline(packet: ConsultingPacketImport): string {
  if (text(packet.primary_offer)) return `Ready to start with ${packet.primary_offer}?`;
  if (text(packet.company_name)) return `Work with ${packet.company_name}.`;
  return "Ready to take the next step?";
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
    : [{ question: "What should a visitor know before contacting you?", answer: "Edit this answer to address the most common question your buyer has before reaching out." }];
}

function buildFaqFallback(
  packet: ConsultingPacketImport,
  warnings: string[],
): Array<{ question: string; answer: string }> {
  const items: Array<{ question: string; answer: string }> = [];
  const warningText = warnings.join(" ").toLowerCase();

  // Q1: Who is this for? (buyer-facing orientation from audience or problem)
  const audience = text(packet.audience_summary) ?? text(packet.customer_problem);
  if (audience) {
    items.push({
      question: "Who is this for?",
      answer: audience,
    });
  }

  // Q2: What's the next step? (buyer-facing, grounded in real offer + CTA)
  const offer = text(packet.offer_summary) ?? text(packet.primary_offer);
  const cta = normalizeCta(packet.cta_options?.[0]);
  if (offer) {
    items.push({
      question: "What's the next step?",
      answer: `${offer} To get started, ${cta.text.charAt(0).toLowerCase() + cta.text.slice(1)}.`,
    });
  } else if (hasCta(packet.cta_options)) {
    items.push({
      question: "What's the next step?",
      answer: `${cta.text} to discuss your goals and see if this is the right fit.`,
    });
  }

  // Q3: Proof / testimonials caveat (only when explicitly flagged as missing or unverified)
  const hasMissingTestimonials =
    packet.missing_assets?.some((a) => /testimonial|quote/i.test(a)) ||
    /testimonial|missing.*proof/i.test(warningText);
  if (hasMissingTestimonials) {
    items.push({
      question: "Can this page use testimonials or proof claims?",
      answer:
        "Only approved proof should be used here. Add verified testimonials or results before publishing.",
    });
  }

  // Q4: Missing assets — what still needs to be gathered
  const assetLabels = (packet.missing_assets ?? [])
    .map((a) => {
      const label = a.split(":")[0]?.trim() ?? "";
      return label ? label.charAt(0).toUpperCase() + label.slice(1) : null;
    })
    .filter((label): label is string => Boolean(label));
  if (assetLabels.length > 0) {
    items.push({
      question: "What still needs to be added before this page is published?",
      answer: `The following are still outstanding: ${assetLabels.join("; ")}. Gather these before the final review.`,
    });
  }

  // Limit to 4 items.
  const result = items.slice(0, 4);

  // Final fallback when no contextual content could be found.
  if (result.length === 0) {
    return [{
      question: "What should a visitor know before reaching out?",
      answer: "Edit this answer to address the most common question your buyer has before getting started.",
    }];
  }

  return result;
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
