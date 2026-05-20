import { db } from "./connection";

/**
 * Idempotent seed: one company, one core site, one child site that links
 * back, one draft page on the core site with a single hero section.
 */
export function seed(): void {
  const existing = db.prepare("SELECT id FROM companies LIMIT 1").get() as { id: string } | undefined;
  if (existing) return;

  const now = new Date().toISOString();

  const companyId = "co_acme";
  const coreSiteId = "site_acme_core";
  const industrySiteId = "site_acme_industry";
  const landingSiteId = "site_acme_landing";
  const pageId = "page_home";
  const industryPageId = "page_industry_home";
  const landingPageId = "page_landing_signup";

  const brandKit = {
    colors: {
      primary: "#1a6b4a",
      accent: "#f0c040",
      text: "#111111",
      background: "#ffffff",
    },
    fonts: {
      heading: "Inter, system-ui, sans-serif",
      body: "Inter, system-ui, sans-serif",
    },
  };

  db.prepare(`
    INSERT INTO companies (id, name, slug, brand_kit_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(companyId, "Acme Co", "acme", JSON.stringify(brandKit), now, now);

  const insertSite = db.prepare(`
    INSERT INTO sites (
      id, company_id, slug, name, site_type, is_core_site, parent_site_id, status,
      linked_site_ids_json, brand_overrides_json, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSite.run(
    coreSiteId,
    companyId,
    "acme-core",
    "Acme - Core Site",
    "core",
    1,
    null,
    "published",
    JSON.stringify([industrySiteId, landingSiteId]),
    null,
    now,
    now,
  );

  insertSite.run(
    industrySiteId,
    companyId,
    "acme-industry",
    "Acme - Industry Site",
    "service",
    0,
    coreSiteId,
    "draft",
    JSON.stringify([coreSiteId]),
    null,
    now,
    now,
  );

  insertSite.run(
    landingSiteId,
    companyId,
    "acme-landing",
    "Acme - Spring Launch",
    "landing",
    0,
    coreSiteId,
    "draft",
    JSON.stringify([coreSiteId]),
    null,
    now,
    now,
  );

  const doc = {
    version: 1,
    sections: [
      {
        id: "sec_hero_1",
        type: "hero",
        props: {
          eyebrow: "Clear Position",
          headline: "Make your value easier to understand and easier to buy.",
          subhead: "Positioning, websites, and messaging for small consulting and services businesses.",
          cta_text: "Start a sprint",
          cta_href: "/contact",
          text_align: "left",
        },
        elements: [],
      },
      {
        id: "sec_problem_1",
        type: "problem",
        props: {
          eyebrow: "The gap",
          headline: "Good services are hard to buy when the message is fuzzy.",
          intro: "Most service businesses do not have a delivery problem. They have a clarity problem.",
          problems: [
            {
              title: "Visitors do not understand the offer",
              description: "Pages describe capabilities, but do not make the buying decision obvious.",
            },
            {
              title: "Sales calls repeat the same explanations",
              description: "The website is not doing enough qualification before people book time.",
            },
          ],
        },
        elements: [],
      },
      {
        id: "sec_solution_1",
        type: "solution",
        props: {
          eyebrow: "The fix",
          headline: "Turn positioning into a site system your team can keep improving.",
          body: "Clear Position helps teams shape the message, page flow, and proof points into structured website sections.",
          bullets: [
            "Shared brand kit across core and child sites",
            "Reusable sections backed by JSON",
            "Preview-first editing before drag and drop",
          ],
        },
        elements: [],
      },
      {
        id: "sec_process_1",
        type: "process",
        props: {
          eyebrow: "How it works",
          headline: "A simple path from message to working homepage.",
          steps: [
            {
              title: "Clarify",
              description: "Define the audience, offer, objections, and proof that matter most.",
            },
            {
              title: "Structure",
              description: "Map the homepage into modular sections that tell the buying story.",
            },
            {
              title: "Publish",
              description: "Render and refine the same JSON the editor saves.",
            },
          ],
        },
        elements: [],
      },
      {
        id: "sec_final_cta_1",
        type: "final_cta",
        props: {
          headline: "Ready to make the next version clearer?",
          subhead: "Start with one page, then expand into a full site system.",
          cta_text: "Plan the homepage",
          cta_href: "/contact",
          background_color: "#255741",
          text_align: "center",
        },
        elements: [],
      },
    ],
  };

  const insertPage = db.prepare(`
    INSERT INTO pages (id, site_id, slug, title, status, doc_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPage.run(pageId, coreSiteId, "home", "Home", "draft", JSON.stringify(doc), now, now);

  const industryDoc = {
    version: 1,
    sections: [
      {
        id: "sec_hero_industry",
        type: "hero",
        props: {
          eyebrow: "Industry site",
          headline: "Made for operations teams in service industries.",
          subhead: "A narrower entry point for visitors arriving from industry-specific campaigns.",
          cta_text: "See how it works",
          cta_href: "/contact",
          text_align: "left",
        },
        elements: [],
      },
    ],
  };
  insertPage.run(
    industryPageId,
    industrySiteId,
    "industry-home",
    "Industry Home",
    "draft",
    JSON.stringify(industryDoc),
    now,
    now,
  );

  const landingDoc = {
    version: 1,
    sections: [
      {
        id: "sec_hero_landing",
        type: "hero",
        props: {
          eyebrow: "Spring launch",
          headline: "Sign up to be first in line.",
          subhead: "A single-page campaign site driven by the same JSON the editor saves.",
          cta_text: "Reserve a spot",
          cta_href: "/signup",
          text_align: "center",
        },
        elements: [],
      },
    ],
  };
  insertPage.run(
    landingPageId,
    landingSiteId,
    "signup",
    "Signup",
    "draft",
    JSON.stringify(landingDoc),
    now,
    now,
  );
}
