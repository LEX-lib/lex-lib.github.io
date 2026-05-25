---
status: approved
phase: 12-read-path-card-grid-barcode-display-and-detail
source: [12-VERIFICATION.md]
started: 2026-05-13T18:35:00Z
updated: 2026-05-25T00:00:00Z
---

## Current Test

approved by user 2026-05-25 (Phase 30 sweep)

## Tests

### 1. Coloured card grid rendering
expected: MembershipsTab shows coloured MembershipCard tiles with correct background colour (card_color hex prepended with #, default #002244). Expiry badges show yellow "Expiring soon" or red "Expired" based on dayjs computed.
result: passed

### 2. MembershipDetail 7-field dialog + barcode rendering
expected: Clicking a card tile opens MembershipDetail dialog with all 7 fields (Card Name, Issuer, Card Number, Barcode Type, Expiry Date, Card Colour swatch + hex, Notes). QrcodeVue renders QR SVG for qr type; JsBarcode renders linear barcode SVG for code128/ean13/code39.
result: passed

### 3. Full-screen scan overlay
expected: Tapping barcode/QR area opens full-screen white overlay (z-9999, brightness 1.4) with close button. Wake lock prevents screen dim. Overlay sits above PrimeVue Dialog. Escape key closes overlay without closing Dialog underneath.
result: passed

### 4. Invalid barcode fallback (SCAN-02)
expected: When JsBarcode throws (e.g. bad EAN-13 input with incorrect check digit), the component falls back to card_number plain text with "Barcode unavailable" caption. No component crash.
result: passed

### 5. Empty state + error toast
expected: When user has no membership records, empty state shows icon + "No membership cards yet." + disabled "Add your first card" button. When fetch fails (network error), toast.error "Failed to load membership cards." appears.
result: passed

### 6. Vaccinations tab regression
expected: Vaccinations tab still works correctly — vaccination records load, AttachmentPreview shows card images/PDFs when present, VaccinationDetail dialog opens without errors. No regression from the AttachmentPreview generic props refactor.
result: passed

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
