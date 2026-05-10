# Project Research Summary

**Project:** Wallecx — Personal Records Vault (Phase 1: Vaccination Records)
**Domain:** Authenticated CRUD mini-app with file attachments inside the existing Lexarium SPA
**Researched:** 2026-05-10
**Confidence:** HIGH

## Executive Summary

Wallecx Phase 1 is a thin, opinionated feature slice on top of an already-built Lexarium SPA. The job is to let an authenticated user create, view, edit, and delete their own vaccination records — text fields plus an attached scan/photo of the card — and nothing else. The research is unanimous: every architectural primitive needed already exists in the codebase (Vue 3 + Vite 8, PrimeVue 4 Aura, Pinia auth store, Vue Router with `requiresAuth` guard, PocketBase client singleton, Tailwind v4, Zod + `@primevue/forms`, `dompurify`, `vue-sonner`, `dayjs`). Only **two net new runtime dependencies** are recommended: `browser-image-compression` for shrinking phone-camera attachments and `vue-pdf-embed` for rendering uploaded PDF certificates safely.

The recommended approach is to **mirror LexTrack**: a single route component (`WallecxApp.vue`) holds local `ref` state, four sibling components handle list / manage / detail / attachment-preview, a flat mapper module wraps PocketBase writes, and a single `wallecx_vaccinations` collection (deliberately specific, not a polymorphic vault table) holds the data. FHIR / SMART Health Card / coded vocabularies are explicitly rejected for v1 — there is no interop partner and the user wants "save and view," not clinical exchange.

The dominant risk is **privacy regression via copy-pasted Lexarium anti-patterns**. Five known live-codebase bugs in LexTrack and Gift Exchange (filter-string interpolation, save-loop never refreshing IDs, delete-only-mutates-local-state, client-only auth gates, `v-html` near user input) will copy into Wallecx unless explicitly prevented. Mitigation is mechanical: server-side per-user PocketBase rules on all five operations, parameterised filter syntax (`{:name}`), a mapper that returns the server-issued record so subsequent saves PATCH instead of POST, an `await pb.delete()` before any local splice, and EXIF stripping of uploaded photos via canvas re-encode. The PDF preview path adds a sixth concern (CVE-2024-4367 in `pdfjs-dist` < 4.2.67); pinning the version and rendering via canvas (which `vue-pdf-embed` does for us) closes it.

## Key Findings

### Recommended Stack

The Lexarium stack is locked and sufficient. Wallecx adds two runtime dependencies — both small, both for the file-attachment story.

**Net new dependencies (2):**
- `browser-image-compression` ^2.0.2 — ~12 kB, web-worker capable; compresses 3–8 MB phone photos to ~1.5 MB before upload, preserves orientation. Skip for PDFs and small images. *Why:* phone-camera attachments otherwise blow past PocketBase body-size limits and clog storage.
- `vue-pdf-embed` ^2.1.4 — Vue-3-only `pdfjs-dist` wrapper, MIT, actively maintained, accepts URL/Blob/ArrayBuffer. Lazy-load via `defineAsyncComponent` so `pdfjs-dist` (~350 kB gzipped) only ships when a record with a PDF is opened. *Why:* `<iframe>` previews break under the existing CSP `frame-src 'none'` and `<embed>` is inconsistent across browsers; raw `pdfjs-dist` requires hand-rolled canvas glue. `vue-pdf-embed` renders to canvas (sidesteps CVE-2024-4367-class XSS via `v-html`).

**Reused (already on disk):** `pocketbase` ^0.26.2 (file uploads via plain object — SDK auto-handles multipart), `primevue` ^4.3.7 (`FileUpload mode="basic"` + `:auto="false"` + `@select`; **avoid** `customUpload` due to open issue #7664), `zod` ^4.1.5 + `@primevue/forms` `zodResolver` (matches existing `Login.vue` pattern), `dayjs` (`"YYYY-MM-DD"` format for PocketBase date fields), `vue-sonner` (toasts), `dompurify` (only if rich text is ever introduced — v1 is plain text).

**Explicitly rejected:** FHIR Immunization resource (no interop partner, 30+ fields, schema explosion), `vue-pdf` (unscoped, last meaningful update June 2021), `<iframe>` PDF preview (breaks CSP, no zoom control), `uppy`/`filepond` (heavyweight for one-file-per-record), `quill` for notes (adds DOMPurify on the read path for zero v1 value), VeeValidate / Yup / Valibot (would fragment the existing Zod + PrimeVue Forms convention).

Full detail: `.planning/research/STACK.md`.

### Expected Features

**Must have (v1 launch — confirmed in PROJECT.md and surveyed against Apple Health, MyChart, CommonHealth, VaxYes, Vaccy, VaxTrack):**
- Auth-gated `/projects/wallecx` route (route guard + PocketBase rules)
- PocketBase `wallecx_vaccinations` collection with per-user rules on **all five** operations
- Fields: `vaccine_name`, `date_administered`, `dose_number`, `lot_number`, `location`
- Optional file attachment (image OR PDF) per record on a single `card`/`attachment` field
- List view sorted by date administered (newest first)
- Detail view showing all fields + attachment preview (image inline, PDF via `vue-pdf-embed`)
- CRUD via PrimeVue dialogs (LexTrack pattern), confirm-before-delete
- Empty / loading / error states; `vue-sonner` toasts on success/failure
- Wallecx tile in `ProjectsView.vue` projects directory
- Lexarium navy/amber + Rubik styling — no bespoke palette

**Recommended additions for v1 (flagged by FEATURES.md, low cost, high meaning):**
- `manufacturer` field — optional free-text. Printed on every paper card; distinguishes Pfizer vs Moderna for the same "COVID-19 vaccine" name. Trivial to add.
- `notes` field — optional plain-text textarea (NOT rich text). Captures everything the structured fields don't. Render with `{{ notes }}`, never `v-html`.

**Should have (v1.x post-launch polish, deferred):**
- Client-side filter / search by vaccine name
- Sort toggle (date asc/desc, name)
- Multi-file per record (front + back of card)
- Tag/category field
- JSON / CSV export ("download all my data" — trust signal for a privacy-focused vault)

**Defer (v2+ / future Wallecx phases):**
- Other vault record types (identity docs, prescriptions, lab results) — Phase 2+, the explicit Wallecx roadmap. Schema *allows* this; we do not pre-build it.
- Family / dependent profiles
- PDF summary export
- Reminders for upcoming doses (Lexarium has no notification infra)
- Share via signed link
- OCR auto-fill from card photo
- SMART Health Card / FHIR import
- CDC-schedule-aware "what's due"
- Coded vocabularies (CVX/SNOMED)

Full detail: `.planning/research/FEATURES.md`.

### Architecture Approach

Wallecx is one lazy-loaded route, one PocketBase collection, one mapper, one type module, and five Vue SFCs in `src/components/projects/wallecx/`. No Pinia store (state lives in `WallecxApp.vue` `ref`s, mirroring LexTrack). No `WallecxView.vue` shell — go straight from router to `WallecxApp.vue` (matches `LargaApp.vue` and `ApiPlaygroundApp.vue`). Subcomponent names must be prefixed (`VaccinationList.vue`, `VaccinationDetail.vue`, `ManageVaccination.vue`, `AttachmentPreview.vue`) to avoid `unplugin-vue-components` global-name collisions with PrimeVue.

**Build order (dictated by dependency, every step independently mergeable):**

1. **PocketBase schema + rules** — create `wallecx_vaccinations` collection with all five per-user rules and `(user, date_administered DESC)` index. Two-user smoke test before merge. *Risk gate.*
2. **Type module** — `src/types/wallecx/vaccinations/types.d.ts` exporting `Vaccinations extends RecordModel` and `AddVaccination`.
3. **Mapper** — `src/lib/pocketbase/vaccinationMapper.ts` with `mapToUpdateVaccination` (strips `id`/`created`/`updated`/`user`/`card`).
4. **Route + auth gate** — register `/projects/wallecx` lazy route with `meta: { requiresAuth: true }`.
5. **`WallecxApp.vue` shell** — `onMounted` fetch via `getFullList<Vaccinations>({ sort: '-date_administered' })`. Verifies the entire stack end-to-end.
6. **`VaccinationList.vue`** — emits `view`/`edit`/`remove`.
7. **`AttachmentPreview.vue`** — image-or-PDF branching renderer. Built before Detail/Manage so both consume it.
8. **`VaccinationDetail.vue`** — read-only panel using `AttachmentPreview`.
9. **`ManageVaccination.vue`** — create/edit dialog with `zodResolver`, FormData create + mapper-based update, EXIF strip + image compression on upload.
10. **Delete flow** — confirm dialog -> `await pb.collection().delete(id)` -> splice -> toast (in that order).
11. **Projects directory tile** — last, so the link only appears when the destination works.
12. **Seed tests (optional but flagged)** — mapper unit test (create-then-update sequence) + route guard test.

Full detail: `.planning/research/ARCHITECTURE.md`.

### Critical Pitfalls

The five highest-priority risks — all repo-precedent (existing Lexarium bugs that will copy-paste into Wallecx unless explicitly prevented):

1. **Per-user isolation enforced only client-side (CRITICAL)** — Set all five collection rules: `listRule`/`viewRule`/`updateRule`/`deleteRule` = `@request.auth.id != "" && user = @request.auth.id`; `createRule` = `@request.auth.id != "" && @request.data.user = @request.auth.id`. The route guard is UX only. Verify with a second user in incognito before merge.
2. **Filter-string injection (HIGH)** — Eleven existing call sites in the codebase use template-literal filters. Use parameterised syntax (`'name = {:name}'`, `{ filter: { name } }`) everywhere. Add a CI grep to fail builds on template-literal filters in Wallecx files and the mapper.
3. **Save loop never refreshes IDs (HIGH)** — Repo precedent: `LexTrackView.vue:127-165`. Mapper contract: `createVaccination` must `return` the server response and the caller must `Object.assign(item, created)` so subsequent saves PATCH (not POST another duplicate record + orphan attachment).
4. **Delete only mutates local state (HIGH)** — Repo precedent: `LexTrackView.vue:42-91` (`removeSupport`/`removeMeeting`/`removeTask`). Always `await pb.collection().delete(id)` *before* the local splice. On failure, do NOT splice. Spec the failure path.
5. **Orphan files on record delete (HIGH)** — PocketBase issue #151: cascade-delete via relations does not remove files. Keep the `card` file field on the same record (NOT a separate `wallecx_vaccination_files` collection). Verify file URL 404s within ~5s post-delete in the smoke test.

**Also high-priority for Wallecx specifically:**
- **EXIF GPS leak (HIGH privacy)** — phone photos embed home GPS coordinates. Strip via canvas re-encode (`canvas.toBlob('image/jpeg', 0.92)`) before upload. Surface in UI: "We've removed location data from your photo." Pairs naturally with `browser-image-compression`.
- **PDF.js XSS / CVE-2024-4367 (HIGH)** — pin `pdfjs-dist` >= 4.2.67 (transitive via `vue-pdf-embed`); render to canvas (which `vue-pdf-embed` does); CSP narrowly adds `worker-src 'self' blob:`, do NOT relax `script-src` globally.
- **File URLs public-by-knowledge (MEDIUM)** — set `protected: true` on the `card` field; generate short-lived tokens at view time, not list time.
- **Dev-login credentials in production bundle (CRITICAL operational)** — Phase 0 cleanup: remove `VITE_LOGIN_*` from `env.d.ts` and all call sites; rotate `local.jsonc` creds; CI grep `src/` for `VITE_LOGIN_`.

Full detail (13 pitfalls + recovery strategies + "Looks Done But Isn't" checklist): `.planning/research/PITFALLS.md`.

## Implications for Roadmap

The user picked **coarse** granularity (3–5 phases, 1–3 plans each). Suggested phase structure follows the architecture build order, groups co-deliverable work, and front-loads the privacy-critical foundation.

### Phase 0 (or first task of Phase 1): Pre-Wallecx Cleanup
**Rationale:** Pitfall 13 is CRITICAL operational and pre-existing. Wallecx multiplies its blast radius (real health data). Cheaper to scrub once before adding sensitive surface than to retrofit.
**Delivers:**
- Remove `VITE_LOGIN_*` from `env.d.ts` and all call sites under `src/`
- Rotate any credentials that ever sat in `local.jsonc`
- CI grep guard against re-introduction
**Avoids:** Pitfall 13 (dev creds in production bundle).
**Note for roadmapper:** Tiny scope. Either a standalone Phase 0 (cleanest) or first plan inside Phase 1.

### Phase 1: Foundations — Schema, Rules, Types, Mapper, Route Shell
**Rationale:** This is the privacy-critical core. Server-side rules are non-negotiable; everything else builds on them. Get the foundation right, smoke-test cross-user isolation, then build UI on top.
**Delivers:**
- `wallecx_vaccinations` PocketBase collection with all 5 rules + `(user, date_administered)` index
- File field with `protected: true`, MIME allowlist (`image/jpeg|png|webp`, `application/pdf`), 10 MB cap, thumbs `100x100` + `400x0`
- Type module + mapper module
- Lazy-loaded `/projects/wallecx` route with `requiresAuth`
- Stub `WallecxApp.vue` that renders `getFullList` results (no edit path yet)
- Two new dependencies installed: `browser-image-compression`, `vue-pdf-embed`
- Two-user smoke test: user A's records invisible to user B
**Uses (from STACK.md):** PocketBase SDK plain-object create, parameterised filter syntax, Zod + `@primevue/forms` (set up but not yet exercised).
**Avoids:** Pitfalls 1, 2, 6, 8, 9 (all foundation-level).
**Roadmapper note:** This is the critical path. Plans here are small but each must land cleanly before the next; consider 2–3 plans (schema + rules; types + mapper + route; auth-isolation smoke test).

### Phase 2: Read Path — List, Detail, Attachment Preview
**Rationale:** "Read works correctly" is a meaningful checkpoint. Read paths are simpler than write paths and prove the type/mapper/auth wiring without the file-upload, EXIF-strip, save-loop complexity.
**Delivers:**
- `VaccinationList.vue` — date-sorted table/cards, emits `view`/`edit`/`remove`
- `AttachmentPreview.vue` — image (`<img>` with `?thumb=400x400`) and PDF (`vue-pdf-embed`, lazy-loaded) branches; uses MIME/extension sniff
- `VaccinationDetail.vue` — read-only panel embedding `AttachmentPreview`
- Empty / loading / error states (`vue-sonner` toasts)
- Watcher with `{ immediate: true }` to avoid empty-state flash
- CSP update: narrow `worker-src 'self' blob:` for `pdfjs-dist`
**Uses:** `vue-pdf-embed`, PrimeVue DataTable + Dialog, `pb.files.getURL` with thumbs.
**Avoids:** Pitfalls 5 (PDF.js XSS — render via canvas, version pinned), 9 (file URLs protected), 12 (watcher-on-mount flash).
**Roadmapper note:** 1–2 plans. Read path can ship without the write path and is independently demoable.

### Phase 3: Write Path — Create / Edit / Delete with Attachments
**Rationale:** All the highest-precedent bugs (3, 4, 7, 11) live in the write path. Concentrating them in one phase lets a single round of QA close them; spreading them across phases risks missed coverage.
**Delivers:**
- `ManageVaccination.vue` — create/edit dialog
  - `zodResolver` form (vaccine_name + date_administered required, dose_number int 1–20, sizes/MIME enforced)
  - Recommended fields included: `manufacturer`, `notes` (plain `<Textarea>`, never `v-html`)
  - PrimeVue `<FileUpload mode="basic" :auto="false" @select>` (avoid `customUpload`)
  - EXIF strip via canvas re-encode + `browser-image-compression` for images; pass-through for PDFs
  - Save state machine: `isSaving` ref disables button + form; mapper returns server record; `Object.assign(item, created)` after first save so re-edits PATCH
- Delete flow: confirm dialog with vaccine name in plain text -> `await pb.collection().delete(id)` -> splice -> toast
- Mapper unit test covering create-then-update sequence (first test in repo)
**Uses:** `browser-image-compression`, `@primevue/forms` `zodResolver`, `dayjs.format('YYYY-MM-DD')`.
**Avoids:** Pitfalls 3 (save loop), 4 (delete-only-local), 7 (EXIF), 8 (file misconfig at upload), 10 (no `v-html` on notes), 11 (double-submit).
**Roadmapper note:** 2 plans (create+edit; delete + mapper test).

### Phase 4: Discovery & Polish
**Rationale:** Once CRUD lands and is in real use, finish the v1 surface and harden. Small, parallelizable items.
**Delivers:**
- Wallecx tile in `ProjectsView.vue` projects directory
- Final visual polish to match navy/amber + Rubik design system
- Route guard test (first test of its kind in the repo)
- "Looks Done But Isn't" checklist run-through (PITFALLS.md "Looks Done But Isn't" section)
- Optional: JSON/CSV "download all my data" button (P2 from FEATURES.md, but cheap and a strong trust signal for a health vault)
**Avoids:** "Surfaced but not discoverable" gap; final regression sweep.
**Roadmapper note:** 1 plan, possibly 2 if "download all my data" is included.

### Phase Ordering Rationale

- **Server-side rules before UI** — every UI decision rests on the assumption that PocketBase enforces ownership. Smoke-test that assumption first.
- **Read before write** — read path exercises types, mapper imports, auth gate, file-URL flow without the write-path bug surface. Failures isolate cleanly.
- **Concentrated write phase** — the four worst repo-precedent bugs (3, 4, 7, 11) all live in create/edit/delete. One phase, one QA pass, all addressed together with `vaccinationMapper.spec.ts` as the regression net.
- **Polish last** — `ProjectsView.vue` tile is the "feature is live" signal. It points at a working feature, not a half-built one.

### Research Flags

**Phases that may need `/gsd-research-phase` during planning:**
- **Phase 2 (Read Path)** — `vue-pdf-embed` integration, lazy-load with Vite, and the narrow CSP update for `worker-src` are the only places where the patterns are not already in the codebase. A short research pass to verify the exact Vite recipe for `pdfjs-dist` worker bundling is worth it.
- **Phase 3 (Write Path)** — EXIF strip via canvas + `browser-image-compression` ordering (which runs first?) and the FormData / mapper-update ordering when a file is replaced vs preserved are subtle. Research a definitive client-side EXIF-stripping snippet and confirm `browser-image-compression`'s EXIF-preserve flag interacts correctly (we want EXIF gone, not preserved).

**Phases that follow standard patterns (skip research-phase):**
- **Phase 0** — text edits and `git grep`. No research.
- **Phase 1** — direct mirror of LexTrack patterns + PocketBase docs already cited in research. No new research needed beyond what's in `STACK.md`/`ARCHITECTURE.md`/`PITFALLS.md`.
- **Phase 4** — pure polish + an existing pattern (the `projects` array). No research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Lexarium stack is locked and observed directly. Net new picks (`browser-image-compression`, `vue-pdf-embed`) verified against npm metadata, GitHub activity, and current PrimeVue/PocketBase documentation. |
| Features | MEDIUM-HIGH | HIGH on FHIR/Apple Health field schemas (authoritative HL7 spec) and on what's table-stakes vs. differentiator. MEDIUM on whether users will actually request family profiles first vs. some other Phase 2 item. |
| Architecture | HIGH | Constrained almost entirely by directly-observed Lexarium conventions in `.planning/codebase/` and the LexTrack reference implementation. No new architectural primitives introduced. |
| Pitfalls | HIGH | All five Critical/High pitfalls are repo-precedent — observed bugs in the existing Lexarium codebase. PDF.js CVE and PocketBase issue #151 verified against official sources. |

**Overall confidence:** HIGH

### Gaps to Address

- **Vite recipe for `pdfjs-dist` worker bundling** — `vue-pdf-embed` documents the standard pattern but our `vite.config.ts` may need a tweak (manual chunks, worker plugin) to keep the `pdfjs-dist` chunk lazy. Resolve during Phase 2 planning via a 10-minute research pass.
- **`browser-image-compression` + EXIF interaction** — the library has a `preserveExif` flag; the canvas re-encode path drops EXIF naturally. Need to confirm the chosen pipeline drops EXIF in all cases (jpeg, png, webp). Resolve during Phase 3 planning with a quick test fixture (photo with known GPS -> upload -> exiftool on stored file).
- **Family-profiles assumption** — FEATURES.md flags this as the #1 likely Phase 2 request. Mitigation: keep `user` relation simple in v1; refactor to "owner OR proxy" only when proxies actually arrive.
- **Test coverage seeding** — the codebase has zero tests today. The plan introduces two (mapper spec, route-guard spec). If these are deferred under time pressure, the regression net for Pitfalls 3/4 is gone. Roadmapper should make these non-optional in Phase 3 / Phase 4 plan acceptance criteria.

## Sources

### Primary (HIGH confidence)
- PocketBase docs — Files handling, API rules, files API (https://pocketbase.io/docs/files-handling/) — file upload semantics, file-field options (mimeTypes, maxSize, thumbs, protected), `?token=`, `?thumb=`
- PocketBase docs — API rules and filters (https://pocketbase.io/docs/api-rules-and-filters/) — `@request.auth.id`, parameterised filter syntax `{:name}`
- PocketBase JS SDK — File upload (https://github.com/pocketbase/js-sdk) — SDK auto-converts File/Blob payloads to multipart
- PocketBase issue #151 — cascade-delete doesn't remove files (https://github.com/pocketbase/pocketbase/issues/151) — basis for single-collection design
- PrimeVue FileUpload docs (https://primevue.org/fileupload) and issue #7664 (https://github.com/primefaces/primevue/issues/7664) — basic-mode + `@select` recommended; avoid `customUpload`
- HL7 FHIR R5/R4 Immunization (https://www.hl7.org/fhir/immunization.html) — standard field schema (basis for v1 field set + "no FHIR adoption" call)
- Codean Labs — CVE-2024-4367 PDF.js arbitrary JS execution (https://codeanlabs.com/blog/research/cve-2024-4367-arbitrary-js-execution-in-pdf-js/) — pin `pdfjs-dist` >= 4.2.67
- vue-pdf-embed npm (https://www.npmjs.com/package/vue-pdf-embed) and GitHub (https://github.com/hrynko/vue-pdf-embed) — chosen PDF renderer
- browser-image-compression npm (https://www.npmjs.com/package/browser-image-compression) — chosen image compressor
- Lexarium internals: `.planning/codebase/STACK.md`, `STRUCTURE.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `INTEGRATIONS.md`, `CONCERNS.md`; `src/components/projects/lextrack/*`, `src/lib/pocketbase/dsuTaskMapper.ts`, `src/router/index.ts`, `src/views/Login.vue`; `.planning/PROJECT.md`

### Secondary (MEDIUM confidence)
- Apple Health, MyChart, CommonHealth, Docket, VaxYes, Vaccy, VaxTrack — surveyed for table-stakes vs differentiator categorization
- npm-compare browser-image-compression vs compressorjs — trade-off rationale
- 2025 Vue PDF library roundup (Vue PDF Viewer blog) — flagged `vue-pdf` (unscoped) as stale
- Multiple 2025 client-side EXIF-strip implementations (exif.tools, SimpleTool) — confirms canvas re-encode drops EXIF

### Tertiary (LOW confidence — needs validation during implementation)
- "Family profiles is the #1 expansion users will request" — competitor-pattern inference; not yet validated against actual Wallecx user behavior
- "OCR is high-cost low-value for v1" — VaxYes is the only major competitor doing it consistently; Tesseract reliability on glossy cards is anecdotal
- "SMART Health Card import is low-value for this audience" — inference based on Wallecx being a personal portfolio mini-app, not an interop product

---
*Research completed: 2026-05-10*
*Ready for roadmap: yes*
