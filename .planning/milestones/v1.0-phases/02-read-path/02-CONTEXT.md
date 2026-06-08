# Phase 2: Read Path (List + Detail + Attachment Preview) - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the read/display layer of Wallecx: a date-sorted vaccination list, a dialog-based detail view, and safe inline attachment preview (image/PDF). Fetch is immediate so the list never flashes empty. CSP is narrowly extended for PDF.js workers. Attachment tokens are generated at view time, not list time. No create/edit/delete UI — Phase 2 is strictly read-only.

**In scope:** READ-01 through READ-07 — VaccinationList.vue, VaccinationDetail.vue, AttachmentPreview.vue, empty/loading/error states, CSP worker-src addition, view-time token generation.
**Out of scope:** Create, edit, delete flows (Phase 3); design token sweep / projects directory tile (Phase 4); any new PocketBase collections or rules.

</domain>

<decisions>
## Implementation Decisions

### Detail View Navigation
- **D-01:** Detail view uses a **PrimeVue Dialog/Modal** — clicking a list row opens the detail in a Dialog overlay. The list stays mounted underneath. This matches the LexTrack ManageTask pattern and requires no routing changes.
- **D-02:** The detail dialog is **static read-only** in Phase 2 — no Edit or Delete buttons. All fields and the attachment preview are displayed. Edit/Delete actions are added in Phase 3 when the write path lands.

### List Row Design
- **D-03:** `VaccinationList.vue` uses a **PrimeVue DataTable** with columns: thumbnail, vaccine name, date administered, dose number, and a row actions column (View button emitting `view`; Edit and Remove buttons left as emitter hooks for Phase 3).
- **D-04:** Records without an attached card show a **placeholder icon** (e.g. `mdi:image-off` or `mdi:card-account-details-outline`) in the thumbnail column. The column is always present — layout stays consistent regardless of whether attachments exist.

### Empty & Loading States
- **D-05:** During data fetch, show **PrimeVue Skeleton rows** (3–4 placeholder rows inside the DataTable area). Prevents layout shift and communicates data is coming. `isLoading` ref gates the skeleton vs. real content.
- **D-06:** When the user has zero records, show a **centered icon + message** ("No vaccination records yet.") with no Add button or CTA. Phase 2 is read-only; Phase 3 will add the action button naturally when the write path lands.

### Claude's Discretion
- Exact thumbnail image dimensions in the DataTable column (`?thumb=100x100` or `?thumb=400x400` — use the smaller thumb for list performance).
- Number of skeleton rows to display during loading (3 or 4).
- DataTable column widths and responsive breakpoint behavior.
- Exact icon name for the no-attachment placeholder (any neutral `mdi:` icon is fine).
- Whether to show a DataTable header / caption label above the table.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 2 — Goal, requirements (READ-01..07), and success criteria
- `.planning/REQUIREMENTS.md` — Full requirement definitions if present

### Codebase Analogs
- `src/components/projects/wallecx/WallecxApp.vue` — Current shell; Phase 2 replaces the record-count paragraph with `<VaccinationList>` and wires up the `view` emit to open the detail dialog
- `src/components/projects/lextrack/ActivityCard.vue` — List row pattern reference (InputGroup style); Wallecx uses DataTable instead but the emit/action pattern is analogous
- `src/lib/pocketbase/index.ts` — Singleton `pb` client; also used for `pb.files.getToken()` (READ-07 view-time token)
- `src/types/wallecx/vaccinations/types.ts` — `Vaccinations` type; Phase 2 components consume this directly

### Security & CSP
- `index.html` — Current CSP meta tag (line 8); Phase 2 adds `worker-src 'self' blob:` to this tag (READ-06). Current CSP has no `worker-src` directive.
- `.planning/research/PITFALLS.md` — Pitfall 5 (PDF.js CVE-2024-4367); verify `pdfjs-dist ≥ 4.2.67` remains pinned

### Prior Phase Context
- `.planning/phases/01-backend-frontend-foundation/01-CONTEXT.md` — Established patterns: Card wrapper, onMounted + try/catch/finally, toast.error, no Pinia, local ref state

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/pocketbase/index.ts` — `pb` singleton; `pb.files.getToken()` generates a short-lived file access token (READ-07)
- `vue-pdf-embed@^2.1.4` — Already installed (FRONT-01). Import as `import VuePdfEmbed from 'vue-pdf-embed'` with dynamic lazy-load to avoid bundling PDF.js in the main chunk
- `browser-image-compression@^2.0.2` — Installed but Phase 2 doesn't use it (Phase 3 upload only)
- PrimeVue components auto-imported: `<DataTable>`, `<Column>`, `<Dialog>`, `<Skeleton>`, `<Button>`, `<Image>` — no explicit imports needed
- `iconify-icon` web component — used across the codebase for `mdi:*` icons; available for thumbnail placeholder

### Established Patterns
- **Fetch pattern:** `onMounted` + `try/catch/finally` + `isLoading` ref; `toast.error` from `vue-sonner` on failure — already wired in `WallecxApp.vue`
- **No Pinia:** Local `ref` state only; `selectedRecord` ref in `WallecxApp.vue` drives the detail dialog
- **`<Card>` wrapper:** Top-level `WallecxApp.vue` wraps in `<Card #content>` — list component sits inside this content slot
- **Auth pattern:** `pb.files.getToken()` must be called at view time (when dialog opens), not at list fetch time (READ-07)
- **Safety:** `notes` field rendered with `{{ }}` mustache syntax only — never `v-html` (READ-02)

### Integration Points
- `WallecxApp.vue` — Add `selectedRecord ref<Vaccinations | null>(null)` and `showDetail ref<boolean>(false)`; wire `@view="openDetail"` from `VaccinationList`
- `index.html` — Add `worker-src 'self' blob:` to the existing CSP meta tag content string
- `src/components/projects/wallecx/` — New files: `VaccinationList.vue`, `VaccinationDetail.vue`, `AttachmentPreview.vue`

### MIME Branching Logic (AttachmentPreview.vue)
- Image MIME types → `<img :src="tokenUrl + '?thumb=400x400'">` (or similar PocketBase thumb param)
- `application/pdf` → lazy-loaded `<VuePdfEmbed>` rendered to canvas
- Unknown / missing → plain `<a :href="tokenUrl" download>` download link
- The `card` field on `Vaccinations` holds the filename; use `pb.files.getUrl(record, record.card)` to construct the base URL, then append token

</code_context>

<specifics>
## Specific Ideas

- Token generation (READ-07): `pb.files.getToken()` returns a short-lived token string; append as `?token={token}` to the file URL. Call this when the detail dialog opens, not during list fetch.
- The `?thumb=400x400` (or `100x100` for list thumbnails) is a PocketBase built-in thumb URL suffix — the `card` field was configured with `100x100` and `400x0` thumbs in Phase 1 (BACK-02).
- CSP change is additive only: append `worker-src 'self' blob:` to the existing meta tag. Do not modify `script-src` (READ-06 explicitly forbids broadening script-src).
- Skeleton row count: 3 rows is sufficient for the loading state — matches a typical "just loaded the page" scenario.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-read-path*
*Context gathered: 2026-05-11*
