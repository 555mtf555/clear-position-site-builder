import { useEffect, useMemo, useState } from "react";
import type { Company, Page, Site } from "@clear-position/shared";
import { BuilderShell } from "../builder/BuilderShell";
import { Dashboard } from "./Dashboard";
import { getPage, listCompanies, listPages, listSites } from "../api/client";
import { PageRenderer } from "../renderer/PageRenderer";

interface PreviewState {
  companies: Company[];
  sites: Site[];
  pages: Page[];
}

type Route =
  | { name: "editor"; pageId: string }
  | { name: "preview"; pageId: string }
  | { name: "dashboard"; companyId: string };

function parseRoute(): Route {
  const segments = window.location.pathname.split("/").filter(Boolean);
  // /companies/:companyId/sites
  if (segments[0] === "companies" && segments.length >= 1) {
    const companyId = segments[1] || "co_acme";
    return { name: "dashboard", companyId };
  }
  const queryPageId = new URLSearchParams(window.location.search).get("page");
  const pageId = segments[1] || queryPageId || "page_home";
  if (segments[0] === "editor") {
    return { name: "editor", pageId };
  }
  return { name: "preview", pageId };
}

export function App() {
  const route = useMemo(parseRoute, []);

  if (route.name === "editor") {
    return <BuilderShell pageId={route.pageId} />;
  }

  if (route.name === "dashboard") {
    return <Dashboard companyId={route.companyId} />;
  }

  return <PreviewRoute pageId={route.pageId} />;
}

function PreviewRoute({ pageId }: { pageId: string }) {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const companies = await listCompanies();
        const company = companies[0];
        const sites = company ? await listSites(company.id) : [];
        const coreSite = sites.find((site) => site.is_core_site) ?? sites[0];
        const pages = coreSite ? await listPages(coreSite.id) : [];
        const activePage = await getPage(pageId);

        if (active) {
          setPreview({ companies, sites, pages });
          setPage(activePage);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load preview");
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [pageId]);

  if (error) {
    return <div className="app-shell app-shell--error">Preview failed: {error}</div>;
  }

  if (!preview || !page) {
    return <div className="app-shell">Loading preview...</div>;
  }

  return (
    <div>
      <aside className="preview-bar">
        <div>
          <strong>{preview.companies[0]?.name ?? "No company"}</strong>
          <span>{preview.sites.length} sites</span>
        </div>
        <nav aria-label="Preview pages">
          {preview.pages.map((previewPage) => (
            <a
              key={previewPage.id}
              href={`/preview/${previewPage.id}`}
              aria-current={previewPage.id === page.id ? "page" : undefined}
            >
              {previewPage.title}
            </a>
          ))}
          <a href={`/editor/${page.id}`}>Edit</a>
        </nav>
      </aside>
      <PageRenderer page={page} brandKit={preview.companies[0]?.brand_kit} />
    </div>
  );
}
