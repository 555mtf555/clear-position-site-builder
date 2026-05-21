import { z } from "zod";
import { HexColor } from "./brandkit";
import { Element } from "./element";
import { Id } from "./ids";

const OptionalText = z.string().optional();
const TextAlign = z.enum(["left", "center", "right"]);

const CtaFields = z
  .object({
    cta_text: OptionalText,
    cta_href: OptionalText,
  })
  .superRefine((props, ctx) => {
    const hasCtaText = Boolean(props.cta_text?.trim());
    const hasCtaHref = Boolean(props.cta_href?.trim());

    if (hasCtaText && !hasCtaHref) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cta_href"],
        message: "CTA href is required when CTA text is set.",
      });
    }

    if (hasCtaHref && !hasCtaText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cta_text"],
        message: "CTA text is required when CTA href is set.",
      });
    }
  });

export const SectionVariant = z.enum([
  "default",
  "soft-card",
  "contrast-band",
  "centered",
  "editorial",
  "minimal",
]);
export type SectionVariant = z.infer<typeof SectionVariant>;

const SectionBase = z.object({
  id: Id,
  variant: SectionVariant.optional(),
  elements: z.array(Element).default([]),
});

export const FontSizeScale = z.enum(["default", "compact", "large", "editorial"]);
export type FontSizeScale = z.infer<typeof FontSizeScale>;

export const FontFamilyPreset = z.enum(["brand", "serif", "sans", "display"]);
export type FontFamilyPreset = z.infer<typeof FontFamilyPreset>;

const SectionStyleProps = z.object({
  background_color: HexColor.optional(),
  text_color: HexColor.optional(),
  font_size_scale: FontSizeScale.optional(),
  font_family_preset: FontFamilyPreset.optional(),
});

// ── Per-item text style ────────────────────────────────────────────────────
// Controlled enums — no arbitrary CSS strings allowed.

export const ItemTextSize = z.enum(["default", "small", "large", "display"]);
export type ItemTextSize = z.infer<typeof ItemTextSize>;

export const ItemTextWeight = z.enum(["default", "medium", "bold"]);
export type ItemTextWeight = z.infer<typeof ItemTextWeight>;

export const TextStyle = z.object({
  color: HexColor.optional(),
  size: ItemTextSize.optional(),
  font: FontFamilyPreset.optional(),
  weight: ItemTextWeight.optional(),
});
export type TextStyle = z.infer<typeof TextStyle>;

// Card with optional per-item text style
const Card = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  style: TextStyle.optional(),
});

const HeroProps = z
  .object({
    eyebrow: OptionalText,
    headline: z.string().min(1, "Headline is required."),
    subhead: OptionalText,
    background_color: HexColor.optional(),
    background_image_asset_id: OptionalText,
    background_size: z.enum(["cover", "contain"]).default("cover"),
    background_position: z.enum(["center", "top", "bottom", "left", "right"]).default("center"),
    text_align: TextAlign.default("left"),
  })
  .and(CtaFields);

export const HeroSectionSchema = SectionBase.extend({
  type: z.literal("hero"),
  props: HeroProps,
});
export type HeroSection = z.infer<typeof HeroSectionSchema>;

export const ProblemSectionSchema = SectionBase.extend({
  type: z.literal("problem"),
  props: SectionStyleProps.extend({
    eyebrow: OptionalText,
    headline: z.string().min(1, "Headline is required."),
    intro: OptionalText,
    problems: z.array(Card).min(1, "Add at least one problem."),
  }),
});
export type ProblemSection = z.infer<typeof ProblemSectionSchema>;

export const SolutionSectionSchema = SectionBase.extend({
  type: z.literal("solution"),
  props: SectionStyleProps.extend({
    eyebrow: OptionalText,
    headline: z.string().min(1, "Headline is required."),
    body: z.string().min(1, "Body is required."),
    bullets: z.array(z.string().min(1)).default([]),
  }),
});
export type SolutionSection = z.infer<typeof SolutionSectionSchema>;

export const ProcessSectionSchema = SectionBase.extend({
  type: z.literal("process"),
  props: SectionStyleProps.extend({
    eyebrow: OptionalText,
    headline: z.string().min(1, "Headline is required."),
    steps: z.array(Card).min(1, "Add at least one step."),
  }),
});
export type ProcessSection = z.infer<typeof ProcessSectionSchema>;

export const ProofSectionSchema = SectionBase.extend({
  type: z.literal("proof"),
  props: SectionStyleProps.extend({
    eyebrow: OptionalText,
    headline: z.string().min(1, "Headline is required."),
    quote: OptionalText,
    attribution: OptionalText,
    metrics: z.array(z.object({
      value: z.string().min(1, "Metric value is required."),
      label: z.string().min(1, "Metric label is required."),
      style: TextStyle.optional(),
    })).default([]),
  }),
});
export type ProofSection = z.infer<typeof ProofSectionSchema>;

export const ServicesSectionSchema = SectionBase.extend({
  type: z.literal("services"),
  props: SectionStyleProps.extend({
    eyebrow: OptionalText,
    headline: z.string().min(1, "Headline is required."),
    services: z.array(Card).min(1, "Add at least one service."),
  }),
});
export type ServicesSection = z.infer<typeof ServicesSectionSchema>;

export const FaqSectionSchema = SectionBase.extend({
  type: z.literal("faq"),
  props: SectionStyleProps.extend({
    eyebrow: OptionalText,
    headline: z.string().min(1, "Headline is required."),
    items: z.array(z.object({
      question: z.string().min(1, "Question is required."),
      answer: z.string().min(1, "Answer is required."),
      style: TextStyle.optional(),
    })).min(1, "Add at least one FAQ item."),
  }),
});
export type FaqSection = z.infer<typeof FaqSectionSchema>;

const FinalCtaProps = z
  .object({
    eyebrow: OptionalText,
    headline: z.string().min(1, "Headline is required."),
    subhead: OptionalText,
    background_color: HexColor.optional(),
    background_image_asset_id: OptionalText,
    background_size: z.enum(["cover", "contain"]).default("cover"),
    background_position: z.enum(["center", "top", "bottom", "left", "right"]).default("center"),
    text_align: TextAlign.default("center"),
  })
  .and(CtaFields);

export const FinalCtaSectionSchema = SectionBase.extend({
  type: z.literal("final_cta"),
  props: FinalCtaProps,
});
export type FinalCtaSection = z.infer<typeof FinalCtaSectionSchema>;

export const Section = z.discriminatedUnion("type", [
  HeroSectionSchema,
  ProblemSectionSchema,
  SolutionSectionSchema,
  ProcessSectionSchema,
  ProofSectionSchema,
  ServicesSectionSchema,
  FaqSectionSchema,
  FinalCtaSectionSchema,
]);
export type Section = z.infer<typeof Section>;
export type SectionType = Section["type"];
