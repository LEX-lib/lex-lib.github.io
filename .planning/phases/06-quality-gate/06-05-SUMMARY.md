---
phase: 06-quality-gate
plan: "05"
subsystem: lextrack-tests
tags: [vitest, component-tests, manage-dialogs, primevue-teleport]
dependency_graph:
  requires: [06-03, 06-04]
  provides: [manage-dialog-tests]
  affects: [06-07]
tech_stack:
  added: []
  patterns:
    - "attachTo: document.body + document.querySelectorAll for PrimeVue Dialog Teleport content"
    - "afterEach body cleanup to prevent test cross-contamination"
    - "flushPromises() after click to resolve Vue reactive watchers"
key_files:
  created:
    - src/components/projects/lextrack/__tests__/ManageMeeting.spec.ts
    - src/components/projects/lextrack/__tests__/ManageTask.spec.ts
    - src/components/projects/lextrack/__tests__/ManageSupport.spec.ts
  modified: []
decisions:
  - "Use attachTo: document.body + document.querySelectorAll for PrimeVue Dialog Teleport — wrapper.findAll('button') returns 0 results because Dialog teleports content outside the wrapper's DOM subtree"
  - "Detect loading state via disabled attribute (not aria-busy) — PrimeVue Button with :loading adds disabled=\"\" attribute; aria-busy stays null"
  - "afterEach clears document.body.innerHTML to prevent teleported dialog content from leaking between tests"
metrics:
  duration: "~4 min"
  completed_date: "2026-04-29"
  tasks_completed: 1
  files_modified: 3
---

# Phase 6 Plan 05: Manage* Dialog Component Tests Summary

**One-liner:** Component tests for ManageMeeting, ManageTask, ManageSupport using document.body querying to handle PrimeVue Dialog Teleport.

## What Was Built

Three spec files covering the save emit and saving-prop behavior of the Manage* dialogs:

- `ManageMeeting.spec.ts` — 6 tests: save emit fires, payload contains title/duration_minutes/duration_unit, duration round-trip with hours unit (90 min → hours → back to 90 min via useDurationField watcher), saving=false not disabled, saving=true disabled
- `ManageTask.spec.ts` — 6 tests: save emit fires, payload contains title, jira_link preserved when set, jira_link undefined when not set, saving=false not disabled, saving=true disabled
- `ManageSupport.spec.ts` — 6 tests: save emit fires, payload contains title, link preserved when set, link undefined when not set, saving=false not disabled, saving=true disabled

Total: 18 new tests. Full suite: 79 tests across 12 spec files — all green.

## Key Discovery: PrimeVue Dialog Teleport

PrimeVue's `<Dialog>` component renders its content via Vue Teleport to `document.body`. This means `wrapper.findAll('button')` returns 0 results — the buttons exist in the DOM but outside the wrapper's subtree.

**Fix:** Use `attachTo: document.body` when mounting and query `document.body.querySelectorAll('button')` to find teleported buttons. Add `afterEach(() => { document.body.innerHTML = ''; })` to clean up between tests.

This pattern is documented in the spec files with an inline comment for future test authors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Teleport-aware button finding**
- **Found during:** Initial test run
- **Issue:** Plan's implementation guidance used `wrapper.findAll('button').find(b => b.text().includes(...))` — this returns 0 buttons because PrimeVue Dialog uses Teleport to document.body
- **Fix:** Switched to `attachTo: document.body` + `document.querySelectorAll<HTMLButtonElement>('button')` with textContent matching
- **Files modified:** All 3 spec files
- **Commit:** eed30cd

**2. [Rule 1 - Bug] Loading state detection via disabled attribute**
- **Found during:** Test run — `saving=true` loading test failed
- **Issue:** Plan suggested `aria-busy="true"` to detect loading state; PrimeVue Button actually adds `disabled=""` attribute (not aria-busy) when loading
- **Fix:** Changed loading assertion to `saveBtn?.getAttribute('disabled') !== null`
- **Files modified:** All 3 spec files
- **Commit:** eed30cd

## Self-Check

Files exist:
- `src/components/projects/lextrack/__tests__/ManageMeeting.spec.ts` — FOUND
- `src/components/projects/lextrack/__tests__/ManageTask.spec.ts` — FOUND
- `src/components/projects/lextrack/__tests__/ManageSupport.spec.ts` — FOUND

Commit eed30cd exists and contains all 3 files.

## Self-Check: PASSED
