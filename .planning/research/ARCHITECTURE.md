# Architecture — v4.3 Wallecx Mobile Optimization

**Domain:** Mobile polish layer on an existing Vue 3 + PrimeVue + PocketBase SPA mini-app
**Researched:** 2026-05-26
**Scope:** Refinement only. No new collections, no new tabs, no Pinia store, no design-token churn.
**Confidence:** HIGH (entire architecture verified by reading source — no training-data assumptions about Wallecx layout).

---

## TL;DR for the Requirements step / Roadmapper

v4.3 is a thin lateral layer on top of the existing architecture, NOT a refactor. The five integration surfaces are:

1. **One new composable, `useMobileEnv.ts`** — replaces ad-hoc `useIsMobile` calls; centralizes `isMobile`, `isTablet`, `isStandalone`, `installPromptEvent` (BeforeInstallPromptEvent), `safeAreaInsets`. Backward-compatible: existing `useIsMobile.ts` stays and becomes a thin re-export so no migration churn is forced.
2. **One new component, `BaseMobileDialog.vue`** — optional adapter that wraps the existing PrimeVue `<Dialog>`-vs-`<Drawer>` switch + sticky action bar + iOS 16px input fix. Used by Manage* dialogs that opt-in. Per-dialog adoption, not big-bang.
3. **`PwaInstallBanner.vue` extended** — same component, two code paths: iOS Safari (existing) + Android/Chromium via `beforeinstallprompt`. Listener registration lifts to **App.vue** so the event is captured BEFORE user navigates to `/projects/wallecx` (event fires once per page load).
4. **`vite.config.ts` build target tweaks** — per-tab dynamic imports of `VaccinationsTab`, `MembershipsTab`, `ExpensesTab` from `WallecxApp.vue` (currently static imports, all in one chunk). PWA icon assets compressed via `vite-plugin-pwa-assets-generator` (already a devDep) + optional `vite-imagetools` for static images. No runtime perf trade-offs because tabs are already mutually exclusive in the UI.
5. **List virtualization deferred until measured** — Wallecx datasets are tiny (personal vault: dozens of records, not thousands). Recommendation: instrument first, virtualize only if a real user hits a slow frame; if needed, `@tanstack/vue-virtual` plugs into the child list views (VaccinationGroupPanel, MembershipsTab grid, ExpensesListView), NOT into a shared component.

Build order (8 questions answered below; sequence rationale in §8): **Foundation composable → PWA install capture → Layout audit (tab-by-tab) → Forms/dialog polish → Performance (bundle split + asset compression) → Optional virtualization → UAT**.

---

## 1. Where does a mobile-audit / responsive-token system live?

### Recommendation: New composable `src/composables/useMobileEnv.ts`

`useIsMobile.ts` already exists and returns a single `Ref<boolean>`. Eight Wallecx components currently call it. v4.3 needs MORE than just `isMobile`: it needs `isTablet`, `isStandalone` (PWA detection), `safeAreaInsets` (for sticky action bars), and `installPromptEvent`. Centralizing these in one composable prevents drift.

**Decision: extend, do not replace.**

```ts
// src/composables/useMobileEnv.ts (NEW)
import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'
import { useIsMobile } from './useIsMobile'

export interface SafeAreaInsets { top: number; right: number; bottom: number; left: number }

export function useMobileEnv() {
  const isMobile  = useIsMobile(639)                   // existing — Tailwind sm: threshold
  const isTablet  = useIsMobile(820)                   // NEW — iPad portrait (820px) and below; combined with !isMobile gives 640–820
  const isStandalone = ref(matchStandalone())
  const installPromptEvent = ref<BeforeInstallPromptEvent | null>(null)
  const insets = ref<SafeAreaInsets>(readSafeAreaInsets())
  // ...listeners on resize / orientationchange / matchMedia('(display-mode: standalone)')
  return { isMobile, isTablet, isStandalone, installPromptEvent, insets }
}
```

| Pattern | Lives | Used by |
|---------|-------|---------|
| `isMobile`, `isTablet` | `useMobileEnv` | Every Wallecx component (current call sites preserved via re-export) |
| `isStandalone` | `useMobileEnv` | `PwaInstallBanner` (hide when running standalone), reports view spacing |
| `safeAreaInsets` | `useMobileEnv` | Sticky action bars in dialogs/drawers, fixed bottom banner padding |
| `installPromptEvent` | `useMobileEnv` (singleton ref module-scope, NOT per-call ref) | `PwaInstallBanner` Android path |

**Backward compatibility invariant:** `useIsMobile.ts` is kept verbatim. New `useMobileEnv.ts` internally calls `useIsMobile()`. Existing callers (VaccinationsTab, MembershipsTab, ExpensesTab, ManageExpense, ExpensesReportsView, etc.) need NO mandatory migration — they keep working. Only NEW code in v4.3 uses `useMobileEnv`.

**Anti-pattern explicitly rejected:** A `src/lib/wallecx/mobile.ts` module. The existing `src/lib/wallecx/` namespace is for non-reactive helpers (period, currency, schemas). Reactive viewport state belongs in `src/composables/`.

---

## 2. Where does list virtualization plug in if needed?

### Recommendation: DO NOT introduce shared `VirtualList.vue`. Defer virtualization to measurement.

**Reality check** — Wallecx is a personal vault. Typical user has:
- ~10–40 vaccination records (one row in VaccinationGroupPanel; the visible list is the group panel sheet, not the outer grid)
- ~5–30 membership cards (grid)
- ~50–500 expenses over a year of use (the only list that could grow long)

Virtualizing a 30-item list adds complexity (variable row heights for ExpenseItem, scroll-restoration handling on Drawer open/close, screen-reader trade-offs) for no measurable benefit. Premature virtualization is the bigger architectural risk than slow scrolling.

**Decision: defer + instrument.**

| Phase | Action |
|-------|--------|
| Performance phase | Add `performance.mark` + `performance.measure` instrumentation around the initial render of `ExpensesListView` and `MembershipsTab` grid; report via console in dev only. |
| Acceptance gate | If a real device (iPhone SE-class, ~2 generations old) renders 200 expenses in under 100 ms paint-to-interactive, DO NOT virtualize. |
| Trigger condition | If measurement shows >16 ms scroll jank on long-running expense logs, then introduce `@tanstack/vue-virtual` (small, framework-agnostic, well-maintained as of 2026). |

**If virtualization is needed** — placement rule:
- **Goes inside the child sibling view** (`ExpensesListView.vue`, `MembershipsTab.vue`'s card grid, `VaccinationGroupPanel.vue`'s list). Not a shared `VirtualList.vue`.
- Reason: each list has a different row template (membership card vs expense row vs vaccination entry), different keying, and different selection semantics. A shared virtualizer would have to accept a render-prop or scoped slot, which is more code than direct integration.
- Parent shell ownership of the data array (`expenses.value`, `records.value`) is preserved. Virtualizer consumes the same prop the current `<template v-for>` consumes.

**Trade-off table:**

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| `VirtualList.vue` shared component | DRY across 3 lists | Each list has different row shape → slot-based, harder than open-coding | Reject |
| Per-view inline virtualization (when needed) | Minimal abstraction; preserves shell-owns-data invariant | Three implementations if all three lists grow | Accept (only when measured) |
| No virtualization (status quo + measure) | Zero new code | Risk if users log 1000s of expenses over years | **Default** until proven inadequate |

---

## 3. Shared mobile patterns: where do sticky action bars, bottom-sheet snap points, keyboard avoidance live?

### Recommendation: New shared component `BaseMobileDialog.vue` + per-component scoped CSS for layout specifics.

The codebase already has the **right primitive** — `<Dialog>`-vs-`<Drawer>` conditional rendering in `ExpensesTab.vue` and `WallecxApp.vue`'s VaccinationsTab. But the pattern is **duplicated across 4 dialogs** (ManageVaccination, ManageMembership, ManageExpense, ManageBudget) plus 3 detail views. v4.3 adds sticky action bars + iOS 16px input fix + keyboard-aware padding, which would 4-7× the duplication if added per-component.

**Decision: introduce one optional wrapper component.**

```vue
<!-- src/components/projects/wallecx/BaseMobileDialog.vue (NEW) -->
<script setup lang="ts">
import { computed } from 'vue'
import { useMobileEnv } from '@/composables/useMobileEnv'

const visible = defineModel<boolean>('visible', { required: true })
const props = defineProps<{
  header: string
  desktopWidth?: string   // '40rem' default
  stickyFooter?: boolean  // sticky action bar on mobile
}>()
defineSlots<{ default: () => unknown; footer?: () => unknown }>()

const { isMobile, insets } = useMobileEnv()
</script>

<template>
  <Drawer v-if="isMobile" v-model:visible="visible" position="bottom" ...>
    <template #header>
      <!-- drag-handle pill + header text — current pattern from ExpensesTab.vue lines 256-261 -->
    </template>
    <div class="mobile-dialog-body" :style="{ paddingBottom: stickyFooter ? '5rem' : `env(safe-area-inset-bottom)` }">
      <slot />
    </div>
    <div v-if="stickyFooter && $slots.footer" class="mobile-dialog-sticky-footer"
         :style="{ paddingBottom: `calc(env(safe-area-inset-bottom) + 0.75rem)` }">
      <slot name="footer" />
    </div>
  </Drawer>
  <Dialog v-else v-model:visible="visible" modal :header="header"
          :style="{ width: desktopWidth ?? '40rem' }"
          :breakpoints="{ '960px': '75vw', '641px': '92vw' }">
    <slot />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </Dialog>
</template>
```

**Adoption strategy: per-dialog opt-in.** Migrate one dialog per phase, observe, then proceed. Order: ManageExpense (lowest risk — already has the cleanest Dialog/Drawer split) → ManageBudget → ManageMembership (highest risk — has direct-v-model ColorPicker pattern, see D-2.0 invariant; must verify the wrapper doesn't break ColorPicker reactivity) → ManageVaccination.

**What stays per-component (scoped CSS, NOT centralized):**
- Field layouts (form grid structure)
- Component-specific copy
- Specialized states (e.g., MembershipDetail's barcode overlay; VaccinationDetail's MIME-branched preview)

**iOS 16px input font** — implemented as a global CSS rule in `wallecx-overrides.css` (Wallecx-scoped via import path), NOT as a per-component override. Targets `input, textarea, select, .p-inputtext, .p-textarea, .p-datepicker-input` with `font-size: 16px` when viewport ≤ 640px.

```css
/* wallecx-overrides.css addition */
@media (max-width: 640px) {
  .p-inputtext, .p-textarea, .p-datepicker-input, .p-inputnumber-input, .p-select-label {
    font-size: 16px;  /* iOS Safari auto-zoom prevention: any input under 16px triggers viewport zoom on focus */
  }
}
```

**Keyboard avoidance** — handled by the OS-native `interactive-widget=resizes-content` (the default for modern browsers when viewport meta is set). No JS scroll-into-view needed. The sticky footer pattern above naturally avoids being hidden by the keyboard because Drawer body is the scroll container and footer is fixed-positioned within that container, NOT `position: fixed` on the viewport. **Locked invariant: no `position: fixed; bottom: 0` on viewport for in-dialog action bars.**

**Scroll trapping** — PrimeVue Dialog/Drawer already trap scroll by default (`modal` prop). No additional work needed unless an audit finds a specific page-scroll bleed-through.

---

## 4. Where does PWA install-flow capture live?

### Recommendation: `beforeinstallprompt` listener registers at **App.vue** (Lexarium shell), capture-only. UI lives at WallecxApp.vue level inside `PwaInstallBanner.vue`.

**Why App.vue, not WallecxApp.vue:** The `beforeinstallprompt` event fires once per page load, early — typically before the user has navigated to `/projects/wallecx`. If the listener is only registered after WallecxApp mounts, the event will have already fired by the time the user opens Wallecx via in-app navigation, and the install prompt will be silently lost. Lexarium-level capture into a singleton ref module-scoped inside `useMobileEnv` solves this.

**Capture is global; UI is Wallecx-only.** This is fine — other Lexarium mini-apps are not installable PWAs (the manifest scope is `/` so technically the whole site is, but Wallecx is the only one that markets installation).

```ts
// src/composables/useMobileEnv.ts — module-scope singleton
const installPromptEventRef = ref<BeforeInstallPromptEvent | null>(null)

// Module-scope listener — registers once when the module is first imported.
// Imported by App.vue early so capture beats user navigation to Wallecx.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()  // suppress the Chrome auto-banner; we render our own
    installPromptEventRef.value = e as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    installPromptEventRef.value = null
  })
}
```

**Concrete change to App.vue:** import `useMobileEnv` once at top of script to force module evaluation. No template changes, no listener boilerplate.

**`PwaInstallBanner.vue` extended (NOT split into 2 components):** the iOS path and Android path share the same dismissal storage key (`wallecx_pwa_banner_dismissed`), the same visual frame, the same standalone-detection guard. The only difference is one branch:
- **iOS Safari:** show "Tap Share then Add to Home Screen" copy (current behavior)
- **Android/Chromium with captured event:** show "Install" button → calls `installPromptEvent.prompt()` → handles `userChoice` outcome → clears event ref

Splitting into two components would duplicate the standalone detection, the storage key, the dismiss button, and the safe-area-bottom calc. Reject.

**Dismissal storage key shared.** Once dismissed in either path, banner stays dismissed for both. This is correct behavior — a user dismissing on iPad Safari doesn't want to see it again on Android Chrome.

---

## 5. Bundle-splitting strategy

### Current state (verified from `WallecxApp.vue` lines 7-9 + `vite.config.ts` lines 109-128)

```ts
// WallecxApp.vue — STATIC imports of all three tabs
import VaccinationsTab from "./VaccinationsTab.vue";
import MembershipsTab from "./MembershipsTab.vue";
import ExpensesTab from "./ExpensesTab.vue";
```

All three tabs ship in the same chunk as `WallecxApp.vue`. The `vite.config.ts` rolldown groups split out leaflet, primevue, and vue/pinia vendors, but the Wallecx app code itself is one chunk including all 3 tabs + every Manage* dialog + every detail view + Chart.js (which is its own dynamic import via PrimeVue at component-mount time, so already lazy).

### Recommendation: per-tab dynamic imports + per-dialog `defineAsyncComponent` for heavy dialogs

```ts
// WallecxApp.vue — AFTER
import { defineAsyncComponent } from 'vue'
const VaccinationsTab = defineAsyncComponent(() => import('./VaccinationsTab.vue'))
const MembershipsTab  = defineAsyncComponent(() => import('./MembershipsTab.vue'))
const ExpensesTab     = defineAsyncComponent(() => import('./ExpensesTab.vue'))
```

**Cost analysis:**

| Concern | Reality |
|---------|---------|
| "Sub-tab navigation feels slower" | The PrimeVue Tabs `TabPanel` lazy-mounts content on first activation. Currently the JS for inactive tabs is loaded but the components don't mount until clicked. With async-component, JS is fetched on first click too. First-click latency on a tab will increase by one chunk-download round trip (~50-200ms on 4G). Sub-second; acceptable. |
| "Sub-tab nav after first load" | Vue caches resolved async components. Second click on a tab = instant (component is already resolved in the module cache). |
| Loading state during async fetch | Add a `<template #fallback><Skeleton /></template>` slot to the AsyncComponent via the second arg to `defineAsyncComponent({ loader, loadingComponent })`. Already-imported `Skeleton` from PrimeVue. |

**Where the splits go (concrete file changes):**

| File | Change |
|------|--------|
| `src/components/projects/wallecx/WallecxApp.vue` | Convert 3 static tab imports to `defineAsyncComponent`. Add loading skeleton via `loadingComponent` option. |
| `src/components/projects/wallecx/VaccinationsTab.vue` | Convert `ManageVaccination` import to async (heavy: zod schema, EXIF strip via browser-image-compression, file upload form). |
| `src/components/projects/wallecx/MembershipsTab.vue` | Convert `ManageMembership` to async. Detail view stays sync (lightweight, hit on every card click). |
| `src/components/projects/wallecx/ExpensesTab.vue` | Convert `ManageExpense` + `ManageBudget` (transitively in ExpensesReportsView) to async. Reports view should also be async — Chart.js is heavy and only loads when user activates the Reports sub-tab. |
| `src/components/projects/wallecx/ExpensesReportsView.vue` | Already lazy via parent — but the chart options computed pulls in dayjs/quarterOfYear which is small. No further work. |
| `vite.config.ts` | Optional: add explicit named chunk groups for `wallecx-vaccinations`, `wallecx-memberships`, `wallecx-expenses` to make the output filenames human-readable in DevTools. |

**Estimated win:** Initial Wallecx route chunk drops from N (whole app) to ~N/3 + shell. First Contentful Paint on the active default tab (vaccinations) is unchanged; switching to memberships or expenses costs one network fetch, which is masked by the in-progress paint of the new tab.

---

## 6. Image-compression pipeline

### Static assets (PWA icons, hero photos)

**Current state:**
- `@vite-pwa/assets-generator@^1.0.2` already a devDep (used to generate `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png` from a source). Run manually; output checked into `public/`.
- `about-me-photo.png` is 9.85 MB (per Plan 14-04 build decision) — explicitly excluded from PWA precache via `globIgnores`.
- No build-time image plugin currently active.

**Recommendation: minimal-touch pipeline.**

1. **PWA icons** — regenerate at known-good sizes via existing `@vite-pwa/assets-generator` from a single SVG source (`public/wallecx-icon.svg` already exists). Add an npm script `npm run pwa:assets` to formalize the generation step. Output is checked in.
2. **Hero photo (`about-me-photo.png` 9.85 MB)** — one-time manual squoosh CLI run targeting WebP at 1920px max width. Drop to <500 KB. This is outside Wallecx scope BUT it improves the wider Lexarium PWA shell loading on mobile, which is in scope per "PWA standalone polish."
3. **Wallecx receipts/scans uploaded by users** — already compressed at upload time via `browser-image-compression` in `ManageExpense.vue`, `ManageMembership.vue`, `ManageVaccination.vue`. No change.
4. **No new vite plugin.** `vite-imagetools` was considered. Rejected: only 1-2 static images need compression and the existing `@vite-pwa/assets-generator` covers PWA icons. Adding `vite-imagetools` is overkill for the v4.3 surface.

| Asset | Tool | Build-time integration |
|-------|------|------------------------|
| PWA icons | `@vite-pwa/assets-generator` (existing) | Manual script, output checked into `public/` |
| Hero photo | One-time `npx @squoosh/cli` | Replace source file in `public/`; no plugin |
| User uploads | `browser-image-compression` (existing runtime) | No change |
| Logos / SVG | None (already SVG) | No change |

---

## 7. Mobile-specific testing surfaces

### Vitest specs

**Convention check:** Existing specs live in `src/<area>/__tests__/*.spec.ts` (verified: `src/lib/pocketbase/__tests__/`, `src/router/__tests__/`, `src/lib/wallecx/period.test.ts`). Composable specs follow the same pattern.

**Recommended new spec files:**

| File | Tests |
|------|-------|
| `src/composables/__tests__/useMobileEnv.spec.ts` | matchMedia mock for `isMobile` toggle at 639/640 boundary; `isTablet` at 820/821; standalone detection via `matchMedia('(display-mode: standalone)')` mock; safe-area inset reading via injected CSS env; beforeinstallprompt event capture via dispatched MouseEvent simulation. |
| `src/components/projects/wallecx/__tests__/PwaInstallBanner.spec.ts` (NEW) | iOS UA detection; Android path renders Install button only when installPromptEvent is non-null; dismissal storage write/read; standalone-mode hides banner; both paths share the dismissal key. |

**Anti-pattern flagged:** Do NOT write Vitest specs for `BaseMobileDialog.vue` per se. Component-level behavior (slot rendering, Dialog-vs-Drawer switching) is better verified in HUMAN-UAT than in jsdom (PrimeVue's portal/teleport interactions are unreliable in jsdom).

### Manual UAT structure

**Recommended pattern: viewport-tagged scenarios in per-phase `*-HUMAN-UAT.md`.** Do NOT create a separate "mobile UAT" file.

Each phase's HUMAN-UAT.md gets a new section structure:

```markdown
## Scenario N: [Description]
**Viewports under test:** [iOS-390, Android-360, Tablet-820, Desktop-1280]

**Pre-conditions:** ...

**Steps:**
1. ... [marked as viewport-specific where applicable]

**Pass criteria:**
- [iOS-390] no horizontal scroll, tap targets ≥44px
- [Android-360] safe-area bottom inset respected
- [Tablet-820] toolbar layout maintains row format
- [Desktop-1280] no regression in existing behavior
```

**One file per phase remains the convention.** A separate `MOBILE-HUMAN-UAT.md` would diverge from `gsd-transition` workflow expectations. The viewport-tag convention is the addition.

**iOS standalone PWA path needs a dedicated phase scenario** (deferred from v2.1 Phase 22 V6 per STATE.md). Cannot be automated; requires a real iOS device + iCloud-paired test account.

---

## 8. Suggested build order

### Grouping decision: **by category, NOT by surface.**

Reasoning:
- Each category establishes one architectural pattern (composable, banner integration, sticky-footer template, build config). Establishing the pattern once then applying it across all 3 tabs amortizes cost.
- Tab-by-tab ordering would mean re-deriving the BaseMobileDialog pattern in Phase A (Vaccinations), refining it in Phase B (Memberships), and discovering edge cases in Phase C (Expenses). Category-grouping discovers edge cases earlier across all surfaces in a single phase.
- The category groups also map cleanly onto the milestone's stated four areas: Layout & Touch Targets / Performance / Forms & Dialogs / PWA.

### Phase sequence (recommended)

| Phase | Focus | Key Outputs | Why this order |
|-------|-------|-------------|----------------|
| **33** | Foundation composable + PWA install capture | `useMobileEnv.ts`; App.vue listener wiring; `PwaInstallBanner.vue` Android path | App.vue listener must register on first page load. Foundation composable unblocks every later phase. |
| **34** | Wallecx-wide layout audit + 44px touch targets | Audit doc; per-tab scoped CSS fixes; safe-area inset application to all sticky surfaces; toolbar horizontal-overflow handling | Comes before forms work because dialog content sits inside the layout shell — fixing the shell first means dialogs inherit a known-good frame. |
| **35** | Forms & dialogs on small screens (BaseMobileDialog rollout) | `BaseMobileDialog.vue`; iOS 16px input fix in `wallecx-overrides.css`; per-dialog migration (ManageExpense → ManageBudget → ManageMembership → ManageVaccination) | Sticky action bar depends on safe-area-inset wiring from Phase 34. iOS input fix is one CSS rule but verification requires real iOS device. |
| **36** | Mobile performance — bundle splits + asset compression | `WallecxApp.vue` async tab imports; per-Manage* `defineAsyncComponent`; PWA assets regeneration; hero photo compression; instrumentation marks for list-render timing | Perf changes are non-functional and easier to verify once the visual layer (Phases 34-35) is stable. |
| **37** | PWA standalone polish + install flow UAT | Install-banner Android path UAT; standalone mode safe-area verification; status-bar color in standalone; iOS A2HS UAT (deferred from v2.1); install-prompt deferred-event semantics | Requires Phase 33 listener + Phase 34 safe-area + Phase 36 reduced bundle to feel "native-grade." |
| **38** (conditional) | List virtualization | `@tanstack/vue-virtual` integration in one of the long list views | Only if Phase 36 instrumentation reveals slow scrolling on real data. May not happen. |
| **39** | Mobile UAT sweep | Viewport-tagged HUMAN-UAT scenarios across phases 33-37; tablet (820px) coverage explicit | Mirrors v4.1 Phase 30 sweep structure — proven workflow. |

### Why NOT tab-by-tab

A tab-by-tab order would look like Phase 33 = Vaccinations all-mobile-work, Phase 34 = Memberships all-mobile-work, etc. Trade-offs that pushed me away from this:
- BaseMobileDialog would have to land in Phase 33 anyway, then sit unused until later phases adopt it — same lead time.
- Each phase would touch many categories at once → less reviewable diff.
- Mid-milestone discovery (e.g., "iOS 16px input fix needs to apply to ALL inputs across all tabs") would require revisiting earlier tabs — costlier.

---

## 9. Compatibility constraints to respect

Repeating from the milestone context for the Roadmapper's convenience, with the v4.3 implication for each:

| Invariant | v4.3 implication |
|-----------|------------------|
| **BR-2 barcode invariant** (black-on-white in both themes) | `BarcodeDisplay.vue` style block is OFF-LIMITS. Mobile audit may resize the barcode card or change padding, NOT colors. |
| **PWA `registerType: 'prompt'`** (never autoUpdate; CRUD forms have unsaved state) | Confirmed in `vite.config.ts:27`. The Phase 33 install-flow work does NOT change the SW update strategy — install is separate from update. |
| **All PocketBase calls `NetworkOnly`** | Confirmed in `vite.config.ts:90-94`. v4.3 has no PocketBase work, so trivially upheld. |
| **`useConfirm` broadcasts to single app-shell instance** | `ConfirmDialog` lives at `WallecxApp.vue:105`. BaseMobileDialog does NOT mount its own ConfirmDialog. Each Manage* component using BaseMobileDialog still goes through the shell-level confirm service. |
| **ColorPicker direct v-model pattern (PrimeVue #8135)** | When BaseMobileDialog is adopted for `ManageMembership.vue`, the ColorPicker binding inside the default slot must preserve direct-ref binding. Test path: slot rendering must NOT introduce a wrapping reactive proxy that breaks initial-value flow. Validate in real PR — this is the highest-risk migration. |
| **iOS fullscreen via viewport overlay (not Fullscreen API)** | Membership scan overlay is unaffected by v4.3 — already uses the documented pattern. v4.3 should NOT introduce Fullscreen API calls for any new full-screen surface. |
| **requestKey per collection** | No new PocketBase calls in v4.3. The five locked keys stay distinct. |
| **`pb.authStore.record!.id` null-guard** | Existing guards in `ManageExpense:76-77`, `ExpensesTab:124-128`, etc. v4.3 does not introduce new auth-dependent paths. |
| **D-13: Admin-UI checkpoints require text paste-back + smoke verify** | Does not apply to v4.3 — no live external artifact configuration. |
| **Period selector / dayjs `Q` template-literal quirk** | Unchanged. v4.3 may resize/restyle the period selector but must not change `formatPeriodLabel`. |

---

## 10. Integration points — concrete file map

### NEW FILES

| File | Purpose | Touched by phase |
|------|---------|------------------|
| `src/composables/useMobileEnv.ts` | Reactive viewport + PWA env state | 33 |
| `src/components/projects/wallecx/BaseMobileDialog.vue` | Shared mobile dialog wrapper | 35 |
| `src/composables/__tests__/useMobileEnv.spec.ts` | Composable unit tests | 33 |
| `src/components/projects/wallecx/__tests__/PwaInstallBanner.spec.ts` | Banner branch tests | 33 |

### MODIFIED FILES

| File | Change | Phase |
|------|--------|-------|
| `src/App.vue` | Import `useMobileEnv` at top of script to force module evaluation (registers beforeinstallprompt listener early) | 33 |
| `src/components/projects/wallecx/PwaInstallBanner.vue` | Add Android/Chromium install branch consuming `installPromptEvent` from `useMobileEnv` | 33 |
| `src/components/projects/wallecx/WallecxApp.vue` | Tabs to `defineAsyncComponent`; safe-area inset audit on outer Card | 33 (safe-area), 36 (async tabs) |
| `src/components/projects/wallecx/VaccinationsTab.vue` | Toolbar layout audit; ManageVaccination async import; touch-target audit on group cards | 34, 35, 36 |
| `src/components/projects/wallecx/MembershipsTab.vue` | Grid audit (1-col vs 2-col on tablet); ManageMembership async import; sort+search bar touch targets | 34, 36 |
| `src/components/projects/wallecx/ExpensesTab.vue` | Sub-tab triggers ≥44px (already 44px per scoped CSS at line 280-283 — verify on real device); ManageExpense/ManageBudget async; receipt-preview Drawer audit | 34, 36 |
| `src/components/projects/wallecx/ExpensesListView.vue` | Filter/sort toolbar wrap audit; row touch targets; long-list render instrumentation | 34, 36 |
| `src/components/projects/wallecx/ExpensesReportsView.vue` | Period-selector tabs scrollable behavior on narrow viewports (already scrollable per Phase 26 decision — verify); chart container responsive height; "Manage Budgets" button placement (already inside STATE 4 — verify it doesn't get clipped by mobile bottom nav) | 34 |
| `src/components/projects/wallecx/ManageExpense.vue` | Migrate to `BaseMobileDialog`; verify form refs stay reactive through the wrapping slot | 35 |
| `src/components/projects/wallecx/ManageBudget.vue` | Migrate to `BaseMobileDialog`; sticky-footer for "Save All" action | 35 |
| `src/components/projects/wallecx/ManageMembership.vue` | **HIGHEST RISK** migration — ColorPicker direct v-model invariant must be preserved through slot | 35 |
| `src/components/projects/wallecx/ManageVaccination.vue` | Migrate to `BaseMobileDialog`; file-upload UX on mobile | 35 |
| `src/components/projects/wallecx/AttachmentPreview.vue` | PDF viewer touch / pinch-zoom audit on mobile | 34 |
| `src/components/projects/wallecx/BarcodeDisplay.vue` | **NO CHANGES** beyond layout-frame audit; BR-2 invariant locked | 34 (audit only) |
| `src/components/projects/wallecx/WallecxToolbar.vue` | Search input ≥44px; sort dropdown touch target; iOS input font-size | 34, 35 |
| `src/components/projects/wallecx/ExpensesToolbar.vue` | Filter chips wrap on narrow; DatePicker mobile layout | 34 |
| `src/composables/useIsMobile.ts` | **NO CHANGES** — kept as-is for backward compat | — |
| `src/assets/wallecx-overrides.css` | Add `@media (max-width: 640px) { input/textarea/select { font-size: 16px } }`; sticky-footer scoped styles | 35 |
| `vite.config.ts` | Optional: explicit named chunk groups for `wallecx-vaccinations`, `wallecx-memberships`, `wallecx-expenses` | 36 |
| `public/about-me-photo.png` | Replaced with compressed WebP (1920px / <500KB) | 36 |

### UNCHANGED INVARIANTS (locked — DO NOT touch)

- `src/lib/pocketbase/index.ts` (pb singleton)
- `src/lib/pocketbase/*Mapper.ts` (5 mappers)
- `src/lib/wallecx/period.ts`, `currency.ts`, `expenseSchema.ts`
- `src/types/wallecx/*/types.d.ts`
- `src/composables/useTheme.ts`, `src/composables/useChartTheme.ts`
- `src/router/index.ts` (route shape; no new routes)
- `src/main.ts` (PrimeVue + Pinia + Aura preset)
- All PocketBase collection schemas + requestKeys

---

## 11. Data flow changes

**None.** v4.3 is presentation-layer only.

The "shell-owns-data" pattern from v4.0 (ExpensesTab → ExpensesListView + ExpensesReportsView) is preserved verbatim. BaseMobileDialog is a presentation wrapper; it does not own data and does not fetch.

The only state-shaped addition is `useMobileEnv`'s singleton refs (`installPromptEvent`, `isStandalone`), but these are environmental signals about the device/browser, NOT app data. They live in the composable's module scope deliberately — they're singletons by nature, not per-component reactive state.

---

## 12. Architecture decisions summary

| # | Decision | Rationale |
|---|----------|-----------|
| A-43-1 | New composable `useMobileEnv.ts`; keep `useIsMobile.ts` as a re-export shim | Backward compatibility for 8 existing call sites; centralizes new env state without forcing migration |
| A-43-2 | `BaseMobileDialog.vue` is per-dialog opt-in, not big-bang refactor | Risk control: ManageMembership ColorPicker invariant is fragile; one migration per phase allows verification |
| A-43-3 | Defer list virtualization until measured | Wallecx datasets are small; premature virtualization adds complexity for no measurable user benefit |
| A-43-4 | `beforeinstallprompt` listener registers at App.vue scope, not WallecxApp | Event fires once on first page load; if user navigates to Wallecx after the event already fired, capture is lost |
| A-43-5 | `PwaInstallBanner.vue` extended (iOS + Android paths in one component), NOT split | iOS and Android share dismissal storage, standalone detection, visual frame — splitting duplicates 80% of the component |
| A-43-6 | Per-tab `defineAsyncComponent` from `WallecxApp.vue` | First-click chunk fetch is sub-second; second click is cached; initial Wallecx route chunk drops by ~2/3 |
| A-43-7 | iOS 16px input font fix as a global rule in `wallecx-overrides.css`, not per-component | Applies to every input across all dialogs; one rule replaces N per-component overrides |
| A-43-8 | Keyboard avoidance via in-Drawer sticky footer pattern, NOT viewport `position: fixed` | Browser's native `interactive-widget=resizes-content` already handles viewport resize; viewport-fixed footers fight the keyboard and lose |
| A-43-9 | Build order grouped by category, not by tab | Patterns established once and applied across surfaces is cheaper than rediscovering them tab-by-tab |
| A-43-10 | Viewport-tagged scenarios in per-phase HUMAN-UAT.md, NOT separate mobile-UAT file | Preserves `gsd-transition` workflow; tags add coverage without splitting deliverables |
| A-43-11 | No new vite image plugin; rely on existing `@vite-pwa/assets-generator` + one-time squoosh CLI for hero photo | Two static images need compression — plugin overhead exceeds benefit |

---

## 13. Pattern-to-follow cheat sheet for the Roadmapper

For each kind of v4.3 work item, here's the pattern the implementation should follow:

| Work type | Pattern |
|-----------|---------|
| Reactive env state (isMobile/isTablet/isStandalone/inset/install event) | New entry in `useMobileEnv.ts` composable |
| One-off mobile CSS rule (touch targets, font-size, layout) | Scoped `<style>` in the target component if visual-only; `wallecx-overrides.css` if it must reach teleported PrimeVue DOM (`.p-dialog-*`, `.p-drawer-*`) |
| Shared dialog adapter | `BaseMobileDialog.vue` slot composition; opt-in adoption |
| Dialog-vs-Drawer per-tab logic | Migrate to BaseMobileDialog (Phase 35) or preserve current `isMobile` ternary if migration is too risky for that dialog |
| Per-tab code-splitting | `defineAsyncComponent` at the import site + `loadingComponent` slot |
| PWA install affordance | Branch in `PwaInstallBanner.vue` consuming `useMobileEnv`'s install state |
| List performance instrumentation | `performance.mark()` in `onMounted` and `performance.measure()` after the next tick; log in dev only |
| Image compression (static) | `@vite-pwa/assets-generator` for PWA icons; manual squoosh for one-off; user-uploaded images unchanged |
| Composable unit tests | `src/composables/__tests__/<name>.spec.ts` matching existing convention |
| Manual UAT | Viewport-tagged scenarios in per-phase `*-HUMAN-UAT.md`; explicit "[iOS-390] / [Android-360] / [Tablet-820] / [Desktop-1280]" lines under pass criteria |

---

## Sources

- Source files read in this codebase (HIGH confidence — direct verification):
  - `src/composables/useIsMobile.ts`, `useTheme.ts`, `useChartTheme.ts`
  - `src/components/projects/wallecx/WallecxApp.vue`, `VaccinationsTab.vue`, `MembershipsTab.vue` (head), `ExpensesTab.vue`, `ManageExpense.vue` (head), `PwaInstallBanner.vue`
  - `src/App.vue`, `src/main.ts`, `src/router/index.ts`
  - `src/lib/wallecx/period.ts`
  - `src/assets/wallecx-overrides.css`
  - `vite.config.ts`
  - `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/codebase/ARCHITECTURE.md`
- Industry knowledge (MEDIUM confidence — training data; not verified against 2026 docs in this session):
  - iOS Safari 16px-input auto-zoom prevention rule
  - `beforeinstallprompt` capture semantics (Chrome/Edge fire once on first page-load eligibility check)
  - `interactive-widget=resizes-content` viewport behavior
  - Vue's `defineAsyncComponent` module-cache deduplication

**Confidence on the document overall: HIGH.** The architecture recommendations are grounded in source files I read directly. The PWA install-event semantics + iOS input font-size rule are from training data and could be verified against MDN in the Pitfalls research phase if the Roadmapper wants belt-and-suspenders.
