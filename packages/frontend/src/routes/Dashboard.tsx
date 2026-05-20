import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ConsultingPacketImport,
  PageDoc as PageDocSchema,
  createImportQaStatus,
  createPageDraftFromConsultingPacket,
  type BrandKit,
  type Company,
  type ImportQaStatus,
  type Page,
  type PageDoc,
  type Section,
  type Site,
  type SiteType,
} from "@clear-position/shared";
import {
  createCompanySite,
  createSitePage,
  exportSite,
  getCompany,
  listCompanySites,
  listSitePages,
  setCoreSite,
  updateSite,
  updateCompanyBrandKit,
  type CreateSiteInput,
} from "../api/client";
import { FieldHelp } from "./FieldHelp";

interface DashboardProps {
  companyId: string;
}

interface SiteWithPages {
  site: Site;
  pages: Page[];
}

const SITE_TYPES: SiteType[] = ["core", "service", "location", "campaign", "landing", "custom"];

/**
 * Dashboard route: /companies/:companyId/sites
 *
 * Lists every site in the company, marks the core site, groups child sites
 * under it, and lets the operator create/edit sites and pages. Page links
 * point at /editor/:pageId so the editor stays the source of truth for
 * page-level work.
 */
export function Dashboard({ companyId }: DashboardProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [siteData, setSiteData] = useState<SiteWithPages[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [companyRes, sites] = await Promise.all([
        getCompany(companyId),
        listCompanySites(companyId),
      ]);
      setCompany(companyRes);
      const withPages = await Promise.all(
        sites.map(async (site) => ({ site, pages: await listSitePages(site.id) })),
      );
      setSiteData(withPages);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load dashboard");
    }
  }, [companyId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const coreSite = useMemo(() => siteData.find((entry) => entry.site.is_core_site)?.site ?? null, [siteData]);
  const orderedSites = useMemo(() => {
    const core = siteData.filter((entry) => entry.site.is_core_site);
    const children = siteData.filter((entry) => !entry.site.is_core_site);
    return [...core, ...children];
  }, [siteData]);

  const runAction = useCallback(
    async (label: string, action: () => Promise<void>) => {
      setActionError(null);
      setActionStatus(`${label}...`);
      try {
        await action();
        setActionStatus(`${label} complete`);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : `${label} failed`);
        setActionStatus(null);
      }
    },
    [],
  );

  if (loadError) {
    return (
      <div className="dashboard dashboard--error" role="alert">
        Failed to load dashboard: {loadError}
      </div>
    );
  }

  if (!company) {
    return <div className="dashboard">Loading dashboard...</div>;
  }

  return (
    <main className="dashboard" aria-label="Company sites dashboard">
      <header className="dashboard__header">
        <div>
          <h1>{company.name}</h1>
          <p className="muted">Manage sites and pages for this company.</p>
        </div>
        <div className="dashboard__status" aria-live="polite">
          {actionStatus ? <span>{actionStatus}</span> : null}
          {actionError ? <span className="dashboard__error">{actionError}</span> : null}
        </div>
      </header>

      <WorkflowGuide />

      <CreateSiteForm
        companyId={companyId}
        coreSiteId={coreSite?.id ?? null}
        onCreated={() => void loadAll()}
        onError={(message) => setActionError(message)}
      />

      <BrandKitPanel
        brandKit={company.brand_kit}
        onSave={async (brandKit) => {
          await runAction("Saving brand kit", async () => {
            const savedBrandKit = await updateCompanyBrandKit(company.id, brandKit);
            setCompany({ ...company, brand_kit: savedBrandKit });
          });
        }}
      />

      <section className="dashboard__sites" aria-label="Sites">
        {orderedSites.length === 0 ? (
          <p className="muted">No sites yet. Create the first one above.</p>
        ) : (
          orderedSites.map(({ site, pages }) => (
            <SiteCard
              key={site.id}
              site={site}
              pages={pages}
              coreSiteId={coreSite?.id ?? null}
              onPromoteCore={async () => {
                await runAction("Setting core site", async () => {
                  await setCoreSite(site.id);
                  await loadAll();
                });
              }}
              onRename={async (name) => {
                await runAction("Renaming site", async () => {
                  await updateSite(site.id, { name });
                  await loadAll();
                });
              }}
              onChangeType={async (siteType) => {
                await runAction("Updating site type", async () => {
                  await updateSite(site.id, { site_type: siteType });
                  await loadAll();
                });
              }}
              onChangeSlug={async (slug) => {
                await runAction("Updating slug", async () => {
                  await updateSite(site.id, { slug });
                  await loadAll();
                });
              }}
              onCreatePage={async (input) => {
                let createdPage: Page | null = null;
                await runAction("Creating page", async () => {
                  createdPage = await createSitePage(site.id, input);
                  await loadAll();
                });
                return createdPage;
              }}
              onExportSite={async () => {
                await runAction("Exporting site", async () => {
                  const result = await exportSite(site.id);
                  setActionStatus(`Exported to ${result.export_path}`);
                });
              }}
            />
          ))
        )}
      </section>
    </main>
  );
}

function WorkflowGuide() {
  return (
    <section className="workflow-guide" aria-label="Recommended workflow">
      <h2 className="workflow-guide__title">How to build a site</h2>
      <ol className="workflow-guide__steps">
        <li><strong>Choose or create a site</strong> — <span>Each site holds its own pages. One site can be the Core site that links to related child sites.</span></li>
        <li><strong>Create a page</strong> — <span>Add a blank page or pick a template. Or import a Consulting Packet to generate sections from strategy copy.</span></li>
        <li><strong>Review generated sections</strong> — <span>After import, check what was created. Exclude or reorder sections before saving.</span></li>
        <li><strong>Edit copy and assets</strong> — <span>Open the page in the editor. Click a section on the left to edit its headline, body text, and images.</span></li>
        <li><strong>Complete Handoff QA</strong> — <span>For imported pages, use the QA checklist in the editor to confirm copy is accurate and safe to publish.</span></li>
        <li><strong>Save</strong> — <span>Save your changes in the editor before exporting.</span></li>
        <li><strong>Export</strong> — <span>Export generates local static HTML files. It does not publish the site online.</span></li>
      </ol>
    </section>
  );
}

function BrandKitPanel(props: {
  brandKit: BrandKit;
  onSave: (brandKit: BrandKit) => Promise<void>;
}) {
  const [draft, setDraft] = useState(props.brandKit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(props.brandKit);
  }, [props.brandKit]);

  const updateColor = (key: keyof BrandKit["colors"], value: string) => {
    setDraft((current) => ({
      ...current,
      colors: {
        ...current.colors,
        [key]: value,
      },
    }));
  };

  const updateRadius = (value: string) => {
    setDraft((current) => ({ ...current, border_radius: Number(value) }));
  };

  const updateFont = (value: string) => {
    setDraft((current) => ({
      ...current,
      fonts: {
        ...current.fonts,
        font_family: value,
        body: value,
        heading: value,
      },
    }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await props.onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="brand-kit-panel" aria-label="Brand kit">
      <form onSubmit={onSubmit} className="brand-kit-form">
        <div className="dashboard-section-heading">
          <h2>Brand kit</h2>
          <FieldHelp label="Brand kit">
            Shared colors used across this company's sites unless a section overrides them.
          </FieldHelp>
        </div>
        <div className="brand-kit-grid">
          <ColorInput label="Primary" help="Main brand color used for accents, section details, and emphasis." value={draft.colors.primary_color} onChange={(value) => updateColor("primary_color", value)} />
          <ColorInput label="Secondary" help="Supporting brand color for contrast bands and secondary accents." value={draft.colors.secondary_color} onChange={(value) => updateColor("secondary_color", value)} />
          <ColorInput label="Accent" help="Highlight color for small details like proof accents and visual emphasis." value={draft.colors.accent_color} onChange={(value) => updateColor("accent_color", value)} />
          <ColorInput label="Background" help="Default page background color used when sections do not override it." value={draft.colors.background_color} onChange={(value) => updateColor("background_color", value)} />
          <ColorInput label="Text" help="Default body text color used across rendered pages." value={draft.colors.text_color} onChange={(value) => updateColor("text_color", value)} />
          <ColorInput label="Button background" help="Default CTA button fill color for rendered pages." value={draft.colors.button_background} onChange={(value) => updateColor("button_background", value)} />
          <ColorInput label="Button text" help="Default CTA button text color for rendered pages." value={draft.colors.button_text} onChange={(value) => updateColor("button_text", value)} />
        </div>
        <div className="dashboard__row">
          <label>
            <span className="field-label-row">
              Border radius
              <FieldHelp label="Border radius">Controls the rounded corner style for rendered sections, cards, and buttons.</FieldHelp>
            </span>
            <input
              type="number"
              min="0"
              max="32"
              value={draft.border_radius}
              onChange={(event) => updateRadius(event.target.value)}
            />
          </label>
          <label>
            <span className="field-label-row">
              Font preset
              <FieldHelp label="Font preset">Sets the default font family for this company's rendered websites.</FieldHelp>
            </span>
            <select value={draft.fonts.font_family} onChange={(event) => updateFont(event.target.value)}>
              <option value="Inter, system-ui, sans-serif">Inter/system</option>
              <option value="Georgia, serif">Editorial serif</option>
              <option value="Arial, sans-serif">Arial</option>
            </select>
          </label>
        </div>
        <button type="submit" className="button" disabled={saving}>
          {saving ? "Saving..." : "Save brand kit"}
        </button>
      </form>
      <div
        className="brand-kit-preview"
        style={{
          background: draft.colors.background_color,
          color: draft.colors.text_color,
          borderRadius: draft.border_radius,
          fontFamily: draft.fonts.font_family,
        }}
      >
        <span style={{ color: draft.colors.primary_color }}>Brand preview</span>
        <strong>Clear, consistent site sections</strong>
        <p style={{ color: draft.colors.muted_text_color }}>Shared defaults apply across every page unless a section overrides them.</p>
        <button
          type="button"
          style={{
            background: draft.colors.button_background,
            color: draft.colors.button_text,
            borderRadius: draft.border_radius,
          }}
        >
          Book a call
        </button>
      </div>
    </section>
  );
}

function ColorInput(props: {
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const safePickerValue = /^#[0-9a-fA-F]{6}$/.test(props.value) ? props.value : "#000000";
  return (
    <div className="brand-color-field">
      <span className="brand-color-field__label">
        {props.label}
        <FieldHelp label={props.label}>{props.help}</FieldHelp>
      </span>
      <div className="brand-color-field__inputs">
        <input
          type="color"
          value={safePickerValue}
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => props.onChange(event.target.value)}
        />
        <input
          type="text"
          value={props.value}
          aria-label={props.label}
          placeholder="#000000"
          onChange={(event) => props.onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

function CreateSiteForm(props: {
  companyId: string;
  coreSiteId: string | null;
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [siteType, setSiteType] = useState<SiteType>("custom");
  const [isCore, setIsCore] = useState(false);
  const [linkToCore, setLinkToCore] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSubmitting(true);
    try {
      const input: CreateSiteInput = {
        name: name.trim(),
        slug: slug.trim(),
        site_type: siteType,
        is_core_site: isCore,
        parent_site_id: !isCore && linkToCore ? props.coreSiteId : null,
      };
      await createCompanySite(props.companyId, input);
      setName("");
      setSlug("");
      setSiteType("custom");
      setIsCore(false);
      props.onCreated();
    } catch (err) {
      props.onError(err instanceof Error ? err.message : "Failed to create site");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="dashboard__create-site" onSubmit={onSubmit} aria-label="Create site">
      <h2>Create a site</h2>
      <div className="dashboard__row">
        <label>
          <span className="field-label-row">
            Site name <span className="required-label">Required</span>
            <FieldHelp label="Site name">The internal/display name for this website.</FieldHelp>
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Spring launch site"
            required
          />
        </label>
        <label>
          <span className="field-label-row">
            Site slug <span className="required-label">Required</span>
            <FieldHelp label="Site slug">Used in exported folder names and internal links. Use lowercase words with hyphens.</FieldHelp>
          </span>
          <input
            type="text"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="spring-launch"
            pattern="^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
            required
          />
        </label>
        <label>
          <span className="field-label-row">
            Site type
            <FieldHelp label="Site type">Helps organize core, service, campaign, landing, or location sites.</FieldHelp>
          </span>
          <select value={siteType} onChange={(event) => setSiteType(event.target.value as SiteType)}>
            {SITE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="dashboard__row dashboard__row--checks">
        <label>
          <input
            type="checkbox"
            checked={isCore}
            onChange={(event) => setIsCore(event.target.checked)}
          />
          Make this the core site (any existing core will be demoted)
          <FieldHelp label="Core site designation">The main website for this company. Child sites can link back to it.</FieldHelp>
        </label>
        {!isCore && props.coreSiteId ? (
          <label>
            <input
              type="checkbox"
              checked={linkToCore}
              onChange={(event) => setLinkToCore(event.target.checked)}
            />
            Link to the current core site as parent
            <FieldHelp label="Child-site linking">Use this when the new site should connect back to the core site.</FieldHelp>
          </label>
        ) : null}
      </div>
      <button type="submit" className="button" disabled={submitting}>
        {submitting ? "Creating..." : "Create site"}
      </button>
    </form>
  );
}

function SiteCard(props: {
  site: Site;
  pages: Page[];
  coreSiteId: string | null;
  onPromoteCore: () => Promise<void>;
  onRename: (name: string) => Promise<void>;
  onChangeType: (siteType: SiteType) => Promise<void>;
  onChangeSlug: (slug: string) => Promise<void>;
  onCreatePage: (input: { title: string; slug: string; doc?: PageDoc }) => Promise<Page | null>;
  onExportSite: () => Promise<void>;
}) {
  const { site, pages, coreSiteId } = props;
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(site.name);
  const [slugOpen, setSlugOpen] = useState(false);
  const [slugValue, setSlugValue] = useState(site.slug);
  const isChildOfCore = !site.is_core_site && coreSiteId && site.parent_site_id === coreSiteId;
  const importedPageStatuses = pages.map((page) => createImportQaStatus(page.doc)).filter((status) => status.status !== "not_imported");
  const unresolvedImportedPages = importedPageStatuses.filter((status) => status.status !== "ready").length;

  return (
    <article
      className={`site-card${site.is_core_site ? " site-card--core" : ""}`}
      aria-label={`Site ${site.name}`}
    >
      <header className="site-card__header">
        <div>
          <h3>
            {site.name}{" "}
            {site.is_core_site ? (
              <span className="badge badge--core" aria-label="Core site">CORE</span>
            ) : null}
          </h3>
          <p className="muted">
            <code>{site.slug}</code> · type <code>{site.site_type}</code> · status{" "}
            <code>{site.status}</code>
            {isChildOfCore ? " · child of core" : null}
          </p>
        </div>
        <div className="site-card__actions">
          {!site.is_core_site ? (
            <button type="button" className="button" onClick={() => void props.onPromoteCore()}>
              Make core
            </button>
          ) : null}
          <button
            type="button"
            className="button"
            title="Generate static HTML files for this site. Does not publish online."
            onClick={() => void props.onExportSite()}
          >
            Export site
          </button>
          <FieldHelp label={`Export ${site.name}`}>
            Creates local static HTML files. It does not publish the site online.
          </FieldHelp>
        </div>
      </header>

      <div className="site-card__edit">
        <button type="button" className="button button--ghost" onClick={() => setRenameOpen((v) => !v)}>
          {renameOpen ? "Cancel rename" : "Rename"}
        </button>
        {renameOpen ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void props.onRename(renameValue.trim()).then(() => setRenameOpen(false));
            }}
          >
            <FieldHelp label="New site name">The internal/display name for this website.</FieldHelp>
            <input
              type="text"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              required
              aria-label="New site name"
            />
            <button type="submit" className="button">Save name</button>
          </form>
        ) : null}

        <button type="button" className="button button--ghost" onClick={() => setSlugOpen((v) => !v)}>
          {slugOpen ? "Cancel slug" : "Change slug"}
        </button>
        {slugOpen ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void props.onChangeSlug(slugValue.trim()).then(() => setSlugOpen(false));
            }}
          >
            <FieldHelp label="New slug">Use lowercase letters, numbers, and hyphens only.</FieldHelp>
            <input
              type="text"
              value={slugValue}
              onChange={(event) => setSlugValue(event.target.value)}
              pattern="^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
              required
              aria-label="New slug"
            />
            <button type="submit" className="button">Save slug</button>
          </form>
        ) : null}

        <label className="site-card__type">
          <span className="field-label-row">
            Type
            <FieldHelp label={`Site type for ${site.name}`}>Helps organize what this site is for.</FieldHelp>
          </span>
          <select
            value={site.site_type}
            onChange={(event) => void props.onChangeType(event.target.value as SiteType)}
            aria-label={`Site type for ${site.name}`}
          >
            {SITE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
      </div>

      <section className="site-card__pages" aria-label="Pages">
        <h4>Pages</h4>
        {importedPageStatuses.length > 0 ? (
          <p className="site-card__qa-summary">
            {importedPageStatuses.length} imported page{importedPageStatuses.length === 1 ? "" : "s"} · {unresolvedImportedPages} with unresolved QA
          </p>
        ) : null}
        {pages.length === 0 ? (
          <p className="muted">No pages yet. Add a page or import a Consulting Packet below.</p>
        ) : (
          <ul>
            {pages.map((page) => (
              <li key={page.id}>
                <a href={`/editor/${page.id}?from=/companies/${site.company_id}/sites`}>
                  {page.title}
                </a>
                <span className="muted"> /{page.slug} · {page.status}</span>
                <PageQaBadge status={createImportQaStatus(page.doc)} />
              </li>
            ))}
          </ul>
        )}
        <CreatePageForm onCreate={props.onCreatePage} />
        <ImportConsultingPacketForm companyId={site.company_id} pages={pages} onCreate={props.onCreatePage} />
      </section>
    </article>
  );
}

function PageQaBadge({ status }: { status: ImportQaStatus }) {
  if (status.status === "not_imported") return null;

  const label = status.status === "ready"
    ? "Imported · QA ready"
    : status.unresolvedRequiredCount > 0
      ? `Imported · ${status.unresolvedRequiredCount} required QA item${status.unresolvedRequiredCount === 1 ? "" : "s"} open`
      : `Imported · ${status.unresolvedWarningCount} warning${status.unresolvedWarningCount === 1 ? "" : "s"} unresolved`;
  const className = status.status === "ready" ? "qa-badge qa-badge--ready" : "qa-badge qa-badge--review";

  return (
    <span className={className} title="Open editor to review QA">
      {label}
    </span>
  );
}

function CreatePageForm(props: {
  onCreate: (input: { title: string; slug: string }) => Promise<Page | null>;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="site-card__create-page"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!title.trim() || !slug.trim()) return;
        setSubmitting(true);
        try {
          await props.onCreate({ title: title.trim(), slug: slug.trim() });
          setTitle("");
          setSlug("");
        } finally {
          setSubmitting(false);
        }
      }}
      aria-label="Create page"
    >
      <p className="compact-helper">Add a manual page to this site.</p>
      <label>
        <span className="field-label-row">
          Page title <span className="required-label">Required</span>
          <FieldHelp label="Page title">Shown in the builder and used for browser/export metadata.</FieldHelp>
        </span>
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Page title"
        required
        aria-label="Page title"
      />
      </label>
      <label>
        <span className="field-label-row">
          Page slug <span className="required-label">Required</span>
          <FieldHelp label="Page slug">Used in the page URL/export folder. Use lowercase words with hyphens.</FieldHelp>
        </span>
      <input
        type="text"
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
        placeholder="page-slug"
        pattern="^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
        required
        aria-label="Page slug"
      />
      </label>
      <button type="submit" className="button" disabled={submitting}>
        {submitting ? "Creating..." : "Add page"}
      </button>
    </form>
  );
}

function ImportConsultingPacketForm(props: {
  companyId: string;
  pages: Page[];
  onCreate: (input: { title: string; slug: string; doc: PageDoc }) => Promise<Page | null>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [previewDoc, setPreviewDoc] = useState<PageDoc | null>(null);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createdPage, setCreatedPage] = useState<Page | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const duplicatePage = props.pages.find((page) => page.slug === slug.trim());
  const suggestedSlug = duplicatePage ? uniqueSlug(slug.trim(), props.pages.map((page) => page.slug)) : "";
  const selectedDoc = useMemo(() => {
    if (!previewDoc) return null;
    const sections = selectedSectionIds
      .map((id) => previewDoc.sections.find((section) => section.id === id))
      .filter((section): section is Section => Boolean(section));
    const parsed = PageDocSchema.safeParse({
      ...previewDoc,
      sections,
      metadata: {
        ...previewDoc.metadata,
        import_section_sources: previewDoc.metadata?.import_section_sources?.filter((source) => selectedSectionIds.includes(source.section_id)),
      },
    });
    return parsed.success ? parsed.data : null;
  }, [previewDoc, selectedSectionIds]);

  const previewText = (text: string) => {
    setError(null);
    setCreatedPage(null);
    try {
      const parsedJson = JSON.parse(text) as unknown;
      const packet = ConsultingPacketImport.parse(parsedJson);
      const doc = createPageDraftFromConsultingPacket(packet, { idPrefix: slug || "packet" });
      setPreviewDoc(doc);
      setSelectedSectionIds(doc.sections.map((section) => section.id));
      if (!title) setTitle(packet.project_name ?? (packet.company_name ? `${packet.company_name} homepage` : ""));
      return true;
    } catch (err) {
      setPreviewDoc(null);
      setSelectedSectionIds([]);
      if (err instanceof SyntaxError) {
        setError("Packet JSON could not be parsed. Check that the file contains valid JSON.");
      } else {
        setError(err instanceof Error ? `Packet JSON does not match the import schema. ${err.message}` : "Packet JSON could not be parsed.");
      }
      return false;
    }
  };

  const preview = () => {
    previewText(jsonText);
  };

  const onFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setCreatedPage(null);
    if (!file.name.toLowerCase().endsWith(".json")) {
      setPreviewDoc(null);
      setSelectedSectionIds([]);
      setError("Upload a .json file exported for the builder import contract.");
      return;
    }
    try {
      const text = await readTextFile(file);
      setJsonText(text);
      previewText(text);
    } catch {
      setPreviewDoc(null);
      setSelectedSectionIds([]);
      setError("Packet file could not be read. Try exporting the JSON again.");
    } finally {
      event.target.value = "";
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDoc) {
      preview();
      return;
    }
    if (!title.trim() || !slug.trim()) return;
    if (duplicatePage) {
      setError(`A page with slug "${slug.trim()}" already exists. Try "${suggestedSlug}".`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const page = await props.onCreate({ title: title.trim(), slug: slug.trim(), doc: selectedDoc });
      setCreatedPage(page);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Imported page could not be created.";
      setError(message.includes("already exists") ? `${message}. Try "${suggestedSlug || `${slug.trim()}-2`}".` : message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="packet-import">
      <button type="button" className="button button--ghost" onClick={() => setOpen((value) => !value)}>
        {open ? "Close packet import" : "Import Consulting Packet"}
      </button>
      {!open ? (
        <p className="packet-import__helper">
          Upload <code>builder-import.json</code> from Consulting OS.
          <FieldHelp label="Import Consulting Packet">
            Upload the builder-import.json file exported from Consulting OS to generate editable page sections from a reviewed strategy packet.
          </FieldHelp>
        </p>
      ) : null}
      {open ? (
        <form onSubmit={onSubmit} aria-label="Import Consulting Packet">
          <p className="packet-import__helper">
            Upload <code>builder-import.json</code> from Consulting OS, or paste JSON below.
            <FieldHelp label="Consulting packet import">
              The import creates an editable page draft from approved strategy packet content. You can review sections before creating the page.
            </FieldHelp>
          </p>
          <label className="packet-import__file">
            Upload builder-import.json from Consulting OS
            <input
              type="file"
              accept="application/json,.json"
              aria-label="Consulting packet JSON file"
              onChange={(event) => void onFileUpload(event)}
            />
          </label>
          <textarea
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value);
              setPreviewDoc(null);
              setSelectedSectionIds([]);
            }}
            placeholder='Or paste JSON here: {"company_name":"Acme","positioning_statement":"..."}'
            aria-label="Consulting packet JSON"
            rows={6}
          />
          <div className="site-card__create-page">
            <label>
              <span className="field-label-row">
                Imported page title <span className="required-label">Required</span>
                <FieldHelp label="Imported page title">Shown in the builder and used for browser/export metadata.</FieldHelp>
              </span>
              <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Imported page title"
              required
              aria-label="Imported page title"
            />
            </label>
            <label>
              <span className="field-label-row">
                Imported page slug <span className="required-label">Required</span>
                <FieldHelp label="Imported page slug">Used in the page URL/export folder. Use lowercase words with hyphens.</FieldHelp>
              </span>
              <input
              type="text"
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                setPreviewDoc(null);
                setSelectedSectionIds([]);
              }}
              placeholder="imported-page"
              pattern="^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
              required
              aria-label="Imported page slug"
            />
            </label>
          </div>
          <span className="compact-helper">
            URL slug: lowercase letters and hyphens only.
            <FieldHelp label="URL slug format">Example: acme-homepage. Slugs must use lowercase letters, numbers, and hyphens.</FieldHelp>
          </span>
          {duplicatePage ? (
            <p className="packet-import__warning" role="alert">
              Slug already exists. Suggested slug:{" "}
              <button type="button" className="button button--ghost" onClick={() => setSlug(suggestedSlug)}>
                {suggestedSlug}
              </button>
            </p>
          ) : null}
          <div className="packet-import__actions">
            <button type="button" className="button" onClick={preview}>
              Preview packet
            </button>
            <button type="submit" className="button" disabled={submitting || !selectedDoc || Boolean(duplicatePage)}>
              {submitting ? "Creating..." : "Create editable page from this packet"}
            </button>
          </div>
          {error ? <p className="dashboard__error" role="alert">{error}</p> : null}
          {previewDoc ? (
            <div className="packet-import__preview">
              <strong>This packet will create:</strong>
              <p>{title || "Untitled imported page"} /{slug || "missing-slug"}</p>
              <p>{selectedSectionIds.length} of {previewDoc.sections.length} sections selected. {previewDoc.metadata?.import_notes?.length ?? 0} import notes.</p>
              <strong>Sections that will be created</strong>
              <ol className="packet-import__sections">
                {selectedSectionIds.map((sectionId, index) => {
                  const section = previewDoc.sections.find((item) => item.id === sectionId);
                  if (!section) return null;
                  const source = previewDoc.metadata?.import_section_sources?.find((item) => item.section_id === section.id);
                  return (
                    <li key={section.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedSectionIds.includes(section.id)}
                          onChange={(event) => {
                            setSelectedSectionIds((current) => event.target.checked
                              ? [...current, section.id]
                              : current.filter((id) => id !== section.id));
                          }}
                        />
                        <span><strong>{section.type}</strong> {sectionLabel(section)}</span>
                      </label>
                      <small>
                        {source?.used_fallback ? "Auto-generated (fallback)" : "From packet"} · Sources: {source?.sources.length ? source.sources.join(", ") : "fallback"}
                      </small>
                      {source?.note ? <small>{source.note}</small> : null}
                      <div className="packet-import__row-actions">
                        <button type="button" className="button button--ghost" disabled={index === 0} onClick={() => setSelectedSectionIds((current) => moveItem(current, index, index - 1))}>
                          Up
                        </button>
                        <button type="button" className="button button--ghost" disabled={index === selectedSectionIds.length - 1} onClick={() => setSelectedSectionIds((current) => moveItem(current, index, index + 1))}>
                          Down
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <div className="packet-import__quick-edits">
                <label>
                  Hero headline
                  <input
                    value={heroHeadline(previewDoc)}
                    onChange={(event) => setPreviewDoc((current) => current ? updateSectionProp(current, "hero", { headline: event.target.value }) : current)}
                  />
                </label>
                <label>
                  CTA text
                  <input
                    value={heroCtaText(previewDoc)}
                    onChange={(event) => setPreviewDoc((current) => current ? updateSectionProp(current, "hero", { cta_text: event.target.value }) : current)}
                  />
                </label>
              </div>
              {previewDoc.metadata?.import_notes?.length ? (
                <>
                  <strong>Warnings and import notes</strong>
                  <ul>
                    {previewDoc.metadata.import_notes.map((note) => <li key={note}>{note}</li>)}
                  </ul>
                </>
              ) : null}
              {packetList(jsonText, "missing_assets").length ? (
                <>
                  <strong>Missing assets</strong>
                  <ul>
                    {packetList(jsonText, "missing_assets").map((asset) => <li key={asset}>{asset}</li>)}
                  </ul>
                </>
              ) : null}
              {packetList(jsonText, "validation_warnings").length ? (
                <>
                  <strong>Validation warnings</strong>
                  <ul>
                    {packetList(jsonText, "validation_warnings").map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                </>
              ) : null}
              {packetHasBrandSuggestions(jsonText) ? (
                <p className="packet-import__info">Brand kit suggestions are present. They are informational only and were not applied.</p>
              ) : null}
            </div>
          ) : null}
          {createdPage ? (
            <a className="packet-import__editor-link" href={`/editor/${createdPage.id}?from=/companies/${props.companyId}/sites`}>
              Open imported page in editor
            </a>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

function readTextFile(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("File could not be read"));
    reader.readAsText(file);
  });
}

function sectionLabel(section: Section): string {
  switch (section.type) {
    case "hero":
    case "final_cta":
    case "problem":
    case "solution":
    case "process":
    case "proof":
    case "services":
    case "faq":
      return section.props.headline;
  }
}

function heroHeadline(doc: PageDoc): string {
  const hero = doc.sections.find((section) => section.type === "hero");
  return hero?.type === "hero" ? hero.props.headline : "";
}

function heroCtaText(doc: PageDoc): string {
  const hero = doc.sections.find((section) => section.type === "hero");
  return hero?.type === "hero" ? hero.props.cta_text ?? "" : "";
}

function updateSectionProp(doc: PageDoc, sectionType: Section["type"], patch: Record<string, unknown>): PageDoc {
  const parsed = PageDocSchema.safeParse({
    ...doc,
    sections: doc.sections.map((section) => section.type === sectionType
      ? { ...section, props: { ...section.props, ...patch } }
      : section),
  });
  return parsed.success ? parsed.data : doc;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (!item) return items;
  next.splice(to, 0, item);
  return next;
}

function uniqueSlug(slug: string, existingSlugs: string[]): string {
  const base = slug || "imported-page";
  let index = 2;
  let candidate = `${base}-${index}`;
  while (existingSlugs.includes(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }
  return candidate;
}

function packetList(jsonText: string, key: "missing_assets" | "validation_warnings"): string[] {
  try {
    const parsed = ConsultingPacketImport.safeParse(JSON.parse(jsonText));
    if (!parsed.success) return [];
    return parsed.data[key] ?? [];
  } catch {
    return [];
  }
}

function packetHasBrandSuggestions(jsonText: string): boolean {
  try {
    const parsed = ConsultingPacketImport.safeParse(JSON.parse(jsonText));
    return parsed.success && Boolean(parsed.data.brand_kit_suggestions);
  } catch {
    return false;
  }
}
