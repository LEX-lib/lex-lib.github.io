# Phase 17: Mobile Bottom Sheets & View Toggle - Pattern Map

**Mapped:** 2026-05-16
**Files analyzed:** 3 (2 modify, 1 create)
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/projects/wallecx/VaccinationsTab.vue` (modify) | container component | request-response + UI state | self-extend (existing `<Drawer position="right">` and `viewMode` ref); cross-ref `MembershipsTab.vue` for non-toggle pattern | exact (self-modify) |
| `src/components/projects/wallecx/MembershipsTab.vue` (modify) | container component | request-response + UI state | self-extend (existing `<Dialog v-model:visible="showDetail">`); cross-ref `VaccinationsTab.vue` `<Drawer>` for new `v-else` branch | exact (self-modify) |
| `src/composables/useIsMobile.ts` (create) | composable / utility | reactive media-query state | `PwaInstallBanner.vue` (`window.matchMedia('(display-mode: standalone)').matches`) | role-match (extends to event-listener form) |

**Directory creation note:** `src/composables/` does **not** exist in the codebase yet. The planner must create the directory as part of the create step for `useIsMobile.ts`. No prior composable exists — `useIsMobile` is the first one.

## Pattern Assignments

### `src/composables/useIsMobile.ts` (composable, reactive media-query state)

**Analog:** `src/components/projects/wallecx/PwaInstallBanner.vue` (lines 13–19) — only existing `window.matchMedia` consumer

**Pattern from analog** (PwaInstallBanner.vue, lines 13–19):
```ts
function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}
```

Notes on what to copy:
- One-shot `window.matchMedia(query).matches` access — copy the **same idiom** for initial value seeding inside `useIsMobile`.
- `PwaInstallBanner.vue` only reads matchMedia once on mount; the composable extends this with a `change` event listener for reactivity.

**Vue lifecycle import pattern** (VaccinationsTab.vue, line 2):
```ts
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
```
Use the same single-line import grouping for `ref, onMounted, onUnmounted` in `useIsMobile.ts`.

**Composable shape to write** (from CONTEXT.md §Specific Ideas, D-09, claudes-discretion option A):
```ts
import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export function useIsMobile(breakpoint = 639): Ref<boolean> {
  const query = window.matchMedia(`(max-width: ${breakpoint}px)`)
  const isMobile = ref(query.matches)
  const handler = (e: MediaQueryListEvent) => { isMobile.value = e.matches }
  onMounted(() => query.addEventListener('change', handler))
  onUnmounted(() => query.removeEventListener('change', handler))
  return isMobile
}
```

**TypeScript style notes** (project convention from existing files):
- Double-quoted strings are used in `VaccinationsTab.vue`; single-quoted in `MembershipsTab.vue`. Both acceptable. New composable can use either — recommend single quotes to match the newer `MembershipsTab.vue` style.
- No semicolons in `MembershipsTab.vue`, semicolons in `VaccinationsTab.vue`. Prettier should auto-format; do not force either way manually.

---

### `src/components/projects/wallecx/VaccinationsTab.vue` (container component, self-modify)

**Analog:** self (in-place modification)

**Imports pattern — current** (lines 1–11):
```ts
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import dayjs from "dayjs";
import { toast } from "vue-sonner";
import { useConfirm } from "primevue/useconfirm";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
import ManageVaccination from "./ManageVaccination.vue";
import VaccinationGroupCard from "./VaccinationGroupCard.vue";
import VaccinationGroupPanel from "./VaccinationGroupPanel.vue";
import WallecxToolbar from './WallecxToolbar.vue';
```
**Action:** append `import { useIsMobile } from '@/composables/useIsMobile';` after line 11. Path alias `@` maps to `src/` (per CLAUDE.md §Key Conventions).

**Existing `gridClass` computed — to be modified** (lines 122–126):
```ts
const gridClass = computed(() =>
  viewMode.value === 'list'
    ? 'grid grid-cols-1 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-4',
);
```
**Action:** Insert `const isMobile = useIsMobile();` near the top of the script setup (alongside other refs near line 26–30). Insert `const effectiveViewMode = computed(() => isMobile.value ? 'list' : viewMode.value);` just before `gridClass`. Change `viewMode.value === 'list'` to `effectiveViewMode.value === 'list'` inside `gridClass`.

Per D-12, do not change the existing `viewMode` ref or the `sessionStorage` watch on lines 170–176 — `effectiveViewMode` is a read-only layer above `viewMode`.

**Existing Drawer markup — to be modified** (lines 409–425):
```html
<Drawer
  v-model:visible="showGroupPanel"
  position="right"
  :header="selectedGroup?.vaccineType ?? ''"
  :style="{ width: '30rem' }"
  :breakpoints="{ '641px': '92vw' }"
  @hide="selectedGroup = null"
>
  <VaccinationGroupPanel
    v-if="selectedGroup"
    :records="selectedGroup.records"
    :list-token="listToken"
    @view="openDetail"
    @edit="openManage"
    @delete="openDelete"
  />
</Drawer>
```
**Action per D-04 / D-05:**
- Replace `position="right"` with `:position="isMobile ? 'bottom' : 'right'"`.
- Remove the `:breakpoints="{ '641px': '92vw' }"` line entirely (superseded by reactive position switch).
- Remove the `:header="..."` prop and replace with a custom `#header` template slot containing the drag handle pill (D-03/D-05). Pill renders only when `v-if="isMobile"`.

**Custom header slot to add** (from CONTEXT.md §Specific Ideas):
```html
<template #header>
  <div class="flex flex-col items-center w-full gap-1">
    <div v-if="isMobile" class="w-8 h-1 rounded-full bg-surface-300 dark:bg-surface-600" aria-hidden="true"></div>
    <span class="font-semibold">{{ selectedGroup?.vaccineType ?? '' }}</span>
  </div>
</template>
```

**Existing WallecxToolbar `showToggle` binding — to be modified** (line 344):
```html
:show-toggle="!isLoading && records.length > 0 && displayedGroups.length > 0"
```
**Action per D-11:** append `&& !isMobile`:
```html
:show-toggle="!isLoading && records.length > 0 && displayedGroups.length > 0 && !isMobile"
```

**Existing `<style scoped></style>` block** (line 453) — empty.
**Optional action per claudes-discretion:** add a `:deep(.p-drawer-content)` rule here OR add it to `wallecx-overrides.css` instead (see Shared Patterns below). Recommended: add to `wallecx-overrides.css` for consistency with the existing 80dvh dialog override that targets the same teleported-to-body DOM.

---

### `src/components/projects/wallecx/MembershipsTab.vue` (container component, self-modify)

**Analog:** self (in-place modification) — and cross-reference the existing `<Drawer>` pattern from `VaccinationsTab.vue` lines 409–425 for the new `v-else` branch

**Imports pattern — current** (lines 1–10):
```ts
import { ref, onMounted, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { pb } from '@/lib/pocketbase'
import type { Memberships } from '@/types/wallecx/memberships/types'
import MembershipCard from './MembershipCard.vue'
import MembershipDetail from './MembershipDetail.vue'
import { useConfirm } from 'primevue/useconfirm'   // explicit — NOT auto-resolved by PrimeVueResolver
import ManageMembership from './ManageMembership.vue'
import WallecxToolbar from './WallecxToolbar.vue'
```
**Action:** append `import { useIsMobile } from '@/composables/useIsMobile'` after line 10. Match the file's single-quote / no-semicolon style.

**Insertion point for `isMobile` ref** (after line 19, alongside other refs):
```ts
const isMobile = useIsMobile()
```

**Existing Dialog markup — to be split into v-if / v-else** (lines 253–269):
```html
<Dialog
  v-model:visible="showDetail"
  modal
  header="Membership Card"
  :style="{ width: '40rem' }"
  :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
  @hide="selectedRecord = null; fileToken = ''"
>
  <MembershipDetail
    v-if="selectedRecord"
    :record="selectedRecord"
    :token="fileToken"
    @edit="openEdit(selectedRecord!)"
    @delete="openDelete(selectedRecord!)"
  />
</Dialog>
```

**Action per D-06 / D-07 / D-08:** Wrap with `v-if="!isMobile"` on Dialog, add a sibling `<Drawer v-else position="bottom">` that contains an identical `<MembershipDetail>` and identical `@hide` handler. Pattern shape (from CONTEXT.md §Specific Ideas, expanded with full event/prop wiring):

```html
<!-- Desktop: centered Dialog -->
<Dialog
  v-if="!isMobile"
  v-model:visible="showDetail"
  modal
  header="Membership Card"
  :style="{ width: '40rem' }"
  :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
  @hide="selectedRecord = null; fileToken = ''"
>
  <MembershipDetail
    v-if="selectedRecord"
    :record="selectedRecord"
    :token="fileToken"
    @edit="openEdit(selectedRecord!)"
    @delete="openDelete(selectedRecord!)"
  />
</Dialog>

<!-- Mobile: bottom Drawer -->
<Drawer
  v-else
  v-model:visible="showDetail"
  position="bottom"
  @hide="selectedRecord = null; fileToken = ''"
>
  <template #header>
    <div class="flex flex-col items-center w-full gap-1">
      <div class="w-8 h-1 rounded-full bg-surface-300 dark:bg-surface-600" aria-hidden="true"></div>
      <span class="font-semibold">Membership Card</span>
    </div>
  </template>
  <MembershipDetail
    v-if="selectedRecord"
    :record="selectedRecord"
    :token="fileToken"
    @edit="openEdit(selectedRecord!)"
    @delete="openDelete(selectedRecord!)"
  />
</Drawer>
```

Notes:
- D-08: `@hide` handler is identical on both wrappers — `selectedRecord = null; fileToken = ''`.
- D-08: `openEdit()` flow (closes detail then opens manage dialog) is unchanged — already at MembershipsTab lines 122–126.
- Per CONTEXT.md §Established Patterns, preserve the `v-if="selectedRecord"` guard inside the Drawer too.
- Since `isMobile` is the sole switch, `v-model:visible="showDetail"` resides on both wrappers; only one renders at a time. No double-binding risk.
- D-07: 85dvh cap applies via the shared CSS override (see Shared Patterns).
- Pill on Drawer header has no `v-if` here because the Drawer is already only rendered on mobile (the `v-else` branch). Pill is unconditional in this branch.

**WallecxToolbar in this file** (lines 180–186):
```html
<WallecxToolbar
  v-model:search-query="searchQuery"
  v-model:sort-mode="sortMode"
  :view-mode="'grid'"
  :sort-options="membershipSortOptions"
  :show-toggle="false"
/>
```
**Action:** No change — per D-14 the toolbar in MembershipsTab already passes `:show-toggle="false"`. MOB-09 does not apply here.

---

## Shared Patterns

### CSS override for PrimeVue content area (teleported to body)

**Source:** `src/assets/wallecx-overrides.css` (full file, 19 lines) — imported once at `src/components/projects/wallecx/WallecxApp.vue` line 10
**Apply to:** the new `.p-drawer-content` 85dvh cap (D-01, D-02)

**Current contents** (wallecx-overrides.css, lines 16–19):
```css
.p-dialog-content {
  max-height: 80dvh;
  overflow-y: auto;
}
```

**Excerpt — file header explains why scoped CSS does not work** (wallecx-overrides.css lines 1–15):
```css
/*
 * wallecx-overrides.css
 *
 * MOB-05: PrimeVue Dialog content height constraint for Wallecx dialogs.
 * Imported exclusively from WallecxApp.vue so the rule is bundled with the
 * Wallecx lazy-loaded chunk, keeping it out of the global stylesheet for
 * other routes (LexTrack, Gift Exchange, etc.).
 *
 * A non-scoped approach is required because PrimeVue's <Dialog> teleports
 * its DOM to <body>, so scoped data-v- attributes do not reach the rendered
 * .p-dialog-content element. A dedicated CSS file imported from the Wallecx
 * entry component is the safest scoping strategy available.
 *
 * Covers: ManageVaccination, ManageMembership, VaccinationDetail, MembershipDetail dialogs.
 */
```

**Action:** Append a `.p-drawer-content` rule to the same file (preferred over per-tab `:deep()` in scoped `<style>` because PrimeVue Drawer also teleports to body — same rationale as Dialog). Suggested rule to add:
```css
.p-drawer-content {
  max-height: 85dvh;
  overflow-y: auto;
}
```
Also update the file's header comment to mention "Covers: ... VaccinationGroupPanel Drawer, MembershipDetail Drawer." Note: the cap should only apply when the Drawer is in bottom position. If PrimeVue applies `.p-drawer-content` to right-position drawers too, this rule may unintentionally cap the desktop right-side panel height. **Open question for planner:** decide whether to scope via attribute selector (e.g. `[data-pc-section="content"][data-position="bottom"]` or `.p-drawer-bottom .p-drawer-content`) — recommend `.p-drawer-bottom .p-drawer-content` since PrimeVue Drawer adds a position-based class.

### Reactive mobile detection

**Source:** new `src/composables/useIsMobile.ts`
**Apply to:** `VaccinationsTab.vue`, `MembershipsTab.vue`
**Idiom established by:** `PwaInstallBanner.vue` lines 13–19 (one-shot `window.matchMedia`)

Both consumer files use the same pattern:
```ts
import { useIsMobile } from '@/composables/useIsMobile'
// ...inside <script setup>:
const isMobile = useIsMobile()
```
Then reference `isMobile.value` in `<script>` and bind in templates (`v-if="isMobile"`, `:position="isMobile ? 'bottom' : 'right'"`, `!isMobile` boolean composition for `showToggle`).

### Drag handle pill markup (shared between both Drawer instances)

**Source:** CONTEXT.md §Specific Ideas (no existing analog — new pattern)
**Apply to:** `<template #header>` slot inside both new/modified Drawers

```html
<div class="flex flex-col items-center w-full gap-1">
  <div class="w-8 h-1 rounded-full bg-surface-300 dark:bg-surface-600" aria-hidden="true"></div>
  <span class="font-semibold">{{ titleText }}</span>
</div>
```

In `VaccinationsTab.vue`: the pill is wrapped in `v-if="isMobile"` because the Drawer renders on both desktop and mobile (with reactive `position`). In `MembershipsTab.vue`: pill is unconditional because the Drawer only renders in the `v-else` (mobile) branch.

### Path alias

**Source:** CLAUDE.md §Key Conventions — `@` maps to `src/`
**Apply to:** `useIsMobile` import in both tabs

```ts
import { useIsMobile } from '@/composables/useIsMobile'
```
Matches existing import style in both tabs (e.g. `import { pb } from '@/lib/pocketbase'`, `import type { Memberships } from '@/types/wallecx/memberships/types'`).

## No Analog Found

No files in this phase are without an analog. All three have a clear pattern source.

| File | Why no full analog | Mitigation |
|------|---------------------|------------|
| (none) | — | — |

**Partial-novelty notes (not full "no analog"):**
- Custom `<template #header>` slot on PrimeVue Drawer — no existing usage anywhere in `src/`. CONTEXT.md §Specific Ideas provides the exact markup; PrimeVue documentation is authoritative.
- Reactive `:position` on PrimeVue Drawer — no existing reactive-position usage; D-04 confirms PrimeVue supports it natively with built-in animations.

## Metadata

**Analog search scope:**
- `src/components/projects/wallecx/**/*.vue`
- `src/composables/**` (does not exist)
- `src/lib/**/*.ts`
- `src/assets/**/*.css`

**Files scanned in detail:**
- `src/components/projects/wallecx/VaccinationsTab.vue` (453 lines)
- `src/components/projects/wallecx/MembershipsTab.vue` (280 lines)
- `src/components/projects/wallecx/PwaInstallBanner.vue` (75 lines)
- `src/components/projects/wallecx/WallecxApp.vue` (102 lines)
- `src/assets/wallecx-overrides.css` (19 lines)

**Grep sweeps performed:** `matchMedia`, `p-dialog-content`, `wallecx-overrides`, `#header` slot usage.

**Key absences confirmed:**
- No `src/composables/` directory exists — directory must be created.
- No `#header` slot usage on PrimeVue components anywhere in `src/`.
- No reactive Drawer `:position` usage anywhere — first instance in this phase.
- No existing v-if/v-else Dialog/Drawer split — first instance in this phase.

**Pattern extraction date:** 2026-05-16
