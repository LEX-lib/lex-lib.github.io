# Phase 35: Forms & Dialogs on Small Screens — Research

**Researched:** 2026-05-27
**Domain:** PrimeVue 4.5.5 mobile form UX, Vue 3.5 slot-based wrappers, iOS/Android keyboard avoidance, camera capture
**Confidence:** HIGH (all key claims verified against node_modules or codebase source)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-35-01:** `BaseMobileDialog.vue` OWNS the Dialog-vs-Drawer decision. Internally renders `<Dialog>` (desktop) or `<Drawer position="bottom">` (mobile) via `useMobileEnv().isMobile`. Each Manage dialog collapses its Phase-34 `v-if="!isMobile"` / `v-else` branches into ONE `<BaseMobileDialog>` instance — form body in `#default` slot, Save/Cancel in `#actions` slot.
- **D-35-02:** Form renders ONCE, inside the slot. Eliminates Phase-34 v-if/v-else form duplication. ColorPicker direct-v-model (#8135) and `administeredDate` direct-v-model (#8191) stay in the child — wrapper only swaps the shell.
- **D-35-03:** Wrapper contract: `v-model:visible`, `:title`, `:is-dirty`, `:is-saving`; slots `#default` (form body) and `#actions` (Save/Cancel). DragHandle, bottom safe-area inset, sticky action bar, and dirty-guard built INTO the wrapper.
- **D-35-04:** Migration order fixed: ManageExpense → ManageBudget → ManageMembership → ManageVaccination.
- **D-35-05:** Action bar = `position: sticky; bottom: 0` inside scrollable dialog content, padded by `max(env(safe-area-inset-bottom), …)`. Android (`interactive-widget=resizes-content`) shrinks viewport naturally. iOS handled by auto-scroll below.
- **D-35-06:** Focused-input auto-scroll = `scrollIntoView({ block: 'center' })` on `focusin`. VisualViewport escalation only if iOS device testing proves bar is hidden.
- **D-35-07:** `isDirty` = current form values vs on-open snapshot (real diff, not touched flag).
- **D-35-08:** "Discard changes?" `useConfirm` fires ONLY on MOBILE Drawer dismissal (backdrop/swipe/Esc). Desktop Dialog keeps free-dismiss.
- **D-35-09:** Reuses single shell-level `<ConfirmDialog>` at WallecxApp.vue. Guard intercepts BEFORE Drawer closes (block `update:visible`→false, show confirm, close on accept).
- **D-35-10:** Two affordances wherever image upload exists: "Take photo" (`capture="environment"`) + "Choose from gallery" (plain input). Both feed existing EXIF/compression/WebP path.
- **D-35-11:** Upload sites: ManageExpense (receipt), ManageVaccination (card/record), ManageMembership (card_image). ManageBudget has NO upload.
- **D-35-12:** FD-01 CSS rule in `wallecx-overrides.css`: `@media (max-width: 640px) { .p-inputtext, .p-inputnumber-input, .p-textarea, .p-select-label, .p-multiselect-label, .p-datepicker-input { font-size: 16px !important } }`
- **D-35-13:** FD-04 DatePicker gets `:touchUI="isMobile"` at all sites. (See CRITICAL FINDING below — this prop does not exist in PrimeVue 4.5.5; the planner must substitute the correct approach.)

### Claude's Discretion

- FD-03 per-field attribute mapping (inputmode, autocomplete, enterkeyhint exact values per input).
- Exact `BaseMobileDialog` prop names, slot names, and internal markup.
- Whether the sticky action bar needs a top border/shadow separator.

### Deferred Ideas (OUT OF SCOPE)

- VisualViewport-based keyboard handling — only if sticky-bottom + scrollIntoView fails on real iOS device (Phase 38).
- iPad-768 tablet Drawer-vs-Dialog refinement — BaseMobileDialog uses binary isMobile split.
- Real-device keyboard/zoom/camera UAT — belongs to Phase 38.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LT-08 | Sticky bottom action bars visible above virtual keyboard in all 4 Manage dialogs | D-35-05/06: sticky CSS + scrollIntoView; Drawer `before-hide` event for intercept |
| FD-01 | Global `@media (max-width: 640px)` 16px rule in wallecx-overrides.css on 5 PrimeVue input classes | Verified class names in node_modules; all 5 classes confirmed correct |
| FD-03 | inputmode / autocomplete / enterkeyhint on every input across all 4 dialogs | Per-dialog field map in this research; exact values in Discretion section |
| FD-04 | DatePicker full-screen touch mode on mobile | CRITICAL: `touchUI` prop does NOT exist in PrimeVue 4.5.5; alternative approach documented |
| FD-05 | Camera capture + gallery fallback on receipt/scan affordances | Raw `<input type="file">` approach; FileUpload `pt.input` passthrough; 3 upload sites mapped |
| FD-06 | Focused input auto-scrolls into view when virtual keyboard opens | `scrollIntoView({ block: 'center' })` on `focusin` listener on form container |
| FD-07 | BaseMobileDialog.vue wrapper established; 4 dialogs migrated in order | Full skeleton in Code Examples section |
| FD-09 | Dirty-state guard on Drawer dismissal via useConfirm | Drawer `before-hide` emit + `dismissable` prop: full pattern documented |
</phase_requirements>

---

## Summary

Phase 35 migrates all 4 Wallecx Manage dialogs to a shared `BaseMobileDialog.vue` wrapper that owns the Dialog/Drawer split, sticky action bars, dirty-state guard, and camera capture affordances. All infrastructure decisions are locked (D-35-01..13). The research confirms exact PrimeVue 4.5.5 API surfaces, surfaces one critical discrepancy from the CONTEXT (FD-04 `touchUI`), and provides concrete implementation patterns for every locked decision.

**Critical finding: D-35-13 `touchUI` prop does NOT exist in PrimeVue 4.5.5 DatePicker.** [VERIFIED: node_modules/primevue/datepicker/index.d.ts + index.mjs] The prop existed in the old Calendar component (PrimeVue 3.x) but was dropped when Calendar was renamed to DatePicker in PrimeVue 4. The Phase 33 smoke test verified the DatePicker component worked — it did not verify `touchUI` as a prop. The `breakpoint` prop (default `769px`) controls responsive breakpoints; `inline: true` makes the calendar always-visible inline. The CONTEXT description of FD-04 must be re-interpreted: on mobile, use `inline` mode inside a `<Dialog>` or use the existing overlay DatePicker as-is with the sticky form scroll pattern. **The planner must decide the FD-04 approach** — three viable options are documented below.

**Drawer `before-hide` event enables the dirty guard** [VERIFIED: node_modules/primevue/drawer/index.d.ts]. The Drawer emits `before-hide` BEFORE the close animation. Combined with `:dismissable="false"` to block automatic close, this is the correct intercept point for D-35-09 without wrestling with `update:visible`.

**FileUpload does not support `capture` natively** [VERIFIED: node_modules/primevue/fileupload/index.d.ts]. The `pt.input` passthrough option reaches the hidden `<input>` element. However, for two-affordance camera+gallery (D-35-10), raw `<input type="file">` elements are the cleanest path — simpler, no PrimeVue passthrough complexity, feeds existing `onFileSelect` handler directly.

**Primary recommendation:** Use `before-hide` + `:dismissable="false"` + `useConfirm` for the dirty guard; use raw `<input type="file">` for two-affordance camera; drop `touchUI` from FD-04 and use the `inline` approach or document as a known prop removal.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| BaseMobileDialog shell (Dialog/Drawer split) | Frontend Component | — | Presentation-only wrapper; no data fetching |
| Dirty-state snapshot + comparison | Frontend Component (per-dialog) | BaseMobileDialog (fires confirm) | State lives in child; guard fires through wrapper prop `:is-dirty` |
| Sticky action bar CSS | wallecx-overrides.css | BaseMobileDialog internal markup | Non-scoped CSS needed for teleported overlays |
| useConfirm "Discard changes?" | WallecxApp.vue shell (singleton ConfirmDialog) | BaseMobileDialog (calls useConfirm) | CON-CONFIRMDIALOG-SINGLETON invariant |
| FD-01 16px rule | wallecx-overrides.css | — | Non-scoped, teleport-safe, loads with Wallecx chunk |
| FD-03 inputmode/enterkeyhint | Each Manage dialog template | — | Per-field HTML attributes; no component abstraction needed |
| FD-04 DatePicker mobile UX | Each DatePicker site (5 sites) | — | Per-site `:inline` or `:breakpoint` prop |
| FD-05 camera capture | Each Manage dialog (3 dialogs) | Existing EXIF/compress pipeline | Raw `<input>` feeds existing `onFileSelect` handler |
| FD-06 auto-scroll | BaseMobileDialog (focusin listener) | — | One listener on the form container handles all fields |

---

## Standard Stack

### Core (already installed — no new deps needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| primevue | 4.5.5 | Drawer, Dialog, DatePicker, FileUpload, ConfirmDialog | [VERIFIED: node_modules] |
| @primevue/forms | 4.5.5 | ManageVaccination zodResolver — NOT used for DatePicker | [VERIFIED: node_modules] |
| @vueuse/core | 13.x | useMediaQuery — already in useMobileEnv.ts | [VERIFIED: node_modules] |
| vue | 3.5.34 | defineSlots, useTemplateRef, defineModel | [VERIFIED: node_modules] |
| browser-image-compression | (existing) | EXIF strip + compress path for camera input | [VERIFIED: src/components/projects/wallecx/ManageExpense.vue] |

No new packages required for Phase 35. All capabilities are covered by existing deps.

---

## Architecture Patterns

### System Architecture Diagram

```
Child (e.g. ManageExpense.vue)
  |
  v-- v-model:visible, :title, :is-dirty, :is-saving
  |
  BaseMobileDialog.vue
    |--- isMobile (useMobileEnv)
    |         |                 |
    |      Drawer          Dialog
    |   position=bottom   (desktop)
    |   @before-hide      (free dismiss)
    |   :dismissable=false
    |
    |--- #header slot: DragHandle (mobile only) + title
    |--- #default slot: <slot /> (form body from child — rendered ONCE)
    |--- #actions slot: <slot name="actions" /> (Save/Cancel from child)
    |       sticky bottom bar (position:sticky; bottom:0)
    |       max(env(safe-area-inset-bottom), 1.25rem) padding
    |
    Dirty guard (on Drawer before-hide):
      is-dirty? → useConfirm("Discard changes?")
        accept → close Drawer
        reject → keep Drawer open
```

### Recommended Project Structure

No new directories needed. New file:

```
src/components/projects/wallecx/
├── BaseMobileDialog.vue     # NEW — Phase 35 (FD-07)
├── ManageExpense.vue        # MODIFIED — Phase 35 wave 1
├── ManageBudget.vue         # MODIFIED — Phase 35 wave 2
├── ManageMembership.vue     # MODIFIED — Phase 35 wave 3
├── ManageVaccination.vue    # MODIFIED — Phase 35 wave 4
```

Plus FD-01 rule and sticky-action-bar rule added to `src/assets/wallecx-overrides.css`.

---

## Key Implementation Details

### 1. PrimeVue 4.5.5 Drawer API (VERIFIED: node_modules/primevue/drawer/index.d.ts)

**Props relevant to Phase 35:**
- `v-model:visible` — controls open/close
- `position: 'bottom'` — bottom sheet mode (already used in Phase 34)
- `:dismissable="false"` — **blocks backdrop-tap and swipe-down from closing automatically**. Required for the dirty guard: when `false`, tapping outside does NOT emit `update:visible=false`; it fires `before-hide` instead, which is where we intercept.
- `:show-close-icon` — already used; set to `!isSaving`
- `:close-on-escape` — defaults `true`; also interceptable via `before-hide`

**Events relevant to Phase 35:**
- `@before-hide` — fires BEFORE the close animation, before `visible` changes. This is the correct intercept point for the dirty guard.
- `@hide` — fires after close; used for `onHide` reset (already established pattern).
- `@update:visible` — fires when backdrop is tapped and dismissable=true. With `:dismissable="false"`, backdrop tap fires `before-hide` but does NOT auto-close.

**Slots:**
- `#default` — content
- `#header(scope: { class })` — used for DragHandle + title (already in Phase 34)
- `#footer` — available but not needed (action bar goes at bottom of `#default` content, not in the footer slot, because it must scroll with the form for short forms but stay sticky for long ones)
- `#container(scope: { closeCallback })` — available for full control but not needed

### 2. Dirty Guard Pattern (D-35-07/08/09)

The correct intercept mechanism [VERIFIED: Drawer `before-hide` in PrimeVue 4.5.5]:

```typescript
// In BaseMobileDialog.vue
const confirm = useConfirm()

// When dismissable=false, backdrop tap and swipe fire before-hide
// Esc also fires before-hide when closeOnEscape=true
function onBeforeHide(): void {
  if (!props.isDirty) {
    // Not dirty — let the close proceed naturally
    // However with dismissable=false we must manually close
    visibleInternal.value = false
    return
  }
  confirm.require({
    header: 'Discard changes?',
    message: 'You have unsaved changes. Discard them?',
    acceptLabel: 'Discard',
    rejectLabel: 'Keep editing',
    acceptClass: 'p-button-danger',
    accept: () => {
      visibleInternal.value = false
    },
    reject: () => {
      // keep open — do nothing
    },
  })
}
```

**Important:** With `:dismissable="false"`, `before-hide` still fires on:
- Programmatic `visible.value = false` (triggered by Save / explicit Cancel in `#actions`)
- Esc key (closeOnEscape=true, default)
- Backdrop tap (when dismissable=false, fires before-hide but does NOT auto-close)

**Guard must NOT block Save/explicit Cancel.** Solution: the wrapper tracks `_dismissedByAction = false` and sets it to `true` when Save or Cancel in the `#actions` slot fires. `onBeforeHide` checks this flag:

```typescript
// Or simpler: expose a close() method that bypasses the guard
// Child calls baseMobileDialogRef.value?.close() from Save/Cancel handlers
// which sets a `_bypassGuard` flag before setting visible=false
```

**Simplest pattern (recommended):** Pass a `:bypass-guard` prop that callers set `true` before calling `visible.value = false` from Save/explicit Cancel. BaseMobileDialog's `before-hide` checks this flag and skips the confirm.

**Alternative (cleaner):** Expose a `closeWithoutGuard()` method via `defineExpose`. Children call `baseMobileDialogRef.value?.closeWithoutGuard()` for Save/Cancel.

### 3. FD-04 — DatePicker on Mobile: CRITICAL PROP DISCREPANCY

**`touchUI` does NOT exist in PrimeVue 4.5.5 DatePicker.** [VERIFIED: node_modules/primevue/datepicker/index.d.ts, index.mjs — no occurrence of "touchUI" in TypeScript types or runtime JS]

The `touchUI` prop was part of PrimeVue 3's `Calendar` component (the predecessor). When PrimeVue 4 renamed Calendar → DatePicker, the `touchUI` mode was removed. The Phase 33 smoke test description "(touchUI)" referred to testing the DatePicker component in general, not the prop specifically.

**Three viable approaches for FD-04 (planner decision required):**

**Option A — `inline` mode inside a full-screen overlay (highest fidelity for FD-04 intent):**
Wrap the DatePicker with `:inline="isMobile"` and show it inside a `<Dialog>` fullscreen on mobile. The calendar renders fully inline rather than as a dropdown popup. Eliminates the viewport-overflow problem inside a Drawer.
```html
<DatePicker v-model="expenseDate" :inline="isMobile" fluid dateFormat="dd M yy" />
```
Downside: on mobile the inline calendar is always visible in the form, taking significant vertical space. Works well in a full-height drawer.

**Option B — `:breakpoint` prop to set breakpoint below mobile viewport (simplest):**
PrimeVue 4.5.5 DatePicker has `breakpoint` prop (default `769px`) which controls when the overlay repositions responsively. Setting `:breakpoint="'640px'"` ensures the panel does not try to position itself awkwardly. The overlay DatePicker still appears as a floating panel — adequate for Drawer content since the Drawer is 85dvh.
```html
<DatePicker v-model="expenseDate" fluid dateFormat="dd M yy" showButtonBar />
```
Simplest: no change to the DatePicker beyond ensuring showButtonBar for easy clear/today. FD-06 scrollIntoView handles visibility.

**Option C — keep current behavior, trust Drawer+scrollIntoView (lowest effort):**
The existing DatePicker already works in the Phase-34 Drawer branches. The overlay panel is positioned by PrimeVue's ZIndex system and opens above the field. The combination of FD-06 (scrollIntoView) + the Drawer's 85dvh scrollable content means the panel is reachable. The "full-screen touchUI" intent of FD-04 would be partially met by Option A, or accepted as "overlay DatePicker on mobile" per Option C.

**Recommendation for planner:** Option B (keep as-is with `showButtonBar`) is consistent with zero risk and defers the full-screen treatment to a future milestone. If FD-04's intent ("full-screen touchUI on mobile") is mandatory, use Option A (`:inline="isMobile"`). The FD-04 requirement text says "full-screen touchUI mode on mobile" — document as a known API change from PrimeVue 4.

### 4. FD-05 — Camera Capture: Raw Input vs FileUpload Passthrough

**FileUpload does NOT have a `capture` prop.** [VERIFIED: node_modules/primevue/fileupload/index.d.ts] The FileUpload `pt.input` passthrough DOES reach the hidden `<input>` element (verified in PassThrough options), but only one input element — you cannot have both `capture="environment"` and no-capture on the same FileUpload.

**Recommended approach (D-35-10 two-affordance pattern):**

Replace the single `<FileUpload>` in each upload-bearing dialog with two raw `<input type="file">` elements (wrapped in styled `<label>` buttons for touch target sizing):

```html
<!-- Camera capture (rear camera, IMAGES ONLY) -->
<label class="btn-style min-h-[44px] cursor-pointer inline-flex items-center gap-2">
  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    capture="environment"
    class="hidden"
    @change="onFileInputChange"
  />
  <iconify-icon icon="mdi:camera" /> Take photo
</label>

<!-- Gallery picker (images + PDF where applicable, no capture) -->
<label class="btn-style min-h-[44px] cursor-pointer inline-flex items-center gap-2">
  <input
    type="file"
    :accept="acceptTypes"
    class="hidden"
    @change="onFileInputChange"
  />
  <iconify-icon icon="mdi:image-multiple" /> Choose from gallery
</label>
```

The `onFileInputChange` handler reads `event.target.files[0]` and calls the same EXIF/compression path already in `onFileSelect`. The accept type differs per dialog (ManageExpense includes PDF; ManageMembership/ManageVaccination are images only).

**Important iOS note:** On iOS 13+, `capture="environment"` on a `<label>`-wrapped `<input>` opens the camera directly. However, in iOS standalone (PWA) mode, there have been historic bugs where `capture` silently falls back to gallery. This is exactly why D-35-10 requires a SEPARATE gallery input — the camera input may fail, the gallery input is the reliability net.

**What to do with the existing FileUpload on desktop?** Keep it. BaseMobileDialog renders the form once, but the camera affordances only render on mobile (`:v-if="isMobile"`), while the FileUpload renders on desktop (`:v-if="!isMobile"`). Or: always show both the two-affordance buttons and hide the single FileUpload on mobile. The planner decides — the simplest approach is conditionally render per isMobile.

### 5. Sticky Action Bar (D-35-05)

The sticky bar lives at the bottom of the form content area inside the `#default` slot. The Drawer's `.p-drawer-content` already has `overflow-y: auto` (it scrolls content). A sticky element inside a scrollable parent works correctly:

```css
/* wallecx-overrides.css additions */
/* Phase 35 LT-08: Sticky action bar in Manage dialog Drawers and Dialogs.
 * Positioned at the bottom of the scrollable .p-drawer-content / .p-dialog-content.
 * Background must match the surrounding surface so it masks scrolling content.
 * safe-area-inset-bottom pads above iOS home indicator. */
.wallecx-manage-actions {
  position: sticky;
  bottom: 0;
  padding-top: 0.75rem;
  padding-bottom: max(env(safe-area-inset-bottom), 0.75rem);
  background: var(--p-drawer-background, var(--p-overlay-modal-background));
  border-top: 1px solid var(--color-surface-divider);
  z-index: 1;
}

.my-app-dark .wallecx-manage-actions {
  background: var(--color-surface-card);
}
```

The class `.wallecx-manage-actions` is placed on the `<div>` wrapping Save/Cancel in `BaseMobileDialog`'s `#actions` slot output. Since `.p-drawer-content` and `.p-dialog-content` are the scroll containers, position:sticky works relative to them.

**Android:** `interactive-widget=resizes-content` is already set in `index.html` (Phase 34 substrate). When the keyboard opens on Android, the viewport shrinks and the sticky bar rises above the keyboard naturally. No JS needed.

**iOS:** The keyboard overlays the viewport without shrinking it. `scrollIntoView({ block: 'center' })` on focused inputs (FD-06) scrolls the focused field above the overlay keyboard. The sticky bar may be partially obscured by the keyboard on long forms — the D-35-06 `scrollIntoView` is the mitigation. If UAT in Phase 38 shows the bar is still hidden, the VisualViewport escalation documented in D-35-06 applies.

### 6. FD-06 — Auto-Scroll (scrollIntoView)

```typescript
// In BaseMobileDialog.vue, mobile-only listener
function setupAutoScroll(el: HTMLElement): void {
  el.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement
    if (target && typeof target.scrollIntoView === 'function') {
      // Defer to let virtual keyboard appear first
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    }
  })
}
```

Attach to the form container `ref` inside the Drawer `#default` slot. `requestAnimationFrame` defers execution so the keyboard has started opening before we scroll. `block: 'center'` keeps the focused field in the middle of the visible area rather than at the top (where the sticky action bar may obstruct it if the keyboard is large).

### 7. BaseMobileDialog.vue Skeleton

```vue
<!-- src/components/projects/wallecx/BaseMobileDialog.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useMobileEnv } from '@/composables/useMobileEnv'
import DragHandle from './DragHandle.vue'

const props = defineProps<{
  title: string
  isDirty: boolean
  isSaving: boolean
}>()

const visible = defineModel<boolean>('visible', { required: true })
const { isMobile } = useMobileEnv()
const confirm = useConfirm()

// When explicitly closed by Save/Cancel — bypasses dirty guard.
let _bypassGuard = false

function closeWithoutGuard(): void {
  _bypassGuard = true
  visible.value = false
}

defineExpose({ closeWithoutGuard })

// Fires before Drawer close (backdrop tap, swipe, Esc) when dismissable=false
function onBeforeHide(): void {
  if (_bypassGuard) {
    _bypassGuard = false
    return
  }
  if (!props.isDirty) {
    // Not dirty — allow close (but since dismissable=false we must drive it)
    visible.value = false
    return
  }
  confirm.require({
    header: 'Discard changes?',
    message: 'Your unsaved changes will be lost.',
    acceptLabel: 'Discard',
    rejectLabel: 'Keep editing',
    accept: () => {
      visible.value = false
    },
  })
}

function onHide(): void {
  _bypassGuard = false
}

// Auto-scroll: focusin on the form content scrolls focused input into view on mobile.
const formRef = ref<HTMLElement | null>(null)
// Registered in onMounted via watchEffect if isMobile
</script>

<template>
  <!-- Mobile: bottom Drawer -->
  <Drawer
    v-if="isMobile"
    v-model:visible="visible"
    position="bottom"
    :dismissable="false"
    :show-close-icon="!isSaving"
    @before-hide="onBeforeHide"
    @hide="onHide"
  >
    <template #header>
      <div class="flex flex-col items-center w-full gap-1">
        <DragHandle />
        <span class="font-semibold">{{ title }}</span>
      </div>
    </template>

    <div ref="formRef" @focusin="onFocusin">
      <slot />
      <div class="wallecx-manage-actions">
        <slot name="actions" />
      </div>
    </div>
  </Drawer>

  <!-- Desktop: centered Dialog -->
  <Dialog
    v-else
    modal
    v-model:visible="visible"
    :header="title"
    :style="{ width: '40vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
    :closable="!isSaving"
  >
    <slot />
    <template #footer>
      <slot name="actions" />
    </template>
  </Dialog>
</template>
```

**Notes on the skeleton:**
- The `#actions` slot goes inside the scrollable content area on mobile (sticky bar), but in Dialog's `#footer` slot on desktop. This asymmetry means the consuming dialog emits the Save/Cancel buttons once via `<template #actions>` and BaseMobileDialog routes them to the right place.
- `closeWithoutGuard()` is exposed via `defineExpose` so child dialogs can call it from their Save/Cancel handlers: `const baseRef = ref<InstanceType<typeof BaseMobileDialog> | null>(null)` → `baseRef.value?.closeWithoutGuard()`.
- The `onFocusin` handler (auto-scroll for FD-06) should be mobile-only and should call `requestAnimationFrame(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }))`.

### 8. Per-Dialog Migration Map

#### ManageExpense (wave 1 — reference dialog)

| Field | Type | inputmode | enterkeyhint | autocomplete |
|-------|------|-----------|--------------|--------------|
| Amount | InputNumber | `decimal` | `next` | `off` |
| Date | DatePicker | n/a | n/a | n/a |
| Category | Select (editable) | `text` | `next` | `off` |
| Description | InputText | `text` | `next` | `off` |
| Notes | Textarea | `text` | `done` (last text field) | `off` |

**Upload site:** Receipt — image/JPEG/PNG/WebP/PDF. Two-affordance: camera (image only) + gallery (image + PDF).
**Dirty snapshot fields:** `{ amount, expenseDate, category, description, notes, pendingFile }`
**onHide reset:** `pendingFile.value = null` — must still fire from BaseMobileDialog's `@hide` relay.

#### ManageBudget (wave 2)

| Field | Type | inputmode | enterkeyhint | autocomplete |
|-------|------|-----------|--------------|--------------|
| Per-category amount (N rows) | InputNumber | `decimal` | `next` (non-last rows), `done` (last) | `off` |
| Budget type (SelectButton) | SelectButton | n/a | n/a | n/a |

**NO upload site.**
**Dirty snapshot:** `localRows` array serialized to JSON string (deep comparison needed). Since `localRows` is `BudgetRow[]`, snapshot = `JSON.stringify(localRows.value)` taken when dialog opens; isDirty = current JSON !== snapshot.

#### ManageMembership (wave 3 — HIGHEST RISK: ColorPicker #8135, card_color no-hash)

| Field | Type | inputmode | enterkeyhint | autocomplete |
|-------|------|-----------|--------------|--------------|
| Card Name | InputText | `text` | `next` | `off` |
| Barcode Type | Select | n/a | n/a | n/a |
| Barcode Value | InputText | `text` | `next` | `off` |
| Card Number | InputText | `numeric` (v-if numeric values expected) | `next` | `off` |
| Card Colour | ColorPicker | n/a | n/a | n/a |
| Expiry Date | DatePicker | n/a | n/a | n/a |
| Issuer | InputText | `text` | `next` | `off` |
| Notes | Textarea | `text` | `done` | `off` |

**Upload site:** card_image — images only (JPEG/PNG/WebP). Two-affordance: camera + gallery.
**ColorPicker invariant (D-35-02):** `cardColor` ref stays in `ManageMembership.vue`, bound via direct `v-model`. BaseMobileDialog NEVER touches it. The ref is scoped to the child. After migration, the `v-model="cardColor"` on `<ColorPicker>` must remain in the child's `#default` slot content.
**card_color no-hash invariant (CON-CARD-COLOR-NO-HASH):** No change — the existing logic strips `#` on save and prepends on display. BaseMobileDialog does not touch color values.
**membershipMapper.spec.ts:** 11 tests must pass after migration. Test verifies `card_color` round-trip. Run after wave 3 commit.
**Dirty snapshot:** `{ cardName, barcodeType, barcodeValue, cardNumber, cardColor, expiryDate: expiryDate?.toISOString(), issuer, notes, pendingFile: !!pendingFile.value }`

#### ManageVaccination (wave 4 — administeredDate direct-v-model #8191)

| Field | Type | inputmode | enterkeyhint | autocomplete |
|-------|------|-----------|--------------|--------------|
| Vaccine Type | InputText (Form-bound) | `text` | `next` | `off` |
| Vaccine Name | InputText (Form-bound) | `text` | `next` | `off` |
| Date Administered | DatePicker (DIRECT v-model `administeredDate`) | n/a | n/a | n/a |
| Dose Number | InputNumber (Form-bound) | `numeric` | `next` | `off` |
| Lot Number | InputText (Form-bound) | `text` | `next` | `off` |
| Manufacturer | InputText (Form-bound) | `text` | `next` | `off` |
| Location | InputText (Form-bound) | `text` | `next` | `off` |
| Notes | Textarea (Form-bound) | `text` | `done` | `off` |

**Upload site:** card (image or PDF). Two-affordance: camera (images only) + gallery (image + PDF).
**administeredDate invariant (D-33-01-A / #8191):** `administeredDate` ref stays in `ManageVaccination.vue`. The `[visible, record]` watch that seeds it stays in the child. BaseMobileDialog does NOT fold it into `@primevue/forms`. The migration collapses the two `<Form>` instances (Dialog + Drawer branches) to ONE `<Form>` instance — this is safe because both branches had identical Form markup and the injected `provide/inject` context from one Form mount is sufficient.
**Two-Form → One-Form collapse:** In Phase-34, ManageVaccination has `<Form>` in both the Dialog branch and the Drawer branch (wrapped in `v-if/v-else`). After BaseMobileDialog migration, there is ONE `<Form>` in the `#default` slot. The `administeredDate` direct-v-model DatePicker sits outside the Form (not `name`-bound) in both branches currently — it stays outside the Form after migration.
**Dirty snapshot:** `{ vaccineType: $form.vaccine_type?.value, vaccineName: ..., administeredDate: administeredDate.value?.toISOString(), ... }` — need to capture Form field values. Since fields are Form-bound, snapshot should read initial values from `initialValues.value` at dialog-open.

### 9. FD-01 — CSS Classes to Target (VERIFIED node_modules)

[VERIFIED: PrimeVue 4.5.5 Aura — confirmed class names present in component source]

| PrimeVue Class | Component | Notes |
|----------------|-----------|-------|
| `.p-inputtext` | InputText, editable Select text part | Also appears on InputNumber's visible input |
| `.p-inputnumber-input` | InputNumber internal input element | [VERIFIED: grep node_modules/primevue/inputnumber — class used] |
| `.p-textarea` | Textarea | Direct class on textarea element |
| `.p-select-label` | Select display label | The text display element inside Select |
| `.p-multiselect-label` | MultiSelect display label | The text display element inside MultiSelect |
| `.p-datepicker-input` | DatePicker's InputText | The text input element inside DatePicker |

The D-35-12 CSS rule as written in CONTEXT is correct. No modifications needed.

```css
/* Phase 35 FD-01: iOS auto-zoom prevention — font-size >= 16px on all form inputs
 * at mobile widths. iOS Safari auto-zooms when a focused input has font-size < 16px.
 * Non-scoped (this file is already non-scoped) to reach teleported overlay DOM.
 * !important required — Aura's component tokens set font-size via --p-inputtext-font-size
 * which resolves to ~0.875rem (14px) by default. */
@media (max-width: 640px) {
  .p-inputtext,
  .p-inputnumber-input,
  .p-textarea,
  .p-select-label,
  .p-multiselect-label,
  .p-datepicker-input {
    font-size: 16px !important;
  }
}
```

**Blast radius:** This file loads globally once when the Wallecx chunk mounts (imported from WallecxApp.vue). It will apply to ALL Wallecx inputs including non-Manage-dialog inputs (e.g., ExpensesToolbar search, MultiSelect). At 16px on mobile this is correct behavior for NFR-IOS-NO-ZOOM. The D-35-12 comment about `.wallecx-root` scoping applies only to in-root inputs, not teleported overlays (DatePicker panel, Select dropdown). Since teleported overlays render outside `.wallecx-root`, not scoping is correct here.

### 10. DatePicker Sites for FD-04 (all 5 confirmed)

[VERIFIED: codebase grep]

| File | Site | Current Code | FD-04 Change |
|------|------|--------------|--------------|
| ManageExpense.vue | expense date | `<DatePicker v-model="expenseDate" ...>` | Add per chosen FD-04 option |
| ExpensesToolbar.vue | From date filter | `<DatePicker :model-value="dateFrom" ...>` | Add per chosen option |
| ExpensesToolbar.vue | To date filter | `<DatePicker :model-value="dateTo" ...>` | Add per chosen option |
| ExpensesReportsView.vue | Custom From | `<DatePicker v-model="customFrom" ...>` | Add per chosen option |
| ExpensesReportsView.vue | Custom To | `<DatePicker v-model="customTo" ...>` | Add per chosen option |
| ManageMembership.vue | expiry date | `<DatePicker v-model="expiryDate" ...>` (in both Dialog+Drawer branches) | Collapses to one in BaseMobileDialog #default slot |
| ManageVaccination.vue | date administered | `<DatePicker v-model="administeredDate" ...>` (direct v-model, NOT Form-bound) | Collapses to one in BaseMobileDialog #default slot |

Note: `ExpensesToolbar` and `ExpensesReportsView` are NOT migrated to BaseMobileDialog — they are standalone toolbar/view components. FD-04 applies to them by adding `:isMobile` from `useMobileEnv()` / `useIsMobile()` and conditionally adjusting DatePicker behavior.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dialog/Drawer split | Custom modal system | PrimeVue Dialog + Drawer (existing) | Already integrated with Wallecx CSS, dark mode, teleport |
| Dirty-state UI | Custom confirmation modal | `useConfirm` + shell `<ConfirmDialog>` | CON-CONFIRMDIALOG-SINGLETON; service-based, no extra instance |
| Image compression | Canvas-only pipeline | `browser-image-compression` (existing) | WebWorker, maxSizeMB, maxWidthOrHeight — already handles edge cases |
| EXIF strip | exifr or piexifjs | Canvas re-encode (existing pattern) | No new dep; already implemented and tested in ManageExpense + ManageMembership + ManageVaccination |
| Input scroll management | Custom VisualViewport tracker | `scrollIntoView({ block: 'center' })` | Sufficient for Phase 35; VisualViewport is the documented fallback only |

---

## Common Pitfalls

### Pitfall 1: `touchUI` prop silently ignored (builds fine, does nothing)

**What goes wrong:** `:touchUI="isMobile"` is passed to `<DatePicker>`. Vue 3 passes unknown props as HTML attributes (falls through to root element). No TypeScript error because the auto-import resolver may not validate unknown props at template compile time. The prop does nothing — DatePicker shows its normal overlay on mobile.
**Why it happens:** `touchUI` existed in PrimeVue 3's Calendar component; it was removed when Calendar was renamed to DatePicker in PrimeVue 4. Planning docs carried the prop forward without re-verifying.
**How to avoid:** Do NOT add `:touchUI="isMobile"` to any DatePicker. Use one of the three options documented under "FD-04 Approaches" above.
**Warning signs:** Type-check passes, no Vue warning, but date picker still shows small overlay dropdown on mobile.

### Pitfall 2: Dirty guard firing on Save/Cancel close (double-prompt or broken close)

**What goes wrong:** `@before-hide` fires when `visible.value = false` is set by Save or explicit Cancel. Without the `_bypassGuard` flag or `closeWithoutGuard()`, every close triggers the confirm dialog — including successful saves.
**Why it happens:** `before-hide` fires on ALL close events including programmatic ones.
**How to avoid:** Use `defineExpose({ closeWithoutGuard })` pattern. Child components call `baseRef.value?.closeWithoutGuard()` in their `onSubmit` success path and explicit Cancel handler.
**Warning signs:** After a successful save, "Discard changes?" dialog appears before the drawer closes.

### Pitfall 3: ColorPicker v-model not reactive after BaseMobileDialog wraps it

**What goes wrong:** `cardColor` ref defined in ManageMembership.vue appears to work, but after the first save and reopen, the ColorPicker shows the wrong initial color.
**Why it happens:** The Phase-34 branches had `record.value` watcher seeding `cardColor.value` in the immediate handler. If the watcher is accidentally removed or the watch timing changes during migration, the seed doesn't fire.
**How to avoid:** Preserve the existing `watch(() => record.value, ...)` with `{ immediate: true }` in ManageMembership.vue verbatim. Do not touch the seeding logic.
**Warning signs:** `membershipMapper.spec.ts` still passes (mapper tests don't test component state), but manual test shows wrong color on reopen.

### Pitfall 4: `@primevue/forms` Form context lost inside slot

**What goes wrong:** ManageVaccination's `<Form>` (zodResolver) is placed in the `#default` slot. The `v-slot="$form"` pattern must work inside the slotted content. If `$form` context breaks, field validation stops working.
**Why it happens:** `@primevue/forms` Form provides context via Vue's `provide/inject`. As long as the Form is a parent of the InputText fields — even inside a slot boundary — the inject works. Slots are rendered in the parent scope but the provide chain follows DOM parent, not lexical scope.
**How to avoid:** Ensure the `<Form>` tag is inside the `#default` slot content in ManageVaccination.vue, NOT in BaseMobileDialog.vue's template. The Form wraps the fields directly; BaseMobileDialog just renders `<slot />` which is the Form.
**Warning signs:** `$form.vaccine_type?.invalid` is always undefined; validation errors never show.

### Pitfall 5: `administeredDate` not seeded after the two-Form → one-Form collapse

**What goes wrong:** The `[visible, record]` watch in ManageVaccination that seeds `administeredDate` fires, but the DatePicker field is now rendered inside BaseMobileDialog's slot. On the first open, the date shows correctly. On reopen with a different record, it shows the previous record's date.
**Why it happens:** The watch fires on `[visible.value, record.value]` changes. If the same `visible` ref is used (it is — `visible` is now `v-model:visible` on BaseMobileDialog, which proxies through), re-opening with the same `visible` but different `record` should trigger. Verify the watch uses `() => [visible.value, record.value] as const` tuple form, not separate watches.
**How to avoid:** Preserve the watch declaration verbatim from the Phase-34 implementation. Confirm it includes the `{ immediate: true }` option.
**Warning signs:** Edit mode shows the date from the previous edit, not the current record's date.

### Pitfall 6: Safe-area padding double-stacking

**What goes wrong:** The sticky action bar inside the Drawer has `padding-bottom: max(env(safe-area-inset-bottom), 0.75rem)`. The outer `.p-drawer-content` already has `padding-bottom: max(env(safe-area-inset-bottom), 1.25rem)` from Phase 34. The safe-area inset gets applied twice — resulting in double the home-indicator clearance.
**Why it happens:** Phase 34 added bottom padding to `.p-drawer-content`. Phase 35 adds the same inset to the sticky bar. On a device with safe-area-inset-bottom = 34px, total padding would be 34px (drawer) + 34px (bar) = 68px.
**How to avoid:** The sticky `.wallecx-manage-actions` bar is inside `.p-drawer-content`, not below it. Remove the existing `.p-drawer-content` `padding-bottom` OR set the sticky bar's padding-bottom to `0.75rem` only (no safe-area). The safe-area at the content level is enough to clear the home indicator since the bar is already inside the padded area.
**Correct approach:** Keep `.p-drawer-content padding-bottom: max(env(safe-area-inset-bottom), 1.25rem)` from Phase 34 unchanged. Set `.wallecx-manage-actions padding-bottom: 0.75rem` only (no env()). The content padding below the sticky bar absorbs the home indicator gap.

---

## Code Examples

### BaseMobileDialog focusin auto-scroll handler

```typescript
// In BaseMobileDialog.vue script setup
// Source: D-35-06 pattern
import { ref, watch } from 'vue'

const formRef = ref<HTMLElement | null>(null)

function onFocusin(e: FocusEvent): void {
  if (!isMobile.value) return
  const target = e.target as HTMLElement
  if (target?.scrollIntoView) {
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }
}
```

### Dirty snapshot pattern for ManageExpense

```typescript
// Source: D-35-07 pattern — snapshot at open time
interface ExpenseSnapshot {
  amount: number | null
  expenseDate: string // ISO
  category: string
  description: string
  notes: string
  hasPendingFile: boolean
}

function takeSnapshot(): ExpenseSnapshot {
  return {
    amount: amount.value,
    expenseDate: expenseDate.value.toISOString(),
    category: category.value,
    description: description.value,
    notes: notes.value,
    hasPendingFile: false, // pendingFile always null at open
  }
}

const snapshot = ref<ExpenseSnapshot | null>(null)

// Seed snapshot when dialog opens
watch(visible, (isOpen) => {
  if (isOpen) snapshot.value = takeSnapshot()
})

const isDirty = computed<boolean>(() => {
  if (!snapshot.value) return false
  return (
    amount.value !== snapshot.value.amount ||
    expenseDate.value.toISOString() !== snapshot.value.expenseDate ||
    category.value !== snapshot.value.category ||
    description.value !== snapshot.value.description ||
    notes.value !== snapshot.value.notes ||
    pendingFile.value !== null // any file selection marks dirty
  )
})
```

### Raw input camera + gallery affordance

```html
<!-- Source: D-35-10 / FD-05 pattern — replace <FileUpload> on mobile -->
<template v-if="isMobile">
  <!-- Two-affordance camera/gallery (mobile only) -->
  <div class="flex gap-2">
    <label class="p-button p-button-outlined p-button-sm min-h-[44px] cursor-pointer flex items-center gap-2">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        class="hidden"
        @change="onRawFileChange"
      />
      <i class="pi pi-camera"></i> Take photo
    </label>
    <label class="p-button p-button-outlined p-button-sm min-h-[44px] cursor-pointer flex items-center gap-2">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        class="hidden"
        @change="onRawFileChange"
      />
      <i class="pi pi-images"></i> Choose from gallery
    </label>
  </div>
</template>
<template v-else>
  <!-- Desktop: existing FileUpload component -->
  <FileUpload mode="basic" :auto="false" ... @select="onFileSelect" />
</template>
```

```typescript
// Handler bridges raw input to existing EXIF/compress path
async function onRawFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  // Reset input so the same file can be selected again
  input.value = ''
  // Reuse the existing onFileSelect pattern
  await onFileSelect({ files: [file] })
}
```

### Consuming dialog after migration (ManageExpense simplified)

```html
<!-- In ManageExpense.vue template — after migration -->
<BaseMobileDialog
  v-model:visible="visible"
  :title="dialogHeader"
  :is-dirty="isDirty"
  :is-saving="isSaving || isLoadingCategories"
  ref="baseDialogRef"
>
  <!-- #default: form body, rendered ONCE -->
  <form @submit.prevent="onSubmit" class="space-y-4">
    <!-- ... all form fields ... -->
  </form>

  <!-- #actions: sticky Save/Cancel -->
  <template #actions>
    <div class="flex gap-2">
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        fluid
        :disabled="isSaving"
        @click="onCancel"
      />
      <Button
        type="submit"
        form="manage-expense-form"
        :label="isEditMode ? 'Save Changes' : 'Add Expense'"
        fluid
        :loading="isSaving || isLoadingCategories"
        :disabled="isSaving || isLoadingCategories"
      />
    </div>
  </template>
</BaseMobileDialog>
```

```typescript
// Cancel handler — bypasses dirty guard (explicit user action)
const baseDialogRef = ref<InstanceType<typeof BaseMobileDialog> | null>(null)

function onCancel(): void {
  baseDialogRef.value?.closeWithoutGuard()
}

// In onSubmit success path:
// ... after emit('created/updated', ...) ...
baseDialogRef.value?.closeWithoutGuard()
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PrimeVue 3 Calendar `touchUI` prop | Removed in PrimeVue 4 DatePicker | PrimeVue 4.0 (Calendar→DatePicker rename) | FD-04 must use `inline` or existing overlay |
| v-if/v-else Dialog/Drawer branches per dialog (Phase 34) | BaseMobileDialog single wrapper (Phase 35) | Phase 35 (this phase) | Eliminates form duplication; dirty guard and sticky bar owned once |
| PrimeVue Sidebar (v3) | PrimeVue Drawer (v4) | PrimeVue 4.0 | `dismissable` prop still present; `before-hide` event available |

**Deprecated/outdated:**
- `touchUI` on DatePicker: silently ignored; do not use. No replacement prop in PrimeVue 4.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `dismissable=false` + `before-hide` is the correct Drawer interception pattern for dirty guard | §Key Implementation Details #2 | [VERIFIED: DrawerEmitsOptions shows `before-hide` fires before visible changes; `dismissable` docs say "whether clicking outside closes the panel"] — low risk |
| A2 | `position:sticky; bottom:0` inside `.p-drawer-content` works across iOS 16+ and Android Chrome 110+ | §Key Implementation Details #5 | [ASSUMED] — sticky inside overflow:auto scroll containers is well-supported in modern browsers; real-device verify in Phase 38 |
| A3 | Raw `<input type="file">` wrapped in `<label>` is the correct two-affordance approach and feeds existing EXIF pipeline without modification | §Key Implementation Details #4 | [ASSUMED based on HTML spec + ManageExpense EXIF path inspection] — low risk; standard pattern |
| A4 | The `_bypassGuard` flag approach (synchronous, before `visible.value = false`) is race-free in Vue 3's sync reactivity model | §Key Implementation Details #2 | [ASSUMED] — Vue 3 reactive assignments are synchronous; `before-hide` fires synchronously during the same tick. Low risk. |

**Confirmed claims (not assumptions):**
- `touchUI` does NOT exist in PrimeVue 4.5.5 DatePicker [VERIFIED: node_modules/primevue/datepicker/index.d.ts + index.mjs]
- Drawer `before-hide` event exists [VERIFIED: node_modules/primevue/drawer/index.d.ts DrawerEmitsOptions]
- Drawer `dismissable` prop exists [VERIFIED: node_modules/primevue/drawer/index.d.ts DrawerProps]
- FileUpload does NOT have `capture` prop [VERIFIED: node_modules/primevue/fileupload/index.d.ts]
- FileUpload has `pt.input` passthrough [VERIFIED: FileUploadPassThroughOptions.input]
- `useConfirm` returns `{ require, close }` [VERIFIED: node_modules/primevue/useconfirm/index.d.ts]
- PrimeVue 4.5.5 installed [VERIFIED: node_modules/primevue/package.json]
- All 5 FD-01 CSS class names correct [VERIFIED: grep node_modules/primevue source]
- ManageExpense uses `useIsMobile` (not `useMobileEnv`) [VERIFIED: ManageExpense.vue line 11] — migration updates to `useMobileEnv().isMobile`
- ManageBudget uses `useIsMobile` [VERIFIED: ManageBudget.vue line 21]
- ManageMembership uses `useIsMobile` [VERIFIED: ManageMembership.vue line 13]
- ManageVaccination uses `useIsMobile` [VERIFIED: ManageVaccination.vue line 15]
- WallecxApp.vue has exactly ONE `<ConfirmDialog />` at line 105 [VERIFIED: WallecxApp.vue]
- ManageVaccination has TWO `<Form>` instances post-Phase-34 (Dialog + Drawer branches) [VERIFIED: ManageVaccination.vue lines 225 and 343]
- `administeredDate` is a direct `ref<Date | null>` seeded via `[visible, record]` watch in ManageVaccination.vue [VERIFIED: lines 32, 54-62]
- ManageExpense receipt FileUpload accepts JPEG/PNG/WebP/PDF [VERIFIED: ManageExpense.vue line 370]
- ManageMembership card_image FileUpload accepts JPEG/PNG/WebP only (no PDF) [VERIFIED: ManageMembership.vue line 353]
- ManageVaccination card FileUpload accepts JPEG/PNG/WebP/PDF [VERIFIED: ManageVaccination.vue line 303]
- ManageBudget has NO file upload [VERIFIED: ManageBudget.vue — no FileUpload or file-related code]

---

## Open Questions

1. **FD-04 approach: which of the three options?**
   - What we know: `touchUI` is gone; `inline`, `breakpoint`, or status-quo are the options.
   - What's unclear: Whether the "full-screen touchUI" behavior intent is mandatory or whether a well-scrolled overlay DatePicker (Option C) satisfies the success criterion.
   - Recommendation: The planner should pick Option C (keep existing overlay + ensure scrollIntoView) as the default, document the touchUI removal, and note that Option A (`:inline="isMobile"`) can be added in Phase 38 UAT if users find the overlay awkward on real devices.

2. **Sticky action bar inside Dialog vs Dialog `#footer` slot on desktop**
   - What we know: On desktop, the sticky bar goes in Dialog's `#footer` slot (rendered outside the scroll area, always visible). On mobile, it goes at the bottom of `#default` with `position:sticky`.
   - What's unclear: Whether the `#actions` slot mechanism (as sketched in skeleton) correctly routes to `#footer` on Dialog. In the skeleton, Dialog's `<template #footer>` renders `<slot name="actions" />`.
   - Recommendation: This is clean Vue slot forwarding and works correctly. Confirm at implementation time.

3. **ManageBudget dirty detection: how expensive is JSON.stringify comparison on N rows?**
   - What we know: ManageBudget has N=number-of-categories rows; likely 5-15 for personal use.
   - What's unclear: Performance of `JSON.stringify` on each input change.
   - Recommendation: Use `JSON.stringify` snapshot at open; compare via `computed` — trivially fast for 15 rows. Not a concern.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 35 is purely frontend code/CSS changes; no external services, CLIs, or databases are installed or configured in this phase. All dependencies (PrimeVue, browser-image-compression, useMobileEnv) are already present in the repo.

---

## Sources

### Primary (HIGH confidence)
- `node_modules/primevue/datepicker/index.d.ts` — DatePickerProps full interface; confirmed `touchUI` absent
- `node_modules/primevue/datepicker/index.mjs` — Runtime confirmation: `touchUI` not in JS
- `node_modules/primevue/drawer/index.d.ts` — DrawerProps, DrawerSlots, DrawerEmitsOptions; `before-hide`, `dismissable` confirmed
- `node_modules/primevue/fileupload/index.d.ts` — FileUploadPassThroughOptions; `pt.input` confirmed; `capture` confirmed absent
- `node_modules/primevue/useconfirm/index.d.ts` — `useConfirm` returns `{ require, close }`
- `node_modules/primevue/confirmationoptions/index.d.ts` — ConfirmationOptions fields
- `src/components/projects/wallecx/ManageExpense.vue` — Reference Dialog/Drawer branch, EXIF path, FileUpload usage
- `src/components/projects/wallecx/ManageBudget.vue` — Field map, no upload, localRows pattern
- `src/components/projects/wallecx/ManageMembership.vue` — ColorPicker direct-v-model, card_color no-hash, EXIF path
- `src/components/projects/wallecx/ManageVaccination.vue` — Two-Form structure, administeredDate direct-v-model, EXIF path
- `src/components/projects/wallecx/WallecxApp.vue` — Single ConfirmDialog at line 105 confirmed
- `src/assets/wallecx-overrides.css` — Existing Phase 34 rules; safe-area padding on `.p-drawer-content`
- `src/composables/useMobileEnv.ts` — isMobile (≤639px), safeAreaInsets
- `.planning/phases/35-forms-dialogs-on-small-screens/35-CONTEXT.md` — All 13 locked decisions

### Secondary (MEDIUM confidence)
- `.planning/phases/33-mobile-foundation/33-01-SUMMARY.md` — Phase 33 smoke test description (used to understand what was and wasn't verified re: touchUI)
- `.planning/STATE.md` §Architectural Invariants — ColorPicker #8135, ConfirmDialog singleton, card_color no-hash, D-33-01-A

---

## Metadata

**Confidence breakdown:**
- PrimeVue API (Drawer, FileUpload, useConfirm): HIGH — verified in node_modules
- DatePicker touchUI absence: HIGH — verified in both TypeScript types AND runtime JS
- BaseMobileDialog skeleton: HIGH — derived directly from existing Phase-34 Dialog/Drawer code patterns
- Dirty guard pattern: HIGH — verified Drawer API; ASSUMED for Vue reactivity sync guarantee (very low risk)
- Camera/gallery input approach: HIGH — standard HTML spec pattern; ASSUMED feeds existing pipeline (verified pipeline code)
- Sticky action bar CSS behavior on iOS: MEDIUM — well-known browser support; real-device verification deferred to Phase 38

**Research date:** 2026-05-27
**Valid until:** 2026-06-27 (stable PrimeVue 4.5.5 baseline locked for v4.3 milestone)
