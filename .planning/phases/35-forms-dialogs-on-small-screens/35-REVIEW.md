---
phase: 35-forms-dialogs-on-small-screens
reviewed: 2026-05-28T10:30:00+08:00
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/components/projects/wallecx/BaseMobileDialog.vue
  - src/components/projects/wallecx/ManageExpense.vue
  - src/components/projects/wallecx/ManageBudget.vue
  - src/components/projects/wallecx/ManageMembership.vue
  - src/components/projects/wallecx/ManageVaccination.vue
  - src/components/projects/wallecx/ExpensesToolbar.vue
  - src/assets/wallecx-overrides.css
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 35: Code Review Report

**Reviewed:** 2026-05-28T10:30:00+08:00
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found (advisory — does not block the phase)

## Summary

Phase 35 migrates four Manage dialogs to a shared `BaseMobileDialog.vue` wrapper that splits
between a bottom `Drawer` (mobile) and a centred `Dialog` (desktop). The core architecture is
sound: the `_bypassGuard` bypass flag is synchronous and race-free as documented; slot routing
is correct and consistent across all four consumers; the `useConfirm` dirty guard fires only on
genuine dismiss paths on mobile; desktop Dialog intentionally has no guard per D-35-08. The
camera/gallery two-affordance bridge routes correctly through existing validation in all three
files that carry it. The FD-01 16px rule and the sticky action-bar CSS are correctly structured.
The inline→popup revert is clean with no leftover imports.

Two warnings were identified: a stuck-save-button risk in ManageExpense/ManageMembership/
ManageVaccination on mid-save mobile dismiss, and a watcher-ordering fragility in
ManageVaccination that produces a false-clean snapshot on first-open of an Edit dialog. Three
info items cover dead code left behind (an unused snapshot field, an unexposed template ref,
and `console.error` calls carried over from pre-phase).

---

## Warnings

### WR-01: isSaving not reset on mobile dismiss — ManageExpense, ManageMembership, ManageVaccination

**Files:**
- `src/components/projects/wallecx/ManageExpense.vue:84`
- `src/components/projects/wallecx/ManageMembership.vue:105`
- `src/components/projects/wallecx/ManageVaccination.vue:80`

**Issue:** When a save is in-flight and the user triggers the dirty guard (backdrop tap / swipe on
mobile), the `confirm.require` dialog appears. If the user taps "Discard" while `isSaving` is
still true, `visible.value` is set to false. The visible watcher fires on close (`isOpen = false`)
but none of these three components reset `isSaving` in that branch. The next time the dialog
opens, all form inputs and the Save button are disabled (`isSaving = true`) until the component
is unmounted.

`ManageBudget.vue` already handles this correctly at line 47:
```ts
if (!isOpen) {
  isSaving.value = false  // MD-02
  return
}
```

The other three dialogs reset `pendingFile` on close but leave `isSaving` unreset. The scenario
requires closing mid-save (very narrow window), but on slow mobile networks it is realistic.

**Fix:** Add `isSaving.value = false` to the `!isOpen` branch of the visible watcher in all
three files:

```ts
// ManageExpense.vue line 84 — ManageMembership.vue line 105 — ManageVaccination.vue line 80
watch(visible, async (isOpen) => {
  if (!isOpen) {
    isSaving.value = false   // add this line
    pendingFile.value = null
    return
  }
  // ...
})
```

---

### WR-02: Snapshot watcher ordering fragility in ManageVaccination — false-clean on first Edit open

**File:** `src/components/projects/wallecx/ManageVaccination.vue:55-97`

**Issue:** Two watchers both respond to `visible` becoming `true`:

1. **Line 55 — `[visible.value, record.value]` watcher** (`immediate: true`) — seeds
   `administeredDate.value` from `record.date_administered`.
2. **Line 80 — `visible` watcher** — takes the dirty snapshot, capturing
   `administeredDate.value?.toISOString()` into `snapshot.administeredDate`.

Vue 3 processes watchers in registration order. Because the `[visible, record]` watcher is
registered first (line 55) and the snapshot watcher is registered second (line 80), when
`visible` rises to `true`:

- Flush 1: `[visible, record]` fires → `administeredDate.value` is set to the record's date.
- Flush 2: `visible` fires → snapshot captures the now-correct `administeredDate.value`.

This ordering is correct in practice and makes the snapshot match the actual field value.

**However**, Vue 3 does not document a stable intra-flush ordering guarantee for two separate
`watch()` calls on different source expressions when they resolve in the same scheduler flush.
The current code works because Vue processes sync watchers in registration order within a flush,
but this is an implementation detail. If the two watchers are ever reordered (e.g., the
snapshot watch is hoisted above the date watch for readability), the snapshot will capture
`administeredDate.value = null` for an Edit open, making the form appear clean until the first
keystroke when `administeredDate` departs from `null`.

The simpler fix eliminates the coupling by reading `administeredDate.value` inside the existing
combined `[visible, record]` watcher rather than splitting across two:

```ts
// Replace the two separate watchers with one combined watcher:
watch(
  () => [visible.value, record.value] as const,
  ([isVisible, rec]) => {
    if (!isVisible) {
      pendingFile.value = null
      return
    }
    // Seed date FIRST, then snapshot
    administeredDate.value = rec ? new Date(rec.date_administered) : null
    dateAdministeredError.value = ""

    const iv = initialValues.value
    snapshot.value = {
      vaccineType: (iv.vaccine_type as string) ?? "",
      vaccineName: (iv.vaccine_name as string) ?? "",
      // ...
      administeredDate: administeredDate.value?.toISOString() ?? null,
    }
  },
  { immediate: true },
)
```

This is low-risk to leave as-is because the current Vue 3 scheduler does respect registration
order, but it warrants a comment documenting the dependency so a future refactor does not
silently break dirty tracking.

---

## Info

### IN-01: Dead field `hasPendingFile` in ManageExpense snapshot

**File:** `src/components/projects/wallecx/ManageExpense.vue:52,97`

**Issue:** The `ExpenseSnapshot` interface declares `hasPendingFile: boolean` (line 52) and it
is written as `hasPendingFile: false` when the snapshot is taken (line 97), but it is never
read in the `isDirty` computed (lines 103-113). The computed checks `pendingFile.value !== null`
directly. The snapshot field is dead code — it occupies space in the interface and the
snapshot object but contributes nothing to correctness.

**Fix:** Remove `hasPendingFile` from the `ExpenseSnapshot` interface and from the snapshot
initialisation:

```ts
interface ExpenseSnapshot {
  amount: number | null
  expenseDate: string
  category: string
  description: string
  notes: string
  // remove hasPendingFile — isDirty checks pendingFile.value directly
}

snapshot.value = {
  amount: amount.value,
  expenseDate: expenseDate.value.toISOString(),
  category: category.value,
  description: description.value,
  notes: notes.value,
  // remove hasPendingFile: false
}
```

---

### IN-02: `formRef` declared but not exposed in BaseMobileDialog

**File:** `src/components/projects/wallecx/BaseMobileDialog.vue:81`

**Issue:** `const formRef = ref<HTMLElement | null>(null)` is declared and bound to the
`<div ref="formRef">` wrapper in the Drawer template (line 103), which correctly enables the
`@focusin` handler. However, `formRef` is not included in `defineExpose` (line 32 exposes only
`closeWithoutGuard`). The comment on line 80 says "enables slot consumers to detect focus
events", implying it was intended for external access, but no consumer currently reaches it via
a template ref on `BaseMobileDialog`. If external access was never intended, the comment is
misleading. If it was intended, it is missing from `defineExpose`.

**Fix (option A — intended for internal use only):** Update the comment to clarify the ref is
only used for the `@focusin` binding:
```ts
// Template ref binds the focusin handler to the form scroll container (FD-06)
const formRef = ref<HTMLElement | null>(null)
```

**Fix (option B — expose it):** Add `formRef` to `defineExpose` if consumers need it:
```ts
defineExpose({ closeWithoutGuard, formRef })
```

---

### IN-03: `console.error` calls carried from pre-phase in ManageMembership, ManageVaccination, ManageBudget

**Files:**
- `src/components/projects/wallecx/ManageMembership.vue:221,307`
- `src/components/projects/wallecx/ManageVaccination.vue:190,267`
- `src/components/projects/wallecx/ManageBudget.vue:113`

**Issue:** These `console.error` calls were present before phase 35 and are carried forward
into the migrated files. They are not a regression introduced by this phase. They log EXIF
strip failures and save failures with a component-qualified prefix, which is useful during
development. However, they will appear in production browser consoles and reveal internal
component names and stack traces. `ManageExpense.vue` does not have equivalent `console.error`
calls, which creates an inconsistency across the four dialogs.

**Fix:** No action required in this phase. If the team wishes to address these, either remove
them uniformly or gate them on an `import.meta.env.DEV` flag. This is pre-existing and outside
Phase 35's scope.

---

## Architecture Notes (no action required)

**BaseMobileDialog dirty guard correctness:** The `_bypassGuard` bypass flag is a plain `let`
(not reactive), set synchronously before `visible.value = false` in `closeWithoutGuard()`. Vue
3's reactive system processes the `visible = false` assignment synchronously in the same
microtask, so the Drawer's `@before-hide` fires (if at all) before any await point. The guard
is reliable for the Save/Cancel close paths. The `onHide` safety-net reset is belt-and-braces.

**Desktop Dialog has no dirty guard by design** (D-35-08). The Dialog uses `v-model:visible`
which lets the X button set `visible=false` directly; `@before-hide` is only wired to the
Drawer. This is documented and intentional.

**ManageMembership ColorPicker invariant:** `cardColor` is stored and saved without a `#`
prefix (line 47, 272). The live swatch applies `'#' + cardColor` for display only (line 391).
The Zod regex validates `/^[0-9a-fA-F]{6}$/` (line 154) which correctly rejects a value
with a leading `#`. The invariant is preserved correctly.

**ManageVaccination two-Form collapse:** Exactly one `<Form id="manage-vaccination-form">`
exists in the template (line 285). `administeredDate` sits visually inside the `<Form>` markup
but is not `name`-bound, so `@primevue/forms` does not own it — matching the documented
#8191 workaround.

**Camera gallery accept lists:** Expense gallery accepts `image/jpeg,image/png,image/webp,
application/pdf` matching the server allowlist. Membership gallery is images-only
(`image/jpeg,image/png,image/webp`) matching Phase 11 D-02. Vaccination gallery accepts
images + PDF consistent with `onFileSelect`'s allowed array. The camera (capture=environment)
inputs are correctly images-only in all three dialogs — a camera cannot produce a PDF.

**CSS sticky action bar:** `.wallecx-manage-actions` uses `position: sticky; bottom: 0`
inside the scrollable Drawer content div. The `padding-bottom: 0.5rem` correctly avoids
doubling the safe-area inset already applied by the Phase 34 `.p-drawer-bottom .p-drawer-content`
rule. In the Dialog branch, the `#footer` slot is outside the scroll container by PrimeVue's
own structure, making sticky unnecessary there.

**FD-01 blast radius:** The `@media (max-width: 640px)` 16px rule targets six PrimeVue
input classes. It is intentionally non-scoped to reach teleported overlays. This is consistent
with the file's existing non-scoped approach for `.p-dialog-content`, `.p-drawer-bottom`, etc.

---

_Reviewed: 2026-05-28_
_Reviewer: Claude Sonnet 4.6 (gsd-code-reviewer)_
_Depth: standard_
