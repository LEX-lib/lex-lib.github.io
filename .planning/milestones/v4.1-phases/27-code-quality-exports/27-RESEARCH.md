# Phase 27: Code Quality & Exports — Research

**Researched:** 2026-05-22
**Domain:** Vue 3 SFC modification, Zod validation, PocketBase file URL, browser Blob download
**Confidence:** HIGH

## Summary

Phase 27 is a narrow, well-defined phase with zero unknowns. Both code-quality fixes (CQ-01, CQ-02) are **already shipped** to the codebase and confirmed passing via a live test run (`npm run test:unit` — 49/49 green). The plan's only implementation work is adding `exportJson()` to two existing tab components, following a fully proven pattern from VaccinationsTab.vue.

The export pattern is identical for both tabs: add an `isExporting` ref, add an async `exportJson()` function that calls `getFullList` with a distinct `requestKey`, wraps results in an envelope, creates a Blob, triggers an anchor download, then revokes the object URL. Add a "Download records" Button to the header row alongside the existing action button. No new packages, no new routes, no new stores.

The planner's job is to lay out wave-by-wave tasks that: (1) verify CQ-01/CQ-02 via the test run, (2) add membership export, (3) add expense export, and (4) mark all four requirements as complete in REQUIREMENTS.md.

**Primary recommendation:** Mirror VaccinationsTab.vue lines 210–260 exactly for both tabs. The pattern is battle-tested; don't deviate.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Both CQ-01 and CQ-02 fixes are already implemented. Plans must include a verification step (run `npm run test:unit`), not a re-implementation step.
- **D-02:** Verify that all 9 expenseMapper tests and the expense schema validation tests pass. Mark CQ-01 and CQ-02 as verified in REQUIREMENTS.md.
- **D-03:** Memberships export includes `card_image_url`: `r.card_image ? pb.files.getURL(r, r.card_image) : null`
- **D-04:** Memberships export fields: `id`, `card_name`, `issuer`, `card_number`, `card_color`, `expiry_date`, `notes`, `card_image_url`, `created`, `updated`
- **D-05:** Memberships export uses a fresh `getFullList` — ALL user records, regardless of active search/sort filters
- **D-06:** Expenses export includes `receipt_url`: `r.receipt ? pb.files.getURL(r, r.receipt) : null`
- **D-07:** Expenses export fields: `id`, `amount`, `expense_date`, `category`, `description`, `notes`, `receipt_url`, `created`, `updated`
- **D-08:** Expenses export uses a fresh `getFullList` — ALL user records, regardless of active filters
- **D-09:** Both export buttons live in the main tab header row (`flex items-center justify-between`), alongside "Add card" / "Add Expense" — both buttons wrapped in `<div class="flex gap-2">`
- **D-10:** `isExporting` ref guard — prevent double-click
- **D-11:** Check `pb.authStore.record?.id` null guard before proceeding
- **D-12:** `getFullList` sort: `-created` for memberships, `-expense_date,-created` for expenses
- **D-13:** Envelope: `exported_at` + `record_count` + `records[]`
- **D-14:** Blob → `URL.createObjectURL` → anchor → click → `URL.revokeObjectURL` cleanup
- **D-15:** Filenames: `wallecx-memberships-{YYYY-MM-DD}.json` and `wallecx-expenses-{YYYY-MM-DD}.json`
- **D-16:** Toast success: `"Membership cards exported."` / `"Expenses exported."`; toast error: `"Export failed. Please try again."`
- **D-17:** Button: `label="Download records"`, `icon="pi pi-download"`, `severity="secondary"`, `size="small"`
- **D-18:** requestKey for memberships export: `'memberships-export'` (distinct from `'memberships-getFullList'`); for expenses export: `'expenses-export'`

### Claude's Discretion
- Exact field ordering in the JSON payload envelope (within the decisions above)
- Whether to add a `requestKey` to the export `getFullList` call (acceptable either way; CONTEXT.md recommends distinct keys to avoid cancelling live subscriptions — use `'memberships-export'` and `'expenses-export'`)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CQ-01 | Expense date field rejects invalid calendar dates (e.g. Feb 31, Apr 31) with a clear validation error | Already implemented at `src/lib/wallecx/expenseSchema.ts:21` — `.refine(val => dayjs(val, 'YYYY-MM-DD', true).isValid(), ...)`. Verified green by test run. |
| CQ-02 | `mapToUpdateExpense` omits the `notes` key entirely when notes is undefined; mapper test asserts `not.toHaveProperty('notes')` | Already implemented at `src/lib/pocketbase/expenseMapper.ts:28` and test at `expenseMapper.spec.ts:62`. Verified green by test run. |
| EXPORT-01 | User can download all membership card records as a single JSON file from the Memberships tab | Add `exportJson()` + button to `MembershipsTab.vue` following VaccinationsTab pattern. Payload shape locked in D-03/D-04. |
| EXPORT-02 | User can download all expense records as a single JSON file from the Expenses tab | Add `exportJson()` + button to `ExpensesTab.vue` following VaccinationsTab pattern. Payload shape locked in D-06/D-07. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CQ-01 date validation | Frontend (Zod schema) | — | Client-side validation at form submit; Zod `.refine()` with dayjs strict parse |
| CQ-02 mapper correctness | Frontend (mapper utility) | — | Pure function in `src/lib/pocketbase/expenseMapper.ts`; no server interaction |
| JSON export — data fetch | Frontend (tab component) | PocketBase API | Tab calls `getFullList` on mount of export action; PocketBase returns all records |
| JSON export — file creation | Browser (Blob API) | — | Blob + `URL.createObjectURL` + anchor click — entirely client-side |
| Export button UI | Frontend (tab component) | — | Button lives in tab shell header row; no new route or dialog |

## Standard Stack

### Core (all already in use — no new packages needed) [VERIFIED: codebase grep]

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 Composition API | project default | Component authoring | Established pattern throughout codebase |
| Zod | project default | Schema validation + `.refine()` | CQ-01 fix uses `.refine()` with dayjs |
| dayjs | project default | Date parsing + filename datestamp | Strict parse for CQ-01; `dayjs().format('YYYY-MM-DD')` for filename |
| PocketBase JS SDK | project default | `getFullList` + `pb.files.getURL` | All PocketBase interactions use this client |
| vue-sonner `toast` | project default | Success/error feedback | Already imported in both tab files |
| PrimeVue `Button` | project default | Export button component | Auto-imported via PrimeVueResolver |

### Installation
```bash
# No new packages required — all libraries already installed
```

## Architecture Patterns

### System Architecture Diagram

```
User clicks "Download records"
        |
        v
exportJson() in tab component
        |
        +-- isExporting guard (prevent double-click)
        |
        +-- pb.authStore.record?.id null guard
        |
        v
pb.collection(...).getFullList<T>({ sort, requestKey: '...-export' })
        |
        v
Map records to export payload shape
{ exported_at, record_count, records: [...] }
        |
        v
new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        |
        v
URL.createObjectURL(blob)
        |
        v
document.createElement('a') → set href + download → click → removeChild
        |
        v
URL.revokeObjectURL(url)
        |
        +-- toast.success(...)  [on success]
        +-- toast.error(...)    [on catch]
        +-- isExporting = false [finally]
```

### Recommended File Changes
```
src/
├── components/projects/wallecx/
│   ├── MembershipsTab.vue    # Add: isExporting ref, exportJson(), dayjs import, Download button
│   └── ExpensesTab.vue       # Add: isExporting ref, exportJson(), dayjs import, Download button
└── (no other files change)
```

### Pattern 1: Export Function (mirror of VaccinationsTab.vue:210–260)
**What:** Async function with double-click guard, auth check, getFullList, envelope, Blob download
**When to use:** Every tab that exposes a JSON download

```typescript
// Source: src/components/projects/wallecx/VaccinationsTab.vue:210–260 [VERIFIED: codebase read]
// Membership adaptation:
async function exportJson(): Promise<void> {
  if (isExporting.value) return; // prevent double-click
  const userId = pb.authStore.record?.id;
  if (!userId) {
    toast.error("Session expired. Please log in again.");
    return;
  }
  isExporting.value = true;
  try {
    const allRecords = await pb
      .collection("wallecx_memberships")
      .getFullList<Memberships>({
        sort: "-created",
        requestKey: "memberships-export", // distinct from 'memberships-getFullList'
      });

    const exportPayload = {
      exported_at: new Date().toISOString(),
      record_count: allRecords.length,
      records: allRecords.map((r) => ({
        id: r.id,
        card_name: r.card_name,
        issuer: r.issuer ?? null,
        card_number: r.card_number ?? null,
        card_color: r.card_color ?? null,
        expiry_date: r.expiry_date ?? null,
        notes: r.notes ?? null,
        card_image_url: r.card_image ? pb.files.getURL(r, r.card_image) : null,
        created: r.created,
        updated: r.updated,
      })),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wallecx-memberships-${dayjs().format("YYYY-MM-DD")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success("Membership cards exported.");
  } catch (e: unknown) {
    toast.error("Export failed. Please try again.");
    console.error("MembershipsTab: exportJson failed", e);
  } finally {
    isExporting.value = false;
  }
}
```

### Pattern 2: Header Row Button Wrap
**What:** Wrap existing single button + new Download button in `<div class="flex gap-2">`
**When to use:** Any header row that needs to accommodate two buttons

```html
<!-- Source: src/components/projects/wallecx/MembershipsTab.vue:172 [VERIFIED: codebase read] -->
<!-- BEFORE -->
<div class="flex items-center justify-between mb-4">
  <Button label="Add card" icon="pi pi-plus" size="small" @click="openManage(null)" />
</div>

<!-- AFTER -->
<div class="flex items-center justify-between mb-4">
  <div class="flex gap-2">
    <Button label="Add card" icon="pi pi-plus" size="small" @click="openManage(null)" />
    <Button
      label="Download records"
      icon="pi pi-download"
      severity="secondary"
      size="small"
      :disabled="isExporting"
      :loading="isExporting"
      @click="exportJson"
    />
  </div>
</div>
```

### Pattern 3: dayjs Import (missing from both target files)
**What:** dayjs is already a project dependency but not imported in MembershipsTab or ExpensesTab
**When to use:** Any component needing date formatting for export filename

```typescript
// Add to top of <script setup> in MembershipsTab.vue and ExpensesTab.vue
import dayjs from 'dayjs'
```

### Anti-Patterns to Avoid
- **Same requestKey as live data load:** Do NOT use `'memberships-getFullList'` for the export call — it would cancel the tab's existing live data subscription. Use `'memberships-export'` and `'expenses-export'`.
- **Filtering records before export:** Export MUST use a fresh `getFullList` call, not `displayedMemberships` computed (which may be filtered by search). D-05/D-08 lock this.
- **Including `barcode_value` / `barcode_type` in membership export:** Not in the locked field list (D-04). These are render-time fields, not writable domain fields. Omit them.
- **Including `user` / `collectionId` / `collectionName` in export payload:** These are PocketBase internals, not user data. VaccinationsTab omits them; follow the same pattern.
- **Missing `isExporting = false` in finally:** If the try block throws, isExporting would stick at `true`. The `finally` block is mandatory.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File download trigger | Custom download link logic | Blob + anchor pattern (already proven) | Cross-browser; handles filename; handles large payloads |
| Date validation (CQ-01) | Custom regex calendar check | dayjs strict parse `.isValid()` | Already implemented; dayjs handles leap years, month-end edge cases correctly |
| Conditional object spread (CQ-02) | Conditional assignment block | `...(condition ? { key: val } : {})` spread | Already implemented; idiomatic JS pattern for omitting optional keys |

**Key insight:** Both code-quality fixes are already shipped. The only hand-rolling risk is in the export function — resist the urge to invent new patterns when VaccinationsTab already has the proven implementation.

## Common Pitfalls

### Pitfall 1: requestKey Collision
**What goes wrong:** Using `'memberships-getFullList'` as the requestKey for the export `getFullList` call causes PocketBase's auto-cancel to abort the tab's ongoing data subscription, emptying the card grid.
**Why it happens:** PocketBase JS SDK cancels any in-flight request with the same requestKey when a new request with that key is made.
**How to avoid:** Use `'memberships-export'` and `'expenses-export'` as distinct keys. CONTEXT.md D-18 locks this.
**Warning signs:** Card grid clears immediately when the Download button is clicked.

### Pitfall 2: dayjs Not Imported
**What goes wrong:** `dayjs().format(...)` in the export filename line throws a ReferenceError at runtime.
**Why it happens:** dayjs is imported in VaccinationsTab but NOT in MembershipsTab or ExpensesTab. [VERIFIED: codebase read — neither file has `import dayjs`]
**How to avoid:** Add `import dayjs from 'dayjs'` to the top of both target files alongside the export function changes.
**Warning signs:** TypeScript will catch this at compile time (`npm run type-check`) if the import is missing.

### Pitfall 3: Missing isExporting Ref
**What goes wrong:** Double-clicking the Download button triggers two concurrent getFullList calls and two file downloads.
**Why it happens:** Async function without a guard.
**How to avoid:** Declare `const isExporting = ref(false)` and add the early-return guard at the top of `exportJson()`.

### Pitfall 4: Memberships Type Missing card_image Field
**What goes wrong:** TypeScript error when accessing `r.card_image` in the export map.
**Why it happens:** `card_image` is defined in the Memberships interface as optional (`card_image?: string`). [VERIFIED: codebase read — `src/types/wallecx/memberships/types.d.ts:16`]
**How to avoid:** Use `r.card_image ? pb.files.getURL(r, r.card_image) : null` — the ternary handles the optional field. TypeScript will accept this.

### Pitfall 5: ExpensesTab Header Has a Title Element, Not Just a Button
**What goes wrong:** Wrapping only the button in `<div class="flex gap-2">` still leaves the title `<h2>` and the button(s) justified apart by `justify-between`. The title stays left; the button group stays right.
**Why it happens:** ExpensesTab header row (line 103–106) has `<h2>` on the left and `<Button>` on the right — different from MembershipsTab which has only one `<Button>` on the left.
**How to avoid:** Wrap both the "Add Expense" Button AND the new "Download records" Button together in `<div class="flex gap-2">`. The `<h2>` stays as-is on the left. Result: `justify-between` pushes `<h2>` left and `<div class="flex gap-2">` right, with both buttons side by side.
**Warning signs:** Download button appears on the far left next to the title instead of next to the Add Expense button.

## Code Examples

### CQ-01: Zod .refine() Calendar Validation (already live)
```typescript
// Source: src/lib/wallecx/expenseSchema.ts:19–21 [VERIFIED: codebase read]
expense_date: z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format.' })
  .refine(val => dayjs(val, 'YYYY-MM-DD', true).isValid(), { message: 'Date is not a valid calendar date.' }),
```

### CQ-02: Conditional Notes Spread (already live)
```typescript
// Source: src/lib/pocketbase/expenseMapper.ts:23–29 [VERIFIED: codebase read]
return {
  amount: record.amount,
  expense_date: record.expense_date,
  category: record.category,
  description: record.description,
  ...(record.notes !== undefined ? { notes: record.notes } : {}),
};
```

### CQ-02: Test Assertion (already live)
```typescript
// Source: src/lib/pocketbase/__tests__/expenseMapper.spec.ts:59–63 [VERIFIED: codebase read]
it("drops notes when undefined", () => {
  const minimal = makeExpense({ notes: undefined });
  const minimalPayload = mapToUpdateExpense(minimal);
  expect(minimalPayload).not.toHaveProperty("notes");
});
```

### Expenses Export Function (to be added)
```typescript
// Adapted from VaccinationsTab pattern. Add to ExpensesTab.vue <script setup>
import dayjs from 'dayjs'

const isExporting = ref(false)

async function exportJson(): Promise<void> {
  if (isExporting.value) return;
  const userId = pb.authStore.record?.id;
  if (!userId) {
    toast.error("Session expired. Please log in again.");
    return;
  }
  isExporting.value = true;
  try {
    const allRecords = await pb
      .collection("wallecx_expenses")
      .getFullList<Expenses>({
        sort: "-expense_date,-created",
        requestKey: "expenses-export", // distinct from 'expenses-getFullList'
      });

    const exportPayload = {
      exported_at: new Date().toISOString(),
      record_count: allRecords.length,
      records: allRecords.map((r) => ({
        id: r.id,
        amount: r.amount,
        expense_date: r.expense_date,
        category: r.category,
        description: r.description,
        notes: r.notes ?? null,
        receipt_url: r.receipt ? pb.files.getURL(r, r.receipt) : null,
        created: r.created,
        updated: r.updated,
      })),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wallecx-expenses-${dayjs().format("YYYY-MM-DD")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success("Expenses exported.");
  } catch (e: unknown) {
    toast.error("Export failed. Please try again.");
    console.error("ExpensesTab: exportJson failed", e);
  } finally {
    isExporting.value = false;
  }
}
```

## Project Constraints (from CLAUDE.md)

- Vue 3 Composition API with `<script setup lang="ts">` throughout — all new code follows this pattern
- PrimeVue 4 auto-imported via `unplugin-vue-components` + `PrimeVueResolver` — Button is auto-imported, no explicit import needed in template
- Tailwind CSS 4 — utility-first; use `flex gap-2` for button grouping
- Path alias `@` maps to `src/` — use in imports
- `vue-sonner` for toasts — already imported in both target tab files
- `dayjs` for dates — already a project dependency; add import to both target files
- No new packages for this phase (confirmed: export pattern uses only existing dependencies)
- Run `npm run lint` and `npm run type-check` after changes — project standard

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `toBeUndefined()` assertion for missing key | `not.toHaveProperty('notes')` | v4.0 Phase 23 advisory (CQ-02) | Correctly distinguishes "key absent" from "key present with undefined value" |
| Unconditional `notes: record.notes` in mapper | Conditional spread `...(record.notes !== undefined ? { notes: record.notes } : {})` | v4.0 Phase 23 advisory (CQ-02) | PATCH payload no longer sends `notes: undefined` to PocketBase |

## Assumptions Log

> All claims in this research were verified against the live codebase or confirmed by test execution. No assumed claims require user confirmation.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | — | — | — |

**All claims verified or cited — no user confirmation needed.**

## Open Questions

None. All decisions are locked in CONTEXT.md and all referenced files have been read and verified.

## Environment Availability

Step 2.6: SKIPPED — This phase is purely code changes to existing files. No external dependencies beyond the already-installed project packages are required. Test infrastructure confirmed available via live run.

## Validation Architecture

`workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`. Validation Architecture section omitted per spec.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | partial | `pb.authStore.record?.id` null guard before export — prevents exporting data when session expired |
| V5 Input Validation | yes (CQ-01) | Zod `.refine()` with dayjs strict parse — already implemented |
| V6 Cryptography | no | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Export while unauthenticated | Information Disclosure | `pb.authStore.record?.id` guard aborts export if session absent — locked in D-11 |
| PocketBase `getFullList` returns another user's records | Information Disclosure | PocketBase listRule enforces `@request.auth.id != ""` — server-side isolation; client-side guard is belt-and-suspenders |
| `card_image` / `receipt` URL in export accessible without auth | Information Disclosure | Documented in CONTEXT.md D-03/D-06 — URLs require PocketBase auth token; receipt is `protected=true`. Export documents the URL for backup reference only; this is accepted behaviour. |

## Sources

### Primary (HIGH confidence)
- `src/components/projects/wallecx/VaccinationsTab.vue:210–260` — canonical exportJson() implementation [VERIFIED: codebase read]
- `src/lib/wallecx/expenseSchema.ts:19–21` — CQ-01 fix confirmed live [VERIFIED: codebase read]
- `src/lib/pocketbase/expenseMapper.ts:23–29` — CQ-02 fix confirmed live [VERIFIED: codebase read]
- `src/lib/pocketbase/__tests__/expenseMapper.spec.ts:59–63` — CQ-02 test assertion confirmed correct [VERIFIED: codebase read]
- `src/components/projects/wallecx/MembershipsTab.vue` — full file read; header row at line 172 [VERIFIED: codebase read]
- `src/components/projects/wallecx/ExpensesTab.vue` — full file read; header row at line 103 [VERIFIED: codebase read]
- `src/types/wallecx/memberships/types.d.ts` — Memberships interface confirmed [VERIFIED: codebase read]
- `src/types/wallecx/expenses/types.d.ts` — Expenses interface confirmed [VERIFIED: codebase read]
- `npm run test:unit` — 49/49 tests pass; CQ-01 and CQ-02 verified green [VERIFIED: live test run]

## Metadata

**Confidence breakdown:**
- CQ-01 / CQ-02 status: HIGH — verified by live test run (49/49 green)
- Standard stack: HIGH — codebase inspection; no new packages needed
- Export architecture: HIGH — VaccinationsTab canonical pattern read directly from source
- Pitfalls: HIGH — derived from direct inspection of both target tab files
- Type correctness: HIGH — all interfaces read; optional fields confirmed

**Research date:** 2026-05-22
**Valid until:** 2026-06-22 (stable codebase; no fast-moving dependencies in scope)
