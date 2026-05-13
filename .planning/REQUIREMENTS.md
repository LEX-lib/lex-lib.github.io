# Requirements: Wallecx v2.0 Membership Cards

**Defined:** 2026-05-13
**Core Value:** Each authenticated user can save and display their membership, loyalty, insurance, and ID cards — with barcodes or QR codes shown full-screen for scanning at the counter.

## v2.0 Requirements

Requirements for the Membership Cards milestone. Phases continue numbering from v1.2 (last was Phase 9, so v2.0 starts at Phase 10).

### Extraction & Navigation

Prerequisites for the membership cards UI — `WallecxApp.vue` must become a tabbed shell before membership components can be added.

- [x] **XTAB-01**: Vaccination logic extracted into `VaccinationsTab.vue`; `WallecxApp.vue` becomes a `<Tabs>` shell with "Vaccinations" and "Membership Cards" tabs — both tabs visible and navigable
- [x] **XTAB-02**: All existing vaccination features (group card view, search/sort, view toggle, edit/delete in drawer) work identically after the extraction — no regression

### Backend (PocketBase)

- [ ] **MBACK-01**: A `wallecx_memberships` PocketBase collection exists with fields: `user` (relation, required), `card_name` (text, required), `issuer` (text, optional), `barcode_value` (text, optional), `barcode_type` (text, optional — values: qr / code128 / ean13 / code39 / number), `card_number` (text, optional), `expiry_date` (date, optional), `notes` (text, optional), `card_color` (text, optional — hex value without `#`), `card_image` (file, optional, single)
- [ ] **MBACK-02**: All 5 collection rules enforce per-user access (same pattern as `wallecx_vaccinations`): listRule/viewRule/updateRule/deleteRule → `@request.auth.id != "" && user = @request.auth.id`; createRule → `@request.auth.id != "" && @request.body.user = @request.auth.id`
- [ ] **MBACK-03**: Two-user smoke test confirms user A's membership cards are inaccessible to user B across all five access types (list/view/update/delete/file)

### Frontend Foundation

- [ ] **MFRONT-01**: Type module `src/types/wallecx/memberships/types.d.ts` exports `interface Memberships extends RecordModel` (all fields) and `type AddMembership = Omit<Memberships, 'id' | 'created' | 'updated'>`
- [ ] **MFRONT-02**: Mapper module `src/lib/pocketbase/membershipMapper.ts` exports `mapToUpdateMembership(record: Memberships)` returning a writable subset (strips `id`, `created`, `updated`, `user`, `card_image`)
- [ ] **MFRONT-03**: `qrcode.vue@^3.9.1` and `jsbarcode@^3.12.3` installed and committed to `package.json`; `npm run build` passes

### Barcode Display

- [ ] **SCAN-01**: `BarcodeDisplay.vue` renders QR codes via `qrcode.vue` on a white background panel when `barcode_type === 'qr'`; uses SVG render mode
- [ ] **SCAN-02**: `BarcodeDisplay.vue` renders linear barcodes (code128, ean13, code39) via `jsbarcode` on SVG; entire render call is wrapped in `try/catch` with a plain-number fallback displayed on invalid input (EAN-13 checksum failure, Code39 invalid charset, etc.)
- [ ] **SCAN-03**: Tapping the barcode opens a full-screen scan overlay: white background regardless of `card_color`, screen brightness boost (`filter: brightness(1.4)`), screen wake lock via `navigator.wakeLock.request('screen')` (feature-detected + `try/catch` graceful degrade); iOS Safari uses `position: fixed; inset: 0; z-index: 9999` overlay (not the Fullscreen API); close button always visible
- [ ] **SCAN-04**: When `barcode_value` is absent, `BarcodeDisplay.vue` shows `card_number` in large text as fallback; when both are absent, shows a "No barcode" placeholder message

### Read Path

- [ ] **MREAD-01**: `MembershipCard.vue` tile displays: card name, issuer, barcode type badge, and expiry date; background colour uses `card_color` (CSS binding always prepends `#`; defaults to navy `#002244` when absent); expiry warning badge shown if expiry is ≤ 30 days away or already past
- [ ] **MREAD-02**: `MembershipsTab.vue` renders the membership cards as a grid with skeleton loading / empty state / error state (same three-state pattern as vaccinations)
- [ ] **MREAD-03**: Tapping a `MembershipCard.vue` tile opens `MembershipDetail.vue` with all fields displayed and `BarcodeDisplay.vue` embedded; tapping the barcode within the detail view opens the full-screen scan overlay (SCAN-03)
- [ ] **MREAD-04**: `card_image` photo preview in `MembershipDetail.vue` reuses the `AttachmentPreview.vue` component pattern (image → `<img>` with thumb URL; unknown MIME → download link)

### Write Path

- [ ] **MWRITE-01**: `ManageMembership.vue` PrimeVue Dialog form for both create and edit, validated by Zod schema via `@primevue/forms` `zodResolver`; `card_name` is required; all other fields optional
- [ ] **MWRITE-02**: Form includes: `barcode_type` dropdown (QR / Code128 / EAN-13 / Code39 / Number only), `barcode_value` text input (shown when barcode type is not "Number only"), `card_number` text input (plain fallback always available)
- [ ] **MWRITE-03**: `card_color` field uses PrimeVue `ColorPicker`; value stored and passed as hex without `#` (matching ColorPicker's emit format); CSS background bindings in all display components always prepend `#`
- [ ] **MWRITE-04**: Optional `card_image` file upload via `<FileUpload mode="basic" :auto="false">` with MIME allowlist `image/jpeg,image/png,image/webp` and 10 MB cap (mirrors vaccination card upload pattern)
- [ ] **MWRITE-05**: Create flow returns server record and `Object.assign`s into local item (avoids save-loop bug); update flow uses `mapToUpdateMembership`; delete flow: confirm dialog → `pb.delete()` → splice → success toast; on failure no splice + error toast; all flows gated by `isSaving` ref
- [ ] **MWRITE-06**: Vitest `membershipMapper.spec.ts` covers `mapToUpdateMembership` field-strip and the create-then-update id-refresh contract (mirrors `vaccinationMapper.spec.ts` pattern)

---

## v3 Requirements (Deferred)

Tracked but not in this milestone.

### Enhanced Barcode Support

- **SCAN-ADV-01**: PDF417 and Aztec code formats (transport/government passes) via dynamic `bwip-js` import
- **SCAN-ADV-02**: Auto-detect barcode type from a photo of the card (ZXing camera scanning)

### Search & Organisation

- **ORG-01**: Search/filter membership cards by name or issuer (client-side, same toolbar pattern as vaccinations)
- **ORG-02**: Sort by card name, issuer, or expiry date
- **ORG-03**: Card categories/groups (loyalty, membership, insurance, ID)

### Convenience

- **CONV-01**: JSON export of all membership card records
- **CONV-02**: Share a card via signed read-only link
- **CONV-03**: Expiry date reminders (requires notification infrastructure)

### Out of Scope

| Feature | Reason |
|---------|--------|
| Apple Wallet / Google Wallet export | Requires server-side certificate signing — out of scope for a static SPA |
| NFC tap-to-add | Browser SPA cannot reliably access NFC hardware |
| Live points balance / account integration | Requires per-issuer OAuth / scraping — excessive complexity |
| Barcode camera scanning to populate value | ZXing build cost exceeds manual entry benefit for v2.0 |
| Multi-language / localization | English only, matching the rest of Lexarium |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| XTAB-01 | Phase 10 | Verified (2026-05-13) |
| XTAB-02 | Phase 10 | Verified (2026-05-13) |
| MBACK-01 | Phase 11 | Pending |
| MBACK-02 | Phase 11 | Pending |
| MBACK-03 | Phase 11 | Pending |
| MFRONT-01 | Phase 11 | Pending |
| MFRONT-02 | Phase 11 | Pending |
| MFRONT-03 | Phase 11 | Pending |
| SCAN-01 | Phase 12 | Pending |
| SCAN-02 | Phase 12 | Pending |
| SCAN-03 | Phase 12 | Pending |
| SCAN-04 | Phase 12 | Pending |
| MREAD-01 | Phase 12 | Pending |
| MREAD-02 | Phase 12 | Pending |
| MREAD-03 | Phase 12 | Pending |
| MREAD-04 | Phase 12 | Pending |
| MWRITE-01 | Phase 13 | Pending |
| MWRITE-02 | Phase 13 | Pending |
| MWRITE-03 | Phase 13 | Pending |
| MWRITE-04 | Phase 13 | Pending |
| MWRITE-05 | Phase 13 | Pending |
| MWRITE-06 | Phase 13 | Pending |

**Coverage:**
- v2.0 requirements: 22 total
- Mapped to phases: 22 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-05-13*
*Traceability filled: 2026-05-13 — all 22 requirements mapped across Phases 10–13*
