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
  });
});
