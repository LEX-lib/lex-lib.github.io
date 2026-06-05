---
phase: 02-read-path
plan: "01"
subsystem: wallecx
tags:
  - attachment-preview
  - pdf
  - csp
  - security
dependency_graph:
  requires:
    - 01-05-SUMMARY.md  # vue-pdf-embed installed, pdfjs-dist@4.10.38 pinned
  provides:
    - AttachmentPreview.vue component (READ-03)
    - CSP worker-src directive (READ-06)
  affects:
    - 02-03-PLAN.md  # VaccinationDetail.vue embeds AttachmentPreview
tech_stack:
  added:
    - defineAsyncComponent pattern for vue-pdf-embed lazy-load
  patterns:
    - MIME detection from filename extension (.endsWith)
    - Suspense + defineAsyncComponent for deferred PDF chunk loading
    - pdfFailed ref for graceful PDF error handling
    - pb.files.getURL with token + thumb options
key_files:
  created:
    - src/components/projects/wallecx/AttachmentPreview.vue
  modified:
    - index.html
decisions:
  - "vue-pdf-embed wrapped in defineAsyncComponent to keep pdfjs-dist (~350kB) out of main bundle"
  - "Suspense placed around VuePdfEmbed (not the entire PDF branch) to allow pdfFailed fallback to coexist as a sibling"
  - "Root v-if on record.card prevents pb.files.getURL(record, '') which produces malformed URLs"
  - "worker-src 'self' blob: only — script-src intentionally left unchanged per READ-06"
metrics:
  duration: "2m 33s"
  completed_date: "2026-05-11"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
requirements_satisfied:
  - READ-03
  - READ-06
---

# Phase 2 Plan 01: AttachmentPreview + CSP Summary

## One-liner

MIME-branched attachment preview (image/PDF/unknown) with defineAsyncComponent lazy-loaded vue-pdf-embed and CSP worker-src narrowly extended for PDF.js blob workers.

## What Was Built

### Task 1: AttachmentPreview.vue (commit 30a5d6b)

Created `src/components/projects/wallecx/AttachmentPreview.vue` — a pure display component that:

- Accepts `record: Vaccinations` and `token: string` props
- Guards on `record.card` being truthy before calling `pb.files.getURL()` (Pitfall 5 — empty card guard)
- Detects MIME from filename extension via `getMimeCategory()` (4 extensions: jpg/jpeg/png/webp/pdf)
- **Image branch:** renders `<img>` with `pb.files.getURL(record, card, { thumb: '400x400', token })` — 480px max height, object-fit contain
- **PDF branch:** lazy-loads `VuePdfEmbed` via `defineAsyncComponent(() => import('vue-pdf-embed'))`, wrapped in `<Suspense>` with a `<Skeleton>` fallback; `pdfFailed` ref + `onPdfError` handler switches to a download link on failure
- **Unknown branch:** download `<a>` link with `pb.files.getURL` tokenUrl
- **No card fallback:** plain text "No attachment."
- Zero `v-html` usage anywhere (XSS mitigation — T-02-01-01)

### Task 2: CSP update in index.html (commit 5cb37ce)

Appended `worker-src 'self' blob:;` to the existing CSP `content` attribute in `index.html`. The `script-src` directive remains exactly `'self'` — no `blob:` was added to `script-src` (T-02-01-04 mitigation). This unblocks the PDF.js web worker that vue-pdf-embed spawns as a blob URL.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run type-check` | PASS (exit 0) |
| `grep "worker-src 'self' blob:" index.html` | 1 hit |
| `grep "script-src 'self'" index.html` | 1 hit |
| `grep "script-src.*blob:"` directive-level check | `script-src 'self'` only — CLEAN |
| `grep "defineAsyncComponent" AttachmentPreview.vue` | 2 hits (import + const declaration) |
| `grep "v-html" AttachmentPreview.vue` | 0 hits — CLEAN |
| `grep "Suspense" AttachmentPreview.vue` | 3 hits (comment + opening + closing) |
| `grep "pdfFailed" AttachmentPreview.vue` | 3 hits (ref + two template usages) |
| `grep "onPdfError" AttachmentPreview.vue` | 2 hits (function + @loading-failed binding) |

## Threat Model Coverage

| Threat ID | Status |
|-----------|--------|
| T-02-01-01 — v-html XSS on notes field | Mitigated — zero v-html in file |
| T-02-01-02 — unprotected file URL | Mitigated — all getURL calls include `{ token: props.token }` |
| T-02-01-03 — CVE-2024-4367 / pdfjs-dist version | Mitigated — pdfjs-dist@4.10.38 unchanged (> 4.2.67 threshold) |
| T-02-01-04 — script-src broadening | Mitigated — only worker-src appended; script-src verified unchanged |
| T-02-01-05 — pdfjs-dist in main chunk | Mitigated — defineAsyncComponent ensures separate lazy chunk |
| T-02-01-06 — empty card string to getURL | Mitigated — root `v-if="record.card"` guard in place |

## Deviations from Plan

### Template structure — PDF branch uses `<template v-else-if>` wrapper instead of sibling `<Suspense v-else-if>`

- **Found during:** Task 1 implementation
- **Issue:** The plan's action section showed `<Suspense v-else-if="mimeCategory === 'pdf'">` directly. However, placing `pdfFailed` error fallback as a sibling after `</Suspense>` requires both to be inside a single branch. A `<template v-else-if>` wrapper cleanly groups `<Suspense>` and the `<div v-if="pdfFailed">` fallback without adding a DOM element.
- **Fix:** Used `<template v-else-if="mimeCategory === 'pdf'">` as a grouping wrapper containing both the `<Suspense>` block and the `pdfFailed` fallback `<div>`. This matches the plan's intent from the must_haves section (which lists both as required) and aligns with the UI spec Section 4 layout.
- **Impact:** Zero functional change — `<template>` is not rendered to DOM. All acceptance criteria still pass.
- **Rule:** Rule 2 (missing critical functionality — without grouping, pdfFailed fallback cannot coexist with Suspense in the else-if chain)

## Known Stubs

None — all branches are fully wired. The component receives real `record` and `token` props and calls live `pb.files.getURL()`.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `src/components/projects/wallecx/AttachmentPreview.vue` | FOUND |
| `index.html` | FOUND |
| Commit 30a5d6b (Task 1 — AttachmentPreview.vue) | FOUND |
| Commit 5cb37ce (Task 2 — CSP update) | FOUND |
