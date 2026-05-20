import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Isolated SQLite + uploads directories for this test file. Must be set
// BEFORE importing any module that opens the database.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cpsb-companies-"));
process.env.DATA_DIR = tmpDir;
process.env.UPLOADS_DIR = path.join(tmpDir, "uploads");
process.env.EXPORTS_DIR = path.join(tmpDir, "exports");

const { createApp } = await import("../app");
const { migrate } = await import("../db/migrate");
const { seed } = await import("../db/seed");

let app: ReturnType<typeof createApp>;

beforeAll(() => {
  migrate();
  seed();
  app = createApp();
});

describe("Companies management API (Phase 7)", () => {
  it("lists companies", async () => {
    const res = await request(app).get("/api/companies");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].id).toBe("co_acme");
  });

  it("returns a single company by id", async () => {
    const res = await request(app).get("/api/companies/co_acme");
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe("acme");
    expect(res.body.brand_kit.colors.primary).toMatch(/^#/);
  });

  it("PATCH /api/companies/:id/brand-kit persists brand kit changes", async () => {
    const current = await request(app).get("/api/companies/co_acme/brand-kit");
    expect(current.status).toBe(200);

    const updated = await request(app)
      .patch("/api/companies/co_acme/brand-kit")
      .send({
        ...current.body,
        colors: {
          ...current.body.colors,
          primary_color: "#123456",
          secondary_color: "#234567",
          accent_color: "#345678",
          background_color: "#ffffff",
          text_color: "#111111",
          button_background: "#123456",
          button_text: "#ffffff",
        },
        border_radius: 12,
      });

    expect(updated.status).toBe(200);
    expect(updated.body.colors.primary_color).toBe("#123456");
    expect(updated.body.border_radius).toBe(12);

    const reread = await request(app).get("/api/companies/co_acme");
    expect(reread.body.brand_kit.colors.primary_color).toBe("#123456");
    expect(reread.body.brand_kit.border_radius).toBe(12);
  });

  it("PATCH /api/companies/:id/brand-kit rejects invalid colors", async () => {
    const current = await request(app).get("/api/companies/co_acme/brand-kit");
    const res = await request(app)
      .patch("/api/companies/co_acme/brand-kit")
      .send({
        ...current.body,
        colors: {
          ...current.body.colors,
          button_background: "not-a-color",
        },
      });

    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown company", async () => {
    const res = await request(app).get("/api/companies/co_nope");
    expect(res.status).toBe(404);
  });

  it("lists the seeded sites under a company including core + at least two children", async () => {
    const res = await request(app).get("/api/companies/co_acme/sites");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3);

    const core = res.body.find((site: { is_core_site: boolean }) => site.is_core_site);
    expect(core).toBeDefined();
    expect(core.site_type).toBe("core");

    const children = res.body.filter((site: { is_core_site: boolean }) => !site.is_core_site);
    expect(children.length).toBeGreaterThanOrEqual(2);
    for (const child of children) {
      expect(child.parent_site_id).toBe(core.id);
    }
  });
});

describe("Site creation rules (Phase 7)", () => {
  it("creates a non-core site via /api/companies/:id/sites", async () => {
    const res = await request(app)
      .post("/api/companies/co_acme/sites")
      .send({
        name: "Free tools",
        slug: "free-tools",
        site_type: "campaign",
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^site_/);
    expect(res.body.company_id).toBe("co_acme");
    expect(res.body.is_core_site).toBe(false);
    expect(res.body.site_type).toBe("campaign");
    expect(res.body.status).toBe("draft");
  });

  it("rejects a duplicate site slug within the same company with 409", async () => {
    await request(app)
      .post("/api/companies/co_acme/sites")
      .send({ name: "Duplicate", slug: "dup-site", site_type: "custom" });

    const second = await request(app)
      .post("/api/companies/co_acme/sites")
      .send({ name: "Duplicate again", slug: "dup-site", site_type: "custom" });

    expect(second.status).toBe(409);
    expect(second.body.error).toMatch(/already exists/i);
  });

  it("rejects an invalid slug at the schema level", async () => {
    const res = await request(app)
      .post("/api/companies/co_acme/sites")
      .send({ name: "Bad", slug: "BadSlug!", site_type: "custom" });
    expect(res.status).toBe(400);
  });

  it("enforces at most one core site per company by demoting the previous core on create", async () => {
    const before = await request(app).get("/api/companies/co_acme/sites");
    const initialCore = before.body.find((s: { is_core_site: boolean }) => s.is_core_site);
    expect(initialCore).toBeDefined();

    const promoted = await request(app)
      .post("/api/companies/co_acme/sites")
      .send({
        name: "New core site",
        slug: "new-core",
        is_core_site: true,
        site_type: "core",
      });
    expect(promoted.status).toBe(201);
    expect(promoted.body.is_core_site).toBe(true);
    expect(promoted.body.site_type).toBe("core");

    const after = await request(app).get("/api/companies/co_acme/sites");
    const cores = after.body.filter((s: { is_core_site: boolean }) => s.is_core_site);
    expect(cores).toHaveLength(1);
    expect(cores[0].id).toBe(promoted.body.id);

    const demoted = after.body.find((s: { id: string }) => s.id === initialCore.id);
    expect(demoted.is_core_site).toBe(false);
    expect(demoted.site_type).not.toBe("core");
  });

  it("stores parent_site_id so child relationships can be read back", async () => {
    const cores = await request(app).get("/api/companies/co_acme/sites");
    const core = cores.body.find((s: { is_core_site: boolean }) => s.is_core_site);

    const child = await request(app)
      .post("/api/companies/co_acme/sites")
      .send({
        name: "Linked child",
        slug: "linked-child",
        site_type: "service",
        parent_site_id: core.id,
      });
    expect(child.status).toBe(201);
    expect(child.body.parent_site_id).toBe(core.id);

    const reread = await request(app).get(`/api/sites/${child.body.id}`);
    expect(reread.status).toBe(200);
    expect(reread.body.parent_site_id).toBe(core.id);
  });

  it("PATCH /api/sites/:id/core promotes a site and demotes others", async () => {
    const sites = await request(app).get("/api/companies/co_acme/sites");
    const nonCore = sites.body.find((s: { is_core_site: boolean }) => !s.is_core_site);
    expect(nonCore).toBeDefined();

    const promote = await request(app).patch(`/api/sites/${nonCore.id}/core`);
    expect(promote.status).toBe(200);
    expect(promote.body.is_core_site).toBe(true);

    const after = await request(app).get("/api/companies/co_acme/sites");
    const cores = after.body.filter((s: { is_core_site: boolean }) => s.is_core_site);
    expect(cores).toHaveLength(1);
    expect(cores[0].id).toBe(nonCore.id);
  });

  it("PATCH /api/sites/:id can rename and change type", async () => {
    const created = await request(app)
      .post("/api/companies/co_acme/sites")
      .send({ name: "Original", slug: "patch-target", site_type: "custom" });

    const patched = await request(app)
      .patch(`/api/sites/${created.body.id}`)
      .send({ name: "Renamed", site_type: "landing", status: "published" });

    expect(patched.status).toBe(200);
    expect(patched.body.name).toBe("Renamed");
    expect(patched.body.site_type).toBe("landing");
    expect(patched.body.status).toBe("published");
  });
});

describe("Site pages API (Phase 7)", () => {
  it("lists pages by site via nested route", async () => {
    const sitesRes = await request(app).get("/api/companies/co_acme/sites");
    const coreSite = sitesRes.body.find((s: { is_core_site: boolean }) => s.is_core_site);
    expect(coreSite).toBeDefined();

    const pagesRes = await request(app).get(`/api/sites/${coreSite.id}/pages`);
    expect(pagesRes.status).toBe(200);
    expect(pagesRes.body.length).toBeGreaterThanOrEqual(1);
    expect(pagesRes.body.some((p: { slug: string }) => p.slug === "home")).toBe(true);
  });

  it("creates a page under a site with a default empty doc when none is provided", async () => {
    const site = await request(app)
      .post("/api/companies/co_acme/sites")
      .send({ name: "Pages parent", slug: "pages-parent", site_type: "custom" });

    const created = await request(app)
      .post(`/api/sites/${site.body.id}/pages`)
      .send({ title: "Welcome", slug: "welcome" });

    expect(created.status).toBe(201);
    expect(created.body.id).toMatch(/^page_/);
    expect(created.body.site_id).toBe(site.body.id);
    expect(created.body.slug).toBe("welcome");
    expect(created.body.doc.version).toBe(1);
    expect(created.body.doc.sections).toEqual([]);
  });

  it("rejects duplicate page slugs in the same site with 409", async () => {
    const site = await request(app)
      .post("/api/companies/co_acme/sites")
      .send({ name: "Dup pages", slug: "dup-pages", site_type: "custom" });

    await request(app)
      .post(`/api/sites/${site.body.id}/pages`)
      .send({ title: "One", slug: "shared-slug" });

    const second = await request(app)
      .post(`/api/sites/${site.body.id}/pages`)
      .send({ title: "Two", slug: "shared-slug" });

    expect(second.status).toBe(409);
    expect(second.body.error).toMatch(/already exists/i);
  });

  it("allows the same page slug under different sites", async () => {
    const a = await request(app)
      .post("/api/companies/co_acme/sites")
      .send({ name: "Site A", slug: "slug-site-a", site_type: "custom" });
    const b = await request(app)
      .post("/api/companies/co_acme/sites")
      .send({ name: "Site B", slug: "slug-site-b", site_type: "custom" });

    const pageA = await request(app)
      .post(`/api/sites/${a.body.id}/pages`)
      .send({ title: "About", slug: "about" });
    const pageB = await request(app)
      .post(`/api/sites/${b.body.id}/pages`)
      .send({ title: "About", slug: "about" });

    expect(pageA.status).toBe(201);
    expect(pageB.status).toBe(201);
  });

  it("rejects creating a page on a non-existent site", async () => {
    const res = await request(app)
      .post("/api/sites/site_nope/pages")
      .send({ title: "Ghost", slug: "ghost" });
    expect(res.status).toBe(404);
  });

  it("rejects a malformed page doc on create", async () => {
    const site = await request(app)
      .post("/api/companies/co_acme/sites")
      .send({ name: "Bad doc parent", slug: "bad-doc-parent", site_type: "custom" });

    const res = await request(app)
      .post(`/api/sites/${site.body.id}/pages`)
      .send({
        title: "Broken",
        slug: "broken",
        doc: {
          version: 1,
          sections: [
            { id: "h", type: "hero", props: { text_align: "left" }, elements: [] },
          ],
        },
      });

    expect(res.status).toBe(400);
  });
});
