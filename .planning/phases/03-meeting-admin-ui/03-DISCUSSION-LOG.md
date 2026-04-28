# Phase 3: Meeting & Admin UI - Discussion Log

> **Audit trail only.** Decisions are in CONTEXT.md.

**Date:** 2026-04-28
**Phase:** 03-meeting-admin-ui
**Areas discussed:** Duration toggle UX, Admin link affordance, Inline-add defaults, Dialog visual style

---

## Gray Area Selection

| Option | Selected |
|---|---|
| Duration toggle UX | ✓ |
| Admin link affordance (+ label rename) | ✓ |
| Inline-add defaults | ✓ |
| Dialog visual style | ✓ |

**User picked all 4.**

---

## Duration Toggle UX

### Q1: What kind of UI for the min/hr unit toggle?

| Option | Selected |
|---|---|
| PrimeVue SelectButton | ✓ |
| InputGroup with addon dropdown | |
| Unit suffix toggle in addon | |

**User's choice:** PrimeVue SelectButton (segmented control)

### Q2: Where does the toggle sit relative to the number input?

| Option | Selected |
|---|---|
| Right of input, same row | ✓ |
| Below input as a label | |
| Inside InputGroup | |

**User's choice:** Right of input, same row

### Q3: How should existing meetings display the unit when shown back in the dialog?

| Option | Selected |
|---|---|
| Toggle reflects stored unit | ✓ |
| Always show in minutes | |
| Smart-display | |

**User's choice:** Toggle reflects stored unit (faithful round-trip)

### Q4: Allow decimals when unit is hours?

| Option | Selected |
|---|---|
| Yes, decimals when hr | ✓ |
| Whole numbers only | |

**User's choice:** Yes, decimals when hr

---

## Admin Link Affordance

### Q1: How should a saved admin link surface in `ActivityCard`?

| Option | Selected |
|---|---|
| Small clickable link icon | ✓ |
| Title becomes a link | |
| Badge / chip below title | |

**User's choice:** Small clickable link icon

### Q2: Apply the same icon affordance to existing `jira_link` on tasks?

| Option | Selected |
|---|---|
| Yes, same pattern | ✓ |
| No, admin only | |

**User's choice:** Yes, same pattern (one-shot fix for tasks too)

### Q3: How far should the 'Admin Tasks and Support' → 'Admin' rename propagate?

| Option | Selected |
|---|---|
| Just the section label | ✓ |
| Full rename: section + dialog + placeholders + filenames | |
| Section + dialog + placeholders (no file rename) | |

**User's choice:** Just the section label (minimal blast radius)

### Q4: What kind of input for the admin link in `ManageSupport.vue`?

| Option | Selected |
|---|---|
| Plain InputText with type='url' | ✓ |
| InputGroup with link icon prefix | |
| InputText + 'open in new tab' button | |

**User's choice:** Plain InputText with type='url'

---

## Inline-Add Defaults & Dialog Visual Style

### Q1: When user adds a meeting via Enter, what should `duration_unit` default to?

| Option | Selected |
|---|---|
| Default 'minutes' in the form | ✓ |
| Omit; rely on mapper default | |

**User's choice:** Default 'minutes' in the form

### Q2: Acknowledge Phase 3 = forms only, persistence is Phase 4?

| Option | Selected |
|---|---|
| Yes, Phase 3 = forms only | ✓ |
| Pull UI-SAVE-* into Phase 3 | |

**User's choice:** Yes, Phase 3 = forms only

### Q3: ManageMeeting / ManageSupport dark Tailwind overrides — what to do?

| Option | Selected |
|---|---|
| Strip dark overrides | ✓ |
| Preserve as-is | |
| Full restyle to match Aura indigo | |

**User's choice:** Strip dark overrides

### Q4: PrimeVue Editor `:pt` dark override — touch?

| Option | Selected |
|---|---|
| Yes, remove the dark editor :pt override | ✓ |
| Keep editor dark | |

**User's choice:** Yes, remove

---

## Claude's Discretion

- D-24: Component ordering in ManageMeeting (Title → Duration row → Description → Save)
- D-25: Component ordering in ManageSupport (Title → Link → Description → Save)
- D-26: Inline-add row stays minimal (no toggle inline; dialog-only)
- D-27: No type changes in Phase 3

## Deferred Ideas

- Per-item dialog Save persistence (Phase 4)
- Initial-load / delete-to-PB / error toasts (Phase 4)
- Smart-display unit auto-pick
- Client-side URL validation
- Renaming `ManageSupport.vue` → `ManageAdmin.vue`
- Toggle animations
- Pre-existing lint errors in `vite.config.ts` / `site.js`
- Aggressive component restyle
