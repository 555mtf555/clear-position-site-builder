# Operator Trial Notes — Phase 12.5

Complete this form after running the end-to-end handoff trial. Paste the filled form back to the coding agent before any Phase 12.5 code changes begin. The agent will not edit application code until trial notes are provided.

See also:
- `docs/end-to-end-handoff-trial.md` — checklist of steps to follow
- `docs/manual-consulting-os-handoff.md` — full workflow description
- `packages/shared/fixtures/consulting-packet-import.realistic.json` — Brightline fixture (use this if you do not have a live Consulting OS packet)

---

## How To Run The Trial

### Option A: Use the Realistic Fixture (no Consulting OS required)

1. Start the site builder:
   ```
   npm run dev
   ```
2. Open `http://localhost:5173/companies/co_acme/sites`
3. Click **Import Consulting Packet** on any site.
4. Click **Upload .json file** and select:
   `packages/shared/fixtures/consulting-packet-import.realistic.json`
   — or paste its contents into the JSON paste box.
5. Continue from step 4 of the Site Builder trial steps below.

### Option B: Use a Live Consulting OS Packet

1. Run the Consulting OS (`agent_core`) project through intake → packet assembly → review.
2. Download:
   ```
   GET /api/projects/{project_id}/builder-import.json
   ```
   Save as `builder-import.json`.
3. Open the site builder and use **Import Consulting Packet** to upload the file.
4. Continue from step 4 of the Site Builder trial steps below.

### Site Builder Trial Steps (both options)

4. Review the import preview:
   - Generated page title and slug
   - Section list and source notes
   - Missing assets
   - Validation warnings
   - Brand kit suggestions
5. Optionally exclude or reorder sections.
6. Click **Create Page**.
7. Open the page in the editor.
8. Review the **Import provenance** panel.
9. Work through the **Handoff QA** checklist. Mark items complete.
10. Save the page.
11. Export the page (`POST /api/pages/:id/export`) or the site (`POST /api/sites/:id/export`).
12. Open the exported `index.html` in a browser.
13. Open the exported `index.html` in a text editor and search for:
    - `import_notes` — should not appear
    - `consulting_packet` — should not appear
    - `provenance` — should not appear

---

## Trial Notes Form

**Project / packet used:**
(e.g. "Brightline realistic fixture" or project name from Consulting OS)

**Date:**

**Builder page created:**
(page title and slug)

**Site exported:**
(site name / export folder path)

---

### 1. Import Experience

- Was it obvious where to upload or paste the JSON?
- Did the preview explain clearly what page sections would be created?
- Were warnings and missing assets visible enough before page creation?

**Notes:**

---

### 2. Section Mapping Quality

For each section below, note whether the imported copy matched what the packet contained, was generic/fallback, or was missing:

- **Hero:** (copy quality / source accuracy)
- **Problem:** (copy quality / source accuracy)
- **Solution:** (copy quality / source accuracy)
- **Process:** (copy quality / source accuracy)
- **Proof:** (copy quality / source accuracy — were unverified metrics omitted or noted?)
- **Services:** (copy quality / source accuracy)
- **FAQ:** (copy quality / source accuracy)
- **Final CTA:** (copy quality / source accuracy)

**Notes:**

---

### 3. Copy Quality

- Any sections with duplicate copy (e.g. hero and final CTA repeating the same headline)?
- Any sections with obviously generic/placeholder copy?
- Any unverified claims present that should have been omitted or flagged?
- Any sections where key context from the packet was missing?

**Notes:**

---

### 4. QA / Provenance

- Were section source notes useful when editing?
- Were the QA checklist item labels clear and actionable?
- Did the dashboard QA badge correctly reflect unresolved items before completion and ready status afterward?
- Any labels or panel UI that felt confusing?

**Notes:**

---

### 5. Export Quality

- Did `index.html` open in a browser correctly?
- Did styling look right (brand colors, fonts, layout)?
- Did image/asset references resolve (or fail gracefully)?
- Did the exported HTML use the imported page meta title?
- Did the exported HTML contain any internal metadata (import_notes, consulting_packet, provenance)? (Answer must be: No)

**Notes:**

---

### 6. Fixes Needed

List only things that actually broke or confused you during the trial:

**Must fix:**
(blocking issues — wrong copy, broken export, data loss)

**Should fix:**
(confusing labels, poor visibility, weak fallback copy)

**Nice to have:**
(minor UX polish, wording tweaks)

---

## Return This Form

Paste the completed form into the chat. The coding agent will read your findings and implement only the smallest changes needed to address them.
