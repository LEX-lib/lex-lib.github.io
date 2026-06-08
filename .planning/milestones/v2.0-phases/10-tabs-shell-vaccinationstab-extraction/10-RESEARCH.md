# Phase 10: Tabs Shell — VaccinationsTab Extraction — Research

**Researched:** 2026-05-13
**Domain:** Vue 3 component extraction / PrimeVue 4 Tabs / state isolation
**Confidence:** HIGH

---

## Summary

Phase 10 is a pure refactor: the goal is to split `WallecxApp.vue` into a thin PrimeVue 4 Tabs shell and a self-contained `VaccinationsTab.vue`, with `MembershipsTab.vue` as a no-logic stub. No new npm dependencies, no backend changes, no new PocketBase queries.

The extraction boundary is unambiguous because WallecxApp.vue has a single `<Card><template #content>` block. Everything inside that block — except the `<h1>` heading — moves verbatim into `VaccinationsTab.vue`. The heading is repositioned above `<TabList>` in WallecxApp.vue to identify the whole mini-app, not a single tab.

The one non-obvious rule is `useConfirm` / `<ConfirmDialog>` placement: the composable requires exactly one `<ConfirmDialog>` instance at the app layer. That instance must stay in WallecxApp.vue; VaccinationsTab.vue calls `useConfirm()` and the service resolves to the parent's dialog. This is the single biggest extraction pitfall.

**Primary recommendation:** Move the entire `<Card><template #content>` body (minus heading) into VaccinationsTab.vue in one atomic edit. Do not rewrite or restructure — copy verbatim to guarantee zero regression. Then strip WallecxApp.vue down to the shell definition shown in the UI-SPEC.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| XTAB-01 | Vaccination logic extracted into `VaccinationsTab.vue`; `WallecxApp.vue` becomes a `<Tabs>` shell with "Vaccinations" and "Membership Cards" tabs — both tabs visible and navigable | Full extraction checklist below; PrimeVue Tabs availability confirmed |
| XTAB-02 | All existing vaccination features (group card view, search/sort, view toggle, edit/delete in drawer) work identically after the extraction — no regression | Component inventory documents every ref/computed/handler/watcher that must move; `useConfirm` scope pitfall documented |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tab navigation shell | Frontend (WallecxApp.vue) | — | Owns `activeTab` ref and the outer `<Tabs>` layout; this is page-level shell state |
| Vaccination CRUD state | Frontend (VaccinationsTab.vue) | — | All refs, computed, handlers, lifecycle hooks move here; isolated from memberships |
| Delete confirmation dialog | Frontend (WallecxApp.vue) | — | `<ConfirmDialog>` must live at the same layer as `ConfirmationService` registration — which is `app.use(ConfirmationService)` in main.ts |
| Membership stub display | Frontend (MembershipsTab.vue) | — | Purely presentational; no data layer interaction in Phase 10 |

---

## Standard Stack

### Core (all already installed — no new npm installs in Phase 10)

| Library | Version (installed) | Purpose | Source |
|---------|---------------------|---------|--------|
| primevue | ^4.3.7 | Tabs, TabList, Tab, TabPanels, TabPanel components | [VERIFIED: package.json] |
| @primeuix/themes | ^1.2.3 | Aura preset (navy/amber brand ramp) | [VERIFIED: package.json] |
| unplugin-vue-components | ^29.0.0 | PrimeVueResolver auto-imports all PrimeVue components | [VERIFIED: package.json + vite.config.ts] |
| @primevue/auto-import-resolver | ^4.3.7 | Resolves PrimeVue components by tag name | [VERIFIED: package.json + vite.config.ts] |
| vue | ^3.5.18 | Composition API (`ref`, `computed`, `watch`, `onMounted`, `onUnmounted`) | [VERIFIED: package.json] |

### PrimeVue Tabs Component Availability

All five Tabs components are present in `node_modules/primevue/`:

| Component | Directory | Auto-resolved |
|-----------|-----------|---------------|
| `<Tabs>` | `primevue/tabs` | Yes — PrimeVueResolver |
| `<TabList>` | `primevue/tablist` | Yes |
| `<Tab>` | `primevue/tab` | Yes |
| `<TabPanels>` | `primevue/tabpanels` | Yes |
| `<TabPanel>` | `primevue/tabpanel` | Yes |

[VERIFIED: `ls node_modules/primevue/` — directories `tabs`, `tablist`, `tab`, `tabpanels`, `tabpanel` all present]

**No explicit `import` statements required** — PrimeVueResolver handles auto-import at build time. Same pattern as `<Card>`, `<Dialog>`, `<Drawer>` already in WallecxApp.vue.

Note: `components.d.ts` does not yet list Tabs/TabList/Tab/TabPanels/TabPanel — this is expected. `unplugin-vue-components` adds entries to this file the first time the component is encountered in a template. The file will be updated automatically on the next `npm run dev` or `npm run build`.

**`<TabView>` is the legacy PrimeVue 3 API — do not use it.** LexTrackApp.vue uses `<TabView>` (predates PrimeVue 4). WallecxApp.vue must use the PrimeVue 4 `<Tabs>` API. [ASSUMED — based on PrimeVue 4 changelog knowledge; confirmed by UI-SPEC.md locked decision]

---

## WallecxApp.vue Extraction Inventory

Complete inventory of everything in the current WallecxApp.vue that must be classified as MOVE or STAY.

### Script — Imports

| Import | MOVE to VaccinationsTab | STAY in WallecxApp | Notes |
|--------|------------------------|--------------------|-------|
| `ref, onMounted, onUnmounted, computed, watch` from `vue` | Yes | Partial | WallecxApp.vue only needs `ref` (for `activeTab`) |
| `dayjs` from `dayjs` | Yes | No | Used in `onCreated`, `onUpdated`, `exportJson` |
| `toast` from `vue-sonner` | Yes | No | Used in all error handlers |
| `useConfirm` from `primevue/useconfirm` | Yes | No | VaccinationsTab calls the service; ConfirmDialog stays in WallecxApp |
| `pb` from `@/lib/pocketbase` | Yes | No | All PocketBase calls are in VaccinationsTab |
| `type Vaccinations` from `@/types/wallecx/vaccinations/types` | Yes | No | |
| `ManageVaccination` from `./ManageVaccination.vue` | Yes | No | Explicit import; auto-import does not resolve local `.vue` files |
| `VaccinationGroupCard` from `./VaccinationGroupCard.vue` | Yes | No | Explicit import |
| `VaccinationGroupPanel` from `./VaccinationGroupPanel.vue` | Yes | No | Explicit import |
| `WallecxToolbar` from `./WallecxToolbar.vue` | Yes | No | Explicit import |
| `VaccinationsTab` (new) | — | Yes (import) | WallecxApp imports and renders VaccinationsTab |
| `MembershipsTab` (new) | — | Yes (import) | WallecxApp imports and renders MembershipsTab |

[VERIFIED: WallecxApp.vue script block read in full]

### Script — Constants

| Constant | MOVE | STAY | Notes |
|----------|------|------|-------|
| `VIEW_MODE_STORAGE_KEY = 'wallecx:view-mode'` | Yes | No | Used in onMounted + viewMode watcher |
| `LIST_TOKEN_TTL_MS = 4 * 60 * 1000` | Yes | No | Used in listTokenTimer interval |
| `let listTokenTimer` | Yes | No | Interval handle — cleared in onUnmounted |

### Script — Refs (STATE section)

| Ref | MOVE | STAY | Notes |
|-----|------|------|-------|
| `records` | Yes | No | Core vaccination data array |
| `isLoading` | Yes | No | Loading skeleton gate |
| `selectedRecord` | Yes | No | For VaccinationDetail dialog |
| `showDetail` | Yes | No | VaccinationDetail dialog visibility |
| `fileToken` | Yes | No | Short-lived file access token |
| `listToken` | Yes | No | List-time file token (refreshed every 4 min) |
| `showManage` | Yes | No | ManageVaccination dialog visibility |
| `manageRecord` | Yes | No | Record passed to ManageVaccination |
| `confirm` (useConfirm return) | Yes | No | VaccinationsTab calls confirm.require(); ConfirmDialog instance stays in WallecxApp |
| `isExporting` | Yes | No | Export guard |
| `showGroupPanel` | Yes | No | Drawer visibility |
| `selectedGroup` | Yes | No | Active drawer group |
| `searchQuery` | Yes | No | Toolbar search binding |
| `sortMode` | Yes | No | Toolbar sort binding |
| `viewMode` | Yes | No | Grid/list toggle |
| `activeTab` (new) | No | Yes | Only ref that lives in WallecxApp.vue shell; `ref<string>('vaccinations')` |

### Script — Interface and Computed

| Item | MOVE | STAY | Notes |
|------|------|------|-------|
| `interface VaccineGroup` | Yes | No | Used by groupedVaccinations, displayedGroups, selectedGroup |
| `groupedVaccinations` computed | Yes | No | Groups records by vaccine_type |
| `displayedGroups` computed | Yes | No | Applies filter + sort to groupedVaccinations |
| `gridClass` computed | Yes | No | grid/list CSS class switch |

### Script — Lifecycle and Watchers

| Item | MOVE | STAY | Notes |
|------|------|------|-------|
| `onMounted` (fetch + sessionStorage restore + listTokenTimer start) | Yes | No | Entire body moves |
| `onUnmounted` (clearInterval listTokenTimer) | Yes | No | **Critical: must not be lost** — timer leak if omitted |
| `watch(viewMode, ...)` (sessionStorage persist) | Yes | No | |

### Script — Handler Functions

| Function | MOVE | STAY | Notes |
|----------|------|------|-------|
| `openDetail(record)` | Yes | No | Gets fileToken, sets selectedRecord, opens showDetail |
| `openManage(record)` | Yes | No | Opens ManageVaccination |
| `openGroupPanel(group)` | Yes | No | Opens Drawer |
| `exportJson()` | Yes | No | JSON export flow |
| `onCreated(created)` | Yes | No | Appends + re-sorts records |
| `onUpdated(updatedRecord)` | Yes | No | Patches records + syncs open drawer |
| `openDelete(record)` | Yes | No | Calls confirm.require() |
| `deleteRecord(record)` | Yes | No | Server-first delete + drawer sync |

### Template — Blocks

| Block | MOVE | STAY | Notes |
|-------|------|------|-------|
| `<Card>` wrapper | — | Yes | Stays; VaccinationsTab content goes inside TabPanel |
| `<h1>Wallecx</h1>` heading | No | Yes | Moves above `<TabList>` per UI-SPEC |
| Header action row (Download + Add buttons) | Yes | No | Inside VaccinationsTab content |
| `<WallecxToolbar>` | Yes | No | |
| Loading skeleton grid | Yes | No | |
| Zero-records empty state | Yes | No | |
| No-search-results empty state | Yes | No | |
| Grouped card grid (`<VaccinationGroupCard>`) | Yes | No | |
| `<Drawer>` + `<VaccinationGroupPanel>` | Yes | No | |
| `<ConfirmDialog />` | No | Yes | **Stays in WallecxApp.vue — app-level singleton** |
| `<ManageVaccination>` dialog | Yes | No | |
| `<Dialog>` + `<VaccinationDetail>` | Yes | No | |

[VERIFIED: WallecxApp.vue template read in full]

---

## Architecture Patterns

### System Architecture Diagram

```
Route /projects/wallecx
        |
        v
WallecxApp.vue (thin shell)
  |- <Card>
       |- <h1>Wallecx</h1>              [stays]
       |- <Tabs v-model:value="activeTab">
            |- <TabList>
            |    |- <Tab value="vaccinations">
            |    |- <Tab value="memberships">
            |- <TabPanels>
            |    |- <TabPanel value="vaccinations">
            |    |    └── <VaccinationsTab />   ──> owns all vaccination state
            |    |                                  (records, handlers, dialogs,
            |    |                                   token timers, drawer, toolbar)
            |    |- <TabPanel value="memberships">
            |         └── <MembershipsTab />    ──> stub only (no state, no PB calls)
            |- <ConfirmDialog />                [stays at app level]
```

Data flow for delete action (crosses component boundary via `useConfirm` service):
```
VaccinationsTab.openDelete()
  -> confirm.require(...)           [calls ConfirmationService]
  -> ConfirmDialog in WallecxApp    [service resolves to this instance]
  -> accept() callback fires
  -> VaccinationsTab.deleteRecord() [stays inside VaccinationsTab]
```

### Recommended File Structure After Phase 10

```
src/components/projects/wallecx/
├── WallecxApp.vue           # MODIFIED — thin Tabs shell only
├── VaccinationsTab.vue      # NEW — all vaccination logic extracted here
├── MembershipsTab.vue       # NEW — stub (no script logic)
├── AttachmentPreview.vue    # unchanged
├── ManageVaccination.vue    # unchanged
├── VaccinationDetail.vue    # unchanged
├── VaccinationGroupCard.vue # unchanged
├── VaccinationGroupPanel.vue# unchanged
├── VaccinationList.vue      # unchanged (not currently used by WallecxApp)
└── WallecxToolbar.vue       # unchanged
```

No new directories. No router changes. No store changes.

### Pattern: PrimeVue 4 Tabs with String Values

```typescript
// In WallecxApp.vue — the ONLY new state
const activeTab = ref<string>('vaccinations');
```

```html
<!-- WallecxApp.vue template -->
<Tabs v-model:value="activeTab">
  <TabList>
    <Tab value="vaccinations">
      <iconify-icon icon="mdi:needle" width="16" height="16" aria-hidden="true"></iconify-icon>
      Vaccinations
    </Tab>
    <Tab value="memberships">
      <iconify-icon icon="mdi:card-account-details-outline" width="16" height="16" aria-hidden="true"></iconify-icon>
      Membership Cards
    </Tab>
  </TabList>
  <TabPanels>
    <TabPanel value="vaccinations">
      <VaccinationsTab />
    </TabPanel>
    <TabPanel value="memberships">
      <MembershipsTab />
    </TabPanel>
  </TabPanels>
</Tabs>
```

[CITED: 10-UI-SPEC.md — Component Structure Contract]

### Pattern: VaccinationsTab.vue — Component Boundary

VaccinationsTab.vue has **no props and no emits**. It is fully self-contained — its internal dialogs and drawer are local to the component. The only cross-component concern is `useConfirm`, which resolves via the service bus to the `<ConfirmDialog>` in WallecxApp.vue without any prop/emit wiring.

```typescript
// VaccinationsTab.vue — top of <script setup lang="ts">
// No defineProps, no defineEmits
// All existing imports from WallecxApp.vue move here verbatim
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

### Anti-Patterns to Avoid

- **Do not add props/emits to VaccinationsTab.vue for this phase.** The vaccination state surface is fully self-contained. Prop-drilling records or handlers would add unnecessary coupling before Phase 13 establishes the membership state pattern.
- **Do not move `<ConfirmDialog>` into VaccinationsTab.vue.** PrimeVue's `useConfirm` service is bound to a single `<ConfirmDialog>` instance per app layer. Duplicating the dialog in VaccinationsTab.vue would create a second service bus listener — the first (real) one in WallecxApp.vue would still fire its accept callback, but the dialog UI might not render correctly in nested context.
- **Do not use numeric tab values.** `<Tab value="0">` is the legacy TabView pattern. PrimeVue 4 Tabs use string values. [CITED: 10-UI-SPEC.md]
- **Do not restructure the template during extraction.** Copy verbatim. Any layout changes during extraction make the diff unreadable and risk accidental breakage.
- **Do not remove `VaccinationList.vue` imports.** That component exists in the folder but is not currently imported by WallecxApp.vue — leave it untouched.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab navigation | Custom tab click handlers + v-show | PrimeVue `<Tabs>` + `<TabPanel>` | Handles keyboard navigation, ARIA, lazy mounting out of the box |
| Delete confirmation dialog | Custom confirm modal | PrimeVue `useConfirm` + `<ConfirmDialog>` — already wired | Already battle-tested in the app since Phase 3 |
| Token refresh timer | New abstraction | Existing `listTokenTimer` + `setInterval` — copy verbatim | The pattern is already correct (WR-01 fix from Phase 4) |

---

## Common Pitfalls

### Pitfall 1: Losing `onUnmounted` — Token Timer Leak

**What goes wrong:** The `listTokenTimer` interval starts in `onMounted`. If `onUnmounted(() => clearInterval(listTokenTimer))` is not included in VaccinationsTab.vue, the timer continues running after the user navigates away from the Vaccinations tab (or the whole Wallecx route), firing PocketBase token requests indefinitely.

**Why it happens:** Easy to forget when copying state — `onMounted` is obvious but `onUnmounted` is small (4 lines) and sits at the end of the script block.

**How to avoid:** Copy the entire LOGIC section of WallecxApp.vue verbatim without editing, then verify the `onUnmounted` is present before committing.

**Warning signs:** Browser console shows `WallecxApp: listToken refresh failed` errors after navigating away from Wallecx.

### Pitfall 2: `<ConfirmDialog>` in VaccinationsTab Instead of WallecxApp

**What goes wrong:** Moving `<ConfirmDialog>` into VaccinationsTab.vue means the `useConfirm` service in VaccinationsTab and the `<ConfirmDialog>` instance are at the same component level — this works in isolation but creates a subtle issue: `ConfirmationService` is registered globally in `app.use(ConfirmationService)` (confirmed in main.ts), and the `<ConfirmDialog>` that handles the event should live at a higher DOM level to avoid z-index / portal issues. The Phase 3 decision (ACCUMULATED CONTEXT) explicitly states: "ConfirmDialog must stay at WallecxApp.vue level."

**How to avoid:** `<ConfirmDialog />` stays in WallecxApp.vue template. VaccinationsTab.vue calls `useConfirm()` and `confirm.require(...)` — that's all it needs to do.

[VERIFIED: STATE.md — "Decisions from 03-04 Execution: useConfirm must be explicitly imported — not auto-resolved by PrimeVueResolver. ConfirmDialog component tag IS auto-resolved."]

### Pitfall 3: Forgetting to Import `useConfirm` Explicitly in VaccinationsTab

**What goes wrong:** PrimeVueResolver auto-imports component tags (`<ConfirmDialog>`, `<Button>`, etc.) but does NOT auto-import composables. `useConfirm` must be explicitly imported: `import { useConfirm } from "primevue/useconfirm"`.

**Why it happens:** Developer assumes everything from primevue is auto-resolved.

**How to avoid:** The import is already present in WallecxApp.vue — copy it verbatim into VaccinationsTab.vue. [VERIFIED: WallecxApp.vue line 5]

### Pitfall 4: `VaccinationDetail` Not Explicitly Imported in VaccinationsTab

**What goes wrong:** `VaccinationDetail` is currently used in WallecxApp.vue's template but is NOT explicitly imported in the script block — it's resolved via `components.d.ts` / PrimeVueResolver scanning local `.vue` files. However, local `.vue` components (not primevue) are auto-resolved by `unplugin-vue-components` scanning the `src/` directory — so VaccinationsTab.vue will also auto-resolve it, as will `AttachmentPreview`.

**Verdict:** No action needed. But the planner should know this is implicit behavior.

[VERIFIED: WallecxApp.vue script has no `import VaccinationDetail` or `import AttachmentPreview` statements; components.d.ts shows both are listed as GlobalComponents from `unplugin-vue-components`]

### Pitfall 5: Tab Value Type Mismatch

**What goes wrong:** Using numeric values like `<Tab value="0">` or `v-model:value` initialized to `0` (number) instead of `'vaccinations'` (string). PrimeVue 4 Tabs compare values by reference; a `ref<number>(0)` won't match `value="vaccinations"`.

**How to avoid:** `const activeTab = ref<string>('vaccinations')` — string, not number.

### Pitfall 6: WallecxApp.vue Retains Stale Imports After Extraction

**What goes wrong:** After moving all vaccination state out, WallecxApp.vue still has `import { ref, onMounted, ... } from 'vue'` and `import dayjs from 'dayjs'` etc. TypeScript / ESLint will warn about unused imports; in strict mode the build may fail.

**How to avoid:** After extraction, reduce WallecxApp.vue imports to only: `import { ref } from "vue"` (for `activeTab`), plus `import VaccinationsTab from './VaccinationsTab.vue'` and `import MembershipsTab from './MembershipsTab.vue'`. Remove all other imports.

---

## Code Examples

### WallecxApp.vue — Complete After Extraction

```typescript
// <script setup lang="ts">
import { ref } from "vue";
import VaccinationsTab from "./VaccinationsTab.vue";
import MembershipsTab from "./MembershipsTab.vue";

const activeTab = ref<string>("vaccinations");
// </script>
```

```html
<!-- <template> -->
<Card>
  <template #content>
    <h1 class="text-2xl font-bold mb-4" style="color: var(--color-typo-heading)">Wallecx</h1>
    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="vaccinations">
          <iconify-icon icon="mdi:needle" width="16" height="16" aria-hidden="true"></iconify-icon>
          Vaccinations
        </Tab>
        <Tab value="memberships">
          <iconify-icon icon="mdi:card-account-details-outline" width="16" height="16" aria-hidden="true"></iconify-icon>
          Membership Cards
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="vaccinations">
          <VaccinationsTab />
        </TabPanel>
        <TabPanel value="memberships">
          <MembershipsTab />
        </TabPanel>
      </TabPanels>
    </Tabs>
    <ConfirmDialog />
  </template>
</Card>
<!-- </template> -->
```

[CITED: 10-UI-SPEC.md — Component Structure Contract]

### MembershipsTab.vue — Complete Stub

```html
<!-- MembershipsTab.vue — no <script setup> needed -->
<template>
  <div class="flex flex-col items-center py-12 gap-3">
    <iconify-icon
      icon="mdi:card-account-details-outline"
      width="48"
      height="48"
      style="color: var(--color-brand-primary)"
      aria-hidden="true"
    ></iconify-icon>
    <p class="text-base font-semibold" style="color: var(--color-typo-heading)">
      Membership Cards
    </p>
    <p class="text-sm text-center max-w-xs" style="color: var(--color-typo-muted)">
      Save your loyalty, insurance, and ID cards here. Coming in the next release.
    </p>
  </div>
</template>
```

[CITED: 10-UI-SPEC.md — MembershipsTab.vue Stub Contract]

---

## Project Constraints (from CLAUDE.md)

| Directive | Applies to Phase 10 |
|-----------|---------------------|
| Vue 3 Composition API `<script setup lang="ts">` throughout | Yes — all new .vue files use this |
| PrimeVue 4 auto-imported via PrimeVueResolver | Yes — Tabs components auto-resolved, no explicit imports |
| Tailwind CSS 4 utility-first, `my-app-dark` dark support | Yes — copy existing classes verbatim; no new color decisions |
| Path alias `@` maps to `src/` | Yes — used in VaccinationsTab.vue imports |
| `vue-sonner` for toasts | Yes — toast calls move to VaccinationsTab |
| No new npm dependencies in Phase 10 | Confirmed — UI-SPEC Registry Safety section |
| PocketBase client from `@/lib/pocketbase` | Yes — pb moves to VaccinationsTab |

---

## Environment Availability

Step 2.6: SKIPPED — Phase 10 has no external dependencies. It is a pure code refactor: component extraction and file creation. No CLI tools, services, runtimes, or databases beyond the project's existing setup are required.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PrimeVue 3 `<TabView>` / `<TabPanel>` (LexTrackApp.vue) | PrimeVue 4 `<Tabs>` / `<TabList>` / `<Tab>` / `<TabPanels>` / `<TabPanel>` | PrimeVue 4.x | Must use new API; numeric values replaced by string values; `<TabView>` still exists in package but is legacy |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `<TabView>` is the legacy PrimeVue 3 API and should not be used in PrimeVue 4 projects | Standard Stack | If PrimeVue 4 still recommends TabView for some cases, the Tabs API would still work but there might be a simpler path — LOW risk since UI-SPEC is explicit |

**All other claims were verified directly against the codebase or package files in this session.**

---

## Open Questions

1. **Tab panel `pt-6` padding**
   - What we know: UI-SPEC specifies `pt-6` (24px) on the TabPanel content before the vaccination content.
   - What's unclear: Whether to apply `pt-6` as a class inside `<TabPanel>` or use PrimeVue's `pt` (passthrough) prop on `<TabPanel>`.
   - Recommendation: Wrap VaccinationsTab content in a `<div class="pt-6">` inside `<TabPanel>` — simpler than using `pt` passthrough, consistent with existing Tailwind-first pattern in the codebase.

2. **`<style scoped></style>` in VaccinationsTab.vue and MembershipsTab.vue**
   - What we know: WallecxApp.vue has an empty `<style scoped></style>` block.
   - Recommendation: Include the empty block for consistency (linter may require it, and it signals intentional no-local-styles).

---

## Sources

### Primary (HIGH confidence)
- `src/components/projects/wallecx/WallecxApp.vue` — read in full; extraction inventory derived directly
- `package.json` — verified all installed dependencies and versions
- `vite.config.ts` — verified PrimeVueResolver and Components plugin registration
- `components.d.ts` — verified which PrimeVue components are already auto-resolved
- `src/main.ts` — verified ConfirmationService registration and PrimeVue config
- `src/router/index.ts` — verified no child routes on `/projects/wallecx`
- `.planning/phases/10-tabs-shell-vaccinationstab-extraction/10-UI-SPEC.md` — primary design contract
- `.planning/STATE.md` — locked decisions (tabs API, useConfirm, ConfirmDialog placement)
- `node_modules/primevue/` — verified `tabs`, `tablist`, `tab`, `tabpanels`, `tabpanel` directories present

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — XTAB-01/02 requirement text
- `.planning/ROADMAP.md` — phase goal and success criteria

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against package.json and node_modules
- Architecture: HIGH — extraction boundary derived directly from reading WallecxApp.vue
- Pitfalls: HIGH — ConfirmDialog placement verified against STATE.md accumulated context; timer leak identified from reading onMounted/onUnmounted directly

**Research date:** 2026-05-13
**Valid until:** 2026-06-12 (stable extraction; no moving parts)
