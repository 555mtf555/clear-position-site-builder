import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import {
  ConsultingPacketImport,
  createImportQaChecklist,
  createPageDraftFromConsultingPacket,
} from "@clear-position/shared";

// Point each test run at an isolated SQLite file BEFORE we import any module
// that touches the database connection.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cpsb-test-"));
process.env.DATA_DIR = tmpDir;
process.env.UPLOADS_DIR = path.join(tmpDir, "uploads");
process.env.EXPORTS_DIR = path.join(tmpDir, "exports");

const { createApp } = await import("../app");
const { migrate } = await import("../db/migrate");
const { seed } = await import("../db/seed");
const { db } = await import("../db/connection");

let app: ReturnType<typeof createApp>;

beforeAll(() => {
  migrate();
  seed();
  app = createApp();
});

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe("GET /api/companies and /api/sites", () => {
  it("returns the seeded company", async () => {
    const res = await request(app).get("/api/companies");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].slug).toBe("acme");
  });

  it("returns the seeded sites including the core site and at least two child sites", async () => {
    const res = await request(app).get("/api/sites?company_id=co_acme");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3);

    const cores = res.body.filter((s: { is_core_site: boolean }) => s.is_core_site);
    expect(cores).toHaveLength(1);
    const core = cores[0];
    expect(core.site_type).toBe("core");

    const children = res.body.filter((s: { is_core_site: boolean }) => !s.is_core_site);
    expect(children.length).toBeGreaterThanOrEqual(2);
    for (const child of children) {
      expect(child.linked_site_ids).toContain(core.id);
      expect(child.parent_site_id).toBe(core.id);
    }
    for (const childId of children.map((c: { id: string }) => c.id)) {
      expect(core.linked_site_ids).toContain(childId);
    }
  });
});

describe("GET /api/pages/:id", () => {
  it("returns the seeded home page with a hero section", async () => {
    const res = await request(app).get("/api/pages/page_home");
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Home");
    expect(res.body.doc.sections.length).toBeGreaterThanOrEqual(4);
    expect(res.body.doc.sections[0].type).toBe("hero");
    expect(res.body.doc.sections[0].props.headline).toMatch(/easier to understand/);
  });
});

describe("POST /api/pages — validation", () => {
  it("rejects a hero section with no headline", async () => {
    const res = await request(app).post("/api/pages").send({
      site_id: "site_acme_core",
      slug: "bad-headline",
      title: "Bad",
      doc: {
        version: 1,
        sections: [
          { id: "h", type: "hero", props: { text_align: "left" }, elements: [] },
        ],
      },
    });
    expect(res.status).toBe(400);
  });

  it("rejects an unknown section type", async () => {
    const res = await request(app).post("/api/pages").send({
      site_id: "site_acme_core",
      slug: "bad-type",
      title: "Bad",
      doc: {
        version: 1,
        sections: [{ id: "h", type: "spacer", props: {} }],
      },
    });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid slug", async () => {
    const res = await request(app).post("/api/pages").send({
      site_id: "site_acme_core",
      slug: "Bad Slug!",
      title: "Bad",
      doc: { version: 1, sections: [] },
    });
    expect(res.status).toBe(400);
  });

  it("saves a valid page and reloads it intact", async () => {
    const created = await request(app).post("/api/pages").send({
      site_id: "site_acme_core",
      slug: "about",
      title: "About",
      doc: {
        version: 1,
        sections: [
          {
            id: "h1",
            type: "hero",
            props: { headline: "About us", text_align: "center" },
            elements: [],
          },
        ],
      },
    });
    expect(created.status).toBe(201);
    expect(created.body.id).toMatch(/^page_/);

    const fetched = await request(app).get(`/api/pages/${created.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.title).toBe("About");
    expect(fetched.body.doc.sections[0].props.headline).toBe("About us");
    expect(fetched.body.doc.sections[0].props.text_align).toBe("center");
  });
});

describe("PUT /api/pages/:id — validation", () => {
  it("rejects an update that breaks the doc schema", async () => {
    const res = await request(app).put("/api/pages/page_home").send({
      doc: {
        version: 1,
        sections: [{ id: "h", type: "hero", props: {}, elements: [] }],
      },
    });
    expect(res.status).toBe(400);
  });

  it("accepts a valid update", async () => {
    const res = await request(app).put("/api/pages/page_home").send({
      title: "Home (updated)",
    });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Home (updated)");
  });
});

describe("Assets API", () => {
  it("rejects non-image uploads", async () => {
    const res = await request(app)
      .post("/api/assets")
      .field("company_id", "co_acme")
      .attach("file", Buffer.from("not an image"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);
  });

  it("accepts a valid small image upload and lists it", async () => {
    const image = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 4,
        background: "#1a6b4a",
      },
    }).png().toBuffer();

    const uploaded = await request(app)
      .post("/api/assets")
      .field("company_id", "co_acme")
      .field("alt_text", "Green square")
      .attach("file", image, {
        filename: "green.png",
        contentType: "image/png",
      });

    expect(uploaded.status).toBe(201);
    expect(uploaded.body.id).toMatch(/^asset_/);
    expect(uploaded.body.original_filename).toBe("green.png");
    expect(uploaded.body.mime_type).toBe("image/png");
    expect(uploaded.body.size_bytes).toBeGreaterThan(0);
    expect(uploaded.body.width).toBe(2);
    expect(uploaded.body.height).toBe(2);
    expect(uploaded.body.alt_text).toBe("Green square");
    expect(uploaded.body.url).toMatch(/^\/uploads\/asset_/);

    const listed = await request(app).get("/api/assets?company_id=co_acme");
    expect(listed.status).toBe(200);
    expect(listed.body.some((asset: { id: string }) => asset.id === uploaded.body.id)).toBe(true);
  });

  it("rejects oversized uploads", async () => {
    const oversized = Buffer.alloc((5 * 1024 * 1024) + 1);

    const res = await request(app)
      .post("/api/assets")
      .field("company_id", "co_acme")
      .attach("file", oversized, {
        filename: "big.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too large/i);
  });

  it("delete removes the database record and local upload file", async () => {
    const image = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: "#ffffff",
      },
    }).png().toBuffer();

    const uploaded = await request(app)
      .post("/api/assets")
      .field("company_id", "co_acme")
      .attach("file", image, {
        filename: "white.png",
        contentType: "image/png",
      });

    expect(fs.existsSync(uploaded.body.storage_path)).toBe(true);

    const deleted = await request(app).delete(`/api/assets/${uploaded.body.id}`);
    expect(deleted.status).toBe(204);
    expect(fs.existsSync(uploaded.body.storage_path)).toBe(false);

    const fetched = await request(app).get(`/api/assets/${uploaded.body.id}`);
    expect(fetched.status).toBe(404);
  });

  it("delete does not unlink unsafe storage paths", async () => {
    const unsafePath = path.join(tmpDir, "outside-upload.txt");
    fs.writeFileSync(unsafePath, "do not delete");
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO assets (
        id, company_id, filename, original_filename, mime, mime_type, size, size_bytes,
        storage_path, width, height, alt_text, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "asset_unsafe",
      "co_acme",
      "asset_unsafe.png",
      "unsafe.png",
      "image/png",
      "image/png",
      10,
      10,
      unsafePath,
      1,
      1,
      "",
      now,
    );

    const deleted = await request(app).delete("/api/assets/asset_unsafe");
    expect(deleted.status).toBe(204);
    expect(fs.existsSync(unsafePath)).toBe(true);

    const fetched = await request(app).get("/api/assets/asset_unsafe");
    expect(fetched.status).toBe(404);
  });
});

describe("Page export", () => {
  it("creates index.html with expected section content", async () => {
    const res = await request(app).post("/api/pages/page_home/export");

    expect(res.status).toBe(200);
    expect(res.body.files_generated).toContain("index.html");
    expect(res.body.files_generated).toContain("export-manifest.json");
    const html = fs.readFileSync(path.join(res.body.export_path, "index.html"), "utf8");
    expect(html).toContain("Make your value easier to understand and easier to buy.");
    expect(html).toContain("<!doctype html>");
  });

  it("writes a manifest without backend storage paths", async () => {
    const res = await request(app).post("/api/pages/page_home/export");

    expect(res.status).toBe(200);
    const manifest = JSON.parse(fs.readFileSync(path.join(res.body.export_path, "export-manifest.json"), "utf8"));
    expect(manifest.pageId).toBe("page_home");
    expect(manifest.siteId).toBe("site_acme_core");
    expect(manifest.sourcePageSlug).toBe("home");
    expect(manifest.files).toContain("index.html");
    expect(manifest.files).toContain("export-manifest.json");
    expect(JSON.stringify(manifest)).not.toContain(process.env.UPLOADS_DIR);
  });

  it("exports an external CSS file and links it from the HTML", async () => {
    const res = await request(app).post("/api/pages/page_home/export");

    expect(res.status).toBe(200);

    // External CSS file must exist.
    const cssPath = path.join(res.body.export_path, "assets", "site.css");
    expect(fs.existsSync(cssPath)).toBe(true);

    // HTML must link the external file.
    const html = fs.readFileSync(path.join(res.body.export_path, "index.html"), "utf8");
    expect(html).toContain('<link rel="stylesheet" href="assets/site.css"');

    // Static section styles go in the external file, not inline.
    expect(html).not.toContain(".hero-section{");

    // Brand variables remain inline so they load before the external sheet.
    expect(html).toContain(":root{");
  });

  it("external CSS file contains static section styles and variant classes", async () => {
    const res = await request(app).post("/api/pages/page_home/export");

    expect(res.status).toBe(200);
    const css = fs.readFileSync(path.join(res.body.export_path, "assets", "site.css"), "utf8");
    expect(css).toContain(".hero-section");
    expect(css).toContain(".content-section");
    expect(css).toContain(".section--soft-card");
    expect(css).toContain(".section--minimal");
    expect(css).toContain("@media");
  });

  it("manifest includes cssFile pointing to site.css", async () => {
    const res = await request(app).post("/api/pages/page_home/export");

    expect(res.status).toBe(200);
    const manifest = JSON.parse(fs.readFileSync(path.join(res.body.export_path, "export-manifest.json"), "utf8"));
    expect(manifest.cssFile).toBe("assets/site.css");
    expect(manifest.files).toContain("assets/site.css");
  });

  it("adds a canonical link when meta_canonical is set in page metadata", async () => {
    const canonicalUrl = "https://example.com/my-page";
    const created = await request(app).post("/api/pages").send({
      site_id: "site_acme_core",
      slug: "canonical-test",
      title: "Canonical Test",
      doc: {
        version: 1,
        metadata: {
          meta_title: "Canonical Test",
          meta_description: "Testing canonical URLs",
          meta_canonical: canonicalUrl,
        },
        sections: [{
          id: "h1",
          type: "hero",
          props: { headline: "Canonical", text_align: "left" },
          elements: [],
        }],
      },
    });

    const exported = await request(app).post(`/api/pages/${created.body.id}/export`);
    expect(exported.status).toBe(200);
    const html = fs.readFileSync(path.join(exported.body.export_path, "index.html"), "utf8");
    expect(html).toContain(`<link rel="canonical" href="${canonicalUrl}"`);
  });

  it("omits the canonical link when meta_canonical is not set", async () => {
    const res = await request(app).post("/api/pages/page_home/export");

    const html = fs.readFileSync(path.join(res.body.export_path, "index.html"), "utf8");
    expect(html).not.toContain('rel="canonical"');
  });

  it("missing metadata produces warnings instead of crashing", async () => {
    const res = await request(app).post("/api/pages/page_home/export");

    expect(res.status).toBe(200);
    expect(res.body.warnings.some((warning: { code: string }) => warning.code === "missing_metadata")).toBe(true);
  });

  it("page export includes company brand kit styles", async () => {
    const current = await request(app).get("/api/companies/co_acme/brand-kit");
    await request(app)
      .patch("/api/companies/co_acme/brand-kit")
      .send({
        ...current.body,
        colors: {
          ...current.body.colors,
          button_background: "#123456",
          button_text: "#ffffff",
          background_color: "#fefefe",
        },
        border_radius: 14,
      });

    const res = await request(app).post("/api/pages/page_home/export");

    expect(res.status).toBe(200);
    const html = fs.readFileSync(path.join(res.body.export_path, "index.html"), "utf8");
    expect(html).toContain("--cpsb-button-background:#123456");
    expect(html).toContain("--cpsb-border-radius:14px");
  });

  it("copies referenced image assets and rewrites URLs to relative paths", async () => {
    const image = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 4,
        background: "#1a6b4a",
      },
    }).png().toBuffer();

    const uploaded = await request(app)
      .post("/api/assets")
      .field("company_id", "co_acme")
      .attach("file", image, {
        filename: "green.png",
        contentType: "image/png",
      });

    const created = await request(app).post("/api/pages").send({
      site_id: "site_acme_core",
      slug: "export-image",
      title: "Export Image",
      doc: {
        version: 1,
        sections: [
          {
            id: "h1",
            type: "hero",
            props: {
              headline: "Image export",
              background_image_asset_id: uploaded.body.id,
              background_size: "cover",
              background_position: "center",
              text_align: "left",
            },
            elements: [],
          },
        ],
      },
    });

    const exported = await request(app).post(`/api/pages/${created.body.id}/export`);

    expect(exported.status).toBe(200);
    const assetFile = exported.body.files_generated.find((file: string) => file.startsWith("assets/") && /\.(png|jpg|jpeg|webp|gif)$/i.test(file));
    expect(assetFile).toBeDefined();
    expect(fs.existsSync(path.join(exported.body.export_path, assetFile))).toBe(true);
    const html = fs.readFileSync(path.join(exported.body.export_path, "index.html"), "utf8");
    expect(html).toContain(`url('${assetFile}')`);
    expect(html).not.toContain(uploaded.body.storage_path);
  });

  it("missing asset produces warning instead of crashing", async () => {
    const created = await request(app).post("/api/pages").send({
      site_id: "site_acme_core",
      slug: "missing-asset",
      title: "Missing Asset",
      doc: {
        version: 1,
        sections: [
          {
            id: "h1",
            type: "hero",
            props: {
              headline: "Missing asset",
              background_image_asset_id: "asset_missing",
              background_size: "cover",
              background_position: "center",
              text_align: "left",
            },
            elements: [],
          },
        ],
      },
    });

    const exported = await request(app).post(`/api/pages/${created.body.id}/export`);

    expect(exported.status).toBe(200);
    expect(exported.body.warnings[0].code).toBe("missing_asset");
    const html = fs.readFileSync(path.join(exported.body.export_path, "index.html"), "utf8");
    expect(html).not.toContain("asset_missing");
  });

  it("site export creates one folder with multiple page outputs and shared assets once", async () => {
    const image = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 4,
        background: "#1a6b4a",
      },
    }).png().toBuffer();

    const uploaded = await request(app)
      .post("/api/assets")
      .field("company_id", "co_acme")
      .attach("file", image, {
        filename: "shared.png",
        contentType: "image/png",
      });

    await request(app).post("/api/pages").send({
      site_id: "site_acme_core",
      slug: "services",
      title: "Services",
      doc: {
        version: 1,
        metadata: {
          meta_title: "Services",
          meta_description: "Service overview",
        },
        sections: [
          {
            id: "h1",
            type: "hero",
            props: {
              headline: "Services",
              cta_text: "Go home",
              cta_href: "/home",
              background_image_asset_id: uploaded.body.id,
              text_align: "left",
            },
            elements: [],
          },
        ],
      },
    });

    await request(app).put("/api/pages/page_home").send({
      doc: {
        version: 1,
        metadata: {
          meta_title: "Home",
          meta_description: "Home overview",
          og_image_asset_id: uploaded.body.id,
        },
        sections: [
          {
            id: "h1",
            type: "hero",
            props: {
              headline: "Home export",
              cta_text: "Services",
              cta_href: "/services",
              background_image_asset_id: uploaded.body.id,
              text_align: "left",
            },
            elements: [],
          },
        ],
      },
    });

    const exported = await request(app).post("/api/sites/site_acme_core/export");

    expect(exported.status).toBe(200);
    expect(fs.existsSync(path.join(exported.body.export_path, "index.html"))).toBe(true);
    expect(fs.existsSync(path.join(exported.body.export_path, "services", "index.html"))).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(path.join(exported.body.export_path, "export-manifest.json"), "utf8"));
    expect(manifest.siteId).toBe("site_acme_core");
    expect(manifest.copiedAssets.filter((asset: { id: string }) => asset.id === uploaded.body.id)).toHaveLength(1);
    const homeHtml = fs.readFileSync(path.join(exported.body.export_path, "index.html"), "utf8");
    const servicesHtml = fs.readFileSync(path.join(exported.body.export_path, "services", "index.html"), "utf8");
    expect(homeHtml).toContain("--cpsb-button-background:#123456");
    expect(homeHtml).toContain("href=\"services\"");
    expect(servicesHtml).toContain("href=\"..\"");
  });

  it("exports imported pages with provenance and completed QA metadata present", async () => {
    const packet = ConsultingPacketImport.parse(JSON.parse(fs.readFileSync(
      new URL("../../../shared/fixtures/consulting-packet-import.realistic.json", import.meta.url),
      "utf8",
    )));
    const doc = createPageDraftFromConsultingPacket(packet, { idPrefix: "trial" });
    const completedRequiredAndWarningItems = createImportQaChecklist(doc).items
      .filter((item) => item.severity !== "info")
      .map((item) => item.id);
    doc.metadata = {
      ...doc.metadata,
      import_qa: { completed_item_ids: completedRequiredAndWarningItems },
    };

    const created = await request(app).post("/api/pages").send({
      site_id: "site_acme_core",
      slug: "brightline-trial",
      title: "Brightline Trial",
      doc,
    });
    expect(created.status).toBe(201);

    const pageExport = await request(app).post(`/api/pages/${created.body.id}/export`);
    expect(pageExport.status).toBe(200);
    const pageHtml = fs.readFileSync(path.join(pageExport.body.export_path, "index.html"), "utf8");
    expect(pageHtml).toContain("<title>Brightline Operations Website Messaging Sprint</title>");
    expect(pageHtml).toContain("Stop being the routing layer for every delivery decision.");
    expect(pageHtml).not.toContain("import_notes");
    expect(pageHtml).not.toContain("consulting_packet");

    const siteExport = await request(app).post("/api/sites/site_acme_core/export");
    expect(siteExport.status).toBe(200);
    expect(fs.existsSync(path.join(siteExport.body.export_path, "brightline-trial", "index.html"))).toBe(true);
    const sitePageHtml = fs.readFileSync(path.join(siteExport.body.export_path, "brightline-trial", "index.html"), "utf8");
    expect(sitePageHtml).toContain("Stop being the routing layer for every delivery decision.");
  });

  it("rejects invalid saved Page JSON", async () => {
    db.prepare("UPDATE pages SET doc_json = ? WHERE id = ?")
      .run(JSON.stringify({ version: 1, sections: [{ id: "bad", type: "hero", props: {}, elements: [] }] }), "page_home");

    const exported = await request(app).post("/api/pages/page_home/export");

    expect(exported.status).toBe(400);
  });
});
