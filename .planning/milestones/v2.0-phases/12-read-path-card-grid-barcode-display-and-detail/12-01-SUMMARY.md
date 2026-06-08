---
phase: 12-read-path-card-grid-barcode-display-and-detail
plan: "01"
subsystem: wallecx
tags:
  - barcode
  - qr-code
  - vue-component
  - jsbarcode
  - qrcode-vue
dependency_graph:
  requires: []
  provides:
    - src/components/projects/wallecx/BarcodeDisplay.vue
  affects:
    - Plan 12-03 (MembershipDetail.vue embeds BarcodeDisplay)
    - Plan 12-04 (MembershipsTab scan overlay embeds BarcodeDisplay)
tech_stack:
  added: []
  patterns:
    - Four-branch computed render selector with renderError-first guard
    - useTemplateRef + onMounted + watch(no-immediate) for JsBarcode SVG
    - Module-level barcode color constants (non-configurable)
key_files:
  created:
    - src/components/projects/wallecx/BarcodeDisplay.vue
  modified: []
decisions:
  - renderError checked first in displayBranch computed to prevent re-entering linear branch after JsBarcode throw while barcode_type/barcode_value props remain truthy
  - BARCODE_FOREGROUND and BARCODE_BACKGROUND defined as module-level constants, not props (STATE.md BR-2)
  - watch without immediate:true — onMounted handles initial render, watcher handles prop changes (STATE.md BR-5)
  - scan emit on branches A/B/C only; Branch D (empty) has no @click (nothing to scan)
  - QrcodeVue uses render-as="svg" (SCAN-01 requirement)
metrics:
  duration: "1m 8s"
  completed: "2026-05-13"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 12 Plan 01: BarcodeDisplay.vue Summary

**One-liner:** Purely presentational barcode/QR renderer with four-branch computed logic (qr/linear/number-fallback/empty), JsBarcode try/catch guard, and renderError-first computed using jsbarcode 3.12.3 + qrcode.vue 3.9.1.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create BarcodeDisplay.vue with four-branch render logic | 3ad82d2 | src/components/projects/wallecx/BarcodeDisplay.vue |

## What Was Built

`BarcodeDisplay.vue` is a purely presentational `<script setup lang="ts">` SFC that renders one of four mutually exclusive branches based on `barcode_type`, `barcode_value`, and `card_number` props:

- **Branch A** — QR code via `QrcodeVue` (SVG mode) when `barcode_type === 'qr'` and `barcode_value` truthy
- **Branch B** — Linear barcode via `JsBarcode` onto an SVG element when `barcode_type` is `code128`/`ean13`/`code39` and `barcode_value` truthy
- **Branch C** — `card_number` as large plain text (text-3xl font-bold) with "Barcode unavailable" caption when barcode rendering unavailable or JsBarcode throws
- **Branch D** — `mdi:barcode-off` icon + "No barcode" when both `barcode_value` and `card_number` are absent; no `@click`/`cursor-pointer`

The `displayBranch` computed checks `renderError.value` first — before re-evaluating the QR/linear branches — to prevent an infinite re-entry loop after a JsBarcode throw.

The `renderBarcode()` function guards with `if (!barcodeSvgRef.value) return` before calling JsBarcode, preventing the "No element to render on" error when the watcher fires before the SVG mounts. `onMounted(renderBarcode)` handles initial render; `watch(() => props.barcode_value, renderBarcode)` (no `immediate: true`) handles prop-driven re-renders.

## Verification Results

All acceptance criteria met:

- `npm run type-check` exits 0 — no TypeScript errors
- No `v-html` in file (T-12-01 XSS mitigation verified)
- `renderError.value && props.card_number` on first branch of displayBranch computed (line 28)
- No `requestFullscreen` calls (STATE.md FS-2 compliance)
- No `{ immediate: true }` in watcher call (STATE.md BR-5 compliance)
- All four v-if/v-else-if/v-else branches present
- No PocketBase import (purely presentational)

## Deviations from Plan

None — plan executed exactly as written. All code excerpts from the plan were used verbatim.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. `BarcodeDisplay.vue` is client-side only with no PocketBase calls.

Threat mitigations from plan's threat register applied:
- **T-12-01** (XSS via card_number): `{{ card_number }}` mustache only — Vue template compiler escapes HTML; no `v-html` present
- **T-12-02** (DoS via JsBarcode): JsBarcode wrapped in `try/catch`; `renderError=true` falls through to plain-text branch; component never crashes

## Known Stubs

None. This component is purely presentational with no data stubs — all rendering is driven by props passed from parent components.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/components/projects/wallecx/BarcodeDisplay.vue` exists | FOUND |
| Commit `3ad82d2` exists | FOUND |
