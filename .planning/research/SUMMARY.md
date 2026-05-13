# Project Research Summary - Wallecx v2.0 Membership Cards

**Project:** Wallecx v2.0 - Membership / Loyalty Card Wallet
**Domain:** Barcode/QR rendering, fullscreen scan overlay, second PocketBase vault record type
**Researched:** 2026-05-13
**Confidence:** HIGH (stack, architecture, pitfalls verified against live codebase and official docs); MEDIUM (differentiator value judgments)

---

## Executive Summary

Wallecx v2.0 adds a Membership Cards vault alongside the existing Vaccination Records slice. The core UX is a coloured card grid where each card stores a barcode value and type; tapping a card opens a fullscreen scan overlay that centres the barcode on a white background for checkout scanner use. The feature follows every v1.0 convention (mapper pair, per-user PocketBase rules, Zod + PrimeVue form pattern, vue-sonner toasts) and introduces exactly two new runtime dependencies: qrcode.vue ^3.9.1 for QR codes and jsbarcode ^3.12.3 for linear barcodes. @vueuse/core useFullscreen is already on disk as a hoisted dependency of @vueuse/motion.

The critical structural change for v2.0 is a mandatory refactor of WallecxApp.vue: the existing vaccination logic must be extracted into a VaccinationsTab.vue component before any membership work begins. Without this extraction, adding memberships doubles the state surface of an already-large component. The architecture is deliberate: WallecxApp.vue becomes a thin tab shell; VaccinationsTab.vue and MembershipsTab.vue each own their own state independently; no Pinia store is needed because neither tab communicates with the other.

The dominant risks are in two clusters. First, barcode rendering silently fails unless every JsBarcode call is wrapped in try/catch with a plain-text fallback, and barcodes must always render on a white background regardless of card colour (counter scanners require minimum 4.5:1 contrast). Second, the PrimeVue ColorPicker has three documented bugs: emits hex without a leading hash, misinterprets 3-digit shorthand, and ignores initial values when used inside a PrimeVue Form wrapper. Both clusters must be addressed from day one.

---
## 1. Recommended Stack Additions

Two new runtime dependencies only.

| Package | Version | Gzip | Purpose |
|---------|---------|------|---------|
| qrcode.vue | ^3.9.1 | ~17 KB | QR rendering to SVG; zero peer deps; Vue 3 native; published 2026-05-12 |
| jsbarcode | ^3.12.3 | ~11 KB | 1D barcode rendering (CODE128, EAN13, EAN8, CODE39); renders to SVG element |
| @vueuse/core useFullscreen | 13.9.0 hoisted | ~0 KB | Already on disk - no install needed |

Total marginal gzip: ~28 KB. Both land in a lazy async chunk; the initial Lexarium bundle is unaffected.

Install: npm install qrcode.vue@^3.9.1 jsbarcode@^3.12.3

Explicit non-picks: bwip-js (960 KB for 100+ formats vs 11 KB for 4 needed), qrcode-vue3 (unmaintained), Dialog maximizable as fullscreen replacement (Dialog chrome wastes scan area).

JsBarcode Vite/Rolldown note: JsBarcode ships CJS only. Rolldown handles CJS interop natively. If dev server warnings appear add optimizeDeps.include: [jsbarcode] to vite.config.ts.

---

## 2. Feature Table Stakes

Must-have for v2.0 launch. Missing any makes the feature feel incomplete.

| Feature | Complexity | Notes |
|---------|------------|-------|
| wallecx_memberships collection with per-user rules on all 5 operations | LOW | Must be first task; two-user smoke test gate before any UI |
| Coloured card grid 2-column default | LOW-MED | MembershipCard.vue tiles; colour from card_colour hex field |
| Barcode/QR rendering from stored value + type | MED | JsBarcode 1D; qrcode.vue QR; SVG output only, not canvas |
| Full CRUD: create / edit / delete | LOW | Mirrors ManageVaccination.vue; isSaving guard required |
| Fullscreen scan overlay on card tap | MED | position fixed viewport overlay (NOT Fullscreen API - broken on iOS); white barcode panel; wake lock |
| Fallback plain number when barcode_value is empty | LOW | Show card_number as large monospace text |
| Expiry date field with visual warning | LOW | Amber badge less than 30 days; red badge past expiry |
| Wallecx tab navigation | LOW | PrimeVue 4 Tabs in refactored WallecxApp.vue; requires VaccinationsTab.vue extraction first |
| Screen wake lock during fullscreen scan | LOW-MED | navigator.wakeLock.request in try/catch; graceful degrade |
| Empty state, loading, error toasts | LOW | Mirrors vaccination pattern |
| Confirm before delete | LOW | PrimeVue ConfirmDialog singleton in WallecxApp.vue |

Default barcode type: CODE128 - most universally supported for retail/loyalty POS scanners. User selects override from dropdown with plain-English descriptions.

Defer to v2.x: search + sort on membership grid, card category filter, grid/list view toggle, screen brightness API, landscape orientation hint, PDF417/Aztec via bwip-js.

Out of scope: NFC tap-to-add, Apple/Google Wallet export (requires PassKit signing), live points balance, barcode camera scanning, geolocation reminders, sharing/public links.

---

## 3. Architecture Decision

Decision: PrimeVue Tabs inside WallecxApp.vue (not sub-routes)

Sub-routes were evaluated and rejected: they require a non-trivial router restructure, break existing bookmarks to /projects/wallecx, and no other Lexarium mini-app uses child routes for tab-like switching. src/router/index.ts is unchanged.

### Critical Refactor: VaccinationsTab.vue Extraction

This is mandatory before membership work begins.

Build order:
  Step 4 BLOCKER: Extract VaccinationsTab.vue
    Mechanical move of all vaccination state, computed props, handlers, template from WallecxApp.vue
    Verify vaccinations still work identically (pure refactor, no behaviour change)
  Step 5: Add Tabs wrapper to WallecxApp.vue
    Wrap VaccinationsTab in Tabs + TabPanels; stub MembershipsTab in second panel
    Verify tab switching and Aura styling
  Steps 6-11: Build MembershipsTab content
    MembershipsTab.vue (fetch + state)
    BarcodeDisplay.vue (built first so both card + detail can embed it)
    MembershipCard.vue (tile; embeds BarcodeDisplay)
    MembershipDetail.vue (fullscreen scan overlay)
    ManageMembership.vue (create/edit dialog)
    Delete flow in MembershipsTab.vue

Component map post-v2.0:
  WallecxApp.vue (tab shell + shared ConfirmDialog)
    VaccinationsTab.vue (all vaccination state extracted from WallecxApp)
      WallecxToolbar / VaccinationGroupCard / VaccinationGroupPanel
      ManageVaccination / VaccinationDetail / AttachmentPreview (all unchanged)
    MembershipsTab.vue (new - owns membership state)
      MembershipCard.vue (new - coloured tile)
      ManageMembership.vue (new - create/edit dialog)
      MembershipDetail.vue (new - fullscreen scan overlay)
        BarcodeDisplay.vue (new - isolated, purely presentational renderer)

Key pattern decisions:
- Tab-root state ownership: each tab owns its own state; WallecxApp.vue holds only active tab index
- Separate toolbar: MembershipsToolbar.vue (copy-adapt, not genericised) - different sort dimensions
- Mapper pair: src/types/wallecx/memberships/types.d.ts + src/lib/pocketbase/membershipMapper.ts
- BarcodeDisplay.vue is purely presentational - no PocketBase calls; reusable by future vault types
- card_colour stored WITHOUT hash prefix (matches ColorPicker emit); use toCSS(hex) utility in all CSS bindings
- No new Pinia store needed; local refs per tab root are sufficient

New PocketBase collection (wallecx_memberships):
  Fields: user (relation, cascadeDelete), card_name (required max 200), issuer, barcode_value (max 500),
    barcode_type (qr|code128|ean13|code39), card_number (max 100), expiry_date, notes,
    card_colour (max 6, regex [0-9a-fA-F]{6}), card_photo (file image/* 10 MB thumbs 100x100 + 400x400)
  All 5 rules: @request.auth.id != empty AND user = @request.auth.id
    (createRule uses @request.data.user)
  Index: user + card_name ASC

---

## 4. Top Pitfalls to Avoid

Numbered in priority order. Full mitigations in PITFALLS.md.

1. JsBarcode throws uncaught exception on invalid input (BR-1) - CRITICAL
   JsBarcode has no soft-fail mode. Invalid format/value combos (wrong length for EAN-13, lowercase
   in Code39, empty string) throw a synchronous Error crashing the component with a blank area.
   Wrap every JsBarcode() call in try/catch; on catch render card_number as large plain text with
   Barcode unavailable caption. Add Zod pre-validation per format. Never pass empty string.

2. PrimeVue ColorPicker emits hex WITHOUT the leading hash (CP-1) - HIGH
   ColorPicker v-model emits 002244 not #002244. Direct use in :style produces transparent tiles.
   Store without hash. Create toCSS(hex) utility and apply in ALL CSS bindings.
   Zod validates [0-9a-fA-F]{6}. Default for new cards: 1a56db.

3. iOS fullscreen API does nothing - use viewport overlay (FS-2) - HIGH
   requestFullscreen() on non-video elements is unsupported on iPhone (iOS < 26; majority of
   current devices). Do not use the Fullscreen API. Use position: fixed; inset: 0; z-index: 9999
   viewport overlay - works identically on all devices.

4. Screen dims mid-scan - Wake Lock is required (FS-1) - HIGH
   Screen auto-dims at checkout making barcode disappear. Call navigator.wakeLock.request(screen)
   in try/catch when scan overlay opens. Release in onUnmounted and tab-hidden. Re-acquire on
   visibilitychange. Guard with wakeLock in navigator for pre-iOS 16.4.

5. White background behind barcodes is non-negotiable (BR-2) - HIGH
   Dark-on-dark and red-foreground barcodes fail counter scanners (minimum 4.5:1 contrast).
   Use BARCODE_FOREGROUND=#000000 and BARCODE_BACKGROUND=#ffffff constants - no user override.
   Wrap SVG in bg-white p-2 rounded-md container.

6. ColorPicker initial value ignored inside PrimeVue Form (CP-3) - HIGH
   PrimeVue issue #8135 (unfixed 2026-05-13). ColorPicker inside Form always starts showing red.
   Do not use @primevue/forms controlled system for ManageMembership.vue.
   Use direct v-model refs same pattern as ManageVaccination.vue.

7. PocketBase auto-cancel silently drops parallel collection fetches (MR-5) - MEDIUM
   Use distinct requestKey strings on every getFullList call to opt out of auto-cancellation.
   Example: pb.collection(wallecx_memberships).getFullList({ requestKey: memberships-init })

8. Per-user isolation rules missing on new collection (MR-2) - CRITICAL first-task gate
   Apply all 5 rules before any frontend work. Two-user smoke test required.
   Definition of Done gate for collection creation.

9. Watcher fires before SVG element mounts (BR-5) - MEDIUM
   Use useTemplateRef and check svgRef.value before calling JsBarcode.
   Pattern: onMounted(render) + watch(barcodeValue, render) without immediate.

10. WallecxApp.vue state explosion from two record types (MR-3) - MEDIUM
    Extract VaccinationsTab.vue as dedicated step. WallecxApp.vue must own only the active tab index.

---

## 5. Research Flags

| Flag | Confidence | Recommendation |
|------|------------|----------------|
| useFullscreen iOS CSS fallback exact implementation | MEDIUM | Verify on real iPhone hardware; 30-min test is more valuable than further research |
| Wake Lock re-acquisition on visibilitychange in PWA mode | MEDIUM | Implement as documented on MDN and smoke-test |
| Vite code-split group for qrcode.vue + jsbarcode | LOW | Add memberships chunk group from STACK.md if build report shows vendor chunk bleed |
| card_colour server-side regex on PocketBase text field | LOW | Configure in PocketBase admin UI during collection setup |
| MembershipsToolbar.vue vs deferred search/sort | LOW | Optional for v2.0 MVP; flag as add-if-time-allows in polish phase |

Phases needing /gsd-research-phase: Phase implementing BarcodeDisplay.vue and fullscreen scan.
  iOS fallback, wake lock re-acquisition, and JsBarcode try/catch have subtle ordering requirements.

Phases following standard patterns (no research needed): Collection setup, ManageMembership.vue
  form, membershipMapper.ts - all direct mirrors of established vaccination patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack additions | HIGH | qrcode.vue v3.9.1 verified live; jsbarcode v3.12.3 verified; @vueuse/core v13.9.0 confirmed hoisted; bundle sizes measured from installed dist |
| Features | HIGH table stakes / MEDIUM differentiators | Apple PassKit + Google Wallet + Stocard/FidMe/Barcodes app survey; per-category barcode defaults are inference |
| Architecture | HIGH | Direct inspection of existing Wallecx + LexTrack codebase; PrimeVue 4 Tabs API confirmed in installed package |
| Pitfalls | HIGH BR-1/CP-1/FS-2 / MEDIUM FS-1/MR-5 | BR-1 verified JsBarcode issues; CP-1 in PrimeVue docs; FS-2 caniuse + Apple Dev Forums |

Overall confidence: HIGH

Gaps: iOS fullscreen CSS fallback not tested on real hardware - implement and smoke-test, not research further. Per-card-type barcode defaults are industry inference; CODE128 default with user override is the correct hedge.

---

## Sources

- qrcode.vue GitHub https://github.com/scopewu/qrcode.vue
- JsBarcode GitHub https://github.com/lindell/JsBarcode
- useFullscreen VueUse docs https://vueuse.org/core/usefullscreen/
- Apple Wallet PassKit https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/Creating.html
- Screen Wake Lock API MDN https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- caniuse Wake Lock https://caniuse.com/wake-lock
- caniuse Fullscreen API https://caniuse.com/fullscreen
- PrimeVue ColorPicker docs https://primevue.org/colorpicker/
- PrimeVue issue 8135 https://github.com/primefaces/primevue/issues/8135
- JsBarcode issues 269 and 212 https://github.com/lindell/JsBarcode/issues/269
- Scandit barcode type guide https://www.scandit.com/resources/guides/types-of-barcodes-choosing-the-right-barcode/
- CardPrinting.com barcode types https://www.cardprinting.com/page/common-barcode-types
- Internal: WallecxApp.vue, LexTrackApp.vue, ManageVaccination.vue, vaccinationMapper.ts, .planning/PROJECT.md, .planning/codebase/CONVENTIONS.md

---

<details>
<summary>v1.0 Research (Wallecx Phase 1 - Vaccination Records, 2026-05-10)</summary>

# Project Research Summary

**Project:** Wallecx — Personal Records Vault (Phase 1: Vaccination Records)
**Domain:** Authenticated CRUD mini-app with file attachments inside the existing Lexarium SPA
**Researched:** 2026-05-10
**Confidence:** HIGH

## Executive Summary

Wallecx Phase 1 is a thin, opinionated feature slice on top of an already-built Lexarium SPA. The job is to let an authenticated user create, view, edit, and delete their own vaccination records — text fields plus an attached scan/photo of the card — and nothing else. The research is unanimous: every architectural primitive needed already exists in the codebase (Vue 3 + Vite 8, PrimeVue 4 Aura, Pinia auth store, Vue Router with `requiresAuth` guard, PocketBase client singleton, Tailwind v4, Zod + `@primevue/forms`, `dompurify`, `vue-sonner`, `dayjs`). Only **two net new runtime dependencies** are recommended: `browser-image-compression` for shrinking phone-camera attachments and `vue-pdf-embed` for rendering uploaded PDF certificates safely.

The recommended approach is to **mirror LexTrack**: a single route component (`WallecxApp.vue`) holds local `ref` state, four sibling components handle list / manage / detail / attachment-preview, a flat mapper module wraps PocketBase writes, and a single `wallecx_vaccinations` collection (deliberately specific, not a polymorphic vault table) holds the data. FHIR / SMART Health Card / coded vocabularies are explicitly rejected for v1 — there is no interop partner and the user wants "save and view," not clinical exchange.

The dominant risk is **privacy regression via copy-pasted Lexarium anti-patterns**. Five known live-codebase bugs in LexTrack and Gift Exchange (filter-string interpolation, save-loop never refreshing IDs, delete-only-mutates-local-state, client-only auth gates, `v-html` near user input) will copy into Wallecx unless explicitly prevented. Mitigation is mechanical: server-side per-user PocketBase rules on all five operations, parameterised filter syntax (`{:name}`), a mapper that returns the server-issued record so subsequent saves PATCH instead of POST, an `await pb.delete()` before any local splice, and EXIF stripping of uploaded photos via canvas re-encode. The PDF preview path adds a sixth concern (CVE-2024-4367 in `pdfjs-dist` < 4.2.67); pinning the version and rendering via canvas (which `vue-pdf-embed` does for us) closes it.

## Key Findings

### Recommended Stack

The Lexarium stack is locked and sufficient. Wallecx adds two runtime dependencies — both small, both for the file-attachment story.

**Net new dependencies (2):**
- `browser-image-compression` ^2.0.2 — ~12 kB, web-worker capable; compresses 3–8 MB phone photos to ~1.5 MB before upload, preserves orientation. Skip for PDFs and small images. *Why:* phone-camera attachments otherwise blow past PocketBase body-size limits and clog storage.
- `vue-pdf-embed` ^2.1.4 — Vue-3-only `pdfjs-dist` wrapper, MIT, actively maintained, accepts URL/Blob/ArrayBuffer. Lazy-load via `defineAsyncComponent` so `pdfjs-dist` (~350 kB gzipped) only ships when a record with a PDF is opened. *Why:* `<iframe>` previews break under the existing CSP `frame-src 'none'` and `<embed>` is inconsistent across browsers; raw `pdfjs-dist` requires hand-rolled canvas glue. `vue-pdf-embed` renders to canvas (sidesteps CVE-2024-4367-class XSS via `v-html`).

**Reused (already on disk):** `pocketbase` ^0.26.2 (file uploads via plain object — SDK auto-handles multipart), `primevue` ^4.3.7 (`FileUpload mode="basic"` + `:auto="false"` + `@select`; **avoid** `customUpload` due to open issue #7664), `zod` ^4.1.5 + `@primevue/forms` `zodResolver` (matches existing `Login.vue` pattern), `dayjs` (`"YYYY-MM-DD"` format for PocketBase date fields), `vue-sonner` (toasts), `dompurify` (only if rich text is ever introduced — v1 is plain text).

**Explicitly rejected:** FHIR Immunization resource (no interop partner, 30+ fields, schema explosion), `vue-pdf` (unscoped, last meaningful update June 2021), `<iframe>` PDF preview (breaks CSP, no zoom control), `uppy`/`filepond` (heavyweight for one-file-per-record), `quill` for notes (adds DOMPurify on the read path for zero v1 value), VeeValidate / Yup / Valibot (would fragment the existing Zod + PrimeVue Forms convention).

Full detail: `.planning/research/STACK.md`.

### Expected Features

**Must have (v1 launch — confirmed in PROJECT.md and surveyed against Apple Health, MyChart, CommonHealth, VaxYes, Vaccy, VaxTrack):**
- Auth-gated `/projects/wallecx` route (route guard + PocketBase rules)
- PocketBase `wallecx_vaccinations` collection with per-user rules on **all five** operations
- Fields: `vaccine_name`, `date_administered`, `dose_number`, `lot_number`, `location`
- Optional file attachment (image OR PDF) per record on a single `card`/`attachment` field
- List view sorted by date administered (newest first)
- Detail view showing all fields + attachment preview (image inline, PDF via `vue-pdf-embed`)
- CRUD via PrimeVue dialogs (LexTrack pattern), confirm-before-delete
- Empty / loading / error states; `vue-sonner` toasts on success/failure
- Wallecx tile in `ProjectsView.vue` projects directory
- Lexarium navy/amber + Rubik styling — no bespoke palette

**Recommended additions for v1 (flagged by FEATURES.md, low cost, high meaning):**
- `manufacturer` field — optional free-text. Printed on every paper card; distinguishes Pfizer vs Moderna for the same "COVID-19 vaccine" name. Trivial to add.
- `notes` field — optional plain-text textarea (NOT rich text). Captures everything the structured fields don't. Render with `{{ notes }}`, never `v-html`.

**Should have (v1.x post-launch polish, deferred):**
- Client-side filter / search by vaccine name
- Sort toggle (date asc/desc, name)
- Multi-file per record (front + back of card)
- Tag/category field
- JSON / CSV export ("download all my data" — trust signal for a privacy-focused vault)

**Defer (v2+ / future Wallecx phases):**
- Other vault record types (identity docs, prescriptions, lab results) — Phase 2+, the explicit Wallecx roadmap. Schema *allows* this; we do not pre-build it.
- Family / dependent profiles
- PDF summary export
- Reminders for upcoming doses (Lexarium has no notification infra)
- Share via signed link
- OCR auto-fill from card photo
- SMART Health Card / FHIR import
- CDC-schedule-aware "what's due"
- Coded vocabularies (CVX/SNOMED)

Full detail: `.planning/research/FEATURES.md`.

### Architecture Approach

Wallecx is one lazy-loaded route, one PocketBase collection, one mapper, one type module, and five Vue SFCs in `src/components/projects/wallecx/`. No Pinia store (state lives in `WallecxApp.vue` `ref`s, mirroring LexTrack). No `WallecxView.vue` shell — go straight from router to `WallecxApp.vue` (matches `LargaApp.vue` and `ApiPlaygroundApp.vue`). Subcomponent names must be prefixed (`VaccinationList.vue`, `VaccinationDetail.vue`, `ManageVaccination.vue`, `AttachmentPreview.vue`) to avoid `unplugin-vue-components` global-name collisions with PrimeVue.

**Build order (dictated by dependency, every step independently mergeable):**

1. **PocketBase schema + rules** — create `wallecx_vaccinations` collection with all five per-user rules and `(user, date_administered DESC)` index. Two-user smoke test before merge. *Risk gate.*
2. **Type module** — `src/types/wallecx/vaccinations/types.d.ts` exporting `Vaccinations extends RecordModel` and `AddVaccination`.
3. **Mapper** — `src/lib/pocketbase/vaccinationMapper.ts` with `mapToUpdateVaccination` (strips `id`/`created`/`updated`/`user`/`card`).
4. **Route + auth gate** — register `/projects/wallecx` lazy route with `meta: { requiresAuth: true }`.
5. **`WallecxApp.vue` shell** — `onMounted` fetch via `getFullList<Vaccinations>({ sort: '-date_administered' })`. Verifies the entire stack end-to-end.
6. **`VaccinationList.vue`** — emits `view`/`edit`/`remove`.
7. **`AttachmentPreview.vue`** — image-or-PDF branching renderer. Built before Detail/Manage so both consume it.
8. **`VaccinationDetail.vue`** — read-only panel using `AttachmentPreview`.
9. **`ManageVaccination.vue`** — create/edit dialog with `zodResolver`, FormData create + mapper-based update, EXIF strip + image compression on upload.
10. **Delete flow** — confirm dialog -> `await pb.collection().delete(id)` -> splice -> toast (in that order).
11. **Projects directory tile** — last, so the link only appears when the destination works.
12. **Seed tests (optional but flagged)** — mapper unit test (create-then-update sequence) + route guard test.

Full detail: `.planning/research/ARCHITECTURE.md`.

### Critical Pitfalls

The five highest-priority risks — all repo-precedent (existing Lexarium bugs that will copy-paste into Wallecx unless explicitly prevented):

1. **Per-user isolation enforced only client-side (CRITICAL)** — Set all five collection rules: `listRule`/`viewRule`/`updateRule`/`deleteRule` = `@request.auth.id != "" && user = @request.auth.id`; `createRule` = `@request.auth.id != "" && @request.data.user = @request.auth.id`. The route guard is UX only. Verify with a second user in incognito before merge.
2. **Filter-string injection (HIGH)** — Eleven existing call sites in the codebase use template-literal filters. Use parameterised syntax (`'name = {:name}'`, `{ filter: { name } }`) everywhere. Add a CI grep to fail builds on template-literal filters in Wallecx files and the mapper.
3. **Save loop never refreshes IDs (HIGH)** — Repo precedent: `LexTrackView.vue:127-165`. Mapper contract: `createVaccination` must `return` the server response and the caller must `Object.assign(item, created)` so subsequent saves PATCH (not POST another duplicate record + orphan attachment).
4. **Delete only mutates local state (HIGH)** — Repo precedent: `LexTrackView.vue:42-91` (`removeSupport`/`removeMeeting`/`removeTask`). Always `await pb.collection().delete(id)` *before* the local splice. On failure, do NOT splice. Spec the failure path.
5. **Orphan files on record delete (HIGH)** — PocketBase issue #151: cascade-delete via relations does not remove files. Keep the `card` file field on the same record (NOT a separate `wallecx_vaccination_files` collection). Verify file URL 404s within ~5s post-delete in the smoke test.

**Also high-priority for Wallecx specifically:**
- **EXIF GPS leak (HIGH privacy)** — phone photos embed home GPS coordinates. Strip via canvas re-encode (`canvas.toBlob('image/jpeg', 0.92)`) before upload. Surface in UI: "We've removed location data from your photo." Pairs naturally with `browser-image-compression`.
- **PDF.js XSS / CVE-2024-4367 (HIGH)** — pin `pdfjs-dist` >= 4.2.67 (transitive via `vue-pdf-embed`); render to canvas (which `vue-pdf-embed` does); CSP narrowly adds `worker-src 'self' blob:`, do NOT relax `script-src` globally.
- **File URLs public-by-knowledge (MEDIUM)** — set `protected: true` on the `card` field; generate short-lived tokens at view time, not list time.
- **Dev-login credentials in production bundle (CRITICAL operational)** — Phase 0 cleanup: remove `VITE_LOGIN_*` from `env.d.ts` and all call sites; rotate `local.jsonc` creds; CI grep `src/` for `VITE_LOGIN_`.

Full detail (13 pitfalls + recovery strategies + "Looks Done But Isn't" checklist): `.planning/research/PITFALLS.md`.

## Implications for Roadmap

The user picked **coarse** granularity (3–5 phases, 1–3 plans each). Suggested phase structure follows the architecture build order, groups co-deliverable work, and front-loads the privacy-critical foundation.

### Phase 0 (or first task of Phase 1): Pre-Wallecx Cleanup
**Rationale:** Pitfall 13 is CRITICAL operational and pre-existing. Wallecx multiplies its blast radius (real health data). Cheaper to scrub once before adding sensitive surface than to retrofit.
**Delivers:**
- Remove `VITE_LOGIN_*` from `env.d.ts` and all call sites under `src/`
- Rotate any credentials that ever sat in `local.jsonc`
- CI grep guard against re-introduction
**Avoids:** Pitfall 13 (dev creds in production bundle).
**Note for roadmapper:** Tiny scope. Either a standalone Phase 0 (cleanest) or first plan inside Phase 1.

### Phase 1: Foundations — Schema, Rules, Types, Mapper, Route Shell
**Rationale:** This is the privacy-critical core. Server-side rules are non-negotiable; everything else builds on them. Get the foundation right, smoke-test cross-user isolation, then build UI on top.
**Delivers:**
- `wallecx_vaccinations` PocketBase collection with all 5 rules + `(user, date_administered)` index
- File field with `protected: true`, MIME allowlist (`image/jpeg|png|webp`, `application/pdf`), 10 MB cap, thumbs `100x100` + `400x0`
- Type module + mapper module
- Lazy-loaded `/projects/wallecx` route with `requiresAuth`
- Stub `WallecxApp.vue` that renders `getFullList` results (no edit path yet)
- Two new dependencies installed: `browser-image-compression`, `vue-pdf-embed`
- Two-user smoke test: user A's records invisible to user B
**Uses (from STACK.md):** PocketBase SDK plain-object create, parameterised filter syntax, Zod + `@primevue/forms` (set up but not yet exercised).
**Avoids:** Pitfalls 1, 2, 6, 8, 9 (all foundation-level).
**Roadmapper note:** This is the critical path. Plans here are small but each must land cleanly before the next; consider 2–3 plans (schema + rules; types + mapper + route; auth-isolation smoke test).

### Phase 2: Read Path — List, Detail, Attachment Preview
**Rationale:** "Read works correctly" is a meaningful checkpoint. Read paths are simpler than write paths and prove the type/mapper/auth wiring without the file-upload, EXIF-strip, save-loop complexity.
**Delivers:**
- `VaccinationList.vue` — date-sorted table/cards, emits `view`/`edit`/`remove`
- `AttachmentPreview.vue` — image (`<img>` with `?thumb=400x400`) and PDF (`vue-pdf-embed`, lazy-loaded) branches; uses MIME/extension sniff
- `VaccinationDetail.vue` — read-only panel embedding `AttachmentPreview`
- Empty / loading / error states (`vue-sonner` toasts)
- Watcher with `{ immediate: true }` to avoid empty-state flash
- CSP update: narrow `worker-src 'self' blob:` for `pdfjs-dist`
**Uses:** `vue-pdf-embed`, PrimeVue DataTable + Dialog, `pb.files.getURL` with thumbs.
**Avoids:** Pitfalls 5 (PDF.js XSS — render via canvas, version pinned), 9 (file URLs protected), 12 (watcher-on-mount flash).
**Roadmapper note:** 1–2 plans. Read path can ship without the write path and is independently demoable.

### Phase 3: Write Path — Create / Edit / Delete with Attachments
**Rationale:** All the highest-precedent bugs (3, 4, 7, 11) live in the write path. Concentrating them in one phase lets a single round of QA close them; spreading them across phases risks missed coverage.
**Delivers:**
- `ManageVaccination.vue` — create/edit dialog
  - `zodResolver` form (vaccine_name + date_administered required, dose_number int 1–20, sizes/MIME enforced)
  - Recommended fields included: `manufacturer`, `notes` (plain `<Textarea>`, never `v-html`)
  - PrimeVue `<FileUpload mode="basic" :auto="false" @select>` (avoid `customUpload`)
  - EXIF strip via canvas re-encode + `browser-image-compression` for images; pass-through for PDFs
  - Save state machine: `isSaving` ref disables button + form; mapper returns server record; `Object.assign(item, created)` after first save so re-edits PATCH
- Delete flow: confirm dialog with vaccine name in plain text -> `await pb.collection().delete(id)` -> splice -> toast
- Mapper unit test covering create-then-update sequence (first test in repo)
**Uses:** `browser-image-compression`, `@primevue/forms` `zodResolver`, `dayjs.format('YYYY-MM-DD')`.
**Avoids:** Pitfalls 3 (save loop), 4 (delete-only-local), 7 (EXIF), 8 (file misconfig at upload), 10 (no `v-html` on notes), 11 (double-submit).
**Roadmapper note:** 2 plans (create+edit; delete + mapper test).

### Phase 4: Discovery & Polish
**Rationale:** Once CRUD lands and is in real use, finish the v1 surface and harden. Small, parallelizable items.
**Delivers:**
- Wallecx tile in `ProjectsView.vue` projects directory
- Final visual polish to match navy/amber + Rubik design system
- Route guard test (first test of its kind in the repo)
- "Looks Done But Isn't" checklist run-through (PITFALLS.md "Looks Done But Isn't" section)
- Optional: JSON/CSV "download all my data" button (P2 from FEATURES.md, but cheap and a strong trust signal for a health vault)
**Avoids:** "Surfaced but not discoverable" gap; final regression sweep.
**Roadmapper note:** 1 plan, possibly 2 if "download all my data" is included.

### Phase Ordering Rationale

- **Server-side rules before UI** — every UI decision rests on the assumption that PocketBase enforces ownership. Smoke-test that assumption first.
- **Read before write** — read path exercises types, mapper imports, auth gate, file-URL flow without the write-path bug surface. Failures isolate cleanly.
- **Concentrated write phase** — the four worst repo-precedent bugs (3, 4, 7, 11) all live in create/edit/delete. One phase, one QA pass, all addressed together with `vaccinationMapper.spec.ts` as the regression net.
- **Polish last** — `ProjectsView.vue` tile is the "feature is live" signal. It points at a working feature, not a half-built one.

### Research Flags

**Phases that may need `/gsd-research-phase` during planning:**
- **Phase 2 (Read Path)** — `vue-pdf-embed` integration, lazy-load with Vite, and the narrow CSP update for `worker-src` are the only places where the patterns are not already in the codebase. A short research pass to verify the exact Vite recipe for `pdfjs-dist` worker bundling is worth it.
- **Phase 3 (Write Path)** — EXIF strip via canvas + `browser-image-compression` ordering (which runs first?) and the FormData / mapper-update ordering when a file is replaced vs preserved are subtle. Research a definitive client-side EXIF-stripping snippet and confirm `browser-image-compression`'s EXIF-preserve flag interacts correctly (we want EXIF gone, not preserved).

**Phases that follow standard patterns (skip research-phase):**
- **Phase 0** — text edits and `git grep`. No research.
- **Phase 1** — direct mirror of LexTrack patterns + PocketBase docs already cited in research. No new research needed beyond what's in `STACK.md`/`ARCHITECTURE.md`/`PITFALLS.md`.
- **Phase 4** — pure polish + an existing pattern (the `projects` array). No research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Lexarium stack is locked and observed directly. Net new picks (`browser-image-compression`, `vue-pdf-embed`) verified against npm metadata, GitHub activity, and current PrimeVue/PocketBase documentation. |
| Features | MEDIUM-HIGH | HIGH on FHIR/Apple Health field schemas (authoritative HL7 spec) and on what's table-stakes vs. differentiator. MEDIUM on whether users will actually request family profiles first vs. some other Phase 2 item. |
| Architecture | HIGH | Constrained almost entirely by directly-observed Lexarium conventions in `.planning/codebase/` and the LexTrack reference implementation. No new architectural primitives introduced. |
| Pitfalls | HIGH | All five Critical/High pitfalls are repo-precedent — observed bugs in the existing Lexarium codebase. PDF.js CVE and PocketBase issue #151 verified against official sources. |

**Overall confidence:** HIGH

### Gaps to Address

- **Vite recipe for `pdfjs-dist` worker bundling** — `vue-pdf-embed` documents the standard pattern but our `vite.config.ts` may need a tweak (manual chunks, worker plugin) to keep the `pdfjs-dist` chunk lazy. Resolve during Phase 2 planning via a 10-minute research pass.
- **`browser-image-compression` + EXIF interaction** — the library has a `preserveExif` flag; the canvas re-encode path drops EXIF naturally. Need to confirm the chosen pipeline drops EXIF in all cases (jpeg, png, webp). Resolve during Phase 3 planning with a quick test fixture (photo with known GPS -> upload -> exiftool on stored file).
- **Family-profiles assumption** — FEATURES.md flags this as the #1 likely Phase 2 request. Mitigation: keep `user` relation simple in v1; refactor to "owner OR proxy" only when proxies actually arrive.
- **Test coverage seeding** — the codebase has zero tests today. The plan introduces two (mapper spec, route-guard spec). If these are deferred under time pressure, the regression net for Pitfalls 3/4 is gone. Roadmapper should make these non-optional in Phase 3 / Phase 4 plan acceptance criteria.

## Sources

### Primary (HIGH confidence)
- PocketBase docs — Files handling, API rules, files API (https://pocketbase.io/docs/files-handling/) — file upload semantics, file-field options (mimeTypes, maxSize, thumbs, protected), `?token=`, `?thumb=`
- PocketBase docs — API rules and filters (https://pocketbase.io/docs/api-rules-and-filters/) — `@request.auth.id`, parameterised filter syntax `{:name}`
- PocketBase JS SDK — File upload (https://github.com/pocketbase/js-sdk) — SDK auto-converts File/Blob payloads to multipart
- PocketBase issue #151 — cascade-delete doesn't remove files (https://github.com/pocketbase/pocketbase/issues/151) — basis for single-collection design
- PrimeVue FileUpload docs (https://primevue.org/fileupload) and issue #7664 (https://github.com/primefaces/primevue/issues/7664) — basic-mode + `@select` recommended; avoid `customUpload`
- HL7 FHIR R5/R4 Immunization (https://www.hl7.org/fhir/immunization.html) — standard field schema (basis for v1 field set + "no FHIR adoption" call)
- Codean Labs — CVE-2024-4367 PDF.js arbitrary JS execution (https://codeanlabs.com/blog/research/cve-2024-4367-arbitrary-js-execution-in-pdf-js/) — pin `pdfjs-dist` >= 4.2.67
- vue-pdf-embed npm (https://www.npmjs.com/package/vue-pdf-embed) and GitHub (https://github.com/hrynko/vue-pdf-embed) — chosen PDF renderer
- browser-image-compression npm (https://www.npmjs.com/package/browser-image-compression) — chosen image compressor
- Lexarium internals: `.planning/codebase/STACK.md`, `STRUCTURE.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `INTEGRATIONS.md`, `CONCERNS.md`; `src/components/projects/lextrack/*`, `src/lib/pocketbase/dsuTaskMapper.ts`, `src/router/index.ts`, `src/views/Login.vue`; `.planning/PROJECT.md`

### Secondary (MEDIUM confidence)
- Apple Health, MyChart, CommonHealth, Docket, VaxYes, Vaccy, VaxTrack — surveyed for table-stakes vs differentiator categorization
- npm-compare browser-image-compression vs compressorjs — trade-off rationale
- 2025 Vue PDF library roundup (Vue PDF Viewer blog) — flagged `vue-pdf` (unscoped) as stale
- Multiple 2025 client-side EXIF-strip implementations (exif.tools, SimpleTool) — confirms canvas re-encode drops EXIF

### Tertiary (LOW confidence — needs validation during implementation)
- "Family profiles is the #1 expansion users will request" — competitor-pattern inference; not yet validated against actual Wallecx user behavior
- "OCR is high-cost low-value for v1" — VaxYes is the only major competitor doing it consistently; Tesseract reliability on glossy cards is anecdotal
- "SMART Health Card import is low-value for this audience" — inference based on Wallecx being a personal portfolio mini-app, not an interop product

---
*Research completed: 2026-05-10*
*Ready for roadmap: yes*

</details>

---
*v2.0 research synthesized: 2026-05-13*
*Ready for roadmap: yes*
