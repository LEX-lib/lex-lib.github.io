# Milestones

## v2.0 — Membership Cards

**Shipped:** 2026-05-14
**Phases:** 10–13 (4 phases, 12 plans)
**Timeline:** 2026-05-13 → 2026-05-14 (2 days)
**Requirements:** 22/22 shipped

### Delivered

1. WallecxApp.vue refactored from a 452-line vaccination monolith into a 35-line PrimeVue Tabs shell; VaccinationsTab.vue verbatim-extracts all vaccination state with zero regression
2. `wallecx_memberships` PocketBase collection with 10 fields and 5 per-user access rules; two-user smoke test confirmed cross-user isolation across all access types
3. BarcodeDisplay.vue four-branch renderer (QR/linear/number-fallback/empty) with JsBarcode try/catch guard and qrcode.vue SVG; full-screen scan overlay via Teleport + viewport overlay (iOS-safe) + wake lock
4. MembershipCard.vue coloured tile grid with expiry warnings; MembershipDetail.vue read-only field grid with embedded barcode and card photo preview via refactored AttachmentPreview.vue
5. ManageMembership.vue create/edit dialog with direct v-model refs (ColorPicker issue #8135 workaround), Zod safeParse, conditional barcode_value field, EXIF-stripped FileUpload, isSaving guard, server-first delete
6. membershipMapper.spec.ts Vitest spec (11 tests) locking 5-field strip and id-refresh contract; 24 tests total passing

### Known deferred items at close: 0 (prior deferred items from v1.0 close, already in STATE.md)

**Archive:** `.planning/milestones/v2.0-ROADMAP.md`
**Requirements:** `.planning/milestones/v2.0-REQUIREMENTS.md`

---

## v1.0 — Wallecx MVP

**Shipped:** 2026-05-12
**Phases:** 0–4 (5 phases, 17 plans)
**Timeline:** 2026-05-10 → 2026-05-12 (3 days)
**Requirements:** 33/34 shipped (READ-06 dropped)

### Delivered

1. Stripped dev credentials (VITE_LOGIN_*) from codebase; added `lint:secrets` regression guard — production bundle no longer carries shipped credentials
2. `wallecx_vaccinations` PocketBase collection with server-side per-user isolation — two-user smoke test confirmed cross-user isolation across all access types
3. MIME-branched attachment preview (image/PDF/download) with short-lived view-time tokens and zero `v-html`
4. Full CRUD write path: Zod-validated dialog, EXIF-stripping image pipeline, `isSaving` guard preventing double-submits
5. Projects directory tile, design token audit, JSON export — Wallecx discoverable and design-consistent
6. First repo tests: `vaccinationMapper.spec.ts` (mapper contract) and `guard.spec.ts` (auth redirect)

### Known deferred items at close: 11 (see STATE.md Deferred Items)

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`
**Requirements:** `.planning/milestones/v1.0-REQUIREMENTS.md`
