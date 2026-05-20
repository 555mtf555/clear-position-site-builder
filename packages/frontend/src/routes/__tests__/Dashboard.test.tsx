import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import type { Company, Page, Site } from "@clear-position/shared";
import { Dashboard } from "../Dashboard";

const company: Company = {
  id: "co_acme",
  name: "Acme Co",
  slug: "acme",
  brand_kit: {
    colors: {
      primary: "#1a6b4a",
      primary_color: "#1a6b4a",
      secondary_color: "#255741",
      accent: "#f0c040",
      accent_color: "#f0c040",
      text: "#111111",
      text_color: "#111111",
      background: "#ffffff",
      background_color: "#ffffff",
      muted_text_color: "#4d574a",
      button_background: "#255741",
      button_text: "#ffffff",
    },
    fonts: { heading: "Inter", body: "Inter", font_family: "Inter, system-ui, sans-serif" },
    border_radius: 7,
  },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const coreSite: Site = {
  id: "site_acme_core",
  company_id: "co_acme",
  slug: "acme-core",
  name: "Acme - Core Site",
  site_type: "core",
  is_core_site: true,
  parent_site_id: null,
  status: "published",
  linked_site_ids: ["site_acme_industry", "site_acme_landing"],
  brand_overrides: undefined,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const industrySite: Site = {
  ...coreSite,
  id: "site_acme_industry",
  slug: "acme-industry",
  name: "Acme - Industry Site",
  site_type: "service",
  is_core_site: false,
  parent_site_id: "site_acme_core",
  status: "draft",
  linked_site_ids: ["site_acme_core"],
};

const landingSite: Site = {
  ...coreSite,
  id: "site_acme_landing",
  slug: "acme-landing",
  name: "Acme - Spring Launch",
  site_type: "landing",
  is_core_site: false,
  parent_site_id: "site_acme_core",
  status: "draft",
  linked_site_ids: ["site_acme_core"],
};

const homePage: Page = {
  id: "page_home",
  site_id: "site_acme_core",
  slug: "home",
  title: "Home",
  status: "draft",
  doc: { version: 1, sections: [] },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const industryPage: Page = {
  ...homePage,
  id: "page_industry_home",
  site_id: "site_acme_industry",
  slug: "industry-home",
  title: "Industry Home",
};

const landingPage: Page = {
  ...homePage,
  id: "page_landing_signup",
  site_id: "site_acme_landing",
  slug: "signup",
  title: "Signup",
};

const importedNeedsReviewPage: Page = {
  ...homePage,
  id: "page_imported_needs_review",
  slug: "imported-needs-review",
  title: "Imported Needs Review",
  doc: {
    version: 1,
    metadata: {
      import_source: "consulting_packet",
      import_notes: [
        "Validation warning: Proof metric is unverified.",
        "Missing asset: Founder headshot",
      ],
    },
    sections: [],
  },
};

const importedReadyPage: Page = {
  ...homePage,
  id: "page_imported_ready",
  slug: "imported-ready",
  title: "Imported Ready",
  doc: {
    version: 1,
    metadata: {
      import_source: "consulting_packet",
      import_qa: {
        completed_item_ids: [
          "confirm-hero-cta",
          "confirm-proof-safe",
          "confirm-ready-for-export",
        ],
      },
    },
    sections: [],
  },
};

const getCompanyMock = vi.fn();
const listCompanySitesMock = vi.fn();
const listSitePagesMock = vi.fn();
const createCompanySiteMock = vi.fn();
const createSitePageMock = vi.fn();
const setCoreSiteMock = vi.fn();
const updateSiteMock = vi.fn();
const exportSiteMock = vi.fn();
const updateCompanyBrandKitMock = vi.fn();

vi.mock("../../api/client", () => ({
  getCompany: (...args: unknown[]) => getCompanyMock(...args),
  listCompanySites: (...args: unknown[]) => listCompanySitesMock(...args),
  listSitePages: (...args: unknown[]) => listSitePagesMock(...args),
  createCompanySite: (...args: unknown[]) => createCompanySiteMock(...args),
  createSitePage: (...args: unknown[]) => createSitePageMock(...args),
  setCoreSite: (...args: unknown[]) => setCoreSiteMock(...args),
  updateSite: (...args: unknown[]) => updateSiteMock(...args),
  exportSite: (...args: unknown[]) => exportSiteMock(...args),
  updateCompanyBrandKit: (...args: unknown[]) => updateCompanyBrandKitMock(...args),
}));

beforeEach(() => {
  getCompanyMock.mockReset().mockResolvedValue(company);
  listCompanySitesMock.mockReset().mockResolvedValue([coreSite, industrySite, landingSite]);
  listSitePagesMock.mockReset().mockImplementation((siteId: string) => {
    if (siteId === "site_acme_core") return Promise.resolve([homePage]);
    if (siteId === "site_acme_industry") return Promise.resolve([industryPage]);
    if (siteId === "site_acme_landing") return Promise.resolve([landingPage]);
    return Promise.resolve([]);
  });
  createCompanySiteMock.mockReset();
  createSitePageMock.mockReset();
  setCoreSiteMock.mockReset();
  updateSiteMock.mockReset();
  exportSiteMock.mockReset();
  updateCompanyBrandKitMock.mockReset().mockResolvedValue(company.brand_kit);
});

describe("Dashboard", () => {
  it("renders seeded sites and marks the core site", async () => {
    render(<Dashboard companyId="co_acme" />);

    await waitFor(() => {
      expect(screen.getByText("Acme Co")).toBeInTheDocument();
    });

    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    expect(within(coreCard).getByText("CORE")).toBeInTheDocument();

    expect(screen.getByLabelText("Site Acme - Industry Site")).toBeInTheDocument();
    expect(screen.getByLabelText("Site Acme - Spring Launch")).toBeInTheDocument();
  });

  it("renders pages per site with a link to the editor", async () => {
    render(<Dashboard companyId="co_acme" />);

    const industryCard = await screen.findByLabelText("Site Acme - Industry Site");
    const editorLink = within(industryCard).getByRole("link", { name: "Industry Home" });
    expect(editorLink).toHaveAttribute(
      "href",
      "/editor/page_industry_home?from=/companies/co_acme/sites",
    );
  });

  it("renders QA badges for imported pages and no badge for manual pages", async () => {
    listSitePagesMock.mockImplementation((siteId: string) => {
      if (siteId === "site_acme_core") return Promise.resolve([homePage, importedNeedsReviewPage, importedReadyPage]);
      if (siteId === "site_acme_industry") return Promise.resolve([industryPage]);
      if (siteId === "site_acme_landing") return Promise.resolve([landingPage]);
      return Promise.resolve([]);
    });

    render(<Dashboard companyId="co_acme" />);

    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    expect(within(coreCard).getByText("2 imported pages · 1 with unresolved QA")).toBeInTheDocument();
    expect(within(coreCard).getByText("Imported · QA ready")).toBeInTheDocument();
    expect(within(coreCard).getByText(/Imported · \d+ required QA items open/)).toBeInTheDocument();

    const homeItem = within(coreCard).getByRole("link", { name: "Home" }).closest("li");
    expect(homeItem).not.toBeNull();
    expect(within(homeItem!).queryByText(/Imported ·/)).not.toBeInTheDocument();
  });

  it("creates a page under a site and refreshes the list", async () => {
    createSitePageMock.mockResolvedValue({
      ...homePage,
      id: "page_new",
      slug: "about",
      title: "About",
    });

    render(<Dashboard companyId="co_acme" />);

    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    const createForm = within(coreCard).getByLabelText("Create page");
    fireEvent.change(within(createForm).getByLabelText("Page title"), {
      target: { value: "About" },
    });
    fireEvent.change(within(createForm).getByLabelText("Page slug"), {
      target: { value: "about" },
    });
    fireEvent.submit(createForm);

    await waitFor(() => {
      expect(createSitePageMock).toHaveBeenCalledWith("site_acme_core", {
        title: "About",
        slug: "about",
      });
    });
    // After create, the dashboard re-fetches the sites + pages.
    await waitFor(() => {
      expect(listCompanySitesMock).toHaveBeenCalledTimes(2);
    });
  });

  it("promotes a non-core site to core via Make core button", async () => {
    setCoreSiteMock.mockResolvedValue({ ...industrySite, is_core_site: true, site_type: "core" });

    render(<Dashboard companyId="co_acme" />);
    const industryCard = await screen.findByLabelText("Site Acme - Industry Site");
    fireEvent.click(within(industryCard).getByRole("button", { name: "Make core" }));

    await waitFor(() => {
      expect(setCoreSiteMock).toHaveBeenCalledWith("site_acme_industry");
    });
  });

  it("renders brand kit controls and saves changes", async () => {
    updateCompanyBrandKitMock.mockResolvedValue({
      ...company.brand_kit,
      colors: { ...company.brand_kit.colors, button_background: "#123456" },
    });

    render(<Dashboard companyId="co_acme" />);

    await screen.findByRole("heading", { name: "Brand kit" });
    expect(screen.getByLabelText("Primary")).toBeInTheDocument();
    expect(screen.getByText("Brand preview")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Button background"), {
      target: { value: "#123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save brand kit" }));

    await waitFor(() => {
      expect(updateCompanyBrandKitMock).toHaveBeenCalledWith(
        "co_acme",
        expect.objectContaining({
          colors: expect.objectContaining({ button_background: "#123456" }),
        }),
      );
    });
  });

  it("renders compact info bubbles and required labels for dashboard fields", async () => {
    render(<Dashboard companyId="co_acme" />);

    await screen.findByRole("heading", { name: "Brand kit" });
    expect(screen.getByRole("button", { name: "More information about Brand kit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More information about Site name" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More information about Site slug" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More information about Site type" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More information about Core site designation" })).toBeInTheDocument();
    expect(screen.getByText(/Shared colors used across this company's sites/)).toHaveAttribute("role", "tooltip");
    expect(screen.getAllByText("The internal/display name for this website.")[0]).toHaveAttribute("role", "tooltip");

    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    expect(within(coreCard).getByRole("button", { name: "More information about Page title" })).toBeInTheDocument();
    expect(within(coreCard).getByRole("button", { name: "More information about Page slug" })).toBeInTheDocument();
    expect(within(coreCard).getByText(/Shown in the builder and used for browser\/export metadata/)).toHaveAttribute("role", "tooltip");
    expect(within(coreCard).getByText(/Used in the page URL\/export folder/)).toHaveAttribute("role", "tooltip");
    expect(within(coreCard).getAllByText("Required").length).toBeGreaterThanOrEqual(2);
  });

  it("validates pasted Consulting Packet JSON", async () => {
    render(<Dashboard companyId="co_acme" />);

    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    fireEvent.click(within(coreCard).getByRole("button", { name: "Import Consulting Packet" }));
    const importForm = within(coreCard).getByLabelText("Import Consulting Packet");
    fireEvent.change(within(importForm).getByLabelText("Consulting packet JSON"), {
      target: { value: "{bad json" },
    });
    fireEvent.click(within(importForm).getByRole("button", { name: "Preview packet" }));

    expect(await within(importForm).findByRole("alert")).toHaveTextContent(/could not|expected/i);
  });

  it("populates import preview from an uploaded JSON file", async () => {
    render(<Dashboard companyId="co_acme" />);

    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    fireEvent.click(within(coreCard).getByRole("button", { name: "Import Consulting Packet" }));
    const importForm = within(coreCard).getByLabelText("Import Consulting Packet");
    fireEvent.change(within(importForm).getByLabelText("Imported page slug"), {
      target: { value: "uploaded-import" },
    });
    const file = new File([
      JSON.stringify({
        company_name: "Uploaded Co",
        project_name: "Uploaded Homepage",
        homepage_headlines: ["A homepage from an uploaded packet"],
        cta_options: [{ text: "Start now", href: "/contact" }],
      }),
    ], "builder-import.json", { type: "application/json" });

    fireEvent.change(within(importForm).getByLabelText("Consulting packet JSON file"), {
      target: { files: [file] },
    });

    expect(await within(importForm).findByText("Sections that will be created")).toBeInTheDocument();
    expect(within(importForm).getAllByText(/A homepage from an uploaded packet/).length).toBeGreaterThan(0);
    expect(within(importForm).getByLabelText("Imported page title")).toHaveValue("Uploaded Homepage");
  });

  it("shows a friendly error for invalid uploaded JSON", async () => {
    render(<Dashboard companyId="co_acme" />);

    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    fireEvent.click(within(coreCard).getByRole("button", { name: "Import Consulting Packet" }));
    const importForm = within(coreCard).getByLabelText("Import Consulting Packet");
    const file = new File(["{bad json"], "builder-import.json", { type: "application/json" });

    fireEvent.change(within(importForm).getByLabelText("Consulting packet JSON file"), {
      target: { files: [file] },
    });

    expect(await within(importForm).findByRole("alert")).toHaveTextContent(/could not be parsed/i);
  });

  it("creates an imported packet page and links to the editor", async () => {
    createSitePageMock.mockResolvedValue({
      ...homePage,
      id: "page_imported",
      slug: "imported-home",
      title: "Imported Home",
    });

    render(<Dashboard companyId="co_acme" />);

    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    fireEvent.click(within(coreCard).getByRole("button", { name: "Import Consulting Packet" }));
    const importForm = within(coreCard).getByLabelText("Import Consulting Packet");
    fireEvent.change(within(importForm).getByLabelText("Imported page title"), {
      target: { value: "Imported Home" },
    });
    fireEvent.change(within(importForm).getByLabelText("Imported page slug"), {
      target: { value: "imported-home" },
    });
    fireEvent.change(within(importForm).getByLabelText("Consulting packet JSON"), {
      target: {
        value: JSON.stringify({
          company_name: "Acme",
          homepage_headlines: ["A clearer imported homepage"],
          customer_problem: "The old page is hard to buy from.",
          cta_options: [{ text: "Book now", href: "/contact" }],
        }),
      },
    });
    fireEvent.click(within(importForm).getByRole("button", { name: "Preview packet" }));

    await within(importForm).findByText("Sections that will be created");
    fireEvent.click(within(importForm).getByRole("button", { name: "Create editable page from this packet" }));

    await waitFor(() => {
      expect(createSitePageMock).toHaveBeenCalledWith(
        "site_acme_core",
        expect.objectContaining({
          title: "Imported Home",
          slug: "imported-home",
          doc: expect.objectContaining({
            version: 1,
            sections: expect.arrayContaining([
              expect.objectContaining({ type: "hero" }),
              expect.objectContaining({ type: "problem" }),
            ]),
          }),
        }),
      );
    });
    expect(await within(importForm).findByRole("link", { name: "Open imported page in editor" }))
      .toHaveAttribute("href", "/editor/page_imported?from=/companies/co_acme/sites");
  });

  it("shows packet warnings, missing assets, and brand suggestions in preview", async () => {
    render(<Dashboard companyId="co_acme" />);

    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    fireEvent.click(within(coreCard).getByRole("button", { name: "Import Consulting Packet" }));
    const importForm = within(coreCard).getByLabelText("Import Consulting Packet");
    fireEvent.change(within(importForm).getByLabelText("Imported page slug"), {
      target: { value: "packet-preview" },
    });
    fireEvent.change(within(importForm).getByLabelText("Consulting packet JSON"), {
      target: {
        value: JSON.stringify({
          company_name: "Acme",
          validation_warnings: ["Proof metric is unverified"],
          missing_assets: ["Team photo"],
          brand_kit_suggestions: { colors: { primary_color: "#123456" } },
        }),
      },
    });
    fireEvent.click(within(importForm).getByRole("button", { name: "Preview packet" }));

    expect(await within(importForm).findByText("Missing assets")).toBeInTheDocument();
    expect(within(importForm).getByText("Team photo")).toBeInTheDocument();
    expect(within(importForm).getByText("Validation warnings")).toBeInTheDocument();
    expect(within(importForm).getByText("Proof metric is unverified")).toBeInTheDocument();
    expect(within(importForm).getByText(/Brand kit suggestions are present/)).toBeInTheDocument();
  });

  it("allows excluding a generated section before page creation", async () => {
    createSitePageMock.mockResolvedValue({ ...homePage, id: "page_no_faq", slug: "no-faq", title: "No FAQ" });

    render(<Dashboard companyId="co_acme" />);

    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    fireEvent.click(within(coreCard).getByRole("button", { name: "Import Consulting Packet" }));
    const importForm = within(coreCard).getByLabelText("Import Consulting Packet");
    fireEvent.change(within(importForm).getByLabelText("Imported page title"), { target: { value: "No FAQ" } });
    fireEvent.change(within(importForm).getByLabelText("Imported page slug"), { target: { value: "no-faq" } });
    fireEvent.change(within(importForm).getByLabelText("Consulting packet JSON"), {
      target: { value: JSON.stringify({ company_name: "Acme", homepage_headlines: ["Imported"] }) },
    });
    fireEvent.click(within(importForm).getByRole("button", { name: "Preview packet" }));

    const faqCheckbox = await within(importForm).findByLabelText(/faq/i);
    fireEvent.click(faqCheckbox);
    fireEvent.click(within(importForm).getByRole("button", { name: "Create editable page from this packet" }));

    await waitFor(() => {
      const input = createSitePageMock.mock.calls[0]?.[1] as { doc: Page["doc"] };
      expect(input.doc.sections.map((section) => section.type)).not.toContain("faq");
    });
  });

  it("allows reordering generated sections before page creation", async () => {
    createSitePageMock.mockResolvedValue({ ...homePage, id: "page_reordered", slug: "reordered", title: "Reordered" });

    render(<Dashboard companyId="co_acme" />);

    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    fireEvent.click(within(coreCard).getByRole("button", { name: "Import Consulting Packet" }));
    const importForm = within(coreCard).getByLabelText("Import Consulting Packet");
    fireEvent.change(within(importForm).getByLabelText("Imported page title"), { target: { value: "Reordered" } });
    fireEvent.change(within(importForm).getByLabelText("Imported page slug"), { target: { value: "reordered" } });
    fireEvent.change(within(importForm).getByLabelText("Consulting packet JSON"), {
      target: { value: JSON.stringify({ company_name: "Acme", homepage_headlines: ["Imported"] }) },
    });
    fireEvent.click(within(importForm).getByRole("button", { name: "Preview packet" }));

    await within(importForm).findByText("Sections that will be created");
    const firstDown = within(importForm).getAllByRole("button", { name: "Down" })[0];
    expect(firstDown).toBeDefined();
    fireEvent.click(firstDown!);
    fireEvent.click(within(importForm).getByRole("button", { name: "Create editable page from this packet" }));

    await waitFor(() => {
      const input = createSitePageMock.mock.calls[0]?.[1] as { doc: Page["doc"] };
      expect(input.doc.sections[0]?.type).toBe("problem");
      expect(input.doc.sections[1]?.type).toBe("hero");
    });
  });

  it("warns on duplicate imported page slug before submit", async () => {
    render(<Dashboard companyId="co_acme" />);

    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    fireEvent.click(within(coreCard).getByRole("button", { name: "Import Consulting Packet" }));
    const importForm = within(coreCard).getByLabelText("Import Consulting Packet");
    fireEvent.change(within(importForm).getByLabelText("Imported page slug"), { target: { value: "home" } });

    expect(await within(importForm).findByRole("alert")).toHaveTextContent("home-2");
    expect(within(importForm).getByRole("button", { name: "Create editable page from this packet" })).toBeDisabled();
  });

  it("renders the recommended workflow guide", async () => {
    render(<Dashboard companyId="co_acme" />);
    await screen.findByRole("heading", { name: "Acme Co" });
    expect(screen.getByRole("region", { name: "Recommended workflow" })).toBeInTheDocument();
    expect(screen.getByText("How to build a site")).toBeInTheDocument();
    expect(screen.getByText(/Choose or create a site/)).toBeInTheDocument();
    expect(screen.getByText(/Export generates local static HTML files/)).toBeInTheDocument();
  });

  it("shows import helper text when the packet import panel is opened", async () => {
    render(<Dashboard companyId="co_acme" />);
    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    fireEvent.click(within(coreCard).getByRole("button", { name: "Import Consulting Packet" }));
    expect(within(coreCard).getAllByText(/builder-import\.json/).length).toBeGreaterThan(0);
    expect(within(coreCard).getByRole("button", { name: "More information about Consulting packet import" })).toBeInTheDocument();
    expect(within(coreCard).getByRole("button", { name: "More information about Imported page title" })).toBeInTheDocument();
    expect(within(coreCard).getByRole("button", { name: "More information about Imported page slug" })).toBeInTheDocument();
  });

  it("export site button carries a descriptive title for operators", async () => {
    render(<Dashboard companyId="co_acme" />);
    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    const exportBtn = within(coreCard).getByRole("button", { name: "Export site" });
    expect(exportBtn).toHaveAttribute("title", expect.stringMatching(/static HTML|publish/i));
    expect(within(coreCard).getByRole("button", { name: "More information about Export Acme - Core Site" })).toBeInTheDocument();
  });

  it("renders site action controls inside the mobile-safe wrapping action group", async () => {
    render(<Dashboard companyId="co_acme" />);
    const coreCard = await screen.findByLabelText("Site Acme - Core Site");
    const exportBtn = within(coreCard).getByRole("button", { name: "Export site" });
    const actionGroup = exportBtn.closest(".site-card__actions");

    expect(actionGroup).not.toBeNull();
    expect(actionGroup).toHaveClass("site-card__actions");
  });
});
