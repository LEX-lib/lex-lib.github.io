# Phase 34: Layout Audit & Touch Targets — Research

**Researched:** 2026-05-27
**Domain:** CSS/layout audit — Vue 3 + PrimeVue 4.5.5 (Aura) + Tailwind 4 on iOS/Android mobile
**Confidence:** HIGH (all findings verified by direct codebase inspection and PrimeVue source; no external web search needed)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-34-01 (LT-05):** Stacked sticky — BOTH WallecxApp TabList AND each tab's filter/sort toolbar pinned on mobile. Must not jitter when iOS URL bar collapses.
- **D-34-02 (LT-01):** Hybrid touch-target enforcement — global 44×44 floor in `wallecx-overrides.css` for PrimeVue interactive elements that REACH teleported DOM, PLUS keep existing per-component `min-h-[44px]` Tailwind for custom elements. Must NOT inflate intentionally-compact inline chips.
- **D-34-03 (LT-02):** Extract shared visual-only `DragHandle` component (Phase-17 pill: `w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600`, `aria-hidden`). No swipe-to-dismiss. Renders on `isMobile` only.
- **D-34-04 (LT-03):** Wire `env(safe-area-inset-*)` into: sticky TabList (top), bottom Drawers (bottom), fullscreen scan overlay. Defer dialog sticky-action-bar insets to Phase 35.
- **D-34-05 (LT-04):** dvh already clean — confirm at audit close; convert any stray vh with svh fallback.
- **D-34-06 (NFR-BR-2-PRESERVED):** Reverify BarcodeDisplay.vue black-on-white in light AND dark after the CSS sweep.

### Claude's Discretion
- Exact CSS selectors and specificity strategy for the global touch-target rule
- Sticky positioning mechanism (sticky vs container scroll), z-index layering
- `DragHandle` component location/name and prop surface
- Whether sticky toolbar needs a bottom border/shadow

### Deferred Ideas (OUT OF SCOPE)
- Swipe-down-to-dismiss gesture — Phase 35
- Dialog sticky-action-bar bottom safe-area insets — Phase 35
- iPad-768 tablet-specific layout (Drawer-vs-Dialog split via `isTablet`) — Phase 35
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LT-01 | 44×44px touch-target floor on every interactive element on mobile | §Touch-Target Gap Inventory, §Global Touch-Target Rule |
| LT-02 | Drag handle on all bottom-sheet Drawers (MembershipDetail, VaccinationGroupPanel, 4 Manage dialogs) | §Bottom-Sheet Enumeration, §DragHandle Component |
| LT-03 | env(safe-area-inset-*) on sticky TabList, bottom Drawers, scan overlay | §Safe-Area Wiring |
| LT-04 | 0 matches for 100vh/h-screen in wallecx — confirmed by audit grep | §dvh Audit |
| LT-05 | TabList + per-tab toolbar stacked sticky on mobile | §Sticky Chrome Strategy |
| LT-07 | Internal-scroll / no double-scroll-trap in all dialogs and detail views | §Scroll-Trap Audit |
| LT-09 | viewport-fit=cover locked in index.html with LOCKED comment | §Viewport-fit Audit |
</phase_requirements>

---

## Summary

Phase 34 is a pure CSS/layout audit pass. All locked architectural invariants (Drawer 85dvh height, BR-2 barcode colours, single ConfirmDialog, reactive Drawer position) stay unchanged. The research establishes exactly where work is needed and how to do it.

**DVH audit result:** Zero `100vh` / `h-screen` / `min-h-screen` matches exist in `src/components/projects/wallecx/`. The unit invariant (NFR-DVH-NOT-VH) is already clean. LT-04 is confirmation-only — no migration required.

**viewport-fit audit result:** `index.html` line 6 already has `viewport-fit=cover` in the `<meta name="viewport">` tag. LT-09 requires adding an inline LOCKED comment matching the `vite.config.ts` LOCKED comment convention; the tag itself is already correct.

**Touch-target status:** Most custom elements already carry `min-h-[44px]` from Phase 15 work. The single material gap is PrimeVue icon-only buttons: `main.ts` applies a global PT (`p-button-sm` on all buttons), and Aura's `sm.iconOnlyWidth` = `2rem` (32px) — 12px below the 44px floor. A targeted global CSS rule in `wallecx-overrides.css` closes this gap without inflating label buttons or chips.

**Bottom-sheet enumeration:** Six bottom-sheet Drawer sites exist. Four already have the Phase-17 pill markup inline. Two do not — `ManageVaccination` and `ManageBudget` — wait, **ManageBudget does have the pill** (line 171). The remaining gap is **ManageVaccination**: it renders only a `<Dialog>` on all viewport sizes (no Drawer branch). Converting it to the Dialog/Drawer conditional pattern is required for LT-02. `ManageMembership` also renders only a `<Dialog>` — same gap. Both need the bottom-Drawer branch added before the `DragHandle` component can be slotted in.

**Sticky chrome:** The WallecxApp `<Tabs>` → `<TabList>` structure is `position: relative; overflow: hidden` by PrimeVue's base `.p-tablist` CSS. `position: sticky` requires an unclipped scroll ancestor. The correct strategy is to wrap the TabList in a sticky `<div>` *above* the `<TabPanels>`, not inside the PrimeVue Tabs component, plus give each tab's toolbar component its own `position: sticky; top: [tablist-height]` layer — both mobile-gated via `isMobile`.

**Primary recommendation:** Four distinct work streams — (1) add `DragHandle` component + Drawer branches for ManageVaccination and ManageMembership, (2) add global `.p-button-icon-only` touch-target rule to `wallecx-overrides.css`, (3) implement stacked-sticky chrome with z-index layering, (4) add `env()` insets to TabList wrapper, bottom Drawers, and scan overlay. Add LOCKED comment to `index.html`. Confirm BR-2 after sweep.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Touch-target floor | Browser / Client | — | Pure CSS min-size constraint; applies where rendered (including teleported PrimeVue DOM via non-scoped override file) |
| Sticky TabList chrome | Browser / Client | Frontend Server (SSR) | `position: sticky` in the scroll container; mobile-gated via `isMobile` ref from Phase 33 composable |
| Safe-area insets | Browser / Client | — | CSS `env()` function; resolved by browser per device/orientation; no JS logic needed |
| Drag-handle visual | Browser / Client | — | Decorative CSS pill; extracted to a shared `.vue` component for DRY reuse |
| DragHandle Drawer wiring | Frontend component layer | — | Each Drawer's `#header` slot receives the component; 2 Drawers need a new bottom-Drawer branch added to their parent components |
| dvh audit | Browser / Client | — | Grep audit + visual confirmation; no runtime logic |
| BR-2 reverify | Browser / Client | — | Visual regression check after CSS sweep; no code change expected |
| viewport-fit LOCKED comment | Static HTML | — | One-line edit to `index.html` |

---

## Standard Stack

### Core (no new dependencies needed — audit-only phase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `useMobileEnv` (Phase 33) | local | `isMobile`, `safeAreaInsets` | Phase 33 foundation primitive; already in codebase |
| `wallecx-overrides.css` | existing | Non-scoped global rule home | Already imports from WallecxApp.vue; reaches teleported PrimeVue DOM |
| PrimeVue 4.5.5 Aura | 4.5.5 | `<Drawer>`, `<Tabs>`, `<Button>` | Locked version baseline from Phase 33 |
| Tailwind CSS 4 | existing | `min-h-[44px]`, `sticky`, `top-0` | Existing pattern; `sticky` class maps to `position: sticky` |

**No new npm packages required.** This is a presentation-layer audit phase.

---

## Architecture Patterns

### System Architecture Diagram

```
index.html (viewport-fit=cover + LOCKED comment)
  │
  └─ WallecxApp.vue
       │
       ├─ [sticky wrapper — new] ←── position:sticky top:env(safe-area-inset-top) z-index:10
       │    └─ <TabList> (.p-tablist inside .p-tabs)
       │
       ├─ <TabPanels>
       │    ├─ VaccinationsTab
       │    │    ├─ [sticky toolbar wrapper — new] ← position:sticky top:[tablist-height] z-index:9
       │    │    │    └─ <WallecxToolbar>
       │    │    └─ scrolling list ...
       │    │    └─ <Drawer position=bottom> ← DragHandle in #header, safe-area padding-bottom
       │    │         (VaccinationGroupPanel)
       │    │
       │    ├─ MembershipsTab
       │    │    ├─ [sticky toolbar wrapper — new]
       │    │    │    └─ <WallecxToolbar>
       │    │    └─ scrolling grid ...
       │    │    └─ <Drawer v-else position=bottom> ← MembershipDetail (already has pill)
       │    │    └─ <ManageMembership> ← NEEDS Drawer branch + DragHandle (D-34-03)
       │    │
       │    └─ ExpensesTab
       │         ├─ [sticky toolbar wrapper — new]
       │         │    └─ <ExpensesToolbar>
       │         └─ <ManageExpense> ← already has Drawer branch + pill
       │         └─ <ManageBudget> ← already has Drawer branch + pill
       │         └─ receipt preview <Drawer> ← already has pill
       │
       ├─ [teleported to <body>] ← wallecx-overrides.css reaches here
       │    ManageVaccination  ← NEEDS Drawer branch + DragHandle (D-34-03)
       │    All other Dialogs/Drawers
       │
       └─ <ConfirmDialog> (singleton, untouched)

MembershipDetail.vue
  └─ <Teleport to="body">
       └─ scan overlay (position:fixed inset:0 z-index:9999)
            └─ NEEDS env(safe-area-inset-top/bottom) padding (D-34-04)
```

### Recommended Component/File Structure

No new directories needed.

```
src/
├── components/projects/wallecx/
│   ├── DragHandle.vue              # NEW — extracted from Phase-17 pill pattern
│   ├── WallecxApp.vue              # EDIT — sticky TabList wrapper + safe-area top
│   ├── VaccinationsTab.vue         # EDIT — sticky toolbar wrapper; Drawer safe-area bottom
│   ├── MembershipsTab.vue          # EDIT — sticky toolbar wrapper; Drawer safe-area bottom
│   ├── ManageMembership.vue        # EDIT — add Drawer branch + DragHandle slot
│   ├── ManageVaccination.vue       # EDIT — add Drawer branch + DragHandle slot
│   ├── MembershipDetail.vue        # EDIT — scan overlay env() padding
│   ├── ExpensesTab.vue             # EDIT — sticky toolbar wrapper; receipt Drawer safe-area
│   └── ExpensesReportsView.vue     # (no change needed — period-selector tabs are scrollable, handled by ExpensesTab wrapper)
└── assets/
    └── wallecx-overrides.css       # EDIT — global .p-button-icon-only touch-target rule
index.html                          # EDIT — add LOCKED comment to viewport meta
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Safe-area inset values | Custom JS to read `env()` pixel values | Direct `env(safe-area-inset-*)` in CSS | Browser resolves env() natively including orientation changes; `useMobileEnv().safeAreaInsets` already provides the strings |
| Touch-target overlay | Invisible padding divs or JS hit-area expansion | `min-height`/`min-width` CSS + `padding` on existing element | CSS-only, no DOM restructure |
| Sticky chrome jitter | JS `scroll` listener that manually sets `transform: translateY` | `position: sticky` with correct scroll ancestor | Browser handles scroll efficiently; no JS required; dvh already prevents URL-bar flicker |
| Drag-handle gesture detection | Pointer event listeners, velocity calculation | None — visual only this phase | D-34-03: swipe-to-dismiss is Phase 35 |

**Key insight:** All work in this phase is pure CSS/HTML. No new JavaScript runtime logic is required.

---

## Bottom-Sheet Enumeration (Complete)

This is the authoritative list of every bottom-sheet Drawer site and its current state.

| # | Component | Where Rendered | Currently Has Pill | Currently Has Safe-Area Bottom | Action Required |
|---|-----------|----------------|-------------------|-------------------------------|-----------------|
| 1 | `VaccinationsTab.vue` line 420 | VaccinationGroupPanel detail | YES (line 430-432, `v-if="isMobile"`) | NO | Add `padding-bottom: env(safe-area-inset-bottom)` to Drawer panel (via `.p-drawer-bottom .p-drawer-content` in overrides or inline style) + swap inline pill for `<DragHandle>` |
| 2 | `MembershipsTab.vue` line 344 | MembershipDetail bottom-sheet | YES (line 352-354, unconditional) | NO | Same safe-area bottom; swap inline pill for `<DragHandle>` |
| 3 | `ManageExpense.vue` line 394 | ManageExpense form | YES (line 403, `w-8 h-1...`) | NO | Safe-area bottom; swap pill for `<DragHandle>` |
| 4 | `ManageBudget.vue` line 163 | ManageBudget form | YES (line 171, `w-8 h-1...`) | NO | Safe-area bottom; swap pill for `<DragHandle>` |
| 5 | `ExpensesTab.vue` line 250 | Receipt preview | YES (line 257-259, `w-8 h-1...`) | NO | Safe-area bottom; swap pill for `<DragHandle>` |
| **6** | **`ManageMembership.vue`** | **Manage membership form** | **NO — Dialog only, no Drawer branch** | **N/A** | **ADD conditional Drawer branch (`v-if/else isMobile`) mirroring ManageExpense pattern + DragHandle** |
| **7** | **`ManageVaccination.vue`** | **Manage vaccination form** | **NO — Dialog only, no Drawer branch** | **N/A** | **ADD conditional Drawer branch mirroring ManageExpense pattern + DragHandle** |

**Summary:** 5 sites have existing Drawer infrastructure (add safe-area + DragHandle swap). 2 sites (ManageMembership, ManageVaccination) require a new Drawer branch to be added before LT-02 can be satisfied.

**Note on ManageMembership:** Must preserve the ColorPicker direct `v-model` ref pattern (PrimeVue #8135 workaround). The form fields inside the Drawer branch are a template duplication of the Dialog branch — acceptable for Phase 34's audit scope. Phase 35 `BaseMobileDialog` migration will DRY this up.

**Note on ManageVaccination:** Uses `@primevue/forms` `<Form>` component for most fields with `administeredDate` as a direct `v-model` ref (D-33-01-A). The Drawer branch template must replicate the same form structure. The `@submit` handler and all refs are already in `<script setup>` — only template work is needed.

---

## Touch-Target Gap Inventory

### Already-Compliant (Phase 15 work)

| Element | File | Mechanism |
|---------|------|-----------|
| ExpenseItem edit/delete/preview icon buttons | `ExpenseItem.vue:40,50,60` | `min-w-[44px] min-h-[44px] touch-manipulation` |
| VaccinationGroupCard card tile | `VaccinationGroupCard.vue:29` | `min-h-[44px] touch-manipulation` |
| VaccinationGroupPanel action buttons | `VaccinationGroupPanel.vue:43,50,58` | `min-h-[44px] touch-manipulation` |
| PwaInstallBanner dismiss button | `PwaInstallBanner.vue:66` | `min-w-[44px] min-h-[44px] touch-manipulation` |
| WallecxToolbar Sort Select | `WallecxToolbar.vue:48` | `min-h-[44px]` |
| WallecxToolbar toggle button | `WallecxToolbar.vue:55` | `min-h-[44px] min-w-[44px] touch-manipulation` |
| ExpensesToolbar Sort/Multi/DatePicker controls | `ExpensesToolbar.vue:52,63,71,79` | `min-h-[44px]` |
| ManageBudget InputNumber + SelectButton + Button | `ManageBudget.vue:135,147,158,200,212,223` | `min-h-[44px]` |
| ExpensesReportsView DatePickers + ManageBudgets button | `ExpensesReportsView.vue:416,425,469,507` | `min-h-[44px]` |
| ExpensesReportsView period tabs | `ExpensesReportsView.vue:582-583` + `ExpensesTab.vue:280-282` | `:deep(.p-tab) { min-height: 44px }` scoped |
| MembershipCard tile | `MembershipCard.vue:75` | `min-h-[8rem]` comment confirms 44px; `touch-manipulation` |

### Gap: PrimeVue Icon-Only Buttons (CRITICAL)

**Root cause:** `main.ts` applies a global pass-through `pt.button.root.class = "p-button-sm"` to all PrimeVue `<Button>` instances. Aura's token for `button.sm.iconOnlyWidth` = `"2rem"` = 32px. [VERIFIED: `node_modules/@primeuix/themes/dist/aura/button/index.mjs`]

PrimeVue base CSS sets `.p-button-icon-only { width: dt('button.icon.only.width') }` and `.p-button-sm.p-button-icon-only { width: dt('button.sm.icon.only.width') }`. With `p-button-sm` applied globally, icon-only buttons render at **32×32px** — 12px below the 44px floor.

**Affected elements:** Any `<Button>` that renders only an icon (no label) — the `pi pi-times` clear-search `InputIcon` buttons, the Drawer close buttons, any future icon-only action buttons. Label buttons are unaffected since their height comes from padding + line-height.

**Gap: WallecxApp Top-Level `<Tab>` triggers**

The top-level Wallecx tab triggers (Vaccinations, Memberships, Expenses) render with `.p-tab`. No existing `min-height: 44px` rule applies globally. The per-file scoped rules (`ExpensesReportsView` period tabs, `ExpensesTab` sub-tabs) cover their specific targets only.

**Gap: WallecxToolbar `<Select>` Sort option (VaccinationsTab and MembershipsTab)**

`WallecxToolbar.vue:48` has `min-h-[44px]` on the wrapper `<Select>` — this is already covered. But the Select trigger element is a `.p-select` — PrimeVue applies `padding` from theme tokens. At `size="small"` (if any), could be under 44px. However, `WallecxToolbar` does not pass `size` to Select, so it uses default size. This is likely already ≥ 44px given Aura's default padding. Mark as low-risk; verify during sweep.

---

## Global Touch-Target Rule (CSS Implementation)

### CSS Selector Strategy

Add to `wallecx-overrides.css` — the non-scoped stylesheet imported from `WallecxApp.vue` that already reaches teleported PrimeVue DOM.

The existing precedence pattern (`.p-drawer-bottom .p-drawer { height: 85dvh !important }`) demonstrates the approach: use specificity that overrides Aura's token-resolved CSS while scoping tightly enough to avoid inflating non-interactive elements.

**Recommended rule block:**

```css
/* Phase 34 LT-01: 44×44 touch-target floor for PrimeVue interactive elements.
 *
 * 1. Icon-only buttons — Aura sm.iconOnlyWidth = 2rem (32px) falls below the
 *    44px floor because main.ts applies p-button-sm globally via pt.button.root.
 *    Set explicit min-width and min-height. Selector targets .p-button.p-button-icon-only
 *    which is only added when NO label is present (PrimeVue sets this class via
 *    the button's icon-only detection in its render fn).
 *
 * 2. WallecxApp top-level Tab triggers — .p-tab receives min-height: 44px.
 *    Scoped to .p-tabs.wallecx-main-tabs to avoid inflating sub-tabs / period-tabs
 *    that already manage their own per-instance :deep rules.
 *
 * Both rules intentionally do NOT use !important — their specificity is
 * sufficient over Aura's element-level rules, and avoiding !important keeps the
 * specificity chain clean for Phase 35 per-dialog overrides. */

.p-button.p-button-icon-only {
  min-width: 44px;
  min-height: 44px;
}

/* Top-level WallecxApp tab triggers only.
 * WallecxApp.vue must add class="wallecx-main-tabs" to its <Tabs> wrapper.
 * Period tabs (.wallecx-period-tabs) and sub-tabs (.wallecx-sub-tabs) are
 * excluded here — they manage their own min-height via scoped :deep rules. */
.wallecx-main-tabs .p-tab {
  min-height: 44px;
}
```

**Why not `!important` on the p-tab rule:** The scoped `:deep(.wallecx-sub-tabs .p-tablist .p-tab)` rules in `ExpensesTab.vue` and `:deep(.wallecx-period-tabs .p-tab)` in `ExpensesReportsView.vue` use equal specificity. No conflict. The global rule targets `.wallecx-main-tabs .p-tab` — a distinct class not used on sub-tabs.

**Why `class="wallecx-main-tabs"` on `<Tabs>` in WallecxApp.vue:** The PrimeVue `<Tabs>` root renders as `.p-tabs`. Adding a discriminating class lets the global override scope to the top-level tabs only without relying on DOM-depth heuristics.

**What NOT to do:**
- Do not add `min-height: 44px` to `.p-button` globally — this inflates compact `.p-button-sm` label buttons in toolbars beyond their designed height.
- Do not target `.p-chip` or `.p-tag` — these are intentionally compact display-only elements.
- Do not target `.p-select-chip` inside MultiSelect — same rationale.

---

## Sticky Chrome Strategy (D-34-01 / LT-05)

### The Scroll Container Problem

PrimeVue's `<TabList>` CSS sets `.p-tablist { position: relative; overflow: hidden }`. Any `position: sticky` *inside* an `overflow: hidden` ancestor does not work — the sticky element is clipped and cannot escape the overflow context.

Additionally, `<Tabs>` wraps both `<TabList>` and `<TabPanels>` in a single `.p-tabs` flex column. Sticky cannot escape the `.p-tabs` flex container either.

**Scroll container on mobile:** The page itself (`<html>` or `<body>`) is the natural scroll container, not the PrimeVue `<Card>`. The `<Card>` has `overscroll-none` class but no `overflow-y: scroll` — it sizes to content. Tabs/panels extend the page scroll. This is confirmed by the absence of any `overflow-y` or `height` constraint on `WallecxApp.vue`'s Card or Tabs.

### Solution: Lift the TabList Outside `<Tabs>`

The clean approach is to restructure `WallecxApp.vue` so the `<TabList>` lives in a sticky wrapper **separate** from the `<Tabs>` component's overflow context, then wire the tab value through props/events:

```html
<!-- WallecxApp.vue — stacked sticky chrome (mobile only) -->

<!-- Sticky wrapper: positions relative to page scroll (not Card overflow) -->
<div
  :style="isMobile ? {
    position: 'sticky',
    top: safeAreaInsets.top,
    zIndex: 10,
    background: 'var(--p-tabs-tablist-background)',
  } : {}"
>
  <!-- PrimeVue Tabs wraps TabList + TabPanels; but we control the sticky context -->
  <Tabs v-model:value="activeTab" class="wallecx-main-tabs">
    <TabList>
      <Tab value="vaccinations">...</Tab>
      <Tab value="memberships">...</Tab>
      <Tab value="expenses">...</Tab>
    </TabList>
  </Tabs>
</div>

<TabPanels ...>
  <!-- content renders in a separate non-sticky context -->
</TabPanels>
```

Wait — `<TabPanels>` must be a child of `<Tabs>` for PrimeVue's internal provide/inject to work. The `<Tabs>` component uses `provide` to inject `$pcTabs` context. `<TabPanels>` and `<Tab>` components inject `$pcTabs` from the nearest `<Tabs>` ancestor.

**Revised approach:** Keep `<Tabs>` as the parent of `<TabList>` and `<TabPanels>`, but wrap the entire `<Tabs>` in a sticky outer div that positions the whole tabs block. The TabList visually sticks because it's at the top of the sticky container and the panel content scrolls below it. This does NOT require separating `<TabList>` from `<Tabs>`.

```html
<!-- WallecxApp.vue — the sticky outer wrapper approach -->

<div
  v-if="isMobile"
  class="sticky z-10"
  :style="{ top: safeAreaInsets.top }"
>
  <!-- Only TabList renders here; the TabPanels are outside the sticky div -->
  <Tabs v-model:value="activeTab" class="wallecx-main-tabs">
    <TabList>
      <Tab value="vaccinations">...</Tab>
      <Tab value="memberships">...</Tab>
      <Tab value="expenses">...</Tab>
    </TabList>
    <!-- TabPanels is intentionally OMITTED from the sticky div -->
  </Tabs>
</div>

<!-- TabPanels rendered separately, but needs to be inside Tabs provide/inject scope. -->
```

The problem: `<TabPanels>` outside `<Tabs>` will not receive `$pcTabs` context injection.

**Correct approach: CSS-only sticky on `.p-tablist` inside `wallecx-overrides.css`**

Since `.p-tablist` has `position: relative; overflow: hidden`, we override it:

```css
/* Phase 34 LT-05: Sticky TabList on mobile.
 *
 * Overrides PrimeVue's .p-tablist default (position:relative; overflow:hidden).
 * The page (not the Card) is the scroll container for WallecxApp on mobile —
 * sticky on .p-tablist relative to the page scroll works correctly.
 *
 * ONLY applied on the wallecx-main-tabs class to avoid affecting sub-tabs
 * and period-selector tabs.
 *
 * top: env(safe-area-inset-top) — clears the notch (D-34-04).
 * z-index: 10 — sits above TabPanel content (z-index 1 on active-bar; 2 on nav buttons).
 * background: required for opacity — otherwise content scrolls through it.
 */
@media (max-width: 639px) {
  .wallecx-main-tabs .p-tablist {
    position: sticky !important;
    top: env(safe-area-inset-top);
    z-index: 10;
    background: var(--p-tabs-tablist-background);
    overflow: visible !important;  /* remove overflow:hidden so sticky active-bar renders */
  }
}
```

**Problem with `overflow: visible` on `.p-tablist`:** PrimeVue's active bar (`.p-tablist-active-bar`) is `position: absolute` inside `.p-tablist`. Removing `overflow: hidden` allows the ink-bar to render; it was already visible inside the overflow container anyway. The nav prev/next buttons are also `position: absolute` within `.p-tablist` — their `z-index: 2` keeps them above the viewport. No functional regression.

**Per-tab toolbar sticky:** Each tab's toolbar (WallecxToolbar, ExpensesToolbar) is rendered as the first child of the tab content area in each tab component. On mobile, these need `position: sticky; top: [tablist-height]`. The TabList height is approximately `44px` (min-height rule we add) but varies. A CSS custom property approach or a calculated `top` value is needed.

**Simpler approach: use `top: 0` relative to a scroll context.** If the tab panel content has its own scroll context (`overflow-y: auto; height: calc(100dvh - [tablist height])`), then the toolbar can be sticky at `top: 0` within that scroll context. But this introduces a nested scroll container — which is exactly what LT-07 (no double-scroll-trap) forbids.

**Best approach for stacked sticky without double-scroll:** 

Use CSS cascade of sticky elements. Both `.p-tablist` and the toolbar `<div>` have `position: sticky`. They stack naturally in page scroll:

```css
/* The toolbar is sticky below the TabList.
 * Each tab component adds the class 'wallecx-tab-toolbar' to its toolbar wrapper.
 * --wallecx-tablist-height is set as a CSS variable (approximate fallback: 52px).
 */
@media (max-width: 639px) {
  .wallecx-tab-toolbar {
    position: sticky;
    top: calc(env(safe-area-inset-top) + 52px);  /* 52px = approx tablist height */
    z-index: 9;
    background: var(--p-card-background, #ffffff);
  }
}
```

The `52px` approximation (safe-area-top ~47px notch + 44px tab = ~91px for notched phones). However a fixed pixel offset is fragile. **Better: use `--wallecx-tablist-height` CSS variable set by a Vue binding:**

In `WallecxApp.vue`, measure TabList height via template ref and set a CSS variable on the root element. This is overkill for audit scope. For this phase, a fixed `52px` fallback is acceptable as an approximation — phones without notch have `env(safe-area-inset-top) = 0`, so top becomes `52px`. Phones with notch (~47px safe-area) get `top: calc(47px + 52px)` ≈ `99px` which may overshoot. 

**Recommended approach for Phase 34:** Use a two-level sticky with `top` values anchored to named CSS variables that can be set at the WallecxApp level:

```css
/* Set these in WallecxApp.vue template style binding on the root Card: */
/* --wallecx-tablist-top: env(safe-area-inset-top); */
/* --wallecx-tablist-height: 52px; (update if Tab height changes) */

@media (max-width: 639px) {
  .wallecx-main-tabs .p-tablist {
    position: sticky !important;
    top: var(--wallecx-tablist-top, env(safe-area-inset-top));
    z-index: 10;
    background: var(--p-tabs-tablist-background);
  }

  .wallecx-tab-toolbar {
    position: sticky;
    top: calc(var(--wallecx-tablist-top, 0px) + var(--wallecx-tablist-height, 52px));
    z-index: 9;
    background: var(--p-card-background, white);
  }
}
```

**iOS URL-bar collapse safety:** Since no `100vh` is used anywhere in wallecx (NFR-DVH-NOT-VH confirmed clean), the iOS URL-bar collapse does not cause height flicker. The sticky elements simply move with the page scroll; there is no height recalculation that causes jitter.

**Separator between toolbar and content:** Per D-34-01 discretion, add a `border-bottom: 1px solid var(--p-card-border-color)` or a Tailwind `border-b` on the `.wallecx-tab-toolbar` wrapper to visually separate it from the scrolling content below. This prevents the toolbar from blending into list items on scroll.

---

## Safe-Area Wiring Details (D-34-04 / LT-03)

### 1. Sticky TabList — top inset

Already covered in §Sticky Chrome Strategy above: `top: env(safe-area-inset-top)` on `.wallecx-main-tabs .p-tablist`.

### 2. Bottom Drawers — bottom inset

PrimeVue `<Drawer position="bottom">` renders as:

```
.p-drawer-mask.p-drawer-bottom          (fixed overlay, full viewport)
  └─ .p-drawer.p-component              (the panel, height: 85dvh per wallecx-overrides.css)
       ├─ .p-drawer-header              (header slot — where DragHandle goes)
       └─ .p-drawer-content             (scrollable content area)
```

[VERIFIED: `node_modules/primevue/drawer/style/index.mjs`]

The correct place to apply safe-area insets is on `.p-drawer-content` to pad the content above the home indicator, not on `.p-drawer` itself (which would change its height). Add to `wallecx-overrides.css`:

```css
/* Phase 34 LT-03/D-34-04: Safe-area bottom inset inside bottom Drawers.
 * Pads .p-drawer-content so the last visible form field / action button
 * clears the iOS home indicator / Android gesture bar.
 * Uses padding-bottom — does not change the 85dvh panel height. */
.p-drawer-bottom .p-drawer-content {
  padding-bottom: max(env(safe-area-inset-bottom), 1rem);
}

/* Side insets for notched landscape orientation */
.p-drawer-bottom .p-drawer-content {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

The `max(env(safe-area-inset-bottom), 1rem)` ensures at least 1rem padding even on devices without a home indicator.

### 3. Fullscreen Scan Overlay — top + bottom insets

`MembershipDetail.vue` line 169-203: The scan overlay is a `<Teleport to="body">` `<div>` with `class="fixed inset-0"` and `style="z-index: 9999; background: #ffffff; filter: brightness(1.4)"`. The close button is at `top-4 right-4` (16px from edges). [VERIFIED: direct read of MembershipDetail.vue]

The barcode is centered via `flex flex-col items-center justify-center`. On a notched iPhone, the notch area at top and the home indicator area at bottom can overlap the centred content.

**Wiring approach:** Add `paddingTop` and `paddingBottom` inline style bindings using the `useMobileEnv().safeAreaInsets` strings:

```vue
<!-- MembershipDetail.vue scan overlay — add safe-area padding -->
<div
  v-if="showScanOverlay"
  class="fixed inset-0 flex flex-col items-center justify-center"
  :style="{
    zIndex: 9999,
    background: '#ffffff',
    filter: 'brightness(1.4)',
    paddingTop: safeAreaInsets.top,
    paddingBottom: safeAreaInsets.bottom,
  }"
  ...
>
```

The close button uses `absolute top-4 right-4`. With `paddingTop` on the overlay container, the visual top of the content area shifts down. The close button's `top-4` is relative to the overlay, not the padded content area — it may still overlap the notch. Use `top: calc(16px + env(safe-area-inset-top))` inline style instead:

```vue
<button
  class="absolute right-4 w-12 h-12 flex items-center justify-center rounded-full"
  :style="{
    top: 'calc(1rem + env(safe-area-inset-top))',
    background: 'rgba(0,0,0,0.08)',
  }"
  ...
>
```

This component needs `useMobileEnv` imported and destructured for `safeAreaInsets`, OR can use direct `env()` values in the inline style strings (which the browser will resolve) without importing useMobileEnv at all. Direct `env()` string in style is simpler and recommended:

```vue
:style="{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }"
```

**BR-2 implication:** The padding changes the layout *around* the barcode centring but does not affect `BarcodeDisplay.vue`'s `bg-white` background or `BARCODE_FOREGROUND`/`BARCODE_BACKGROUND` constants. BR-2 is not at risk from this change. However, the visual check is still required per D-34-06.

---

## DragHandle Component Specification (D-34-03 / LT-02)

### Component Location

`src/components/projects/wallecx/DragHandle.vue`

This is the natural home — it's a Wallecx-internal presentational component. Phase 35's `BaseMobileDialog.vue` (also in this folder) will also use it.

### Component Implementation

```vue
<!-- DragHandle.vue — visual-only bottom-sheet drag affordance (Phase 34 D-34-03).
 * Extracted from the Phase-17 inline pill pattern.
 * aria-hidden="true" — decorative only; not a button, not interactive.
 * Renders unconditionally — callers are responsible for v-if="isMobile" gating
 * (some callers already conditionally render the entire Drawer). -->
<template>
  <div
    class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600"
    aria-hidden="true"
  />
</template>
```

No props, no emits, no script block needed. The pill is purely decorative.

### Usage Pattern (in Drawer `#header` slots)

Replace existing inline pills:

```vue
<!-- BEFORE (inline in each component): -->
<template #header>
  <div class="flex flex-col items-center w-full gap-1">
    <div class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true"></div>
    <span class="font-semibold">Title</span>
  </div>
</template>

<!-- AFTER (with DragHandle component): -->
<template #header>
  <div class="flex flex-col items-center w-full gap-1">
    <DragHandle />
    <span class="font-semibold">Title</span>
  </div>
</template>
```

Import: `import DragHandle from './DragHandle.vue'` in each consumer.

### New Drawer Branch Template Pattern (ManageMembership + ManageVaccination)

Both components currently render `<Dialog>` only. They need the `v-if="!isMobile" ... v-else <Drawer>` conditional that `ManageExpense.vue` and `ManageBudget.vue` already use.

**Import needed:** `import { useIsMobile } from '@/composables/useIsMobile'` (both already NOT importing this — they use `useIsMobile` for ManageExpense but ManageMembership/ManageVaccination do not import it at all). Add to script setup.

**For ManageMembership.vue:** The Drawer branch is a full template duplication of the Dialog form body. The `<form @submit.prevent="onSubmit">` and all field refs (`cardName`, `barcodeType`, etc.) are already in `<script setup>` and are shared — the Drawer template just re-renders the same fields. Same `@hide="onHide"` wiring. The Dialog header text `dialogHeader` computed is already available.

**For ManageVaccination.vue:** Same pattern, but the `<Form>` (from `@primevue/forms`) must be replicated in the Drawer branch. The `administeredDate` ref and `dateAdministeredError` ref are already in script setup. The `resolver`, `initialValues`, `onSubmit` are all available.

**Critical ManageVaccination note:** The `<Form>` component's `v-slot="$form"` is used for error message display (`$form.vaccine_type?.invalid`). This slot syntax must be replicated identically in the Drawer branch. The Zod resolver and validator are already wired — no duplication of logic, only template.

---

## dvh Audit (D-34-05 / LT-04 / NFR-DVH-NOT-VH)

**Grep result:** `100vh`, `h-screen`, `min-h-screen` — **0 matches** in `src/components/projects/wallecx/`. [VERIFIED: direct ripgrep of the wallecx directory]

**Current dvh usage confirmed:**
- `wallecx-overrides.css`: `.p-dialog-content { max-height: 80dvh }` and `.p-drawer-bottom .p-drawer { height: 85dvh !important }`
- No `svh` fallbacks used (none needed — current Safari 15.4+ supports `dvh` natively; all v4.3 test devices are well above that threshold)

**Audit action:** At phase close, run the grep and confirm 0 matches. Add a comment in the plan to record the result. No migration work needed.

---

## Viewport-fit Audit (LT-09 / CON-VIEWPORT-FIT)

**Current `index.html` line 6:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
```

[VERIFIED: direct read of index.html line 6]

`viewport-fit=cover` is already present. `interactive-widget=resizes-content` (Android Chrome virtual keyboard resizes the viewport) is also present.

**Required action (LT-09):** Add an inline LOCKED comment. The repo convention from `vite.config.ts` uses `/* LOCKED: ... */` inline in the code. For HTML, the equivalent is an HTML comment immediately before the meta tag:

```html
<!-- LOCKED: viewport-fit=cover is required for env(safe-area-inset-*) non-zero values (CON-VIEWPORT-FIT / LT-09). Do not remove. -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
```

**No other change to the tag.** Existing `interactive-widget=resizes-content` must be preserved — it controls how the Android virtual keyboard interacts with the viewport (Phase 35 will build on this for FD-06 keyboard-scroll-into-view).

---

## Internal-Scroll / Double-Scroll-Trap Audit (LT-07)

### Current Pattern

`wallecx-overrides.css` sets `.p-dialog-content { max-height: 80dvh; overflow-y: auto }`. This gives PrimeVue Dialog content a capped height with internal scroll. The Drawer content uses `.p-drawer-content` which by default has `overflow-y: auto`.

### Dialogs to Check

| Dialog | Internal Scroll | Header Pinned | Sticky Action Bar | Notes |
|--------|-----------------|---------------|-------------------|-------|
| ManageVaccination | YES (.p-dialog-content) | YES (.p-dialog-header) | NO (Phase 35) | Verify long form scrolls correctly on 390px |
| ManageMembership | YES (.p-dialog-content) | YES (.p-dialog-header) | NO (Phase 35) | Same |
| ManageExpense | YES (Drawer .p-drawer-content scrolls) | YES (.p-drawer-header sticky) | NO (Phase 35) | Bottom Drawer — verify scroll on 390px |
| ManageBudget | YES (Drawer .p-drawer-content) | YES | NO (Phase 35) | Variable rows (one per category) |

### Double-Scroll-Trap Risk

A double-scroll-trap occurs when: (a) the overlay/drawer has `overflow-y: auto` on its content, AND (b) an inner element also has `overflow-y: auto` or `overflow-y: scroll`.

Current codebase scan shows no nested scrollable containers inside the Manage dialog forms. `<Textarea>` elements use `:auto-resize="false"` which means they have a fixed height — not a scroll trap. `<Select>` dropdown overlays teleport to body.

**The new sticky chrome introduces a potential trap:** If the sticky TabList + toolbar are implemented as the page scroll, and then a Drawer opens with its own scroll — this is NOT a double-scroll trap because the Drawer overlay (`position: fixed`) takes the entire viewport and is independent of page scroll. No risk.

**Verify action (LT-07):** On a 390px viewport, open each Manage dialog on mobile (Drawer mode). Confirm that swiping up inside the drawer scrolls the form fields, not the page underneath. This is guaranteed by `pointer-events: auto` on the `.p-drawer-mask` (per PrimeVue drawer CSS inlineStyles) — page scrolling is blocked by the overlay.

---

## BR-2 Barcode Reverify (D-34-06 / NFR-BR-2-PRESERVED)

### BarcodeDisplay.vue Current State

`BarcodeDisplay.vue` uses two module-level constants: [VERIFIED: direct read of BarcodeDisplay.vue lines 7-8]
```ts
const BARCODE_FOREGROUND = '#000000'
const BARCODE_BACKGROUND = '#ffffff'
```

All four render branches (QR, linear, number-fallback, empty) use `bg-white` Tailwind class on the outer div or explicit `background: #ffffff` inline (via `background: BARCODE_BACKGROUND` passed to JsBarcode and `QrcodeVue`). [VERIFIED: BarcodeDisplay.vue lines 59, 76, 83]

The scan overlay in `MembershipDetail.vue` sets `background: #ffffff` explicitly on the overlay div (line 173). [VERIFIED: MembershipDetail.vue line 173]

**Risk assessment:** The CSS changes in Phase 34 are:
1. Rules in `wallecx-overrides.css` targeting `.p-button-icon-only`, `.wallecx-main-tabs .p-tab`, `.p-drawer-bottom .p-drawer-content`, `.wallecx-tab-toolbar`
2. Inline style bindings for `env(safe-area-inset-*)` on MembershipDetail scan overlay
3. None of these touch `BarcodeDisplay.vue`, `.bg-white`, or the barcode module constants

**Conclusion:** BR-2 is highly unlikely to be regressed by Phase 34 changes. The reverify is a mandatory visual check rather than a code-risk mitigation. Record the result: "BarcodeDisplay.vue: black bars on white background confirmed in light mode ✓, dark mode ✓ after Phase 34 CSS sweep."

---

## Common Pitfalls

### Pitfall 1: `.p-tablist overflow: hidden` Breaks Sticky

**What goes wrong:** Adding `position: sticky` to `.p-tablist` while it still has `overflow: hidden` — the sticky element cannot escape its clipping ancestor in some browsers, OR the active-bar animation glitches.
**Why it happens:** PrimeVue sets `overflow: hidden` to clip the scrollable viewport (`.p-tablist-viewport`). The sticky needs to apply to `.p-tablist` which is the outer element.
**How to avoid:** Override `overflow: visible !important` on `.p-tablist` in the same rule that sets `position: sticky`. The inner `.p-tablist-viewport` has its own `overflow-x: auto` — this is unaffected.
**Warning signs:** Active indicator bar disappears or renders at wrong position.

### Pitfall 2: `top` CSS Variable Not Set at Right Scope

**What goes wrong:** `.wallecx-tab-toolbar { top: calc(...) }` uses a CSS variable that is set on `WallecxApp.vue`'s root element, but the toolbar is rendered inside a TabPanel inside TabPanels — the CSS custom property cascades correctly but the variable must be declared on an ancestor element.
**Why it happens:** CSS custom properties cascade through the DOM; if `--wallecx-tablist-height` is set on the Card element but the toolbar is inside a teleported Drawer, it won't cascade.
**How to avoid:** Set the variable on `:root` or on the `.p-tabpanels` element (not a teleported element). For this phase, a hardcoded pixel approximation (`calc(env(safe-area-inset-top) + 52px)`) is acceptable.

### Pitfall 3: ManageVaccination `@primevue/forms` `<Form>` Duplication

**What goes wrong:** Copying the Dialog's `<Form v-slot="$form">` into the Drawer branch and forgetting that `$form` slot scope is local to the template — two `<Form>` elements in the same component both binding the same `:initialValues` and `:resolver` refs don't share a form state. Both forms use the same script-setup refs (`vaccine_type`, etc.) via `@primevue/forms` name-based binding. This is correct since `InputText name="vaccine_type"` binds to the form by name, not by ref.
**Why it happens:** Confusion between `@primevue/forms` name-binding and direct v-model refs.
**How to avoid:** Verify that `InputText name="..."` works correctly in the Drawer branch by testing submit validation in both Dialog and Drawer modes.

### Pitfall 4: `env(safe-area-inset-bottom)` is `0px` Without viewport-fit=cover

**What goes wrong:** `env(safe-area-inset-bottom)` resolves to `0px` on iPhones if `viewport-fit=cover` is absent or if the viewport meta has been modified.
**Why it happens:** The safe-area insets are only non-zero when the viewport is set to cover the full screen including unsafe areas.
**How to avoid:** `index.html` already has `viewport-fit=cover` (verified). LT-09 LOCKED comment prevents future removal.
**Warning signs:** Home-indicator overlap on real device but not in browser DevTools (DevTools doesn't emulate safe-area insets by default unless safe area toggle is on).

### Pitfall 5: Sticky Chrome Covers Content Under It

**What goes wrong:** Sticky TabList + toolbar adds ~96px of sticky chrome on mobile (44px tabs + 52px toolbar). Content that relied on the card's top padding being the only offset now appears partially hidden under the sticky chrome when scrolling to anchors or on initial render.
**Why it happens:** Sticky elements are removed from flow height calculation for scroll offset purposes.
**How to avoid:** Add `padding-top` to the TabPanels content wrapper equal to the combined sticky chrome height, or accept that initial scroll position shows the header (the user sees the full page on load before scrolling).

### Pitfall 6: Dark Mode Background on Sticky Chrome

**What goes wrong:** The sticky TabList and toolbar appear to have no background in dark mode — content scrolls through them visually.
**Why it happens:** `var(--p-tabs-tablist-background)` in light mode is the correct value, but in dark mode the card background differs.
**How to avoid:** Use `var(--p-card-background)` for the toolbar sticky wrapper background, and `var(--p-tabs-tablist-background)` for the tablist. Both are already correctly set by PrimeVue's Aura dark theme. Verify on a dark-mode device or browser DevTools dark simulation.

---

## Code Examples

### Global Touch-Target Rule (wallecx-overrides.css)

```css
/* Phase 34 LT-01: 44×44 touch-target floor for icon-only PrimeVue buttons.
 *
 * Root cause: main.ts applies p-button-sm globally via pt.button.root, and
 * Aura's button.sm.iconOnlyWidth = 2rem (32px) — below the 44px floor.
 * This rule targets only icon-only buttons (.p-button-icon-only class is
 * added by PrimeVue when no label text is present). */
.p-button.p-button-icon-only {
  min-width: 44px;
  min-height: 44px;
}

/* Phase 34 LT-01: Top-level WallecxApp tab triggers.
 * Requires class="wallecx-main-tabs" on <Tabs> in WallecxApp.vue. */
.wallecx-main-tabs .p-tab {
  min-height: 44px;
}

/* Phase 34 LT-05/D-34-01: Sticky TabList on mobile (≤639px).
 * Overrides .p-tablist position:relative and overflow:hidden.
 * Only applies to the top-level WallecxApp tabs. */
@media (max-width: 639px) {
  .wallecx-main-tabs .p-tablist {
    position: sticky !important;
    top: env(safe-area-inset-top);
    z-index: 10;
    background: var(--p-tabs-tablist-background);
    overflow: visible !important;
  }

  .wallecx-tab-toolbar {
    position: sticky;
    top: calc(env(safe-area-inset-top) + 52px);
    z-index: 9;
    background: var(--p-card-background, white);
    border-bottom: 1px solid var(--p-card-border-color, #e5e7eb);
  }

  .my-app-dark .wallecx-tab-toolbar {
    background: #1a1f2e;  /* matches existing .my-app-dark .p-card override */
  }
}

/* Phase 34 LT-03/D-34-04: Safe-area bottom padding in bottom Drawers. */
.p-drawer-bottom .p-drawer-content {
  padding-bottom: max(env(safe-area-inset-bottom), 1rem);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### DragHandle.vue

```vue
<!-- src/components/projects/wallecx/DragHandle.vue
     Phase 34 D-34-03: Visual-only drag-handle pill for bottom-sheet Drawers.
     aria-hidden="true" — decorative; not interactive; no swipe-to-dismiss (Phase 35). -->
<template>
  <div
    class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600"
    aria-hidden="true"
  />
</template>
```

### WallecxApp.vue TabList sticky (template change)

```html
<!-- Add class="wallecx-main-tabs" to existing <Tabs>; no other change to Tabs structure -->
<Tabs v-model:value="activeTab" class="wallecx-main-tabs">
  <TabList>
    <!-- existing Tab elements unchanged -->
  </TabList>
  <TabPanels>
    <!-- existing TabPanel elements unchanged -->
  </TabPanels>
</Tabs>
```

### Per-tab toolbar sticky wrapper

In VaccinationsTab.vue, MembershipsTab.vue, and ExpensesTab.vue, wrap the toolbar component:

```html
<!-- Sticky toolbar wrapper — mobile only; class triggers wallecx-overrides.css rule -->
<div :class="isMobile ? 'wallecx-tab-toolbar' : ''">
  <WallecxToolbar ... />
</div>
```

Note: `isMobile` is already imported via `useIsMobile()` in all three tab components.

### MembershipDetail scan overlay safe-area

```html
<!-- MembershipDetail.vue — add safe-area padding to scan overlay div -->
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
  <!-- Update close button top position -->
  <button
    class="absolute right-4 w-12 h-12 flex items-center justify-center rounded-full"
    style="top: calc(1rem + env(safe-area-inset-top)); background: rgba(0,0,0,0.08);"
    @click="closeScanOverlay"
    aria-label="Close scan view"
  >
```

---

## State of the Art

| Old Approach | Current Approach | Status |
|--------------|------------------|--------|
| `100vh` for full-page height | `100dvh` with `svh` fallback | Clean in wallecx — 0 matches confirmed |
| `useWindowSize` reactive breakpoint (v2.3) | `useMobileEnv().isMobile` (Phase 33) | Both exist; Phase 34 uses `useMobileEnv` for new code; existing `useIsMobile` callers not migrated |
| Per-component `v-if isMobile` for drag handle | `<DragHandle>` shared component | Phase 34 introduces component; replaces 5 existing inline instances |
| `env()` only in WallecxApp.vue Card and PwaInstallBanner | Also in sticky TabList, bottom Drawers, scan overlay | Phase 34 extends coverage |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Aura `button.sm.iconOnlyWidth = "2rem"` (32px) | Touch-Target Gap Inventory | [VERIFIED: node_modules/@primeuix/themes/dist/aura/button/index.mjs] — not an assumption |
| A2 | `position: sticky` on `.p-tablist` with `overflow: visible` will not break the active-bar ink animation | Sticky Chrome Strategy | Low — the ink bar uses JS-positioned `left/width` via a separate `.p-tablist-active-bar` element; removing overflow:hidden on the parent should not affect its calculation |
| A3 | `52px` tablist height approximation for `--wallecx-tablist-height` | Sticky Chrome Strategy | Low — tabs have `min-height: 44px` + Aura padding; 52px is a reasonable upper bound. If wrong, toolbar sticks at slightly wrong offset. Fixable by measurement post-implementation |
| A4 | ExpensesToolbar's `mb-4` margin class on its root div does not conflict with sticky positioning | Sticky Chrome Strategy | Low — `mb-4` is on the toolbar component root, not the sticky wrapper. The sticky wrapper has no margin. |

**All material claims are VERIFIED from direct codebase or PrimeVue source inspection. Only minor approximation assumptions are logged above.**

---

## Open Questions

1. **`overflow: visible` on `.p-tablist` + PrimeVue ink bar**
   - What we know: the ink bar is `position: absolute; inset-block-end: 0` inside `.p-tablist`; removing `overflow: hidden` from `.p-tablist` means the ink bar could render outside the tablist box in theory.
   - What's unclear: does the ink bar ever visually overflow `.p-tablist` height, or is it always flush with the bottom border?
   - Recommendation: Test after implementation. If the ink bar bleeds, add `clip-path: inset(0)` on `.p-tablist` instead of `overflow: visible` — this clips visual overflow without affecting sticky positioning.

2. **ManageVaccination Drawer branch `<Form>` duplication — lazy vs. eager `v-if`**
   - What we know: `ManageVaccination.vue` uses both `@primevue/forms` `<Form>` (for most fields) and a direct v-model `administeredDate` ref. The Dialog and Drawer templates must both render the same `<Form>` structure.
   - What's unclear: whether having two `<Form>` instances in the same component (one `v-if="!isMobile"`, one `v-else`) causes any conflict with the PrimeVue Forms provide/inject context.
   - Recommendation: Each `<Form>` instance provides its own context to its subtree. Since only one renders at a time (v-if/v-else), there should be no conflict. Verify by testing form validation in both branches.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 34 is purely code/CSS changes with no external tool or service dependencies.

---

## Validation Architecture

`workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`. Section skipped.

---

## Security Domain

Phase 34 introduces no new data flows, no new authentication paths, no new inputs that reach the server, and no new cryptographic operations. The only changes are CSS rules, Vue template structure changes (Drawer branches), and a new presentational component (DragHandle). ASVS categories V2/V3/V4/V6 are not implicated. V5 (Input Validation) is not changed — no new inputs are introduced.

Security domain section omitted per phase scope.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `src/assets/wallecx-overrides.css` — existing override precedence idiom; `.p-drawer-bottom .p-drawer { height: 85dvh !important }` pattern verified
- `src/components/projects/wallecx/VaccinationsTab.vue` lines 420-444 — Phase-17 drag-handle pill + reactive Drawer position
- `src/components/projects/wallecx/MembershipsTab.vue` lines 344-366 — existing MembershipDetail bottom Drawer with pill
- `src/components/projects/wallecx/ManageExpense.vue` lines 394-524 — Drawer branch pattern (reference implementation)
- `src/components/projects/wallecx/ManageBudget.vue` lines 163-226 — Drawer branch with pill
- `src/components/projects/wallecx/MembershipDetail.vue` lines 167-203 — scan overlay (fixed inset 0 z-index 9999)
- `src/components/projects/wallecx/WallecxApp.vue` — Card safe-area padding, TabList location, no sticky currently
- `src/components/projects/wallecx/ManageMembership.vue` — Dialog-only, no Drawer branch
- `src/components/projects/wallecx/ManageVaccination.vue` — Dialog-only, no Drawer branch
- `src/components/projects/wallecx/BarcodeDisplay.vue` lines 7-8 — BARCODE_FOREGROUND/BACKGROUND constants
- `src/main.ts` — global PT `button.root.class = "p-button-sm"` confirmed
- `node_modules/@primeuix/themes/dist/aura/button/index.mjs` — `sm.iconOnlyWidth: "2rem"` verified
- `node_modules/@primeuix/styles/dist/tabs/index.mjs` — `.p-tablist { position: relative; overflow: hidden }` verified
- `node_modules/@primeuix/styles/dist/button/index.mjs` — `.p-button-sm.p-button-icon-only { width: dt('button.sm.icon.only.width') }` verified
- `node_modules/primevue/drawer/style/index.mjs` — Drawer CSS class map: `mask`, `root (.p-drawer)`, `header (.p-drawer-header)`, `content (.p-drawer-content)` verified
- `node_modules/primevue/tablist/style/index.mjs` — TabList CSS class map: `root (.p-tablist)`, `content (.p-tablist-content .p-tablist-viewport)`, `tabList (.p-tablist-tab-list)`, `activeBar (.p-tablist-active-bar)` verified
- `index.html` line 6 — `viewport-fit=cover` already present; `interactive-widget=resizes-content` already present
- dvh grep result — 0 matches for `100vh`, `h-screen`, `min-h-screen` in `src/components/projects/wallecx/`
- `.planning/config.json` — `workflow.nyquist_validation: false` confirmed

### Metadata

**Confidence breakdown:**
- dvh audit: HIGH — direct grep, 0 matches
- viewport-fit audit: HIGH — direct file read
- Touch-target gap identification: HIGH — PrimeVue source + main.ts PT confirmed
- Bottom-sheet enumeration: HIGH — every component read
- Sticky chrome strategy: MEDIUM-HIGH — CSS behavior of sticky within PrimeVue's overflow context is well-established; ink-bar question (Open Question 1) has low practical risk
- Safe-area wiring: HIGH — direct `env()` CSS, browser-resolved
- DragHandle component: HIGH — trivial extraction

**Research date:** 2026-05-27
**Valid until:** 2026-06-27 (stable CSS/PrimeVue 4.5.5; no fast-moving dependencies)
