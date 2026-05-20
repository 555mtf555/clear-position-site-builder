import type { BrandKit, Page, Section } from "@clear-position/shared";
import { FaqSection } from "./sections/FaqSection";
import { FinalCtaSection } from "./sections/FinalCtaSection";
import { HeroSection } from "./sections/HeroSection";
import { ProblemSection } from "./sections/ProblemSection";
import { ProcessSection } from "./sections/ProcessSection";
import { ProofSection } from "./sections/ProofSection";
import { ServicesSection } from "./sections/ServicesSection";
import { SolutionSection } from "./sections/SolutionSection";
import { brandKitToCssVars } from "./brandTheme";

interface PageRendererProps {
  page: Page;
  brandKit?: BrandKit;
}

export function PageRenderer({ page, brandKit }: PageRendererProps) {
  return (
    <main className="page-renderer" aria-label={page.title} style={brandKitToCssVars(brandKit)}>
      {page.doc.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </main>
  );
}

function SectionRenderer({ section }: { section: Section }) {
  switch (section.type) {
    case "hero":
      return <HeroSection section={section} />;
    case "problem":
      return <ProblemSection section={section} />;
    case "solution":
      return <SolutionSection section={section} />;
    case "process":
      return <ProcessSection section={section} />;
    case "proof":
      return <ProofSection section={section} />;
    case "services":
      return <ServicesSection section={section} />;
    case "faq":
      return <FaqSection section={section} />;
    case "final_cta":
      return <FinalCtaSection section={section} />;
  }
}
