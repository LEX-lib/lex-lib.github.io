---
phase: 12-read-path-card-grid-barcode-display-and-detail
plan: "02"
subsystem: wallecx
tags: [membership-cards, read-path, attachment-preview, refactor, vue3]
dependency_graph:
  requires:
    - phase-11 (types module: src/types/wallecx/memberships/types.d.ts)
    - src/components/projects/wallecx/AttachmentPreview.vue (pre-existing)
    - src/components/projects/wallecx/VaccinationDetail.vue (pre-existing)
  provides:
    - src/components/projects/wallecx/MembershipCard.vue
    - AttachmentPreview.vue (generic RecordModel + attachmentField + attachmentName props)
  affects:
    - src/components/projects/wallecx/VaccinationDetail.vue (call site updated — one line)
    - Plan 12-03 (MembershipDetail can now use AttachmentPreview with attachment-field="card_image")
    - Plan 12-04 (MembershipsTab uses MembershipCard)
tech_stack:
  added: []
  patterns:
    - Generic attachment preview via (record as Record<string, string>)[attachmentField] dynamic key access
    - Coloured card tile with dayjs expiry warning logic (isExpirySoon <= 30 days, isExpired isBefore)
    - BARCODE_TYPE_LABELS map for human-readable badge labels
key_files:
  created:
    - src/components/projects/wallecx/MembershipCard.vue
  modified:
    - src/components/projects/wallecx/AttachmentPreview.vue
    - src/components/projects/wallecx/VaccinationDetail.vue
decisions:
  - "AttachmentPreview refactored to Option A (generic props) rather than Option B (wrapper) — avoids code duplication; VaccinationDetail call site is a one-liner change"
  - "Dynamic field access uses (record as Record<string, string>)[attachmentField] cast — attachmentField comes from trusted parent component props, not user input (T-12-07 accepted)"
  - "MembershipCard tile text always white (#ffffff / rgba) regardless of card_color — no per-card contrast calculation needed for v2.0"
metrics:
  duration: "2m 46s"
  completed_date: "2026-05-13"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 12 Plan 02: MembershipCard + AttachmentPreview Refactor Summary

**One-liner:** Coloured membership card tile with dayjs expiry warnings plus generic AttachmentPreview accepting RecordModel + attachmentField + attachmentName props.

---

## What Was Built

### Task 1: MembershipCard.vue (new)

`src/components/projects/wallecx/MembershipCard.vue` — a PrimeVue Card tile for the membership grid.

Key elements:
- `tileStyle` computed: `backgroundColor: props.record.card_color ? '#' + props.record.card_color : '#002244'` (locked STATE.md rule)
- `isExpirySoon`: `dayjs(expiry_date).diff(dayjs(), 'day') <= 30` — covers negative (already expired)
- `isExpired`: `dayjs(expiry_date).isBefore(dayjs(), 'day')`
- `expiryBadgeText`: returns `'Expired'` or `'Expiring soon'`
- `BARCODE_TYPE_LABELS` map: QR / Code 128 / EAN-13 / Code 39 / Number only
- `displayExpiry`: `DD MMM YYYY` compact format for tile
- `click` emit; no PocketBase calls; no `v-html`; `min-height: 8rem` enforced

### Task 2: AttachmentPreview.vue refactor + VaccinationDetail.vue call site update

**AttachmentPreview.vue** — four precise changes:
1. Import: `Vaccinations` removed; `RecordModel from 'pocketbase'` added
2. Props: `{ record: Vaccinations; token }` → `{ record: RecordModel; attachmentField: string; attachmentName: string; token: string }`
3. Script computeds: `props.record.card` → `(props.record as Record<string, string>)[props.attachmentField] ?? ''` in all three computeds (mimeCategory, tokenUrl, thumbUrl)
4. Template: outer `v-if="record.card"` → `v-if="(record as Record<string, string>)[attachmentField]"`; `alt` → `:alt="attachmentName"`

**VaccinationDetail.vue** — one line only:
```html
<!-- Before -->
<AttachmentPreview :record="record" :token="token" />
<!-- After -->
<AttachmentPreview :record="record" attachment-field="card" :attachment-name="record.vaccine_name" :token="token" />
```
Vaccination behaviour fully preserved: `record["card"]` is identical to old `record.card`; alt text is `record.vaccine_name` as before.

---

## Commits

| Task | Hash | Message |
|------|------|---------|
| 1 — MembershipCard.vue | `55d79fa` | feat(12-02): create MembershipCard.vue with expiry warning logic |
| 2 — AttachmentPreview + VaccinationDetail | `b42194d` | refactor(12-02): make AttachmentPreview generic; update VaccinationDetail call site |

---

## Verification Results

- `npm run type-check` — exits 0 after Task 1, exits 0 after Task 2
- `npm run build` — exits 0 after Task 2 (vaccination regression test passed)
- `grep -rn "v-html" src/components/projects/wallecx/MembershipCard.vue` — 0 matches (PASS)
- `grep -n "Vaccinations" src/components/projects/wallecx/AttachmentPreview.vue` — 0 matches (PASS)
- `grep -n "attachment-field" src/components/projects/wallecx/VaccinationDetail.vue` — 1 match (PASS)
- `grep -n "record.card" src/components/projects/wallecx/AttachmentPreview.vue` — 0 matches (PASS)

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Threat Model Compliance

All STRIDE mitigations from plan `<threat_model>` applied:

| Threat ID | Mitigation Status |
|-----------|-------------------|
| T-12-05 XSS — MembershipCard tile text | PASS — card_name, issuer via `{{ }}` mustache only; no v-html |
| T-12-06 XSS — AttachmentPreview alt | PASS — `:alt="attachmentName"` is a bound attribute; no v-html |
| T-12-07 Tampering — record cast | ACCEPTED — attachmentField comes from parent component props ('card' or 'card_image'), not user input |
| T-12-08 Spoofing — card_color CSS | PASS — `'#' + card.card_color` enforced; raw card_color never in CSS |

---

## Known Stubs

None. MembershipCard.vue is fully functional (presentational). AttachmentPreview.vue is fully functional. No placeholder text or hardcoded empty values that flow to UI rendering.

---

## Self-Check: PASSED

- MembershipCard.vue exists: FOUND
- AttachmentPreview.vue modified (RecordModel import): FOUND
- VaccinationDetail.vue updated (attachment-field="card"): FOUND
- Commit 55d79fa exists: FOUND
- Commit b42194d exists: FOUND
