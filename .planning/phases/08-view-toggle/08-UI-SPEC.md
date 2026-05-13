---
phase: 8
slug: view-toggle
status: approved
reviewed_at: 2026-05-13
shadcn_initialized: false
preset: none
created: 2026-05-13
baseline: .planning/phases/07-toolbar-search-sort/07-UI-SPEC.md
---

# Phase 8 — UI Design Contract

> Visual and interaction contract for Phase 8: View Toggle.
> All base design tokens, spacing, typography, color, and component conventions are
> inherited unchanged from Phase 7 (`07-UI-SPEC.md`), which itself inherits from the
> Phase 6 baseline. This document specifies the Phase 8 delta only: the cycling view-toggle
> `Button` appended to `WallecxToolbar.vue`, a new `showToggle` prop on the toolbar, the
> new `viewMode` ref + sessionStorage I/O in `WallecxApp.vue`, the reactive grid-wrapper
> class computed, and the new tooltip/aria copy.
>
> Do not re-specify anything described in `07-UI-SPEC.md`. Use that file as the
> authoritative source for spacing scale, typography roles, color tokens, toolbar layout
> rules, and any pattern not modified here. `VaccinationGroupCard.vue` is also untouched
> (VIEW-02).

---

## Design System

Fully inherited from Phase 7 UI-SPEC. No changes.

| Property | Value |
|----------|-------|
| Tool | none (PrimeVue 4 + Tailwind CSS 4) |
| Preset | MyPreset — Aura base, navy primary scale (#002244 at 500), amber highlight (#e89820) — configured in `src/main.ts` |
| Component library | PrimeVue 4 (auto-imported via `PrimeVueResolver`) |
| Icon library | `iconify-icon` web component, `mdi:*` icon set |
| Font | Rubik (Google Fonts) — weights 400, 700 |

**shadcn gate result:** Not applicable. Project uses PrimeVue 4 + Tailwind CSS 4. No `components.json`. Registry safety gate is not required.

**PrimeVue components used in Phase 8 (auto-imported — no manual import):**

| Component | Status |
|-----------|--------|
| `Button` | Already in use from prior phases (header buttons, "Clear search", empty-state CTA) — no new entry |

**No new PrimeVue components, no new npm packages, no new CSS custom properties in Phase 8.** The toggle uses only `Button` + `<iconify-icon>` web component, both already present.

---

## Spacing Scale

Fully inherited from Phase 7 UI-SPEC. Phase 8 adds no new spacing usages — the toggle Button slots into the existing toolbar flex row and consumes the existing `gap-2` (8px) gap between siblings.

| Token | Value | Phase 8 Usage |
|-------|-------|---------------|
| xs | 4px | Not directly used in Phase 8 |
| sm | 8px | Existing `gap-2` between sort `Select` and view-toggle `Button` (inherited toolbar row gap) |
| md | 16px | Unchanged — toolbar row bottom margin (`mb-4`) |
| lg | 24px | Unchanged |
| xl | 32px | Unchanged |
| 2xl | 48px | Unchanged |
| 3xl | 64px | Not used |

**Toolbar row final order (after Phase 8):**
`[IconField (search, flex-1)] [Select (sort, w-36)] [Button (view toggle, fixed icon-only)]`

The `gap-2` between every adjacent pair is unchanged. No new spacing token, no exception.

**Card-area wrapper `gap-4` unchanged in both layouts:** the grid wrapper class swap toggles only the column count, never the gap between cards. List mode keeps `gap-4` (16px) vertical rhythm between full-width cards — identical to grid-mode card spacing.

---

## Typography

Fully inherited from Phase 7 UI-SPEC. No new type roles in Phase 8.

| Role | Size | Weight | Line Height | Token / Class | Phase 8 Usage |
|------|------|--------|-------------|---------------|---------------|
| Body | 14px | 400 (Regular) | 1.5 | `text-sm` | Tooltip text on view-toggle button (PrimeVue default tooltip uses Aura typography) |
| Group card title | 18px | 700 (Bold) | 1.2 | `text-lg font-bold` | Unchanged from Phase 7 |
| Heading | 24px | 700 (Bold) | 1.2 | `text-2xl font-bold` | Unchanged |

**Toggle button has no visible label.** It is icon-only. The accessible name comes from `aria-label`; the visible hover affordance comes from the PrimeVue tooltip (which inherits Aura's body typography — no override).

**Weight constraint preserved:** Two weights only — 400 and 700. No weight 500 or 600 anywhere in Phase 8.

**Delta:** No new type roles. The toggle button itself renders no body text; tooltip text inherits Aura defaults.

---

## Color

Fully inherited from Phase 7 UI-SPEC. No new tokens in Phase 8.

| Role | Value | Token | Phase 8 Usage |
|------|-------|-------|---------------|
| Dominant (60%) | `#f5f7fa` | `--color-surface-page` | Unchanged |
| Secondary (30%) | `#ffffff` | `--color-surface-card` | Unchanged |
| Accent navy | `#002244` | `--color-brand-primary` | Not directly applied to the toggle (Aura `severity="secondary"` controls icon/border color) |
| Accent warm | `#e89820` | `--color-brand-accent` | Reserved — no Phase 8 usages |
| Text heading | `#0d1117` | `--color-typo-heading` | Unchanged |
| Text body | `#3d4a5c` | `--color-typo-body` | Unchanged |
| Text muted | `#6b7280` | `--color-typo-muted` | Unchanged |
| Destructive | `#c0392b` | `--color-status-error` | No new destructive elements in Phase 8 |

**Accent reserved for (Phase 8 additions):**
- None. The toggle button does NOT use the brand accent (navy or amber). It uses PrimeVue Aura's `severity="secondary"` rendering — neutral grey text/outline matching the existing inline "Clear search" button (Phase 7 no-results state) and the existing "Download records" button (Phase 4 header). This keeps visual weight balanced against the adjacent sort `Select` (which is also neutral Aura default) and prevents the toggle from competing with the primary navy "Add vaccination" CTA.

**Dark theme:** PrimeVue Aura's `severity="secondary"` Button automatically adapts to `.my-app-dark` — no manual token binding required. The icon (`<iconify-icon>`) inherits its color from the Button's text color (currentColor by default), so it tracks light/dark automatically.

**Delta:** No new color tokens. No new amber usages. The toggle stays neutral on purpose.

---

## Component Specifications — Phase 8 Delta

### 1. WallecxToolbar.vue — Modifications (additive only)

**File:** `src/components/projects/wallecx/WallecxToolbar.vue`

**Props (extended — adds `viewMode` v-model and `showToggle` boolean):**

```typescript
const props = defineProps<{
  searchQuery: string;
  sortMode: string;
  viewMode: 'grid' | 'list';
  showToggle?: boolean;       // default false — see withDefaults below
}>();

const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'update:sortMode': [value: string];
  'update:viewMode': [value: 'grid' | 'list'];
}>();

// Defaults: showToggle defaults to false so existing consumers (none yet, but
// future) are not forced to wire it. Phase 8's WallecxApp always passes true
// when the card grid is renderable.
const { showToggle = false } = defineProps<...>(); // OR use withDefaults
```

**Implementation note for the planner:** use the standard `withDefaults(defineProps<...>(), { showToggle: false })` pattern so the prop is optional and defaults to `false` when omitted. The above is shown twice for clarity — pick one form, not both.

**Template (append the view-toggle button after the sort Select):**

```html
<template>
  <div class="flex items-center gap-2 mb-4">
    <!-- Search input (unchanged from Phase 7) -->
    <IconField class="flex-1">
      <InputIcon class="pi pi-search" />
      <InputText
        :value="searchQuery"
        placeholder="Search by name or type…"
        class="w-full"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />
      <InputIcon
        v-if="searchQuery"
        class="pi pi-times cursor-pointer"
        @click="emit('update:searchQuery', '')"
      />
    </IconField>

    <!-- Sort select (unchanged from Phase 7) -->
    <Select
      :model-value="sortMode"
      :options="sortOptions"
      option-label="label"
      option-value="value"
      class="w-36"
      @update:model-value="emit('update:sortMode', $event)"
    />

    <!-- View toggle button (Phase 8, D-01, D-02, D-03) -->
    <Button
      v-if="showToggle"
      severity="secondary"
      size="small"
      :aria-label="viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'"
      :title="viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'"
      @click="emit('update:viewMode', viewMode === 'grid' ? 'list' : 'grid')"
    >
      <iconify-icon
        :icon="viewMode === 'grid' ? 'mdi:view-list' : 'mdi:view-grid'"
        width="20"
        height="20"
        aria-hidden="true"
      ></iconify-icon>
    </Button>
  </div>
</template>
```

**Width rule:** The toggle Button is **icon-only** with no explicit width class. PrimeVue Aura at `size="small"` renders an icon-only Button at roughly 2rem (~32px) square — narrow enough to sit cleanly next to the `w-36` (144px) sort Select without dominating the row. Do NOT add `class="w-10"` or similar; let PrimeVue's intrinsic icon-button sizing apply. The aspect ratio stays roughly square so the toggle never looks like a misaligned chip.

**Why an `<iconify-icon>` child instead of the `icon="pi pi-..."` prop:** the rest of Wallecx empty-state icons use Iconify `mdi:*` for visual family consistency (`mdi:needle-off`, `mdi:magnify-remove-outline`). Using PrimeIcons `pi pi-th-large` / `pi pi-list` here would introduce a second icon system mid-component for no UX gain. Iconify is auto-recognized as a custom element via `vite.config.ts` (`isCustomElement: (tag) => tag === "iconify-icon"`) — no extra wiring.

**Icon size 20:** matches the visual weight of the `pi pi-search` and `pi pi-times` InputIcons in the same toolbar row (PrimeIcons render at ~1rem / 16px internally; Iconify at width/height="20" with the small button padding looks proportional). Do not change to 24 — that overpowers the row.

**Icon semantics (destination, not current state):**
- When `viewMode === 'grid'` → display `mdi:view-list` (icon = "switch to list")
- When `viewMode === 'list'` → display `mdi:view-grid` (icon = "switch to grid")

The icon always represents the *target* of the next click — matches the "cycle to next mode" mental model in D-01.

**aria-label and title text are kept in sync with the icon.** The `title` attribute is the native browser tooltip (cross-platform, zero deps). Do not introduce PrimeVue `v-tooltip` directive — adds a directive registration step for no functional gain over `title`.

**`aria-hidden="true"` on the inner `<iconify-icon>`:** the Button's `aria-label` already describes the action; the icon is decorative for screen readers. Prevents double-announcement.

---

### 2. WallecxApp.vue — Modifications

#### 2a. New ref + sessionStorage I/O

Add immediately after the existing `searchQuery` and `sortMode` refs in the `// --- STATE ---` block:

```typescript
const VIEW_MODE_STORAGE_KEY = 'wallecx:view-mode';

const viewMode = ref<'grid' | 'list'>('grid');
```

Initial read (in `onMounted`, BEFORE the `await pb.collection(...).getFullList()` call so the first render after data load uses the correct layout):

```typescript
onMounted(async () => {
  // Phase 8: restore viewMode from sessionStorage before any render that depends on it
  try {
    const stored = sessionStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === 'grid' || stored === 'list') {
      viewMode.value = stored;
    }
    // Any other value (null, 'foo', JSON garbage) — keep default 'grid'
  } catch {
    // sessionStorage may throw in privacy-mode iframes; fall back to default silently
  }

  isLoading.value = true;
  try {
    records.value = await pb
      .collection('wallecx_vaccinations')
      .getFullList<Vaccinations>({ sort: '-date_administered' });
    // ... existing listToken refresh logic unchanged
  } catch (e: unknown) {
    // ... existing error toast unchanged
  } finally {
    isLoading.value = false;
  }
});
```

Persist on change via a watcher (added in the same script block, after the `displayedGroups` computed and before `onMounted`):

```typescript
watch(viewMode, (next) => {
  try {
    sessionStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
  } catch {
    // sessionStorage write failures are non-fatal — user just won't have persistence this session
  }
});
```

Add `watch` to the existing `import { ref, onMounted, onUnmounted, computed } from "vue";` line:

```typescript
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
```

#### 2b. New computed: `gridClass`

Add immediately after the `displayedGroups` computed:

```typescript
const gridClass = computed(() =>
  viewMode.value === 'list'
    ? 'grid grid-cols-1 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-4',
);
```

#### 2c. Template changes

**Update the WallecxToolbar invocation** — add `v-model:view-mode` and `:show-toggle`:

```html
<WallecxToolbar
  v-model:search-query="searchQuery"
  v-model:sort-mode="sortMode"
  v-model:view-mode="viewMode"
  :show-toggle="!isLoading && records.length > 0 && displayedGroups.length > 0"
/>
```

**Replace the literal grid wrapper class on the data-state branch** — only the final `v-else` (grouped card grid) changes. The loading skeleton stays fixed (D-04):

```html
<!-- Loading skeleton — unchanged; stays at sm:grid-cols-2 regardless of viewMode (D-04) -->
<div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Card v-for="i in 3" :key="i">
    <template #content>
      <Skeleton height="6rem" />
    </template>
  </Card>
</div>

<!-- Zero-records empty state — unchanged -->
<div v-else-if="records.length === 0" class="flex flex-col items-center py-12 gap-3">
  <!-- ... unchanged ... -->
</div>

<!-- No-results empty state — unchanged -->
<div v-else-if="displayedGroups.length === 0 && searchQuery" class="flex flex-col items-center py-12 gap-3">
  <!-- ... unchanged ... -->
</div>

<!-- Grouped card grid: Phase 8 swaps literal class for :class="gridClass" -->
<div v-else :class="gridClass">
  <VaccinationGroupCard
    v-for="group in displayedGroups"
    :key="group.vaccineType"
    :vaccine-type="group.vaccineType"
    :records="group.records"
    :latest-record="group.latestRecord"
    :list-token="listToken"
    @click="openGroupPanel(group)"
  />
</div>
```

**`showToggle` condition derivation (D-03):**
- `!isLoading` — toggle hidden during skeleton (no cards to lay out)
- `records.length > 0` — toggle hidden during zero-records empty state (no cards to lay out)
- `displayedGroups.length > 0` — toggle hidden during no-results empty state (no cards to lay out)

All three must be true simultaneously for the toggle to render. Search input and sort `Select` remain visible at all times — the toolbar itself is always mounted; only the toggle child is conditionally rendered.

---

### 3. VaccinationGroupCard.vue — Unchanged

Zero modifications. Locked by VIEW-02.

### 4. VaccinationGroupPanel.vue — Unchanged

Zero modifications.

### 5. VaccinationDetail.vue — Unchanged

Zero modifications.

### 6. ManageVaccination.vue — Unchanged

Zero modifications.

---

## Interaction States

### View Toggle Button States

| State | Condition | Rendering |
|-------|-----------|-----------|
| Hidden — loading | `isLoading === true` | Button is not in the DOM (`v-if="showToggle"` evaluates false). Search and sort remain visible above the skeleton. |
| Hidden — zero records | `!isLoading && records.length === 0` | Button is not in the DOM. Zero-records empty state shows the "Add your first vaccination" CTA instead. |
| Hidden — no search results | `!isLoading && records.length > 0 && displayedGroups.length === 0 && searchQuery` | Button is not in the DOM. No-results empty state shows the "Clear search" CTA instead. |
| Visible — grid mode | `showToggle === true && viewMode === 'grid'` | Button renders with `mdi:view-list` icon, `aria-label="Switch to list view"`, `title="Switch to list view"`. Click → `viewMode` becomes `'list'`. |
| Visible — list mode | `showToggle === true && viewMode === 'list'` | Button renders with `mdi:view-grid` icon, `aria-label="Switch to grid view"`, `title="Switch to grid view"`. Click → `viewMode` becomes `'grid'`. |

### Hover / Focus / Active

PrimeVue Aura `severity="secondary"` Button at `size="small"` provides hover (slight background tint), focus (visible ring around the button — Aura default focus style preserved), and active (darker background) states out of the box. Do NOT override with custom CSS. These states work in both light theme and `.my-app-dark` theme automatically.

**Focus ring visibility:** Aura's focus ring uses a 2px outline at the brand color scale's 500 level (navy). It is clearly visible against both the toolbar's white card surface and the dark-mode surface. No additional work required.

### Transition Behavior

| Aspect | Behavior |
|--------|----------|
| Icon swap on click | Instant. The `:icon` binding flips synchronously with the `viewMode` change. No cross-fade, no slide. Vue's normal reactivity is sufficient and clearer for a binary toggle. |
| Card grid relayout on click | Instant. Tailwind class swap takes effect on the next render tick. No `<TransitionGroup>`, no FLIP animation. Deferred as a polish-phase concern in 08-CONTEXT.md. |
| Button hover/focus/active | PrimeVue Aura default micro-transitions (~150ms ease) — no overrides. |

**Rationale for instant swap:** the dataset is small (typically < 50 group cards), the transition would be visual noise rather than insight, and no animation requirement was elevated in 08-CONTEXT.md. Instant swap also avoids any layout-shift CLS regression.

### Persistence Behavior

| Event | Action |
|-------|--------|
| User clicks toggle | `viewMode.value` flips; `watch(viewMode)` writes the new value to `sessionStorage.setItem('wallecx:view-mode', next)`. |
| Page reload / in-tab navigation to another route and back | `onMounted` reads `sessionStorage.getItem('wallecx:view-mode')`; if the value is `'grid'` or `'list'`, applies it; otherwise defaults to `'grid'`. |
| New tab / new window / browser restart | sessionStorage is per-tab, so the key is absent → `viewMode` defaults to `'grid'`. SC #3 satisfied. |
| Invalid stored value (e.g. `'foo'`, `null`, JSON garbage) | Falls back to `'grid'`. Validated via the `stored === 'grid' \|\| stored === 'list'` guard. |
| sessionStorage throws (privacy-mode iframe, quota error) | Caught; `viewMode` stays at default `'grid'`. No toast, no console error — a non-persistent session is acceptable degradation. |

### Toolbar Visibility Composition (with Phase 7 states)

| Wallecx state | Search visible | Sort visible | Toggle visible |
|---------------|----------------|--------------|----------------|
| Loading skeleton | Yes | Yes | **No** |
| Zero records (fresh account) | Yes | Yes | **No** |
| No search results | Yes | Yes | **No** |
| Normal grid/list (any sort, any query that matches) | Yes | Yes | **Yes** |

This matrix is the canonical reference for the planner. The toolbar `<div>` is never wrapped in a `v-if`; only its children are.

---

## Copywriting Contract

All Phase 7 copywriting inherited unchanged. Phase 8 adds:

| Element | Copy | Notes |
|---------|------|-------|
| Toggle aria-label (grid mode) | `Switch to list view` | Describes the *action*, not the current state; toggles in sync with the icon. Used for both `aria-label` and `title`. |
| Toggle aria-label (list mode) | `Switch to grid view` | Same convention — describes the destination. |
| Toggle visible label | _(none — icon-only)_ | No text content inside the Button. Accessible name comes from `aria-label`. |
| Toggle tooltip (grid mode) | `Switch to list view` | Native HTML `title` attribute; identical string to `aria-label` to avoid translation drift. |
| Toggle tooltip (list mode) | `Switch to grid view` | Identical to `aria-label`. |

**Verb-first action labels:** "Switch to {destination} view" matches the destructive-vs-action style guide implicitly used by Phase 7 ("Clear search", not "Reset"). Switch is the verb; "list view" / "grid view" is the noun object. No translation, no synonym (do not substitute "Show as list" or "View as list").

**No new empty-state copy in Phase 8.** Phase 7's "No groups match …" and Phase 6's "No vaccination records yet." cover all empty states in which the toggle is hidden. Phase 8 introduces no new empty-state strings.

**No new destructive actions in Phase 8.** Toggling view is a pure presentation change — no records modified, no async, no confirmation required.

**No new toast strings in Phase 8.** Persistence is silent (sessionStorage failure is non-fatal and not announced).

**Storage key string:** `wallecx:view-mode` — exact value, lowercase, colon-separated, kebab-case after the colon. Mirrors the convention "namespace prefix + colon + concept" used by `wallecx_vaccinations` collection naming style. Storage values are exactly `'grid'` or `'list'` (no whitespace, no casing variants).

---

## Registry Safety

No new npm packages installed in Phase 8. The only new UI primitive introduced is the cycling `Button` — already in `node_modules/primevue/button/` from prior phases and used elsewhere in `WallecxApp.vue`. The `<iconify-icon>` web component is already registered in `vite.config.ts` and used by existing empty states.

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | None | Not applicable — project uses PrimeVue, not shadcn |
| Third-party registries | None | Not applicable |
| npm packages (new) | None | No installs |
| Icon set additions | `mdi:view-grid`, `mdi:view-list` | Iconify icon strings — resolved at runtime by `iconify-icon` web component; no install, no bundled SVG. Same mechanism as `mdi:needle-off` and `mdi:magnify-remove-outline` from Phase 6/7. |

**Explicit confirmation:**
- `node_modules/primevue/button/index.d.ts` — confirmed present (already used in `WallecxApp.vue` and `WallecxToolbar.vue`)
- `iconify-icon` web component — confirmed registered via `vite.config.ts` (`isCustomElement: (tag) => tag === "iconify-icon"`)
- `mdi:view-grid` and `mdi:view-list` — standard Material Design Icons names available in the iconify-icon runtime fetch, same registry as the already-shipped Wallecx icons

Registry vetting gate is not required.

---

## Constraint Checklist — Phase 8

All Phase 7 constraints carry forward unchanged. Phase 8 adds:

| Constraint | Rule | Verifiable By |
|------------|------|---------------|
| No `v-html` | No new mustache or HTML interpolation in Phase 8 | `git grep "v-html" src/components/projects/wallecx` returns zero hits |
| No new PocketBase queries | viewMode + gridClass are pure local state; sessionStorage is the only side effect | Code review — no `pb.collection(...).get*` calls in the new code |
| No new CSS custom properties | The toggle uses PrimeVue Aura defaults only — no `var(--color-...)` added | `git diff` shows no new `var(--color` references in Phase 8 changes |
| No new npm packages | `Button` and `iconify-icon` are pre-existing | `npm ls primevue` — no new entry; `package.json` unchanged |
| Auto-import only | `Button` must NOT be manually imported in `WallecxToolbar.vue` — PrimeVueResolver handles it | Code review — no `import Button from 'primevue/button'` added |
| Icon family consistency | View-toggle icons use Iconify `mdi:*` to match existing Wallecx icon family | Code review — `mdi:view-grid` / `mdi:view-list` only; no `pi pi-th-large` / `pi pi-list` |
| Icon semantic = destination | When `viewMode === 'grid'`, icon shown is `mdi:view-list`; vice versa | Code review of the `:icon` ternary |
| aria-label semantic = action | aria-label says "Switch to {destination} view" — describes the click result, not the current mode | Code review of the `:aria-label` ternary |
| aria-label and title synced | Both bindings use the identical ternary expression | Code review |
| Inner icon `aria-hidden="true"` | Screen readers announce the Button via aria-label only, not the decorative icon | Code review |
| No PrimeVue `v-tooltip` directive | Tooltip is the native HTML `title` attribute — no directive registration | Code review |
| No `w-10` / fixed width on toggle | Button renders at PrimeVue Aura's intrinsic icon-only size; no manual width class | Code review of the toggle Button template |
| `severity="secondary"` (not primary) | Toggle does NOT use the brand navy fill — stays neutral against the sort Select | Code review |
| `size="small"` to match neighbors | Toggle size matches the inline "Clear search" and "Add vaccination" small Buttons | Code review |
| Toggle hidden in 3 states | `:show-toggle="!isLoading && records.length > 0 && displayedGroups.length > 0"` | Code review of the WallecxToolbar invocation |
| Loading skeleton stays `sm:grid-cols-2` | Skeleton wrapper class is the literal `grid grid-cols-1 sm:grid-cols-2 gap-4` — NOT `:class="gridClass"` (D-04) | Code review of the `v-if="isLoading"` block |
| Only the data-state grid wrapper uses `:class="gridClass"` | `v-else` final branch is the ONLY place the dynamic class binds | Code review |
| sessionStorage key is literal `wallecx:view-mode` | The key is declared as a module-scope `const VIEW_MODE_STORAGE_KEY = 'wallecx:view-mode'`; both reads and writes reference the constant | Code review — no inline string literals for the key |
| Stored value validated on read | Read path checks `stored === 'grid' \|\| stored === 'list'` before assignment | Code review of `onMounted` |
| sessionStorage I/O wrapped in try/catch | Both read and write are inside try/catch with silent fallback (privacy-mode iframes throw) | Code review |
| No localStorage usage | sessionStorage ONLY — `localStorage.setItem` / `localStorage.getItem` must not appear | `git grep "localStorage" src/components/projects/wallecx` returns zero hits |
| List mode = literal VIEW-02 swap | gridClass returns `'grid grid-cols-1 gap-4'` exactly — no `max-w-*`, no `mx-auto`, no `lg:grid-cols-*` (D-05) | Code review of the `gridClass` computed |
| No modifications to VaccinationGroupCard / Panel / Detail / Manage / mapper / types | Phase 8 scope is limited to `WallecxToolbar.vue` and `WallecxApp.vue` only | `git diff HEAD` against those six files returns empty |
| No `<TransitionGroup>` / FLIP / cross-fade | Toggle is instant; deferred animation per 08-CONTEXT.md deferred list | Code review |
| No keyboard shortcut handler | Click-only for v1 — no global `keydown` listener added | Code review |
| `watch(viewMode)` runs after default-init | Watcher is declared at module setup time but fires only on subsequent changes (Vue's default `immediate: false` — do NOT pass `immediate: true`) | Code review |
| Read on mount happens BEFORE the initial render that depends on viewMode | sessionStorage read is synchronous and inside `onMounted` ahead of the async `getFullList` await; the synchronous portion runs before the first reactive flush | Code review |

---

## Pre-Population Sources

| Field | Source | Notes |
|-------|--------|-------|
| Design system | 07-UI-SPEC.md | Inherited unchanged |
| Spacing scale | 07-UI-SPEC.md | Inherited; Phase 8 adds no new usage (toggle slots into existing `gap-2`) |
| Typography roles | 07-UI-SPEC.md | Inherited; toggle has no visible label, tooltip uses Aura default body type |
| Color tokens | 07-UI-SPEC.md + `src/assets/base.css` | Inherited; toggle stays neutral via `severity="secondary"` |
| D-01 (single cycling Button, icon = destination) | 08-CONTEXT.md — Decisions | Locked |
| D-02 (toggle position: right of sort Select) | 08-CONTEXT.md — Decisions | Locked |
| D-03 (hide toggle in loading + 2 empty states; search + sort always visible) | 08-CONTEXT.md — Decisions | Locked; encoded as `:show-toggle="!isLoading && records.length > 0 && displayedGroups.length > 0"` |
| D-04 (loading skeleton stays `grid-cols-1 sm:grid-cols-2 gap-4`) | 08-CONTEXT.md — Decisions | Locked; skeleton does NOT use `gridClass` |
| D-05 (list mode = literal `grid-cols-1 gap-4` swap, no max-width, no centering) | 08-CONTEXT.md — Decisions | Locked; `gridClass` computed encodes the exact swap |
| D-06 (sessionStorage, NOT localStorage) | 08-CONTEXT.md — Decisions | Locked; SC #3 fresh-session-reset enforced |
| D-07 (storage key `wallecx:view-mode`, value enum `'grid' \| 'list'`) | 08-CONTEXT.md — Decisions | Locked; declared as module-scope const |
| Icon choice (`mdi:view-grid`, `mdi:view-list`) | 08-CONTEXT.md — Claude's Discretion suggestions | Confirmed during this UI-SPEC research — matches existing `mdi:*` family in Wallecx empty states |
| Button visual treatment (`severity="secondary"`, `size="small"`, icon-only, no explicit width) | 08-CONTEXT.md — Claude's Discretion + 07-UI-SPEC.md "Clear search" precedent | Mirrors the existing inline "Clear search" treatment for visual consistency |
| aria-label + title text ("Switch to {destination} view") | 08-CONTEXT.md — Specifics | Locked verbatim |
| `aria-hidden="true"` on inner icon | Accessibility best practice (Button has aria-label) | New in Phase 8 — prevents double-announcement |
| Native `title` attribute over `v-tooltip` directive | Zero deps, cross-platform, sufficient for icon-only Buttons | New in Phase 8 — chosen during this research pass |
| Instant transitions (no `<TransitionGroup>`, no cross-fade) | 08-CONTEXT.md — Deferred Ideas (animation explicitly out of scope) | Locked |
| sessionStorage read order (before async data fetch) | 08-CONTEXT.md — Claude's Discretion | Synchronous read in `onMounted` before the `await getFullList` |
| `watch(viewMode)` write side, no `immediate: true` | 08-CONTEXT.md — Claude's Discretion | Avoids re-writing the default on mount |
| User input | None | All design contract questions answered by upstream artifacts; zero re-asked |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending — awaiting `gsd-ui-checker` validation

---

*Phase: 08-view-toggle*
*UI-SPEC created: 2026-05-13*
*Baseline: Phase 7 UI-SPEC (07-UI-SPEC.md) — all base tokens, toolbar layout, and patterns inherited*
*Next: gsd-ui-checker validates this contract; gsd-planner consumes it for task breakdown*
