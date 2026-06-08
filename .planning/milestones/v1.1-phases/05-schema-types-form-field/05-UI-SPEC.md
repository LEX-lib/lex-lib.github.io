---
phase: 5
slug: schema-types-form-field
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-12
baseline: .planning/phases/03-write-path/03-UI-SPEC.md
---

# Phase 5 — UI Design Contract

> Visual and interaction contract for Phase 5: Schema, Types & Form Field.
> This is a minimal delta on the Phase 3 baseline. All design tokens, spacing,
> typography, color, and interaction patterns are inherited from the Phase 3
> UI-SPEC (`.planning/phases/03-write-path/03-UI-SPEC.md`) unchanged. This
> document specifies ONLY what is new or changed in Phase 5.

---

## Design System

Fully inherited from Phase 3 UI-SPEC. No changes.

| Property | Value |
|----------|-------|
| Tool | none (PrimeVue 4 + Tailwind CSS 4) |
| Preset | MyPreset — Aura base, navy primary scale (#002244 at 500), amber highlight (#e89820) — configured in `src/main.ts` |
| Component library | PrimeVue 4 (auto-imported via `PrimeVueResolver`) |
| Icon library | `iconify-icon` web component, `mdi:*` icon set |
| Font | Rubik (Google Fonts) — weights 400, 700 |

**shadcn gate result:** Not applicable. Project uses PrimeVue 4 + Tailwind CSS 4. No `components.json`. Registry safety gate is not required.

**Delta:** No design system changes in Phase 5.

---

## Spacing Scale

Fully inherited from Phase 3 UI-SPEC. No new tokens, no new usages.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Field label/input gap (`gap-1`) — same as all other form fields |
| sm | 8px | Inherited |
| md | 16px | Space between form fields (`space-y-4`) — `vaccine_type` participates in the same stack |
| lg | 24px | Inherited |
| xl | 32px | Inherited |
| 2xl | 48px | Inherited |
| 3xl | 64px | Not used |

Exceptions: none (same exceptions as Phase 3 apply — dialog width `40vw`, submit button `fluid`).

**Delta:** No new spacing values. The `vaccine_type` field block uses the identical `<div class="flex flex-col gap-1">` pattern and participates in the `<Form class="space-y-4">` vertical stack exactly like `vaccine_name`.

---

## Typography

Fully inherited from Phase 3 UI-SPEC. No new sizes or weights.

| Role | Size | Weight | Line Height | Token / Class | Used For |
|------|------|--------|-------------|---------------|----------|
| Body | 14px | 400 (Regular) | 1.5 | `text-sm` | Field label "Vaccine Type *", placeholder text, validation message text |
| Heading | 24px | 700 (Bold) | 1.2 | `text-2xl font-bold` | Page title — unchanged |
| Dialog Header | 14–16px | 400 (Regular) | 1.2 | PrimeVue Aura default | "Add Vaccination" / "Edit Vaccination" — unchanged |

**Delta:** No new typography. The `vaccine_type` field label uses `text-sm` at weight 400 (same as `vaccine_name` and all other labels). Validation message uses PrimeVue `<Message severity="error" size="small" variant="simple">` — same as all existing required fields.

---

## Color

Fully inherited from Phase 3 UI-SPEC. No new tokens.

| Role | Value | Token | Phase 5 Usage |
|------|-------|-------|---------------|
| Dominant (60%) | `#f5f7fa` | `--color-surface-page` | Unchanged |
| Secondary (30%) | `#ffffff` | `--color-surface-card` | ManageVaccination Dialog modal surface — unchanged |
| Accent (10%) | `#002244` | `--color-brand-primary` | Unchanged — submit button fill, no new usages |
| Text heading | `#0d1117` | `--color-typo-heading` | `vaccine_type` field label: `style="color: var(--color-typo-heading)"` — same as all other labels |
| Error inline | PrimeVue Aura error | — | Zod inline error `<Message severity="error">` for `vaccine_type` — no custom override |

Accent reserved for (unchanged from Phase 3): PrimeVue primary `<Button>` fills only. No new accent usages in Phase 5.

**Delta:** No new color tokens or usages.

---

## Component Specifications — Phase 5 Delta

### ManageVaccination.vue — New Field Block

**File:** `src/components/projects/wallecx/ManageVaccination.vue`

**What changes:** One field block is inserted as the FIRST child inside `<Form>`, before the existing `vaccine_name` block.

**Field order after change (D-01 — locked):**
1. Vaccine Type * (NEW — first)
2. Vaccine Name *
3. Date Administered *
4. Dose Number
5. Lot Number
6. Manufacturer
7. Location
8. Notes
9. Card (image or PDF)
10. Submit button

**Exact HTML block to insert (before the `<!-- vaccine_name -->` comment):**

```html
<!-- vaccine_type (required — D-01: first field, D-02: placeholder) -->
<div class="flex flex-col gap-1">
  <label class="text-sm" style="color: var(--color-typo-heading)">Vaccine Type *</label>
  <InputText
    name="vaccine_type"
    fluid
    :disabled="isSaving"
    placeholder="e.g., Flu, COVID-19, Pneumonia PCV23"
  />
  <Message v-if="$form.vaccine_type?.invalid" severity="error" size="small" variant="simple">
    {{ $form.vaccine_type.error?.message }}
  </Message>
</div>
```

**Zod schema addition (insert as first key in `z.object({...})`):**

```typescript
vaccine_type: z.string().min(1, { message: "Vaccine type is required." }),
```

**`initialValues` computed addition (for edit mode — D-03: no special UX for empty records):**

```typescript
vaccine_type: record.value.vaccine_type ?? "",
```

Full updated `initialValues` computed:

```typescript
const initialValues = computed(() => {
  if (!record.value) return {};
  return {
    vaccine_type: record.value.vaccine_type ?? "",   // NEW
    vaccine_name: record.value.vaccine_name,
    date_administered: new Date(record.value.date_administered),
    dose_number: record.value.dose_number ?? null,
    lot_number: record.value.lot_number ?? "",
    manufacturer: record.value.manufacturer ?? "",
    location: record.value.location ?? "",
    notes: record.value.notes ?? "",
  };
});
```

**`onSubmit` FormData addition (insert after `if (!valid) return;`, before `vaccine_name` append):**

```typescript
formData.append("vaccine_type", values.vaccine_type as string);
```

No null guard required — Zod `min(1)` blocks submit if the field is empty.

---

### types.d.ts — Interface Addition

**File:** `src/types/wallecx/vaccinations/types.d.ts`

**What changes:** One property added to `Vaccinations` interface. `AddVaccination` inherits it automatically via `Omit<Vaccinations, "id" | "created" | "updated">` — no change to the type alias needed (D-04).

```typescript
export interface Vaccinations extends RecordModel {
  id: string;
  created: string;
  updated: string;
  user: string;
  vaccine_type: string;        // NEW — GROUP-02
  vaccine_name: string;
  date_administered: string;
  dose_number?: number;
  lot_number?: string;
  location?: string;
  manufacturer?: string;
  notes?: string;
  card: string;
}
```

**Position:** `vaccine_type` is declared immediately before `vaccine_name` in the interface, mirroring the form field order (D-01).

---

### vaccinationMapper.ts — No Change

Per D-04 (locked): `mapToUpdateVaccination` strips only server-managed fields (`id`, `created`, `updated`, `user`, `card`). Adding `vaccine_type` to the `Vaccinations` interface automatically includes it in the writable set. No explicit mapper logic change needed.

---

### PocketBase — Manual Schema Step

Per D-05 (locked): Add `vaccine_type` as a plain **Text** field to `wallecx_vaccinations` in the PocketBase admin UI. Field must be **optional at schema level** (empty string allowed) so existing records keep their empty value without errors. Required enforcement is at the form/Zod layer only (GROUP-01).

---

## Interaction States — Phase 5 Delta

**Edit mode — old records with empty `vaccine_type` (D-03 — locked):**
- No info banner. No pre-submit warning. No special state.
- User opens edit dialog, sees Vaccine Type field empty, fills it in, saves.
- If user submits with Vaccine Type empty: Zod fires "Vaccine type is required." inline below the field — same pattern as `vaccine_name` and `date_administered`.
- This is the only interaction contract change in Phase 5.

**isSaving state:** `vaccine_type` InputText is disabled when `isSaving = true` — same as all other form fields (`:disabled="isSaving"` already in the block above).

**Validation:** `validate-on-submit` on `<Form>` — error appears only after first submit attempt, not on blur. Same contract as Phase 3.

---

## Copywriting Contract — Phase 5 Additions

All Phase 3 copywriting is inherited unchanged. Phase 5 adds:

| Element | Copy | Context |
|---------|------|---------|
| Field label — Vaccine Type | "Vaccine Type *" | Required field; asterisk suffix matches `vaccine_name` and `date_administered` convention |
| Field placeholder | "e.g., Flu, COVID-19, Pneumonia PCV23" | InputText `placeholder` attribute — D-02 (locked) |
| Validation — vaccine_type | "Vaccine type is required." | Zod `min(1)` inline error via `<Message severity="error" size="small" variant="simple">` |

**No other copywriting changes.** Dialog titles, submit button labels, toast messages, and all other copy are unchanged from Phase 3.

---

## Registry Safety

No new npm packages are installed in Phase 5. All required libraries are already present from Phase 3:

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | None | Not applicable — project uses PrimeVue, not shadcn |
| Third-party registries | None | Not applicable |
| npm packages (new) | None | No installs — `z.string().min(1)` and `InputText` are already in `package.json` |

**Explicit confirmation:** Phase 5 requires zero new dependencies. `zod`, `@primevue/forms`, `primevue`, and all other libraries used in the `vaccine_type` field block are already installed and verified in `node_modules`.

---

## Pre-Population Sources

| Field | Source | Notes |
|-------|--------|-------|
| Design system | Phase 3 UI-SPEC.md — Design System | Inherited unchanged |
| Spacing scale | Phase 3 UI-SPEC.md — Spacing Scale | Inherited unchanged; `vaccine_type` participates in existing `space-y-4` + `gap-1` structure |
| Typography | Phase 3 UI-SPEC.md — Typography | Inherited unchanged; `vaccine_type` label at `text-sm` weight 400 |
| Color tokens | Phase 3 UI-SPEC.md — Color | Inherited unchanged; `--color-typo-heading` on label |
| D-01 (field position) | 05-CONTEXT.md — Decisions | vaccine_type first in form — locked |
| D-02 (placeholder) | 05-CONTEXT.md — Decisions | `placeholder="e.g., Flu, COVID-19, Pneumonia PCV23"` — locked |
| D-03 (edit UX) | 05-CONTEXT.md — Decisions | No special UX for empty old records — locked |
| D-04 (mapper) | 05-CONTEXT.md — Decisions | No mapper change needed — locked |
| D-05 (PocketBase) | 05-CONTEXT.md — Decisions | Optional at schema level, required at form level — locked |
| Zod rule | 05-CONTEXT.md — Specifics | `z.string().min(1, { message: "Vaccine type is required." })` |
| FormData append | 05-CONTEXT.md — Specifics | `formData.append("vaccine_type", values.vaccine_type as string)` — no null guard |
| initialValues | 05-CONTEXT.md — Specifics | `vaccine_type: record.value.vaccine_type ?? ""` |
| Label text | 05-CONTEXT.md — Claude's Discretion | "Vaccine Type *" — matches existing required-field convention |
| AddVaccination type | 05-CONTEXT.md — Claude's Discretion | Inherits automatically; no explicit change to type alias |
| User input | None | All design contract questions answered by upstream artifacts; zero re-asked |

---

## Constraint Checklist — Phase 5 Additions

Constraints inherited from Phase 3 apply unchanged. Phase 5 adds:

| Constraint | Rule | Verifiable By |
|------------|------|---------------|
| vaccine_type Zod rule | `z.string().min(1, { message: "Vaccine type is required." })` — not `.optional()`, not `.nullable()` | Code review of `schema` in ManageVaccination.vue |
| No null guard in FormData | `formData.append("vaccine_type", values.vaccine_type as string)` — Zod guarantees non-empty at submit | Code review of `onSubmit` |
| initialValues null-coalesce | `record.value.vaccine_type ?? ""` — handles existing records with empty string | Code review of `initialValues` computed |
| PocketBase field optional | `vaccine_type` Text field must NOT be set required in PocketBase admin UI | Manual verification in PocketBase admin |
| No `v-html` | `vaccine_type` value rendered via `{{ }}` mustache in any display context — never `v-html` | `git grep "v-html" src/components/projects/wallecx` returns zero hits |
| Field position | `vaccine_type` block is the FIRST field inside `<Form>`, before `vaccine_name` | Code review of ManageVaccination.vue template |
| Placeholder text exact | `placeholder="e.g., Flu, COVID-19, Pneumonia PCV23"` — exact string, D-02 | Code review |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

*Phase: 05-schema-types-form-field*
*UI-SPEC created: 2026-05-12*
*Baseline: Phase 3 UI-SPEC (03-UI-SPEC.md) — all tokens and patterns inherited*
*Next: gsd-ui-checker validates this contract; gsd-planner consumes it for task breakdown*
