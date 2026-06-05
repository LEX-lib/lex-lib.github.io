---
phase: 12-read-path-card-grid-barcode-display-and-detail
plan: "03"
subsystem: wallecx
tags:
  - membership-cards
  - read-path
  - scan-overlay
  - wake-lock
  - barcode
  - vue3
dependency_graph:
  requires:
    - Plan 12-01 (BarcodeDisplay.vue)
    - Plan 12-02 (AttachmentPreview generic props refactor)
  provides:
    - src/components/projects/wallecx/MembershipDetail.vue
  affects:
    - Plan 12-04 (MembershipsTab.vue opens MembershipDetail inside a PrimeVue Dialog)
tech_stack:
  added: []
  patterns:
    - Teleport-to-body scan overlay escaping PrimeVue Dialog z-index stacking context
    - navigator.wakeLock.request('screen') with try/catch silent degrade + visibilitychange re-acquire
    - Two-column field grid mirroring VaccinationDetail pattern exactly
    - AttachmentPreview with generic attachmentField prop (card_image)
key_files:
  created:
    - src/components/projects/wallecx/MembershipDetail.vue
  modified: []
decisions:
  - "Overlay uses position:fixed/inset:0/z-index:9999/filter:brightness(1.4) — not requestFullscreen (STATE.md FS-2 — iOS unsupported on non-video elements)"
  - "Wake lock wrapped in try/catch; silent degrade when denied or unavailable (STATE.md FS-1)"
  - "visibilitychange listener registered in onMounted / removed in onUnmounted — re-acquires wake lock on tab visibility restore"
  - "@keydown.esc.stop on overlay div prevents Escape from bubbling to Dialog and closing it prematurely"
  - "Overlay BarcodeDisplay has no @scan binding — overlay is itself the scan destination"
  - "Card Colour uses AU English spelling per UI-SPEC copywriting contract"
  - "card_color swatch binding prepends '#': '#' + record.card_color (STATE.md locked rule)"
metrics:
  duration: "3m 15s"
  completed_date: "2026-05-13"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 12 Plan 03: MembershipDetail.vue Summary

**One-liner:** Full-field read-only membership detail view with two-column grid, BarcodeDisplay embed (@scan wired), Teleport scan overlay (fixed/inset/z-9999/brightness), navigator.wakeLock try/catch + visibilitychange reacquire, and AttachmentPreview for card_image.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create MembershipDetail.vue with field grid, barcode embed, scan overlay, and attachment preview | a00bf2b | src/components/projects/wallecx/MembershipDetail.vue |

## What Was Built

`MembershipDetail.vue` is a `<script setup lang="ts">` SFC rendered inside a PrimeVue Dialog (opened by MembershipsTab in Plan 12-04). It is the central read-path component tying together the field grid, barcode display, scan overlay, and card image preview.

### Field Grid

Two-column `grid grid-cols-2 gap-4` displaying 7 fields:

1. **Card Name** — `record.card_name` (always present)
2. **Issuer** — `record.issuer || '—'`
3. **Card Number** — `record.card_number || '—'`
4. **Barcode Type** — via `barcodeTypeLabel` computed (maps PocketBase values to human-readable labels: QR / Code 128 / EAN-13 / Code 39 / Number only)
5. **Expiry Date** — via `displayExpiry` computed: `dayjs(expiry_date).format('DD MMMM YYYY')` or `'—'`
6. **Card Colour** — 16×16 swatch span (`backgroundColor: '#' + record.card_color`) + hex text; `'—'` when absent
7. **Notes** — full-width conditional (`v-if="record.notes"`), `whitespace-pre-wrap`, mustache only (no v-html)

Field labels use `var(--color-typo-heading)`, values use `var(--color-typo-body)` — exact VaccinationDetail pattern.

### BarcodeDisplay Embed

`BarcodeDisplay` embedded with `:barcode_type`, `:barcode_value`, `:card_number` props and `@scan="openScanOverlay"`. Triggers the scan overlay when user taps the barcode area.

### Scan Overlay (SCAN-03)

Implemented via `<Teleport to="body">` wrapping a `position: fixed; inset: 0; z-index: 9999; background: #ffffff; filter: brightness(1.4)` overlay div. Teleport escapes the PrimeVue Dialog's z-index stacking context so the overlay covers the full viewport correctly.

Overlay contains:
- Close button: `absolute top-4 right-4 w-12 h-12` (48px touch target), `background: rgba(0,0,0,0.08)`, `mdi:close` icon, `aria-label="Close scan view"`
- BarcodeDisplay (same props as detail view, no `@scan` — overlay is the scan destination)
- `@keydown.esc.stop="closeScanOverlay"` on the overlay div — `.stop` prevents Escape bubbling to Dialog

### Wake Lock (FS-1)

`openScanOverlay()` attempts `navigator.wakeLock.request('screen')` inside `if ('wakeLock' in navigator) { try { ... } catch { /* silent degrade */ } }`. Feature detection before API call ensures no crash on unsupported browsers.

`closeScanOverlay()` releases the wake lock via `wakeLock.value?.release()` in try/catch.

`onVisibilityChange()` handler re-acquires the wake lock when the tab becomes visible again while the overlay is open (handles screen-dim and tab-switch scenarios). Listener registered in `onMounted`, removed in `onUnmounted`.

### AttachmentPreview Embed (MREAD-04)

Uses the refactored generic `AttachmentPreview` from Plan 12-02 with `attachment-field="card_image"` and `:attachment-name="record.card_name"`.

## Verification Results

- `npm run type-check` exits 0 — no TypeScript errors
- No `v-html` directives in file (comments mentioning "v-html" are in HTML comments — no directive present)
- No `requestFullscreen` calls (STATE.md FS-2 compliance — comments mentioning it are HTML comments only)
- `<Teleport to="body">` present (1 instance)
- `Card Colour` label present (AU English spelling — PASS)
- `attachment-field="card_image"` present in AttachmentPreview usage
- `navigator.wakeLock.request('screen')` present (2 calls: openScanOverlay + onVisibilityChange)
- `if ('wakeLock' in navigator)` feature detection present
- `document.addEventListener('visibilitychange', onVisibilityChange)` in onMounted
- `document.removeEventListener('visibilitychange', onVisibilityChange)` in onUnmounted
- `@keydown.esc.stop="closeScanOverlay"` on overlay div
- Second BarcodeDisplay (in overlay) has no `@scan` binding

## Deviations from Plan

None — plan executed exactly as written. All code excerpts from the plan were used verbatim.

## Threat Model Compliance

All STRIDE mitigations from plan `<threat_model>` applied:

| Threat ID | Mitigation Status |
|-----------|-------------------|
| T-12-09 XSS — field grid (card_name, issuer, card_number, notes) | PASS — all fields use `{{ }}` mustache only; no `v-html` |
| T-12-10 XSS — notes whitespace-pre-wrap | PASS — `whitespace-pre-wrap` is CSS; `{{ record.notes }}` stays escaped |
| T-12-11 Elevation of Privilege — Teleport overlay | ACCEPTED — UI overlay only; no credential access; user-initiated via barcode tap |
| T-12-12 DoS — navigator.wakeLock.request() | PASS — wrapped in try/catch; silent degrade on deny/unavailable; overlay still opens |
| T-12-13 Injection — card_color CSS swatch | PASS — `'#' + record.card_color` prepended '#' forces hex color interpretation |

## Known Stubs

None. MembershipDetail.vue is fully functional. All 7 fields render from props. BarcodeDisplay and AttachmentPreview are wired. Scan overlay is fully implemented. No placeholder text or hardcoded empty values that prevent the plan's goals from being achieved.

## Threat Flags

None. MembershipDetail.vue introduces no new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/components/projects/wallecx/MembershipDetail.vue` exists | FOUND |
| Commit `a00bf2b` exists | FOUND |
