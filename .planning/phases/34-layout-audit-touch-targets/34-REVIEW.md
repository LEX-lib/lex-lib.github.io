---
phase: 34-layout-audit-touch-targets
reviewed: 2026-05-27T10:30:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/components/projects/wallecx/DragHandle.vue
  - src/components/projects/wallecx/ManageMembership.vue
  - src/components/projects/wallecx/ManageVaccination.vue
  - src/components/projects/wallecx/VaccinationsTab.vue
  - src/components/projects/wallecx/MembershipsTab.vue
  - src/components/projects/wallecx/ExpensesListView.vue
  - src/components/projects/wallecx/MembershipDetail.vue
  - src/components/projects/wallecx/ManageExpense.vue
  - src/components/projects/wallecx/ManageBudget.vue
  - src/assets/wallecx-overrides.css
  - src/components/projects/wallecx/WallecxApp.vue
  - index.html
findings:
  critical: 0
  high: 1
  medium: 3
  low: 2
  total: 6
status: issues_found
---

# Phase 34: Code Review Report

**Reviewed:** 2026-05-27T10:30:00Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found (advisory — does not block phase)

## Summary

Phase 34 is a presentation-layer audit adding touch-target floors, sticky tab/toolbar chrome, safe-area padding, and mobile bottom-Drawer branches for ManageMembership and ManageVaccination. The implementation is generally sound. The two new Drawer branches are structurally consistent with their Dialog counterparts. The PrimeVue invariants (#8135 ColorPicker direct v-model, #8191 administeredDate direct v-model) are correctly honoured in both branches. DragHandle is correctly `aria-hidden` and mobile-gated at the call site where the Drawer is dual-position.

Six findings are noted: one high-severity CSS scope issue, two medium concerns, and two low items.

---

## High Issues

### HR-01: `.p-button.p-button-icon-only` selector bleeds to other routes after Wallecx navigation

**File:** `src/assets/wallecx-overrides.css:65-68`

**Issue:** The rule `.p-button.p-button-icon-only { min-width: 44px; min-height: 44px; }` targets any PrimeVue `Button` whose label is absent — a global class applied by PrimeVue, not Wallecx-specific. The CSS file is commented as "imported exclusively from WallecxApp.vue so the rule is bundled with the Wallecx lazy-loaded chunk". This is true for the initial page load: the style is injected only when the user first navigates to `/projects/wallecx`. However, in a SPA, injected styles are **not removed on route change**. Once the Wallecx chunk is loaded, the rule persists for the remainder of the session and affects icon-only buttons in all other routes.

Confirmed blast-radius target: `src/components/projects/lextrack/ActivityCard.vue:44` renders a `<Button rounded size="small">` with only a `#icon` slot and no label — PrimeVue will assign `p-button-icon-only` to it. After Wallecx has been visited in the same session, that ActivityCard button's dimensions will be elevated to 44×44px, overriding its `size="small"` intent.

This is not visible on initial LexTrack load (Wallecx chunk not yet loaded), but any user who visits Wallecx then navigates to LexTrack will see the effect. It is a latent session-order bug.

**Fix:** Scope the selector to Wallecx-specific context using the `.wallecx-main-tabs` ancestor or a dedicated wrapper class already established on the WallecxApp `<Card>`. The cleanest approach is to add a root class to the WallecxApp Card and prefix this rule:

```css
/* Before (current — global blast radius): */
.p-button.p-button-icon-only {
  min-width: 44px;
  min-height: 44px;
}

/* After (scoped to Wallecx card root): */
.wallecx-root .p-button.p-button-icon-only {
  min-width: 44px;
  min-height: 44px;
}
```

Add `class="wallecx-root"` to the `<Card>` in `WallecxApp.vue:68`. PrimeVue teleports Dialogs and Drawers to `<body>`, so this pattern does not cover buttons inside teleported overlays — those would need a second scoped rule or a separate `.p-overlay-modal .p-button.p-button-icon-only` rule (which is equally global but at least narrower). The per-tab `.wallecx-main-tabs .p-tab` rule already uses this scoping pattern correctly; apply the same discipline here.

---

## Medium Issues

### MD-01: Sticky toolbar `top` offset (52px) is a hardcoded approximation that may clip content on some devices

**File:** `src/assets/wallecx-overrides.css:107`

**Issue:** The sticky toolbar uses `top: calc(env(safe-area-inset-top) + 52px)`. The comment acknowledges this is "≈44px tab height", yet the minimum tab height set by the same file is 44px (line 75). The 8px gap (52 - 44 = 8) is an assumed tab padding, but PrimeVue Aura's tab height is driven by the actual rendered font-size, padding-top, and padding-bottom of `.p-tab`, not just `min-height`. If the rendered tab row is taller than 52px (e.g. on a device with a large system font or when PrimeVue's tab padding exceeds 4px top+bottom), the sticky toolbar will **overlap the bottom of the TabList**, partially obscuring the active ink-bar. Conversely, if the tab row renders at exactly 44px, the 8px gap leaves an unmasked seam exposing scrolled content between the tablist and toolbar.

**Fix:** Derive the offset dynamically in `WallecxApp.vue` using a ResizeObserver on the TabList element and a CSS custom property, or measure the actual Aura `.p-tablist` computed height at runtime. If a static value must be kept, 52px is generous enough to avoid overlap in practice, but document the measured value from DevTools rather than calling it an approximation. At minimum, cross-check the real rendered height in a browser at the target breakpoint and update the comment with the measured value.

### MD-02: ManageBudget mobile Drawer missing `@hide` handler — `isSaving` state can persist across reopen

**File:** `src/components/projects/wallecx/ManageBudget.vue:164-227`

**Issue:** The Dialog branch wires `:closable="!isSaving"` (line 109) to prevent close during save. The Drawer branch correctly wires `:show-close-icon="!isSaving"` (line 168), but neither branch attaches an `@hide` event handler. The `isSaving` ref is set `false` in the `finally` block of `onSubmit`, so a successful or errored save will correctly reset it. However, if a save request is in flight and the user dismisses the Drawer via the system back gesture or backdrop tap (which PrimeVue dispatches as `@hide` before `show-close-icon` can be checked), the `isSaving` flag may be `true` when the Drawer closes and then the Drawer is reopened. On reopen, the `visible` watcher fires, re-populates `localRows`, and the save button will be disabled because `isSaving` is still `true` from the aborted request.

In practice, the `finally` block will eventually run (network resolve/reject), but there is a window where the UI appears broken. The companion components (ManageMembership, ManageVaccination, ManageExpense) all use `@hide` to reset state. ManageBudget should follow the same pattern.

**Fix:**
```typescript
// In ManageBudget.vue <script setup>
function onHide(): void {
  // Belt-and-suspenders: reset saving state if the drawer is dismissed
  // while a request is in flight (back gesture / backdrop tap).
  isSaving.value = false;
}
```

```html
<!-- In the Drawer element -->
<Drawer
  v-else
  v-model:visible="visible"
  position="bottom"
  :show-close-icon="!isSaving"
  @hide="onHide"
>
```

Note: The Dialog branch would benefit from the same `@hide`, but it uses `:closable="!isSaving"` which already prevents closure during save, so the exposure there is lower.

### MD-03: `wallecx-tab-toolbar` background falls back to `white` hardcode on light mode if `--p-card-background` is undefined

**File:** `src/assets/wallecx-overrides.css:109`

**Issue:** The sticky toolbar rule uses `background: var(--p-card-background, white)`. The fallback `white` is a hardcoded colour. If PrimeVue's card background in light mode is not pure `#ffffff` (e.g., slightly off-white from Aura's palette), the sticky toolbar will show a visible seam as content scrolls under it, exactly the problem the phase set out to fix in dark mode. The dark-mode rule at line 115 uses the explicit `#1a1f2e` value, consistent with the `.my-app-dark .p-card` override in the same file, but the light-mode fallback has no corresponding guard.

**Fix:** Replace the `white` fallback with the actual Aura light-mode card background token. Inspect `--p-card-background` in the browser on light mode to get the real value (typically `#ffffff` in Aura's default palette, in which case the fallback is harmless). If it is indeed `#ffffff`, document that fact in the comment. If it differs, update the fallback to match:

```css
.wallecx-tab-toolbar {
  position: sticky;
  top: calc(env(safe-area-inset-top) + 52px);
  z-index: 9;
  background: var(--p-card-background, #ffffff); /* Aura light: #ffffff */
}
```

---

## Low Issues

### LW-01: DragHandle rendered unconditionally inside MembershipsTab Drawer header (no `v-if="isMobile"`)

**File:** `src/components/projects/wallecx/MembershipsTab.vue:356`

**Issue:** The `MembershipsTab` Drawer at line 348 only ever uses `position="bottom"` (the Drawer is guarded by `v-else` on the `!isMobile` Dialog branch, so it only renders on mobile). The `DragHandle` inside its `#header` slot at line 356 has no `v-if` guard, but since the entire Drawer is mobile-only this is functionally correct. The inconsistency is with `VaccinationsTab.vue:432`, where `DragHandle` is gated `v-if="isMobile"` inside a dual-position Drawer (`position="bottom"` on mobile, `"right"` on desktop). The pattern is correct in both cases but the gating convention differs: in VaccinationsTab the same Drawer serves both orientations so the guard is necessary; in MembershipsTab the Drawer is already mobile-only so the guard is redundant. No functional defect, but the inconsistency could confuse a future reader into thinking the MembershipsTab DragHandle is always shown.

**Fix:** Add a clarifying comment in MembershipsTab.vue at the Drawer header, or optionally add the `v-if="isMobile"` guard for consistency even though it is redundant:

```html
<!-- DragHandle: this Drawer is already v-else (mobile only), so isMobile is
     always true here. Guard omitted intentionally — unlike VaccinationsTab
     which has a dual-position Drawer. -->
<DragHandle />
```

### LW-02: ManageVaccination Drawer branch omits `chooseLabel` for the card FileUpload in edit mode

**File:** `src/components/projects/wallecx/ManageVaccination.vue:419-427` (Drawer branch)

**Issue:** The Desktop Dialog branch of ManageVaccination (lines 299-311) and both branches of ManageMembership (lines 352-360, lines 478-486) apply `:chooseLabel="isEditMode && record?.card_image ? 'Replace image' : undefined"` to their FileUpload. ManageVaccination's Drawer branch (lines 419-427) does not apply `chooseLabel`. In practice, vaccination records may or may not have a pre-existing card attachment, and omitting the label is not a data-loss risk. However, the UX is inconsistent: a user editing a vaccination record with an existing card on mobile will see the generic "Choose" label rather than "Replace card". There is also no thumbnail preview for the existing card attachment in the Drawer branch (the Dialog branch at line 299 also has no thumbnail, since vaccination cards are not displayed inline, so this is symmetric). The missing `chooseLabel` is the only divergence.

**Fix:** Apply the same conditional label pattern in the Drawer branch:

```html
<FileUpload
  mode="basic"
  :auto="false"
  accept="image/jpeg,image/png,image/webp,application/pdf"
  :maxFileSize="10485760"
  :disabled="isSaving"
  :chooseLabel="isEditMode && record?.card ? 'Replace card' : undefined"
  @select="onFileSelect"
/>
```

Note: the field name for the vaccination card file is `card` (not `card_image`), so the guard should check `record?.card`.

---

_Reviewed: 2026-05-27T10:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
