---
phase: 35-forms-dialogs-on-small-screens
verified: 2026-05-28T04:00:00Z
status: human_needed
score: 9/9
overrides_applied: 0
human_verification:
  - test: "Tap any input in any of the 4 Manage dialogs on iOS Safari 390px; observe that the page does NOT zoom"
    expected: "Page stays at 1.0 zoom after focus — iOS auto-zoom is suppressed by the 16px font-size rule"
    why_human: "CSS font-size rule is in place and audited PASS, but actual iOS zoom behaviour can only be confirmed on a real or simulated iOS Safari viewport; no programmatic equivalent"
  - test: "Open ManageExpense on a mobile device with a soft keyboard (iOS or Android), fill a field, then tap the backdrop or swipe down"
    expected: "A 'Discard changes?' confirm dialog appears (from useConfirm); tapping 'Keep editing' returns to the form; tapping 'Discard' closes the drawer"
    why_human: "FD-09 dirty-guard wiring is verifiable in code but actual Drawer @before-hide + useConfirm interaction requires a running browser with a real or emulated soft keyboard"
  - test: "With ManageExpense open on mobile, focus the Amount field and observe the sticky action bar position relative to the virtual keyboard"
    expected: "Save/Cancel action bar stays visible above the keyboard — not hidden behind it"
    why_human: "Sticky-above-keyboard behaviour depends on Android resizes-content viewport mode and iOS scrollIntoView interaction with the overlay keyboard; can only be confirmed in a real browser"
  - test: "Tap the 'Take photo' button in ManageExpense, ManageMembership, or ManageVaccination on a physical iOS or Android device"
    expected: "Device rear camera opens (capture=environment); a separate 'Choose from gallery' button opens the gallery picker"
    why_human: "capture=environment attribute is present in code but actual camera invocation requires a real device; iOS standalone has known capture reliability issues requiring physical verification"
  - test: "Tap a DatePicker (ManageExpense date, ExpensesToolbar From/To, ExpensesReportsView custom range, ManageVaccination date, ManageMembership expiry) on iOS Safari 390px emulation"
    expected: "A popup calendar overlay appears (not an always-visible inline grid); no iOS zoom occurs when the DatePicker input gains focus"
    why_human: "No :inline= or touchUI prop present (grep-confirmed), but popup overlay rendering and zoom suppression on the datepicker-input element requires visual verification at 390px"
  - test: "Focus the last input in any Manage dialog (e.g., the Notes Textarea) on a mobile keyboard, then tap the keyboard's action key"
    expected: "The keyboard action key reads 'Done' (enterkeyhint=done); focused inputs in the middle of a form show 'Next'"
    why_human: "enterkeyhint attributes are present in code but actual keyboard label rendering is device/OS/browser dependent and requires physical or emulated device inspection"
---

# Phase 35: Forms & Dialogs on Small Screens — Verification Report

**Phase Goal:** All 4 Manage dialogs render through a shared BaseMobileDialog.vue wrapper with sticky bottom action bars above the virtual keyboard; iOS auto-zoom eliminated via a global >=16px input rule (FD-01); every input has appropriate inputmode/autocomplete/enterkeyhint (FD-03); DatePicker uses a tap-to-open popup overlay on mobile (FD-04); camera capture="environment" + gallery fallback where uploads exist (FD-05); focused inputs auto-scroll into view (FD-06); Drawer dismissal on a dirty form gates discard via useConfirm (FD-09); sticky bottom action bars (LT-08). Migration order ManageExpense → ManageBudget → ManageMembership → ManageVaccination.

**Verified:** 2026-05-28T04:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 4 Manage dialogs render through BaseMobileDialog.vue with zero raw Dialog/Drawer in the dialog files | VERIFIED | All 4 files import BaseMobileDialog.vue. Grep `<Dialog\|<Drawer` returns 0 matches in ManageExpense, ManageBudget, ManageMembership, ManageVaccination. BaseMobileDialog.vue lines 86-129 own the Dialog/Drawer split internally. |
| 2 | Sticky Save/Cancel action bar is wired via .wallecx-manage-actions in wallecx-overrides.css with flat padding (Pitfall 6 — no env(safe-area-inset-bottom) doubling) | VERIFIED | wallecx-overrides.css lines 168-176: `.wallecx-manage-actions { position: sticky; bottom: 0; padding-top: 1rem; padding-bottom: 0.5rem; ... }` — flat 0.5rem, no env(). BaseMobileDialog.vue line 107 wraps actions slot in `<div class="wallecx-manage-actions">`. |
| 3 | FD-01: wallecx-overrides.css @media (max-width:640px) sets font-size:16px !important on all 6 PrimeVue input classes | VERIFIED | wallecx-overrides.css lines 148-157: `@media (max-width: 640px)` block sets 16px on `.p-inputtext`, `.p-inputnumber-input`, `.p-textarea`, `.p-select-label`, `.p-multiselect-label`, `.p-datepicker-input`. |
| 4 | FD-04: Zero :inline= and zero touchUI usages anywhere in wallecx/ — all 5 DatePicker sites use the default popup-everywhere mode | VERIFIED | Grep `:inline=\|touchUI` across wallecx/ returns 0 matches. All 5 DatePicker sites confirmed popup: ManageExpense.vue line 354, ManageMembership.vue line 403, ManageVaccination.vue line 332, ExpensesToolbar.vue lines 67-78, ExpensesReportsView.vue lines 412-427. No :inline prop, no showButtonBar. |
| 5 | FD-05: camera capture="environment" + gallery fallback present in ManageExpense, ManageMembership, ManageVaccination; absent in ManageBudget | VERIFIED | Grep `capture=` finds capture="environment" in ManageExpense.vue:453, ManageMembership.vue:462, ManageVaccination.vue:430. ManageBudget.vue has no upload section (confirmed by file read). Both affordances (camera + gallery) present in each of the 3 dialogs as two separate raw `<input type="file">` elements feeding onRawFileChange pipeline. |
| 6 | FD-06: BaseMobileDialog has a focusin scrollIntoView handler for mobile | VERIFIED | BaseMobileDialog.vue lines 72-78: `onFocusin` handler calls `target.scrollIntoView({ block: 'center', behavior: 'smooth' })` inside `requestAnimationFrame` when `isMobile.value` is true. Wired on the `<div ref="formRef" @focusin="onFocusin">` container at line 103. |
| 7 | FD-09: BaseMobileDialog uses @before-hide + :dismissable="false" + useConfirm; children expose closeWithoutGuard(); :is-dirty wired from each dialog via snapshot compare | VERIFIED | BaseMobileDialog.vue: Drawer `:dismissable="false"` line 90, `@before-hide="onBeforeHide"` line 92, `confirm.require(...)` in onBeforeHide lines 49-58. `closeWithoutGuard()` exposed via defineExpose line 32. All 4 dialogs: declare isDirty computed from snapshot compare, pass `:is-dirty="isDirty"`, hold `baseDialogRef` and call `baseDialogRef.value?.closeWithoutGuard()` on Save success and Cancel click. |
| 8 | FD-03: inputmode/enterkeyhint/autocomplete present across all 4 dialogs' inputs | VERIFIED | ManageExpense: Amount=inputmode="decimal"/enterkeyhint="next", Description=inputmode="text"/enterkeyhint="next", Notes=enterkeyhint="done". ManageBudget: InputNumber rows have inputmode="decimal" + dynamic enterkeyhint="done" on last row. ManageMembership: CardName=inputmode="text"/enterkeyhint="next", BarcodeValue=inputmode="text", CardNumber=inputmode="numeric", Notes=enterkeyhint="done". ManageVaccination: vaccine_type/vaccine_name/lot_number/manufacturer/location=inputmode="text"/enterkeyhint="next", dose_number=inputmode="numeric", notes=enterkeyhint="done". |
| 9 | CON-CONFIRMDIALOG-SINGLETON: exactly 1 ConfirmDialog in wallecx/, at WallecxApp.vue; ManageMembership ColorPicker v-model="cardColor" direct (no '#'); card_color stored without '#'; membershipMapper.spec.ts 11 tests; ManageVaccination administeredDate direct v-model outside Form; exactly one Form in ManageVaccination | VERIFIED | Grep `<ConfirmDialog` returns exactly 1 match (WallecxApp.vue:105). ManageMembership: `v-model="cardColor"` on ColorPicker line 385; `formData.append("card_color", cardColor.value)` line 272 with no '#' prefix. membershipMapper.spec.ts: 11 it() blocks across 3 describe() groups (35-06-AUDIT.md confirms 59/59 tests pass including membershipMapper 11 green). ManageVaccination: `administeredDate` direct v-model on DatePicker line 332, declared outside Form; exactly one `<Form` tag. |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `src/components/projects/wallecx/BaseMobileDialog.vue` | Shared wrapper with Dialog/Drawer split, sticky actions slot, dirty guard, focusin scroll | VERIFIED | 147 lines; fully substantive; imported by all 4 Manage dialogs |
| `src/assets/wallecx-overrides.css` | FD-01 16px @media rule + .wallecx-manage-actions sticky rule | VERIFIED | 16px rule lines 148-157; sticky bar rule lines 168-176 |
| `src/components/projects/wallecx/ManageExpense.vue` | Migrated to BaseMobileDialog; camera + gallery; isDirty; inputmode/enterkeyhint | VERIFIED | 514 lines; fully migrated; no raw Dialog/Drawer |
| `src/components/projects/wallecx/ManageBudget.vue` | Migrated to BaseMobileDialog; no upload; JSON isDirty; inputmode/enterkeyhint | VERIFIED | 198 lines; fully migrated; no upload section |
| `src/components/projects/wallecx/ManageMembership.vue` | Migrated to BaseMobileDialog; ColorPicker #8135 invariant preserved; camera + gallery | VERIFIED | 527 lines; fully migrated; ColorPicker direct v-model; no '#' on card_color |
| `src/components/projects/wallecx/ManageVaccination.vue` | Migrated to BaseMobileDialog; administeredDate direct v-model; one Form; camera + gallery | VERIFIED | 494 lines; fully migrated; administeredDate outside Form; one Form tag |
| `src/lib/pocketbase/membershipMapper.ts` | mapToUpdateMembership strips server fields, preserves card_color without '#' | VERIFIED | 23 lines; strips id/created/updated/user/card_image; card_color in writable set |
| `src/lib/pocketbase/__tests__/membershipMapper.spec.ts` | 11 tests covering strip + preserve + Object.assign contract | VERIFIED | 89 lines; 11 it() blocks; all green per 35-06-AUDIT.md |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| ManageExpense.vue | BaseMobileDialog.vue | `import BaseMobileDialog from './BaseMobileDialog.vue'` + `<BaseMobileDialog ref="baseDialogRef" ...>` | WIRED | Import line 12; template line 316; baseDialogRef typed InstanceType |
| ManageBudget.vue | BaseMobileDialog.vue | Same import + template pattern | WIRED | Import line 5; template line 121 |
| ManageMembership.vue | BaseMobileDialog.vue | Same import + template pattern | WIRED | Import line 11; template line 315 |
| ManageVaccination.vue | BaseMobileDialog.vue | Same import + template pattern | WIRED | Import line 13; template line 275 |
| BaseMobileDialog (Drawer) | useConfirm dirty guard | `@before-hide="onBeforeHide"` + `:dismissable="false"` + `confirm.require(...)` | WIRED | Lines 90, 92, 49-58; _bypassGuard race-free pattern |
| BaseMobileDialog | children (closeWithoutGuard) | `defineExpose({ closeWithoutGuard })` + `baseDialogRef.value?.closeWithoutGuard()` in all 4 children | WIRED | BaseMobileDialog line 32; all 4 dialogs call it on Save success and Cancel |
| .wallecx-manage-actions | BaseMobileDialog template | `<div class="wallecx-manage-actions">` wrapping `#actions` slot | WIRED | BaseMobileDialog.vue line 107; CSS rule in wallecx-overrides.css lines 168-176 |
| WallecxApp.vue ConfirmDialog | FD-09 dirty guard | `<ConfirmDialog />` at shell level reused by all dialog `useConfirm` calls (singleton) | WIRED | WallecxApp.vue line 105; grep returns exactly 1 match |
| ManageMembership isDirty | BaseMobileDialog :is-dirty | `:is-dirty="isDirty"` — snapshot compare across 8 fields | WIRED | ManageMembership.vue line 319; snapshot interface lines 91-101 |
| ManageVaccination administeredDate | DatePicker v-model | Direct `v-model="administeredDate"` outside Form | WIRED | Line 332; ref declared line 33; manual validation in onSubmit line 213 |

---

### Data-Flow Trace (Level 4)

Not applicable for this phase — the phase delivers form/dialog wrappers and CSS rules, not data-rendering pipelines. The Manage dialogs write to PocketBase; the read path (fetching records into each tab) was delivered in earlier phases and unchanged here. No new data-display artifacts introduced that require Level 4 tracing.

---

### Behavioral Spot-Checks

Step 7b: Skipped — all relevant behaviors are form interactions, virtual-keyboard responses, CSS sticky positioning above a software keyboard, and camera API invocations. These require a running browser in a mobile context and are routed to the human verification section above.

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|----------------|-------------|--------|---------|
| LT-08 | 35-01 to 35-05 | Sticky Save/Cancel action bars in all 4 Manage dialogs | SATISFIED | .wallecx-manage-actions sticky rule + BaseMobileDialog #actions slot wired in all 4 dialogs |
| FD-01 | 35-01 | @media (max-width:640px) 16px !important on 6 PrimeVue input selectors | SATISFIED | wallecx-overrides.css lines 148-157 confirmed exact spec |
| FD-03 | 35-02 to 35-05 | inputmode/autocomplete/enterkeyhint on all inputs across 4 dialogs | SATISFIED | All 4 dialogs carry correct attributes; last fields have enterkeyhint="done" |
| FD-04 | 35-02 to 35-05 (revert f8eb9c7) | All 5 DatePicker sites popup-everywhere; no :inline or touchUI | SATISFIED | 0 :inline= or touchUI matches in wallecx/; all 5 sites confirmed popup |
| FD-05 | 35-02, 35-04, 35-05 | capture="environment" + gallery fallback in ManageExpense, ManageMembership, ManageVaccination | SATISFIED | capture="environment" confirmed at 3 sites; ManageBudget correctly excluded |
| FD-06 | 35-01 | Focused input scrollIntoView in BaseMobileDialog | SATISFIED | focusin handler with requestAnimationFrame scrollIntoView in BaseMobileDialog.vue |
| FD-07 | 35-01 to 35-05 | BaseMobileDialog.vue established; all 4 Manage dialogs migrated | SATISFIED | BaseMobileDialog.vue exists and is imported by all 4 dialogs; 0 raw Dialog/Drawer in dialog files |
| FD-09 | 35-02 to 35-05 | Drawer dirty-state guard via useConfirm before dismissal | SATISFIED | @before-hide + :dismissable="false" + confirm.require in BaseMobileDialog; all 4 children wire :is-dirty + closeWithoutGuard |
| CON-CARD-COLOR-NO-HASH (M-13) | 35-04 | card_color stored without '#'; membershipMapper.spec.ts 11 tests pass | SATISFIED | formData.append("card_color", cardColor.value) no '#'; membershipMapper.spec.ts 11 tests green |
| CON-CONFIRMDIALOG-SINGLETON (M-14) | 35-01 to 35-06 | Exactly 1 ConfirmDialog at WallecxApp.vue | SATISFIED | Grep returns 1 match: WallecxApp.vue:105 |
| NFR-IOS-NO-ZOOM (C-5) | 35-01, 35-06 | All form inputs >=16px on mobile; grep audit for text-xs/text-sm on inputs PASS | SATISFIED (code-side); NEEDS HUMAN for actual zoom suppression | 16px rule confirmed; 35-06 audit: 0 text-xs/text-sm on input elements |
| NFR-DRAWER-DIRTY-GUARD (M-3) | 35-02 to 35-05, 35-06 | Dirty form guard before Drawer dismissal | SATISFIED (code-side); NEEDS HUMAN for actual confirm dialog interaction | useConfirm + before-hide confirmed; 35-06 human APPROVED at 390px emulation; real-device deferred to Phase 38 |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| ManageVaccination.vue | 5 (via VaccinationDetail.vue:5) | `props assigned but never used` (pre-existing grandfathered lint finding — in VaccinationDetail.vue, not ManageVaccination.vue) | Info | Grandfathered finding pre-dates Phase 35; not introduced by this phase; tracked in 35-06-AUDIT.md |

No new blockers or stub anti-patterns found. All form handlers are fully implemented (snapshot compare, useConfirm, PocketBase create/update, file pipeline). No `return null`, `return {}`, `return []`, or console.log-only implementations in any of the 4 migrated dialogs.

---

### Human Verification Required

#### 1. iOS Auto-Zoom Suppression (FD-01 / NFR-IOS-NO-ZOOM)

**Test:** Open any Manage dialog on iOS Safari 390px (DevTools emulation or real device). Tap any text input field.
**Expected:** The page does NOT zoom. The viewport scale stays at 1.0 after focus (the 16px font-size rule suppresses iOS auto-zoom).
**Why human:** The CSS rule is code-verified and grep-audited clean (0 text-xs/text-sm on inputs), but actual iOS zoom suppression is a browser rendering behaviour that only manifests in a live iOS Safari context.

#### 2. Dirty-State Discard Guard UX (FD-09 / NFR-DRAWER-DIRTY-GUARD)

**Test:** Open ManageExpense on mobile, type something into the Description field, then tap the backdrop outside the drawer or swipe down.
**Expected:** A "Discard changes?" dialog appears with "Keep editing" and "Discard" options. Tapping "Keep editing" returns to the form with data intact. Tapping "Discard" closes the drawer.
**Why human:** The guard's @before-hide / useConfirm wiring is code-verified, but the actual confirm dialog appearance and Drawer interaction on a mobile touch event requires a running browser. Emulation APPROVED at 390px in 35-06; real-device confirmation deferred to Phase 38.

#### 3. Sticky Action Bar Above Keyboard (LT-08)

**Test:** Open ManageExpense on a phone. Focus the Amount or Description field to bring up the soft keyboard. Scroll down if needed.
**Expected:** The Save/Cancel bar stays visible above the keyboard at all times — it is not hidden behind the keyboard or pushed off-screen.
**Why human:** position:sticky behaviour in the context of an overlapping iOS virtual keyboard vs Android resizes-content viewport can only be confirmed in a live browser environment. 390px emulation APPROVED in 35-06; real-device deferred to Phase 38.

#### 4. Camera Capture + Gallery Fallback (FD-05)

**Test:** Open ManageExpense, ManageMembership, or ManageVaccination on a physical iOS or Android device. Tap "Take photo".
**Expected:** The device rear camera opens. Separately, tapping "Choose from gallery" opens the photo gallery picker.
**Why human:** capture="environment" attribute is present in all 3 dialogs (code-verified), but actual camera invocation is hardware/OS-dependent. iOS standalone mode has known reliability issues with the capture attribute that require physical device testing.

#### 5. DatePicker Popup on Mobile — No Inline Calendar (FD-04)

**Test:** Tap any DatePicker (ManageExpense date field, ExpensesToolbar From/To pickers, ExpensesReportsView custom range, ManageVaccination date, ManageMembership expiry) at 390px mobile viewport.
**Expected:** A popup calendar overlay appears (NOT an always-visible inline grid below the field). The popup closes on date selection. No page zoom occurs.
**Why human:** :inline= and touchUI are both absent (grep-confirmed), and the FD-01 16px rule covers .p-datepicker-input. However, PrimeVue 4.5.5 DatePicker mobile popup rendering and zoom suppression require visual confirmation in a live 390px viewport.

#### 6. Keyboard Hint Labels (FD-03)

**Test:** Focus the last input in a Manage dialog (e.g., the Notes Textarea) on a physical mobile keyboard. Inspect the keyboard action key.
**Expected:** The action key reads "Done". For intermediate fields (e.g., Amount → Date → Category → Description), the key reads "Next".
**Why human:** enterkeyhint attributes are code-verified across all 4 dialogs, but actual keyboard label rendering depends on the OS, browser, and input type combination. Only observable on a real or reliably emulated soft keyboard.

---

### Gaps Summary

No automated gaps. All 9 must-have truths VERIFIED at code level. The 6 human verification items are runtime/device-dependent behaviours that cannot be confirmed programmatically:

- FD-01 zoom suppression and FD-04 popup overlay — CSS is correct; browser execution required
- LT-08 sticky-above-keyboard — CSS rule is correct; virtual keyboard interaction required  
- FD-09 dirty guard UX — wiring is correct; live Drawer touch event required
- FD-05 camera open — attribute present; hardware invocation required
- FD-03 keyboard hints — attributes present; soft keyboard rendering required

These are the same 6 behaviours that received emulation APPROVAL at 390px DevTools in the 35-06 human-verify checkpoint (ROADMAP.md notes "human APPROVED 6 behaviors at 390px emulation"). Real-device confirmation is explicitly deferred to Phase 38 Mobile UAT Sweep per 35-CONTEXT.md `<deferred>` and ROADMAP.md Phase 38 scope. Phase 38 success criteria explicitly re-verifies NFR-IOS-NO-ZOOM, NFR-DRAWER-DIRTY-GUARD, and CON-CARD-COLOR-NO-HASH as part of the milestone-close UAT.

**Phase 35 code deliverables are complete. Human verification at 390px emulation was already approved. Real-device sign-off belongs to Phase 38.**

---

_Verified: 2026-05-28T04:00:00Z_
_Verifier: Claude (gsd-verifier)_
