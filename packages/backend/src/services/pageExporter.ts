import fs from "node:fs";
import path from "node:path";
import type { BrandKit, Page, Section, Site } from "@clear-position/shared";
import { Page as PageSchema, createImportQaStatus } from "@clear-position/shared";
import * as assetRepo from "../repositories/assets";
import * as companyRepo from "../repositories/companies";
import * as pageRepo from "../repositories/pages";
import * as siteRepo from "../repositories/sites";
import { resolveExportPath, safeSegment } from "../lib/exports";

export type ExportWarningCode =
  | "missing_metadata"
  | "missing_asset"
  | "asset_copy_failed"
  | "link_rewrite_limited";

export interface ExportWarning {
  code: ExportWarningCode;
  message: string;
  pageId?: string;
  assetId?: string;
}

export interface CopiedAsset {
  id: string;
  filename: string;
  originalFilename: string;
  relativePath: string;
}

export interface ExportManifest {
  exportedAt: string;
  siteSlug?: string;
  pageId?: string;
  siteId?: string;
  pageTitle?: string;
  sourcePageSlug?: string;
  cssFile?: string;
  pages?: Array<{
    pageId: string;
    slug: string;
    title: string;
    outputPath: string;
  }>;
  unresolvedQaWarningCount?: number;
  files: string[];
  copiedAssets: CopiedAsset[];
  warnings: ExportWarning[];
}

export interface ExportResult {
  export_path: string;
  files_generated: string[];
  page_title?: string;
  site_id?: string;
  manifest_path: string;
  warnings: ExportWarning[];
}

interface ExportContext {
  rootDir: string;
  assetsDir: string;
  files: string[];
  warnings: ExportWarning[];
  copiedAssets: CopiedAsset[];
  copiedAssetIds: Map<string, string>;
  pagesBySlug: Map<string, Page>;
  brandKit: BrandKit | null;
}

interface RenderOptions {
  pageOutputDir: string;
  assetPrefix: string;
  currentPage: Page;
}

export async function exportPage(page: Page): Promise<ExportResult> {
  const parsed = parsePageOrThrow(page);
  const site = siteRepo.getSite(page.site_id);
  const exportSlug = site ? `${site.slug}-${page.slug}` : page.id;
  const exportDir = resolveExportPath(exportSlug);
  await resetExportDir(exportDir);

  const context = createExportContext(exportDir, site ? pageRepo.listPagesBySite(site.id) : [page], site ? resolveSiteBrandKit(site) : null);
  const cssRelPath = await writeSharedCss(exportDir, context);

  const htmlPath = path.join(exportDir, "index.html");
  await writePage(parsed, htmlPath, context, { pageOutputDir: exportDir, assetPrefix: "assets", currentPage: parsed });

  const manifestPath = path.join(exportDir, "export-manifest.json");
  const manifest = createManifest(context, relativeExportPath(exportDir, manifestPath), {
    pageId: parsed.id,
    siteId: parsed.site_id,
    pageTitle: parsed.title,
    sourcePageSlug: parsed.slug,
    cssFile: cssRelPath,
    pages: [exportedPageSummary(parsed, "index.html")],
    unresolvedQaWarningCount: unresolvedQaWarningCount([parsed]),
  });
  await writeManifest(manifestPath, manifest, context);

  return {
    export_path: exportDir,
    files_generated: context.files,
    page_title: parsed.title,
    manifest_path: relativeExportPath(exportDir, manifestPath),
    warnings: context.warnings,
  };
}

export async function exportSite(site: Site): Promise<ExportResult> {
  const pages = pageRepo.listPagesBySite(site.id).map(parsePageOrThrow);
  const exportDir = resolveExportPath(site.slug);
  await resetExportDir(exportDir);

  const context = createExportContext(exportDir, pages, resolveSiteBrandKit(site));
  const cssRelPath = await writeSharedCss(exportDir, context);

  for (const page of pages) {
    const isHome = page.slug === "home" || page.slug === "index";
    const pageOutputDir = isHome ? exportDir : path.join(exportDir, safeSegment(page.slug));
    await fs.promises.mkdir(pageOutputDir, { recursive: true });
    await writePage(page, path.join(pageOutputDir, "index.html"), context, {
      pageOutputDir,
      assetPrefix: isHome ? "assets" : "../assets",
      currentPage: page,
    });
  }

  const manifestPath = path.join(exportDir, "export-manifest.json");
  const manifest = createManifest(context, relativeExportPath(exportDir, manifestPath), {
    siteId: site.id,
    siteSlug: site.slug,
    cssFile: cssRelPath,
    pages: pages.map((page) => {
      const isHome = page.slug === "home" || page.slug === "index";
      return exportedPageSummary(page, isHome ? "index.html" : `${safeSegment(page.slug)}/index.html`);
    }),
    unresolvedQaWarningCount: unresolvedQaWarningCount(pages),
  });
  await writeManifest(manifestPath, manifest, context);

  return {
    export_path: exportDir,
    files_generated: context.files,
    site_id: site.id,
    manifest_path: relativeExportPath(exportDir, manifestPath),
    warnings: context.warnings,
  };
}

function parsePageOrThrow(page: Page): Page {
  const parsed = PageSchema.safeParse(page);
  if (!parsed.success) {
    throw new Error("Page JSON is invalid and cannot be exported.");
  }
  return parsed.data;
}

async function resetExportDir(exportDir: string): Promise<void> {
  await fs.promises.rm(exportDir, { recursive: true, force: true });
  await fs.promises.mkdir(path.join(exportDir, "assets"), { recursive: true });
}

function createExportContext(rootDir: string, pages: Page[], brandKit: BrandKit | null): ExportContext {
  return {
    rootDir,
    assetsDir: path.join(rootDir, "assets"),
    files: [],
    warnings: [],
    copiedAssets: [],
    copiedAssetIds: new Map(),
    pagesBySlug: new Map(pages.map((page) => [page.slug, page])),
    brandKit,
  };
}

async function writeSharedCss(exportDir: string, context: ExportContext): Promise<string> {
  const cssPath = path.join(exportDir, "assets", "site.css");
  await fs.promises.writeFile(cssPath, exportStaticCss(), "utf8");
  const relPath = relativeExportPath(exportDir, cssPath);
  context.files.push(relPath);
  return relPath;
}

async function writePage(page: Page, htmlPath: string, context: ExportContext, options: RenderOptions): Promise<void> {
  const html = await renderPageHtml(page, context, options);
  await fs.promises.writeFile(htmlPath, html, "utf8");
  context.files.push(relativeExportPath(context.rootDir, htmlPath));
}

async function writeManifest(manifestPath: string, manifest: ExportManifest, context: ExportContext): Promise<void> {
  await fs.promises.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  context.files.push(relativeExportPath(context.rootDir, manifestPath));
}

function createManifest(context: ExportContext, manifestFile: string, input: Partial<ExportManifest>): ExportManifest {
  return {
    exportedAt: new Date().toISOString(),
    siteSlug: input.siteSlug,
    pageId: input.pageId,
    siteId: input.siteId,
    pageTitle: input.pageTitle,
    sourcePageSlug: input.sourcePageSlug,
    cssFile: input.cssFile,
    pages: input.pages,
    unresolvedQaWarningCount: input.unresolvedQaWarningCount,
    files: [...context.files, manifestFile],
    copiedAssets: [...context.copiedAssets],
    warnings: [...context.warnings],
  };
}

function exportedPageSummary(page: Page, outputPath: string): NonNullable<ExportManifest["pages"]>[number] {
  return {
    pageId: page.id,
    slug: page.slug,
    title: page.title,
    outputPath,
  };
}

function unresolvedQaWarningCount(pages: Page[]): number {
  return pages.reduce((count, page) => {
    const status = createImportQaStatus(page.doc);
    return count + status.unresolvedRequiredCount + status.unresolvedWarningCount;
  }, 0);
}

async function renderPageHtml(page: Page, context: ExportContext, options: RenderOptions): Promise<string> {
  const sections = await Promise.all(page.doc.sections.map((section) => renderSection(section, context, options)));
  const metaTitle = page.doc.metadata?.meta_title ?? page.title;
  const metaDescription = page.doc.metadata?.meta_description;
  const canonical = page.doc.metadata?.meta_canonical;

  if (!page.doc.metadata?.meta_title) {
    addWarning(context, "missing_metadata", `Page ${page.title} is missing a custom meta title.`, page.id);
  }
  if (!metaDescription) {
    addWarning(context, "missing_metadata", `Page ${page.title} is missing a meta description.`, page.id);
  }

  const ogImageUrl = page.doc.metadata?.og_image_asset_id
    ? await copyAssetForExport(page.doc.metadata.og_image_asset_id, context, options.assetPrefix, page.id)
    : null;

  // CSS: brand variables inline (tiny, per-site); static styles as external file (cacheable).
  const cssHref = `${options.assetPrefix}/site.css`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(metaTitle)}</title>
    ${canonical ? `<link rel="canonical" href="${escapeAttr(canonical)}" />` : ""}
    ${metaDescription ? `<meta name="description" content="${escapeAttr(metaDescription)}" />` : ""}
    <meta property="og:title" content="${escapeAttr(metaTitle)}" />
    ${metaDescription ? `<meta property="og:description" content="${escapeAttr(metaDescription)}" />` : ""}
    ${ogImageUrl ? `<meta property="og:image" content="${escapeAttr(ogImageUrl)}" />` : ""}
    ${ogImageUrl ? `<link rel="icon" type="image/png" href="${escapeAttr(ogImageUrl)}" />` : ""}
    <style>${exportBrandVarsCss(context.brandKit)}</style>
    <link rel="stylesheet" href="${escapeAttr(cssHref)}" />
  </head>
  <body>
    <main aria-label="${escapeHtml(page.title)}">
      ${sections.join("\n")}
    </main>
  </body>
</html>`;
}

function resolveSiteBrandKit(site: Site): BrandKit | null {
  const company = companyRepo.getCompany(site.company_id);
  if (!company) return null;
  return {
    ...company.brand_kit,
    ...site.brand_overrides,
    colors: {
      ...company.brand_kit.colors,
      ...site.brand_overrides?.colors,
    },
    fonts: {
      ...company.brand_kit.fonts,
      ...site.brand_overrides?.fonts,
    },
  };
}

function variantClass(v: string | undefined): string {
  return v && v !== "default" ? ` section--${v}` : "";
}

function typographyClass(props: { font_size_scale?: string; font_family_preset?: string }): string {
  const classes: string[] = [];
  if (props.font_size_scale && props.font_size_scale !== "default") {
    classes.push(`section--font-size-${props.font_size_scale}`);
  }
  if (props.font_family_preset && props.font_family_preset !== "brand") {
    classes.push(`section--font-${props.font_family_preset}`);
  }
  return classes.length ? ` ${classes.join(" ")}` : "";
}

async function renderSection(section: Section, context: ExportContext, options: RenderOptions): Promise<string> {
  switch (section.type) {
    case "hero":
      return renderHeroLike("hero-section", section.props, section.variant, context, options, "h1");
    case "problem":
      return contentSection(`content-section content-section--problem${variantClass(section.variant)}${typographyClass(section.props)}`, section.props.eyebrow, section.props.headline, [
        section.props.intro ? `<p class="content-section__intro">${escapeHtml(section.props.intro)}</p>` : "",
        cardGrid(section.props.problems),
      ], undefined, sectionStyle(section.props));
    case "solution":
      return contentSection(`content-section content-section--solution${variantClass(section.variant)}${typographyClass(section.props)}`, section.props.eyebrow, section.props.headline, [
        `<p class="content-section__intro">${escapeHtml(section.props.body)}</p>`,
        section.props.bullets.length ? `<ul class="check-list">${section.props.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : "",
      ], undefined, sectionStyle(section.props));
    case "process":
      return contentSection(`content-section${variantClass(section.variant)}${typographyClass(section.props)}`, section.props.eyebrow, section.props.headline, [
        `<div class="step-list">${section.props.steps.map((step, i) => `<article class="step-card"${itemStyleAttr(step.style)}><span>${i + 1}</span><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.description)}</p></article>`).join("")}</div>`,
      ], undefined, sectionStyle(section.props));
    case "proof":
      return contentSection(`content-section content-section--proof${variantClass(section.variant)}${typographyClass(section.props)}`, section.props.eyebrow, section.props.headline, [
        section.props.quote ? `<figure class="quote-block"><blockquote>${escapeHtml(section.props.quote)}</blockquote>${section.props.attribution ? `<figcaption>${escapeHtml(section.props.attribution)}</figcaption>` : ""}</figure>` : "",
        section.props.metrics.length ? `<div class="metric-grid">${section.props.metrics.map((m) => `<div class="metric"${itemStyleAttr(m.style)}><strong>${escapeHtml(m.value)}</strong><span>${escapeHtml(m.label)}</span></div>`).join("")}</div>` : "",
      ], undefined, sectionStyle(section.props));
    case "services":
      return contentSection(`content-section${variantClass(section.variant)}${typographyClass(section.props)}`, section.props.eyebrow, section.props.headline, [cardGrid(section.props.services)], undefined, sectionStyle(section.props));
    case "faq":
      return contentSection(`content-section content-section--faq${variantClass(section.variant)}${typographyClass(section.props)}`, section.props.eyebrow, section.props.headline, [
        `<div class="faq-list">${section.props.items.map((item) => `<article${itemStyleAttr(item.style)}><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></article>`).join("")}</div>`,
      ], "content-section__inner content-section__inner--narrow", sectionStyle(section.props));
    case "final_cta":
      return renderHeroLike("final-cta-section", section.props, section.variant, context, options, "h2");
  }
}

async function renderHeroLike(
  baseClass: "hero-section" | "final-cta-section",
  props: {
    eyebrow?: string;
    headline: string;
    subhead?: string;
    cta_text?: string;
    cta_href?: string;
    background_color?: string;
    background_image_asset_id?: string;
    background_size?: "cover" | "contain";
    background_position?: "center" | "top" | "bottom" | "left" | "right";
    text_align: "left" | "center" | "right";
  },
  variant: string | undefined,
  context: ExportContext,
  options: RenderOptions,
  headingTag: "h1" | "h2",
): Promise<string> {
  const backgroundUrl = props.background_image_asset_id
    ? await copyAssetForExport(props.background_image_asset_id, context, options.assetPrefix, options.currentPage.id)
    : null;
  const style = [
    `background-color: ${escapeAttr(props.background_color ?? (baseClass === "hero-section" ? "var(--cpsb-background)" : "var(--cpsb-secondary)"))}`,
    backgroundUrl ? `background-image: url('${escapeAttr(backgroundUrl)}')` : "",
    `background-size: ${escapeAttr(props.background_size ?? "cover")}`,
    `background-position: ${escapeAttr(props.background_position ?? "center")}`,
  ].filter(Boolean).join("; ");
  const href = props.cta_href ? rewriteHref(props.cta_href, context, options) : "";
  const vc = variantClass(variant);

  return `<section class="${baseClass} ${baseClass}--${props.text_align}${vc}" style="${style}">
    <div class="${baseClass}__inner">
      ${props.eyebrow ? `<p class="content-section__eyebrow">${escapeHtml(props.eyebrow)}</p>` : ""}
      <${headingTag}>${escapeHtml(props.headline)}</${headingTag}>
      ${props.subhead ? `<p>${escapeHtml(props.subhead)}</p>` : ""}
      ${props.cta_text && href ? `<a class="hero-section__cta" href="${escapeAttr(href)}">${escapeHtml(props.cta_text)}</a>` : ""}
    </div>
  </section>`;
}

function rewriteHref(href: string, context: ExportContext, options: RenderOptions): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const slug = href.replace(/^\/+/, "").replace(/\/$/, "");
  if (!slug) return href;
  const target = context.pagesBySlug.get(slug);
  if (!target) {
    addWarning(context, "link_rewrite_limited", `Link ${href} does not match an exported page slug.`, options.currentPage.id);
    return href;
  }
  if (target.slug === options.currentPage.slug) return "./";
  if (target.slug === "home" || target.slug === "index") return path.relative(options.pageOutputDir, context.rootDir).replace(/\\/g, "/") || ".";
  const targetDir = path.join(context.rootDir, safeSegment(target.slug));
  const relative = path.relative(options.pageOutputDir, targetDir).replace(/\\/g, "/");
  return relative || ".";
}

async function copyAssetForExport(assetId: string, context: ExportContext, assetPrefix: string, pageId?: string): Promise<string | null> {
  const asset = assetRepo.getAsset(assetId);
  if (!asset) {
    addWarning(context, "missing_asset", `Missing asset ${assetId}; image was skipped.`, pageId, assetId);
    return null;
  }

  const existing = context.copiedAssetIds.get(asset.id);
  if (existing) return `${assetPrefix}/${existing}`;

  const extension = path.extname(asset.filename) || ".asset";
  const baseName = safeSegment(path.basename(asset.filename, extension));
  const targetName = `${safeSegment(asset.id)}-${baseName}${extension.toLowerCase()}`;
  const targetPath = path.join(context.assetsDir, targetName);
  try {
    await fs.promises.copyFile(asset.storage_path, targetPath);
    context.files.push(relativeExportPath(context.rootDir, targetPath));
    context.copiedAssetIds.set(asset.id, targetName);
    context.copiedAssets.push({
      id: asset.id,
      filename: targetName,
      originalFilename: asset.original_filename,
      relativePath: `assets/${targetName}`,
    });
  } catch {
    addWarning(context, "asset_copy_failed", `Asset ${asset.original_filename} could not be copied; image was skipped.`, pageId, asset.id);
    return null;
  }
  return `${assetPrefix}/${targetName}`;
}

function addWarning(context: ExportContext, code: ExportWarningCode, message: string, pageId?: string, assetId?: string): void {
  if (context.warnings.some((warning) => warning.code === code && warning.message === message && warning.pageId === pageId && warning.assetId === assetId)) return;
  context.warnings.push({ code, message, pageId, assetId });
}

function exportFontFamilyValue(preset?: string): string | undefined {
  switch (preset) {
    case "serif": return "Georgia,'Times New Roman',serif";
    case "sans": return "'Helvetica Neue',Helvetica,Arial,sans-serif";
    case "display": return "Impact,Anton,'Bebas Neue',sans-serif";
    default: return undefined;
  }
}

function sectionStyle(props: { background_color?: string; text_color?: string; font_family_preset?: string }): string {
  const fontFamily = exportFontFamilyValue(props.font_family_preset);
  const style = [
    props.background_color ? `background-color: ${escapeAttr(props.background_color)}` : "",
    props.text_color ? `color: ${escapeAttr(props.text_color)}` : "",
    props.text_color ? `--cpsb-text: ${escapeAttr(props.text_color)}` : "",
    props.text_color ? `--cpsb-muted-text: ${escapeAttr(props.text_color)}` : "",
    fontFamily ? `--cpsb-font-family: ${escapeAttr(fontFamily)}` : "",
  ].filter(Boolean).join("; ");
  return style ? ` style="${style}"` : "";
}

function contentSection(className: string, eyebrow: string | undefined, headline: string, body: string[], innerClass = "content-section__inner", style = ""): string {
  return `<section class="${className}"${style}>
    <div class="${innerClass}">
      ${eyebrow ? `<p class="content-section__eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
      <h2>${escapeHtml(headline)}</h2>
      ${body.join("\n")}
    </div>
  </section>`;
}

/** Converts a TextStyle object to an inline style attribute string for exported HTML. */
function itemStyleAttr(style?: { color?: string; background_color?: string; size?: string; font?: string; weight?: string }): string {
  if (!style) return "";
  const parts: string[] = [];
  if (style.color) parts.push(`color:${escapeAttr(style.color)}`);
  if (style.background_color) parts.push(`background-color:${escapeAttr(style.background_color)}`);
  if (style.size && style.size !== "default") {
    const sizes: Record<string, string> = { small: "14px", large: "19px", display: "26px" };
    if (sizes[style.size]) parts.push(`font-size:${sizes[style.size]}`);
  }
  if (style.font && style.font !== "brand") {
    const fonts: Record<string, string> = {
      serif: "Georgia,'Times New Roman',serif",
      sans: "'Helvetica Neue',Helvetica,Arial,sans-serif",
      display: "Impact,Anton,'Bebas Neue',sans-serif",
    };
    if (fonts[style.font]) parts.push(`font-family:${fonts[style.font]}`);
  }
  if (style.weight && style.weight !== "default") {
    const weights: Record<string, string> = { medium: "500", bold: "700" };
    if (weights[style.weight]) parts.push(`font-weight:${weights[style.weight]}`);
  }
  return parts.length ? ` style="${parts.join(";")}"` : "";
}

function cardGrid(cards: Array<{ title: string; description: string; style?: { color?: string; size?: string; font?: string; weight?: string } }>): string {
  return `<div class="card-grid">${cards.map((card) => `<article class="section-card"${itemStyleAttr(card.style)}><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.description)}</p></article>`).join("")}</div>`;
}

function relativeExportPath(exportDir: string, filePath: string): string {
  return path.relative(exportDir, filePath).replace(/\\/g, "/");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/\n/g, " ");
}

/** Inline brand-kit CSS variables — tiny, site-specific, renders before external sheet loads. */
function exportBrandVarsCss(brandKit: BrandKit | null): string {
  const colors = brandKit?.colors;
  const fonts = brandKit?.fonts;
  const primary = colors?.primary_color ?? colors?.primary ?? "#255741";
  const secondary = colors?.secondary_color ?? "#255741";
  const accent = colors?.accent_color ?? colors?.accent ?? "#f0c040";
  const background = colors?.background_color ?? colors?.background ?? "#ffffff";
  const text = colors?.text_color ?? colors?.text ?? "#111111";
  const muted = colors?.muted_text_color ?? colors?.muted ?? "#4d574a";
  const buttonBackground = colors?.button_background ?? "#255741";
  const buttonText = colors?.button_text ?? "#ffffff";
  const radius = `${brandKit?.border_radius ?? 7}px`;
  const fontFamily = fonts?.font_family ?? fonts?.body ?? "Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif";
  return `:root{--cpsb-primary:${primary};--cpsb-secondary:${secondary};--cpsb-accent:${accent};--cpsb-background:${background};--cpsb-text:${text};--cpsb-muted-text:${muted};--cpsb-button-background:${buttonBackground};--cpsb-button-text:${buttonText};--cpsb-border-radius:${radius};--cpsb-font-family:${fontFamily}}`;
}

/** Static section styles written to assets/site.css — brand-independent and cacheable. */
function exportStaticCss(): string {
  return `*{box-sizing:border-box}body{margin:0;font-family:var(--cpsb-font-family);color:var(--cpsb-text);background:var(--cpsb-background)}a{color:inherit}
.hero-section{min-height:80vh;display:flex;align-items:center;background-position:center;background-size:cover;padding:80px 24px}.hero-section__inner{width:min(960px,100%);margin:0 auto}.hero-section--center .hero-section__inner,.final-cta-section--center .final-cta-section__inner{text-align:center}.hero-section--right .hero-section__inner,.final-cta-section--right .final-cta-section__inner{text-align:right}.hero-section__eyebrow,.content-section__eyebrow{margin:0 0 12px;color:var(--cpsb-primary);font-size:12px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}.hero-section h1{max-width:760px;margin:0;font-size:clamp(42px,6vw,76px);line-height:.96}.hero-section__subhead,.hero-section p,.final-cta-section p{max-width:680px;margin:24px 0 0;color:var(--cpsb-muted-text);font-size:20px;line-height:1.55}.hero-section__cta{display:inline-flex;align-items:center;min-height:48px;margin-top:36px;border-radius:var(--cpsb-border-radius);background:var(--cpsb-button-background);color:var(--cpsb-button-text);padding:0 24px;font-size:15px;font-weight:700;text-decoration:none}.hero-section__cta:hover{opacity:.88}
.content-section{padding:88px 24px;background:#ffffff}.content-section--problem,.content-section--faq{background:#f8f9f6}.content-section--solution{background:#eef5ee}.content-section--proof{background:#fdf8ec}.content-section__inner{width:min(1080px,100%);margin:0 auto}.content-section__inner--narrow{width:min(820px,100%)}.content-section h2,.final-cta-section h2{max-width:780px;margin:0;font-size:40px;line-height:1.08}.content-section__intro{max-width:720px;margin:18px 0 0;color:var(--cpsb-muted-text);font-size:18px;line-height:1.6}.card-grid,.metric-grid,.step-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:34px}.section-card,.step-card{border:1px solid #e8ede5;border-radius:var(--cpsb-border-radius);background:#fff;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.05),0 1px 2px rgba(0,0,0,.04)}.section-card:hover{box-shadow:0 4px 14px rgba(0,0,0,.09);transform:translateY(-2px)}.faq-list article{border:none;border-bottom:1px solid #e8ede5;border-radius:0;background:transparent;padding:22px 0}.faq-list article:first-child{border-top:1px solid #e8ede5}.section-card h3,.step-card h3{margin:0 0 10px;font-size:19px;font-weight:700}.faq-list h3{margin:0 0 10px;font-size:17px;font-weight:700}.section-card p,.step-card p,.faq-list p{margin:0;color:var(--cpsb-muted-text);line-height:1.58}.check-list{display:grid;gap:10px;margin:28px 0 0;padding:0;list-style:none}.check-list li{display:flex;align-items:flex-start;gap:12px;border:1px solid #e0e7dd;border-radius:7px;background:#fff;padding:14px 18px;line-height:1.6}.check-list li::before{content:"✓";color:var(--cpsb-primary);font-weight:800;font-size:13px;flex-shrink:0;margin-top:2px}.step-card span{display:grid;place-items:center;width:36px;height:36px;border-radius:999px;background:var(--cpsb-primary);color:#fff;font-size:14px;font-weight:800;margin-bottom:20px}.quote-block{max-width:760px;margin:32px 0 0;padding-left:22px;border-left:3px solid var(--cpsb-accent)}.quote-block blockquote{margin:0;color:var(--cpsb-text);font-size:26px;line-height:1.32;font-style:italic}.quote-block figcaption{margin-top:16px;color:var(--cpsb-muted-text);font-weight:700;font-style:normal}.metric{display:grid;gap:4px;border-top:3px solid var(--cpsb-accent);background:#fff;padding:22px 18px;border-radius:0 0 var(--cpsb-border-radius) var(--cpsb-border-radius)}.metric strong{font-size:40px;line-height:1;color:var(--cpsb-primary);font-weight:800}.metric span{color:var(--cpsb-muted-text);font-size:14px}.faq-list{display:grid;gap:0;margin-top:30px}
.final-cta-section{padding:88px 24px;color:var(--cpsb-button-text);background-size:cover;background-position:center}.final-cta-section__inner{width:min(860px,100%);margin:0 auto}.final-cta-section h2{color:var(--cpsb-button-text)}.final-cta-section p{color:var(--cpsb-button-text)}.final-cta-section .hero-section__cta{background:var(--cpsb-button-text);color:var(--cpsb-button-background)}
.section--soft-card .section-card,.section--soft-card .step-card{border:none;box-shadow:0 4px 16px rgba(0,0,0,.08),0 1px 4px rgba(0,0,0,.06)}.section--soft-card .section-card:hover,.section--soft-card .step-card:hover{box-shadow:0 8px 28px rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.07);transform:translateY(-3px)}.section--contrast-band{background:var(--cpsb-secondary)!important;color:#fff}.section--contrast-band h2,.section--contrast-band .content-section__eyebrow,.section--contrast-band .content-section__intro{color:rgba(255,255,255,.92)}.section--contrast-band .section-card{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.15);box-shadow:none}.section--contrast-band .section-card h3,.section--contrast-band .section-card p{color:rgba(255,255,255,.9)}.section--contrast-band .metric{background:rgba(255,255,255,.1)}.section--contrast-band .metric strong,.section--contrast-band .metric span{color:#fff}.section--centered{text-align:center}.section--centered h2,.section--centered .content-section__intro{margin-left:auto;margin-right:auto}.section--centered .check-list{max-width:560px;margin-left:auto;margin-right:auto;text-align:left}.section--editorial{padding:110px 24px}.section--editorial h2{font-size:48px;line-height:1.05}.section--editorial .content-section__intro{font-size:20px;max-width:820px}.section--minimal{padding:60px 24px}.section--minimal .section-card,.section--minimal .step-card{border:none;border-top:1px solid #e8ede5;border-radius:0;background:transparent;box-shadow:none;padding:20px 0}.section--minimal .section-card:hover,.section--minimal .step-card:hover{transform:none;box-shadow:none}
.page-renderer-tokens,:root{--cpsb-section-spacing:clamp(72px,9vw,128px);--cpsb-section-spacing-tight:clamp(52px,7vw,88px);--cpsb-content-width:1120px;--cpsb-narrow-width:820px;--cpsb-card-radius:max(var(--cpsb-border-radius),10px);--cpsb-button-radius:max(var(--cpsb-border-radius),999px);--cpsb-card-border:color-mix(in srgb,var(--cpsb-primary) 14%,#e7ece4);--cpsb-muted-surface:color-mix(in srgb,var(--cpsb-primary) 5%,#fff);--cpsb-soft-shadow:0 18px 48px rgba(17,24,39,.08),0 2px 8px rgba(17,24,39,.05);--cpsb-card-shadow:0 10px 30px rgba(17,24,39,.07),0 1px 2px rgba(17,24,39,.05)}
.hero-section{position:relative;min-height:min(760px,100vh);overflow:hidden;padding:clamp(88px,12vw,148px) 24px clamp(76px,10vw,120px)}.hero-section:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 82% 18%,color-mix(in srgb,var(--cpsb-accent) 16%,transparent) 0,transparent 32%),linear-gradient(135deg,color-mix(in srgb,var(--cpsb-background) 92%,transparent),color-mix(in srgb,var(--cpsb-background) 74%,transparent))}.hero-section__inner{position:relative;z-index:1;width:min(var(--cpsb-content-width),100%)}.hero-section h1{max-width:840px;color:var(--cpsb-text);font-size:clamp(46px,6.4vw,84px);font-weight:850;letter-spacing:-.025em;line-height:.95}.hero-section__subhead,.hero-section p{max-width:720px;margin-top:26px;font-size:clamp(18px,2vw,22px);line-height:1.62}.hero-section__cta{justify-content:center;min-height:50px;border-radius:var(--cpsb-button-radius);padding:0 26px;font-weight:800;box-shadow:0 10px 24px rgba(17,24,39,.16);transition:box-shadow .18s ease,transform .18s ease,opacity .18s ease}.hero-section__cta:hover{box-shadow:0 14px 32px rgba(17,24,39,.2);opacity:.94;transform:translateY(-1px)}.hero-section__cta:focus-visible{outline:3px solid color-mix(in srgb,var(--cpsb-accent) 72%,#fff);outline-offset:3px}
.content-section{padding:var(--cpsb-section-spacing) 24px}.content-section--problem,.content-section--faq{background:var(--cpsb-muted-surface)}.content-section__inner{width:min(var(--cpsb-content-width),100%)}.content-section__inner--narrow{width:min(var(--cpsb-narrow-width),100%)}.content-section h2,.final-cta-section h2{max-width:820px;color:var(--cpsb-text);font-size:clamp(34px,4.2vw,54px);font-weight:820;letter-spacing:-.018em;line-height:1.04}.card-grid,.metric-grid,.step-list{gap:22px;margin-top:42px}.section-card,.step-card{border:1px solid var(--cpsb-card-border);border-radius:var(--cpsb-card-radius);padding:28px;box-shadow:var(--cpsb-card-shadow);transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}.section-card:hover,.step-card:hover{border-color:color-mix(in srgb,var(--cpsb-primary) 32%,#d8dfd5);box-shadow:var(--cpsb-soft-shadow);transform:translateY(-2px)}.section-card h3,.step-card h3{margin-bottom:12px;color:var(--cpsb-text);font-size:20px;font-weight:780;letter-spacing:-.01em}.faq-list article{border-bottom:1px solid var(--cpsb-card-border);padding:26px 0}.faq-list article:first-child{border-top:1px solid var(--cpsb-card-border)}.faq-list h3{margin-bottom:12px;color:var(--cpsb-text);font-size:19px;font-weight:780}.check-list li:before{content:"";width:8px;height:8px;border-radius:999px;background:var(--cpsb-primary);flex-shrink:0;margin-top:9px}.quote-block{max-width:820px;margin-top:36px;border:1px solid color-mix(in srgb,var(--cpsb-accent) 30%,#eee7d0);border-left:4px solid var(--cpsb-accent);border-radius:var(--cpsb-card-radius);background:rgba(255,255,255,.78);padding:30px 32px;box-shadow:0 10px 32px rgba(17,24,39,.06)}.metric{gap:8px;padding:26px 22px;border-radius:0 0 var(--cpsb-card-radius) var(--cpsb-card-radius);box-shadow:var(--cpsb-card-shadow)}
.final-cta-section{position:relative;overflow:hidden;padding:var(--cpsb-section-spacing) 24px}.final-cta-section:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 18% 24%,rgba(255,255,255,.15) 0,transparent 28%),linear-gradient(135deg,rgba(0,0,0,.08),rgba(0,0,0,.22))}.final-cta-section__inner{position:relative;z-index:1}.final-cta-section p{max-width:700px;margin-top:22px;color:color-mix(in srgb,var(--cpsb-button-text) 86%,transparent);font-size:clamp(18px,2vw,21px);line-height:1.6}.section--soft-card .section-card,.section--soft-card .step-card{box-shadow:var(--cpsb-soft-shadow)}.section--minimal{padding:var(--cpsb-section-spacing-tight) 24px}.section--minimal .section-card,.section--minimal .step-card{border-top:1px solid var(--cpsb-card-border)}
.content-section__inner,.section-card,.step-card,.check-list li{min-width:0}.card-grid,.metric-grid,.step-list{min-width:0}.hero-section h1,.hero-section__subhead,.hero-section p,.hero-section__cta,.content-section h2,.final-cta-section h2,.content-section__intro,.section-card h3,.step-card h3,.faq-list h3,.section-card p,.step-card p,.faq-list p,.check-list li,.quote-block blockquote,.metric strong,.metric span{overflow-wrap:anywhere}.hero-section__cta{max-width:100%;white-space:normal;text-align:center;line-height:1.25}.page-renderer,body{overflow-x:clip}
@media(min-width:681px) and (max-width:960px){:root{--cpsb-section-spacing:clamp(60px,9vw,96px);--cpsb-section-spacing-tight:clamp(44px,7vw,72px)}.hero-section{min-height:auto}.card-grid,.metric-grid,.step-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:680px){.card-grid,.metric-grid,.step-list{grid-template-columns:1fr}.content-section h2,.final-cta-section h2{font-size:32px}.hero-section{align-items:flex-start;min-height:auto;padding-top:64px}.hero-section h1{font-size:42px}.section-card,.step-card{padding:24px}.quote-block{padding:24px}}
@media(max-width:430px){:root{--cpsb-section-spacing:56px;--cpsb-section-spacing-tight:40px}.hero-section,.content-section,.final-cta-section{padding-left:18px;padding-right:18px}.hero-section{padding-top:56px;padding-bottom:64px}.hero-section h1{font-size:clamp(36px,12vw,42px)}.hero-section__subhead,.final-cta-section p{font-size:17px}.hero-section__cta{width:100%;min-height:48px;padding:12px 18px}.section-card,.step-card,.quote-block,.metric{padding:22px}}
.section--font-size-compact{padding-top:60px;padding-bottom:60px}.section--font-size-compact h2{font-size:30px;line-height:1.12}.section--font-size-compact .content-section__intro{font-size:15px}.section--font-size-compact .section-card h3,.section--font-size-compact .step-card h3,.section--font-size-compact .faq-list h3{font-size:16px}.section--font-size-compact .section-card p,.section--font-size-compact .step-card p,.section--font-size-compact .faq-list p{font-size:13px;line-height:1.5}.section--font-size-large h2{font-size:48px;line-height:1.05}.section--font-size-large .content-section__intro{font-size:20px}.section--font-size-large .section-card h3,.section--font-size-large .step-card h3{font-size:22px}.section--font-size-editorial{padding-top:104px;padding-bottom:104px}.section--font-size-editorial h2{font-size:56px;line-height:1.02;letter-spacing:-.02em}.section--font-size-editorial .content-section__intro{font-size:21px;line-height:1.65}.section--font-serif{font-family:Georgia,"Times New Roman",serif}.section--font-serif h2,.section--font-serif h3{font-weight:700;letter-spacing:-.01em}.section--font-sans{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}.section--font-display{font-family:Impact,Anton,"Bebas Neue",sans-serif}.section--font-display h2{font-weight:900;letter-spacing:.02em;text-transform:uppercase}`;
}
