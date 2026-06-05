# Phase 34: Layout Audit & Touch Targets - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 34-layout-audit-touch-targets
**Areas discussed:** Sticky header behavior, Touch-target sweep strategy, Drag-handle rollout, Safe-area coverage scope

---

## Sticky header behavior

| Option | Description | Selected |
|--------|-------------|----------|
| TabList + toolbar stacked | Both tab switcher and per-tab filter/sort toolbar pinned; toolbar reachable mid-scroll; ~2 rows vertical cost | ✓ |
| TabList only | Only tab switcher pins; toolbar scrolls away; maximizes list space | |
| Toolbar only | Toolbar pins, TabList scrolls; loses quick tab-switching | |

**User's choice:** TabList + toolbar stacked (recommended)
**Notes:** Toolbar is the primary interaction surface; reachability mid-scroll outweighs vertical cost. Stacked sticky applies on `isMobile` only.

---

## Touch-target sweep strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid | Global floor in wallecx-overrides.css for PrimeVue elements + per-component min-h-[44px] for custom elements | ✓ |
| Global rule only | One sweeping rule; most DRY, risks inflating compact inline elements | |
| Per-component only | Add min-h only to audited gaps; explicit, largest diff | |

**User's choice:** Hybrid (recommended)
**Notes:** Global rule must scope to genuinely-tappable controls, not all elements. Phase 15 per-component targets retained.

---

## Drag-handle rollout

| Option | Description | Selected |
|--------|-------------|----------|
| Shared component, visual-only | Extract Phase-17 pill into reusable DragHandle; decorative only; swipe-to-dismiss deferred | ✓ |
| Replicate inline markup | Copy pill markup into each Drawer header (~6 duplications) | |
| Shared component + swipe-to-dismiss | Adds gesture/dirty-state complexity overlapping Phase 35 | |

**User's choice:** Shared component, visual-only (recommended)
**Notes:** Swipe-down-to-dismiss explicitly out of scope (deferred to Phase 35 dirty-state-guard work). Handle renders on mobile only.

---

## Safe-area coverage scope

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky chrome + bottom sheets + scan overlay | TabList top inset + bottom-drawer bottom inset + fullscreen barcode scan overlay; defer dialog action-bar insets to 35 | ✓ |
| New sticky chrome + bottom sheets only | Sticky TabList top + bottom drawers only; defer scan overlay + dialogs | |
| Comprehensive (everything now) | Wire env() into every overlay incl. dialog action bars; overlaps Phase 35 | |

**User's choice:** Sticky chrome + bottom sheets + scan overlay (recommended)
**Notes:** Fullscreen scan overlay flagged as notch-collision risk for flagship counter-scan feature. Dialog sticky-action-bar insets deferred to Phase 35.

---

## Claude's Discretion

- Global touch-target CSS selectors/specificity (must reach teleported PrimeVue DOM).
- Sticky positioning mechanism + z-index layering for stacked TabList + toolbar.
- DragHandle component location/name and prop surface.
- Optional border/shadow separating sticky toolbar from scrolling content.

## Deferred Ideas

- Swipe-down-to-dismiss gesture on bottom sheets (Phase 35).
- Dialog sticky-action-bar bottom safe-area insets (Phase 35).
- iPad-768 tablet-specific Drawer-vs-Dialog layout (Phase 35).
