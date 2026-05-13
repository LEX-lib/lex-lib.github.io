---
status: partial
phase: 11-backend-frontend-foundation
source: [11-VERIFICATION.md]
started: 2026-05-13T00:00:00Z
updated: 2026-05-13T00:00:00Z
---

## Current Test

[awaiting human confirmation]

## Tests

### 1. PocketBase Admin UI — wallecx_memberships collection visual confirm

expected: In PocketBase Admin UI, `wallecx_memberships` collection shows all 10 user-defined fields (user, card_name, issuer, barcode_value, barcode_type, card_number, expiry_date, notes, card_color, card_image). `barcode_type` is type SELECT with exactly 5 values: qr, code128, ean13, code39, number. `card_image` shows: Protected ON, max size 10485760, MIME image/jpeg+image/png+image/webp (no PDF), thumbs 100x100,400x0. API Rules tab shows all 5 per-user rules with create rule using `@request.body.user`.
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
