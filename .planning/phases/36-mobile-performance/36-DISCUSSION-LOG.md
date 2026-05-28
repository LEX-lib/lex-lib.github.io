# Phase 36: Mobile Performance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 36-mobile-performance
**Areas discussed:** Async-loading granularity, Skeleton strategy, PF-05 instrumentation output, WebP conversion scope

---

## Async-loading granularity (PF-02 + manual chunks)

| Option | Description | Selected |
|--------|-------------|----------|
| Aggressive | defineAsyncComponent on tabs + 4 Manage dialogs + rolldown manualChunks for chart.js/JsBarcode/browser-image-compression vendors | ✓ |
| Tab + per-Manage (no vendor chunks) | Per-tab + per-dialog only; default rolldown for vendors | |
| Tab-level only | Just the 3 tabs async; dialogs eager | |

**User's choice:** Aggressive (recommended)
**Notes:** Required to hit ≥50% reduction. AttachmentPreview.vue is the reference Suspense pattern.

---

## Skeleton strategy (PF-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Shared <WallecxSkeleton variant> | One component, 5 layout-matched variants; consumed by every loading surface + Suspense fallback | ✓ |
| Per-component inline | Extend current pattern; each surface owns its own skeleton | |

**User's choice:** Shared component (recommended)
**Notes:** Centralizes the layout-match contract so CLS ≤ 0.1 is verifiable. Replaces existing inline skeletons in ExpensesListView / ReportsView / AttachmentPreview, adds to Vaccinations + Memberships tabs.

---

## PF-05 instrumentation output

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage + console | Per-collection ring (last 5), one-time-per-session writes; console.info for live dev | ✓ |
| Console-only | Log to console; manual copy-paste when assessing | |
| Dev-only HUD overlay | DEV-mode-only perf widget | |

**User's choice:** localStorage + console (recommended)
**Notes:** Persistent + retrievable so the Phase-38b conditional virtualization decision can read actual numbers. No new UI.

---

## WebP conversion (PF-07)

| Option | Description | Selected |
|--------|-------------|----------|
| Image-only + centralize | New compressToWebP helper in src/lib/wallecx/; consumed by the 3 dialogs; PDF still bypasses | ✓ |
| Image-only, no centralize | Same WebP behavior, keep 3 inline calls | |
| WebP + JPEG fallback | Feature-detect + fall back for old Safari | |

**User's choice:** Image-only + centralize (recommended)
**Notes:** Safari 14+ supports WebP — no fallback needed in 2026.

---

## Claude's Discretion

- Exact manualChunks group keys in vite.config.ts (must coexist with existing rolldown codeSplitting.groups).
- <WallecxSkeleton> API surface (likely :variant + :count).
- Instrumented getFullList wrapper location.
- compressToWebP exact signature + whether to fold EXIF strip into the helper.

## Deferred Ideas

- PF-06 list virtualization → Phase 38b (conditional on PF-05 reading).
- Additional 3rd-party preconnects (Google Fonts, iconify CDN) — PB origin only this phase.
- WebP backfill of existing uploads — new uploads only.
- Server-side pagination / getList migration — getFullList remains default per D-31-B.
- Real-device perf measurement run → Phase 38 UAT sweep writes the value back.
