# Phase 8: View Toggle - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 08-view-toggle
**Areas discussed:** Toggle control UI, Toggle position in toolbar, Empty/loading state behavior, List-view layout polish

---

## Toggle control UI

**Question:** What control should the user click to toggle grid ↔ list view?

| Option | Description | Selected |
|--------|-------------|----------|
| SelectButton (segmented, 2 icons) | PrimeVue SelectButton with grid + list icons, active mode visually highlighted. Most discoverable. Pairs with the Select dropdown for sort. | |
| Single icon Button that cycles | One PrimeVue Button. Icon flips to show the *other* mode. Compact, one click. Less discoverable — user must infer behavior. | ✓ |
| ToggleButton (on/off switch) | PrimeVue ToggleButton with on/off labels. Reads as "list mode on/off" — less symmetrical. | |

**User's choice:** Single icon Button that cycles.
**Notes:** Compactness preferred over discoverability — the toolbar is short on horizontal space alongside the search input and sort Select. Icon flips to show the *destination* mode (in grid mode → list icon = "switch to list").

---

## Toggle position in toolbar

**Question:** Where should the toggle button sit inside WallecxToolbar?

| Option | Description | Selected |
|--------|-------------|----------|
| Right of the sort Select | Order: [Search][Sort][Toggle]. Groups sort + view as control-style elements; search dominant on the left. | ✓ |
| Far right with a small gap separator | Same order but with extra gap or divider between sort and toggle. | |
| Between search and sort | Order: [Search][Toggle][Sort]. Mixes data and layout controls. | |

**User's choice:** Right of the sort Select.
**Notes:** No divider — clean flex row, gap-2 throughout.

---

## Empty/loading state behavior

**Question:** When should the toggle be visible, and should the loading skeleton respect it?

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible; skeleton respects toggle | Toggle renders in all states; skeleton flips to single-column in list mode. Most consistent. | |
| Always visible; skeleton stays 2-col | Toggle always visible; skeleton fixed at 2-col regardless of toggle. Tiny visual jump from skeleton→cards on toggle. | |
| Hide toggle when no cards to lay out | Toggle hides in loading, zero-records, and no-results states. Search/sort still show. | ✓ |

**User's choice:** Hide toggle when no cards to lay out.
**Notes:** Search and sort remain visible in all states (Phase 7 convention preserved). Loading skeleton stays fixed at 2-col since the toggle isn't visible during loading either way.

---

## List-view layout polish

**Question:** In list mode (single column), how should the card width behave on wide screens?

| Option | Description | Selected |
|--------|-------------|----------|
| Full-width, same gap (gap-4) | Just swap grid-cols-1 sm:grid-cols-2 → grid-cols-1. Honors VIEW-02 literally. | ✓ |
| Cap with max-width (max-w-3xl mx-auto) | Wrap the list-mode grid in a max-width container. Slightly past VIEW-02's wording. | |
| Tighter vertical gap in list (gap-2) | Full-width but denser. Visual nod to "compact list" framing. | |

**User's choice:** Full-width, same gap (gap-4).
**Notes:** Strictest literal interpretation of VIEW-02 ("only the grid layout class changes") — no wrapper edits, no gap edits, no new max-width container.

---

## Claude's Discretion

- Storage key naming (`wallecx:view-mode`) and value enum (`'grid' | 'list'`)
- Specific icon library and icon names (suggested Iconify `mdi:view-grid` / `mdi:view-list` to match existing empty-state icons)
- Button visual treatment (`severity`, `size`, `text` variant)
- `aria-label` text and tooltip
- `WallecxToolbar` prop API (`v-model:view-mode` + `show-toggle` boolean prop)
- Order of operations on mount (read sessionStorage before render)

## Deferred Ideas

- localStorage / cross-tab persistence (ruled out by SC #3)
- Density toggle inside list mode
- Animated transition between grid and list
- Keyboard shortcut for toggling view
