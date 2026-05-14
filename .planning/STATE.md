---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Membership Cards
status: in_progress
last_updated: "2026-05-14"
last_activity: 2026-05-14 — Phase 13 Wave 2 complete. 13-03 (MembershipDetail.vue emits + MembershipsTab.vue full CRUD wiring) committed. All 24 tests passing. Awaiting human verification checkpoint (browser CRUD flow tests).
progress:
  total_phases: 14
  completed_phases: 12
  total_plans: 39
  completed_plans: 32
  percent: 93
---

# Project State

**Last updated:** 2026-05-14 — Phase 13 execution complete (3/3 plans committed). 13-01 mapper spec, 13-02 ManageMembership.vue, 13-03 MembershipsTab+MembershipDetail wiring. Awaiting human verification checkpoint.

## Project Reference

**Project:** Lexarium — Wallecx v2.0 Membership Cards
**Reference:** see `.planning/PROJECT.md` for full context, requirements, and constraints
**Core value:** Each authenticated user can save and retrieve their own records — vaccination records and now membership/loyalty cards — without ever losing access to them.
**Current focus:** Phase 13 — Write Path: ManageMembership CRUD (next action: `/gsd-discuss-phase 13` or `/gsd-plan-phase 13`)

## Current Position

**Milestone:** v2.0 — Membership Cards
**Phase:** Phase 13 (executed — awaiting human verification)
**Plan:** Phase 13 complete (3/3 plans executed); human verification checkpoint next
**Status:** Phase 13 execution complete. 13-01 (membershipMapper.spec.ts 11 tests), 13-02 (ManageMembership.vue 370 lines), 13-03 (MembershipsTab+MembershipDetail CRUD wiring) all committed. 24 tests passing. Awaiting browser verification.
**Last activity:** 2026-05-14 — Phase 13 executed: 13-03 MembershipsTab write state + MembershipDetail emits committed (908c8cb, ba17bb4)

## Roadmap Snapshot

### v2.0 Phases

| # | Phase | Status | Requirements |
|---|-------|--------|--------------|
| 10 | Tabs Shell — VaccinationsTab Extraction | Complete (2/2 plans) | 2 (XTAB-01, XTAB-02) |
| 11 | Backend + Frontend Foundation | Complete (3/3 plans) | 6 (MBACK-01..03, MFRONT-01..03) |
| 12 | Read Path — Card Grid, Barcode Display & Detail | Complete (4/4 plans) | 8 (SCAN-01..04, MREAD-01..04) |
| 13 | Write Path — ManageMembership CRUD | Planned (3/3 plans ready) | 6 (MWRITE-01..06) |

v2.0 Coverage: 22 / 22 requirements mapped. No orphans.

### Previous Milestones (Complete)

| # | Phase | Milestone | Status |
|---|-------|-----------|--------|
| 0 | Pre-Wallecx Cleanup | v1.0 | Complete |
| 1 | Backend + Frontend Foundation | v1.0 | Complete |
| 2 | Read Path (List + Detail + Preview) | v1.0 | Complete |
| 3 | Write Path (Create / Edit / Delete) | v1.0 | Complete |
| 4 | Discovery & Polish | v1.0 | Complete |
| 5 | Schema, Types & Form Field | v1.1 | Complete |
| 6 | Grouped Card View & Group Detail Panel | v1.1 | Complete |
| 7 | Toolbar — Search & Sort | v1.2 | Complete |
| 8 | View Toggle | v1.2 | Complete |
| 9 | Restore Edit & Delete in Grouped View | v1.2 | Complete |

## Performance Metrics

- Phases shipped (lifetime): 11 (Phase 0–10, all complete)
- Plans shipped (lifetime): 28 (00-01..02, 01-01..03, 02-01..04, 03-01..04, 04-01..04, 05-01..02, 06-01..02, 07-01..02, 08-01..02, 09-01, 10-01..02)
- Requirements verified: 33/34 v1.0 (READ-06 dropped); 7/7 v1.1; 5/5 v1.2; 2/2 Phase 9; 2/2 Phase 10 (XTAB-01, XTAB-02)
- Tests in repo: 13 (vaccinationMapper.spec.ts 10 tests + guard.spec.ts 3 tests)
- v2.0 phases planned: 4 | v2.0 phases complete: 1 (Phase 10 done: 2/2 plans)

## Roadmap Evolution

- Phase 9 added: Restore Edit & Delete in Grouped View (wired back through VaccinationGroupPanel.vue)
- v2.0 roadmap added: Phases 10–13 (2026-05-13)

## Accumulated Context

### Key Decisions (locked at planning time)

- **Mini-app, not separate deployment.** Wallecx ships as a Lexarium mini-app at `/projects/wallecx` mirroring LexTrack's structure (single `WallecxApp.vue`, sibling components, no Pinia store, local `ref` state).
- **Specific schema, not polymorphic vault.** v1 ships `wallecx_vaccinations` with the locked field set; future record types get their own collections rather than a generic discriminator.
- **Server-side per-user isolation is the auth boundary.** All five PocketBase rules enforce ownership; the route guard is UX only.
- **Single `card` file field for both image and PDF.** MIME-sniff at render time; `protected: true` plus short-lived view-time tokens.
- **Two net new runtime deps only.** `browser-image-compression@^2.0.2` and `vue-pdf-embed@^2.1.4`. FHIR rejected.
- **Coarse granularity, 5 phases (v1.0).** Justified by the privacy/security-critical nature even though it sits at the upper edge of "coarse."
- **First repo tests land in Phase 3 / 4.** Mapper spec (Phase 3) and route-guard spec (Phase 4) are non-optional.

### Key Decisions (v1.1 roadmap)

- **vaccine_type is optional in PocketBase schema but required in the form.** Existing records keep empty string (no data loss); the form enforces required for all new and edited records. This avoids a destructive migration while keeping future data clean.
- **2 phases for v1.1.** GROUP-01/02/03 (schema + types + form) land in Phase 5; GROUP-04/05/06/07 (grouped card UI + panel) land in Phase 6. The split ensures the backend field exists before the grouped view queries it.
- **Phase numbering continues from v1.0.** v1.0 ended at Phase 4; v1.1 starts at Phase 5.
- **Phase 6 is UI-heavy.** Grouped card view replaces the flat DataTable; GROUP-07 deliberately reuses the existing `VaccinationDetail.vue` dialog without modification.

### Key Decisions (v1.2 roadmap)

- **2 phases for v1.2.** SEARCH-01/02 and SORT-01 land in Phase 7 (toolbar component + computed filter/sort logic — query-like operations that compose together); VIEW-01/02 land in Phase 8 (presentation-layer layout toggle + session persistence — a separable concern with a clean delivery boundary).
- **No new PocketBase queries.** All v1.2 requirements are pure client-side computed/ref changes over the existing `groupedVaccinations` computed in `WallecxApp.vue`. No new runtime deps required.
- **VaccinationGroupCard reused unchanged.** VIEW-02 explicitly prohibits modifying the card component — only the grid layout class on the container changes.
- **View persistence via sessionStorage.** VIEW-01 specifies browser session persistence; sessionStorage is the natural fit (resets on new tab/window, survives in-tab navigation).
- **Phase numbering continues from v1.1.** v1.1 ended at Phase 6; v1.2 starts at Phase 7.

### Key Decisions (v2.0 roadmap)

- **4 phases for v2.0 (coarse granularity).** Phase 10: extraction blocker; Phase 11: backend + foundation (server-side rules gate all UI); Phase 12: complete read path including barcode rendering + full-screen scan; Phase 13: complete write path + mapper test.
- **VaccinationsTab.vue extraction is a critical-path blocker (Phase 10).** WallecxApp.vue must become a thin tab shell before any membership component work begins — adding memberships to the current WallecxApp.vue would double its state surface.
- **PrimeVue Tabs, not sub-routes.** Sub-routes rejected: require non-trivial router restructure, break existing `/projects/wallecx` bookmarks, and no other Lexarium mini-app uses child routes for tab switching.
- **Each tab owns its own state.** VaccinationsTab.vue and MembershipsTab.vue each own independent local refs. WallecxApp.vue holds only the active tab index. No new Pinia store needed.
- **BarcodeDisplay.vue is purely presentational.** No PocketBase calls; built early in Phase 12 so both MembershipCard.vue and MembershipDetail.vue can embed it.
- **ManageMembership.vue uses direct v-model refs, not `@primevue/forms` controlled system.** PrimeVue issue #8135 (unfixed): ColorPicker inside a PrimeVue Form always starts showing red and ignores initial values. Use the same direct v-model pattern as ManageVaccination.vue.
- **card_color stored WITHOUT hash prefix.** Matches ColorPicker emit format. All CSS background bindings prepend `#` via a `toCSS(hex)` utility. Zod validates `[0-9a-fA-F]{6}`.
- **iOS fullscreen: viewport overlay, not Fullscreen API.** `requestFullscreen()` unsupported on non-video elements on iOS < 26. Use `position: fixed; inset: 0; z-index: 9999` overlay — works on all devices.
- **Two new runtime deps: qrcode.vue@^3.9.1 + jsbarcode@^3.12.3.** @vueuse/core useFullscreen is already on disk (hoisted by @vueuse/motion) — no install needed.
- **Every JsBarcode() call wrapped in try/catch.** JsBarcode has no soft-fail mode — invalid input throws synchronously. On catch, render card_number as large plain text with "Barcode unavailable" caption.
- **Phase numbering continues from v1.2.** v1.2 ended at Phase 9; v2.0 starts at Phase 10.

### Decisions from 00-01 Execution

- **lint:secrets uses grep exit codes.** Exit 0 = match found = alert (VITE_LOGIN_ reintroduced); exit 1 = no match = clean. npm run treats exit 1 as failure, which is the intended alerting behavior. No wrapper script needed.

### Decisions from 03-04 Execution

- **useConfirm must be explicitly imported** — not auto-resolved by PrimeVueResolver. ConfirmDialog component tag IS auto-resolved. Pattern: import composable explicitly, use component tag directly.
- **Server-first delete pattern confirmed** — deleteRecord awaits pb.delete() before splice; on failure no splice (row stays visible). Implements Pitfall 4 / WRITE-06 correctly.
- **addFirst CTA via emit** — empty-state "Add your first vaccination" button emits addFirst; WallecxApp wires it to openManage(null). No prop drilling needed.

### Phase 3 Review Findings (03-REVIEW.md — WARN)

- **HIGH-01:** `pb.authStore.record!.id` non-null assertion in ManageVaccination.vue:147 — crashes if session expires at submit time. Fix: explicit null guard that re-routes to login.
- **HIGH-02:** `pendingFile` cleared only in `@hide` (onHide); rely on Dialog emit decoupling could persist stale file into next open. Fix: explicit `pendingFile.value = null` in success branch before `visible.value = false`.
- **MEDIUM-01:** Wrong comment at ManageVaccination.vue:151 — says `onCreated` calls `Object.assign` but it calls `unshift`.
- **MEDIUM-02:** `void mapToUpdateVaccination(...)` is a dead import; either use the return value as the PATCH body or remove the call.
- **MEDIUM-03:** `unshift` in `onCreated` places new records at top regardless of `date_administered` — breaks visual sort until reload.

### Decisions from 10-01 Execution

- **VaccinationsTab.vue has no defineProps/defineEmits — fully self-contained.** WallecxApp.vue (Plan 02) will hold only the activeTab ref. Zero prop drilling required.
- **ConfirmDialog stays in WallecxApp.vue (app shell), not in VaccinationsTab.vue.** useConfirm requires a single ConfirmDialog instance per app layer (confirmed in Phase 3 execution notes).
- **VaccinationDetail remains auto-imported in VaccinationsTab.vue.** Resolved by unplugin-vue-components — matching the existing WallecxApp.vue pattern. No explicit import added.
- **MembershipsTab.vue omits the script block entirely.** Purely presentational stub — no empty `<script setup>` block needed.

### Decisions from 10-02 Execution

- **activeTab = ref<string>("vaccinations") — string type, not number.** PrimeVue 4 Tabs binds Tab/TabPanel by `value` prop (string literals), not numeric index.
- **h1 heading is above `<Tabs>`, not inside a TabPanel.** Heading belongs to the page/card context, not to tab content — matches UI-SPEC rationale.
- **No explicit imports of PrimeVue Tabs components in WallecxApp.vue.** Tabs, TabList, Tab, TabPanels, TabPanel are all auto-resolved by PrimeVueResolver — matching the existing codebase pattern.

### Open Todos

- Execute Phase 13: Write Path — ManageMembership CRUD (3 plans ready).

### Active Blockers

None.

### Risk Register (v2.0)

- **JsBarcode throws on invalid input (CRITICAL):** Every JsBarcode() call must be wrapped in try/catch. On catch, render card_number as large plain text. Add Zod pre-validation per format. Never pass empty string. (Research: BR-1)
- **PrimeVue ColorPicker emits hex without leading hash (HIGH):** Store without hash. Use toCSS(hex) in all CSS bindings. Zod validates [0-9a-fA-F]{6}. (Research: CP-1)
- **iOS fullscreen API does nothing (HIGH):** Use position: fixed; inset: 0; z-index: 9999 viewport overlay — not the Fullscreen API. (Research: FS-2)
- **Screen dims mid-scan (HIGH):** navigator.wakeLock.request('screen') in try/catch when scan overlay opens. Re-acquire on visibilitychange. (Research: FS-1)
- **White background behind barcodes is non-negotiable (HIGH):** Use BARCODE_FOREGROUND=#000000 and BARCODE_BACKGROUND=#ffffff constants. Wrap SVG in bg-white container. (Research: BR-2)
- **ColorPicker initial value ignored inside PrimeVue Form (HIGH):** Use direct v-model refs in ManageMembership.vue — do not use @primevue/forms controlled system. (Research: CP-3 / PrimeVue issue #8135)
- **PocketBase auto-cancel silently drops parallel fetches (MEDIUM):** Use distinct requestKey strings on every getFullList call. (Research: MR-5)
- **Watcher fires before SVG element mounts (MEDIUM):** Use useTemplateRef and check svgRef.value before calling JsBarcode. Pattern: onMounted(render) + watch(barcodeValue, render) without immediate. (Research: BR-5)

## Deferred Items

Items acknowledged and deferred at v1.0 milestone close on 2026-05-13:

| Category | Item | Status |
|----------|------|--------|
| uat_gap | Phase 00: 00-HUMAN-UAT.md | partial — 1 pending scenario |
| uat_gap | Phase 08: 08-HUMAN-UAT.md | partial — 4 pending scenarios |
| verification_gap | Phase 00: 00-VERIFICATION.md | human_needed |
| verification_gap | Phase 02: 02-VERIFICATION.md | human_needed |
| verification_gap | Phase 04: 04-VERIFICATION.md | human_needed |
| verification_gap | Phase 05: 05-VERIFICATION.md | human_needed |
| verification_gap | Phase 08: 08-VERIFICATION.md | human_needed |

Known deferred items at close: 11 (see above)

## Session Continuity

**Last session:** 2026-05-14

**Stopped at:** Phase 13 Plan 03 — checkpoint:human-verify (browser CRUD flow verification required)

**Next session entry point:** Run `npm run dev`, navigate to `/projects/wallecx`, complete the 6-step browser verification in 13-03-PLAN.md checkpoint task. Type "approved" to complete Phase 13.

**Files of interest:**

- `.planning/phases/13-write-path-managemembership-crud/13-01-PLAN.md` — membershipMapper.spec.ts (Wave 1)
- `.planning/phases/13-write-path-managemembership-crud/13-02-PLAN.md` — ManageMembership.vue (Wave 1, parallel with 13-01)
- `.planning/phases/13-write-path-managemembership-crud/13-03-PLAN.md` — MembershipsTab+MembershipDetail wiring (Wave 2, has human checkpoint)

---
*State initialized: 2026-05-10 by roadmapper after `/gsd-new-project` orchestration*
*Last updated: 2026-05-13 — Phase 10 Plan 02 executed: WallecxApp.vue refactored to thin Tabs shell; Phase 10 complete (XTAB-01, XTAB-02 satisfied); Phase 11 next*
