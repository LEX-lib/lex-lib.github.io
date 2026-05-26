# Feature Landscape — v4.3 Wallecx Mobile Optimization

**Domain:** Mobile-grade PWA polish for a Vue 3 + PrimeVue 4 + Tailwind v4 mini-app on iOS Safari (~390px), Android Chrome (~360–412px), and iPad (~768–820px). Existing baseline already covers: bottom sheets via PrimeVue `Drawer position="bottom"` + `useIsMobile`, Dialog/Drawer split for all 3 manage dialogs, grid-cols-1 responsive grids, 44px tap targets on key affordances, safe-area insets on the Wallecx shell, PWA installable (iOS banner + manifest + SW with NetworkOnly /api/*), `navigator.storage.persist()`, dark-mode reactive surfaces, BR-2 barcode invariant.
**Researched:** 2026-05-26
**Sources:** Apple Human Interface Guidelines (HIG), Material Design 3 (M3), web.dev mobile-perf playbook, MDN PWA + Service Worker docs, PrimeVue 4 component docs, Vue 3 + Vite ecosystem patterns. Confidence labels per item; MEDIUM/HIGH unless flagged.

> **Reading rule for downstream consumers:** every feature is tagged `[Category | Classification | Complexity]`. Classification is one of **Table stakes** (users will be surprised if absent), **Differentiator** (premium polish), or **Anti-feature** (looks good on paper, hurts on this app — do NOT build). Complexity is S (single plan), M (single phase, multi-plan), L (multi-phase). "Touches" lists existing Wallecx surfaces affected so phases can be sequenced. "Depends on" notes hard prerequisites among features in this catalog.

---

## 1. Layout & touch targets

### Table stakes

**LT-01 — Touch-target audit floor: 44×44 CSS px (Apple HIG) on every interactive element across all 3 tabs**
`[Layout | Table stakes | S]`
- **Why expected:** Apple HIG specifies 44pt minimum; Material 3 says 48dp. The smaller of the two (44 CSS px) is the safe floor for a single number applied uniformly. Existing manage-action buttons and dismiss buttons hit 44px; this audit catches the gaps (icon buttons in toolbars, sort/filter chevrons, MultiSelect tag-remove icons, FileUpload "Choose File" caret, dialog close icons, sub-tab labels).
- **Touches:** `WallecxToolbar.vue`, `ExpensesToolbar.vue`, `VaccinationsTab.vue`, `MembershipsTab.vue`, `ExpensesListView.vue`, `ExpensesReportsView.vue`, `ExpenseItem.vue`, `MembershipCard.vue`, `VaccinationGroupCard.vue`, all three manage dialogs, dialog/drawer headers.
- **Depends on:** none.
- **Confidence:** HIGH (HIG + Material docs unambiguous).

**LT-02 — Horizontal-scroll prevention sweep (no `overflow-x: scroll` on `body`, `html`, `Card`, or top-level tab containers at 360px)**
`[Layout | Table stakes | S]`
- **Why expected:** Horizontal scroll on a small viewport is the #1 "feels broken" signal. Common culprits in Wallecx-shaped apps: long category names in chips/MultiSelect tags overflowing toolbar, wide tables in Reports, fixed-width chart container, DatePicker calendar inside Drawer, unwrapped `code`-like strings (loyalty card numbers, vaccine lot numbers).
- **Touches:** `ExpensesReportsView.vue` (chart wrapper, period selector tabs scroll), `ExpensesToolbar.vue` (MultiSelect chips), `MembershipCard.vue` (card numbers), `VaccinationGroupCard.vue` (vaccine names), `WallecxApp.vue` Card padding.
- **Depends on:** none.
- **Confidence:** HIGH.

**LT-03 — Safe-area inset coverage on ALL fixed/overlay surfaces (top, bottom, left, right; portrait + landscape)**
`[Layout | Table stakes | S]`
- **Why expected:** iPhone notch/Dynamic Island + iPad rounded corners + Android gesture handle eat content. Existing: `WallecxApp.vue` Card applies `padding-bottom/left/right: env(safe-area-inset-*)` and `PwaInstallBanner.vue` uses `calc(env(safe-area-inset-bottom) + 0.75rem)`. Gaps to verify: bottom-anchored `Drawer` content padding (PrimeVue Drawer panel does NOT auto-apply safe-area; sticky drawer footers can hide under home indicator), full-screen barcode scan overlay (Teleported, position:fixed), iOS install banner in landscape (left-inset eats text), Card top padding under iOS status bar in standalone.
- **Touches:** all 3 manage dialogs' mobile Drawer, `VaccinationGroupPanel` Drawer, `MembershipDetail` Drawer, `BarcodeDisplay` scan overlay, `PwaInstallBanner`, `WallecxApp.vue` Card top.
- **Depends on:** none.
- **Confidence:** HIGH.

**LT-04 — Bottom-sheet drag handle (grabber pill) visibly present and discoverable on every bottom Drawer**
`[Layout | Table stakes | S]`
- **Why expected:** Native iOS/Android sheets always show a 32–40×4px pill at top-center as the affordance. `ManageExpense.vue` already renders one (`<div class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600">`); verify ManageMembership, ManageBudget, ManageVaccination, MembershipDetail, VaccinationGroupPanel all render the same pill in their mobile Drawer headers. Without it, users don't know they're in a sheet and look for a non-existent X.
- **Touches:** `ManageMembership.vue`, `ManageBudget.vue`, `ManageVaccination.vue`, `VaccinationGroupPanel.vue`, `MembershipDetail.vue` (Drawer header slot).
- **Depends on:** none.
- **Confidence:** HIGH.

**LT-05 — Sticky tab bar / toolbar that does NOT scroll away with the content**
`[Layout | Table stakes | M]`
- **Why expected:** When the list is long (80+ vaccinations or 200+ expenses), the PrimeVue Tabs strip and search/sort toolbar currently scroll out with the page, forcing users to scroll to the top to switch tabs or change sort. Native mobile apps keep these pinned. Implementation: `position: sticky; top: env(safe-area-inset-top)` on `WallecxApp.vue` TabList; same for toolbar with offset accounting for the TabList height.
- **Touches:** `WallecxApp.vue` (TabList sticky), `VaccinationsTab.vue` + `MembershipsTab.vue` + `ExpensesListView.vue` toolbars.
- **Depends on:** LT-03 (safe-area for `top: env(...)`).
- **Confidence:** HIGH.

**LT-06 — Empty states that match final layout dimensions (no layout shift when data arrives)**
`[Layout | Table stakes | S]`
- **Why expected:** Already mostly in place (`'No expenses yet.'`, `'No expenses match your filters.'`, `'Add expense'` CTA) but verify each empty state reserves the same vertical space the populated list would occupy at minimum, so the page doesn't jump when the loader resolves. CLS target ≤ 0.1 (Core Web Vitals).
- **Touches:** `VaccinationsTab.vue`, `MembershipsTab.vue`, `ExpensesListView.vue`, `ExpensesReportsView.vue` (chart container already does `Math.max(220, n*36)` — good).
- **Depends on:** none.
- **Confidence:** HIGH.

**LT-07 — Modal/dialog body internal scroll with max-height (no body-scroll bleed-through; no off-screen Save button)**
`[Layout | Table stakes | S]`
- **Why expected:** Already partially solved — `wallecx-overrides.css` caps `.p-dialog-content` at `80dvh` and `.p-drawer-bottom .p-drawer` at `85dvh`. Verify all forms (`ManageExpense`, `ManageMembership`, `ManageVaccination`, `ManageBudget`) actually scroll internally rather than expanding past the viewport, and that `<body>` does NOT scroll behind the modal (PrimeVue `Dialog modal` body-lock is well-established; verify Drawer behaves the same).
- **Touches:** all 4 manage dialogs, `wallecx-overrides.css`.
- **Depends on:** none.
- **Confidence:** MEDIUM (PrimeVue's body-lock behavior on `Drawer` deserves a quick smoke check; HIGH for the principle).

**LT-08 — Sticky action bar inside modals on mobile (Save / Cancel always visible above the keyboard and at the bottom of the sheet)**
`[Layout | Table stakes | M]`
- **Why expected:** Current `ManageExpense.vue` renders the Submit button as the LAST element inside the `<form>`. When the keyboard is open on iOS Safari, the form's overflow scrolls, and the button can scroll out of view. Native sheets pin Save/Cancel at the bottom of the sheet with `position: sticky; bottom: 0` + safe-area padding. Same fix for ManageMembership, ManageVaccination, ManageBudget.
- **Touches:** all 4 manage dialogs (`ManageExpense`, `ManageMembership`, `ManageVaccination`, `ManageBudget`).
- **Depends on:** LT-07 (must have internal scroll for `position: sticky; bottom` to do anything).
- **Confidence:** HIGH.

**LT-09 — Backdrop tap closes Drawer + Esc-key closes (already PrimeVue default — verify not disabled by any closable=false during isSaving)**
`[Layout | Table stakes | S]`
- **Why expected:** Standard expectation. `ManageExpense.vue` sets `:closable="!isSaving && !isLoadingCategories"` which is correct — block close-during-save. But verify backdrop tap isn't accidentally killed by a stopPropagation somewhere.
- **Touches:** all 4 manage dialogs.
- **Depends on:** none.
- **Confidence:** HIGH (PrimeVue default behavior).

### Differentiators

**LT-10 — Card / list item swipe-to-reveal actions (Edit / Delete) — Native iOS pattern**
`[Layout | Differentiator | M]`
- **Why valuable:** iOS Mail / Things / Reminders all use swipe-left for delete/edit; replaces an "overflow menu" tap with a single gesture. Could replace per-row kebab on `ExpenseItem`, `VaccinationDetail`, `MembershipCard`.
- **Implementation:** No PrimeVue primitive; would need `@vueuse/core` `useSwipe` or a hand-rolled touch handler.
- **Touches:** `ExpenseItem.vue`, `VaccinationDetail` list rows, `MembershipCard.vue` grid tiles.
- **Anti-conflict warning:** swipe-down already closes the bottom-sheet Drawer; swipe-left/right on a row INSIDE the parent page is fine (Drawer isn't open). The real conflict is between swipe-left-to-delete and the iOS swipe-from-left-edge back gesture in standalone PWA — start swipe target ≥ 20px from the left edge.
- **Depends on:** none.
- **Confidence:** MEDIUM (well-established iOS pattern; less universal on Android Chrome).

**LT-11 — Bottom-sheet snap points (medium 50%, full 90%) with drag-resize**
`[Layout | Differentiator | L]`
- **Why valuable:** Apple Maps / iOS Music sheets snap between a peek state and full-height. Wallecx Drawers go straight to 85dvh — useful for forms, but for read-only detail views (`VaccinationGroupPanel`, `MembershipDetail`) a 50% peek would let users keep context on the list behind.
- **Implementation:** PrimeVue Drawer does NOT support snap points natively. Would need a custom component (vaul-style) or `@vueuse/components` `<UseDraggable>` with manual snap logic. Significant complexity.
- **Touches:** `VaccinationGroupPanel.vue`, `MembershipDetail.vue` only (read-only views — forms should always be 85–90%).
- **Depends on:** none.
- **Confidence:** LOW for value-per-effort; HIGH that the pattern exists.
- **Recommendation:** **Defer.** Out-of-scope marker for v4.3; revisit if user feedback flags it.

**LT-12 — Pull-to-refresh on each tab**
`[Layout | Differentiator | M]`
- **Why valuable:** Native expectation on iOS/Android for any list-of-records screen. Users intuitively pull down to refetch.
- **Implementation:** `@vueuse/core` `useScroll` + custom pull-handler. iOS Safari has a native rubber-band; the trick is gating the trigger to "page already scrolled to top + finger continues to drag down".
- **Anti-conflict warning:** must NOT trigger inside a Drawer (Drawer's swipe-down closes it). Gate on `!isAnyDrawerOpen`.
- **Touches:** `VaccinationsTab.vue`, `MembershipsTab.vue`, `ExpensesListView.vue`, `ExpensesReportsView.vue`. Reuses existing `getFullList()` paths.
- **Depends on:** none.
- **Confidence:** MEDIUM.

**LT-13 — Density toggle (Comfortable / Compact list density)**
`[Layout | Differentiator | S]`
- **Why valuable:** Power users with 200+ expenses want to see more per screen.
- **Touches:** `ExpensesListView.vue` (ExpenseItem padding), persisted in sessionStorage like sort.
- **Confidence:** LOW (nice but rarely-cited expectation; differentiator at best).
- **Recommendation:** Defer unless lightly bundled.

### Anti-features

**LT-AF-1 — Swipe-down to dismiss FORM Drawers (ManageExpense, ManageMembership, ManageBudget, ManageVaccination)**
- **Why avoid:** Forms have unsaved state. A user dragging the sheet to "make room" can accidentally swipe-dismiss and lose typed input. iOS native pattern is: swipe on the GRABBER ONLY for modals with unsaved state, AND a system "Discard / Keep editing" sheet on dismiss attempt. Implementing the full pattern is L-complexity and not worth it.
- **Instead:** Keep close gated to the explicit X button (current behavior). Read-only Drawers (`VaccinationGroupPanel`, `MembershipDetail`) are fine to dismiss any way.

**LT-AF-2 — Floating Action Button (FAB) "+ Add" pinned to bottom-right of every tab**
- **Why avoid:** Material 3 FABs collide with iOS home-indicator safe-area, with the iOS install banner, with sticky bottom action bars on sheets, and they obscure the last row of a list. Wallecx already has clear `+ Add` buttons in toolbars — duplicating as a FAB just adds visual noise.
- **Instead:** Keep the toolbar "Add expense" CTA, ensure it stays sticky (LT-05).

**LT-AF-3 — Long-press to open context menu for row actions**
- **Why avoid:** iOS users expect long-press to invoke text selection / share-sheet / system actions. Hijacking it for app actions feels broken. Use swipe (LT-10) or kebab tap instead.

---

## 2. Mobile performance

### Table stakes

**PF-01 — Core Web Vitals budget on mid-range mobile (Moto G Power / iPhone SE 2020 class)**
`[Performance | Table stakes | M]`
- **Why expected:** Google's published thresholds and the only objective definition of "fast" on mobile.
- **Targets** (confidence HIGH — web.dev):
  - **LCP** (Largest Contentful Paint): ≤ 2.5s on 4G/Slow-4G throttled.
  - **INP** (Interaction to Next Paint, replaces FID since March 2024): ≤ 200ms.
  - **CLS** (Cumulative Layout Shift): ≤ 0.1.
  - **TTI** (Time-to-Interactive): ≤ 3.8s.
  - **TBT** (Total Blocking Time): ≤ 200ms on Slow-4G.
  - **FCP** (First Contentful Paint): ≤ 1.8s.
- **Implementation:** Run Lighthouse mobile audit on `/projects/wallecx` and each tab; record baseline, then iterate. The current vendor chunk (~2.57 MiB compressed) is suspect for LCP/TBT on mid-range Android.
- **Touches:** `vite.config.ts` (codeSplitting groups already configured), all wallecx components.
- **Depends on:** none.
- **Confidence:** HIGH.

**PF-02 — Per-tab lazy load (defer Memberships + Expenses chunks until the user clicks their TabPanel)**
`[Performance | Table stakes | M]`
- **Why expected:** Today `WallecxApp.vue` static-imports `VaccinationsTab`, `MembershipsTab`, and `ExpensesTab` — all three load on first visit even though the user only sees one. Convert to `defineAsyncComponent(() => import('./VaccinationsTab.vue'))` etc. Same for the Reports sub-view.
- **Touches:** `WallecxApp.vue`, `ExpensesTab.vue` (lazy-load ExpensesReportsView).
- **Depends on:** none (route-level lazy load already done; this is one level deeper).
- **Confidence:** HIGH.

**PF-03 — Chart.js + PrimeVue Chart deferred to ExpensesReportsView mount only**
`[Performance | Table stakes | S]`
- **Why expected:** Chart.js is ~150 KB minified. Currently auto-imported by PrimeVueResolver but only used in the Reports sub-tab. Verify it's NOT in the initial vendor chunk and IS in the per-tab async chunk. May already be the case due to PrimeVue's dynamic `import('chart.js/auto')` at mount (per PROJECT.md Phase 26 D-04), but verify in production bundle.
- **Touches:** `vite.config.ts`, `ExpensesReportsView.vue`.
- **Depends on:** PF-02.
- **Confidence:** HIGH (dynamic import pattern is in PrimeVue's source).

**PF-04 — Skeleton states during loading (no spinners, no blank flash) on every tab and the Reports view**
`[Performance | Table stakes | S]`
- **Why expected:** Native expectation; Skeleton must roughly match the final layout to avoid CLS. Already partially done: `ExpensesListView` uses Skeleton (`h=3rem`). Verify each surface has one: VaccinationsTab group cards, MembershipsTab card grid, ExpensesReportsView Grand Total + chart + Budget vs Actual.
- **Touches:** `VaccinationsTab.vue`, `MembershipsTab.vue`, `ExpensesReportsView.vue`.
- **Depends on:** none.
- **Confidence:** HIGH.

**PF-05 — Image / PDF receipt + vaccination scan: lazy-loaded with `loading="lazy"` + `decoding="async"`**
`[Performance | Table stakes | S]`
- **Why expected:** Vaccination cards and receipt thumbnails are off-screen below the fold. Native `<img loading="lazy" decoding="async">` ships in every modern mobile browser. Wallecx already gets thumbnails (`thumb: '100x100'`) from PocketBase — verify the `<img>` tag actually carries `loading="lazy"`.
- **Touches:** `VaccinationDetail.vue`, `VaccinationGroupCard.vue`, `MembershipCard.vue`, `ManageExpense.vue` (receipt thumbnail), `AttachmentPreview.vue`.
- **Depends on:** none.
- **Confidence:** HIGH.

### Differentiators

**PF-06 — List virtualization (render only on-screen rows) on tabs with > 100 items**
`[Performance | Differentiator | M]`
- **Why valuable:** Mobile devices struggle when the DOM grows past ~500 nodes/row. At 200+ expenses, scroll jank shows on mid-range Android. Virtualize with `@tanstack/vue-virtual` or PrimeVue's built-in `VirtualScroller`.
- **Threshold guidance (confidence MEDIUM, web.dev):** virtualize at ≥ 100 rows on mobile, ≥ 200 on desktop. Below that the overhead exceeds the gain.
- **Touches:** `ExpensesListView.vue` (highest cardinality risk for Wallecx).
- **Depends on:** none.
- **Anti-conflict warning:** virtualization breaks `Ctrl+F` text find within the page. Acceptable trade for mobile, but flag the regression.
- **Confidence:** MEDIUM (depends on actual record counts; if no user has >50 records, this is wasted work — instrument first).

**PF-07 — Image format upgrade to WebP for receipt + vaccination scan upload**
`[Performance | Differentiator | S]`
- **Why valuable:** Existing path uses `browser-image-compression` (JPEG/PNG re-encode). WebP is ~25–35% smaller at equivalent quality and is supported by every browser PocketBase serves. AVIF is even better but ~10× slower to encode in-browser.
- **Implementation:** Pass `fileType: 'image/webp'` to `browser-image-compression`.
- **Touches:** `ManageExpense.vue`, `ManageMembership.vue`, `ManageVaccination.vue` (the three EXIF-strip + compression paths).
- **Depends on:** none.
- **Confidence:** HIGH.

**PF-08 — Responsive `srcset` for `MembershipCard` / `VaccinationGroupCard` thumbnails**
`[Performance | Differentiator | S]`
- **Why valuable:** Grid tile is ~150–200 px wide on mobile, ~250 px on desktop — currently fetched at `thumb: '100x100'` for both. Right-sized fetches are 2–3× smaller / sharper.
- **Touches:** `MembershipCard.vue`, `VaccinationGroupCard.vue`, `AttachmentPreview.vue`.
- **Depends on:** none.
- **Confidence:** MEDIUM (PocketBase supports per-request `thumb` param; needs verification it accepts `srcset`-style multi-size).

**PF-09 — Preconnect / preload hints for PocketBase origin and the Wallecx vendor chunk**
`[Performance | Differentiator | S]`
- **Why valuable:** `<link rel="preconnect" href="https://<pb-host>">` shaves ~100–300 ms off first PocketBase fetch by parallelizing DNS + TLS. `<link rel="modulepreload" href="/assets/vendor-*.js">` does the same for the JS module graph.
- **Touches:** `index.html`.
- **Depends on:** none.
- **Confidence:** HIGH.

### Anti-features

**PF-AF-1 — Service-worker caching of PocketBase API responses (stale-while-revalidate for `/api/collections/*`)**
- **Why avoid:** Locked architectural invariant from v2.1 — `NetworkOnly for /api/*`. Wallecx is a personal-records vault; stale balance data on a budget screen is worse than a brief offline error. Auth-token-bearing requests SHOULD never be cached. (Already enforced; flagged so a researcher doesn't propose it.)

**PF-AF-2 — IndexedDB offline-first replica of PocketBase data**
- **Why avoid:** PocketBase has no offline SDK. Hand-rolling a sync layer is L-effort, error-prone, and explicitly out of scope per `.planning/PROJECT.md` ("Full offline data access").

**PF-AF-3 — AVIF receipt upload**
- **Why avoid:** Encoding AVIF in-browser is 5–10× slower than WebP; user perceives a stall on the FileUpload "Choose File" step. WebP captures 80% of the benefit at 10× the speed.

---

## 3. Forms & dialogs on small screens

### Table stakes

**FD-01 — iOS 16px minimum input font-size (prevents auto-zoom on focus)**
`[Forms | Table stakes | S]`
- **Why expected:** iOS Safari auto-zooms the viewport when an `<input>` with computed font-size < 16px gains focus. Net effect: the form jumps, the user has to pinch-zoom back, the experience feels broken. PrimeVue 4 defaults to 14px font on most inputs. Fix: scoped CSS rule for all Wallecx form fields setting `font-size: 16px` at viewport ≤ 640px. Affects `InputText`, `InputNumber`, `Textarea`, `Select editable`, `DatePicker` input.
- **Touches:** `ManageExpense.vue`, `ManageMembership.vue`, `ManageVaccination.vue`, `ManageBudget.vue`, search inputs in toolbars.
- **Depends on:** none.
- **Confidence:** HIGH (this is the single most-cited iOS PWA bug).

**FD-02 — `interactive-widget=resizes-content` (already set ✓) verified working with sticky action bar**
`[Forms | Table stakes | S]`
- **Why expected:** `index.html` already declares `interactive-widget=resizes-content` on the viewport meta. This tells iOS 16+ / Android Chrome to RESIZE the visual viewport when the keyboard opens, rather than overlay it. Verify sticky action bars (LT-08) actually sit above the keyboard rather than getting covered.
- **Touches:** `index.html` (already done), all 4 manage dialogs.
- **Depends on:** LT-08.
- **Confidence:** HIGH (meta tag is set; just needs verification with sticky-bar implementation).

**FD-03 — `inputmode` + `autocomplete` + `enterkeyhint` attributes on every input**
`[Forms | Table stakes | S]`
- **Why expected:** iOS/Android show the WRONG keyboard if `inputmode` is missing. For Wallecx specifically:
  - InputNumber amount → `inputmode="decimal"` (PrimeVue should already render this with `:minFractionDigits`; verify).
  - Toolbar search → `inputmode="search"` + `enterkeyhint="search"`.
  - Card number / lot number → `inputmode="numeric"` (if digits only) or `text` + `autocapitalize="characters"`.
  - Description → `enterkeyhint="next"` to chain to the next field.
- **Touches:** all 4 manage dialogs, toolbar search inputs.
- **Depends on:** none.
- **Confidence:** HIGH.

**FD-04 — Mobile-native date picker (PrimeVue DatePicker `touchUI` mode)**
`[Forms | Table stakes | M]`
- **Why expected:** PrimeVue DatePicker renders a desktop-style popup that is awkward on 360px (small targets, can overflow viewport when opened from inside a Drawer). Use PrimeVue's `touchUI` prop → calendar opens as full-screen modal sized for touch. Keep single code path + single dayjs formatter. Test inside Drawer.
- **Alternative:** Swap to native `<input type="date">` on mobile — platform-perfect but loses dayjs format consistency until parsed; not recommended for consistency.
- **Touches:** `ManageExpense.vue` (expenseDate), `ExpensesToolbar.vue` (dateFrom, dateTo), any other DatePicker.
- **Depends on:** none.
- **Confidence:** HIGH (touchUI is a documented PrimeVue 4 prop).

**FD-05 — Camera capture on FileUpload for receipt + vaccination scan**
`[Forms | Table stakes | S]`
- **Why expected:** On mobile, the most common "upload" action is "take a photo of the thing right now". The `<input type="file" accept="image/*" capture="environment">` attribute opens the camera directly instead of the gallery picker.
- **Touches:** `ManageExpense.vue` (receipt), `ManageVaccination.vue` (card scan), `ManageMembership.vue` (card scan if present).
- **Depends on:** none.
- **Confidence:** MEDIUM (PrimeVue FileUpload's exposure of the `capture` attribute on the underlying `<input>` in `mode="basic"` needs verification during planning; native attribute confidence HIGH; worst case use a raw `<input>`).

**FD-06 — Form field auto-scroll into view when focused (no field hidden by keyboard)**
`[Forms | Table stakes | M]`
- **Why expected:** Even with `interactive-widget=resizes-content`, fields below the visual viewport center can get pushed behind the on-screen keyboard. Standard fix: on `focus`, call `element.scrollIntoView({ block: 'center', behavior: 'smooth' })` with a small delay (~150ms — iOS Safari focus event fires before keyboard finishes animating). Alternative: `scroll-padding-bottom: 50vh` on the form container.
- **Touches:** all 4 manage dialogs.
- **Depends on:** LT-07 (internal scroll container).
- **Confidence:** MEDIUM (multiple acceptable implementations; mobile Safari behavior varies by iOS version).

**FD-07 — Body-scroll lock when any Dialog/Drawer is open (no scroll-through to the page behind)**
`[Forms | Table stakes | S]`
- **Why expected:** PrimeVue's `Dialog modal` already locks body scroll. Verify `Drawer` does the same — PrimeVue 4 Drawer should, but a fast smoke test is worth it. iOS Safari has historic edge cases where momentum scroll bleeds through if not properly locked.
- **Touches:** all 4 manage dialogs in mobile mode, all read-only Drawers.
- **Depends on:** none.
- **Confidence:** MEDIUM (verify with PrimeVue Drawer in 4.x).

### Differentiators

**FD-08 — Submit-on-Enter / submit-on-keyboard-Done on the last input field**
`[Forms | Differentiator | S]`
- **Why valuable:** Native iOS keyboards expose a blue "Done" key when `enterkeyhint="done"` is set on the last field. Currently `<form @submit.prevent="onSubmit">` does handle Enter on a single-line text input, but Wallecx forms mix Textarea (newline ≠ submit), Select (Enter selects), Date (Enter does nothing). Audit per-field enterkeyhint mapping so Enter on the last text input submits.
- **Touches:** all 4 manage dialogs.
- **Depends on:** FD-03.
- **Confidence:** MEDIUM.

**FD-09 — Unsaved-changes guard on close attempt for forms**
`[Forms | Differentiator | M]`
- **Why valuable:** User taps backdrop on `ManageExpense` with 30 seconds of typing — confirmation dialog "Discard changes?" lands before the close. Existing `ConfirmDialog` at the WallecxApp shell can host the prompt; use a `hasUnsavedChanges` computed (form values ≠ initial values).
- **Touches:** all 4 manage dialogs.
- **Depends on:** none.
- **Confidence:** MEDIUM.

**FD-10 — Haptic feedback on save success (`navigator.vibrate(10)` on Android)**
`[Forms | Differentiator | S]`
- **Why valuable:** A 10ms vibrate on save confirms the action without forcing the user to read the toast. Cheap polish.
- **Anti-conflict warning:** iOS doesn't implement Vibration API (`navigator.vibrate` is undefined). Use optional-chain guard. Don't depend on it.
- **Touches:** all 4 manage dialogs.
- **Depends on:** none.
- **Confidence:** HIGH (Android-only; degrades gracefully on iOS).

### Anti-features

**FD-AF-1 — Replace PrimeVue Select with native `<select>` on mobile**
- **Why avoid:** PrimeVue Select supports `editable` (used by ManageExpense for category) and that's a hard requirement — native `<select>` cannot do free-typed category entry. Keep PrimeVue Select.

**FD-AF-2 — `prompt()` / `alert()` / `confirm()` browser dialogs**
- **Why avoid:** Don't theme, don't respect safe-area, blocked by some PWA configurations. Use `ConfirmDialog` (already does).

**FD-AF-3 — Drag-and-drop file upload on mobile**
- **Why avoid:** Drag-and-drop doesn't exist on touch devices; the FileUpload's drag overlay is wasted UI on mobile. PrimeVue's `mode="basic"` (already used in ManageExpense) is correct — verify ManageMembership/ManageVaccination also use basic mode.

---

## 4. PWA install + standalone polish

### Table stakes

**PWA-01 — iOS standalone status-bar style + theme color polish**
`[PWA | Table stakes | S]`
- **Why expected:** iOS Safari reads `<meta name="apple-mobile-web-app-status-bar-style" content="...">` to color the status bar in standalone. Wallecx currently has NO such meta tag in `index.html`. Without it, iOS standalone shows a white status bar against the navy app shell — looks unfinished. Acceptable values:
  - `default` (white background, black text — wrong for dark mode)
  - `black` (black background, white text)
  - `black-translucent` (status bar overlays the app — must respect safe-area; gives the most "edge to edge" look) ← **recommended**
- Also add `<meta name="apple-mobile-web-app-capable" content="yes">` (legacy iOS) and `<meta name="mobile-web-app-capable" content="yes">` (modern alias).
- **Touches:** `index.html` (add meta tags).
- **Depends on:** LT-03 (safe-area must be correct first, since `black-translucent` makes top inset non-zero).
- **Confidence:** HIGH.

**PWA-02 — iOS standalone splash screen (`apple-touch-startup-image` set)**
`[PWA | Table stakes | M]`
- **Why expected:** iOS does NOT auto-generate splash screens from the PWA manifest. Without `<link rel="apple-touch-startup-image" media="..." href="..." />` per device size, the standalone app shows a blank white (or black) screen for 1–3 seconds on launch. Native-feel parity requires generating splash images for at least: iPhone SE, iPhone 11-class, iPhone 15-class, iPad. `@vite-pwa/assets-generator` (already a devDep — 1.0.2) generates these.
- **Touches:** `public/` (new splash PNGs), `index.html` (new `<link>` tags), `vite.config.ts` `includeAssets`.
- **Depends on:** none.
- **Confidence:** HIGH.

**PWA-03 — Apple touch icon polish + manifest `purpose: "any maskable"` audit**
`[PWA | Table stakes | S]`
- **Why expected:** Already 180×180 apple-touch-icon present + maskable-icon-512x512 in manifest. Verify:
  - **Maskable icon safe zone:** logo lives inside the inner 80% circle so Android adaptive icon masking doesn't crop the brand.
  - **Apple touch icon corner radius:** iOS auto-applies the rounded square mask — file must be a square, fully-bled PNG (no transparent corners, no manual rounding).
  - **theme_color + background_color:** both currently `#002244` (navy). Correct for dark/brand. Verify renders intentional for light-mode launch too.
- **Touches:** `public/` (regenerate icons if needed), `vite.config.ts` manifest.
- **Depends on:** none.
- **Confidence:** HIGH.

**PWA-04 — Android: capture `beforeinstallprompt` event + custom Install button (parity with the existing iOS banner)**
`[PWA | Table stakes | M]`
- **Why expected:** iOS gets `PwaInstallBanner.vue` showing "Tap Share → Add to Home Screen". Android Chrome fires a `beforeinstallprompt` event that the app can stash and trigger from a custom button later. Currently the app does NOT capture this event, so Android users only see the browser's mini-infobar (passive, easy to ignore). An "Install Wallecx" button in the same banner slot (when `deferredPrompt` is non-null) makes install obvious on Android too.
- **Touches:** `PwaInstallBanner.vue` (extend to handle BIPE), `WallecxApp.vue` (event listener on mount).
- **Depends on:** none.
- **Confidence:** HIGH.

**PWA-05 — PWA-UAT-01 — Standalone install + toggle dark mode + force-quit + re-open verification**
`[PWA | Table stakes | M]`
- **Why expected:** Deferred from Phase 22 V6 per PROJECT.md. Full UAT covers:
  1. Install Wallecx from iOS Safari Share menu → confirm app icon lands on home screen, name reads "Wallecx", icon renders without crop.
  2. Launch from home screen → status bar correct color (PWA-01), no Safari chrome (display: standalone honored), splash screen visible (PWA-02), Wallecx Card renders edge-to-edge respecting safe-area (LT-03).
  3. Inside standalone, toggle site-wide dark mode → confirm Wallecx surfaces respect it (already validated in v3.0 Phase 22).
  4. Force-quit the app (swipe up on app card in iOS app switcher).
  5. Re-open → still logged in (navigator.storage.persist worked, PocketBase auth token survived).
  6. Soft pass acceptable on a 7+ day backgrounded test if not feasible in-milestone.
  7. Same flow on Android Chrome with `beforeinstallprompt` (after PWA-04).
  8. Confirm in-app navigation (tab switching, drawer open/close) does NOT escape standalone to Safari.
- **Touches:** No code changes — pure UAT, captured in a `PWA-UAT.md` artifact.
- **Depends on:** PWA-01, PWA-02, PWA-03, PWA-04, LT-03.
- **Confidence:** HIGH.

**PWA-06 — Display-mode-aware UI tweaks (`@media (display-mode: standalone)`)**
`[PWA | Table stakes | S]`
- **Why expected:** Common pattern: hide the "Install Wallecx" banner when already installed; hide a browser-only back-button when running in standalone; tighten top padding when status bar is `black-translucent` so content can flow under it.
- **Touches:** `PwaInstallBanner.vue` already does an `isInStandaloneMode()` check ✓ — extend the pattern (add ~12px extra top padding when `display-mode: standalone` AND status bar is translucent).
- **Depends on:** PWA-01.
- **Confidence:** HIGH.

### Differentiators

**PWA-07 — Offline banner + retry affordance (when PocketBase fetch fails AND `navigator.onLine === false`)**
`[PWA | Differentiator | S]`
- **Why valuable:** Right now if PocketBase is unreachable, ExpensesTab toasts `'Failed to load expenses…'` and shows an empty list with no clear way back. A persistent banner at the top of WallecxApp.vue ("You're offline — some data may be stale") with a "Retry" button gives users agency. Use `useOnline` from `@vueuse/core`.
- **Touches:** `WallecxApp.vue`.
- **Depends on:** none.
- **Confidence:** MEDIUM (clearly polish; not table stakes because the toasts cover the bare minimum).

**PWA-08 — Standalone in-app back navigation (Wallecx-internal back from Drawer/Dialog without Safari chrome)**
`[PWA | Differentiator | M]`
- **Why valuable:** In iOS standalone, there's no swipe-from-left-edge back across history.back(). Users instinctively swipe. Workaround: push Drawer/Dialog open into the history stack (`history.pushState`), so swipe-from-edge ≈ "close the sheet".
- **Anti-conflict warning:** popstate handlers must be carefully scoped to the open Drawer/Dialog only.
- **Touches:** all 4 manage dialogs, read-only Drawers.
- **Depends on:** none.
- **Confidence:** LOW (complex to get right; possibly defer to a later milestone).

**PWA-09 — App shortcuts in manifest (`shortcuts: [{ name: 'Add Expense', url: '/projects/wallecx?action=add-expense&tab=expenses' }, …])**
`[PWA | Differentiator | S]`
- **Why valuable:** Long-press the installed PWA icon on Android shows shortcut menu (similar to iOS Quick Actions). "Add Expense" / "Add Vaccination" / "Add Membership" as one-tap entry points feels premium. Requires the app to parse the query string on mount and pre-open the Manage dialog.
- **Touches:** `vite.config.ts` manifest, `WallecxApp.vue` (query string parser → emit to children).
- **Depends on:** none.
- **Confidence:** MEDIUM (good polish; adds new surface).

**PWA-10 — SW-update toast already exists ✓ — verify "Refresh / Later" copy renders inside the standalone safe-area**
`[PWA | Differentiator | S]`
- **Why valuable:** Already implemented (`useRegisterSW` + `needRefresh` + toast.info). Verify vue-sonner's toast container respects `env(safe-area-inset-bottom)` in standalone. If not, configure the Sonner mount.
- **Touches:** `WallecxApp.vue` (already in place), `main.ts` if Sonner needs explicit config.
- **Depends on:** LT-03.
- **Confidence:** HIGH.

### Anti-features

**PWA-AF-1 — Auto-apply SW updates without user prompt (`registerType: 'autoUpdate'`)**
- **Why avoid:** Locked architectural invariant — CRUD forms have unsaved state; silent SW reload destroys it. Keep `registerType: 'prompt'`.

**PWA-AF-2 — Custom URL scheme handler / Web Share Target API for receiving shared content**
- **Why avoid:** Adds significant complexity (manifest + receive flow + permissions); Wallecx has no user-facing import path that would benefit. Defer to a future milestone if real users ask.

**PWA-AF-3 — Push notifications for budget overruns / expiring memberships**
- **Why avoid:** Out of scope per `.planning/PROJECT.md` ("Expiry date reminders requires notification infrastructure"). Mentioned to lock the boundary.

**PWA-AF-4 — Periodic Background Sync for budget refresh**
- **Why avoid:** Locked invariant — NetworkOnly for /api/*. Background sync without auth-aware refresh would silently fail or leak auth tokens. Out of scope.

---

## Feature Dependencies (Cross-Reference)

```
LT-03 (safe-area) ───┬──> LT-05 (sticky tab bar)
                     ├──> PWA-01 (iOS status bar — black-translucent)
                     └──> PWA-10 (toast container)

LT-07 (modal internal scroll) ───┬──> LT-08 (sticky action bar)
                                 └──> FD-06 (focus auto-scroll)

LT-08 (sticky action bar) ────────> FD-02 (verify resizes-content works with sticky)

PWA-01, PWA-02, PWA-03, PWA-04, LT-03 ───> PWA-05 (PWA-UAT-01)

PF-02 (per-tab lazy load) ────────> PF-03 (Chart.js deferred — implied by PF-02)

FD-03 (inputmode + autocomplete) ──> FD-08 (submit-on-keyboard-Done)
```

---

## MVP Recommendation for v4.3 (priority for ROADMAP)

**Tier 1 — Ship in v4.3 (table stakes, high confidence):**

1. **LT-01 Touch-target audit** — Single audit + fixes pass. (S)
2. **LT-02 Horizontal-scroll sweep** — Single audit + fixes pass. (S)
3. **LT-03 Safe-area inset completion** — Required prereq for PWA + sticky surfaces. (S)
4. **LT-04 Bottom-sheet drag handle** on all 4 Drawers. (S)
5. **LT-05 Sticky TabList + toolbar.** (M)
6. **LT-07 Modal internal scroll** verification. (S)
7. **LT-08 Sticky action bars** in all 4 manage dialogs. (M)
8. **PF-01 Lighthouse baseline + Core Web Vitals budget.** (M)
9. **PF-02 Per-tab lazy load** of MembershipsTab + ExpensesTab + ExpensesReportsView. (M)
10. **PF-04 Skeleton states** on every tab + Reports view. (S)
11. **PF-05 `loading="lazy"` on every `<img>`.** (S)
12. **FD-01 iOS 16px input font.** (S)
13. **FD-03 inputmode / autocomplete / enterkeyhint** sweep. (S)
14. **FD-04 DatePicker touchUI mode.** (M)
15. **FD-05 Camera capture** on FileUpload. (S)
16. **FD-06 Focus auto-scroll** in forms. (M)
17. **FD-07 Verify body-scroll lock** on Drawer. (S)
18. **PWA-01 iOS status-bar style** meta tag. (S)
19. **PWA-02 iOS splash screens** via @vite-pwa/assets-generator. (M)
20. **PWA-03 Touch + maskable icon audit.** (S)
21. **PWA-04 Android `beforeinstallprompt` Install button.** (M)
22. **PWA-05 PWA-UAT-01** — gated by 01–04 + LT-03. (M)
23. **PWA-06 Display-mode-aware tweaks.** (S)

**Tier 2 — Differentiators worth including if budget allows:**

24. **PF-07 WebP upload.** (S)
25. **PF-09 Preconnect hints.** (S)
26. **PWA-07 Offline banner.** (S)
27. **PWA-09 Manifest shortcuts.** (S)
28. **PWA-10 SW-update toast safe-area verify.** (S)
29. **FD-08 enterkeyhint Done submit.** (S)
30. **FD-09 Unsaved-changes guard.** (M)
31. **FD-10 Haptic feedback (Android).** (S)
32. **LT-10 Swipe-to-reveal row actions.** (M)
33. **LT-12 Pull-to-refresh.** (M)
34. **PF-08 Responsive thumbnail srcset.** (S)

**Tier 3 — Defer (anti-conflict risk, value-per-effort low, or out of scope):**

- **LT-11 Bottom-sheet snap points** — complex, low payoff, no PrimeVue primitive.
- **LT-13 Density toggle** — niche.
- **PF-06 List virtualization** — gate on actual data volumes; instrument first.
- **PWA-08 Standalone history-back integration** — complex.

**Explicitly NOT in v4.3 (anti-features locked):**

- All LT-AF, PF-AF, FD-AF, PWA-AF entries above. Listed so a future researcher doesn't re-propose them.

---

## Sources

- **Apple Human Interface Guidelines — iOS — Layout** (HIG, current). 44pt minimum touch target; status bar styles; safe-area inset behavior in standalone PWAs. Confidence HIGH.
- **Material Design 3 — Touch targets & accessibility** (m3.material.io, current). 48dp recommendation. Confidence HIGH.
- **web.dev — Core Web Vitals + INP** (March 2024 INP rollout; current thresholds LCP ≤ 2.5s / INP ≤ 200ms / CLS ≤ 0.1). Confidence HIGH.
- **MDN — `<meta name="viewport">` `interactive-widget`** (current). Confidence HIGH.
- **MDN — `apple-mobile-web-app-status-bar-style`** (current; iOS PWA specific). Confidence HIGH.
- **MDN — Web App Manifest (`shortcuts`, `display`, `theme_color`, `purpose: "maskable"`)** (current). Confidence HIGH.
- **MDN — `beforeinstallprompt` event** (current; Android Chrome). Confidence HIGH.
- **vite-plugin-pwa 1.x docs** (`@vite-pwa/assets-generator` for iOS splash screens). Confidence HIGH.
- **PrimeVue 4 docs — Drawer / Dialog / DatePicker (`touchUI`) / FileUpload (`capture`)** (primevue.org current). Confidence MEDIUM-HIGH; `capture` prop on FileUpload `mode="basic"` flagged for verification during planning.
- **@vueuse/core — `useSwipe`, `useScroll`, `useOnline`** (current). Confidence HIGH (already used in project for `useWindowSize`).
- **CSS-Tricks + iOS Safari quirks list — 16px input font auto-zoom prevention** (well-established). Confidence HIGH.
- **Project artifacts:** `.planning/PROJECT.md` (Out of Scope section locks PWA-AF-3, PWA-AF-4, LT-AF in spirit), `.planning/STATE.md` (locks `registerType: 'prompt'`, NetworkOnly for /api/*), `vite.config.ts` (current PWA manifest + workbox config), `index.html` (current viewport meta), `src/assets/wallecx-overrides.css` (existing 80dvh / 85dvh height caps), all wallecx component files surveyed for current Dialog/Drawer/touch-target state.

---

**Confidence summary:** Overall HIGH across the catalog. Two MEDIUM items flagged for verification during planning: FD-05 (PrimeVue FileUpload `capture` prop exposure on basic mode), FD-07 (PrimeVue 4 Drawer body-scroll lock parity with Dialog). LT-11 + PWA-08 flagged as LOW value-per-effort and recommended for deferral.
