# Phase 27: Code Quality & Exports — Pattern Map

**Mapped:** 2026-05-22
**Files analyzed:** 2 modified files (no new files)
**Analogs found:** 2 / 2

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/projects/wallecx/MembershipsTab.vue` | component | request-response (file I/O on export) | `src/components/projects/wallecx/VaccinationsTab.vue` | exact |
| `src/components/projects/wallecx/ExpensesTab.vue` | component | request-response (file I/O on export) | `src/components/projects/wallecx/VaccinationsTab.vue` | exact |

> CQ-01 (`expenseSchema.ts`) and CQ-02 (`expenseMapper.ts` + spec) are **already live** — no file modification required. Verification only (run `npm run test:unit`).

---

## Pattern Assignments

### `src/components/projects/wallecx/MembershipsTab.vue` (component, request-response + file I/O)

**Analog:** `src/components/projects/wallecx/VaccinationsTab.vue`

**Imports pattern — what to ADD** (analog lines 2–3):
```typescript
// Add `dayjs` import to existing import block in MembershipsTab.vue
// dayjs is NOT currently imported in MembershipsTab.vue (verified)
import dayjs from 'dayjs'
// Existing imports that are already present (do not duplicate):
// import { ref, onMounted, computed, watch } from 'vue'
// import { toast } from 'vue-sonner'
// import { pb } from '@/lib/pocketbase'
// import type { Memberships } from '@/types/wallecx/memberships/types'
```

**isExporting ref pattern** (analog line 26):
```typescript
// Add to the state block alongside existing refs in MembershipsTab.vue
const isExporting = ref(false)
```

**Core export function pattern** (analog lines 210–260):
```typescript
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

**Header row template pattern — BEFORE** (MembershipsTab.vue lines 172–179):
```html
<div class="flex items-center justify-between mb-4">
  <Button
    label="Add card"
    icon="pi pi-plus"
    size="small"
    @click="openManage(null)"
  />
</div>
```

**Header row template pattern — AFTER** (wrap single button in `flex gap-2` div; add Download button):
```html
<div class="flex items-center justify-between mb-4">
  <div class="flex gap-2">
    <Button
      label="Add card"
      icon="pi pi-plus"
      size="small"
      @click="openManage(null)"
    />
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

> Note: `barcode_value` and `barcode_type` are NOT in the export payload (D-04 omits them — render-time fields, not writable domain fields). `user`, `collectionId`, `collectionName` are also omitted (PocketBase internals).

---

### `src/components/projects/wallecx/ExpensesTab.vue` (component, request-response + file I/O)

**Analog:** `src/components/projects/wallecx/VaccinationsTab.vue`

**Imports pattern — what to ADD** (analog lines 2–3):
```typescript
// Add `dayjs` import to existing import block in ExpensesTab.vue
// dayjs is NOT currently imported in ExpensesTab.vue (verified)
import dayjs from 'dayjs'
// Existing imports that are already present (do not duplicate):
// import { ref, onMounted } from 'vue'
// import { toast } from 'vue-sonner'
// import { pb } from '@/lib/pocketbase'
// import type { Expenses } from '@/types/wallecx/expenses/types'
```

**isExporting ref pattern** (analog line 26):
```typescript
// Add to the state block alongside existing refs in ExpensesTab.vue
const isExporting = ref(false)
```

**Core export function pattern** (analog lines 210–260, adapted for expenses):
```typescript
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

**Header row template pattern — BEFORE** (ExpensesTab.vue lines 103–106):
```html
<div class="flex items-center justify-between mb-4">
  <h2 class="text-lg font-semibold" style="color: var(--color-typo-heading)">Expenses</h2>
  <Button label="Add Expense" icon="pi pi-plus" size="small" @click="openManage(null)" />
</div>
```

**Header row template pattern — AFTER** (wrap the right-side button only in `flex gap-2`; `<h2>` stays on the left):
```html
<div class="flex items-center justify-between mb-4">
  <h2 class="text-lg font-semibold" style="color: var(--color-typo-heading)">Expenses</h2>
  <div class="flex gap-2">
    <Button label="Add Expense" icon="pi pi-plus" size="small" @click="openManage(null)" />
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

> CRITICAL distinction from MembershipsTab: ExpensesTab header has `<h2>` on the left and `<Button>` on the right. Only the right-side button(s) are wrapped in `flex gap-2`. If you wrap only one button and place the new button outside the wrapper, the Download button will appear on the far left next to the title.

---

## Shared Patterns

### isExporting Double-Click Guard
**Source:** `src/components/projects/wallecx/VaccinationsTab.vue` line 26 (ref declaration) + line 211 (guard)
**Apply to:** Both `MembershipsTab.vue` and `ExpensesTab.vue`
```typescript
// State declaration
const isExporting = ref(false)

// Top of exportJson():
if (isExporting.value) return;
// ...
isExporting.value = true;
// ... try/catch/finally:
} finally {
  isExporting.value = false;
}
```

### Auth Null Guard
**Source:** `src/components/projects/wallecx/VaccinationsTab.vue` lines 212–215
**Apply to:** Both tab `exportJson()` functions
```typescript
const userId = pb.authStore.record?.id;
if (!userId) {
  toast.error("Session expired. Please log in again.");
  return;
}
```

### Blob Download + Cleanup
**Source:** `src/components/projects/wallecx/VaccinationsTab.vue` lines 242–253
**Apply to:** Both tab `exportJson()` functions
```typescript
const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
  type: "application/json",
});
const url = URL.createObjectURL(blob);
const anchor = document.createElement("a");
anchor.href = url;
anchor.download = `wallecx-{type}-${dayjs().format("YYYY-MM-DD")}.json`;
document.body.appendChild(anchor);
anchor.click();
document.body.removeChild(anchor);
URL.revokeObjectURL(url);
```

### Export Envelope Shape
**Source:** `src/components/projects/wallecx/VaccinationsTab.vue` lines 223–240
**Apply to:** Both tab `exportJson()` functions
```typescript
const exportPayload = {
  exported_at: new Date().toISOString(),
  record_count: allRecords.length,
  records: allRecords.map((r) => ({ /* domain fields only */ })),
};
```

### Toast Success/Error
**Source:** `src/components/projects/wallecx/VaccinationsTab.vue` lines 253–256
**Apply to:** Both tab `exportJson()` functions
```typescript
toast.success("...exported.");      // tab-specific message per D-16
// in catch:
toast.error("Export failed. Please try again.");
```

### requestKey Isolation
**Source:** `src/lib/pocketbase/expenseMapper.ts` lines 11–14 (documentation comment)
**Apply to:** Both export `getFullList` calls
- Memberships export: `requestKey: 'memberships-export'` (NOT `'memberships-getFullList'`)
- Expenses export: `requestKey: 'expenses-export'` (NOT `'expenses-getFullList'`)

---

## Verified Read-Only Files (No Modification Required)

### CQ-01: Already Live
**File:** `src/lib/wallecx/expenseSchema.ts` lines 19–21
```typescript
expense_date: z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format.' })
  .refine(val => dayjs(val, 'YYYY-MM-DD', true).isValid(), { message: 'Date is not a valid calendar date.' }),
```

### CQ-02 Mapper: Already Live
**File:** `src/lib/pocketbase/expenseMapper.ts` lines 23–29
```typescript
return {
  amount: record.amount,
  expense_date: record.expense_date,
  category: record.category,
  description: record.description,
  ...(record.notes !== undefined ? { notes: record.notes } : {}),
};
```

### CQ-02 Test Assertion: Already Live
**File:** `src/lib/pocketbase/__tests__/expenseMapper.spec.ts` lines 59–63
```typescript
it("drops notes when undefined", () => {
  const minimal = makeExpense({ notes: undefined });
  const minimalPayload = mapToUpdateExpense(minimal);
  expect(minimalPayload).not.toHaveProperty("notes");
});
```

---

## No Analog Found

None. All phase-27 file changes have an exact analog in `VaccinationsTab.vue`.

---

## Metadata

**Analog search scope:** `src/components/projects/wallecx/`, `src/lib/wallecx/`, `src/lib/pocketbase/`, `src/types/wallecx/`
**Files read:** 8 (VaccinationsTab.vue, MembershipsTab.vue, ExpensesTab.vue, expenseSchema.ts, expenseMapper.ts, expenseMapper.spec.ts, memberships/types.d.ts, expenses/types.d.ts)
**Pattern extraction date:** 2026-05-22
