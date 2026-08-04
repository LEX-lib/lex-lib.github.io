---
status: testing
phase: 38-boarder-roster-foundation
source: [38-VERIFICATION.md]
started: 2026-08-04T19:10:00Z
updated: 2026-08-04T19:10:00Z
---

## Current Test

number: 1
name: Account link picker (ROSTER-03)
expected: |
  With the roster holding 7 boarders (all currently unlinked), open Edit on one and link it to an
  existing user account. Save, reopen — the account is still shown as linked. Then open a
  DIFFERENT boarder: the account you just linked must NOT appear in its dropdown options. Reopen
  the first boarder again: its own linked account must still appear (a boarder must not be
  excluded from its own current link).
awaiting: user response

## Tests

### 1. Account link picker (ROSTER-03)
expected: Linking an account persists and survives a reopen; the linked account disappears from every OTHER boarder's dropdown; the owning boarder still sees its own account. This is the single most important item — zero of the 7 rows has ever been linked, so neither the picker's happy path nor its exclude-taken filter has run even once, and the unique index's uniqueness half (`WHERE user != ''`, one boarder per account) is entirely unproven.
result: [pending]

### 2. Edit boarder (ROSTER-05)
expected: Editing a boarder's display name, its tags, and its account link each persist after save and are still correct after a reload. Code is present and wired; never exercised.
result: [pending]

### 3. Deactivate / Reactivate (ROSTER-04)
expected: Deactivate a boarder — the Inactive badge appears and the row sorts below the active ones. Reactivate it — the badge clears and it sorts back up. Both states survive a reload. This writes `is_active` through a dedicated single write path, so it is the only place that field is ever set to `false`.
result: [pending]

### 4. Delete boarder
expected: Delete shows a confirmation dialog naming the boarder; cancelling leaves the row intact; confirming removes it from the list and it stays gone after a reload.
result: [pending]

### 5. Seven 390px UI backstops
expected: At 390px (devtools emulation — this project's established approval width), each of the seven reads ok, or you describe what actually happened. (1) Row with many tags: chips wrap, don't clip or push actions off-screen. (2) Row with a very long name: wraps in its column, row doesn't widen. (3) Dialog with a very long name typed: wraps in the input, dialog stays inside the viewport. (4) Tag picker with many chips: chips wrap, suggestion panel scrolls at max height. (5) Very long tag name: truncates inside its chip. (6) Account dropdown with a long name/email: truncates in the option row AND the closed label. (7) Delete confirmation for a long name: message wraps, dialog doesn't widen.
result: [pending]

### 6. Empty / whitespace-only name rejection
expected: Saving a boarder with an empty or whitespace-only display name shows an inline validation error and stores nothing. No unit test covers this either — it is unverified at both levels.
result: [pending]

### 7. Non-admin session: Admin tab absent entirely
expected: Logged in as a non-admin, the Admin tab does not render at all — not present-and-empty, not present-and-disabled. Code is structurally correct (`isAdmin = auth.user?.is_admin === true`, `v-if="isAdmin"` on both the Tab and the TabPanel — not the `isLoggedIn` one-token swap that shipped once in `GiftExchangeManage.vue`), but never clicked with a real non-admin session.
result: [pending]

### 8. Three judgment-tier prohibitions — human sign-off
expected: No roster field, tag, badge, or copy frames a boarder as a judgment, uses tags as a classification of the person, or presents deactivation as punitive. A non-authoritative LLM pass during verification found no violations (only name, free-text tenancy tags observed live as `main`/`room-2`, account link, and a neutrally-worded secondary-severity Inactive badge). Per the `verification: judgment` contract these are never auto-resolved — your sign-off is required regardless of that pass.
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
