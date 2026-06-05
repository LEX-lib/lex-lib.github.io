# Phase 17: Mobile Bottom Sheets & View Toggle - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

On phones (< 640px), replace the right-side Drawer (VaccinationGroupPanel) and the centered Dialog (MembershipDetail) with bottom sheets that slide up from the bottom. Hide the grid/list view toggle in WallecxToolbar on mobile and force list layout as the default — without affecting the stored sessionStorage preference. Desktop/tablet (≥ 640px) behaviour is unchanged.

**In scope:** UX-01 (VaccinationGroupPanel → bottom sheet on mobile), UX-02 (MembershipDetail → bottom sheet on mobile), UX-03 (backdrop + close button dismiss), UX-04 (desktop layouts unchanged), MOB-09 (hide toggle + force list on mobile)

**Out of scope:** Swipe-to-dismiss gestures (explicitly excluded in REQUIREMENTS.md), bottom sheets on tablet (640–1024px), ManageVaccination/ManageMembership CRUD dialogs (stay as dialogs), dark mode fixes (Phase 18)

</domain>

<decisions>
## Implementation Decisions

### Bottom Sheet Height & Scroll
- **D-01:** Both bottom sheets (VaccinationGroupPanel and MembershipDetail) are capped at **85dvh** on mobile. Content area scrolls internally (`overflow-y: auto`) within that cap. Always leaves ~15% backdrop visible for tap-to-dismiss.
- **D-02:** Apply `max-height: 85dvh` and `overflow-y: auto` to the PrimeVue Drawer content area via a **CSS override** (targeting `.p-drawer-content` class, similar to the Phase 15 `.p-dialog-content` 80dvh pattern). One rule covers both the vaccination panel and the membership detail Drawer.

### Drag Handle Pill Indicator
- **D-03:** Both mobile bottom sheets show a **drag handle pill** — a small ~32×4px grey rounded bar centred at the very top of the sheet, above the Drawer header title. Implemented via a **custom `header` slot** on PrimeVue Drawer that prepends the pill element before the title text. The pill is purely visual (no drag/swipe behaviour — out of scope); it signals to the user that the sheet can be dismissed.

### VaccinationGroupPanel — Reactive Drawer Position
- **D-04:** The existing `<Drawer>` in `VaccinationsTab.vue` stays as-is, but its `position` prop is made **reactive**: `:position="isMobile ? 'bottom' : 'right'"`. The `:breakpoints` prop is removed (it is superseded by the reactive position switch). PrimeVue Drawer handles both directions natively with built-in animations.
- **D-05:** The drag handle pill (D-03) is shown **only when mobile** — the custom header slot conditionally renders the pill using `v-if="isMobile"` and falls back to the plain title on desktop.

### MembershipDetail — v-if Dialog / v-else Drawer-bottom
- **D-06:** `MembershipsTab.vue` uses a **`v-if !isMobile` Dialog (desktop) and a `v-else` Drawer `position="bottom"` (mobile)**. Both wrappers contain the same `<MembershipDetail>` component. `MembershipDetail.vue` itself is not modified.
- **D-07:** The Drawer for MembershipDetail uses the same 85dvh cap (D-01, D-02) and drag handle pill (D-03).
- **D-08:** Dismiss/close behaviour: the existing `@hide="selectedRecord = null; fileToken = ''"` handler is wired on both the Dialog's `@hide` event and the Drawer's `@hide` event identically. Edit/Delete actions inside the detail close the sheet first (`showDetail.value = false`) then open the CRUD dialog — identical to the current desktop flow.

### Mobile Detection — isMobile Ref
- **D-09:** A **shared `useIsMobile` composable** at `src/composables/useIsMobile.ts` encapsulates `window.matchMedia('(max-width: 639px)')` with a `MediaQueryList.addEventListener('change', ...)` listener. Returns a reactive `Ref<boolean>`. Both `VaccinationsTab.vue` and `MembershipsTab.vue` import it. Consistent with the `window.matchMedia` pattern already established in `PwaInstallBanner.vue`.
- **D-10:** The 639px breakpoint matches Tailwind's `sm:` threshold (640px) used throughout the codebase.

### View Toggle — Hidden on Mobile, Forced List View
- **D-11:** `VaccinationsTab.vue` adds `&& !isMobile.value` to the existing `showToggle` condition: `!isLoading.value && records.value.length > 0 && displayedGroups.value.length > 0 && !isMobile.value`.
- **D-12:** An **`effectiveViewMode`** computed is introduced in `VaccinationsTab.vue`: `computed(() => isMobile.value ? 'list' : viewMode.value)`. The grid class computation uses `effectiveViewMode` (not `viewMode` directly). The `viewMode` ref and its sessionStorage watch are unchanged — sessionStorage is never written with `'list'` due to mobile forcing.
- **D-13:** When the user resizes from mobile back to desktop, the toggle reappears and `effectiveViewMode` returns the stored `viewMode` value (their last desktop preference). No sessionStorage reset on resize.
- **D-14:** `MembershipsTab.vue` already passes `:show-toggle="false"` and has no view toggle — MOB-09 only affects `VaccinationsTab.vue`.

### Toolbar — WallecxToolbar Unchanged
- **D-15:** `WallecxToolbar.vue` itself does not change. The `showToggle` prop remains the single control point. Callers decide whether to show the toggle.

### Claude's Discretion
- Exact drag handle pill CSS (height, width, colour token, border-radius) — suggested: `w-8 h-1 rounded-full bg-surface-300 dark:bg-surface-600` centred via `flex justify-center`.
- Whether to apply the 85dvh Drawer content override globally (single `:deep()` rule in `WallecxApp.vue` or per-tab) or via a scoped rule in each tab's `<style scoped>` block.
- Exact `aria-label` on the Drawer close button and the drag handle wrapper (`aria-hidden="true"` on the pill itself — it is decorative).
- Whether to use `onMounted` + `MediaQueryList.addEventListener` or `window.matchMedia(...).matches` plus a `watchEffect` for the `useIsMobile` composable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Bottom Sheet (UX-01 through UX-04), §Mobile Toolbar (MOB-09), §Out of Scope — swipe-to-dismiss explicitly excluded

### Roadmap
- `.planning/ROADMAP.md` §Phase 17 — Goal, success criteria (SC 1–5), requirements list

### Prior Phase Context (patterns to carry forward)
- `.planning/phases/15-mobile-layouts/15-CONTEXT.md` — D-06 (80dvh dialog content cap pattern); D-04 (iOS detection via `window.matchMedia`); established CSS override approach for PrimeVue content areas
- `.planning/phases/08-view-toggle/08-CONTEXT.md` — D-06 (`wallecx:view-mode` sessionStorage key), D-07 (value enum `'grid' | 'list'`), D-01/D-02 (toggle position in toolbar), `showToggle` prop contract
- `.planning/phases/06-grouped-card-view-group-detail-panel/06-CONTEXT.md` — D-01 (Drawer from right), D-02 (VaccinationDetail opens on top of Drawer — this layer order must remain correct on desktop)

### Files to Modify
- `src/components/projects/wallecx/VaccinationsTab.vue` — reactive Drawer position, `showToggle` update, `effectiveViewMode` computed, import `useIsMobile`
- `src/components/projects/wallecx/MembershipsTab.vue` — `v-if/v-else` Dialog/Drawer split for MembershipDetail, import `useIsMobile`

### Files to Create
- `src/composables/useIsMobile.ts` — `window.matchMedia('(max-width: 639px)')` reactive ref with event listener

### Files Untouched
- `src/components/projects/wallecx/MembershipDetail.vue` — content unchanged; only its wrapper changes
- `src/components/projects/wallecx/VaccinationGroupPanel.vue` — content unchanged; only Drawer wrapper changes
- `src/components/projects/wallecx/WallecxToolbar.vue` — no changes; `showToggle` prop is the control point
- `src/components/projects/wallecx/ManageVaccination.vue` — not in scope
- `src/components/projects/wallecx/ManageMembership.vue` — not in scope

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VaccinationsTab.vue` — Existing `<Drawer position="right" :breakpoints="{ '641px': '92vw' }">` with `v-model:visible="showGroupPanel"`. The `position` prop becomes reactive; breakpoints removed.
- `MembershipsTab.vue` — Existing `<Dialog v-model:visible="showDetail" modal>` around `<MembershipDetail>`. The Dialog stays for desktop; a `v-else Drawer position="bottom"` is added for mobile with identical event handlers.
- `PwaInstallBanner.vue` — Established `window.matchMedia` pattern for mobile detection (Phase 15, D-04). `useIsMobile` composable formalises this.
- Phase 15 CSS override pattern — `.p-dialog-content { max-height: 80dvh; overflow-y: auto }`. Phase 17 extends this to `.p-drawer-content` at 85dvh.

### Established Patterns
- **PrimeVue Drawer custom header slot:** `<template #header>` inside `<Drawer>` for rendering the pill + title instead of the default title-only header.
- **Reactive PrimeVue props:** All Wallecx props on PrimeVue components are already reactive (`:style`, `:breakpoints`, `v-model`). Making `:position` reactive is consistent.
- **sessionStorage read-on-mount / write-on-watch:** Established in Phase 8. `viewMode` and its watch are unchanged; `effectiveViewMode` is a read-only computed layer above it.
- **`v-if selectedRecord` guard inside Dialog/Drawer:** Both existing wrappers use `<MembershipDetail v-if="selectedRecord">` — preserve this guard in the Drawer wrapper too.

### Integration Points
- `VaccinationsTab.vue` → `useIsMobile` composable → reactive `isMobile` ref drives: Drawer `position`, `showToggle` computation, and `effectiveViewMode`
- `MembershipsTab.vue` → `useIsMobile` → drives Dialog vs Drawer choice; same `showDetail`, `selectedRecord`, `fileToken` refs used in both branches
- `WallecxApp.vue` — `<ConfirmDialog>` lives here; unaffected by Phase 17
- `VaccinationDetail.vue` Dialog (opened from inside VaccinationGroupPanel) — must still open on top of the bottom Drawer on mobile. PrimeVue handles this via z-index stacking automatically; no changes needed.

</code_context>

<specifics>
## Specific Ideas

- Drag handle pill markup (inside custom `#header` slot of Drawer):
  ```html
  <template #header>
    <div class="flex flex-col items-center w-full gap-1">
      <div v-if="isMobile" class="w-8 h-1 rounded-full bg-surface-300 dark:bg-surface-600" aria-hidden="true"></div>
      <span class="font-semibold">{{ selectedGroup?.vaccineType ?? '' }}</span>
    </div>
  </template>
  ```
- `useIsMobile` composable skeleton:
  ```ts
  import { ref, onMounted, onUnmounted } from 'vue'
  export function useIsMobile(breakpoint = 639): Ref<boolean> {
    const query = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const isMobile = ref(query.matches)
    const handler = (e: MediaQueryListEvent) => { isMobile.value = e.matches }
    onMounted(() => query.addEventListener('change', handler))
    onUnmounted(() => query.removeEventListener('change', handler))
    return isMobile
  }
  ```
- `effectiveViewMode` in `VaccinationsTab.vue`:
  ```ts
  const effectiveViewMode = computed(() => isMobile.value ? 'list' : viewMode.value)
  const gridClass = computed(() =>
    effectiveViewMode.value === 'list' ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'
  )
  ```
- CSS override for Drawer content (85dvh cap), to be added alongside the existing dialog override:
  ```css
  :deep(.p-drawer-content) {
    max-height: 85dvh;
    overflow-y: auto;
  }
  ```
- MembershipsTab v-if/v-else structure:
  ```html
  <!-- Desktop: centered Dialog -->
  <Dialog v-if="!isMobile" v-model:visible="showDetail" modal header="Membership Card" ...>
    <MembershipDetail v-if="selectedRecord" ... />
  </Dialog>
  <!-- Mobile: bottom Drawer -->
  <Drawer v-else v-model:visible="showDetail" position="bottom" ...>
    <template #header>...</template>
    <MembershipDetail v-if="selectedRecord" ... />
  </Drawer>
  ```

</specifics>

<deferred>
## Deferred Ideas

- **Swipe-to-dismiss gestures** — Explicitly out of scope per REQUIREMENTS.md. Tracked as PWA-ADV-03 for a future phase.
- **Bottom sheet on tablet (640–1024px)** — Out of scope. Drawer/dialog work well on mid-size viewports.
- **ManageMembership / ManageVaccination CRUD dialogs as bottom sheets** — Not in Phase 17. Only the detail/panel views are in scope.

</deferred>

---

*Phase: 17-mobile-bottom-sheets-view-toggle*
*Context gathered: 2026-05-16*
