# Phase 2: Read Path - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 02-read-path
**Areas discussed:** Detail view navigation, List row design, Empty & loading states

---

## Detail View Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Dialog/Modal | PrimeVue Dialog over the list. List stays mounted. Matches LexTrack ManageTask pattern. No routing changes. | ✓ |
| Slide-in Drawer/Panel | PrimeVue Drawer from the right. Smooth UX but more layout work. | |
| In-page view swap | WallecxApp.vue swaps `<VaccinationList>` ↔ `<VaccinationDetail>` via v-if. Back button returns to list. | |

**User's choice:** Dialog/Modal
**Notes:** Matches existing LexTrack dialog pattern.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Static read-only, no actions | Phase 2 shows fields + preview only. Edit/Delete added in Phase 3. | ✓ |
| Placeholder buttons (disabled) | Show Edit/Delete disabled now; Phase 3 enables them. | |
| You decide | Claude picks. | |

**User's choice:** Static read-only, no actions
**Notes:** Phase 2 is strictly read-only; no write actions until Phase 3.

---

## List Row Design

| Option | Description | Selected |
|--------|-------------|----------|
| PrimeVue DataTable | Columns: thumbnail, vaccine name, date, dose. Auto-handles sorting and responsive collapse. | ✓ |
| Hand-crafted card rows | Styled div or PrimeVue Card per row. More control, closer to ActivityCard.vue style. | |
| You decide | Claude picks based on codebase patterns. | |

**User's choice:** PrimeVue DataTable
**Notes:** PrimeVue-first approach; DataTable handles sorting naturally.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder icon | Neutral mdi icon in thumbnail cell for records without attachment. Layout stays consistent. | ✓ |
| Empty / blank cell | No icon, just empty. Inconsistent row heights. | |
| Hide thumbnail column | Column appears/disappears dynamically based on whether any records have attachments. | |

**User's choice:** Placeholder icon
**Notes:** Keeps column layout consistent regardless of attachment presence.

---

## Empty & Loading States

| Option | Description | Selected |
|--------|-------------|----------|
| PrimeVue Skeleton rows | 3–4 skeleton placeholder rows during fetch. No layout shift. | ✓ |
| Spinner / ProgressSpinner | Centered spinner replaces table. Simpler but causes layout jump. | |
| Simple text | "Loading..." text only. Minimal, doesn't match visual weight of the table. | |

**User's choice:** PrimeVue Skeleton rows
**Notes:** Prevents layout shift; matches expected data-table experience.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Icon + message, no CTA | Centered icon + "No vaccination records yet." No Add button (Phase 2 is read-only). | ✓ |
| Plain text only | Just "No vaccination records yet." Minimal. | |
| Icon + message + disabled Add button | Previews Phase 3 UI with a disabled button now. More complex. | |

**User's choice:** Icon + message, no CTA
**Notes:** Phase 2 is read-only; CTA will be added naturally in Phase 3.

---

## Claude's Discretion

- Exact thumbnail dimensions in the list column
- Number of skeleton rows during loading
- DataTable column widths and responsive behavior
- Exact mdi icon for no-attachment placeholder
- Whether to show a DataTable header/caption

## Deferred Ideas

None — discussion stayed within phase scope.
