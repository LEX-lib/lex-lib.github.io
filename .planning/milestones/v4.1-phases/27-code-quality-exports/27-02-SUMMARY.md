---
phase: 27-code-quality-exports
plan: "02"
subsystem: memberships-export
tags: [export, memberships, vue]
key-files:
  modified:
    - src/components/projects/wallecx/MembershipsTab.vue
---

# Plan 27-02 Summary: Memberships JSON Export

## What Was Built

Added `exportJson()` async function and "Download records" button to `MembershipsTab.vue`.

- `isExporting` ref guard prevents double-click
- `pb.authStore.record?.id` null guard; aborts with "Session expired" toast if missing
- `getFullList<Memberships>({ sort: "-created", requestKey: "memberships-export" })` — isolated key, all records
- Envelope: `{ exported_at, record_count, records[] }` with fields: id, card_name, issuer, card_number, card_color, expiry_date, notes, card_image_url, created, updated
- `card_image_url`: `r.card_image ? pb.files.getURL(r, r.card_image) : null`
- Blob + URL.createObjectURL + anchor click + URL.revokeObjectURL cleanup
- Filename: `wallecx-memberships-YYYY-MM-DD.json`
- Success toast: "Membership cards exported." / error: "Export failed. Please try again."
- Button in header `flex gap-2` wrapper: `severity="secondary"`, `size="small"`, `icon="pi pi-download"`

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 4f988b4 | feat(27-02,27-03): add JSON export to MembershipsTab and ExpensesTab |

## Deviations

None.

## Self-Check: PASSED

- ✓ `import dayjs from 'dayjs'` added
- ✓ `const isExporting = ref(false)` added
- ✓ `exportJson()` with requestKey `memberships-export`
- ✓ `card_image_url` via pb.files.getURL ternary
- ✓ Header row `flex gap-2` wrapping both buttons
- ✓ `npm run type-check` exit 0
- ✓ `npm run test:unit` 49/49 green
