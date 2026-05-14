---
phase: 15-mobile-layouts
reviewed: 2026-05-14T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - index.html
  - src/App.vue
  - src/components/projects/wallecx/MembershipCard.vue
  - src/components/projects/wallecx/PwaInstallBanner.vue
  - src/components/projects/wallecx/VaccinationGroupCard.vue
  - src/components/projects/wallecx/VaccinationGroupPanel.vue
  - src/components/projects/wallecx/WallecxApp.vue
  - src/components/projects/wallecx/WallecxToolbar.vue
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 15: Code Review Report

**Reviewed:** 2026-05-14
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Eight files were reviewed covering the Phase 15 Mobile Layouts work: the HTML entry point, the app shell, and six Wallecx Vue components. No critical security vulnerabilities or data-loss risks were found. UA detection in `PwaInstallBanner.vue` is read-only and contains no XSS vector. The `env()` safe-area calls are syntactically correct. Four warnings require attention before merge: a conflicting `min-height` declaration on `MembershipCard`, a missing `tabindex` on a `role="button"` div in `WallecxToolbar`, a non-scoped style rule in `WallecxApp` that bleeds globally, and a `VaccinationGroupCard` touch-target that does not meet the 44 px minimum at its Card root. Three informational items are also noted.

---

## Warnings

### WR-01: Conflicting `min-height` declarations collapse the touch target on MembershipCard

**File:** `src/components/projects/wallecx/MembershipCard.vue:53-58`

**Issue:** The `<Card>` root has both a Tailwind utility class `min-h-[44px]` (44 px) and an inline style `style="min-height: 8rem;"` (128 px). The inline style wins due to specificity, so the 44 px touch-target class is silently dead. This is harmless today because 8 rem > 44 px, but the redundant class signals a misunderstanding: the 44 px touch-target intent is already satisfied by the `8rem` minimum. The dead class will confuse future maintainers and may be removed inadvertently, leaving no documented minimum.

**Fix:** Remove the redundant Tailwind `min-h-[44px]` class and document the intent via a comment, or consolidate to a single declaration:

```html
<!-- min-height: 8rem satisfies the 44px touch-target requirement -->
<Card
  class="cursor-pointer hover:shadow-md transition-shadow overflow-hidden touch-manipulation"
  :style="[tileStyle, { minHeight: '8rem' }]"
  @click="emit('click')"
>
```

---

### WR-02: `role="button"` div in WallecxToolbar is not keyboard-accessible (missing `tabindex`)

**File:** `src/components/projects/wallecx/WallecxToolbar.vue:39-46`

**Issue:** The clear-search affordance is rendered as a `<div role="button">` without `tabindex="0"`. The ARIA spec requires interactive elements with `role="button"` to be focusable. Without `tabindex="0"`, keyboard users cannot tab to the control, and screen readers that expose it as a button will be unable to trigger it via the keyboard. Additionally, the element has no `@keydown` handler for `Enter`/`Space`, which are the expected activation keys for `role="button"`.

**Fix:** Use a native `<button>` element (preferred — removes the need for `tabindex` and keyboard handlers), or add `tabindex="0"` plus a `@keydown` guard:

```html
<!-- Preferred: native button -->
<button
  v-if="searchQuery"
  class="min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation cursor-pointer"
  aria-label="Clear search"
  style="background: none; border: none; padding: 0;"
  @click="emit('update:searchQuery', '')"
>
  <InputIcon class="pi pi-times" />
</button>
```

---

### WR-03: Non-scoped `<style>` block in WallecxApp.vue leaks `.p-dialog-content` globally

**File:** `src/components/projects/wallecx/WallecxApp.vue:102-110`

**Issue:** The `<style>` block is intentionally non-scoped (the comment explains why: scoped attributes would not match PrimeVue's internal DOM nodes). However, `.p-dialog-content { max-height: 80dvh; overflow-y: auto; }` is injected into the global stylesheet for the entire application's lifetime once this component is mounted — it is not torn down on unmount. Any other route that uses a PrimeVue `<Dialog>` will have its `.p-dialog-content` height constrained to `80dvh`, which may be undesirable and could break dialogs in other mini-apps (LexTrack, Gift Exchange, etc.).

**Fix:** Either scope the override to Wallecx by adding a wrapper class and using deep combinator, or register the global rule once at the app level (e.g., in a shared CSS file) with documentation:

```vue
<!-- Option A: deep combinator scoped to Wallecx wrapper -->
<style scoped>
:deep(.p-dialog-content) {
  max-height: 80dvh;
  overflow-y: auto;
}
</style>
```

Note: `:deep()` with `scoped` will scope the selector to descendants of this component's root element, which does NOT solve the problem if the Dialog is teleported to `<body>`. In that case, a dedicated CSS file entry (e.g., `src/assets/wallecx-overrides.css`) imported only from the Wallecx route entry point is the safest approach.

---

### WR-04: VaccinationGroupCard touch target is 44 px on the Card root only, not on the clickable surface

**File:** `src/components/projects/wallecx/VaccinationGroupCard.vue:29-31`

**Issue:** `min-h-[44px]` is applied to the `<Card>` component root. PrimeVue's `Card` renders a wrapper `<div class="p-card">` followed by inner content divs. The `min-h-[44px]` Tailwind class is placed on the component tag, which Vue applies to the component's root element. However, `Card` does not have an `@click` handler — the click is on the outer `<Card>` element. If PrimeVue's Card renders its root as a non-interactive `<div>`, the touch target is present but there is no explicit `role` or `tabindex` making it keyboard-accessible. This is consistent with `MembershipCard.vue`, so it is a systemic pattern issue rather than an isolated one.

**Fix:** Add `role="button"` and `tabindex="0"` to the `<Card>` element (and a `@keydown.enter` handler), or wrap the Card in a `<button>` element. This matches the fix needed in `MembershipCard.vue` as well.

```html
<Card
  class="cursor-pointer hover:shadow-md transition-shadow min-h-[44px] touch-manipulation"
  role="button"
  tabindex="0"
  :aria-label="`${vaccineType} vaccination group`"
  @click="emit('click')"
  @keydown.enter="emit('click')"
>
```

---

## Info

### IN-01: `isIosSafari()` does not detect iOS Chrome on iPad (iPadOS 13+)

**File:** `src/components/projects/wallecx/PwaInstallBanner.vue:8-11`

**Issue:** The UA exclusion list `/CriOS|FxiOS|OPiOS|mercury/i` correctly excludes Chrome iOS (CriOS), Firefox iOS (FxiOS), and Opera iOS (OPiOS). However, on iPadOS 13+ Chrome does not include `CriOS` in its UA string — it presents a desktop-class UA similar to `"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15..."`. This means the banner could theoretically be suppressed for some iPad Chrome users, though those users also cannot install via Add to Home Screen from Chrome on iPadOS, so the net effect is acceptable. This is a known limitation of UA sniffing on iPadOS 13+. No code change is strictly required, but a comment noting the limitation would improve future maintainability.

**Fix (comment only):**
```typescript
// NOTE: iPadOS 13+ Chrome presents a desktop UA and does not include 'iPad' in the string,
// so it is silently excluded. iPadOS Chrome cannot add to Home Screen anyway, so this is acceptable.
function isIosSafari(): boolean {
```

---

### IN-02: `interactive-widget=resizes-content` in viewport meta is a non-standard value on some older browsers

**File:** `index.html:6`

**Issue:** `interactive-widget=resizes-content` is a Chrome 108+ feature controlling how the virtual keyboard affects the viewport. It is not supported in Safari (iOS) and is silently ignored there. This is the intended behaviour — Safari has its own resize semantics. The value is safe to ship and the fallback is graceful. However, the combination with `viewport-fit=cover` means that on Safari the bottom safe-area padding applied in `WallecxApp.vue` and `PwaInstallBanner.vue` is doing the full job of preventing content from hiding under the home indicator. This is correct. No code change required; noting for documentation purposes.

---

### IN-03: `VaccinationGroupPanel.vue` accepts `listToken` prop but does not use it

**File:** `src/components/projects/wallecx/VaccinationGroupPanel.vue:6-8`

**Issue:** The `listToken` prop is declared and the comment acknowledges it is unused (`// included for API consistency; unused in Drawer columns`). This is intentional interface consistency. However, TypeScript / vue-tsc will not warn on unused props by default, so there is no compiler safety net if the prop is later removed from the parent without updating this component. This is low risk but worth noting.

**Fix:** No immediate action required. If the prop is never intended to be used, consider removing it from the interface and the parent's binding to keep the contract honest. If it may be needed in the future, the comment is sufficient documentation.

---

_Reviewed: 2026-05-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
