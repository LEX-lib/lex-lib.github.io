# Phase 16: Membership Card Toolbar - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 16-membership-card-toolbar
**Areas discussed:** WallecxToolbar adaptation, Default sort mode, Toolbar layout

---

## WallecxToolbar Adaptation

### Q1: How to adapt WallecxToolbar for memberships?

| Option | Description | Selected |
|--------|-------------|----------|
| Make sortOptions a prop | Add sortOptions as a required prop. Each tab passes its own options array. Single component, clean API, no duplication. | ✓ |
| Separate MembershipToolbar.vue | New component with membership sort options baked in. Zero risk to vaccinations toolbar but duplicates template + emit logic. | |
| Conditional logic in WallecxToolbar | Add 'context' prop and switch sort options based on it. Single file but grows more complex. | |

**User's choice:** Make sortOptions a prop (Recommended)
**Notes:** WallecxToolbar becomes fully generic.

### Q2: Migrate VaccinationsTab too, or keep hardcoded defaults?

| Option | Description | Selected |
|--------|-------------|----------|
| Migrate VaccinationsTab too | Move hardcoded vaccination sortOptions out of WallecxToolbar into VaccinationsTab. Both tabs own their options. Clean, consistent. | ✓ |
| Keep vaccination options hardcoded as default | Add sortOptions prop with current vaccination options as default value. Lower blast radius. | |

**User's choice:** Migrate VaccinationsTab too (Recommended)
**Notes:** Both tabs migrate in the same pass. WallecxToolbar ends up with no tab-specific knowledge.

---

## Default Sort Mode

### Q1: Default sort mode for Memberships tab?

| Option | Description | Selected |
|--------|-------------|----------|
| Recently Added | Matches PocketBase load order (sort: '-created'). No visual re-ordering surprise on first load. | ✓ |
| Name A–Z | Alphabetical by card name. Changes visual order vs current grid. | |

**User's choice:** Recently Added (Recommended)

### Q2: SessionStorage key?

| Option | Description | Selected |
|--------|-------------|----------|
| wallecx:memberships-sort-mode | Mirrors vaccinations view-mode key pattern. Namespaced and unambiguous. | ✓ |
| wallecx:sort-mode-memberships | Alternative naming convention. Same namespace, different word order. | |

**User's choice:** wallecx:memberships-sort-mode (Recommended)

---

## Toolbar Layout

### Q1: Toolbar position relative to Add card button?

| Option | Description | Selected |
|--------|-------------|----------|
| Match VaccinationsTab: header row then toolbar row | Header row (Add card) at top; toolbar is its own row below. Consistent layout between both tabs. | ✓ |
| Single combined row: Add card + search + sort | Collapse into one flex row. More compact but search input loses full width. Diverges from vaccinations layout. | |

**User's choice:** Match VaccinationsTab: header row then toolbar row (Recommended)

### Q2: Toolbar visibility during loading?

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible | Matches VaccinationsTab behaviour — WallecxToolbar rendered unconditionally. | ✓ |
| Only when records are loaded | Hide during loading and empty state. Avoids non-functional search during load but causes layout shift. | |

**User's choice:** Always visible (Recommended)

---

## Claude's Discretion

- Exact spacing between header row and toolbar row (follow existing VaccinationsTab mb-4 pattern)
- Sort stability for ties (localeCompare is stable enough for personal-scale data)

## Deferred Ideas

None mentioned.
