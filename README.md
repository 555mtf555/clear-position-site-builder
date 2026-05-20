# clear-position-site-builder

Schema-driven modular website builder. Phase 0 scaffold only: data model, persistence, validation, and a preview-only renderer with one section type (`hero`). No editor, no drag/drop, no upload, no static export yet.

## Layout

```
packages/
  shared/    Zod schemas + TS types shared by backend and frontend
  backend/   Express + better-sqlite3 API (Node 20+)
  frontend/  Vite + React + TS preview app
```

## Prerequisites

- Node 20 or newer
- npm 10 or newer

## Install

```
npm install
```

Installs all three workspaces in a single pass.

## Run

```
npm run dev
```

- API: http://localhost:4000
- Frontend: http://localhost:5174 (proxies `/api/*` to the API)

Or run them separately:

```
npm run dev:backend
npm run dev:frontend
```

## Test

```
npm test
```

Runs Vitest in every workspace that has tests (shared, backend, frontend).

## Reset The Database

```
npm run reset:db
```

Deletes the SQLite file under `packages/backend/data/`. The next backend run recreates and re-seeds it.

## Verifying The Preview Works

1. `npm install`
2. `npm run dev`
3. Open http://localhost:5174.
4. You should see one seeded company (Acme Co), two sites (one marked Core, one child linked back to it), and one page.
5. Click the page link. The preview route renders the hero section from the page's JSON document.

If validation is doing its job, `POST /api/pages` with a missing `headline` or an unknown section `type` returns 400. The backend tests assert this.

## Architecture

- **Source of truth is JSON.** Pages are stored as a single JSON document per row (`pages.doc_json`). The editor later will mutate this document; the renderer reads it.
- **Schemas live in one place.** `packages/shared/src/schemas` exports Zod schemas. The backend validates writes against them. The frontend imports the inferred TS types.
- **Renderer is isolated.** `packages/frontend/src/renderer` has no editor logic. It takes a `Page` and renders. Section components live in `renderer/sections/`.
- **Companies own multiple Sites.** One Site can be flagged `is_core_site`. `linked_site_ids` is an array on each Site, so the core can list its children and children can point back. Cross-linking is intentional and unenforced; UI surfaces it in later phases.
- **BrandKit cascade.** Company carries a `brand_kit`. Site and Page can each carry `brand_overrides` (partial BrandKit). Rendering merges them later; Phase 0 stores them but does not apply overrides yet.

## Current Validation Rules

- Hero `headline` is required.
- Hero `background_color` must be a hex color, such as `#0f172a` or `#fff`. CSS named colors and design tokens are not accepted yet.
- Hero CTA fields are paired: `cta_text` and `cta_href` must either both be empty or both be present.
- Section types currently supported: `hero`, `problem`, `solution`, `process`, `proof`, `services`, `faq`, and `final_cta`.
- Page `title` is required.
- Page `status` must be `draft` or `published`.

## Out Of Scope For Phase 0

- Drag/drop or freeform positioning
- Snapping or alignment guides
- Image upload, paste, or replacement
- Authentication
- Static export / publish pipeline
- AI generation
- Editor UI

## Recommended Next Phase

Build the section inspector: a form-based editor that lets you change `hero` props, save the page through `PUT /api/pages/:id`, and see the preview update. Drag-to-reorder comes after that, once we have more than one section type.
