# Phase 3: Write Path - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 03-write-path
**Areas discussed:** Add button placement, Form layout & date input, EXIF strip notification UX, Delete confirmation dialog style

---

## Add Button Placement

| Option | Description | Selected |
|--------|-------------|----------|
| WallecxApp header (top-right) | Sits next to the 'Wallecx' heading — always visible | ✓ |
| Above the DataTable | Dedicated row between heading and table | |
| Empty state only | No button when records exist | |

**User's choice:** WallecxApp header (top-right)
**Notes:** Follow-up — empty state also gets an "Add your first vaccination" CTA for first-time users. Header button handles repeat users; empty state handles first-timers.

---

## Form Layout & Date Input

| Option | Description | Selected |
|--------|-------------|----------|
| Single column (vertical stack) | All fields full-width, one per row — matches LexTrack dialogs | ✓ |
| 2-column grid for short fields | Related short fields side-by-side (date+dose, lot+manufacturer) | |

**User's choice:** Single column (vertical stack)

| Option | Description | Selected |
|--------|-------------|----------|
| PrimeVue DatePicker (calendar popup) | Calendar widget on click — best UX for picking a past date | ✓ |
| InputText type='date' | Native browser date input — simpler but inconsistent cross-browser styling | |

**User's choice:** PrimeVue DatePicker

| Option | Description | Selected |
|--------|-------------|----------|
| Small Textarea (~3 rows) | Compact; user scrolls within textarea for longer notes | ✓ |
| Medium Textarea (~5-6 rows) | More breathing room | |
| Claude's discretion | Implementation agent chooses | |

**User's choice:** Small Textarea (~3 rows)

---

## EXIF Strip Notification UX

| Option | Description | Selected |
|--------|-------------|----------|
| Toast notification (top-right, auto-dismiss) | Brief vue-sonner info toast — unobtrusive | ✓ |
| Inline Message below file picker | PrimeVue Message component — persists until form reset | |
| Only when GPS data was actually found | Conditional display | |

**User's choice:** Toast notification

| Option | Description | Selected |
|--------|-------------|----------|
| Always show for any image upload | Simpler — no GPS inspection needed; users always know privacy is protected | ✓ |
| Only when GPS data was detected | Quieter UX but more complex implementation | |

**User's choice:** Always show for any image upload

---

## Delete Confirmation Dialog Style

| Option | Description | Selected |
|--------|-------------|----------|
| PrimeVue useConfirm() + ConfirmDialog | Lightweight overlay, purpose-built, least code | ✓ |
| Custom second Dialog overlay | Full modal backdrop, more control but more boilerplate | |

**User's choice:** PrimeVue useConfirm() + ConfirmDialog

| Option | Description | Selected |
|--------|-------------|----------|
| Include vaccine name in message | 'Delete "COVID-19 Pfizer"? This cannot be undone.' — safer for multi-record users | ✓ |
| Generic confirmation message | 'Are you sure you want to delete this record?' — simpler | |

**User's choice:** Include vaccine name in message

---

## Claude's Discretion

- Exact dialog width
- Field ordering within the single column
- Whether dose_number uses InputNumber or InputText
- isSaving ref placement within ManageVaccination.vue
- Exact Vitest mock shape for pb in vaccinationMapper.spec.ts

## Deferred Ideas

None — discussion stayed within phase scope.
