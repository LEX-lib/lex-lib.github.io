# Roadmap: Wallecx (Lexarium milestone)

**Created:** 2026-05-10
**Milestone:** Wallecx — Personal Records Vault, Phase 1 (Vaccination Records)
**Granularity:** coarse (5 phases, 1–3 plans each)
**Mode:** YOLO, parallelization on, balanced models, _auto_chain_active honored from config

## Core Value

Each authenticated user can save and retrieve their own vaccination records — text fields plus an attached scan/photo of the card — without ever losing access to them. Per-user privacy is enforced server-side; the route guard is UX only.

## Phases

- [x] **Phase 0: Pre-Wallecx Cleanup** — Strip dev-login credentials and rotate before sensitive health data exists
- [x] **Phase 1: Backend + Frontend Foundation** — PocketBase collection + rules + types + mapper + route shell, with cross-user isolation verified
- [x] **Phase 2: Read Path (List + Detail + Attachment Preview)** — Date-sorted list, detail view, and image/PDF preview with hardened CSP — completed 2026-05-11
- [x] **Phase 3: Write Path (Create / Edit / Delete with Attachments)** — Zod-validated dialog, EXIF-stripped image upload, save-loop-safe mapper, confirmed delete, first repo unit test — completed 2026-05-12
- [x] **Phase 4: Discovery & Polish** — Projects directory tile, design-token sweep, JSON export, route-guard test, and "Looks Done But Isn't" checklist sign-off — completed 2026-05-12

---

## Milestone v1.1 — Vaccine Grouping

**Milestone goal:** Reorganize the Wallecx view from a flat date-sorted list into vaccine-type group cards so users can instantly find all records for a specific vaccine category.

- [x] **Phase 5: Schema, Types & Form Field** — Add vaccine_type to the PocketBase collection, TypeScript interface, and the create/edit form — completed 2026-05-12
- [x] **Phase 6: Grouped Card View & Group Detail Panel** — Replace the flat list with grouped cards and a drilldown panel that opens the existing detail dialog — completed 2026-05-12

---

## Milestone v1.2 — Search, Sort & View Toggle

**Milestone goal:** Add a persistent toolbar above the Wallecx grouped card view so users can filter groups by vaccine name/type, sort them, and switch between grid and list layouts — all via pure client-side computed/ref changes with no new PocketBase queries.

- [x] **Phase 7: Toolbar — Search & Sort** — WallecxToolbar component with search input and sort control; groupedVaccinations computed extended with filter and sort logic; "no results" empty state — completed 2026-05-13
- [x] **Phase 8: View Toggle** — View toggle button added to the toolbar; layout class switches between 2-column grid and single-column list; selection persists for the browser session — completed 2026-05-13
- [x] **Phase 9: Restore Edit & Delete in Grouped View** — Wire edit/delete actions back into VaccinationGroupPanel.vue rows; existing WallecxApp.vue handlers reconnected via emits — completed 2026-05-13

---

## Phase Details

### Phase 0: Pre-Wallecx Cleanup

**Goal**: Remove dev-login credential plumbing from the codebase before any sensitive Wallecx surface exists, so the production bundle no longer carries shipped creds and a regression guard prevents reintroduction.

**Depends on**: Nothing (first phase)

**Requirements**:
- CLEAN-01 — Remove `VITE_LOGIN_EMAIL` / `VITE_LOGIN_PASSWORD` from `env.d.ts` and every call site under `src/`
- CLEAN-02 — Rotate any credentials that ever sat in `local.jsonc` / `.env*` (out-of-band)
- CLEAN-03 — Repo-level grep guard fails if `VITE_LOGIN_` reappears under `src/`

**Success Criteria** (what must be TRUE):
1. `git grep VITE_LOGIN_ src/` and `grep -r VITE_LOGIN dist/` (after a fresh `npm run build`) both return zero matches.
2. The login flow still works using `.env.local` or runtime user input — no functionality regression on `/login`.
3. Reintroducing `VITE_LOGIN_` under `src/` causes the configured guard (CI / pre-commit / `npm run lint:secrets`) to fail with a human-readable message.
4. The credentials previously stored in `local.jsonc` are confirmed rotated by the user out-of-band (separate from the code change).

**Plans**: 2 plans

Plans:
- [x] 00-01-PLAN.md — Remove VITE_LOGIN_ declarations from env.d.ts and add lint:secrets npm script (CLEAN-01, CLEAN-03)
- [x] 00-02-PLAN.md — Human confirmation of out-of-band credential rotation (CLEAN-02)

---

### Phase 1: Backend + Frontend Foundation

**Goal**: Establish the privacy-critical backend (collection, per-user rules, file-field config, index) and the frontend skeleton (deps, types, mapper, lazy route, shell) so that Wallecx is reachable, type-safe, and provably isolated per user before any user-facing UI is built on top.

**Depends on**: Phase 0

**Requirements**:
- BACK-01 — `wallecx_vaccinations` collection with the locked field set (`user`, `vaccine_name`, `date_administered`, `dose_number`, `lot_number`, `location`, `manufacturer`, `notes`, `card`)
- BACK-02 — `card` file field: `protected: true`, 10 MB cap, MIME allowlist, thumbs `100x100` + `400x0`
- BACK-03 — All five collection rules enforce per-user access (list/view/update/delete and create variant)
- BACK-04 — Composite index on `(user, date_administered)` for the date-sorted list query
- BACK-05 — Two-user smoke test confirms cross-user isolation on records and direct file URLs
- FRONT-01 — `browser-image-compression@^2.0.2` and `vue-pdf-embed@^2.1.4` installed; `pdfjs-dist` resolves ≥ 4.2.67
- FRONT-02 — Type module `src/types/wallecx/vaccinations/types.d.ts` exports `Vaccinations extends RecordModel` and `AddVaccination`
- FRONT-03 — Mapper module `src/lib/pocketbase/vaccinationMapper.ts` exports `mapToUpdateVaccination`
- FRONT-04 — Lazy-loaded route `/projects/wallecx` (`name: 'wallecx'`, `requiresAuth: true`)
- FRONT-05 — `WallecxApp.vue` shell mounts, fetches via `getFullList`, renders the result count

**Success Criteria** (what must be TRUE):
1. User A's records are not visible to user B in either the list view or via direct file URL — verified by a documented two-user smoke test (list, view, update, delete, and `?token=`-less file URL all 403/404 for B).
2. Navigating an authenticated session to `/projects/wallecx` renders the shell and displays the user's record count fetched from PocketBase, sorted newest-first by `date_administered`.
3. Navigating an unauthenticated session to `/projects/wallecx` redirects to `/login?redirect=/projects/wallecx` via the existing router guard.
4. `npm run build` succeeds with the two new dependencies installed; the produced `package-lock.json` resolves `pdfjs-dist` to a version ≥ 4.2.67.
5. The collection is queryable by `(user, date_administered DESC)` against the new composite index (verified via PocketBase admin or query plan).

**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Create wallecx_vaccinations collection: all 9 fields, card file config, 5 rules, composite index (BACK-01, BACK-02, BACK-03, BACK-04)
- [x] 01-02-PLAN.md — Two-user smoke test: verify per-user isolation on list, view, update, delete, and file URL (BACK-05)
- [x] 01-03-PLAN.md — Frontend foundation: npm install deps, types module, mapper, lazy route, WallecxApp.vue shell (FRONT-01, FRONT-02, FRONT-03, FRONT-04, FRONT-05)

---

### Phase 2: Read Path (List + Detail + Attachment Preview)

**Goal**: User can view their own vaccination records as a sorted list and drill into a detail view that safely previews the attached image or PDF, with no empty-state flash, no template-literal filter strings, and no broadening of the script-execution CSP.

**Depends on**: Phase 1

**Requirements**:
- READ-01 — `VaccinationList.vue` renders date-sorted rows showing vaccine name, date, dose, and a card thumbnail; emits `view`/`edit`/`remove`
- READ-02 — `VaccinationDetail.vue` renders all fields and the attachment preview; `notes` rendered with `{{ }}`, never `v-html`
- READ-03 — `AttachmentPreview.vue` branches on MIME: image → `<img>` with `?thumb=400x400`; PDF → lazy-loaded `vue-pdf-embed` to canvas; unknown → download link
- READ-04 — Empty / loading / error states are handled with `vue-sonner` toasts on error
- READ-05 — Fetch uses `{ immediate: true }` semantics so the list never flashes "no records"
- READ-06 — CSP meta tag adds `worker-src 'self' blob:` narrowly (no relaxation of `script-src`)
- READ-07 — Attachment URLs use a short-lived token generated at view time, not list time

**Success Criteria** (what must be TRUE):
1. User opens `/projects/wallecx` with existing records and immediately sees a date-sorted list (newest first) with name, date, dose, and a thumbnail when a card is attached — no empty-state flash before data arrives.
2. User clicks a row and sees a detail view with all fields and an inline preview: images render via the PocketBase thumb URL, PDFs render to a canvas via the lazy-loaded `vue-pdf-embed`, unknown MIMEs surface a download link.
3. Opening a record's file URL in an incognito tab without a token returns 403; the SPA's preview works because tokens are minted at view time and expire.
4. A simulated network error surfaces a `vue-sonner` error toast and leaves the list in a consistent state (no half-rendered UI).
5. `git grep "v-html" src/components/projects/wallecx` returns zero hits, and the CSP in `index.html` adds only `worker-src 'self' blob:` (script-src is unchanged).

**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — AttachmentPreview.vue (MIME-branched file preview, defineAsyncComponent VuePdfEmbed, Suspense) + index.html CSP (READ-03) — READ-06 dropped (CSP incompatible with pdfjs)
- [x] 02-02-PLAN.md — VaccinationList.vue (DataTable with skeleton/empty/data states, striped-rows, thumbnail + placeholder icon, view/edit/remove emits) (READ-01, READ-04, READ-05)
- [x] 02-03-PLAN.md — VaccinationDetail.vue (read-only field grid, DD MMMM YYYY date, notes mustache-only, Divider, embedded AttachmentPreview) (READ-02)
- [x] 02-04-PLAN.md — WallecxApp.vue wiring (listToken + fileToken refs, openDetail function, VaccinationList + Dialog + VaccinationDetail in template, graceful token failure) (READ-04, READ-05, READ-07)

---

### Phase 3: Write Path (Create / Edit / Delete with Attachments)

**Goal**: User can create, edit, and delete vaccination records — including attachments — without producing duplicate records, orphan files, EXIF GPS leaks, or `v-html` injection vectors. The first regression test in the repo locks down the mapper contract.

**Depends on**: Phase 2

**Requirements**:
- WRITE-01 — `ManageVaccination.vue` PrimeVue dialog form for create+edit, validated by Zod via `@primevue/forms` `zodResolver`
- WRITE-02 — `<FileUpload mode="basic" :auto="false" @select>` for `card`; client-side MIME + size validation mirrors backend
- WRITE-03 — Image uploads pass through canvas re-encode (EXIF strip) → `browser-image-compression`; PDFs pass through; UI surfaces the location-data-removed message
- WRITE-04 — Create flow returns the server record and `Object.assign`s into the local item so re-saves PATCH (avoids LexTrack save-loop bug)
- WRITE-05 — Update flow uses `mapToUpdateVaccination` to strip server-managed fields before `update`
- WRITE-06 — Delete flow: confirm dialog (plain text, never `v-html`) → `await pb.delete()` → splice → success toast; failure → no splice + error toast; file URL 404s within 5s
- WRITE-07 — Single `isSaving` ref disables form + submit during in-flight requests
- WRITE-08 — All Wallecx PocketBase filter strings use parameterised `{:name}` syntax — no template-literal interpolation
- WRITE-09 — Vitest `vaccinationMapper.spec.ts` covers `mapToUpdateVaccination` and the create-then-update id-refresh contract (first test in the repo)

**Success Criteria** (what must be TRUE):
1. User adds a vaccination via the dialog, edits it once, and saves again — exactly one record exists on the server (no duplicate from a stale id).
2. User uploads a phone photo with known GPS EXIF; the stored file has no GPS metadata (verifiable with `exiftool`), is ≤ ~1.5 MB, and the UI confirms location data was removed.
3. User clicks delete, confirms, and the record is gone from both the list and PocketBase; the previously-attached file URL returns 404 within 5 seconds. On a simulated API failure, the row stays visible and an error toast appears.
4. Submitting the form during a slow network only fires one create/update request even when the user double-clicks (form + button disabled by `isSaving`).
5. `npm run test:unit` runs `vaccinationMapper.spec.ts` and passes — covering both the field-stripping behavior and the create-then-update sequence with a mocked `pb`.

**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md — Vitest vaccinationMapper.spec.ts: field-strip + id-refresh contract tests (first repo test) (WRITE-09)
- [x] 03-02-PLAN.md — ManageVaccination.vue shell: Dialog, Form + zodResolver, all 7 fields, FileUpload MIME/size validation, isSaving guard (WRITE-01, WRITE-02, WRITE-07)
- [x] 03-03-PLAN.md — ManageVaccination.vue EXIF strip pipeline + onSubmit: canvas re-encode, imageCompression, create Object.assign, update with mapper (WRITE-03, WRITE-04, WRITE-05)
- [x] 03-04-PLAN.md — WallecxApp.vue wiring + VaccinationList.vue enable: header button, empty-state CTA, edit/remove handlers, ConfirmDialog delete flow (WRITE-06, WRITE-07, WRITE-08)

**UI hint**: yes

---

### Phase 4: Discovery & Polish

**Goal**: Wallecx is discoverable from the projects directory, visually consistent with Lexarium's design system, exportable by the user, and verified end-to-end against the privacy/security checklist before the milestone is called done.

**Depends on**: Phase 3

**Requirements**:
- POLISH-01 — Wallecx tile in `src/views/ProjectsView.vue` `projects` array, navy/amber gradient, links to `/projects/wallecx`
- POLISH-02 — UI uses only existing Lexarium design tokens (navy `--color-brand-primary`, amber `--color-brand-accent`, Rubik, PrimeVue Aura preset); no bespoke colors or new CSS variables
- POLISH-03 — "Download my vaccination records" button exports the user's full record set as JSON (file URLs as references, not embedded)
- POLISH-04 — Vitest `src/router/__tests__/guard.spec.ts` covers the `requiresAuth` redirect on `/projects/wallecx`
- POLISH-05 — "Looks Done But Isn't" checklist from `research/PITFALLS.md` is run through and every item is signed off

**Success Criteria** (what must be TRUE):
1. The projects directory page shows a Wallecx tile in the existing navy/amber visual language, and clicking it navigates an authenticated user to a working `/projects/wallecx` (and an unauthenticated user to `/login?redirect=...`).
2. A visual review confirms Wallecx uses only existing Lexarium design tokens (no new CSS variables, no bespoke colors), with Rubik typography and the Aura preset throughout.
3. User clicks "Download my vaccination records" and receives a JSON file containing every record they own — and only records they own — with attachment URLs included as references rather than embedded binaries.
4. `npm run test:unit` runs `guard.spec.ts` covering the `/projects/wallecx` redirect on unauthenticated access; the test passes alongside the Phase 3 mapper test.
5. Every item in `research/PITFALLS.md`'s "Looks Done But Isn't" checklist (cross-user isolation, file-orphan check, save-loop verification, EXIF strip, PDF.js version pin, no `v-html`, no template-literal filters, save-button disable, `VITE_LOGIN_*` absence, route guard, mapper test, etc.) is signed off in writing.

**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md — Code review fixes: HIGH-01/02 (ManageVaccination.vue null assertion + stale pendingFile), WR-01/02/03 (WallecxApp.vue listToken interval, VaccinationList.vue thumbUrl guard, openDetail abort), MEDIUM-03 (date-sorted onCreated), SpeedInsights gate (code quality fixes supporting POLISH-02 and POLISH-05)
- [x] 04-02-PLAN.md — Wallecx tile in ProjectsView.vue + design token audit + 04-CHECKLIST.md foundation (POLISH-01, POLISH-02)
- [x] 04-03-PLAN.md — JSON export button in WallecxApp.vue: exportJson() + isExporting guard + Download records Button (POLISH-03)
- [x] 04-04-PLAN.md — Route guard Vitest spec + POLISH-05 checklist final sign-off (POLISH-04, POLISH-05)

**UI hint**: yes

---

### Phase 5: Schema, Types & Form Field

**Goal**: The vaccination record carries a vaccine_type field end-to-end — from PocketBase collection through the TypeScript interface to the create/edit form — so every new and edited record has a categorizable type before the grouped view is built.

**Depends on**: Phase 4

**Requirements**:
- GROUP-01 — `wallecx_vaccinations` PocketBase collection gains a `vaccine_type` text field (optional in schema; existing records keep empty string — no data loss)
- GROUP-02 — `Vaccinations` TypeScript interface in `src/types/wallecx/vaccinations/types.d.ts` gains `vaccine_type: string`
- GROUP-03 — User can enter `vaccine_type` (free text) when creating or editing a vaccination record; the field is required — the form blocks submit if empty

**Success Criteria** (what must be TRUE):
1. The `wallecx_vaccinations` PocketBase collection has a `vaccine_type` text field visible in the admin UI; existing records show an empty string and are not deleted or corrupted.
2. `npm run type-check` passes with `vaccine_type: string` on the `Vaccinations` interface; the `AddVaccination` type includes the field as required.
3. User opens the create dialog and sees a "Vaccine Type" text input; submitting the form without filling it in surfaces a validation error and blocks submission.
4. User fills in all fields including Vaccine Type, saves, and the new record appears with the entered `vaccine_type` value retrievable from PocketBase.
5. User edits an existing record, changes the `vaccine_type` value, saves, and the updated value is persisted to PocketBase without touching other fields.

**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — TypeScript interface + ManageVaccination.vue form field (GROUP-02, GROUP-03)
- [x] 05-02-PLAN.md — PocketBase schema step + end-to-end verification (GROUP-01)

---

### Phase 6: Grouped Card View & Group Detail Panel

**Goal**: Users see their vaccination records organized as one card per vaccine type — with dose count, last administered date, and thumbnail — and can click into a group to see individual records, then open the existing detail dialog for any record.

**Depends on**: Phase 5

**Requirements**:
- GROUP-04 — Wallecx home view displays one card per `vaccine_type` group showing: type name, number of records in the group, most recent `date_administered`, and a thumbnail of the latest card scan (if present)
- GROUP-05 — Records with an empty `vaccine_type` are grouped under a single "Uncategorized" card
- GROUP-06 — User can click a vaccine group card to open a detail panel listing all records in that group (vaccine brand/name, date administered, dose number, lot number)
- GROUP-07 — User can click a record row inside the group detail panel to open the existing full-detail dialog (`VaccinationDetail.vue`)

**Success Criteria** (what must be TRUE):
1. User navigates to `/projects/wallecx` and sees group cards instead of the flat DataTable; each card shows the vaccine type name, number of records, the most recent administration date, and a thumbnail of the latest card scan if one exists.
2. A user whose records include entries with no `vaccine_type` sees a single "Uncategorized" card grouping all those records alongside their typed group cards.
3. User clicks any group card and a panel opens listing every record in that group with vaccine name, date administered, dose number, and lot number visible per row.
4. User clicks a record row in the group panel and the existing `VaccinationDetail.vue` dialog opens showing the full record — all fields and the attachment preview — without any changes to that dialog's own behavior.
5. An empty state is visible (no group cards shown, or a friendly message) when the user has no vaccination records at all.

**Plans**: 2 plans

Plans:
- [ ] 06-01-PLAN.md — VaccinationGroupCard.vue + groupedVaccinations computed + card grid in WallecxApp.vue (GROUP-04, GROUP-05)
- [ ] 06-02-PLAN.md — VaccinationGroupPanel.vue + Drawer wiring in WallecxApp.vue (GROUP-06, GROUP-07)

**UI hint**: yes

---

### Phase 7: Toolbar — Search & Sort

**Goal**: Users can instantly narrow and re-order the grouped card view by typing a search query or choosing a sort option — all filtered and sorted in real-time via computed refs with no additional PocketBase queries.

**Depends on**: Phase 6

**Requirements**:
- SEARCH-01 — Typing in the search input filters visible group cards in real-time (case-insensitive); a group is shown if its `vaccine_type` contains the query OR any record in the group has a `vaccine_name` containing the query; empty query shows all groups
- SEARCH-02 — When search yields no matching groups, a distinct "no results" empty state is shown (separate from the zero-records empty state)
- SORT-01 — Sort control offers 4 options — "Type A–Z" (default), "Type Z–A", "Name A–Z", "Name Z–A"; Uncategorized card is always pinned last regardless of sort direction

**Success Criteria** (what must be TRUE):
1. User types a partial vaccine name (e.g. "flu") into the search input and the card grid updates in real-time to show only groups where the `vaccine_type` matches or at least one record's `vaccine_name` matches — the search is case-insensitive.
2. User clears the search input and all groups reappear immediately with no page reload or PocketBase re-fetch.
3. User searches for a string that matches no group and sees a distinct empty state message (visually different from the zero-records state shown on a fresh account).
4. User selects "Name A–Z" from the sort control and groups are re-ordered by their latest record's `vaccine_name` alphabetically; selecting "Type Z–A" reverses the type-name order. The "Uncategorized" group remains pinned last in all four sort modes.
5. Search and sort compose correctly: filtering while a non-default sort is active produces a filtered-and-sorted result, not a reset to default order.

**Plans**: 2 plans

Plans:
- [x] 07-01-PLAN.md — WallecxToolbar.vue new component: search input (IconField + InputIcon + inline clear) + sort Select dropdown; v-model:searchQuery + v-model:sortMode (SEARCH-01, SORT-01)
- [x] 07-02-PLAN.md — WallecxApp.vue extensions: searchQuery + sortMode refs, displayedGroups computed (filter + sort + Uncategorized pin), toolbar wiring, no-results empty state branch (SEARCH-01, SEARCH-02, SORT-01)

**UI hint**: yes

---

### Phase 8: View Toggle

**Goal**: Users can switch the grouped card view between a 2-column grid and a compact single-column list, and that preference is remembered for the remainder of their browser session without any additional data fetching or component changes.

**Depends on**: Phase 7

**Requirements**:
- VIEW-01 — A view toggle button switches the card area between a 2-column grid (default) and a compact single-column list; the selected view persists for the browser session (localStorage or sessionStorage)
- VIEW-02 — The compact list view reuses `VaccinationGroupCard` without modification — only the grid layout class changes (`grid-cols-1` replaces `grid-cols-1 sm:grid-cols-2`)

**Success Criteria** (what must be TRUE):
1. User clicks the view toggle and the card area switches from the 2-column grid to a single-column list; clicking again switches back — `VaccinationGroupCard` renders identically in both layouts with no visual regressions.
2. User switches to list view, navigates away to another route, and returns to `/projects/wallecx` — the list view is still active (preference persisted via sessionStorage).
3. A fresh session (new tab or after closing and reopening the browser) always opens in the default 2-column grid view.
4. Switching view mode while a search filter or non-default sort is active preserves both the filter and the sort — only the layout class changes.

**Plans**: 2 plans

Plans:
- [x] 08-01-PLAN.md — Extend WallecxToolbar.vue with viewMode v-model, showToggle prop, and cycling-toggle Button (VIEW-01)
- [x] 08-02-PLAN.md — Extend WallecxApp.vue with viewMode ref, sessionStorage hydrate/persist, gridClass computed, toolbar wiring (VIEW-01, VIEW-02)

**UI hint**: yes

---

### Phase 9: Restore Edit & Delete in Grouped View

**Goal**: Users can edit or delete an individual vaccination record directly from the group detail drawer, restoring the CRUD capability that was present in Phase 3 but lost when Phase 6 replaced the flat list with grouped cards.

**Depends on**: Phase 8

**Requirements**:
- CRUD-01 — Each record row in `VaccinationGroupPanel.vue` has Edit and Delete action buttons; clicking Edit opens `ManageVaccination.vue` pre-populated with that record; clicking Delete triggers the existing `openDelete` confirm flow
- CRUD-02 — `WallecxApp.vue`'s existing `openManage(record)` and `openDelete(record)` handlers are wired up via emits through `VaccinationGroupPanel.vue` — no new backend logic

**Success Criteria** (what must be TRUE):
1. User opens a vaccine group drawer, clicks Edit on a record row, and the ManageVaccination dialog opens pre-filled with that record's data — saving it updates the record in place.
2. User opens a vaccine group drawer, clicks Delete on a record row, sees the confirmation dialog, confirms, and the record is removed from both the panel and the card grid.
3. No regression: the "Add vaccination" button, search, sort, and view toggle all continue to work normally.

**Plans**: 1 plan

Plans:
- [x] 09-01-PLAN.md — Restore edit & delete emits in VaccinationGroupPanel.vue and wire @edit/@delete in WallecxApp.vue (CRUD-01, CRUD-02)

**UI hint**: yes

---

## Coverage

### v1.0 Coverage

All 34 v1 requirements are mapped to exactly one phase. No orphans.

| Phase | Requirements | Count |
|-------|--------------|-------|
| Phase 0 | CLEAN-01, CLEAN-02, CLEAN-03 | 3 |
| Phase 1 | BACK-01, BACK-02, BACK-03, BACK-04, BACK-05, FRONT-01, FRONT-02, FRONT-03, FRONT-04, FRONT-05 | 10 |
| Phase 2 | READ-01, READ-02, READ-03, READ-04, READ-05, READ-06, READ-07 | 7 |
| Phase 3 | WRITE-01, WRITE-02, WRITE-03, WRITE-04, WRITE-05, WRITE-06, WRITE-07, WRITE-08, WRITE-09 | 9 |
| Phase 4 | POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05 | 5 |
| **Total** | | **34 / 34** |

### v1.1 Coverage

All 7 v1.1 requirements are mapped to exactly one phase. No orphans.

| Phase | Requirements | Count |
|-------|--------------|-------|
| Phase 5 | GROUP-01, GROUP-02, GROUP-03 | 3 |
| Phase 6 | GROUP-04, GROUP-05, GROUP-06, GROUP-07 | 4 |
| **Total** | | **7 / 7** |

### v1.2 Coverage

All 5 v1.2 requirements are mapped to exactly one phase. No orphans.

| Phase | Requirements | Count |
|-------|--------------|-------|
| Phase 7 | SEARCH-01, SEARCH-02, SORT-01 | 3 |
| Phase 8 | VIEW-01, VIEW-02 | 2 |
| **Total** | | **5 / 5** |

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Pre-Wallecx Cleanup | 2/2 | Complete | 2026-05-10 |
| 1. Backend + Frontend Foundation | 3/3 | Complete | 2026-05-11 |
| 2. Read Path | 4/4 | Complete | 2026-05-11 |
| 3. Write Path | 4/4 | Complete | 2026-05-12 |
| 4. Discovery & Polish | 4/4 | Complete | 2026-05-12 |
| 5. Schema, Types & Form Field | 2/2 | Complete | 2026-05-12 |
| 6. Grouped Card View & Group Detail Panel | 2/2 | Complete | 2026-05-12 |
| 7. Toolbar — Search & Sort | 2/2 | Complete | 2026-05-13 |
| 8. View Toggle | 2/2 | Complete | 2026-05-13 |
| 9. Restore Edit & Delete in Grouped View | 1/1 | Complete | 2026-05-13 |

---
*Roadmap created: 2026-05-10*
*Last updated: 2026-05-13 — Phase 9 complete: CRUD-01, CRUD-02 verified; stale-Drawer WR-01/WR-02 fixed*
