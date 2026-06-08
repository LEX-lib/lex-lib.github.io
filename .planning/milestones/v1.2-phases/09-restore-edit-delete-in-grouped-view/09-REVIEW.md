---
phase: 09-restore-edit-delete-in-grouped-view
reviewed: 2026-05-13T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/components/projects/wallecx/VaccinationGroupPanel.vue
  - src/components/projects/wallecx/WallecxApp.vue
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-05-13
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Phase 9 restores Edit and Delete CRUD actions to the group detail Drawer via two targeted changes: extending `defineEmits` in `VaccinationGroupPanel.vue` and adding `@edit`/`@delete` bindings in `WallecxApp.vue`. The emit/binding wiring is correct — no event name mismatches, no missing handlers. Security posture is sound: all delete confirmation uses plain-text interpolation (no XSS vector), event payloads are typed `Vaccinations` objects from a trusted PocketBase response, and no untrusted data crosses a security boundary.

The critical concern is stale state: `selectedGroup` is a plain `ref` snapshot, not a reactive derived value, so the open Drawer continues displaying pre-edit or pre-delete records after a successful CRUD operation. This produces two related UX bugs detailed below. Additionally, a dead prop in `VaccinationGroupPanel` and a missing accessible column header are flagged as informational.

---

## Warnings

### WR-01: Drawer shows stale records after Delete — deleted item remains visible

**File:** `src/components/projects/wallecx/WallecxApp.vue:265-290` and `:388-404`

**Issue:** After a successful delete, `deleteRecord` splices the record from `records.value` and `groupedVaccinations` recomputes correctly. However, `selectedGroup` is a plain `ref<VaccineGroup | null>` set once by `openGroupPanel`. Its `.records` array is a snapshot taken at the time the Drawer was opened and does not update when `records.value` changes. The `VaccinationGroupPanel` receives `selectedGroup.records` as a prop, so it continues displaying the deleted row until the user closes and reopens the Drawer. If the deleted record was the only one in the group, the Drawer shows an empty-looking table with a stale single row.

**Fix:** Close the Drawer after a confirmed delete, or update `selectedGroup` reactively. The simplest safe fix is to close the Drawer on success inside `deleteRecord`:

```ts
async function deleteRecord(record: Vaccinations): Promise<void> {
  try {
    await pb.collection("wallecx_vaccinations").delete(record.id);
    const idx = records.value.findIndex((r) => r.id === record.id);
    if (idx !== -1) records.value.splice(idx, 1);
    // Close the group Drawer so the stale selectedGroup snapshot is not shown
    showGroupPanel.value = false;
    toast.success("Vaccination deleted.");
  } catch (e: unknown) {
    toast.error("Failed to delete. Please try again.");
    console.error("WallecxApp: delete failed", e);
  }
}
```

---

### WR-02: Drawer shows stale records after Edit — updated fields not reflected

**File:** `src/components/projects/wallecx/WallecxApp.vue:256-263` and `:396-404`

**Issue:** After `ManageVaccination` emits `updated`, `onUpdated` patches `records.value[idx]` and re-sorts. `groupedVaccinations` recomputes. However, `selectedGroup` still holds the old snapshot object with the pre-edit record. The `VaccinationGroupPanel` prop `records` comes from `selectedGroup.records`, so the table inside the open Drawer continues showing the old vaccine name, date, lot number, and dose until the user closes and reopens the Drawer.

**Fix:** Close the Drawer after a successful save, consistent with the delete fix above. Alternatively, re-derive `selectedGroup` reactively from `groupedVaccinations` by key after `onUpdated` fires:

```ts
function onUpdated(updatedRecord: Vaccinations): void {
  const idx = records.value.findIndex((r) => r.id === updatedRecord.id);
  if (idx !== -1) records.value[idx] = updatedRecord;
  records.value.sort((a, b) =>
    dayjs(b.date_administered).diff(dayjs(a.date_administered))
  );
  // Refresh selectedGroup so the open Drawer reflects the updated record
  if (selectedGroup.value) {
    const refreshed = groupedVaccinations.value.find(
      (g) => g.vaccineType === selectedGroup.value!.vaccineType
    );
    selectedGroup.value = refreshed ?? null;
    if (!selectedGroup.value) showGroupPanel.value = false;
  }
}
```

---

### WR-03: `data` slot is untyped — emit type safety is nominal only

**File:** `src/components/projects/wallecx/VaccinationGroupPanel.vue:34-39`

**Issue:** PrimeVue's DataTable `#body` slot destructures `data` as `any`. The `emit('edit', data)` and `emit('delete', data)` calls pass an `any` value into typed emit signatures (`edit: [record: Vaccinations]`). TypeScript accepts this because `any` satisfies every type. A future column type change or DataTable value type mismatch would not be caught at compile time.

**Fix:** Add an explicit type assertion at the slot level to restore the type guarantee:

```html
<template #body="{ data }: { data: Vaccinations }">
  <div class="flex gap-1">
    <Button size="small" label="View" @click="emit('view', data)" />
    <Button size="small" icon="pi pi-pencil" label="Edit" severity="secondary" @click="emit('edit', data)" />
    <Button size="small" icon="pi pi-trash" label="Delete" severity="danger" @click="emit('delete', data)" />
  </div>
</template>
```

---

## Info

### IN-01: Dead prop — `listToken` declared but never consumed

**File:** `src/components/projects/wallecx/VaccinationGroupPanel.vue:6-8`

**Issue:** The `listToken: string` prop is declared in `defineProps` with a comment acknowledging it is unused. It is not referenced anywhere in the script or template. Depending on linter configuration, this will produce an "unused variable" warning. If there is no near-term plan to use it (e.g., for signed thumbnail URLs in the panel), removing it reduces the public API surface and eliminates the lint noise.

**Fix:** Remove the prop if it serves no purpose in the panel; the parent can re-add it when needed:

```ts
defineProps<{
  records: Vaccinations[];
  // listToken removed — panel columns do not render file attachments
}>();
```

If it is intentionally reserved for future use, document that intent more explicitly in the comment.

---

### IN-02: Actions column has no accessible header text

**File:** `src/components/projects/wallecx/VaccinationGroupPanel.vue:33`

**Issue:** `<Column header="">` renders a column with an empty string header. Screen readers may announce this as a blank or unnamed column. Adding a descriptive but visually hidden label improves accessibility without changing the visual layout.

**Fix:** Use a non-empty but visually hidden header label, or apply PrimeVue's `headerClass` with a visually-hidden utility:

```html
<Column header="Actions" style="width: 14rem">
```

If the visual design requires no visible header text, the `header` value can still be set and hidden via CSS (`sr-only`-equivalent), but providing the string to PrimeVue is the simplest correct fix here.

---

_Reviewed: 2026-05-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
