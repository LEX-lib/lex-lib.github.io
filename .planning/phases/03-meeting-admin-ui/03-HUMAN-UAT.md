---
status: partial
phase: 03-meeting-admin-ui
source: [03-VERIFICATION.md, 03-06-PLAN.md Task 2]
started: 2026-04-29T01:35:00Z
updated: 2026-04-29T01:35:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Section labels — third activity card reads "Admin"
expected: third `<ActivityCard>` heading shows the literal text "Admin" (not "Admin Tasks and Support")
result: [pending]

### 2. Meeting dialog — duration toggle UX
expected:
  - Dialog body has NO dark gray background; inputs render with default Aura styling
  - Duration row shows InputNumber + SelectButton side-by-side
  - Toggle to `hr`, type `1`, toggle back to `min` → input now reads `60`
  - Toggle to `hr` again → input reads `1`
  - Type `1.5` while on `hr` → two decimals accepted
  - Toggle to `min` → input rounds to `90` (no decimals)
result: [pending]

### 3. Admin/Support dialog — URL input
expected:
  - Form shows three rows: Title, Link (optional), Description
  - Pasting `https://example.com` into Link is accepted
  - "Save" click shows toast (Phase 4 owns real PB persistence)
result: [pending]

### 4. ActivityCard link icon — admin row
expected:
  - With an admin item that has a `link` set in PocketBase, a small `mdi:open-in-new` icon appears between the title input and edit button
  - Hovering shows a tooltip with the URL
  - Click opens a new tab to that URL
  - In the new tab, `window.opener` is `null` (T-3-01 mitigation: noopener,noreferrer)
result: [pending]

### 5. ActivityCard link icon — task row (jira_link)
expected: same as #4, but for a task with a `jira_link` set in PocketBase
result: [pending]

### 6. Console cleanliness
expected: pick a date, edit/remove items, navigate away and back — DevTools Console shows NO `console.log` from LexTrack code (Vue/PrimeVue infra noise is acceptable)
result: [pending]

### 7. Dark mode independence (D-18 sanity)
expected: dialogs render legibly even though gray-on-gray Tailwind classes were stripped
result: [pending]

### 8. Indigo Save button color
expected: Save buttons in ManageMeeting/ManageSupport use `bg-indigo-600` and darken on hover (D-19)
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
