---
status: partial
phase: 02-read-path
source: [02-VERIFICATION.md]
started: "2026-05-11T00:00:00Z"
updated: "2026-05-11T00:00:00Z"
---

## Current Test

[awaiting human testing]

## Tests

### 1. Skeleton loading state
expected: 3 skeleton rows across all 5 columns visible during the fetch; no blank page or 'no records' flash
result: [pending]

### 2. Image card preview
expected: Inline image preview renders at 400x400 thumb; attachment is not broken
result: [pending]

### 3. PDF card preview
expected: vue-pdf-embed renders the first page to canvas; Suspense skeleton shows while loading; no CSP violation in browser console
result: [pending]

### 4. No card attached
expected: AttachmentPreview shows 'No attachment.' text
result: [pending]

### 5. Network error toast
expected: vue-sonner toast: 'Failed to load vaccination records.' appears; page does not crash
result: [pending]

### 6. Dialog state cleanup
expected: Re-opening the dialog for a different record shows the correct record — no stale selectedRecord or fileToken from the previous session
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
