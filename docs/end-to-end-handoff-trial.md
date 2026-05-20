# End-to-End Consulting OS to Site Builder Handoff Trial

This checklist is for the current file-based handoff. It does not require live API integration, auth, publishing, or AI generation.

## Trial Fixture

Use the realistic handoff fixture as the reference packet:

- Consulting OS assembled packet fixture: `agent_core/tests/fixtures/realistic_assembled_packet.json`
- Site Builder import fixture: `packages/shared/fixtures/consulting-packet-import.realistic.json`

The fixture represents Brightline Operations and includes homepage-ready copy, missing assets, validation warnings, source mapping, and an unverified numeric proof warning that should affect builder import behavior.

## Consulting OS Steps

1. Confirm the project has a reviewed assembled packet.
2. Open the project packet or digest view.
3. Confirm the builder import affordance is visible:
   - Label: `Download Builder Import JSON`
   - Endpoint shape: `/api/projects/{project_id}/builder-import.json`
4. Download the JSON file as `builder-import.json`.
5. Confirm the file includes only available fields. Placeholder or unavailable fields should be omitted, not emitted as empty values.

## Site Builder Steps

1. Open the company dashboard:
   - `/companies/co_acme/sites`
2. Choose the target site and open `Import Consulting Packet`.
3. Upload `builder-import.json`, or paste its JSON into the importer.
4. Preview the generated mapping.
5. Review before creating the page:
   - Generated page title and slug.
   - Section list and source notes.
   - Fallback-generated sections.
   - Missing assets.
   - Validation warnings.
   - Brand kit suggestions.
   - Omitted or simplified proof claims.
6. Exclude or reorder generated sections only if the preview shows an obvious mismatch.
7. Create the page.
8. Open the page editor.
9. Review `Import provenance`.
10. Review and complete `Handoff QA`.
11. Save the page.
12. Export the page or site.
13. Inspect the exported `index.html`.

## Findings To Record

Use these notes while running the trial:

- Section mapping quality: Did each imported section land in the expected section type?
- Duplicate copy: Did hero, solution, and final CTA repeat the same text too closely?
- Risky proof handling: Were unverified numeric claims omitted or clearly noted?
- Missing asset visibility: Were missing testimonials, logos, headshots, or brand photos easy to spot?
- Fallback sections: Were fallback sections obvious enough for operator review?
- Source notes: Did provenance make it clear which packet fields shaped each section?
- QA badge behavior: Did the dashboard show unresolved QA before review and ready status after completion?
- Export quality: Did exported HTML use the imported meta title and render the page without exposing provenance JSON?

## Current Expected Result

The Brightline fixture should create a valid imported PageDoc, preserve missing assets and validation warnings in metadata, omit unverified numeric proof metrics, show unresolved QA until warning/required checklist items are completed, and export static HTML using the imported project name as the page meta title.
