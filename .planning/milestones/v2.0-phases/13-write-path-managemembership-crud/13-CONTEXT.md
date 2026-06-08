# Phase 13: Write Path — ManageMembership CRUD - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the write layer for membership cards: `ManageMembership.vue` create/edit dialog (direct `v-model` refs — NOT `@primevue/forms` due to PrimeVue issue #8135), Zod validation, `ColorPicker`, barcode type Select with conditional `barcode_value` field, optional `card_image` FileUpload with edit-mode thumbnail preview, save-loop-safe create/update flows via `mapToUpdateMembership`, `MembershipDetail.vue` extended with Edit/Delete action buttons, `ConfirmDialog` delete flow, and `membershipMapper.spec.ts`. `MembershipsTab.vue` extended to own all write state and wire all CRUD handlers.

**In scope:** MWRITE-01..06 — ManageMembership.vue dialog, Zod schema, ColorPicker, barcode type dropdown + conditional barcode_value, card_image upload with edit-mode thumbnail, create Object.assign contract, update mapToUpdateMembership, delete confirm flow, isSaving guard, MembershipDetail edit/delete emits, MembershipsTab CRUD state extension, membershipMapper.spec.ts.
**Out of scope:** New PocketBase schema changes (Phase 11 collection is complete); toolbar/search/sort for memberships; export; new routes.

</domain>

<decisions>
## Implementation Decisions

### ColorPicker
- **D-01:** `ColorPicker` pre-filled with `002244` (navy, no `#`) for new cards. `card_color` ref initialises to `'002244'` when creating. No clear button — colour is always set to something; user can pick navy explicitly if they want the default.

### Barcode Field Visibility
- **D-02:** `barcode_value` field uses `v-if` and disappears entirely when `barcode_type === 'number'` (not disabled/greyed — hidden). When the user switches to 'Number only', `barcode_value` ref is cleared immediately (set to `''`).

### Edit Mode — Card Image Handling
- **D-03:** When editing a card with an existing `card_image`, show a thumbnail preview (`?thumb=100x100` + token) above the FileUpload button; button label changes to 'Replace image'. No 'Remove image' option — replacement only. If no new file is selected on save, `card_image` is not included in the FormData (existing image stays unchanged).

### Edit and Delete Trigger Location
- **D-04:** Edit and Delete buttons live inside the `MembershipDetail` dialog (in the dialog footer or as action buttons at the bottom of the detail content). `MembershipDetail.vue` emits `edit` and `delete` events to `MembershipsTab.vue`.
- **D-05:** `MembershipsTab.vue` handles state transitions:
  - `@edit` handler: close detail (`showDetail = false`), set `manageRecord = selectedRecord`, open manage dialog (`showManage = true`)
  - `@delete` handler: call `useConfirm()` confirm flow with card name in message; on accept, `await pb.delete()` → splice from `records` → success toast; on failure no splice + error toast
- **D-06:** `<ConfirmDialog />` added once to `MembershipsTab.vue` template (same pattern as `VaccinationsTab.vue`).

### Carried Forward from Phase 3 / Phase 11 Pattern
- **D-07:** Direct `v-model` refs for all form fields — NOT `@primevue/forms`. Zod schema applied manually via `schema.safeParse(formValues)` on submit. Locked by STATE.md due to PrimeVue issue #8135 (ColorPicker ignores initial values inside `<Form>`).
- **D-08:** Single `isSaving` ref disables form + submit button during in-flight requests; Dialog `:closable="!isSaving"`.
- **D-09:** Create flow: `Object.assign(localRecord, serverResponse)` after `pb.create()` — ensures local item has server `id`, `created`, `updated`, and authoritative `card_image` filename. Avoids save-loop bug.
- **D-10:** Update flow: `mapToUpdateMembership(record)` strips `id`, `created`, `updated`, `user`, `card_image` from payload; FormData carries only explicitly set writable fields.
- **D-11:** Delete confirmation message includes card name: `Delete "${record.card_name}"? This cannot be undone.` Plain text — never `v-html`.
- **D-12:** Single `ManageMembership.vue` handles both create and edit — null `record` prop = create mode, `Memberships` object = edit mode. Dialog header: "Add Card" vs "Edit Card".

### Mapper Spec
- **D-13:** `membershipMapper.spec.ts` goes in `src/lib/pocketbase/__tests__/` — mirrors `vaccinationMapper.spec.ts` location and structure. Tests: (a) `mapToUpdateMembership` strips `id`, `created`, `updated`, `user`, `card_image`; (b) create-then-update id-refresh contract with mocked `pb`.

### Claude's Discretion
- Exact dialog width (`40vw` matching ManageVaccination.vue is the natural default)
- Field order in the form: `card_name` (required) → `barcode_type` dropdown → `barcode_value` (conditional) → `card_number` → `card_color` ColorPicker → `expiry_date` DatePicker → `issuer` → `notes` Textarea → `card_image` FileUpload
- Zod schema: `card_name` required min-1; `card_color` `z.string().regex(/^[0-9a-fA-F]{6}$/).optional()`; `barcode_value` optional when present; `expiry_date` as date/string optional
- Whether `MembershipDetail.vue` shows Edit/Delete as a footer row (PrimeVue Dialog footer slot) or inline at the bottom of the content — footer slot is cleaner
- `pendingFile` ref reset: explicit reset in the success branch (`pendingFile.value = null`) before `visible.value = false` — mirrors the HIGH-02 fix from Phase 3 review

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 13 — Goal, requirements (MWRITE-01..06), and success criteria
- `.planning/STATE.md` §Key Decisions (v2.0) — Locked decisions: direct v-model refs, card_color without hash, iOS overlay, ColorPicker PrimeVue issue #8135
- `.planning/STATE.md` §Risk Register (v2.0) — ColorPicker emit format risk, JsBarcode try/catch

### Direct Structural Analogs
- `src/components/projects/wallecx/ManageVaccination.vue` — Direct analog for ManageMembership.vue: defineModel pattern, onFileSelect, onSubmit, isSaving, pendingFile, Dialog + Form structure
- `src/components/projects/wallecx/VaccinationsTab.vue` — Full CRUD state reference: openManage, openDelete, useConfirm, ConfirmDialog, showManage, manageRecord, @created/@updated handlers, unshift/splice pattern
- `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts` — Template for membershipMapper.spec.ts (field-strip test + id-refresh contract with mocked pb)

### Files Modified in This Phase
- `src/components/projects/wallecx/MembershipsTab.vue` — Extended with all write state (showManage, manageRecord, useConfirm, ConfirmDialog, openEdit, openDelete, @created/@updated handlers); "Add card" buttons enabled and wired
- `src/components/projects/wallecx/MembershipDetail.vue` — Extended with Edit/Delete action buttons emitting `edit` and `delete` events

### Types and Mapper
- `src/types/wallecx/memberships/types.d.ts` — `Memberships extends RecordModel`, `AddMembership` type — used throughout ManageMembership.vue
- `src/lib/pocketbase/membershipMapper.ts` — `mapToUpdateMembership` already written in Phase 11; drives D-10 update flow and D-13 spec

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ManageVaccination.vue` — Complete analog; replicate `onFileSelect` pipeline (image: canvas EXIF strip → imageCompression; PDF: passthrough), `onSubmit` FormData build, `isSaving`, `pendingFile`, Dialog/Form structure. Key difference: replace `<Form zodResolver>` with direct `v-model` refs + manual `schema.safeParse()`.
- `browser-image-compression` — Already installed; used in ManageVaccination.vue; same import for ManageMembership.vue image pipeline.
- `useConfirm()` + `<ConfirmDialog>` — Must be explicitly imported (`useConfirm` composable is not auto-resolved). `<ConfirmDialog />` goes in MembershipsTab.vue template. Established in Phase 3 + confirmed in STATE.md "Decisions from 03-04 Execution".
- `vue-sonner` `toast` — Already in MembershipsTab.vue; extend with success/error toasts for create/update/delete.
- `dayjs` — Already in MembershipDetail.vue; not needed in ManageMembership.vue (expiry_date stored as string, DatePicker returns Date → convert with dayjs to `YYYY-MM-DD`).
- `pb.authStore.record?.id` — Required for `user` field in create FormData; null-guard required (STATE.md HIGH-01 lesson from Phase 3).

### Established Patterns
- **Direct v-model form pattern:** No `@primevue/forms`; each field has its own `ref`; `initialValues` computed sets refs when record prop changes; `schema.safeParse({...refs})` on submit validates all fields.
- **FileUpload pattern:** `mode="basic" :auto="false" accept="image/jpeg,image/png,image/webp" :maxFileSize="10485760" @select="onFileSelect"` — image-only (no PDF for membership cards, per Phase 11 D-02).
- **Edit-mode image thumbnail:** `pb.files.getURL(record, record.card_image, { thumb: '100x100', token })` — needs a token prop passed from MembershipsTab (same token used for MembershipDetail preview).
- **Object.assign create contract:** `const created = await pb.collection('wallecx_memberships').create<Memberships>(formData); emit('created', created)` — MembershipsTab.vue `onCreated` handler prepends with `records.value.unshift(created)`.
- **Splice delete contract:** `records.value.splice(idx, 1)` only after `await pb.delete()` succeeds (server-first delete pattern from STATE.md "Decisions from 03-04").

### Integration Points
- `MembershipsTab.vue` — Extend with: `showManage ref<boolean>(false)`, `manageRecord ref<Memberships | null>(null)`, `const confirm = useConfirm()`, `openEdit(record)`, `openDelete(record)`, `onCreated(record)`, `onUpdated(record)` handlers; wire `<ManageMembership>`, `<ConfirmDialog />`; enable "Add card" + "Add your first card" buttons.
- `MembershipDetail.vue` — Add `emit('edit')` and `emit('delete')` buttons; wire in MembershipsTab's Dialog `@edit="openEdit(selectedRecord)"` and `@delete="openDelete(selectedRecord)"`.
- `src/lib/pocketbase/__tests__/membershipMapper.spec.ts` — New file alongside `vaccinationMapper.spec.ts`.
- `src/components/projects/wallecx/ManageMembership.vue` — New file; primary deliverable.

</code_context>

<specifics>
## Specific Ideas

- `ColorPicker` emit: PrimeVue `ColorPicker` emits 6-char hex string without `#` (e.g. `'002244'`). Store as-is. CSS binding: `:style="{ backgroundColor: '#' + card_color }"`. STATE.md locks this.
- `barcode_type` dropdown: PrimeVue `Select` with `:options="BARCODE_TYPE_OPTIONS"` where options are `[{ label: 'QR Code', value: 'qr' }, { label: 'Code 128', value: 'code128' }, ...]`. The `number` value maps to label "Number only" — matches ROADMAP.md MWRITE-02 label.
- `expiry_date` DatePicker: Same pattern as `date_administered` in ManageVaccination.vue — DatePicker returns a `Date` object; convert with `dayjs(val).format('YYYY-MM-DD')` before sending to PocketBase.
- Delete confirm: `confirm({ message: \`Delete "${record.card_name}"? This cannot be undone.\`, header: 'Confirm Delete', icon: 'pi pi-exclamation-triangle', acceptClass: 'p-button-danger', accept: () => deleteCard(record) })`
- Auth null guard on create: `const userId = pb.authStore.record?.id; if (!userId) { toast.error('Session expired. Please log in again.'); isSaving.value = false; return; }` — mirrors HIGH-01 fix from Phase 3 review.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-write-path-managemembership-crud*
*Context gathered: 2026-05-14*
