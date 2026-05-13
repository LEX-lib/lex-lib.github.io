---
phase: 10-tabs-shell-vaccinationstab-extraction
reviewed: 2026-05-13T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/components/projects/wallecx/VaccinationsTab.vue
  - src/components/projects/wallecx/MembershipsTab.vue
  - src/components/projects/wallecx/WallecxApp.vue
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-05-13T00:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files were reviewed covering the Tabs shell extraction work: `WallecxApp.vue` (new thin shell wrapping PrimeVue `Tabs`), `VaccinationsTab.vue` (extracted tab component containing the full vaccinations feature), and `MembershipsTab.vue` (placeholder stub).

The overall quality is high. The extraction is clean, logic is well-commented, and edge cases (group panel sync on delete/update, empty states, token refresh) are handled thoughtfully. Three correctness issues were found — one stale-data bug (open drawer not refreshed on record creation), one potential z-index/overlay issue with `ConfirmDialog` placement, and one missing token refresh for file previews. Two informational items cover a forward type reference and a minor type inaccuracy.

## Warnings

### WR-01: Open group drawer shows stale records after `onCreated`

**File:** `src/components/projects/wallecx/VaccinationsTab.vue:248-253`

**Issue:** `onCreated` pushes the new record and re-sorts `records.value`, which causes `groupedVaccinations` to recompute. However `selectedGroup` holds a *snapshot* `VaccineGroup` object, not a reactive reference derived from `groupedVaccinations`. When the drawer is open for a group and the user creates a new vaccination of the same type in the same session, the drawer's `VaccinationGroupPanel` continues displaying the old `records` array — it will be missing the newly created record until the drawer is closed and reopened.

This is inconsistent with `onUpdated` (lines 263-269) and `deleteRecord` (lines 294-299), both of which explicitly refresh `selectedGroup` from the recomputed `groupedVaccinations` snapshot.

**Fix:**
```typescript
function onCreated(created: Vaccinations): void {
  records.value.push(created);
  records.value.sort((a, b) =>
    dayjs(b.date_administered).diff(dayjs(a.date_administered))
  );
  // Sync open drawer — mirrors the pattern in onUpdated and deleteRecord
  if (showGroupPanel.value && selectedGroup.value) {
    const vaccineType = selectedGroup.value.vaccineType;
    const updated = groupedVaccinations.value.find((g) => g.vaccineType === vaccineType) ?? null;
    selectedGroup.value = updated;
    if (!updated) showGroupPanel.value = false;
  }
}
```

---

### WR-02: `ConfirmDialog` mounted inside `TabPanels` content — stacking context risk

**File:** `src/components/projects/wallecx/WallecxApp.vue:33`

**Issue:** `<ConfirmDialog />` is rendered inside `<Card><template #content><Tabs><TabPanels>`. The PrimeVue confirm service is global so the dialog will appear, but mounting it deep inside a `Card` / `Tabs` content area places it inside a potential CSS stacking context created by the card or tab wrapper. This can cause the confirmation overlay to be clipped or appear behind other UI elements (modal dialogs, drawers) that are mounted higher in the DOM via Vue teleport.

PrimeVue `Dialog` and `Drawer` components teleport to `<body>` by default; `ConfirmDialog` also teleports by default in PrimeVue 4, so in practice this may not manifest — but the positioning of `ConfirmDialog` inside tab content is semantically incorrect and fragile against any future `appendTo` overrides.

**Fix:** Move `<ConfirmDialog />` outside the `<Tabs>` and `<Card>` wrappers, as a sibling to `<Card>` or at the root of the template:

```vue
<template>
  <div>
    <Card>
      <template #content>
        <h1 ...>Wallecx</h1>
        <Tabs v-model:value="activeTab">
          <!-- tab content -->
        </Tabs>
      </template>
    </Card>
    <ConfirmDialog />
  </div>
</template>
```

---

### WR-03: `fileToken` has no refresh timer — stale token after ~5 minutes

**File:** `src/components/projects/wallecx/VaccinationsTab.vue:171-184`

**Issue:** `fileToken` is fetched once in `openDetail` (line 175) and stored as component state. There is no periodic refresh for `fileToken`, unlike `listToken` which has a 4-minute `setInterval` (lines 121-149). PocketBase file tokens have a short TTL (~5 minutes by default). If the detail dialog remains open beyond the token TTL, the embedded card image/attachment URL will silently become unauthorised, showing a broken image or a 401 error with no user feedback.

**Fix:** Add a refresh interval for `fileToken` while the detail dialog is open, or re-fetch the token immediately before passing it to `VaccinationDetail`. The simplest approach is a watcher that refreshes when `showDetail` is true:

```typescript
let fileTokenTimer: ReturnType<typeof setInterval> | null = null;

watch(showDetail, (isOpen) => {
  if (isOpen) {
    fileTokenTimer = setInterval(async () => {
      if (!selectedRecord.value?.card) return;
      try {
        fileToken.value = await pb.files.getToken();
      } catch (e) {
        console.warn('VaccinationsTab: fileToken refresh failed', e);
      }
    }, LIST_TOKEN_TTL_MS); // reuse same 4-min interval constant
  } else {
    if (fileTokenTimer) {
      clearInterval(fileTokenTimer);
      fileTokenTimer = null;
    }
  }
});
```

Also clear the interval in `onUnmounted` alongside `listTokenTimer`.

---

## Info

### IN-01: `VaccineGroup` interface declared after its first use

**File:** `src/components/projects/wallecx/VaccinationsTab.vue:27-37`

**Issue:** `selectedGroup` is typed as `ref<VaccineGroup | null>(null)` on line 27, but the `VaccineGroup` interface is declared on lines 33-37 — six lines *below* the first usage. TypeScript resolves interface types within a module regardless of declaration order, so this compiles correctly. However, by convention and for readability, type/interface declarations should precede their first usage. The current ordering can confuse readers who see an unknown type name in the `ref` call before scrolling to its definition.

**Fix:** Move the `VaccineGroup` interface declaration to before the `// --- STATE ---` block (above line 16), or at minimum above line 27 where it is first referenced.

---

### IN-02: `card` field typed as non-optional `string` but treated as falsy in guards

**File:** `src/types/wallecx/vaccinations/types.d.ts:16` / `src/components/projects/wallecx/VaccinationsTab.vue:173`

**Issue:** The `Vaccinations` interface declares `card: string` (non-optional, always a string). In practice PocketBase returns an empty string `""` when no file is attached, so `if (record.card)` on line 173 is the correct guard. However the type declaration implies the field is always a populated string, which is misleading. A reader could reasonably write `record.card.toUpperCase()` without a null check and be surprised when it behaves as an empty string.

**Fix:** Update the type to signal the "no file" case explicitly:

```typescript
card: string;  // empty string when no file is attached; use `if (record.card)` before accessing URL
```

Or use a more precise type with a comment, or `card?: string` (optional), depending on whether the field is always present in the PocketBase response envelope.

---

_Reviewed: 2026-05-13T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
