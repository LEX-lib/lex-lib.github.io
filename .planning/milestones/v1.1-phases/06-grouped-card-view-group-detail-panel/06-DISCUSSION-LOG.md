# Phase 6: Grouped Card View & Group Detail Panel - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 06-grouped-card-view-group-detail-panel
**Areas discussed:** Panel implementation, Card grid layout, Group card ordering + Uncategorized placement

---

## Panel implementation

| Option | Description | Selected |
|--------|-------------|----------|
| PrimeVue Drawer | Slides in from the right — stays on screen alongside the group cards. No existing pattern in Wallecx but standard PrimeVue component for this use case. | ✓ |
| Dialog (modal) | Opens centered over the page, same approach as VaccinationDetail. Reuses existing Dialog + VaccinationDetail nesting pattern. But blocks the group card view while open. | |
| Inline accordion expand | Clicking a card expands it in place to show the record list below. No JS overlay — purely layout. Card grid shifts/reflows when a group expands. | |

**User's choice:** PrimeVue Drawer
**Notes:** None

---

## Drawer flow (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Keep Drawer open behind the dialog | Drawer stays visible in the background. User closes the Dialog and is back in the group panel right away. Natural drilldown feel — Dialog sits on top of Drawer. | ✓ |
| Close Drawer when dialog opens | Clean slate for the detail view. User has to reopen the Drawer to go back to the group. Simpler state management. | |

**User's choice:** Keep Drawer open behind the dialog
**Notes:** None

---

## Card grid layout

| Option | Description | Selected |
|--------|-------------|----------|
| Responsive grid — 2 cols on desktop, 1 col on mobile | Two columns on wider screens, stacks to single column on small screens. Uses Tailwind grid-cols-2 / sm:grid-cols-1. | ✓ |
| 3-col grid on desktop | More compact — shows more groups at a glance. Works well if many vaccine types, but cards get narrow. | |
| Single column list | Full-width cards stacked vertically — simpler, most readable if cards have a lot of info. | |

**User's choice:** Responsive grid — 2 cols on desktop, 1 col on mobile
**Notes:** None

---

## Card content prominence

| Option | Description | Selected |
|--------|-------------|----------|
| Vaccine type name (large) + badge with record count | Type name is the primary identifier — bold/large. Small badge shows '3 records'. Last date and thumbnail are secondary info below. | ✓ |
| Thumbnail (large) + type name below | Photo-first layout — visually rich if card scans are present, but looks sparse for groups without an attached card image. | |
| Type name + last administered date as equal headings | Balanced two-column header. Good for time-sensitive vaccines where the date matters as much as the name. | |

**User's choice:** Vaccine type name (large) + badge with record count
**Notes:** None

---

## Group card ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Alphabetical by vaccine type name | Predictable and scannable — easy to find 'COVID-19' or 'Flu'. Simple JS sort. | ✓ |
| Most recent dose first | Surfaces the vaccine you got most recently at the top. Sort by latest date_administered in each group. | |
| Highest record count first | Vaccine types with the most doses appear first. Useful for multi-dose series. Less intuitive for casual browsing. | |

**User's choice:** Alphabetical by vaccine type name
**Notes:** None

---

## Uncategorized placement

| Option | Description | Selected |
|--------|-------------|----------|
| Always last | Named groups appear alphabetically, then 'Uncategorized' at the end. Keeps primary content up front. | ✓ |
| Alphabetically with the rest | 'Uncategorized' sorts as a letter — ends up near the end anyway. No special-case logic needed. | |
| Always first | Keeps existing records (with empty vaccine_type) immediately visible. Gets in the way once user has typed vaccine types. | |

**User's choice:** Always last
**Notes:** None

---

## Claude's Discretion

- Where grouping computation lives (WallecxApp.vue computed vs. composable)
- Whether VaccinationList.vue is repurposed for the Drawer list or a new component is created
- Whether VaccinationGroupCard.vue is its own component or rendered inline in WallecxApp.vue
- Drawer width and responsive breakpoints for the Drawer

## Deferred Ideas

None
