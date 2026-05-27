# Phase 34: Layout Audit & Touch Targets - Pattern Map

**Mapped:** 2026-05-27
**Files analyzed:** 9 new/modified files
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/projects/wallecx/DragHandle.vue` | component (presentational) | — (static markup) | `VaccinationsTab.vue` lines 427-432 (inline pill) | exact |
| `src/assets/wallecx-overrides.css` | config (global CSS) | request-response (CSS override) | `wallecx-overrides.css` lines 18-41 (existing override blocks) | exact |
| `src/components/projects/wallecx/WallecxApp.vue` | component (shell) | event-driven | `WallecxApp.vue` lines 68-109 (existing Tabs + Card safe-area pattern) | exact |
| `src/components/projects/wallecx/ManageMembership.vue` | component (form overlay) | CRUD | `ManageExpense.vue` lines 263-524 (Dialog/Drawer conditional + pill header) | exact |
| `src/components/projects/wallecx/ManageVaccination.vue` | component (form overlay) | CRUD | `ManageExpense.vue` lines 263-524 (Dialog/Drawer conditional + pill header) | exact |
| `src/components/projects/wallecx/VaccinationsTab.vue` | component (tab) | CRUD | `ManageExpense.vue` Drawer `#header` slot + `MembershipsTab.vue` safe-area pattern | role-match |
| `src/components/projects/wallecx/MembershipsTab.vue` | component (tab) | CRUD | `MembershipsTab.vue` lines 343-366 (existing bottom Drawer + pill) | exact |
| `src/components/projects/wallecx/ExpensesTab.vue` | component (tab) | CRUD | `ExpensesTab.vue` lines 250-269 (existing receipt Drawer + pill) | exact |
| `src/components/projects/wallecx/MembershipDetail.vue` | component (detail overlay) | request-response | `MembershipDetail.vue` lines 167-203 (scan overlay `fixed inset-0`) | exact |
| `index.html` | config (static HTML) | — | `vite.config.ts` lines 28-43 (`// LOCKED:` comment convention) | partial |

---

## Pattern Assignments

### `src/components/projects/wallecx/DragHandle.vue` (component, static)

**Analog:** `src/components/projects/wallecx/VaccinationsTab.vue` lines 427-432

**Source pill markup** (VaccinationsTab.vue lines 427-432):
```html
<div
  v-if="isMobile"
  class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600"
  aria-hidden="true"
></div>
```

**New component — copy this exactly** (no script block, no props):
```vue
<!-- src/components/projects/wallecx/DragHandle.vue
     Phase 34 D-34-03: Visual-only drag-handle pill for bottom-sheet Drawers.
     aria-hidden="true" — decorative; not interactive; no swipe-to-dismiss (Phase 35).
     Callers control v-if="isMobile" gating — this component renders unconditionally. -->
<template>
  <div
    class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600"
    aria-hidden="true"
  />
</template>
```

**Usage pattern to replace inline pills** (from `ManageBudget.vue` lines 169-173 and `ManageExpense.vue` line 403 — same structure in all 5 existing Drawer `#header` slots):
```html
<!-- BEFORE: -->
<template #header>
  <div class="flex flex-col items-center w-full gap-1">
    <div class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true"></div>
    <span class="font-semibold">{{ dialogHeader }}</span>
  </div>
</template>

<!-- AFTER: -->
<template #header>
  <div class="flex flex-col items-center w-full gap-1">
    <DragHandle />
    <span class="font-semibold">{{ dialogHeader }}</span>
  </div>
</template>
```

Import: `import DragHandle from './DragHandle.vue'`

Note: `VaccinationsTab.vue` pill has `v-if="isMobile"` on the pill div itself; the AFTER pattern removes that condition since the component always renders (the surrounding `<Drawer position="bottom">` is already mobile-only or `v-else` to Dialog). For the reactive-position Drawer in VaccinationsTab (lines 420-444), keep `v-if="isMobile"` gating on `<DragHandle v-if="isMobile" />` since the same Drawer appears on desktop too.

---

### `src/assets/wallecx-overrides.css` (config, global CSS)

**Analog:** `src/assets/wallecx-overrides.css` lines 1-57 (existing rule blocks)

**Existing selector/comment pattern to match** (lines 18-41):
```css
/*
 * MOB-05: PrimeVue Dialog content height constraint for Wallecx dialogs.
 * Imported exclusively from WallecxApp.vue so the rule is bundled with the
 * Wallecx lazy-loaded chunk, keeping it out of the global stylesheet...
 *
 * A non-scoped approach is required because PrimeVue's <Dialog> teleports
 * its DOM to <body>, so scoped data-v- attributes do not reach the rendered
 * .p-dialog-content element.
 */
.p-dialog-content {
  max-height: 80dvh;
  overflow-y: auto;
}

/* Phase 17 D-01, D-02: bottom-anchored Drawer height (mobile bottom sheets).
 * ...
 * `!important` is required because PrimeVue's base stylesheet injects
 * `.p-drawer-bottom .p-drawer { height: 10rem }` at the same selector
 * specificity AFTER our override in source order, so it would otherwise win. */
.p-drawer-bottom .p-drawer {
  height: 85dvh !important;
}
```

**Four new rule blocks to append — copy existing comment+rule style:**

```css
/* Phase 34 LT-01: 44×44 touch-target floor for icon-only PrimeVue buttons.
 *
 * Root cause: main.ts applies p-button-sm globally via pt.button.root, and
 * Aura's button.sm.iconOnlyWidth = 2rem (32px) — below the 44px floor.
 * .p-button-icon-only is added by PrimeVue only when NO label text is present.
 * Label buttons are unaffected (their height is set by padding + line-height).
 * Does NOT use !important — specificity is sufficient over Aura element rules. */
.p-button.p-button-icon-only {
  min-width: 44px;
  min-height: 44px;
}

/* Phase 34 LT-01: Top-level WallecxApp tab triggers only.
 * WallecxApp.vue must add class="wallecx-main-tabs" to its <Tabs> wrapper.
 * Period tabs (.wallecx-period-tabs) and sub-tabs (.wallecx-sub-tabs) are
 * excluded — they manage their own min-height via scoped :deep rules. */
.wallecx-main-tabs .p-tab {
  min-height: 44px;
}

/* Phase 34 LT-05/D-34-01: Sticky TabList on mobile (≤639px).
 * Overrides PrimeVue's .p-tablist default (position:relative; overflow:hidden).
 * The page (not the Card) is the scroll container for WallecxApp on mobile.
 * overflow:visible removes the clip so the active ink-bar renders correctly.
 * !important required — PrimeVue base CSS sets position:relative at equal specificity. */
@media (max-width: 639px) {
  .wallecx-main-tabs .p-tablist {
    position: sticky !important;
    top: env(safe-area-inset-top);
    z-index: 10;
    background: var(--p-tabs-tablist-background);
    overflow: visible !important;
  }

  /* Phase 34 LT-05: Per-tab sticky toolbar. Class added by tab components via
   * :class="isMobile ? 'wallecx-tab-toolbar' : ''". top offsets below tablist
   * (≈44px tab height + env(safe-area-inset-top) for notch clearance). */
  .wallecx-tab-toolbar {
    position: sticky;
    top: calc(env(safe-area-inset-top) + 52px);
    z-index: 9;
    background: var(--p-card-background, white);
    border-bottom: 1px solid var(--p-card-border-color, #e5e7eb);
  }

  /* Dark-mode toolbar background — matches existing .my-app-dark .p-card override
   * (--p-card-background: #1a1f2e set on line 53 of this file). */
  .my-app-dark .wallecx-tab-toolbar {
    background: #1a1f2e;
  }
}

/* Phase 34 LT-03/D-34-04: Safe-area bottom padding inside bottom Drawers.
 * Pads .p-drawer-content so the last form field / action button clears the
 * iOS home indicator / Android gesture bar.
 * Uses padding-bottom — does NOT change the 85dvh panel height.
 * max() ensures at least 1rem even on devices with no home indicator. */
.p-drawer-bottom .p-drawer-content {
  padding-bottom: max(env(safe-area-inset-bottom), 1rem);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

**Key constraint:** The existing `.my-app-dark .p-card` rule on line 52-56 already sets `--p-card-background: #1a1f2e`. The `.my-app-dark .wallecx-tab-toolbar { background: #1a1f2e }` must reference the same value, not a CSS variable (because the variable is set on `.p-card`, not `:root`, and the toolbar may be outside `.p-card` in the DOM).

---

### `src/components/projects/wallecx/WallecxApp.vue` (shell component)

**Analog:** `src/components/projects/wallecx/WallecxApp.vue` lines 67-109 (existing template)

**Existing template pattern** (lines 67-109 — the Card + Tabs structure to modify):
```html
<Card
    class="overscroll-none"
    :style="{
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
    }"
  >
  <template #content>
    <h1 class="text-2xl font-bold mb-4" style="color: var(--color-typo-heading)">Wallecx</h1>
    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="vaccinations">...</Tab>
        <Tab value="memberships">...</Tab>
        <Tab value="expenses">...</Tab>
      </TabList>
      <TabPanels>...</TabPanels>
    </Tabs>
    <ConfirmDialog />
  </template>
</Card>
```

**Change required — add `class="wallecx-main-tabs"` to `<Tabs>`:**
```html
<Tabs v-model:value="activeTab" class="wallecx-main-tabs">
```

That single class addition is the only template change. The CSS rule in `wallecx-overrides.css` (`.wallecx-main-tabs .p-tablist { position: sticky ... }`) does the rest. No script changes required.

**No new imports needed** — `isMobile` is NOT imported in WallecxApp.vue currently; the sticky behavior is CSS-only (`@media (max-width: 639px)`), so no JS gating is needed in this file.

---

### `src/components/projects/wallecx/ManageMembership.vue` (form overlay — ADD Drawer branch)

**Analog:** `src/components/projects/wallecx/ManageExpense.vue` lines 263-524

**Existing imports pattern** (ManageExpense.vue lines 1-22 — what to add to ManageMembership):
```typescript
// ManageExpense already imports:
import { useIsMobile } from '@/composables/useIsMobile'
const isMobile = useIsMobile()
```

ManageMembership.vue currently does NOT import `useIsMobile`. Add these two lines to `<script setup>`:
```typescript
import { useIsMobile } from '@/composables/useIsMobile'
const isMobile = useIsMobile()
```

Also add:
```typescript
import DragHandle from './DragHandle.vue'
```

**Dialog/Drawer conditional pattern** (ManageExpense.vue lines 263-267 and 393-406):
```html
<!-- Desktop: centered Dialog -->
<Dialog
  v-if="!isMobile"
  modal
  v-model:visible="visible"
  :header="dialogHeader"
  :style="{ width: '40vw' }"
  :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
  :closable="!isSaving"
  @hide="onHide"
>
  <form @submit.prevent="onSubmit" class="space-y-4">
    <!-- ... form fields ... -->
  </form>
</Dialog>

<!-- Mobile: bottom Drawer (85dvh cap via wallecx-overrides.css already applied) -->
<Drawer
  v-else
  v-model:visible="visible"
  position="bottom"
  :show-close-icon="!isSaving"
  @hide="onHide"
>
  <template #header>
    <div class="flex flex-col items-center w-full gap-1">
      <DragHandle />
      <span class="font-semibold">{{ dialogHeader }}</span>
    </div>
  </template>
  <form @submit.prevent="onSubmit" class="space-y-4">
    <!-- ... same form fields as Dialog branch ... -->
  </form>
</Drawer>
```

**ManageMembership-specific constraint:** The `cardColor` field uses PrimeVue `<ColorPicker>` with a direct `v-model="cardColor"` ref (PrimeVue issue #8135 workaround — explicitly noted in the script comment at line 37-42 of ManageMembership.vue). This ref is already in `<script setup>` and shared by both branches. The Drawer branch is a template duplication of the Dialog form body — no logic duplication.

---

### `src/components/projects/wallecx/ManageVaccination.vue` (form overlay — ADD Drawer branch)

**Analog:** `src/components/projects/wallecx/ManageExpense.vue` lines 263-524

**Same Dialog/Drawer conditional pattern as ManageMembership**, with one critical difference: ManageVaccination uses `@primevue/forms` `<Form v-slot="$form">` (already imported at ManageVaccination.vue lines 3-4) for most fields. The `administeredDate` is a direct v-model ref (ManageVaccination.vue lines 28-29).

**Imports to add to ManageVaccination script setup:**
```typescript
import { useIsMobile } from '@/composables/useIsMobile'
import DragHandle from './DragHandle.vue'

const isMobile = useIsMobile()
```

**Drawer branch template — replicate the existing `<Form>` structure** (ManageVaccination currently renders Dialog-only; the `<Form>` with `v-slot="$form"` slot scope must be duplicated verbatim in the Drawer branch):
```html
<Drawer
  v-else
  v-model:visible="visible"
  position="bottom"
  :show-close-icon="!isSaving"
  @hide="onHide"
>
  <template #header>
    <div class="flex flex-col items-center w-full gap-1">
      <DragHandle />
      <span class="font-semibold">{{ dialogHeader }}</span>
    </div>
  </template>
  <Form
    v-slot="$form"
    :initialValues="initialValues"
    :resolver="resolver"
    @submit="onFormSubmit"
    class="space-y-4"
  >
    <!-- identical field markup as Dialog branch -->
    <!-- administeredDate still uses v-model="administeredDate" directly -->
  </Form>
</Drawer>
```

**Why two `<Form>` instances work:** Only one renders at a time via `v-if`/`v-else`. Each `<Form>` instance provides its own inject context to its subtree. The `InputText name="vaccine_type"` binds to the enclosing `<Form>` by name — no conflict between the two branches.

---

### `src/components/projects/wallecx/VaccinationsTab.vue` (tab — sticky toolbar + DragHandle swap)

**Analog:** `src/components/projects/wallecx/VaccinationsTab.vue` lines 420-444 (existing Drawer), plus `ManageExpense.vue` Drawer pattern

**Existing Drawer pill** (VaccinationsTab.vue lines 426-432) — swap inline pill for component:
```html
<!-- BEFORE (lines 426-432): -->
<div
  v-if="isMobile"
  class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600"
  aria-hidden="true"
></div>

<!-- AFTER: -->
<DragHandle v-if="isMobile" />
```

Import: `import DragHandle from './DragHandle.vue'` (add to existing imports block at line 1-13).

**Sticky toolbar wrapper pattern** — wrap the existing `<WallecxToolbar>` call (currently rendered as a direct child before the list):
```html
<!-- Sticky toolbar wrapper — class applied on mobile only -->
<div :class="isMobile ? 'wallecx-tab-toolbar' : ''">
  <WallecxToolbar ... />
</div>
```

`isMobile` is already imported via `useIsMobile()` at line 12 of VaccinationsTab.vue.

---

### `src/components/projects/wallecx/MembershipsTab.vue` (tab — sticky toolbar + DragHandle swap)

**Analog:** `src/components/projects/wallecx/MembershipsTab.vue` lines 343-366 (existing bottom Drawer)

**Existing Drawer pill** (MembershipsTab.vue lines 351-355) — unconditional pill:
```html
<div
  class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600"
  aria-hidden="true"
></div>
```

Swap for `<DragHandle />` (no `v-if` needed — this Drawer only appears in the `v-else` mobile branch, so it's already mobile-only).

Import: `import DragHandle from './DragHandle.vue'`

**Sticky toolbar wrapper** — same pattern as VaccinationsTab:
```html
<div :class="isMobile ? 'wallecx-tab-toolbar' : ''">
  <WallecxToolbar ... />
</div>
```

---

### `src/components/projects/wallecx/ExpensesTab.vue` (tab — sticky toolbar + DragHandle swap)

**Analog:** `src/components/projects/wallecx/ExpensesTab.vue` lines 250-269 (existing receipt Drawer)

**Existing receipt Drawer pill** (ExpensesTab.vue lines 257-259):
```html
<div class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true"></div>
```

Swap for `<DragHandle />`.

Import: `import DragHandle from './DragHandle.vue'`

**Sticky toolbar wrapper** — same pattern; `ExpensesToolbar` replaces `WallecxToolbar`:
```html
<div :class="isMobile ? 'wallecx-tab-toolbar' : ''">
  <ExpensesToolbar ... />
</div>
```

Note: `ManageExpense.vue` and `ManageBudget.vue` also have inline pills. Those are NOT in tab files — they're self-contained overlay components. Both get `<DragHandle />` swap + `import DragHandle from './DragHandle.vue'`.

---

### `src/components/projects/wallecx/MembershipDetail.vue` (detail overlay — safe-area on scan overlay)

**Analog:** `src/components/projects/wallecx/MembershipDetail.vue` lines 167-203 (the scan overlay itself)

**Existing scan overlay** (MembershipDetail.vue lines 167-203):
```html
<Teleport to="body">
  <div
    v-if="showScanOverlay"
    class="fixed inset-0 flex flex-col items-center justify-center"
    style="z-index: 9999; background: #ffffff; filter: brightness(1.4);"
    role="dialog"
    aria-modal="true"
    aria-label="Barcode scan view"
    @keydown.esc.stop="closeScanOverlay"
  >
    <!-- Close button — always visible, top-right, 48px touch target -->
    <button
      class="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full"
      style="background: rgba(0,0,0,0.08);"
      @click="closeScanOverlay"
      aria-label="Close scan view"
    >
```

**Change: add safe-area padding to overlay div and recalculate close button `top`:**
```html
<div
  v-if="showScanOverlay"
  class="fixed inset-0 flex flex-col items-center justify-center"
  style="z-index: 9999; background: #ffffff; filter: brightness(1.4);
         padding-top: env(safe-area-inset-top);
         padding-bottom: env(safe-area-inset-bottom);"
  role="dialog"
  aria-modal="true"
  aria-label="Barcode scan view"
  @keydown.esc.stop="closeScanOverlay"
>
  <button
    class="absolute right-4 w-12 h-12 flex items-center justify-center rounded-full"
    style="top: calc(1rem + env(safe-area-inset-top)); background: rgba(0,0,0,0.08);"
    @click="closeScanOverlay"
    aria-label="Close scan view"
  >
```

Two changes: (1) inline `style` on the overlay div gains the two `padding-*: env()` lines; (2) close button class `top-4` becomes `style="top: calc(1rem + env(safe-area-inset-top))"` so it clears the notch.

No script change. No composable import needed — direct `env()` strings in inline style are resolved by the browser without JavaScript.

---

### `index.html` (static HTML — LOCKED comment on viewport meta)

**Analog:** `vite.config.ts` lines 28 and 43 — the `// LOCKED:` comment convention:
```typescript
registerType: "prompt",          // LOCKED: never 'autoUpdate' — CRUD forms have unsaved state
scope: "/",                    // LOCKED: scope "/" per STATE.md — NOT "/projects/wallecx"
navigateFallback: "index.html",  // LOCKED: mandatory for SPA offline — no leading slash
```

**HTML comment equivalent for `index.html` line 6:**
```html
<!-- LOCKED: viewport-fit=cover is required for env(safe-area-inset-*) non-zero values (CON-VIEWPORT-FIT / LT-09). Do not remove. -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
```

The comment goes on the line immediately before the `<meta name="viewport">` tag. The tag itself is unchanged — `viewport-fit=cover` and `interactive-widget=resizes-content` are already present at line 6.

---

## Shared Patterns

### isMobile import convention
**Source:** `src/composables/useIsMobile.ts` (used by ManageExpense, VaccinationsTab, MembershipsTab, ExpensesTab, ManageBudget)
**Apply to:** ManageMembership.vue, ManageVaccination.vue (both currently missing this import)
```typescript
import { useIsMobile } from '@/composables/useIsMobile'
const isMobile = useIsMobile()
```
Note: `useMobileEnv` is NOT used for the `isMobile` check — existing components use `useIsMobile()` directly. Do not switch to `useMobileEnv()` for `isMobile`; the two composables share the same 639px breakpoint via delegation.

### Drawer `#header` slot structure
**Source:** `src/components/projects/wallecx/ManageExpense.vue` lines 401-406, `ManageBudget.vue` lines 169-174
**Apply to:** All 7 bottom-sheet Drawer `#header` slots (5 existing swaps + 2 new Drawer branches)
```html
<template #header>
  <div class="flex flex-col items-center w-full gap-1">
    <DragHandle />
    <span class="font-semibold">{{ dialogHeader }}</span>
  </div>
</template>
```

### Dialog/Drawer conditional pattern (v-if / v-else)
**Source:** `src/components/projects/wallecx/ManageExpense.vue` lines 263-267 and 393-397
```html
<Dialog v-if="!isMobile" modal v-model:visible="visible" :header="dialogHeader" ... @hide="onHide">
  <form @submit.prevent="onSubmit" class="space-y-4">...</form>
</Dialog>

<Drawer v-else v-model:visible="visible" position="bottom" :show-close-icon="!isSaving" @hide="onHide">
  <template #header>...</template>
  <form @submit.prevent="onSubmit" class="space-y-4">...</form>
</Drawer>
```

### CSS override comment/rule style
**Source:** `src/assets/wallecx-overrides.css` lines 1-41
**Apply to:** All new rules appended to wallecx-overrides.css
Pattern: block comment with phase/requirement reference, "why" explanation, and specificity note — then the CSS rule immediately below.

### Safe-area inset in inline style (no JS needed)
**Source:** `src/components/projects/wallecx/WallecxApp.vue` lines 70-74
```html
:style="{
  paddingBottom: 'env(safe-area-inset-bottom)',
  paddingLeft: 'env(safe-area-inset-left)',
  paddingRight: 'env(safe-area-inset-right)',
}"
```
**Apply to:** `MembershipDetail.vue` scan overlay (top + bottom). Use direct string `'env(safe-area-inset-top)'` — no composable import needed. Browser resolves `env()` natively.

---

## No Analog Found

None — all 9 files have direct analogs in the codebase.

---

## Metadata

**Analog search scope:** `src/components/projects/wallecx/`, `src/assets/`, `src/composables/`, `index.html`, `vite.config.ts`
**Files scanned:** 15 source files read directly
**Pattern extraction date:** 2026-05-27
