# Phase 7: Toolbar — Search & Sort - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 07-toolbar-search-sort
**Areas discussed:** Toolbar component structure, Sort control UI, "No results" empty state, Search input UX details

---

## Toolbar Component Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Extract WallecxToolbar.vue now | New component takes search query and sort mode as v-model props. Phase 8 adds view toggle inside same file — cleaner handoff. | ✓ |
| Inline in WallecxApp.vue | Consistent with existing header row pattern. Phase 8 can extract then if needed. |  |

**User's choice:** Extract `WallecxToolbar.vue` now.
**Notes:** Phase 8 (view toggle) will add the toggle button inside this same component — making the extraction worth it for Phase 7.

---

## Sort Control UI

| Option | Description | Selected |
|--------|-------------|----------|
| Select (dropdown) | Compact. Opens a list showing all 4 options. Works on any screen width. | ✓ |
| SelectButton (segmented) | Shows all 4 as visible chips in one row. 4 long labels may wrap on narrow screens. |  |

**User's choice:** PrimeVue `Select` (dropdown).
**Notes:** Mobile safety was the deciding factor — 4 text labels in a segmented button would be tight.

---

## "No Results" Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| "No groups match '[query]'" (dynamic) | Echoes the search query. Different icon from needle-off. | ✓ |
| "No results found" (static) | Shorter, doesn't repeat query. |  |

**User's choice:** Dynamic text echoing the query.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — "Clear search" button | One-click reset. Secondary button, size small. | ✓ |
| No — static text only | User clears via input. |  |

**User's choice:** Include "Clear search" secondary button in the empty state.
**Notes:** Combined with the inline × button on the input, users have two ways to clear.

---

## Search Input UX Details

| Option | Description | Selected |
|--------|-------------|----------|
| Inline × clear button | Shown inside input when text is present. PrimeVue IconField/InputIcon or absolute-positioned. | ✓ |
| Plain InputText | User selects-all and deletes. |  |

**User's choice:** Inline × clear button.

| Option | Description | Selected |
|--------|-------------|----------|
| Icon only (pi pi-search via InputIcon) | Space-efficient in toolbar row. Standard search UX. | ✓ |
| Text label + input | Clearer but uses more horizontal space. |  |

**User's choice:** Icon-only — `pi pi-search` via `InputIcon` on the left.

---

## Claude's Discretion

- Instant search (no debounce) — small personal dataset.
- `displayedGroups` computed wrapping existing `groupedVaccinations` (filter + sort + Uncategorized re-pin).
- Icon for "no results" state (suggested: `mdi:magnify-remove-outline`).
- Toolbar flex layout and spacing.
- Search placeholder text.

## Deferred Ideas

None mentioned during discussion.
