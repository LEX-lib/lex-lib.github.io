# Requirements: Wallecx (Lexarium milestone)

**Defined:** 2026-05-10
**Core Value:** Each authenticated user can save and retrieve their own vaccination records — text fields plus an attached scan/photo of the card — without ever losing access to them.

## v1 Requirements

Requirements for the Wallecx Phase-1 launch (vaccination records). Each maps to a roadmap phase below.

### Pre-Wallecx Cleanup

Hardening that must land before sensitive Wallecx data exists. Surfaced by `.planning/research/PITFALLS.md` (Pitfall 13) and `.planning/codebase/CONCERNS.md`.

- [x] **CLEAN-01**: `VITE_LOGIN_EMAIL` and `VITE_LOGIN_PASSWORD` declarations are removed from `env.d.ts` and from every `import.meta.env.VITE_LOGIN_*` reference under `src/`
- [x] **CLEAN-02**: Any credentials that ever lived in `local.jsonc` or `.env*` files at the repo root are rotated out-of-band (separate from the codebase change)
- [x] **CLEAN-03**: A repo-level grep guard fails if `VITE_LOGIN_` reappears under `src/` (CI script, pre-commit hook, or `npm run lint:secrets` — pick one)

### Backend Foundation (PocketBase)

- [ ] **BACK-01**: A `wallecx_vaccinations` PocketBase collection exists with fields: `user` (relation to `users`, required, unique-per-user-not-required), `vaccine_name` (text, required), `date_administered` (date, required), `dose_number` (number, optional), `lot_number` (text, optional), `location` (text, optional), `manufacturer` (text, optional), `notes` (text, optional), `card` (file, optional, single)
- [ ] **BACK-02**: `card` file field is configured `protected: true`, max 10 MB, MIME allowlist `image/jpeg,image/png,image/webp,application/pdf`, thumbs `100x100` and `400x0`
- [ ] **BACK-03**: All five collection rules are set to enforce per-user access:
  - `listRule`/`viewRule`/`updateRule`/`deleteRule` → `@request.auth.id != "" && user = @request.auth.id`
  - `createRule` → `@request.auth.id != "" && @request.data.user = @request.auth.id`
- [ ] **BACK-04**: A composite index on `(user, date_administered)` exists for the per-user date-sorted list query
- [ ] **BACK-05**: Two-user smoke test confirms user A's records and `card` files are inaccessible to user B (list, view, update, delete, and direct file URL all 403/404)

### Frontend Foundation (Wallecx route + types + mapper)

- [ ] **FRONT-01**: `npm install browser-image-compression@^2.0.2 vue-pdf-embed@^2.1.4` is committed; `pdfjs-dist` (transitive) resolves to ≥ 4.2.67 (CVE-2024-4367 fix)
- [ ] **FRONT-02**: Type module `src/types/wallecx/vaccinations/types.d.ts` exports `interface Vaccinations extends RecordModel` (mirroring all backend fields) and `type AddVaccination = Omit<Vaccinations, 'id' | 'created' | 'updated'>`
- [ ] **FRONT-03**: Mapper module `src/lib/pocketbase/vaccinationMapper.ts` exports `mapToUpdateVaccination(record: Vaccinations)` returning a writable subset (strips `id`, `created`, `updated`, `user`, `card`)
- [ ] **FRONT-04**: A lazy-loaded route `/projects/wallecx` named `wallecx` is registered in `src/router/index.ts` with `meta: { requiresAuth: true }`, pointing to `src/components/projects/wallecx/WallecxApp.vue`
- [ ] **FRONT-05**: `WallecxApp.vue` shell mounts on the route, calls `pb.collection('wallecx_vaccinations').getFullList<Vaccinations>({ sort: '-date_administered' })` on mount, and renders the result count (no UI yet beyond a placeholder)

### Read Path (List + Detail + Attachment Preview)

- [ ] **READ-01**: `VaccinationList.vue` renders the user's vaccination records as a date-sorted list (newest first) showing vaccine name, date administered, dose number (if present), and a thumbnail of the attached card (if present); emits `view`, `edit`, `remove` events for each row
- [ ] **READ-02**: `VaccinationDetail.vue` renders one record with all fields (including `manufacturer`, `notes`) and an embedded attachment preview; `notes` is rendered with `{{ }}` interpolation, never `v-html`
- [ ] **READ-03**: `AttachmentPreview.vue` displays the attached file by branching on MIME type: `image/*` renders an `<img>` tag with `?thumb=400x400`; `application/pdf` lazy-loads `vue-pdf-embed` (via `defineAsyncComponent`) and renders the first page to canvas; falls back to a download link for unknown MIME types
- [ ] **READ-04**: List view and detail view both handle empty / loading / error states with `vue-sonner` toasts on error
- [ ] **READ-05**: The fetch watcher (or `onMounted` call) uses `{ immediate: true }` semantics so the list never flashes "no records" before the first fetch resolves
- [ ] **READ-06**: The CSP meta tag in `index.html` adds `worker-src 'self' blob:` (narrow scope for `pdfjs-dist`); `script-src` is NOT relaxed
- [ ] **READ-07**: Attachment URLs are fetched with a short-lived token (`pb.files.getURL(record, record.card, { token })`) generated *at view time*, not at list time

### Write Path (Create / Edit / Delete with Attachments)

- [ ] **WRITE-01**: `ManageVaccination.vue` provides a PrimeVue dialog form for both create and edit, validated by a Zod schema via `@primevue/forms` `zodResolver` (matching the existing `Login.vue` pattern); required: `vaccine_name`, `date_administered`; `dose_number` is integer 1–20 if present
- [ ] **WRITE-02**: The form uses `<FileUpload mode="basic" :auto="false" @select>` for the `card` attachment (avoids PrimeVue issue #7664). MIME allowlist + size cap mirror the backend; client-side validation rejects mismatches before submit
- [ ] **WRITE-03**: For image uploads, the file passes through a canvas re-encode (`canvas.toBlob('image/jpeg', 0.92)`) which strips EXIF (including GPS), then through `browser-image-compression` to ~1.5 MB; PDFs pass through unchanged. The UI surfaces "Location data has been removed from your photo." after a strip
- [ ] **WRITE-04**: Create flow: `await pb.collection('wallecx_vaccinations').create<Vaccinations>(formData)` → returns the server record → caller does `Object.assign(item, created)` so subsequent saves PATCH the same record (avoids the LexTrack save-loop bug, `LexTrackView.vue:127-165`)
- [ ] **WRITE-05**: Update flow uses `mapToUpdateVaccination(record)` to strip server-managed fields before `pb.collection(...).update(id, payload)`
- [ ] **WRITE-06**: Delete flow: confirm dialog (showing the vaccine name in plain text — never `v-html`) → `await pb.collection(...).delete(id)` → splice from local array → `vue-sonner` success toast. On API failure: do NOT splice; show error toast. Verify the attached file URL returns 404 within 5s
- [ ] **WRITE-07**: A single `isSaving` ref disables the submit button + form during the in-flight request to prevent double-submits
- [ ] **WRITE-08**: Any PocketBase filter strings used by Wallecx (mapper, components) use parameterised syntax (`pb.collection(...).getFirstListItem('user = {:user}', { filter: { user: ... } })`) — never template-literal interpolation
- [ ] **WRITE-09**: A Vitest unit test `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts` covers `mapToUpdateVaccination` (strips correct fields) and the create-then-update id-refresh contract (mocked `pb`). This is the first test in the repo

### Discovery & Polish

- [ ] **POLISH-01**: A Wallecx tile is added to the projects directory (`src/views/ProjectsView.vue` `projects` array) with a navy/amber gradient matching the other mini-apps, linking to `/projects/wallecx`
- [ ] **POLISH-02**: Wallecx UI uses only existing Lexarium design tokens (navy `--color-brand-primary`, amber `--color-brand-accent`, Rubik font, PrimeVue Aura preset). No bespoke colors. No new CSS variables
- [ ] **POLISH-03**: A "Download my vaccination records" button exports the user's full record set as JSON (file URLs included as references, not embedded). UI sits inside the Wallecx app, gated to the authenticated user's own data
- [ ] **POLISH-04**: A Vitest route-guard test `src/router/__tests__/guard.spec.ts` covers the `requiresAuth` redirect behavior on `/projects/wallecx` (unauthenticated → `/login?redirect=/projects/wallecx`)
- [ ] **POLISH-05**: The "Looks Done But Isn't" checklist from `.planning/research/PITFALLS.md` is run through and every item is signed off (cross-user isolation, file-orphan check, save-loop verification, etc.)

## v1.1 Requirements

Requirements for the Vaccine Grouping milestone. Phases continue numbering from v1.0 (last was Phase 4, so v1.1 starts at Phase 5).

### Schema & Types

- [ ] **GROUP-01**: The `wallecx_vaccinations` PocketBase collection gains a `vaccine_type` text field (optional in schema; existing records keep empty string — no data loss)
- [ ] **GROUP-02**: The `Vaccinations` TypeScript interface in `src/types/wallecx/vaccinations/types.d.ts` gains `vaccine_type: string`

### Create / Edit Form

- [ ] **GROUP-03**: User can enter `vaccine_type` (free text) when creating or editing a vaccination record; the field is required — the form blocks submit if empty

### Grouped Card View

- [x] **GROUP-04**: The Wallecx home view displays one card per `vaccine_type` group showing: type name, number of records in the group, most recent `date_administered`, and a thumbnail of the latest card scan (if present) — Validated in Phase 6: Grouped Card View & Group Detail Panel
- [x] **GROUP-05**: Records with an empty `vaccine_type` are grouped under a single "Uncategorized" card — Validated in Phase 6: Grouped Card View & Group Detail Panel
- [x] **GROUP-06**: User can click a vaccine group card to open a detail panel listing all records in that group (vaccine brand/name, date administered, dose number, lot number) — Validated in Phase 6: Grouped Card View & Group Detail Panel
- [x] **GROUP-07**: User can click a record row inside the group detail panel to open the existing full-detail dialog (`VaccinationDetail.vue`) — Validated in Phase 6: Grouped Card View & Group Detail Panel

---

## v1.2 Requirements

Requirements for the Search, Sort & View Toggle milestone. Phases continue numbering from v1.1 (last was Phase 6, so v1.2 starts at Phase 7).

### Search

- [ ] **SEARCH-01**: Typing in the search input filters visible group cards in real-time — a group is shown if its `vaccine_type` contains the query (case-insensitive) OR any record in the group has a `vaccine_name` containing the query; empty query shows all groups
- [ ] **SEARCH-02**: When search yields no matching groups, a distinct "no results" empty state is shown (separate from the zero-records empty state shown when the user has no vaccination records at all)

### Sort

- [ ] **SORT-01**: A sort control offers 4 options — "Type A–Z" (default, matching current behaviour), "Type Z–A", "Name A–Z", "Name Z–A" — where Name sorts groups by their latest record's `vaccine_name`; Uncategorized card is always pinned last regardless of sort direction

### View Toggle

- [ ] **VIEW-01**: A view toggle button switches the card area between a 2-column grid (default) and a compact single-column list; the selected view persists for the browser session (localStorage or sessionStorage)
- [ ] **VIEW-02**: The compact list view reuses `VaccinationGroupCard` without modification — only the grid layout class changes (`grid-cols-1` replaces `grid-cols-1 sm:grid-cols-2`)

---

## v2 Requirements

Deferred to future Wallecx phases. Tracked but not in this roadmap.

### Other Vault Record Types

- **VAULT-01**: Identity documents (passport, driver's license, national ID) with expiry-date awareness
- **VAULT-02**: Medical records other than vaccinations (prescriptions, lab results, insurance)
- **VAULT-03**: Generic record-type abstraction once a real second type lands

### Family / Multi-Person

- **FAMILY-01**: User can add dependent profiles (children, parents) and store records under each
- **FAMILY-02**: Per-profile color/label so records are visually grouped

### Convenience

- **CONV-01**: Client-side filter / search by vaccine name across the user's records
- **CONV-02**: Sort toggle (date asc/desc, name)
- **CONV-03**: Multi-file per record (front + back of card)
- **CONV-04**: Tag/category field
- **CONV-05**: Reminders for upcoming dose due dates (requires notification infra Lexarium does not have)
- **CONV-06**: Share a single record via signed read-only link
- **CONV-07**: Printable PDF summary of all vaccination records

### Smart Capture

- **SMART-01**: OCR auto-fill from card photo
- **SMART-02**: SMART Health Card (QR) import
- **SMART-03**: CDC-schedule-aware "what's due"
- **SMART-04**: Coded vocabularies (CVX / SNOMED) for `vaccine_name`

## Out of Scope

Explicitly excluded for v1. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| FHIR Immunization resource compliance | No interop partner; 30+ fields explode the schema for zero v1 user value (`research/STACK.md`) |
| Calendar view | List + detail covers "save and view" — calendar is bonus visual that doesn't earn its build cost (`PROJECT.md` Out of Scope) |
| Public unauthenticated access | Health data is sensitive; per-user isolation is non-negotiable (`PROJECT.md` Out of Scope) |
| Offline-first / PWA | Online-only matches the rest of Lexarium |
| Multi-language / localization | English only matches the rest of Lexarium |
| OCR auto-fill from card photo | Manual entry acceptable for v1; OCR reliability on glossy cards is anecdotal (`research/FEATURES.md`) |
| Sharing records with other users | Not required for "save and view"; future signed-link feature is in v2 |
| PDF / printable summary export | The attached card scan covers the "show this to a doctor" use case |
| Reminders / notifications | Lexarium has no notification infrastructure; out of scope until that lands |
| Native mobile app | Web SPA only; matches the rest of Lexarium |
| Server-side image processing / virus scanning | Client-side EXIF strip + MIME allowlist + size cap are sufficient for personal use |
| `vue-pdf` (unscoped package) | Stale (last meaningful update June 2021), unmaintained (`research/STACK.md`) |
| `<iframe>` PDF preview | Breaks under `frame-src 'none'` CSP, no zoom control (`research/STACK.md`) |
| `customUpload` PrimeVue mode | PrimeVue issue #7664 (`research/STACK.md`) |
| Quill rich-text for `notes` | Plain text + `{{ }}` is safer (no XSS surface) and sufficient (`research/STACK.md`) |
| New form-validation library (VeeValidate, Yup, Valibot) | Fragments the existing Zod + `@primevue/forms` convention (`research/STACK.md`) |
| Polymorphic vault table from day 1 | Premature generalization; `wallecx_vaccinations` is deliberately specific. Generalize when a real second record type lands (`research/SUMMARY.md`) |

## Traceability

Which phase covers which requirement.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLEAN-01 | Phase 0 | Complete |
| CLEAN-02 | Phase 0 | Complete |
| CLEAN-03 | Phase 0 | Complete |
| BACK-01 | Phase 1 | Pending |
| BACK-02 | Phase 1 | Pending |
| BACK-03 | Phase 1 | Pending |
| BACK-04 | Phase 1 | Pending |
| BACK-05 | Phase 1 | Pending |
| FRONT-01 | Phase 1 | Pending |
| FRONT-02 | Phase 1 | Pending |
| FRONT-03 | Phase 1 | Pending |
| FRONT-04 | Phase 1 | Pending |
| FRONT-05 | Phase 1 | Pending |
| READ-01 | Phase 2 | Pending |
| READ-02 | Phase 2 | Pending |
| READ-03 | Phase 2 | Pending |
| READ-04 | Phase 2 | Pending |
| READ-05 | Phase 2 | Pending |
| READ-06 | Phase 2 | Pending |
| READ-07 | Phase 2 | Pending |
| WRITE-01 | Phase 3 | Pending |
| WRITE-02 | Phase 3 | Pending |
| WRITE-03 | Phase 3 | Pending |
| WRITE-04 | Phase 3 | Pending |
| WRITE-05 | Phase 3 | Pending |
| WRITE-06 | Phase 3 | Pending |
| WRITE-07 | Phase 3 | Pending |
| WRITE-08 | Phase 3 | Pending |
| WRITE-09 | Phase 3 | Pending |
| POLISH-01 | Phase 4 | Pending |
| POLISH-02 | Phase 4 | Pending |
| POLISH-03 | Phase 4 | Pending |
| POLISH-04 | Phase 4 | Pending |
| POLISH-05 | Phase 4 | Pending |
| GROUP-01 | Phase 5 | Complete |
| GROUP-02 | Phase 5 | Complete |
| GROUP-03 | Phase 5 | Complete |
| GROUP-04 | Phase 6 | Pending |
| GROUP-05 | Phase 6 | Pending |
| GROUP-06 | Phase 6 | Pending |
| GROUP-07 | Phase 6 | Pending |
| SEARCH-01 | Phase 7 | Pending |
| SEARCH-02 | Phase 7 | Pending |
| SORT-01 | Phase 7 | Pending |
| VIEW-01 | Phase 8 | Pending |
| VIEW-02 | Phase 8 | Pending |

**Coverage:**
- v1.0 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0 ✓

- v1.1 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0 ✓

- v1.2 requirements: 5 total
- Mapped to phases: 5
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-10*
*Last updated: 2026-05-12 — v1.2 traceability added (SEARCH-01/02 → Phase 7, SORT-01 → Phase 7, VIEW-01/02 → Phase 8)*
