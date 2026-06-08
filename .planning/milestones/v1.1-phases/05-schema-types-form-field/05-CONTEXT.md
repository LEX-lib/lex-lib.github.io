# Phase 5: Schema, Types & Form Field - Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Add `vaccine_type` (free-text string) to the PocketBase `wallecx_vaccinations` collection, the `Vaccinations` TypeScript interface, and the `ManageVaccination.vue` form as a required field. No UI grouping work — Phase 6 builds the grouped card view on top of this foundation.

**In scope:** GROUP-01 (PocketBase field), GROUP-02 (TypeScript interface), GROUP-03 (form field + Zod required validation).
**Out of scope:** Grouped card view, group detail panel, VaccinationList changes, any new components (all Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Form Field Position
- **D-01:** `vaccine_type` is the **first field** in `ManageVaccination.vue` — before Vaccine Name. Rationale: category leads logically (mirrors how the Phase 6 grouped view works — type is the top-level concept). Field order becomes: Vaccine Type → Vaccine Name → Date Administered → Dose Number → Lot Number → Manufacturer → Location → Notes → Card.

### Input Hint
- **D-02:** Include a **placeholder** on the `vaccine_type` InputText: `placeholder="e.g., Flu, COVID-19, Pneumonia PCV23"`. Free-text without a dropdown needs guidance so users understand what level of categorization is expected.

### Old Records in Edit Mode
- **D-03:** **No special UX** for existing records where `vaccine_type` is `""`. The user opens the edit dialog, sees the Vaccine Type field empty, fills it in, and saves. Zod validation fires on submit if they leave it empty — same pattern as `vaccine_name` and `date_administered`. No info banner or pre-submit warning.

### Mapper Update
- **D-04 (Claude's Discretion):** `mapToUpdateVaccination` currently strips only server-managed fields (`id`, `created`, `updated`, `user`, `card`). Adding `vaccine_type` to the `Vaccinations` interface automatically includes it in the writable set — no explicit mapper logic change needed. The mapper's existing strip list is sufficient.

### PocketBase Schema Change
- **D-05 (Claude's Discretion):** `vaccine_type` is added as a **plain Text field, not required at the PocketBase schema level** (so existing records keep empty string without data errors). Required enforcement is at the form/Zod layer only. This matches the GROUP-01 requirement and the v1.1 milestone decision.

### Carried Forward (Phase 3 — locked)
- Single-column vertical stack — same `<div class="flex flex-col gap-1">` + label + InputText + Message pattern as all other fields.
- Zod required: `z.string().min(1, { message: "Vaccine type is required." })`.
- `initialValues` edit path: `vaccine_type: record.value.vaccine_type ?? ""`.
- `onSubmit` appends: `formData.append("vaccine_type", values.vaccine_type as string)`.

### Claude's Discretion
- Exact label text (suggested: "Vaccine Type *" matching the required-field convention in the existing form).
- Whether `vaccine_type` is included in `AddVaccination` type automatically (it will be, since `AddVaccination = Omit<Vaccinations, "id" | "created" | "updated">` — `vaccine_type` is user-managed).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 5 — Goal, requirements (GROUP-01, GROUP-02, GROUP-03), success criteria

### Files to Modify
- `src/types/wallecx/vaccinations/types.d.ts` — Add `vaccine_type: string` to `Vaccinations` interface; `AddVaccination` inherits it automatically
- `src/components/projects/wallecx/ManageVaccination.vue` — Add `vaccine_type` field (first in form), update Zod schema, `initialValues`, `onSubmit` FormData append
- `src/lib/pocketbase/vaccinationMapper.ts` — No change needed; `vaccine_type` is automatically included in writable set

### Analogs and Patterns
- `.planning/phases/03-write-path/03-CONTEXT.md` — Form conventions: D-03 (single column), D-04 (DatePicker), field pattern; all carried forward
- `src/components/Login.vue` — `zodResolver` + `@primevue/forms` import pattern
- `src/components/projects/wallecx/ManageVaccination.vue` — Current 7-field form; `vaccine_type` inserts before `vaccine_name`

### PocketBase Admin
- No code file — manual step: add `vaccine_type` Text field to `wallecx_vaccinations` collection via PocketBase admin UI. Field should be optional at schema level (empty string allowed for existing records).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ManageVaccination.vue` existing form fields — copy the `<div class="flex flex-col gap-1">` block pattern exactly; the new field is structurally identical to `vaccine_name` (required InputText + Zod min(1) + Message error)
- Zod schema already handles required/optional split — extend with `vaccine_type: z.string().min(1, { message: "Vaccine type is required." })`
- `initialValues` computed already handles null-check for edit vs create — add `vaccine_type: record.value.vaccine_type ?? ""`

### Established Patterns
- **Required field pattern:** label with `*` suffix → `<InputText name="..." fluid>` → `<Message v-if="$form.field?.invalid" severity="error" size="small" variant="simple">{{ $form.field.error?.message }}</Message>`
- **FormData append (required field):** `formData.append("vaccine_type", values.vaccine_type as string)` — no null check needed since Zod blocks empty

### Integration Points
- `types.d.ts` change flows into: `ManageVaccination.vue`, `VaccinationList.vue`, `WallecxApp.vue`, `vaccinationMapper.ts`, `vaccinationMapper.spec.ts` — all via TypeScript import; tsc will flag any usage that doesn't account for the new field
- PocketBase admin UI: add field before running the updated frontend to avoid 400 errors on create/update

</code_context>

<specifics>
## Specific Ideas

- Field order in form: Vaccine Type → Vaccine Name → Date Administered → Dose Number → Lot Number → Manufacturer → Location → Notes → Card attachment
- Placeholder: `placeholder="e.g., Flu, COVID-19, Pneumonia PCV23"`
- Zod: `vaccine_type: z.string().min(1, { message: "Vaccine type is required." })`
- `initialValues` (edit): `vaccine_type: record.value.vaccine_type ?? ""`
- `onSubmit` FormData: `formData.append("vaccine_type", values.vaccine_type as string)`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-schema-types-form-field*
*Context gathered: 2026-05-12*
