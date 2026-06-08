# Phase 35: Forms & Dialogs on Small Screens - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 35-forms-dialogs-on-small-screens
**Areas discussed:** BaseMobileDialog architecture, Sticky action bar + keyboard, Dirty-state discard guard, Camera capture UX

---

## BaseMobileDialog architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Owns the split | Wrapper renders Dialog (desktop) / bottom Drawer (mobile) via useMobileEnv; each dialog collapses its v-if/v-else into one <BaseMobileDialog> with #default + #actions slots; form rendered once → preserves #8135/#8191 bindings, removes branch drift | ✓ |
| Thin wrapper, keep branches | Wrapper only supplies sticky action bar + dirty guard; each dialog keeps its two branches | |

**User's choice:** Owns the split (recommended)
**Notes:** Consolidates the Phase-34 stepping-stone branches; form lives in slot in the child so ColorPicker #8135 + administeredDate #8191 stay untouched.

---

## Sticky action bar + keyboard

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky bottom + scrollIntoView | position:sticky bottom:0 + safe-area padding; Android resizes viewport; scrollIntoView({block:'center'}) on focusin; VisualViewport documented as iOS fallback | ✓ |
| Fixed bar + VisualViewport API | position:fixed + VisualViewport resize listener on both platforms | |

**User's choice:** Sticky bottom + scrollIntoView (recommended)
**Notes:** Simplest robust baseline; escalate to VisualViewport only if iOS device testing hides the bar.

---

## Dirty-state discard guard

| Option | Description | Selected |
|--------|-------------|----------|
| Mobile Drawer only, real dirty | snapshot-compare isDirty; useConfirm fires only on mobile Drawer backdrop/swipe/Esc; desktop unchanged; Save/Cancel bypass | ✓ |
| All dismissals (mobile + desktop) | same dirty detection, also guards desktop Dialog dismissal | |
| Simple touched-flag | mark dirty on first input; prompts even if reverted | |

**User's choice:** Mobile Drawer only, real dirty (recommended)
**Notes:** Reuses shell ConfirmDialog singleton; intercept dismissal before close.

---

## Camera capture UX

| Option | Description | Selected |
|--------|-------------|----------|
| Two affordances | 'Take photo' (capture=environment) + separate 'Choose from gallery' (no capture); both feed existing compression/WebP path; only where uploads exist (Expense/Vaccination/Membership; not Budget) | ✓ |
| Single capture input | one control with capture=environment; no gallery fallback for iOS standalone | |

**User's choice:** Two affordances (recommended)
**Notes:** Gallery fallback is the iOS-standalone reliability net. ManageBudget has no upload → no camera.

---

## Claude's Discretion

- FD-03 per-field inputmode/autocomplete/enterkeyhint mapping (mechanical).
- BaseMobileDialog exact prop/slot names + internal markup.
- Whether the sticky action bar needs a top border/shadow separator.

## Deferred Ideas

- VisualViewport keyboard handling (fallback only if sticky+scrollIntoView fails on iOS).
- iPad-768 tablet-specific Drawer-vs-Dialog presentation.
- Real-device keyboard/zoom/camera UAT → Phase 38.
