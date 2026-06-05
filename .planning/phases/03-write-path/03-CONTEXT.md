# Phase 3: Write Path (Create / Edit / Delete with Attachments) - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the write layer of Wallecx: a unified create/edit dialog with Zod-validated fields, EXIF-stripped image upload, save-loop-safe mapper, a PrimeVue confirm-service delete flow, and the first unit test in the repo. No new PocketBase collection changes — Phase 1 schema is complete. No design-token sweep or projects directory tile — those are Phase 4.

**In scope:** WRITE-01..09 — ManageVaccination.vue dialog (create+edit), FileUpload with client-side validation, canvas EXIF strip → browser-image-compression, save-loop-safe Object.assign, mapToUpdateVaccination on update, delete confirm → pb.delete() → splice/toast, isSaving guard, parameterised filters, Vitest mapper spec.
**Out of scope:** New PocketBase collections or rules; design token sweep; projects directory tile; route-guard spec (Phase 4); JSON export (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Add Vaccination Button Placement
- **D-01:** "Add vaccination" button lives in the **WallecxApp.vue card header area — top-right**, alongside the "Wallecx" heading. Always visible regardless of whether records exist.
- **D-02:** The **empty state also gets a CTA** — "Add your first vaccination" button — so brand-new users have a clear first action. Header button serves repeat users; empty-state CTA serves first-timers.

### ManageVaccination Dialog Layout
- **D-03:** **Single-column vertical stack** — all 7 fields stacked one per row, full width. Matches LexTrack dialog style (ManageTask, ManageSupport). No 2-column grid.
- **D-04:** Date Administered uses a **PrimeVue DatePicker** (calendar popup), not a plain `<input type="date">`. Already available via auto-import.
- **D-05:** Notes field uses a **small Textarea (~3 rows)**. User can scroll within the textarea for longer content.

### Dialog Mode (Create vs Edit)
- **D-06:** Single `ManageVaccination.vue` component handles both create and edit. Mode is signalled by whether the `record` prop is `null` (create) or a `Vaccinations` object (edit). Dialog header title changes accordingly ("Add Vaccination" vs "Edit Vaccination").

### EXIF Strip Notification
- **D-07:** After an image upload is processed, show a **vue-sonner toast: "Location data removed."** — unobtrusive, auto-dismiss. Toast fires on **every image upload** unconditionally (no conditional GPS check required — simpler implementation, users always know their privacy is protected). PDFs receive no toast.

### Delete Confirmation
- **D-08:** Use **PrimeVue `useConfirm()` + `<ConfirmDialog>`** service. Lightweight overlay with Accept/Reject buttons. `<ConfirmDialog />` added once to WallecxApp.vue template.
- **D-09:** Confirmation message **includes the vaccine name**: `'Delete "${record.vaccine_name}"? This cannot be undone.'` Plain text — no `v-html`.

### Carried Forward from Phase 2
- Detail view is a PrimeVue Dialog/modal (Phase 2 D-01). ManageVaccination reuses the same Dialog pattern.
- VaccinationList DataTable already has Edit/Remove row-action emitters as stubs — Phase 3 wires them (Phase 2 D-03).
- Empty state currently shows "No vaccination records yet." with no CTA (Phase 2 D-06) — Phase 3 upgrades this per D-02 above.

### Claude's Discretion
- Exact dialog width (e.g. `40vw` matching LexTrack or wider for more fields).
- Field order within the single column (vaccine_name first, then date, dose, lot, manufacturer, location, notes — logical grouping).
- Whether `dose_number` is an `InputNumber` (0–9) or a plain `InputText` (implementation detail).
- `isSaving` ref placement — single ref in ManageVaccination.vue covers both create and update branches.
- Exact Vitest mock shape for `pb` in `vaccinationMapper.spec.ts` (vi.mock is fine; the test verifies the mapper strips server-managed fields and that create→update uses the server-returned id).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 3 — Goal, requirements (WRITE-01..09), and success criteria
- `.planning/research/PITFALLS.md` — Pitfalls 2 (filter injection), 3 (save-loop id), 4 (delete local-only), 6 (orphan files on delete), 7 (EXIF GPS leak) are ALL addressed in this phase

### Existing Wallecx Components
- `src/components/projects/wallecx/WallecxApp.vue` — Add `<ConfirmDialog />`, wire `@edit` and `@remove` emits, add "Add vaccination" header button, add empty-state CTA
- `src/components/projects/wallecx/VaccinationList.vue` — Edit/Remove row-action emitters already present as stubs; no changes needed unless empty-state CTA requires coordination
- `src/lib/pocketbase/vaccinationMapper.ts` — `mapToUpdateVaccination` already written; WRITE-05 uses this on every update call

### Codebase Analogs for ManageVaccination
- `src/components/projects/lextrack/ManageTask.vue` — Structural Dialog analog (defineModel visible + record, PrimeVue Dialog, save handler)
- `src/components/Login.vue` — `@primevue/forms` + `zodResolver` pattern — the exact import and Form component usage to replicate

### Types & Mapper
- `src/types/wallecx/vaccinations/types.d.ts` — `Vaccinations extends RecordModel`, `AddVaccination` type; both used in ManageVaccination.vue
- `src/lib/pocketbase/vaccinationMapper.ts` — `mapToUpdateVaccination`; drives WRITE-05 and WRITE-09 test

### Security
- `.planning/research/PITFALLS.md` — Pitfall 7 (EXIF GPS leak): canvas re-encode approach; Pitfall 3 (save-loop): Object.assign contract

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@primevue/forms` + `zodResolver` — already in `package.json` and used in `Login.vue`; import pattern: `import { zodResolver } from "@primevue/forms/resolvers/zod"; import { Form, type FormSubmitEvent } from "@primevue/forms";`
- `browser-image-compression@^2.0.2` — installed (Phase 1 FRONT-01), not yet used; Phase 3 is first consumer
- `useConfirm()` + `<ConfirmDialog>` — PrimeVue auto-imported; `<ConfirmDialog />` needs a single instance in WallecxApp.vue template
- `vue-sonner` `toast` — already used in WallecxApp.vue and VaccinationList.vue; add `toast.info("Location data removed.")` for EXIF

### Established Patterns
- **Dialog pattern:** `defineModel("visible", Boolean)` + `defineModel<T>("record")` — ManageTask.vue and ManageSupport.vue use this exact API; replicate for ManageVaccination.vue
- **Form pattern:** `<Form v-slot="$form" :initialValues :resolver @submit validate-on-submit>` — Login.vue; replicate with Zod schema covering all 7 vaccination fields
- **Fetch pattern:** `onMounted` + `try/catch/finally` + `isLoading` ref + `toast.error` on failure — established in WallecxApp.vue
- **No Pinia:** Local `ref` state only; all CRUD state (records array, selectedRecord, isSaving) lives in WallecxApp.vue or ManageVaccination.vue directly
- **Parameterised filters:** PocketBase `{:param}` syntax required by WRITE-08; login/record queries use this pattern already

### Integration Points
- `WallecxApp.vue` — Wire `@edit="openEdit"` and `@remove="openDelete"` handlers; add `showManage ref<boolean>(false)`, `manageRecord ref<Vaccinations | null>(null)`, `isSaving ref<boolean>(false)` (or pass down); add `<ConfirmDialog />` and `<ManageVaccination>`; update empty-state slot to include CTA
- `src/components/projects/wallecx/` — New file: `ManageVaccination.vue`
- `src/__tests__/` or `src/components/projects/wallecx/__tests__/` — New file: `vaccinationMapper.spec.ts` (WRITE-09)

### Save-Loop Contract (WRITE-04)
- On create: `const created = await pb.collection('wallecx_vaccinations').create(form)` → `Object.assign(localRecord, created)` so local item gains server `id`, `created`, `updated`, and server-renamed `card` filename
- On update: `mapToUpdateVaccination(record)` strips `id`, `created`, `updated`, `user`, `expand` before PATCH; use `pb.collection('wallecx_vaccinations').update(record.id, mapped)`

</code_context>

<specifics>
## Specific Ideas

- `useConfirm()` confirm call: `confirm({ message: \`Delete "${record.vaccine_name}"? This cannot be undone.\`, header: 'Confirm Delete', icon: 'pi pi-exclamation-triangle', acceptClass: 'p-button-danger', accept: () => deleteRecord(record) })`
- Canvas EXIF strip approach: draw the uploaded image onto an off-screen `<canvas>`, call `canvas.toBlob()` to get a new File/Blob with no EXIF metadata, then pass that clean blob to `browser-image-compression`. After completion fire `toast.info("Location data removed.")`
- DatePicker `dateFormat="dd MM yy"` or `"yy-mm-dd"` — store as ISO string matching PocketBase `date_administered` format (YYYY-MM-DD)
- Zod schema should mark `vaccine_name` and `date_administered` as required; all other fields optional

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-write-path*
*Context gathered: 2026-05-11*
