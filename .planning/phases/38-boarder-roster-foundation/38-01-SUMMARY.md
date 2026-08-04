---
phase: 38-boarder-roster-foundation
plan: 01
subsystem: ui
tags: [vue3, pocketbase, primevue, zod, vitest, pinia]

# Dependency graph
requires: []
provides:
  - "paytime_boarders live PocketBase collection (name, tags, user, is_active), unique partial index on user, five API rules"
  - "PaytimeBoarder/AddPaytimeBoarder types, boarderSchema (Zod), paytimeBoarderMapper (create/update payload builders)"
  - "useBoarderRoster composable — module-level cached roster read + myBoarder, the sole read path Phases 39-41 bind to"
  - "ManageBoarder.vue (Add/Edit dialog) and BoarderRosterView.vue (roster list) — display-name path only"
  - "MonthlyReport.vue restructured into a By Boarder / Boarders nested Tabs shell; PayTimeApp.vue's admin tab relabeled Admin"
affects: [39-payment-recording, 40-payment-management, 41-boarder-ledger]

actuals:
  tokens: 11100
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Module-level cached composable (useBoarderRoster mirrors useFileToken): in-flight dedup + consumer count + pb.authStore.onChange cache invalidation, no setInterval"
    - "Distinct PocketBase SDK requestKey per list-fetching consumer under PrimeVue's non-lazy Tabs mounting"

key-files:
  created:
    - src/types/paytime/boarders/types.d.ts
    - src/lib/paytime/boarderSchema.ts
    - src/lib/pocketbase/paytimeBoarderMapper.ts
    - src/lib/pocketbase/__tests__/paytimeBoarderMapper.spec.ts
    - src/composables/useBoarderRoster.ts
    - src/composables/__tests__/useBoarderRoster.spec.ts
    - src/components/projects/paytime/ManageBoarder.vue
    - src/components/projects/paytime/BoarderRosterView.vue
  modified:
    - src/components/projects/paytime/MonthlyReport.vue
    - src/components/projects/paytime/PayTimeApp.vue
    - src/components/projects/paytime/__tests__/requestKeys.spec.ts
    - components.d.ts

key-decisions:
  - "is_active default enforced in application code (paytimeBoarderMapper.mapToCreateBoarder), not PocketBase — v0.23+ removed per-field bool defaults"
  - "The two-unlinked-boarders probe (A1) and the manual admin-flow behaviour checks are NOT independently verified by this executor — no live browser session or admin credentials were available in this environment (prod MCP is RecordRead/SchemaRead only). Flagged as an open item below and in WINDOWS.md."

patterns-established:
  - "useBoarderRoster is the sole paytime_boarders read path — BoarderRosterView never calls getFullList directly, matching D-38-09"

requirements-completed: [ROSTER-01, ROSTER-06]

coverage:
  - id: D1
    description: "paytime_boarders exists live with the four fields, unique partial index on user, and five non-empty API rules (listRule/viewRule authenticated, create/update/deleteRule is_admin)"
    requirement: ROSTER-06
    verification:
      - kind: other
        ref: ".planning/phases/38-boarder-roster-foundation/38-COLLECTION.md (paste-back evidence read from the live instance)"
        status: pass
    human_judgment: false
  - id: D2
    description: "boarderSchema + paytimeBoarderMapper enforce is_active: true on create (server has no default) and exclude is_active from update"
    verification:
      - kind: unit
        ref: "src/lib/pocketbase/__tests__/paytimeBoarderMapper.spec.ts#sends is_active: true explicitly on create"
        status: pass
      - kind: unit
        ref: "src/lib/pocketbase/__tests__/paytimeBoarderMapper.spec.ts#excludes is_active"
        status: pass
    human_judgment: false
  - id: D3
    description: "useBoarderRoster: in-flight dedup on simultaneous mount, its own paytime-boarders-list requestKey distinct from sibling keys, auth-change cache clearing, and myBoarder resolves through the roster record (linked/unlinked/no-match/no-auth) without falling back to users"
    requirement: ROSTER-01
    verification:
      - kind: unit
        ref: "src/composables/__tests__/useBoarderRoster.spec.ts (6 tests, all pass)"
        status: pass
      - kind: unit
        ref: "src/components/projects/paytime/__tests__/requestKeys.spec.ts#PaymentLog, MonthlyReport and BoarderRosterView use distinct requestKeys"
        status: pass
    human_judgment: false
  - id: D4
    description: "End-to-end admin flow: Admin tab -> Boarders sub-tab -> Add Boarder -> save -> row appears; By Boarder sub-tab unchanged; two unlinked boarders both save (A1)"
    requirement: ROSTER-01
    verification: []
    human_judgment: true
    rationale: "No live browser/admin-credential access was available to this executor (prod PocketBase MCP grants RecordRead/SchemaRead only, no RecordCreate; no browser automation tool was invoked). Automated verify (type-check + full unit suite, 195 tests) passed, but the manual click-through and the live two-unlinked-boarders probe were not exercised. A human must verify against the running app before this is treated as closed — see 'Open Verification Item' below."

duration: ~55min
completed: 2026-08-04
status: complete
---

# Phase 38 Plan 01: Boarder Roster Foundation Summary

**`paytime_boarders` stood up live on PocketBase with a working admin-adds-a-boarder tracer (types, Zod schema, mapper, `useBoarderRoster` cached-read composable, Add/Edit dialog, roster list, and a By Boarder / Boarders nested-Tabs shell), plus regression tests pinning the composable's dedup, cache-invalidation and linked/unlinked resolution contract that Phases 39-41 build on.**

## Performance

- **Duration:** ~55 min (this continuation covering Tasks 2-3; Task 1 was a prior human-verify checkpoint)
- **Tasks:** 3/3 (Task 1 completed and committed by a prior agent turn; Tasks 2-3 completed in this turn)
- **Files modified:** 12 (8 created, 4 modified)

## Accomplishments

- `paytime_boarders` live on the prod PocketBase instance (`api.delveen.cc`) with the exact four fields, a partial unique index on `user` (`WHERE user != ''`), and five rules verified non-empty and correctly scoped (read: authenticated; write: `is_admin`)
- One production-quality path wired end to end: `PaytimeBoarder`/`AddPaytimeBoarder` types → `boarderSchema` (Zod) → `paytimeBoarderMapper` → `useBoarderRoster` (cached read) → `ManageBoarder.vue` (dialog) → `BoarderRosterView.vue` (list) → `MonthlyReport.vue`'s new nested Tabs shell → `PayTimeApp.vue`'s renamed "Admin" tab
- `useBoarderRoster`'s contract pinned by 6 new tests: in-flight dedup, its own distinct `requestKey`, auth-change cache clearing (with no refetch when signed out), and `myBoarder` resolving through the roster record in every case (linked, unlinked-present, no-match, no-auth) without ever falling back to the `users` record
- `requestKeys.spec.ts` extended to a real third mounted consumer (`BoarderRosterView`), asserting 3 distinct PayTime list `requestKey`s; verified the assertion has teeth by temporarily colliding the key and confirming the test fails, then reverting

## Task Commits

1. **Task 1: Create paytime_boarders in the PocketBase Admin UI and paste back the actual configuration** - `ab682c6` (docs, prior turn)
2. **Task 2: End-to-end "admin adds a boarder and sees it in the roster"** - `1752886` (feat)
3. **Task 3: Pin the shared-read contract Phases 39-41 bind to** - `8d79bf1` (test)

_No plan-metadata commit yet — this SUMMARY plus STATE/ROADMAP/REQUIREMENTS updates are committed together as the final step below._

## Files Created/Modified

- `src/types/paytime/boarders/types.d.ts` - `PaytimeBoarder extends RecordModel`, `AddPaytimeBoarder`; `user` typed as `string` (PocketBase returns `""` for unset, never `null`)
- `src/lib/paytime/boarderSchema.ts` - `boarderSchema` (Zod), `BoarderInput`, `collectFieldErrors`
- `src/lib/pocketbase/paytimeBoarderMapper.ts` - `mapToCreateBoarder` (sends `is_active: true` explicitly), `mapToUpdateBoarder` (excludes `is_active`)
- `src/lib/pocketbase/__tests__/paytimeBoarderMapper.spec.ts` - pins the `is_active: true` create-payload assertion (deviation #1's only regression backstop)
- `src/composables/useBoarderRoster.ts` - module-level cached roster read, `paytime-boarders-list` requestKey, `myBoarder` computed
- `src/composables/__tests__/useBoarderRoster.spec.ts` - dedup, requestKey, auth-change invalidation, linked/unlinked resolution (6 tests)
- `src/components/projects/paytime/ManageBoarder.vue` - Add/Edit dialog, display-name only this task
- `src/components/projects/paytime/BoarderRosterView.vue` - roster list, active-before-inactive stable sort, no row actions yet
- `src/components/projects/paytime/MonthlyReport.vue` - restructured into a `By Boarder` / `Boarders` nested Tabs shell; existing report logic byte-unchanged
- `src/components/projects/paytime/PayTimeApp.vue` - admin tab label `"Monthly Report"` → `"Admin"`
- `src/components/projects/paytime/__tests__/requestKeys.spec.ts` - extended stubs for the new Tabs shell, extended to a real third `getFullList` consumer
- `components.d.ts` - auto-regenerated by `vue-tsc`/unplugin-vue-components to register `BoarderRosterView` and `ManageBoarder`

## Decisions Made

- **`is_active` default moved to application code.** PocketBase v0.23+ removed per-field bool defaults (confirmed live against `users.is_admin`, a comparable non-system bool with no default). `paytimeBoarderMapper.mapToCreateBoarder` is now the only place `is_active: true` is enforced; any future write path bypassing the mapper must set it itself.
- **`ManageBoarder.vue` uses `id="pt-boarder-name"`, not `inputId`.** The plan's action text specified `inputId`, but PrimeVue's `InputText` extends `InputHTMLAttributes` directly and has no `inputId` prop (unlike `Select`/`DatePicker`, which wrap an internal input) — `inputId` would have been silently dropped, breaking the `<label for>` association. Fixed as Rule 1 (bug: the plan's literal instruction would not compile the intended accessibility link).
- **`requestKeys.spec.ts`'s `mountOptions` gained `Tabs`/`TabList`/`Tab`/`TabPanels`/`TabPanel` stubs.** Mounting the restructured `MonthlyReport.vue` without them threw (`$primevue` not defined on instance — these components need the PrimeVue plugin installed, which this unit-test mount doesn't provide). Fixed as Rule 3 (blocking): stubbed the shell so the pre-existing distinct-requestKeys assertion keeps passing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `ManageBoarder.vue`'s InputText uses `id`, not the plan-specified `inputId`**
- **Found during:** Task 2
- **Issue:** `inputId` is not a valid prop on PrimeVue's `InputText` (confirmed against `node_modules/primevue/inputtext/index.d.ts`); passing it would silently do nothing, leaving the `<label for="pt-boarder-name">` unlinked to the input.
- **Fix:** Used `id="pt-boarder-name"` directly on `InputText` instead.
- **Files modified:** `src/components/projects/paytime/ManageBoarder.vue`
- **Verification:** Type-check passes; matches the same `<label>`/input pairing convention already used elsewhere in this codebase.
- **Committed in:** `1752886` (Task 2 commit)

**2. [Rule 3 - Blocking] `requestKeys.spec.ts` needed new stubs for MonthlyReport's Tabs shell**
- **Found during:** Task 2 (running `npm run test:unit` after the MonthlyReport restructure)
- **Issue:** `MonthlyReport.vue` now renders real `Tabs`/`TabList`/`Tab`/`TabPanels`/`TabPanel` components, which throw when mounted without the PrimeVue plugin installed (`Cannot read properties of undefined (reading 'config')` inside `TabList`'s `$primevue` access).
- **Fix:** Added `Tabs`, `TabList`, `Tab`, `TabPanels`, `TabPanel`, and `BoarderRosterView` to the shared `mountOptions.global.stubs` in `requestKeys.spec.ts`.
- **Files modified:** `src/components/projects/paytime/__tests__/requestKeys.spec.ts`
- **Verification:** Full suite green (195/195); the pre-existing distinct-requestKeys assertion (now extended to 3 in Task 3) still passes.
- **Committed in:** `1752886` (Task 2 commit)

**3. [Rule 2 - Missing critical] Added `paytimeBoarderMapper.spec.ts` per explicit human instruction**
- **Found during:** Task 2, per the orchestrator's `<user_response>` deviation #1 note
- **Issue:** No test asserted the mapper actually sends `is_active: true` on create — the only enforcement point since the server has no default.
- **Fix:** New spec file with 4 assertions (`is_active: true` on create, name/tags/user mapping, `is_active` excluded from update).
- **Files created:** `src/lib/pocketbase/__tests__/paytimeBoarderMapper.spec.ts`
- **Verification:** `npx vitest run` — 4/4 pass.
- **Committed in:** `1752886` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 1 blocking, 1 missing-critical-test). All necessary for correctness or explicitly requested; no scope creep.

**Grep-gate note (not a code defect):** the plan's Task 2 acceptance criterion `grep -Fc 'value="by-boarder"' MonthlyReport.vue == 2 (Tabs default + Tab)` undercounts by one. A working PrimeVue `Tabs`/`Tab`/`TabPanel` triad requires the **same** `value="by-boarder"` string on all three elements (`<Tabs value="by-boarder">`, `<Tab value="by-boarder">`, and `<TabPanel value="by-boarder">`) — the plan's own action text explicitly specifies the `TabPanel` with that value, so the literal count is **3**, not 2. Verified: `grep -Fc 'value="by-boarder"' src/components/projects/paytime/MonthlyReport.vue` → `3`. This is the plan's acceptance-criteria authoring undercounting its own action text, not a defect in the shipped code — the structure matches `PayTimeApp.vue`'s existing `Tab`/`TabPanel` value-pairing convention exactly.

## Issues Encountered

**Open verification item — not resolved by this executor.** Two acceptance items from Task 2 require a live browser session against the running app with admin credentials, which this executor did not have access to (prod PocketBase MCP tools are RecordRead/SchemaRead only — no RecordCreate; no browser-automation tool was available or invoked in this session):

1. **The two-unlinked-boarders probe (RESEARCH.md assumption A1).** Deferred here per 38-COLLECTION.md deviation #2 ("add two boarders with no linked account during Task 2's in-app verification and record whether both save"). **Not run.** The partial unique index (`WHERE user != ''`, confirmed live in 38-COLLECTION.md) is designed to make this pass, and the same idiom already works for `users.email` on this instance — but it has not been empirically exercised through the real `createRule` path yet.
2. **The manual admin-flow behaviour checks** (Admin tab → Boarders sub-tab → Add Boarder → save → row appears; empty/whitespace name validation; By Boarder sub-tab unchanged) — not click-tested in a running browser.

Everything automatable was run and passed: `npm run type-check` (clean), full `npm run test:unit` (195/195, including the new/extended specs), and all of Task 2/3's grep-based acceptance criteria (bar the undercounted one noted above). **A human must run `npm run dev`, log in as the admin, and perform the Add Boarder flow (including the two-unlinked-boarders check) before this plan's live-verification is considered closed.** Logged to `.planning/WINDOWS.md` as an `unrun-verify` entry.

## User Setup Required

None - no external service configuration required. (The live PocketBase collection itself was configured by the human in Task 1; no further external setup needed for Tasks 2-3.)

## Next Phase Readiness

- `useBoarderRoster`, `PaytimeBoarder`/`AddPaytimeBoarder`, `paytimeBoarderMapper`, and `boarderSchema` are the stable contracts Phases 39-41 build on (Phase 39: `PaymentLog` as a second `useBoarderRoster` consumer; Phase 40: `ManagePayment` as a third; Phase 41: a `Ledger` sub-tab in the same `MonthlyReport.vue` shell).
- **Blocker for full closure (not for starting Plan 02):** the open verification item above — the two-unlinked-boarders live probe — should be run before Plan 03's tokenless-read/admin-gated-write probes are trusted to run against a roster that's known to support unlinked rows correctly.
- Plan 02 (tags + account-link picker) and Plan 03 (row actions, kebab menu, live probes) can proceed against the code shipped here; neither depends on the open verification item being closed first, since both extend `ManageBoarder.vue`/`BoarderRosterView.vue` rather than relying on it.

---
*Phase: 38-boarder-roster-foundation*
*Completed: 2026-08-04*

## Self-Check: PASSED

All 12 created/modified files confirmed present on disk; all 3 task commits (`ab682c6`, `1752886`, `8d79bf1`) confirmed in git history.
