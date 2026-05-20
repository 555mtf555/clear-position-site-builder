# Manual Consulting OS To Site Builder Handoff

This workflow keeps Consulting OS and the site builder decoupled. Consulting OS exports a reviewed JSON packet. The site builder imports that file and turns it into editable Page JSON.

## Consulting OS

1. Run the Consulting OS project from intake through packet assembly.
2. Review and approve the required agent outputs.
3. Review the assembled strategy packet.
4. Download the builder handoff JSON from:

```txt
GET /api/projects/{project_id}/builder-import.json
```

The packet and digest responses also include a handoff action:

```json
{
  "label": "Download Builder Import JSON",
  "method": "GET",
  "path": "/api/projects/{project_id}/builder-import.json",
  "href": "/api/projects/{project_id}/builder-import.json"
}
```

Save the response as `builder-import.json`.

For local compatibility testing, the builder also keeps a realistic mirrored import fixture at:

`packages/shared/fixtures/consulting-packet-import.realistic.json`

## Site Builder

1. Open the company dashboard.
2. Click **Import Consulting Packet** on the target site.
3. Upload `builder-import.json`, or paste the JSON manually.
4. Review the generated section list, warnings, missing assets, brand suggestions, and source notes.
5. Include, exclude, or reorder sections before page creation.
6. Create the page.
7. Open the page in the editor.
8. Use the editor's **Import provenance** panel to review warnings and section source notes while editing.
9. Use the **Handoff QA** panel to check off warning, proof, missing asset, fallback section, source note, brand, and export-readiness review items.
10. Save the page so QA completion state is stored in Page JSON metadata.
11. Export the page or full site when the operator review is complete. If unresolved required/warning QA items remain, the editor shows a soft confirmation before export.

The import creates normal builder `PageDoc` JSON. Page content remains editable and exportable through the existing builder workflow.
