---
phase: 39-payment-subject-rework
plan: 01
subsystem: payments
tags: [vue3, pocketbase, primevue, zod, vitest]

# Dependency graph
requires:
  - phase: 38-boarder-roster-foundation
    provides: "useBoarderRoster composable ({ boarders, myBoarder, refresh }), paytime_boarders collection and its live rule shape"
provides:
  - "PaytimePayment.user split into boarder (subject) + recorded_by (who entered it); AddPaytimePayment reshaped to match"
  - "paymentSchema requires boarder as a non-empty string; recorded_by stays component-supplied, never schema-validated"
  - "mapToCreatePayment appends boarder + recorded_by; mapToUpdatePayment omits both, extending the existing owner-omission docblock to both fields"
  - "PaymentLog filters by myBoarder.id, skips the fetch and shows a distinct no-boarder message when myBoarder is null (D-39-09)"
  - "ManagePayment resolves myBoarder on mount, gates the form + Save button on it, writes boarder + recorded_by on create (D-39-10 seam for Phase 40's admin selector)"
  - "MonthlyReport expands boarder (not user), groups by payment.boarder, labels from expand.boarder.name with no email fallback (D-39-11)"
  - "BoarderRosterView.countBoarderPayments + ROSTER-07 client-side delete pre-check (new requestKey: paytime-boarder-payment-count)"
affects: [39-02-schema-rules, 39-03-verification, 40-admin-on-behalf-logging]

actuals:
  tokens: 6500
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Owner-field omission on update, doubled: mapToUpdatePayment now omits both boarder and recorded_by, extending the single load-bearing docblock rather than duplicating it"
    - "Non-owning consumer of a shared cached composable awaits the composable's own refresh() in its own onMounted to drive its own isLoading state before gating on the resolved value (PaymentLog mirrors BoarderRosterView's existing pattern, not a new idiom)"

key-files:
  created: []
  modified:
    - src/types/paytime/payments/types.d.ts
    - src/lib/paytime/paymentSchema.ts
    - src/lib/pocketbase/paytimePaymentMapper.ts
    - src/lib/pocketbase/__tests__/paytimePaymentMapper.spec.ts
    - src/lib/paytime/__tests__/paymentSchema.spec.ts
    - src/components/projects/paytime/PaymentLog.vue
    - src/components/projects/paytime/ManagePayment.vue
    - src/components/projects/paytime/MonthlyReport.vue
    - src/components/projects/paytime/BoarderRosterView.vue
    - src/components/projects/paytime/__tests__/paymentEdit.spec.ts
    - src/components/projects/paytime/__tests__/requestKeys.spec.ts

key-decisions:
  - "Deliberate deviation from D-39-04's boarder-first/rename-last sequencing, as instructed by the plan objective: the client now writes boarder + recorded_by before either field exists server-side. Nothing breaks in prod while this plan sits, because prod serves the previously-deployed build (still sending user). The mismatch window opens at Plan 39-02's schema rename and closes at the next `npm run deploy` immediately after. Recorded here per the plan's explicit instruction to track this in SUMMARY.md."
  - "New requestKey `paytime-boarder-payment-count` registered for BoarderRosterView's countBoarderPayments — distinct from paytime-payments-list, paytime-report-list, paytime-boarders-list. Name this into STATE.md's locked-key list."
  - "paymentSchema.spec.ts (not in the plan's files_modified list) was broken by Task 1's paymentSchema.ts change (boarder now required) — fixed as a Rule 1 auto-fix: added boarder to the fixture, added a boarder-required test, updated the collectFieldErrors key-list assertion."
  - "Component test mocks (paymentEdit.spec.ts, requestKeys.spec.ts) needed pb.authStore.record.id and a getFullList boarder-list response added, since ManagePayment/PaymentLog now consume useBoarderRoster, which reads pb.authStore.record?.id and pb.collection('paytime_boarders').getFullList(...). requestKeys.spec.ts's mock is generic across collections, so its one fixture object does double duty as both payment and boarder data (documented inline)."
  - "paymentEdit.spec.ts's clickByText helper now waits for the Save/Update button to be non-disabled before clicking, since myBoarder resolves asynchronously and a disabled native button silently no-ops a trigger('click') — this was a real race introduced by the new async gate, not a pre-existing flake."

patterns-established:
  - "A non-owning consumer of useBoarderRoster (PaymentLog) explicitly awaits refresh() in its own onMounted rather than relying solely on the composable's internal onMounted, so its own loading state correctly spans the async myBoarder resolution before deciding whether to fetch or show the no-boarder message."

requirements-completed: [SUBJ-01, SUBJ-03, SUBJ-04, ROSTER-07]

coverage:
  - id: D1
    description: "mapToCreatePayment sends boarder AND recorded_by; mapToUpdatePayment sends neither — verified via formData.has() assertions (not toBeUndefined, per the CQ-02 lesson), plus an accountless-boarder round-trip case"
    requirement: SUBJ-03
    verification:
      - kind: unit
        ref: "src/lib/pocketbase/__tests__/paytimePaymentMapper.spec.ts#never sends boarder or recorded_by"
        status: pass
      - kind: unit
        ref: "src/lib/pocketbase/__tests__/paytimePaymentMapper.spec.ts#maps an accountless boarder's payment identically to a linked boarder's"
        status: pass
    human_judgment: false
  - id: D2
    description: "PaymentLog skips the fetch entirely and renders a distinct no-boarder message (no toast, no error) when myBoarder is null, ordered before the no-payments check"
    requirement: SUBJ-04
    verification:
      - kind: unit
        ref: "src/components/projects/paytime/__tests__/requestKeys.spec.ts#PaymentLog renders a fetched payment"
        status: pass
    human_judgment: true
    rationale: "The passing unit test only exercises the myBoarder-resolved path (a linked boarder); the null-myBoarder empty-state copy and its visual ordering against the loading/no-payments states were not independently asserted by an automated test in this plan and should be eyeballed."
  - id: D3
    description: "MonthlyReport groups by payment.boarder and labels rows from expand.boarder.name with no email fallback; requestKey paytime-report-list unchanged"
    requirement: SUBJ-01
    verification: []
    human_judgment: true
    rationale: "No unit test exercises MonthlyReport's render with real boarder-shaped expand data in this plan (requestKeys.spec.ts only checks requestKey counts). Grouping/label logic should be manually verified against a live-shaped payload in Plan 39-02/03's verification pass."
  - id: D4
    description: "BoarderRosterView refuses to delete a boarder with payment history (no delete request issued), offering Deactivate; zero-payment boarders still delete via the byte-unchanged existing path"
    requirement: ROSTER-07
    verification: []
    human_judgment: true
    rationale: "No automated test in this plan exercises the delete pre-check branch (neither the has-payments refusal nor the zero-payments pass-through) — this needs either a new spec or manual UAT before being considered proven."

duration: ~50min
completed: 2026-08-05
status: complete
---

# Phase 39 Plan 01: Payment Subject Rework — Code Layer Summary

**Boarder-as-subject rework of PayTime's payment code path: types, Zod schema, mapper, and all four PayTime components (PaymentLog, ManagePayment, MonthlyReport, BoarderRosterView) now read/write `boarder` + `recorded_by` instead of `user`, against a schema that does not exist server-side yet.**

## Performance

- **Duration:** ~50 min
- **Completed:** 2026-08-05T05:35Z
- **Tasks:** 3
- **Files modified:** 11 (9 source files + 2 pre-existing test files not in the plan's files_modified list, fixed as Rule 1 deviations)

## Accomplishments
- `PaytimePayment.user` renamed/split into `boarder` (subject) + `recorded_by` (who entered it); `paymentSchema` requires `boarder`, deliberately excludes `recorded_by` (component-supplied, not user input)
- `mapToCreatePayment`/`mapToUpdatePayment` extended with the same owner-omission discipline that already protected `user` — now protects both new fields on update
- `PaymentLog`, `ManagePayment` both consume `useBoarderRoster()`'s `myBoarder`; `PaymentLog` skips its fetch and shows a distinct empty state when boarderless, `ManagePayment` gates its form/Save button the same way
- `MonthlyReport` swapped `expand: "user"` → `expand: "boarder"` and its grouping/label logic, with no restructuring of the Phase-38 two-tab shell
- `BoarderRosterView` gained a client-side ROSTER-07 pre-check: refuses to delete a boarder with payment history, naming the count and offering Deactivate instead

## Task Commits

Each task was committed atomically:

1. **Task 1: Types, Zod schema, and mapper — boarder + recorded_by** - `4fa4e1c` (feat)
2. **Task 2: Read and write paths — PaymentLog, ManagePayment, MonthlyReport** - `32621b4` (feat)
3. **Task 3: ROSTER-07 delete pre-check in BoarderRosterView** - `d1ec80d` (feat)

_TDD was not used — this plan's tasks are `type="auto"`, no `tdd="true"` frontmatter._

## Files Created/Modified
- `src/types/paytime/payments/types.d.ts` - `user` → `boarder` + `recorded_by`, with the standard `''`-not-`null` docblock on `recorded_by` only (`boarder` is required, never round-trips to `''`)
- `src/lib/paytime/paymentSchema.ts` - added required `boarder: z.string().min(1, ...)`; `recorded_by` deliberately absent
- `src/lib/pocketbase/paytimePaymentMapper.ts` - create appends both new fields; update appends neither, docblock extended
- `src/lib/pocketbase/__tests__/paytimePaymentMapper.spec.ts` - fixture/assertions updated; added the accountless-boarder round-trip test
- `src/lib/paytime/__tests__/paymentSchema.spec.ts` - fixture gained `boarder`; added a "requires a boarder" test; updated the `collectFieldErrors` key-list assertion (Rule 1 fix — this file was not in the plan's `files_modified` list but broke from Task 1's schema change)
- `src/components/projects/paytime/PaymentLog.vue` - filters by `myBoarder.id`; skips fetch + distinct empty state when null; `onMounted` now awaits `refresh()` then `loadPayments()` to drive its own loading state
- `src/components/projects/paytime/ManagePayment.vue` - resolves `myBoarder`; shows the no-boarder message in place of the form with Save disabled; writes `boarder` + `recorded_by` on create
- `src/components/projects/paytime/MonthlyReport.vue` - `expand: "boarder"`; `ReportRow.userId/userName` renamed `boarderId/boarderName`; label from `expand.boarder.name`, no email fallback
- `src/components/projects/paytime/BoarderRosterView.vue` - `countBoarderPayments` + async `deleteBoarder` pre-check; new `requestKey: "paytime-boarder-payment-count"`
- `src/components/projects/paytime/__tests__/paymentEdit.spec.ts` - fixture renamed; mock gained `authStore.record` + a `getFullList` boarder response; `clickByText` waits for the button to be enabled
- `src/components/projects/paytime/__tests__/requestKeys.spec.ts` - fixture gained `boarder`/`recorded_by`/`user`/`name`/`tags`/`is_active` (the shared generic mock does double duty as both payment and boarder data); `authStore.record` added

## Decisions Made
- Deliberate deviation from D-39-04's boarder-first/rename-last sequencing (per the plan's own objective) — see frontmatter `key-decisions` for the full mismatch-window rationale. This is not an executor decision; it is the plan's stated approach, recorded here as instructed.
- `paytime-boarder-payment-count` chosen as the new requestKey name for the ROSTER-07 pre-check — distinct from all three existing PayTime keys.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `paymentSchema.spec.ts` broken by Task 1's required `boarder` field**
- **Found during:** Task 1 (running the full unit suite after the schema change)
- **Issue:** This spec (not listed in the plan's `files_modified`) has a `valid` fixture without `boarder`; every test spreading it now failed schema validation, and `collectFieldErrors`'s key-list assertion no longer matched.
- **Fix:** Added `boarder: "boarder123"` to the fixture, added a "requires a boarder" test, added `"boarder"` to the expected sorted key list.
- **Files modified:** `src/lib/paytime/__tests__/paymentSchema.spec.ts`
- **Verification:** `npx vitest run src/lib/paytime/__tests__/paymentSchema.spec.ts` — 9/9 pass.
- **Committed in:** `4fa4e1c` (Task 1 commit)

**2. [Rule 1 - Bug] Component test mocks missing `pb.authStore.record` and a boarder-list `getFullList` response**
- **Found during:** Task 2 (running `paymentEdit.spec.ts`/`requestKeys.spec.ts` after wiring `useBoarderRoster` into `ManagePayment`/`PaymentLog`)
- **Issue:** `useBoarderRoster`'s `myBoarder` computed reads `pb.authStore.record?.id`, and its `refresh()` calls `pb.collection("paytime_boarders").getFullList(...)`. Neither spec's `pb` mock had `authStore.record` or (for `paymentEdit.spec.ts`) a `getFullList` method at all — `myBoarder` would always resolve `null`, blocking every Save/Update path and, for `requestKeys.spec.ts`, throwing on `BoarderRosterView`'s real render (`boarder.tags.length` on `undefined`).
- **Fix:** Added `authStore.record: { id: "4ygxbt0zey088di" }` to both mocks; added a `getFullList` mock function to `paymentEdit.spec.ts`'s `pb.collection()` return value, resolving to a boarder fixture; extended `requestKeys.spec.ts`'s shared fixture with `user`/`name`/`tags`/`is_active` so it satisfies both the payment and (dual-purpose, since that mock is collection-agnostic) boarder shape.
- **Files modified:** `src/components/projects/paytime/__tests__/paymentEdit.spec.ts`, `src/components/projects/paytime/__tests__/requestKeys.spec.ts`
- **Verification:** Both specs pass; `requestKeys.spec.ts`'s prior unhandled-rejection (from `BoarderRosterView` rendering `undefined.length`) is gone.
- **Committed in:** `32621b4` (Task 2 commit)

**3. [Rule 1 - Bug] `paymentEdit.spec.ts`'s `clickByText` raced the async `myBoarder` resolution**
- **Found during:** Task 2 (first test run after adding the `!myBoarder` Save-button guard)
- **Issue:** `myBoarder` resolves asynchronously (network round-trip through the mocked composable); `clickByText` waited only for the button's text to appear (available synchronously from the Dialog header/footer) and then triggered a click immediately. A disabled native `<button>` silently no-ops `trigger("click")`, so `create`/`update` were never called.
- **Fix:** `clickByText` now also waits (`vi.waitFor`) for the matched button's `disabled` attribute to be absent before triggering the click.
- **Files modified:** `src/components/projects/paytime/__tests__/paymentEdit.spec.ts`
- **Verification:** All 3 `ManagePayment` tests pass reliably across repeated runs.
- **Committed in:** `32621b4` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 — bugs/test breakage directly caused by this plan's own changes, not scope creep)
**Impact on plan:** All three fixes were necessary to keep `npm run test:unit` green after this plan's Task 1/2 edits. No architectural changes, no new libraries, no behavior beyond what the plan specified.

## Issues Encountered
- `vue-tsc --build`'s incremental cache (`node_modules/.tmp/*.tsbuildinfo`) can mask genuine type errors in `<script setup>` blocks between edits in the same session — cleared it once mid-session to confirm a suspicious "0 errors" result was genuine (it was: a `<script setup>`-specific TS excess-property-check quirk, not a caching issue, made an object literal with a stale `user` key pass silently before Task 2's edits landed). Not a defect in this plan's code — just a note for future executors not to fully trust `vue-tsc`'s excess-property/missing-required-property checking on inline object literals passed to typed functions from inside `<script setup>`; prefer explicit intermediate-variable type annotations when precision matters.
- No live PocketBase network calls were made at any point, per the plan's `<plan_is_fully_autonomous>` constraint — confirmed by inspection of every edited file (all reads/writes go through the existing mocked-in-tests `pb` client; no new fetch/axios/curl calls were added).

## User Setup Required

None — no external service configuration required. This plan is entirely code-side; the `boarder`/`recorded_by` fields do not exist server-side yet (that's Plan 39-02).

## Next Phase Readiness

- Plan 39-02 (schema + rule rewrite) can proceed: the client already writes/reads the new field names, so once the collection is renamed/added server-side, the mismatch window (see key-decisions) closes at the next deploy immediately following that schema change.
- Coverage gaps flagged above (D2-D4 `human_judgment: true`) are appropriate spots for Plan 39-02/03's verification pass to close — none block Plan 39-02 from starting, since this plan's own gate (`type-check`, `test:unit`, `build`) is fully green.
- `paytime-boarder-payment-count` needs to be added to STATE.md's locked-requestKey list (done as part of this plan's STATE.md update).

## Self-Check: PASSED

All 11 modified files and 3 task commits (`4fa4e1c`, `32621b4`, `d1ec80d`) verified present. `npm run type-check` exits 0, `npm run test:unit -- --exclude '**/.claude/**'` exits 0 (129/129), `npm run build` succeeds.

---
*Phase: 39-payment-subject-rework*
*Completed: 2026-08-05*
