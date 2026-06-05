# Phase 15: Mobile Layouts - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 15-mobile-layouts
**Areas discussed:** iOS Install Banner, Dialog scroll approach, Safe-area inset scoping, Touch target audit scope

---

## iOS Install Banner

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed bottom strip | Sits above the home indicator area at the bottom of the screen — standard iOS PWA pattern. Doesn't displace content. | ✓ |
| Slide-up from bottom sheet | Animated banner that slides up from the bottom on first visit. More prominent but more intrusive. | |
| Inline card below tabs header | Appears between the tab bar and the card grid, pushing content down. Simple but takes vertical space. | |

**User's choice:** Fixed bottom strip

---

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal: icon + brief text + X | Wallecx icon + 'Install: tap → then Add to Home Screen' + dismiss X button. On-brand navy/amber palette. | ✓ |
| Descriptive: full instruction with icon steps | Shows the Share icon glyph, arrow, and 'Add to Home Screen' spelled out with icons. Needs custom SVG. | |
| You decide | Claude picks a clean, minimal design matching the navy/amber brand. | |

**User's choice:** Minimal: icon + brief text + X

---

| Option | Description | Selected |
|--------|-------------|----------|
| X button only, persisted to localStorage | Single dismiss action. Once dismissed never reappears. | ✓ |
| X button + auto-dismiss after N seconds | Also fades after ~8 seconds if ignored. localStorage still needed. | |
| X button + re-show after 30 days | Dismissed state expires after 30 days. More complex localStorage logic. | |

**User's choice:** X button only, persisted to localStorage

---

## Dialog Scroll Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Global CSS override in a Wallecx-scoped style block | One rule targets .p-dialog-content, covers all 4 dialogs without touching templates. | ✓ |
| Per-dialog :pt PassThrough prop | Add :pt={{ content: ... }} to each Dialog component — 4 places. | |
| You decide | Claude picks the cleanest approach that fits existing patterns. | |

**User's choice:** Global CSS override in a Wallecx-scoped style block

---

## Safe-area Inset Scoping

| Option | Description | Selected |
|--------|-------------|----------|
| In App.vue / CustomNavBar wrapper | Top safe-area belongs in the nav bar since it sits above WallecxApp.vue in App.vue. WallecxApp.vue handles bottom + sides. | ✓ |
| In WallecxApp.vue only — follow MOB-06 literally | Apply all 4 env(safe-area-inset-*) values in WallecxApp.vue container. | |
| In both App.vue top and WallecxApp.vue bottom/sides | Cleanest separation but touches more files. | |

**User's choice:** In App.vue / CustomNavBar wrapper (top safe-area there; WallecxApp.vue handles bottom + sides)

---

## Touch Target Audit Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Per-element Tailwind classes | Add min-h-[44px] min-w-[44px] directly to wrapper divs in each component. Explicit and auditable. | ✓ |
| Global CSS override for PrimeVue components | .wallecx-container .p-button { min-height: 44px } type override. One rule but may surprise on desktop. | |
| You decide | Claude audits each element and picks the right approach per case. | |

**User's choice:** Per-element Tailwind classes

---

## Claude's Discretion

- Exact banner copy text (within "minimal" constraint)
- Iconify icon to use for the Share glyph
- localStorage key name for banner dismissed state
- Tailwind class vs inline CSS for overscroll-behavior
- Whether App.vue or CustomNavBar is cleaner for top safe-area padding

## Deferred Ideas

None.
