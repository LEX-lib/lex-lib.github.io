# Phase 17: Mobile Bottom Sheets & View Toggle - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 17-mobile-bottom-sheets-view-toggle
**Areas discussed:** Bottom sheet height & scroll, Drag handle pill indicator, View mode desktop restore, VaccinationGroupPanel bottom sheet approach

---

## Bottom Sheet Height & Scroll

| Option | Description | Selected |
|--------|-------------|----------|
| Cap at 85dvh, scroll internally | Sheets never taller than 85% of viewport. Always leaves ~15% backdrop visible for tap-to-dismiss. | ✓ |
| Cap at 90dvh, scroll internally | Slightly taller cap. Better for long content. Leaves ~10% backdrop visible. | |
| Auto height (no cap) | Sheet grows to fit content. May fill entire screen on long content. | |

**User's choice:** Cap at 85dvh with internal scroll (overflow-y: auto on the Drawer content area)

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — sheet scrolls internally | Content area scrolls inside the fixed-height sheet. Same as Phase 15 dialog pattern. | ✓ |
| No — let the page scroll | Sheet height tracks content height; page scrolling goes behind the sheet. | |

**User's choice:** Yes — internal scroll

---

## Drag Handle Pill Indicator

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — show a grey pill above the header | Small 32×4px grey rounded bar centred at the top of each bottom sheet, above the Drawer title. Custom header slot required. | ✓ |
| No — Drawer's built-in × close button is enough | PrimeVue Drawer already has a close button. Simpler implementation. | |

**User's choice:** Yes — show drag handle pill indicator using a custom `#header` slot

---

## View Mode Desktop Restore

| Option | Description | Selected |
|--------|-------------|----------|
| Don't write to sessionStorage — compute list view client-side only | Stored wallecx:view-mode key stays unchanged on mobile visits. effectiveViewMode computed handles the forced list. | ✓ |
| Write 'list' to sessionStorage when forced on mobile | Mobile visit overwrites stored value; desktop in same session sees list mode. | |

**User's choice:** Client-side computed override only — sessionStorage is never written with 'list' due to mobile forcing

| Option | Description | Selected |
|--------|-------------|----------|
| Restore to last desktop preference | Toggle reappears with stored mode when resizing back to desktop. | ✓ |
| Always reset to grid on desktop restore | Grid is always shown on desktop restore regardless of stored value. | |

**User's choice:** Restore to last stored desktop preference on resize back to desktop

---

## VaccinationGroupPanel Bottom Sheet Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Reactive position on existing Drawer | Same <Drawer> element with :position="isMobile ? 'bottom' : 'right'". Drop :breakpoints. Minimal change. | ✓ |
| Separate Drawer (bottom) + Drawer (right) with v-if | Two separate <Drawer> elements conditionally shown. Verbose but explicit. | |

**User's choice:** Reactive position prop on existing Drawer

| Option | Description | Selected |
|--------|-------------|----------|
| v-if Dialog (desktop) / Drawer-bottom (mobile) sharing MembershipDetail content | Two wrapper elements; MembershipDetail.vue unchanged. Clean and UX-04 compliant. | ✓ |
| Single Drawer with dynamic position for both | Simpler but violates UX-04 (membership detail must be a Dialog on desktop). | |

**User's choice:** v-if Dialog / v-else Drawer-bottom split for MembershipDetail

---

## Claude's Discretion

- Exact drag handle pill CSS (colour token, dimensions)
- Whether the 85dvh Drawer content override is global or scoped per-tab
- `aria-label` on close button and `aria-hidden="true"` on decorative pill
- `useIsMobile` implementation details (addEventListener vs watchEffect)

## Deferred Ideas

- Swipe-to-dismiss gestures — explicitly out of scope (PWA-ADV-03)
- Bottom sheet on tablet (640–1024px) — out of scope
- CRUD dialogs (ManageVaccination/ManageMembership) as bottom sheets — not in Phase 17 scope
