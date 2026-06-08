# Phase 15: Mobile Layouts - Research

**Researched:** 2026-05-14
**Domain:** Responsive CSS, iOS PWA, touch targets, viewport meta, safe-area insets
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `PwaInstallBanner.vue` is a **fixed bottom strip** — sits above home indicator using safe-area-inset-bottom padding; always visible without displacing content.
- **D-02:** Banner appearance is **minimal**: Wallecx icon + brief text + X dismiss. Navy/amber brand palette. Use Unicode/emoji glyph or `iconify-icon` for Share icon — no custom SVG.
- **D-03:** Dismiss is **X button only** — sets `localStorage` key (e.g., `wallecx_install_banner_dismissed`) to `"true"`. Banner never reappears. No auto-dismiss timer, no expiry.
- **D-04:** Shown only on iOS Safari (check `navigator.userAgent` for iPhone/iPad/iPod) when NOT in standalone mode (`window.matchMedia('(display-mode: standalone)').matches`). Not shown on Android.
- **D-05:** Rendered in `WallecxApp.vue` template (not App.vue) — Wallecx-specific, must not bleed into other mini-apps.
- **D-06:** Apply `max-height: 80dvh` and `overflow-y: auto` to PrimeVue Dialog content via a **global CSS override** in a `<style>` block targeting `.p-dialog-content`. One rule covers all 4 dialogs.
- **D-07:** `interactive-widget=resizes-content` added to `<meta name="viewport">` in `index.html` alongside `viewport-fit=cover`.
- **D-08:** `viewport-fit=cover` added to `index.html` viewport meta (pairs with D-07).
- **D-09:** **Top safe-area** handled in **App.vue or CustomNavBar wrapper** — nav bar lives outside WallecxApp.vue.
- **D-10:** **WallecxApp.vue** handles `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)`, and `env(safe-area-inset-right)` on its root container.
- **D-11:** `overscroll-behavior: none` applied to WallecxApp.vue root container via Tailwind `overscroll-none` class.
- **D-12:** Use **per-element Tailwind classes** (`min-h-[44px]`, `min-w-[44px]`, `touch-manipulation`) on wrapper divs or buttons in each component.
- **D-13:** Components to audit: `WallecxToolbar.vue`, `VaccinationGroupPanel.vue`, `MembershipCard.vue`, `VaccinationGroupCard.vue`, dialog action buttons in ManageVaccination and ManageMembership.
- **D-14:** Existing `grid grid-cols-1 sm:grid-cols-2 gap-4` in both tab files already correct — MOB-03/04 are verify-and-confirm tasks, not modification tasks.
- **D-15:** Loading skeleton grids also already use `grid grid-cols-1 sm:grid-cols-2 gap-4` — no change needed.

### Claude's Discretion

- Exact text of the iOS install banner copy (within the "minimal: icon + text + X" constraint).
- Iconify icon to use for the Share/install glyph in the banner.
- Whether to use Tailwind `overscroll-none` class or inline CSS for overscroll-behavior.
- Which `localStorage` key name to use for the banner dismissed state.
- Whether App.vue or CustomNavBar is the better place for top safe-area padding.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MOB-01 | All Wallecx screens fully usable on 375px without horizontal scroll or clipping | Safe-area insets + overscroll lock cover edge cases; grid already 1-col on mobile |
| MOB-02 | All interactive elements have minimum 44×44px touch target | `min-h-[44px] min-w-[44px] touch-manipulation` per-element Tailwind classes |
| MOB-03 | MembershipsTab grid: 1-col < 640px, 2-col ≥ 640px | Already `grid grid-cols-1 sm:grid-cols-2 gap-4` — verify-only |
| MOB-04 | VaccinationsTab grid: same 1→2-col breakpoint behaviour | Already `grid grid-cols-1 sm:grid-cols-2 gap-4` — verify-only |
| MOB-05 | CRUD dialogs render with `max-height: 80dvh` + `overflow-y: auto`; `interactive-widget=resizes-content` in viewport meta | Global `.p-dialog-content` CSS override; index.html viewport meta update |
| MOB-06 | `viewport-fit=cover` in viewport meta; safe-area insets applied | index.html meta + App.vue top inset + WallecxApp.vue bottom/left/right insets |
| MOB-07 | `overscroll-behavior: none` on Wallecx shell | `overscroll-none` Tailwind class on WallecxApp.vue root container |
| MOB-08 | PwaInstallBanner.vue: iOS Safari only, not standalone, localStorage dismiss | New component: userAgent + matchMedia detection, fixed bottom strip, X dismiss |
</phase_requirements>

---

## Summary

Phase 15 is a pure CSS and minimal-JavaScript phase. No new PocketBase collections, routes, or data capabilities are added. The phase touches eight files: `index.html` (viewport meta), `src/App.vue` (top safe-area), `src/components/projects/wallecx/WallecxApp.vue` (bottom/side insets, overscroll, banner render), `src/components/projects/wallecx/WallecxToolbar.vue` (touch targets), `src/components/projects/wallecx/VaccinationGroupPanel.vue` (touch targets), `src/components/projects/wallecx/MembershipCard.vue` (touch target wrapper), `src/components/projects/wallecx/VaccinationGroupCard.vue` (touch target wrapper), and a new `src/components/projects/wallecx/PwaInstallBanner.vue`.

MOB-03 and MOB-04 are verify-only: the grids in both tab files already use `grid grid-cols-1 sm:grid-cols-2 gap-4`, which is the correct responsive class. The planner should include explicit verification tasks for these (read the template, confirm the class, mark done) rather than edit tasks.

The primary technical risk in this phase is the iOS install banner. iOS does not fire `beforeinstallprompt`, so detection must be done purely via `navigator.userAgent` and `window.matchMedia('(display-mode: standalone)').matches`. The banner is `position: fixed; bottom: 0` with padding for the home indicator (`env(safe-area-inset-bottom)`), which is the standard pattern for iOS native apps.

**Primary recommendation:** Implement in dependency order: (1) index.html viewport meta first (all other mobile fixes depend on `viewport-fit=cover`), (2) App.vue top safe-area, (3) WallecxApp.vue root container (safe-area bottom/left/right + overscroll-none), (4) global dialog CSS override, (5) touch target classes per component, (6) PwaInstallBanner.vue new component.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Viewport meta (`viewport-fit`, `interactive-widget`) | Browser/Client | — | Processed by browser at parse time; lives in index.html |
| Top safe-area (notch / Dynamic Island) | Frontend Shell (App.vue) | — | Nav bar is defined in App.vue above `<RouterView />`; inset must wrap the nav bar |
| Bottom/side safe-area insets | Frontend Shell (WallecxApp.vue) | — | WallecxApp.vue is the scrollable content shell; home indicator sits below it |
| Overscroll lock | Frontend Shell (WallecxApp.vue) | — | Must be on the scroll container that has the card grids |
| Dialog height constraint | UI Layer (global CSS) | — | PrimeVue Dialog renders `.p-dialog-content`; a single global rule covers all instances |
| Touch targets | Component Layer | — | Per-element classes on each interactive element; no shared wrapper possible |
| iOS install banner | Component (PwaInstallBanner.vue) | WallecxApp.vue (host) | Detection and state are component-local; rendered in WallecxApp.vue to stay Wallecx-specific |
| Responsive card grids | Component Layer (MembershipsTab/VaccinationsTab) | — | Already correct; verify-only |

---

## Standard Stack

### Already in Project (no new installs)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Tailwind CSS v4 | 4.2.4 [VERIFIED: npm view output] | Utility classes: `overscroll-none`, `min-h-[44px]`, `touch-manipulation`, `pb-safe`, padding via inline `env()` | Already installed via `@tailwindcss/vite` |
| PrimeVue | 4.5.5 [VERIFIED: npm view output] | Dialog component; CSS class `.p-dialog-content` is the target for scroll override | Already installed |
| iconify-icon | — | Share icon glyph in PWA banner (`mdi:share` or `mdi:export-variant`) | Already registered as custom element in vite.config.ts |

### No New Packages Required

This phase requires no `npm install`. All capabilities are achievable with Tailwind arbitrary values, native CSS `env()` functions, and vanilla JavaScript in `<script setup>`.

**Why no `tailwindcss-safe-area` plugin:** Tailwind v4 supports arbitrary values (`[env(safe-area-inset-bottom)]`) directly in class names. The plugin adds utility aliases but the team's established pattern uses inline `style` or Tailwind arbitrary values — no plugin needed.

---

## Architecture Patterns

### System Architecture Diagram

```
index.html (viewport meta)
   └─> viewport-fit=cover → env() functions become non-zero on notch devices
   └─> interactive-widget=resizes-content → keyboard resize shrinks visual viewport, not layout

App.vue (top safe-area)
   └─> CustomNavBar wrapper gets padding-top: env(safe-area-inset-top)
   └─> Protects notch / Dynamic Island from overlapping nav bar

WallecxApp.vue (scroll container root)
   └─> padding-bottom: env(safe-area-inset-bottom) → home indicator clearance
   └─> padding-left/right: env(safe-area-inset-left/right) → landscape notch
   └─> overscroll-none → blocks iOS pull-to-refresh
   └─> <PwaInstallBanner /> → iOS-only fixed bottom strip

PwaInstallBanner.vue (new component)
   └─> onMounted: iOS userAgent check + standalone check + localStorage check
   └─> v-if on ref(isVisible)
   └─> fixed bottom-0 w-full strip with safe-area-inset-bottom padding
   └─> X dismiss → localStorage.setItem + isVisible = false

Global CSS (WallecxApp.vue <style> block, not scoped)
   └─> .p-dialog-content { max-height: 80dvh; overflow-y: auto; }
   └─> Covers ManageVaccination, ManageMembership, VaccinationDetail, MembershipDetail

Per-component touch targets (no data flow, class additions only)
   └─> WallecxToolbar.vue: sort button, view toggle button, search clear icon
   └─> VaccinationGroupPanel.vue: DataTable action buttons (View/Edit/Delete)
   └─> MembershipCard.vue: Card root clickable element
   └─> VaccinationGroupCard.vue: Card root clickable element
   └─> ManageMembership / ManageVaccination: Submit button (PrimeVue fluid Button already ≥44px in most cases — verify)
```

### Recommended File Touch Map

```
index.html                                        # viewport meta update (MOB-05, MOB-06)
src/App.vue                                       # top safe-area inset (MOB-06)
src/components/projects/wallecx/
├── WallecxApp.vue                                # root container classes + PwaInstallBanner render + global CSS (MOB-06, MOB-07)
├── WallecxToolbar.vue                            # touch targets (MOB-02)
├── VaccinationGroupPanel.vue                     # touch targets on DataTable buttons (MOB-02)
├── MembershipCard.vue                            # touch target wrapper (MOB-02)
├── VaccinationGroupCard.vue                      # touch target wrapper (MOB-02)
├── MembershipsTab.vue                            # verify-only grid class (MOB-03)
├── VaccinationsTab.vue                           # verify-only grid class (MOB-04)
└── PwaInstallBanner.vue  [NEW]                   # iOS install banner (MOB-08)
```

### Pattern 1: Safe-area Insets via CSS env()

**What:** Native CSS functions that resolve to non-zero values when `viewport-fit=cover` is set and the device has a notch or home indicator.

**When to use:** After `viewport-fit=cover` is in the viewport meta. Without it, all `env()` values resolve to 0.

**Example — inline style on WallecxApp.vue root container:**
```vue
<!-- src/components/projects/wallecx/WallecxApp.vue template root -->
<Card
  class="overscroll-none"
  :style="{
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
  }"
>
```

**Example — App.vue top safe-area on CustomNavBar wrapper:**
```vue
<!-- src/App.vue -->
<CustomNavBar class="mb-1" :style="{ paddingTop: 'env(safe-area-inset-top)' }" />
```

Note: `env(safe-area-inset-top)` resolves to `0px` on devices without a notch — safe to apply unconditionally. [CITED: https://developer.mozilla.org/en-US/docs/Web/CSS/env#using_env_to_ensure_content_is_not_obscured_by_window_ui_controls]

### Pattern 2: Tailwind `overscroll-none`

**What:** `overscroll-none` generates `overscroll-behavior: none` — prevents iOS rubber-band and pull-to-refresh gestures on the scroll container.

**When to use:** On the outermost scroll container in WallecxApp.vue.

**Verified:** `overscroll-none` is a valid Tailwind CSS v4 class generating `overscroll-behavior: none`. [VERIFIED: tailwindcss.com/docs/overscroll-behavior]

```vue
<Card class="overscroll-none" ...>
```

### Pattern 3: Global Dialog CSS Override

**What:** A `<style>` block without `scoped` attribute in WallecxApp.vue that targets `.p-dialog-content`. Because it is non-scoped, it affects all PrimeVue Dialogs rendered inside the WallecxApp.vue subtree (and their Teleport portals).

**When to use:** Single rule covers all 4 dialogs (ManageVaccination, ManageMembership, VaccinationDetail, MembershipDetail) without touching their templates.

```vue
<!-- src/components/projects/wallecx/WallecxApp.vue -->
<style>
/* MOB-05: Constrain all PrimeVue Dialog content to 80dvh so CRUD forms scroll
   within the dialog and are not pushed off-screen by the iOS soft keyboard.
   Non-scoped so it applies to all Dialog instances in the Wallecx subtree. */
.p-dialog-content {
  max-height: 80dvh;
  overflow-y: auto;
}
</style>
```

**Caution:** The `!important` flag is NOT needed here because the rule targets the class directly and `max-height` overrides PrimeVue's default `overflow: auto` without conflict. If PrimeVue's default Aura theme sets `max-height` explicitly, add `!important` as a fallback. [ASSUMED — PrimeVue Aura default for `.p-dialog-content` max-height not verified against the exact v4.5.5 Aura compiled output]

### Pattern 4: Touch Targets via Tailwind Arbitrary Values

**What:** `min-h-[44px]`, `min-w-[44px]`, `touch-manipulation` classes applied to interactive elements.

**When to use:** On any tappable element smaller than 44×44px. `touch-manipulation` disables double-tap-to-zoom, eliminating the 300ms tap delay on iOS Safari.

**44px is Apple HIG minimum touch target size.** [CITED: developer.apple.com/design/human-interface-guidelines/accessibility]

```vue
<!-- Toolbar button example -->
<Button
  class="min-h-[44px] min-w-[44px] touch-manipulation"
  ...
/>

<!-- Card tile wrapper example -->
<Card
  class="cursor-pointer hover:shadow-md transition-shadow overflow-hidden min-h-[44px] touch-manipulation"
  ...
/>
```

**Note on PrimeVue Button:** PrimeVue Button with `size="small"` renders as approximately 32px height. `min-h-[44px]` overrides this. Fluid Buttons (`:fluid` or `class="w-full"`) span full width; they only need `min-h-[44px]`.

### Pattern 5: iOS Install Banner Component

**What:** New `PwaInstallBanner.vue` — a fixed bottom strip component shown only on iOS Safari when not already in standalone mode and not previously dismissed.

**iOS detection logic (verified against multiple sources):**

```typescript
// Source: MDN, web.dev/learn/pwa — standard pattern for iOS PWA install detection
function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);
}

function isInStandaloneMode(): boolean {
  // window.navigator.standalone is iOS-specific: true when launched from home screen
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}
```

**Why both checks:** `window.matchMedia('(display-mode: standalone)').matches` is the standard W3C approach [CITED: web.dev/learn/pwa/detection]. `window.navigator.standalone` is the older iOS-specific property — checking both ensures coverage for older iOS versions. [ASSUMED — the exact iOS version where `matchMedia standalone` became reliable is not confirmed; using both as belt-and-suspenders is standard practice]

**localStorage dismiss pattern (follows WallecxApp.vue established style):**

```typescript
const BANNER_DISMISSED_KEY = 'wallecx_pwa_banner_dismissed';

const isVisible = ref(false);

onMounted(() => {
  try {
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissed === 'true') return;
    if (isIosSafari() && !isInStandaloneMode()) {
      isVisible.value = true;
    }
  } catch {
    // localStorage throws in private mode — silently degrade
  }
});

function dismiss(): void {
  try {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  } catch {
    // Degrade silently
  }
  isVisible.value = false;
}
```

**Fixed bottom strip with safe-area clearance:**

```vue
<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3"
      :style="{
        backgroundColor: '#002244',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
      }"
      role="complementary"
      aria-label="Install Wallecx"
    >
      <!-- Icon + text -->
      <iconify-icon icon="mdi:share-variant" width="20" height="20" style="color: #f59e0b; flex-shrink: 0;" aria-hidden="true"></iconify-icon>
      <span class="flex-1 text-sm" style="color: #ffffff;">
        Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> to install Wallecx
      </span>
      <!-- Dismiss button -->
      <button
        class="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
        style="color: rgba(255,255,255,0.7); background: none; border: none; cursor: pointer;"
        aria-label="Dismiss install banner"
        @click="dismiss"
      >
        <iconify-icon icon="mdi:close" width="20" height="20" aria-hidden="true"></iconify-icon>
      </button>
    </div>
  </Teleport>
</template>
```

**Why Teleport to body:** The banner must render above all PrimeVue Dialog z-index layers. Using `Teleport to="body"` mirrors the existing scan overlay pattern in MembershipDetail.vue (`style="z-index: 9999"`) — the fixed banner uses `z-50` (z-index: 50) which is above typical page content but below the scan overlay's 9999. [VERIFIED: MembershipDetail.vue lines 166-203]

### Anti-Patterns to Avoid

- **Using `scoped` on the dialog CSS override:** Scoped styles add a `[data-v-xxxxxxxx]` attribute selector, which will NOT match `.p-dialog-content` elements rendered by PrimeVue's internal DOM tree. The override must be non-scoped.
- **Setting `overscroll-behavior` on body or html globally:** This would break pull-to-refresh on ALL Lexarium pages, not just Wallecx. It must be on the WallecxApp.vue root container only.
- **`viewport-fit=cover` without safe-area padding:** Without padding, content is clipped behind the notch. The meta change and the padding changes must ship together.
- **Checking only `matchMedia standalone` for iOS:** Older iOS Safari versions (pre-iOS 13) do not reliably support this media query; always also check `window.navigator.standalone`.
- **PrimeVue `:pt` passthrough for dialog scroll:** Decision D-06 locks the approach as a global CSS override — do NOT use `:pt` passthrough or per-dialog style props.
- **Touch targets on the `<Card>` PrimeVue component root:** PrimeVue Card renders as a `<div>` — `min-h-[44px]` must be on the wrapper element or the Card class attribute, not on `#content` slot elements.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Safe-area spacing | Custom JS to read `visualViewport.offsetTop` | Native CSS `env(safe-area-inset-*)` | Browser-native, zero JS, updates automatically on orientation change |
| iOS standalone detection | Complex UA parsing library | `window.navigator.standalone` + `matchMedia` | Two-line check, no dependencies |
| Dialog scroll handling | `useResizeObserver` on dialog content | CSS `max-height: 80dvh; overflow-y: auto` | CSS handles the keyboard resize via `interactive-widget=resizes-content` in viewport meta |
| Viewport resize listener | `window.addEventListener('resize')` for keyboard | `interactive-widget=resizes-content` in viewport meta | Tells the browser to shrink the visual viewport, not the layout viewport — no JS needed |
| Pull-to-refresh guard | Touch event listeners for swipe detection | `overscroll-behavior: none` CSS | One CSS property, browser-native, no gesture listener bugs |

**Key insight:** Every capability in this phase has a native CSS solution. JavaScript is only needed for the banner's iOS detection and `localStorage` state — not for layout.

---

## Runtime State Inventory

> This phase is not a rename/refactor/migration phase. Omit.

---

## Environment Availability

> This phase is purely code/config changes — no external CLIs, services, or databases beyond those already used in Phase 14.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Tailwind CSS v4 | All CSS classes | Yes | 4.2.4 | — |
| PrimeVue | Dialog CSS override | Yes | 4.5.5 | — |
| iconify-icon | Banner icon | Yes (registered in vite.config.ts) | — | Use emoji 📤 |

**Step 2.6: All dependencies available — no missing dependencies.**

---

## Common Pitfalls

### Pitfall 1: Scoped Style Breaks Dialog Override

**What goes wrong:** Adding `<style scoped>` instead of `<style>` for the `.p-dialog-content` override means the compiled selector becomes `.p-dialog-content[data-v-xxxxxx]` which never matches PrimeVue's internally rendered DOM.

**Why it happens:** Vue SFC `scoped` is the default muscle memory; developers add it without thinking.

**How to avoid:** The `<style>` block must have NO `scoped` attribute. Comment it clearly: `/* MOB-05: non-scoped — must target PrimeVue's rendered DOM */`.

**Warning signs:** Dialog content still scrolls off-screen on mobile; Chrome DevTools shows no matching rule for `.p-dialog-content { max-height }`.

### Pitfall 2: `viewport-fit=cover` Without Safe-Area Padding

**What goes wrong:** The iPhone notch overlaps the nav bar or the home indicator overlaps card content at the bottom.

**Why it happens:** `viewport-fit=cover` is added to fix scan overlay coverage but safe-area padding is deferred or missed.

**How to avoid:** The three changes (viewport meta + App.vue top inset + WallecxApp.vue bottom/side insets) must ship in the same plan. Never ship `viewport-fit=cover` alone.

**Warning signs:** Content behind notch on iPhone 14 Pro+; home indicator overlaps the last card in the grid.

### Pitfall 3: iOS Install Banner Z-Index Conflict with Scan Overlay

**What goes wrong:** Banner renders on top of the barcode scan overlay (MembershipDetail.vue uses `z-index: 9999`).

**Why it happens:** Banner is `position: fixed`, which participates in the stacking context.

**How to avoid:** Banner `z-index` must be less than 9999. Using Tailwind `z-50` (z-index: 50) is safe — PrimeVue Dialog uses z-index ~1100; scan overlay uses 9999. Banner at z-50 appears above normal content but below both.

**Warning signs:** Banner visible while scan overlay is active.

### Pitfall 4: DataTable Buttons in VaccinationGroupPanel Under-Sized

**What goes wrong:** PrimeVue DataTable `<Button size="small">` renders at approximately 32px height — below the 44px minimum.

**Why it happens:** `size="small"` overrides PrimeVue's default Button height.

**How to avoid:** Add `class="min-h-[44px]"` to each Button inside the DataTable `#body` template slot. [VERIFIED: VaccinationGroupPanel.vue lines 34-39 — three Buttons with `size="small"`]

**Warning signs:** Tapping a small row action on iOS misses the target and activates the wrong row.

### Pitfall 5: Banner Shown in Chrome on iOS

**What goes wrong:** Chrome on iOS has `/iPhone/i` in its UA string but also has `/CriOS/i`. Android Chrome does NOT need the iOS banner — it uses `beforeinstallprompt`.

**Why it happens:** Simple `/iPhone|iPad|iPod/` check without excluding Chrome iOS (`CriOS`), Firefox iOS (`FxiOS`), etc.

**How to avoid:** The `isIosSafari()` function should explicitly exclude known iOS browser wrappers: `/CriOS|FxiOS|OPiOS/`. [ASSUMED — full list of iOS browser UA strings not exhaustively verified, but CriOS/FxiOS are the high-priority ones]

### Pitfall 6: WallecxApp.vue Root Element is PrimeVue `<Card>`, Not a `<div>`

**What goes wrong:** Developer tries to add `class="overscroll-none"` and inline `padding` style but forgets that PrimeVue `<Card>` renders as a `<div class="p-card">`. Classes added to the `<Card>` component ARE passed through to the root `<div>` — this DOES work in PrimeVue.

**Why it happens:** Uncertainty about PrimeVue component attribute inheritance.

**How to avoid:** PrimeVue 4 components inherit classes/styles on their root element by default — adding `class="overscroll-none"` and `:style="{...}"` to `<Card>` is correct and will be applied to the rendered `<div class="p-card">`. [ASSUMED — PrimeVue 4 attribute inheritance is the documented default; verify in a dev build if unsure]

---

## Code Examples

Verified patterns from the codebase and official sources:

### Viewport Meta Update (index.html)

```html
<!-- Source: CONTEXT.md D-07, D-08 — verified current meta is width=device-width, initial-scale=1.0 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
```

### Safe-Area Top Inset (App.vue)

```vue
<!-- Source: App.vue current template (lines 10-14) — CustomNavBar is the first element -->
<CustomNavBar class="mb-1" :style="{ paddingTop: 'env(safe-area-inset-top)' }" />
```

Alternative if CustomNavBar internal padding is preferred over wrapper padding — add to CustomNavBar.vue's `<Menubar>` element. Planner should prefer App.vue (one touch point) over CustomNavBar (modifying a shared component).

### WallecxApp.vue Root Container (safe-area + overscroll)

```vue
<!-- Source: WallecxApp.vue current template (line 65) — <Card> is the root element -->
<Card
  class="overscroll-none"
  :style="{
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
  }"
>
```

### Global Dialog CSS Override

```vue
<!-- Add as a new <style> block in WallecxApp.vue (not scoped) -->
<style>
/* MOB-05: non-scoped — must target PrimeVue's rendered DOM nodes.
   Scoped styles add data-v- attributes that do not match PrimeVue internals. */
.p-dialog-content {
  max-height: 80dvh;
  overflow-y: auto;
}
</style>
```

### Touch Target on WallecxToolbar.vue Buttons

```vue
<!-- Source: WallecxToolbar.vue lines 53-67 — view toggle Button -->
<!-- Add min-h-[44px] min-w-[44px] touch-manipulation to the Button -->
<Button
  v-if="showToggle"
  severity="secondary"
  size="small"
  class="min-h-[44px] min-w-[44px] touch-manipulation"
  :aria-label="viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'"
  ...
/>
```

The search-clear `InputIcon` (`class="pi pi-times cursor-pointer"`) is not a `<button>` — it needs a wrapper `<div class="min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation">` or must be replaced with a `<button>` element.

### Touch Target on Card Tiles

```vue
<!-- Source: MembershipCard.vue line 53-58 — Card root -->
<Card
  class="cursor-pointer hover:shadow-md transition-shadow overflow-hidden min-h-[44px] touch-manipulation"
  :style="tileStyle"
  @click="emit('click')"
>
```

### VaccinationGroupPanel DataTable Buttons

```vue
<!-- Source: VaccinationGroupPanel.vue lines 34-38 — three Button elements with size="small" -->
<Button size="small" label="View"   class="min-h-[44px] touch-manipulation" @click="emit('view', data)" />
<Button size="small" icon="pi pi-pencil" label="Edit"   class="min-h-[44px] touch-manipulation" severity="secondary" @click="emit('edit', data)" />
<Button size="small" icon="pi pi-trash" label="Delete"  class="min-h-[44px] touch-manipulation" severity="danger"    @click="emit('delete', data)" />
```

### Grid Verification (MOB-03/MOB-04 — read only, no change expected)

```vue
<!-- Source: MembershipsTab.vue line 111 (skeleton) and line 143 (data) -->
<!-- Both are already: class="grid grid-cols-1 sm:grid-cols-2 gap-4" -->
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

<!-- Source: VaccinationsTab.vue lines 340, 388 — gridClass computed in script -->
<!-- gridClass returns 'grid grid-cols-1 sm:grid-cols-2 gap-4' for grid mode -->
<!-- and 'grid grid-cols-1 gap-4' for list mode (always single-column) -->
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `100vh` for full-height layouts | `100dvh` (dynamic viewport height) | Chrome 108 / Safari 15.4 / Firefox 101 (2022-2023) | `dvh` accounts for mobile browser UI; `vh` does not |
| `window.addEventListener('resize')` for keyboard | `interactive-widget=resizes-content` in viewport meta | Chrome 108 (2022) | Declarative; browser handles keyboard-induced resize |
| Custom safe-area JS calculations | `env(safe-area-inset-*)` CSS functions | iOS 11 / CSS env() (2017) | Browser-native; zero JS; auto-updates on orientation change |
| `-webkit-overflow-scrolling: touch` | Standard `overflow-y: auto` | Safari 13+ (2019) | The webkit property is deprecated; standard works on all modern browsers |
| 300ms tap delay (required double-tap check) | `touch-action: manipulation` CSS | Safari 9.3+ (2016) | Eliminates delay; `touch-manipulation` Tailwind class applies this |

**Deprecated/outdated:**
- `-webkit-overflow-scrolling: touch`: Do not use. Standard `overflow-y: auto` works on all current browsers.
- `meta name="apple-mobile-web-app-capable"` for standalone check: Deprecated in iOS 12.2. Use `matchMedia('(display-mode: standalone)')` + `window.navigator.standalone` instead.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PrimeVue Aura v4.5.5 `.p-dialog-content` does not set `max-height` by default — the override will apply without `!important` | Dialog CSS Override Pattern | If Aura does set max-height, the rule needs `!important`; easy fix |
| A2 | PrimeVue 4 `<Card>` component inherits `class` and `:style` on its root `<div>` by default | WallecxApp root container pattern | If it does not, a wrapper `<div>` is needed around `<Card>` |
| A3 | `CriOS`, `FxiOS` UA exclusions cover the majority of non-Safari iOS browsers for the install banner filter | PwaInstallBanner iOS detection | Minor: banner may show in edge-case browsers; not a security issue |
| A4 | The `z-50` banner z-index (50) does not conflict with PrimeVue Dialog (z-index ~1100) | Banner z-index | If banner appears above dialogs, increase Dialog z-index or lower banner z-index |
| A5 | `env(safe-area-inset-top)` applied as inline style on `<CustomNavBar class="mb-1">` will add padding to the `<Menubar>` root element without breaking the nav layout | App.vue top inset | If Menubar has internal top padding handling, double-padding may appear; inspect in device simulator |

---

## Open Questions

1. **Does the `<Card>` PrimeVue root in WallecxApp.vue accept `overscroll-none` as expected?**
   - What we know: PrimeVue 4 components use attribute inheritance by default; `class` should pass to root `<div>`.
   - What's unclear: Whether PrimeVue's Aura preset's CSS for `.p-card` establishes a new stacking or overflow context that could interfere.
   - Recommendation: The planner should include a "verify in browser devtools" step after applying classes. If the Card wrapper interferes, use a `<div class="overscroll-none ...">` wrapping the Card.

2. **`env(safe-area-inset-top)` on `<CustomNavBar>` vs inside CustomNavBar.vue**
   - What we know: `<CustomNavBar class="mb-1" :style="{ paddingTop: 'env(safe-area-inset-top)' }">` adds inline style to the component root element (PrimeVue `<Menubar>`).
   - What's unclear: Whether PrimeVue Menubar's default CSS positioning (`position: sticky` or similar) interacts with the padding change.
   - Recommendation: If App.vue style prop causes visual issues, the fallback is to add `style="padding-top: env(safe-area-inset-top)"` directly inside `CustomNavBar.vue` on the `<Menubar>` element. Document both options in the plan.

---

## Validation Architecture

> `nyquist_validation: false` in `.planning/config.json` — this section is skipped.

---

## Security Domain

> This phase adds no authentication, API endpoints, user input forms, or cryptographic operations. The only security-relevant change is the `PwaInstallBanner.vue` localStorage write, which stores the string `"true"` under a non-sensitive key. No ASVS categories apply beyond V5 (Input Validation), and there is no user-controlled input in this phase.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: tailwindcss.com/docs/overscroll-behavior] — `overscroll-none` generates `overscroll-behavior: none`; valid in Tailwind v4
- [VERIFIED: src/components/projects/wallecx/MembershipsTab.vue lines 111, 143] — grid classes already `grid grid-cols-1 sm:grid-cols-2 gap-4`
- [VERIFIED: src/components/projects/wallecx/VaccinationsTab.vue lines 115-119, 340, 388] — gridClass computed already correct
- [VERIFIED: node_modules/tailwindcss/package.json] — Tailwind version 4.2.4
- [VERIFIED: node_modules/primevue/package.json] — PrimeVue version 4.5.5
- [VERIFIED: index.html line 6] — current viewport meta is `width=device-width, initial-scale=1.0` (no viewport-fit, no interactive-widget)
- [VERIFIED: src/App.vue lines 9-14] — CustomNavBar is first rendered element; inline style prop is the correct attachment point
- [VERIFIED: src/components/projects/wallecx/WallecxApp.vue lines 64-91] — `<Card>` is the root template element; currently has no overscroll or safe-area classes
- [VERIFIED: src/components/projects/wallecx/VaccinationGroupPanel.vue lines 34-38] — three `size="small"` Buttons need `min-h-[44px]`
- [CITED: developer.apple.com/design/human-interface-guidelines/accessibility] — 44×44pt minimum touch target
- [CITED: web.dev/learn/pwa/detection] — `matchMedia('(display-mode: standalone)')` standard check

### Secondary (MEDIUM confidence)
- [WebSearch verified: dvh support in Safari 15.4+, Chrome 108+, Firefox 101+] — widely available as of 2025
- [WebSearch verified: `interactive-widget=resizes-content` in viewport meta reduces layout shift on keyboard open]

### Tertiary (LOW confidence)
- [ASSUMED: A2] — PrimeVue Card attribute inheritance on root element
- [ASSUMED: A1] — PrimeVue Aura `.p-dialog-content` default max-height

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and version-verified
- Architecture: HIGH — all 8 files identified from source reads; no guesswork
- Patterns: HIGH — native CSS patterns (env(), overscroll-behavior, dvh) are stable W3C features
- Pitfalls: MEDIUM — Tailwind scoped style pitfall is verified; Pitfalls 2/5/6 are HIGH risk but some assumptions on PrimeVue internals

**Research date:** 2026-05-14
**Valid until:** 2026-08-14 (stable web platform APIs; Tailwind/PrimeVue minor versions unlikely to break these patterns within 90 days)
