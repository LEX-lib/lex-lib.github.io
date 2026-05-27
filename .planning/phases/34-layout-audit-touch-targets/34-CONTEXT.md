# Phase 34: Layout Audit & Touch Targets - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

A mobile **layout-quality audit sweep** across all 3 Wallecx tabs (Vaccinations, Memberships, Expenses List + Reports) and their overlay surfaces. Delivers: a 44×44 touch-target floor everywhere, `env(safe-area-inset-*)` wiring on the surfaces that need it, sticky tab/toolbar chrome on mobile, drag handles on every bottom sheet, a `100dvh`/`h-screen`→`dvh` confirmation, and a BR-2 barcode reverify.

This is a **presentation-layer audit, not a refactor.** Every locked architectural invariant (BR-2 barcode, bottom-Drawer 85dvh, reactive Drawer position, shell-owns-data, single ConfirmDialog) stays put. No new capabilities, no data-flow changes.

</domain>

<decisions>
## Implementation Decisions

### Sticky header behavior (LT-07)
- **D-34-01:** On mobile, **both the WallecxApp `TabList` AND the active tab's filter/sort toolbar stay pinned** (stacked sticky) while the list scrolls underneath. The toolbar is the primary interaction surface — keeping search/sort reachable mid-scroll outweighs the ~2 rows of vertical cost. Tab-switching also stays reachable while deep in a list.
- The mechanism (CSS `position: sticky` within the Wallecx scroll context vs the page) is a planner/researcher decision — the locked requirement is *what* stays pinned, not *how*. Must not jitter when the iOS URL bar collapses (no `100vh` flicker — already satisfied since wallecx has no `vh`).
- Stacked sticky applies on `isMobile` only (from `useMobileEnv`); desktop layout unchanged.

### Touch-target sweep strategy (LT-01)
- **D-34-02:** **Hybrid enforcement.** Add a global 44×44 floor in `src/assets/wallecx-overrides.css` for PrimeVue interactive elements (`.p-button`, `.p-tab`, icon buttons, sort/filter affordances) — non-scoped so it reaches teleported PrimeVue DOM — AND keep the existing per-component `min-h-[44px]` / `touch-manipulation` Tailwind classes (Phase 15) for custom/non-PrimeVue elements.
- The global rule must NOT inflate intentionally-compact inline elements (e.g. chips, inline metadata) — scope the selector to genuinely-tappable controls, not all elements.
- Phase 15's existing per-component targets are NOT ripped out — the global rule fills gaps; the audit identifies which controls currently fall below 44×44.

### Drag-handle rollout (LT-02 / bottom-sheet polish)
- **D-34-03:** **Extract a shared `DragHandle` component, visual-only.** Pull the Phase-17 pill (`w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600`, `aria-hidden="true"`) into one reusable component rendered in every bottom-sheet Drawer `#header` slot — including the 4 Manage dialogs when in Drawer/bottom mode. Replaces the inline-duplicated markup.
- **Purely decorative.** Swipe-down-to-dismiss gesture is explicitly OUT of scope (deferred — overlaps Phase 35's dirty-state guard work). The handle is a visual affordance only; dismissal stays via backdrop tap / close button.
- Handle renders on mobile only (matches the existing Phase-17 `v-if="isMobile"` pattern).

### Safe-area coverage scope (LT-03)
- **D-34-04:** Wire `env(safe-area-inset-*)` into, in this phase: (1) the **new sticky `TabList`** — top inset for notch clearance, (2) **bottom Drawers** — bottom inset so sheet content clears the home indicator, and (3) the **fullscreen barcode scan overlay** (`MembershipDetail` `position:fixed; inset:0; z-index:9999`) — a clear notch-collision risk for a flagship counter-scan feature.
- **Deferred to Phase 35:** dialog sticky-action-bar bottom insets (Phase 35 owns the sticky action bars — avoid double-editing the same surfaces).
- The existing `WallecxApp.vue` Card padding (`env(safe-area-inset-bottom/left/right)`) and `PwaInstallBanner` bottom inset stay as-is.

### dvh confirmation (LT-04 / NFR-DVH-NOT-VH)
- **D-34-05:** Grep audit already shows **0 `100vh`/`h-screen` matches** in `src/components/projects/wallecx/` — `80dvh`/`85dvh` are already the pattern (`wallecx-overrides.css`). This phase confirms the invariant holds at close rather than performing a migration. If the audit surfaces any stray `vh` (e.g. in a newly-touched template), convert to `dvh` with `svh` fallback.

### BR-2 barcode reverify (NFR-BR-2-PRESERVED)
- **D-34-06:** After the CSS sweep, visually confirm `BarcodeDisplay.vue` still renders **black bars on white background in BOTH light and dark theme** on the Memberships tab. Record the check. Final milestone coverage is owned by Phase 38, but a touch-target/safe-area CSS change is a regression risk so it's reverified here.

### Claude's Discretion
- Exact CSS selectors and specificity strategy for the global touch-target rule (must reach teleported PrimeVue DOM, like the existing `.p-drawer-bottom .p-drawer` override).
- Sticky positioning mechanism (sticky vs container scroll), z-index layering between stacked TabList + toolbar.
- `DragHandle` component location/name and prop surface (if any).
- Whether the sticky toolbar needs a subtle bottom border/shadow to separate it from scrolling content.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 34: Layout Audit & Touch Targets" — goal, success criteria (5 items), requirements LT-01/02/03/04/05/07/09, and the bound NFR/CON (CON-VIEWPORT-FIT, NFR-DVH-NOT-VH, NFR-BR-2-PRESERVED) with verification owners.
- `.planning/STATE.md` §"Architectural Invariants (locked)" — BR-2 barcode, bottom-Drawer/Drawer-position rules, single ConfirmDialog, iOS fullscreen-via-overlay invariant.

### Foundation primitives (Phase 33)
- `src/composables/useMobileEnv.ts` — `isMobile` / `isTablet` / `isStandalone` / `safeAreaInsets` (`{ top, right, bottom, left }` `env()` strings). The single mobile primitive this phase consumes. 639px single source of truth via `useIsMobile()`.

### Existing patterns to extend (NOT replace)
- `src/assets/wallecx-overrides.css` — non-scoped stylesheet imported from `WallecxApp.vue`; the home for the global touch-target floor (reaches teleported PrimeVue DOM). Existing `.p-drawer-bottom .p-drawer { height: 85dvh }` and `.p-dialog-content { max-height: 80dvh }` rules show the scoping idiom.
- `src/components/projects/wallecx/VaccinationsTab.vue` (~line 415-444) — Phase 17 drag-handle pill + reactive `:position="isMobile ? 'bottom' : 'right'"` Drawer pattern to extract/reuse.
- `src/components/projects/wallecx/WallecxApp.vue` — Card already pads `env(safe-area-inset-bottom/left/right)`; TabList lives here (sticky target).
- `src/components/projects/wallecx/MembershipDetail.vue` (~line 166) — `position:fixed; inset:0; z-index:9999` fullscreen scan overlay (safe-area target).

### Viewport meta (LT-09 / CON-VIEWPORT-FIT)
- `index.html` — `<meta name="viewport">` must retain `viewport-fit=cover` (prerequisite for any non-zero `env(safe-area-inset-*)`); add inline LOCKED comment per LT-09 verification ownership.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`useMobileEnv()`** (Phase 33): `isMobile`, `isTablet`, `safeAreaInsets` — consume directly; no new breakpoint detection.
- **Phase-17 drag-handle pill**: `w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600` in `#header` slots — extract to shared `DragHandle`.
- **`wallecx-overrides.css`**: central non-scoped stylesheet, lazy-bundled with the Wallecx chunk; correct home for global touch-target + teleported-DOM rules.
- **Per-component `min-h-[44px]` / `touch-manipulation`**: already on ExpenseItem icon buttons, ExpensesToolbar controls, ManageBudget buttons, ExpensesReportsView Tabs (`min-height: 44px`).

### Established Patterns
- Bottom sheets use PrimeVue `<Drawer position="bottom">` capped at `85dvh`; reactive position switches to `right` on desktop. Don't regress.
- PrimeVue Dialog/Drawer teleport to `<body>` → scoped styles can't reach them → use the non-scoped overrides file.
- dvh already the viewport-height unit of record (no `vh` in wallecx).

### Integration Points
- Sticky chrome attaches at `WallecxApp.vue` (TabList) + each tab's toolbar component (`WallecxToolbar.vue`, `ExpensesToolbar.vue`).
- Safe-area insets feed from `useMobileEnv().safeAreaInsets` or direct `env()` CSS.
- `DragHandle` slots into every bottom-Drawer `#header`.

</code_context>

<specifics>
## Specific Ideas

- Stacked sticky (TabList + toolbar) is the explicit choice over list-space maximization — toolbar reachability mid-scroll is the priority.
- Drag handle stays visual-only this phase; swipe-to-dismiss is consciously held back to keep the Phase 35 dirty-state-guard work coherent.
- The fullscreen barcode scan overlay is called out specifically as a notch-collision risk worth fixing now (flagship counter-scan feature).

</specifics>

<deferred>
## Deferred Ideas

- **Swipe-down-to-dismiss gesture** on bottom sheets — overlaps Phase 35's dirty-state discard guard; revisit there.
- **Dialog sticky-action-bar bottom safe-area insets** — Phase 35 owns the sticky action bars; wiring insets there avoids double-editing.
- **iPad-768 tablet-specific layout** (Drawer-vs-Dialog split via `isTablet`) — substrate exists in `useMobileEnv`, but tablet layout refinement is Phase 35 territory, not this audit.

</deferred>

---

*Phase: 34-layout-audit-touch-targets*
*Context gathered: 2026-05-27*
