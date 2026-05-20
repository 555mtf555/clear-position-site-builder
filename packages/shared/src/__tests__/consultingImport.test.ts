import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  ConsultingPacketImport,
  PageDoc,
  createPageDraftFromConsultingPacket,
} from "..";

const richPacket = {
  company_name: "Clear Position",
  project_name: "Homepage Sprint",
  positioning_statement: "Clear Position turns expert service offers into websites buyers understand.",
  audience_summary: "For consultants and service firms with strong expertise but fuzzy buying paths.",
  customer_problem: "Visitors cannot quickly tell what the company sells or why it matters.",
  pain_points: [
    { title: "Unclear offer", description: "Prospects need too much explanation before booking." },
    { title: "Weak next step", description: "The page does not make action obvious." },
  ],
  core_messages: ["Clarify the offer", "Make proof easier to scan"],
  offer_summary: "A focused strategy-to-homepage sprint.",
  primary_offer: "Website Clarity Sprint",
  services: [
    { title: "Positioning", description: "Shape the message and audience." },
    { title: "Homepage draft", description: "Map the page into editable sections." },
  ],
  homepage_headlines: ["Make your value easier to understand and easier to buy."],
  cta_options: [{ text: "Book a consultation", href: "/contact" }],
  three_step_process: [
    { title: "Clarify", description: "Define the customer and promise." },
    { title: "Structure", description: "Build the buying story." },
    { title: "Refine", description: "Review and edit in the builder." },
  ],
  proof_points: [{ value: "2x", label: "clearer sales calls" }],
  testimonials: [{ quote: "The offer finally made sense.", attribution: "Client operator" }],
  faq_items: [{ question: "Can this be edited?", answer: "Yes, it becomes normal builder JSON." }],
  homepage_section_outline: ["hero", "problem", "solution"],
  brand_kit_suggestions: { colors: { primary_color: "#123456" } },
  missing_assets: ["founder headshot"],
  validation_warnings: ["Proof metric 2x is unverified."],
  source_map: { hero: "agent.homepage.headline" },
};

function loadFixture(path: string): unknown {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")) as unknown;
}

describe("ConsultingPacketImport", () => {
  it("accepts a minimal packet", () => {
    expect(ConsultingPacketImport.safeParse({ company_name: "Acme" }).success).toBe(true);
  });

  it("accepts a rich packet", () => {
    expect(ConsultingPacketImport.safeParse(richPacket).success).toBe(true);
  });

  it("validates the canonical JSON fixture", () => {
    const fixture = loadFixture("../../fixtures/consulting-packet-import.example.json");

    expect(ConsultingPacketImport.safeParse(fixture).success).toBe(true);
  });

  it("validates the realistic handoff fixture", () => {
    const fixture = loadFixture("../../fixtures/consulting-packet-import.realistic.json");

    expect(ConsultingPacketImport.safeParse(fixture).success).toBe(true);
  });
});

describe("createPageDraftFromConsultingPacket", () => {
  it("creates valid PageDoc from a minimal packet", () => {
    const doc = createPageDraftFromConsultingPacket({ company_name: "Acme" });

    expect(PageDoc.safeParse(doc).success).toBe(true);
    expect(doc.sections.map((section) => section.type)).toEqual([
      "hero",
      "problem",
      "solution",
      "process",
      "proof",
      "services",
      "faq",
      "final_cta",
    ]);
  });

  it("creates valid PageDoc from a rich packet and maps sections", () => {
    const doc = createPageDraftFromConsultingPacket(richPacket, { idPrefix: "packet" });

    expect(PageDoc.safeParse(doc).success).toBe(true);
    expect(doc.metadata?.import_company_name).toBe("Clear Position");
    expect(doc.metadata?.import_project_name).toBe("Homepage Sprint");
    const hero = doc.sections.find((section) => section.type === "hero");
    const problem = doc.sections.find((section) => section.type === "problem");
    const solution = doc.sections.find((section) => section.type === "solution");
    const process = doc.sections.find((section) => section.type === "process");
    const proof = doc.sections.find((section) => section.type === "proof");
    const services = doc.sections.find((section) => section.type === "services");
    const faq = doc.sections.find((section) => section.type === "faq");
    const finalCta = doc.sections.find((section) => section.type === "final_cta");

    expect(hero?.props.headline).toBe("Make your value easier to understand and easier to buy.");
    expect(problem?.props.problems[0]?.title).toBe("Unclear offer");
    expect(solution?.props.headline).toBe("Website Clarity Sprint");
    expect(process?.props.steps).toHaveLength(3);
    expect(proof?.props.quote).toBe("The offer finally made sense.");
    expect(services?.props.services[0]?.title).toBe("Positioning");
    expect(faq?.props.items[0]?.question).toBe("Can this be edited?");
    expect(finalCta?.props.cta_text).toBe("Book a consultation");
  });

  it("produces unique section IDs", () => {
    const doc = createPageDraftFromConsultingPacket(richPacket);
    const ids = doc.sections.map((section) => section.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes section source notes and marks fallback sections", () => {
    const doc = createPageDraftFromConsultingPacket({ company_name: "Acme" });

    const heroSource = doc.metadata?.import_section_sources?.find((source) => source.section_type === "hero");
    const faqSource = doc.metadata?.import_section_sources?.find((source) => source.section_type === "faq");

    expect(heroSource?.sources).toEqual([]);
    expect(heroSource?.used_fallback).toBe(true);
    expect(faqSource?.used_fallback).toBe(true);
    expect(faqSource?.note).toMatch(/fallback|placeholder/i);
  });

  it("marks rich sections as packet-generated", () => {
    const doc = createPageDraftFromConsultingPacket(richPacket);

    const heroSource = doc.metadata?.import_section_sources?.find((source) => source.section_type === "hero");
    const problemSource = doc.metadata?.import_section_sources?.find((source) => source.section_type === "problem");

    expect(heroSource?.sources).toContain("homepage_headlines");
    expect(heroSource?.used_fallback).toBe(false);
    expect(problemSource?.sources).toContain("customer_problem");
  });

  it("avoids and flags unverified numeric proof when warnings exist", () => {
    const doc = createPageDraftFromConsultingPacket(richPacket);
    const proof = doc.sections.find((section) => section.type === "proof");
    const proofSource = doc.metadata?.import_section_sources?.find((source) => source.section_type === "proof");

    expect(proof?.props.metrics).toEqual([]);
    expect(proofSource?.used_fallback).toBe(true);
    expect(proofSource?.note).toMatch(/unverified numeric/i);
    expect(doc.metadata?.import_notes?.some((note) => note.includes("Numeric proof was omitted"))).toBe(true);
    expect(doc.metadata?.import_notes?.some((note) => note.includes("founder headshot"))).toBe(true);
  });

  it("assigns visual variants to imported sections", () => {
    const doc = createPageDraftFromConsultingPacket(richPacket, { idPrefix: "packet" });

    const hero = doc.sections.find((s) => s.type === "hero");
    const problem = doc.sections.find((s) => s.type === "problem");
    const solution = doc.sections.find((s) => s.type === "solution");
    const process = doc.sections.find((s) => s.type === "process");
    const proof = doc.sections.find((s) => s.type === "proof");
    const services = doc.sections.find((s) => s.type === "services");
    const faq = doc.sections.find((s) => s.type === "faq");
    const finalCta = doc.sections.find((s) => s.type === "final_cta");

    // Hero and final_cta use their own background system — no content-layer variant.
    expect(hero?.variant).toBeUndefined();
    expect(finalCta?.variant).toBeUndefined();
    // Content sections get polished defaults.
    expect(problem?.variant).toBe("soft-card");
    expect(solution?.variant).toBe("centered");
    expect(process?.variant).toBe("centered");
    expect(proof?.variant).toBe("minimal");
    expect(services?.variant).toBe("soft-card");
    expect(faq?.variant).toBe("minimal");
  });

  it("uses a different CTA for the final_cta when two CTA options are provided", () => {
    const packet = ConsultingPacketImport.parse({
      company_name: "Acme",
      cta_options: [
        { text: "Book a consultation", href: "/contact" },
        { text: "See how it works", href: "/process" },
      ],
    });
    const doc = createPageDraftFromConsultingPacket(packet);
    const hero = doc.sections.find((s) => s.type === "hero");
    const finalCta = doc.sections.find((s) => s.type === "final_cta");

    expect(hero?.props.cta_text).toBe("Book a consultation");
    expect(finalCta?.props.cta_text).toBe("See how it works");
    expect(hero?.props.cta_text).not.toBe(finalCta?.props.cta_text);
  });

  it("uses the same CTA for hero and final_cta when only one option is provided", () => {
    const doc = createPageDraftFromConsultingPacket(richPacket, { idPrefix: "packet" });
    const finalCta = doc.sections.find((s) => s.type === "final_cta");

    // richPacket has only one CTA option.
    expect(finalCta?.props.cta_text).toBe("Book a consultation");
  });

  it("builds service cards from core_messages when no services field is present", () => {
    const packet = ConsultingPacketImport.parse({
      company_name: "Acme",
      core_messages: ["First message", "Second message", "Third message"],
    });
    const doc = createPageDraftFromConsultingPacket(packet);
    const services = doc.sections.find((s) => s.type === "services");
    const serviceSource = doc.metadata?.import_section_sources?.find((s) => s.section_type === "services");

    expect(services?.props.services[0]?.title).toBe("First message");
    expect(services?.props.services).toHaveLength(3);
    expect(serviceSource?.sources).toContain("core_messages");
    expect(serviceSource?.note).toMatch(/core_messages/);
    expect(serviceSource?.used_fallback).toBe(false);
  });

  it("deduplicates service cards with identical titles", () => {
    const packet = ConsultingPacketImport.parse({
      company_name: "Acme",
      services: [
        { title: "Sprint", description: "First" },
        { title: "Sprint", description: "Duplicate" },
        { title: "Build", description: "Third" },
      ],
    });
    const doc = createPageDraftFromConsultingPacket(packet);
    const services = doc.sections.find((s) => s.type === "services");
    const titles = services?.props.services.map((s) => s.title);

    expect(titles).toEqual(["Sprint", "Build"]);
  });

  it("does not create metric cards from non-numeric proof point strings", () => {
    const doc = createPageDraftFromConsultingPacket({
      company_name: "Acme",
      proof_points: ["A qualitative statement with no numbers"],
      validation_warnings: [],
    });
    const proof = doc.sections.find((s) => s.type === "proof");

    expect(proof?.props.metrics).toHaveLength(0);
  });

  it("provides an actionable proof placeholder when no testimonials or proof points exist", () => {
    const doc = createPageDraftFromConsultingPacket({ company_name: "Acme" });
    const proof = doc.sections.find((s) => s.type === "proof");

    expect(proof?.props.quote).toMatch(/approved|verified|testimonial/i);
    expect(proof?.props.metrics).toHaveLength(0);
  });

  it("builds a company-specific final_cta headline when primary_offer is absent", () => {
    const doc = createPageDraftFromConsultingPacket({ company_name: "Brightline" });
    const finalCta = doc.sections.find((s) => s.type === "final_cta");

    expect(finalCta?.props.headline).toContain("Brightline");
  });

  it("builds an offer-specific final_cta headline when primary_offer is present", () => {
    const doc = createPageDraftFromConsultingPacket({ company_name: "Acme", primary_offer: "Website Sprint" });
    const finalCta = doc.sections.find((s) => s.type === "final_cta");

    expect(finalCta?.props.headline).toContain("Website Sprint");
  });

  describe("FAQ fallback generation", () => {
    it("uses explicit faq_items directly when provided", () => {
      const doc = createPageDraftFromConsultingPacket({
        company_name: "Acme",
        faq_items: [
          { question: "How long does this take?", answer: "Typically two to three weeks." },
          { question: "What do you need from us?", answer: "A 90-minute discovery session." },
        ],
      });
      const faq = doc.sections.find((s) => s.type === "faq");
      const faqSource = doc.metadata?.import_section_sources?.find((s) => s.section_type === "faq");

      expect(faq?.props.items[0]?.question).toBe("How long does this take?");
      expect(faq?.props.items).toHaveLength(2);
      expect(faqSource?.sources).toContain("faq_items");
      expect(faqSource?.used_fallback).toBe(false);
    });

    it("generates a multi-item fallback FAQ from audience and offer context", () => {
      const doc = createPageDraftFromConsultingPacket({
        company_name: "Acme",
        audience_summary: "Growing service firms with 10–50 staff.",
        offer_summary: "A sprint to clarify positioning and structure the homepage.",
        cta_options: [{ text: "Book a consultation", href: "/contact" }],
      });
      const faq = doc.sections.find((s) => s.type === "faq");

      expect(faq?.props.items.length).toBeGreaterThanOrEqual(2);

      const hasAudienceQ = faq?.props.items.some((item) => /who.*for/i.test(item.question));
      expect(hasAudienceQ).toBe(true);

      const hasNextStepQ = faq?.props.items.some((item) => /next step|what.*step/i.test(item.question));
      expect(hasNextStepQ).toBe(true);
    });

    it("includes a proof caveat question when testimonials are flagged as missing", () => {
      const doc = createPageDraftFromConsultingPacket({
        company_name: "Acme",
        missing_assets: ["Approved testimonial: needed before proof section can be published"],
        validation_warnings: ["Missing testimonials: use placeholder language only."],
      });
      const faq = doc.sections.find((s) => s.type === "faq");

      const hasProofQ = faq?.props.items.some((item) => /testimonial|proof/i.test(item.question));
      expect(hasProofQ).toBe(true);

      const proofItem = faq?.props.items.find((item) => /testimonial|proof/i.test(item.question));
      expect(proofItem?.answer).toMatch(/approved|verified/i);
    });

    it("includes a missing-assets question when assets are listed", () => {
      const doc = createPageDraftFromConsultingPacket({
        company_name: "Acme",
        missing_assets: ["Logo permission: needed before publishing", "Headshot: for trust section"],
      });
      const faq = doc.sections.find((s) => s.type === "faq");

      const hasMissingQ = faq?.props.items.some((item) => /still need|outstanding|added/i.test(item.question));
      expect(hasMissingQ).toBe(true);

      const missingItem = faq?.props.items.find((item) => /still need|outstanding|added/i.test(item.question));
      expect(missingItem?.answer).toMatch(/Logo permission|Headshot/i);
    });

    it("marks fallback FAQ as used_fallback and references packet sources", () => {
      const doc = createPageDraftFromConsultingPacket({
        company_name: "Acme",
        audience_summary: "Service firms.",
        offer_summary: "A strategy sprint.",
        missing_assets: ["Headshot needed"],
      });
      const faqSource = doc.metadata?.import_section_sources?.find((s) => s.section_type === "faq");

      expect(faqSource?.used_fallback).toBe(true);
      expect(faqSource?.sources).toContain("audience_summary");
      expect(faqSource?.sources).toContain("missing_assets");
      expect(faqSource?.sources).toContain("offer_summary");
      expect(faqSource?.note).toMatch(/fallback/i);
    });

    it("fallback FAQ stays within the 4-item limit", () => {
      const doc = createPageDraftFromConsultingPacket({
        company_name: "Acme",
        audience_summary: "Growing service firms.",
        offer_summary: "A focused sprint.",
        cta_options: [{ text: "Book now", href: "/contact" }],
        missing_assets: ["Testimonial needed", "Logo needed", "Headshot needed"],
        validation_warnings: ["Missing testimonials: placeholder only."],
      });
      const faq = doc.sections.find((s) => s.type === "faq");

      expect(faq?.props.items.length).toBeLessThanOrEqual(4);
    });

    it("fallback FAQ does not invent pricing, guarantees, or measurable outcomes", () => {
      const doc = createPageDraftFromConsultingPacket({
        company_name: "Acme",
        offer_summary: "A focused strategy sprint to clarify positioning.",
        missing_assets: ["Logo needed"],
      });
      const faq = doc.sections.find((s) => s.type === "faq");
      const allText = faq?.props.items.map((i) => `${i.question} ${i.answer}`).join(" ") ?? "";

      expect(allText).not.toMatch(/\$[\d,]+|ROI|guarantee|refund|\d+%|\d+ days/i);
    });

    it("produces a non-empty, useful fallback FAQ from the realistic fixture", () => {
      const packet = ConsultingPacketImport.parse(loadFixture("../../fixtures/consulting-packet-import.realistic.json"));
      const doc = createPageDraftFromConsultingPacket(packet, { idPrefix: "brightline" });
      const faq = doc.sections.find((s) => s.type === "faq");
      const faqSource = doc.metadata?.import_section_sources?.find((s) => s.section_type === "faq");

      expect(faq?.props.items.length).toBeGreaterThanOrEqual(2);
      expect(faq?.props.items.length).toBeLessThanOrEqual(4);
      expect(faqSource?.used_fallback).toBe(true);
      expect(faqSource?.note).toMatch(/fallback/i);

      // Should not contain raw debug/internal text
      const allText = faq?.props.items.map((i) => `${i.question} ${i.answer}`).join(" ") ?? "";
      expect(allText).not.toMatch(/validation_warning|debug|internal/i);

      // Page doc should still validate
      expect(PageDoc.safeParse(doc).success).toBe(true);
    });
  });

  it("creates useful PageDoc from the realistic handoff fixture", () => {
    const packet = ConsultingPacketImport.parse(loadFixture("../../fixtures/consulting-packet-import.realistic.json"));
    const doc = createPageDraftFromConsultingPacket(packet, { idPrefix: "brightline" });

    expect(PageDoc.safeParse(doc).success).toBe(true);
    expect(doc.metadata?.import_company_name).toBe("Brightline Operations");
    expect(doc.metadata?.import_project_name).toBe("Brightline Operations Website Messaging Sprint");
    expect(doc.metadata?.import_notes).toEqual(expect.arrayContaining([
      expect.stringContaining("Unverified numeric claim"),
      expect.stringContaining("Approved client testimonial"),
      expect.stringContaining("Founder photo"),
    ]));
    expect(doc.metadata?.import_source_map).toEqual(expect.objectContaining({
      homepage_headline_options: "brand_story.headline_options",
    }));
    expect(doc.metadata?.import_section_sources).toHaveLength(doc.sections.length);

    const hero = doc.sections.find((section) => section.type === "hero");
    const problem = doc.sections.find((section) => section.type === "problem");
    const process = doc.sections.find((section) => section.type === "process");
    const proof = doc.sections.find((section) => section.type === "proof");

    expect(hero?.props.headline).toBe("Stop being the routing layer for every delivery decision.");
    expect(problem?.props.headline).toContain("founder is still the routing layer");
    expect(process?.props.steps[0]?.title).toBe("Map the delivery flow and recurring escalation points");
    expect(proof?.props.metrics.some((metric) => `${metric.value} ${metric.label}`.includes("42%"))).toBe(false);
    expect(doc.metadata?.import_notes?.some((note) => note.includes("Numeric proof was omitted"))).toBe(true);

    // Brightline has core_messages but no services → service cards from core_messages.
    const services = doc.sections.find((section) => section.type === "services");
    expect(services?.variant).toBe("soft-card");
    expect(services?.props.services.length).toBeGreaterThan(0);
    expect(services?.props.services[0]?.title).not.toBe("Primary offer");

    // Realistic fixture has two CTA strings → hero and final_cta should use different ones.
    const heroCta = hero?.props.cta_text;
    const finalCtaSection = doc.sections.find((section) => section.type === "final_cta");
    expect(heroCta).toBeTruthy();
    expect(finalCtaSection?.props.cta_text).toBeTruthy();
    // Both CTAs are valid; they differ because the fixture has two CTA options.
    expect(finalCtaSection?.props.headline).toContain("Brightline");

    // Tuned variants are set.
    expect(doc.sections.find((s) => s.type === "problem")?.variant).toBe("soft-card");
    expect(doc.sections.find((s) => s.type === "proof")?.variant).toBe("minimal");
    expect(doc.sections.find((s) => s.type === "faq")?.variant).toBe("minimal");
  });
});
