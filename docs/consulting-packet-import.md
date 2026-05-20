# Consulting Packet Import Contract

`ConsultingPacketImport` is the file-based handoff contract between Consulting OS and `clear-position-site-builder`.

The builder accepts a pasted JSON object or uploaded `.json` file, validates it with the shared Zod schema, maps it into normal `PageDoc` JSON, and then saves that page through the same page creation API used by the dashboard. The imported page is not a React page. It is structured builder JSON.

## Minimal Valid Packet

All fields are optional so partially reviewed packets can still be imported safely.

```json
{
  "company_name": "Acme Advisory"
}
```

The adapter will use safe fallback section copy when packet fields are missing. Fallback-generated sections are marked in `PageDoc.metadata.import_section_sources`.

## Accepted Fields

| Field | Type | Used For |
| --- | --- | --- |
| `company_name` | string | Hero eyebrow, fallback title metadata |
| `project_name` | string | Imported page title suggestion and metadata |
| `positioning_statement` | string | Hero headline fallback, solution body, meta description |
| `audience_summary` | string | Hero subhead, problem intro |
| `customer_problem` | string | Problem headline and fallback problem card |
| `pain_points` | array of strings or `{ title, description }` | Problem cards |
| `core_messages` | string array | Solution bullets |
| `offer_summary` | string | Hero subhead, solution body, final CTA subhead |
| `primary_offer` | string | Solution headline, services fallback, final CTA headline |
| `services` | array of strings or `{ title, description }` | Services cards |
| `homepage_headlines` | string array | Hero headline, first valid entry wins |
| `cta_options` | array of strings or `{ text, href }` | Hero and final CTA buttons |
| `three_step_process` | array of strings or `{ title, description }` | Process steps |
| `proof_points` | array of strings or `{ value, label, description }` | Proof metrics unless warnings indicate risky numeric proof |
| `testimonials` | array of strings or `{ quote, attribution }` | Proof quote |
| `faq_items` | array of `{ question, answer }` | FAQ items; incomplete items are ignored by the page adapter |
| `homepage_section_outline` | string array | Preserved in packet preview/context; does not directly control section order yet |
| `brand_kit_suggestions` | partial BrandKit | Shown as informational only; never overwrites the company Brand Kit |
| `missing_assets` | string array | Preserved as import notes and shown in preview |
| `validation_warnings` | string array | Preserved as import notes and used to avoid risky proof |
| `source_map` | object | Preserved in page metadata for traceability |

## Rich Packet Example

The canonical example fixture lives at:

`packages/shared/fixtures/consulting-packet-import.example.json`

It includes headline options, CTA options, services, proof, FAQ, warnings, missing assets, brand suggestions, and a source map.

The realistic handoff trial fixture lives at:

`packages/shared/fixtures/consulting-packet-import.realistic.json`

It mirrors a plausible Consulting OS five-agent assembled packet export with unverified numeric proof, missing testimonial/logo assets, and a source map. This fixture is used to verify import quality without a live Consulting OS API call.

## Warning And Missing Asset Handling

The import flow does not hide warnings. It preserves them in `PageDoc.metadata.import_notes` and shows them before page creation.

Missing assets are informational. They do not block import because the builder can create a draft before all images or logos are ready.

Brand kit suggestions are informational only in this phase. They are preserved for operator review and are not automatically applied.

If `validation_warnings` mention unverified, unsupported, risky, claim, metric, proof, or number language, numeric proof points are omitted from the generated proof section. The omission is recorded in import notes and section source notes.

## Section Mapping

The adapter creates one section of each existing business homepage type:

| Section | Primary Sources | Fallback Behavior |
| --- | --- | --- |
| `hero` | `homepage_headlines`, `positioning_statement`, `audience_summary`, `offer_summary`, `cta_options` | Uses company-name based headline and default CTA |
| `problem` | `customer_problem`, `pain_points`, `audience_summary` | Uses a safe problem card about unclear evaluation |
| `solution` | `primary_offer`, `offer_summary`, `core_messages` | Uses default clarity/process bullets |
| `process` | `three_step_process` | Uses a three-step clarify/shape/act flow |
| `proof` | `proof_points`, `testimonials`, `validation_warnings` | Uses a placeholder quote if proof is missing or risky |
| `services` | `services`, `primary_offer`, `offer_summary` | Creates a primary-offer card |
| `faq` | `faq_items` | Uses one placeholder next-step question |
| `final_cta` | `cta_options`, `primary_offer`, `offer_summary` | Uses default consultation CTA |

Each generated section receives a section-level source note in `PageDoc.metadata.import_section_sources` with:

- `section_id`
- `section_type`
- `sources`
- `used_fallback`
- `note`

These notes power the dashboard import preview and help the operator decide what to keep, omit, or edit before creating the page.

## Manual Handoff Workflow

Consulting OS exposes the builder import JSON at:

```txt
GET /api/projects/{project_id}/builder-import.json
```

The operator downloads that response as `builder-import.json`, opens the site builder company dashboard, selects **Import Consulting Packet**, uploads the JSON file, reviews mapping/warnings, creates the page, edits it, and exports the site.

See `docs/manual-consulting-os-handoff.md` for the full operator workflow.
