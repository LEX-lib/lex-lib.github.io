---
phase: 38-boarder-roster-foundation
plan: 02
subsystem: ui
tags: [vue3, pocketbase, primevue, zod, vitest, autocomplete, select]

# Dependency graph
requires:
  - phase: 38-boarder-roster-foundation (plan 01)
    provides: "paytime_boarders live collection, boarderSchema/paytimeBoarderMapper, useBoarderRoster cached-read composable, ManageBoarder.vue/BoarderRosterView.vue display-name-only tracer"
provides:
  - "boarderSchema tag normalization contract: normalizeTag/titleCaseTag/MaxTagLength, per-element bound enforced before the normalize+dedupe transform, unit-tested"
  - "Usage-derived tag vocabulary (no seeded list, no paytime_tags collection) with a create-behind-a-deliberate-click AutoComplete picker on ManageBoarder.vue"
  - "Tag chips rendered on BoarderRosterView.vue roster rows"
  - "Account link picker on ManageBoarder.vue: lazy paytime-users-list fetch, No-account-first dropdown excluding accounts already held by another boarder"
  - "paytimeBoarderMapper payload-shape tests (exactly four create keys, is_active excluded from update, empty user/tags passthrough)"
affects: [39-payment-recording, 40-payment-management, 41-boarder-ledger]

actuals:
  tokens: 4300
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Usage-derived option vocabulary (no schema-resident select, no seeded array) — computed from the already-loaded useBoarderRoster() read, matching TAG-01's superuser-only Collections API constraint"
    - "Rising-edge lazy fetch inside an existing seed-on-open watch, detected via the watch callback's previous-value argument rather than a separate onMounted/watchEffect"
    - "Explicit isCreate marker on suggestion objects instead of string-matching a sentinel label"

key-files:
  created:
    - src/lib/paytime/__tests__/boarderSchema.spec.ts
  modified:
    - src/lib/paytime/boarderSchema.ts
    - src/components/projects/paytime/ManageBoarder.vue
    - src/components/projects/paytime/BoarderRosterView.vue
    - src/lib/pocketbase/__tests__/paytimeBoarderMapper.spec.ts

key-decisions:
  - "Tag suggestions are objects with an explicit isCreate boolean, not string-matched against the 'Create tag:' label — a boarder could legitimately hold a tag whose text resembles the create label (D-38-03)."
  - "The users-list fetch triggers on the seed-on-open watch's rising edge, detected via Vue's watch callback previous-value argument (([isVisible, current], previous) => ...), keeping the fetch inside the existing watch rather than adding a second one."

patterns-established:
  - "Tag vocabulary is always the de-duplicated union of tags already on useBoarderRoster()'s boarders — no file in this phase introduces a second source of tag options."

requirements-completed: [ROSTER-02, ROSTER-03, TAG-01]

coverage:
  - id: D1
    description: "Tag normalization enforced in Zod (normalizeTag/titleCaseTag/MaxTagLength); per-element length bound checked before the trim/collapse/lowercase/dedupe transform runs, so an over-long tag is a field error, not silently stored"
    requirement: TAG-01
    verification:
      - kind: unit
        ref: "src/lib/paytime/__tests__/boarderSchema.spec.ts (6 tests, all pass)"
        status: pass
    human_judgment: false
  - id: D2
    description: "paytimeBoarderMapper payload shape pinned: mapToCreateBoarder returns exactly name/tags/user/is_active; mapToUpdateBoarder excludes is_active and passes an empty-string user and an empty tags array through unchanged"
    requirement: ROSTER-03
    verification:
      - kind: unit
        ref: "src/lib/pocketbase/__tests__/paytimeBoarderMapper.spec.ts (7 tests, all pass)"
        status: pass
    human_judgment: false
  - id: D3
    description: "ManageBoarder.vue tag picker: vocabulary derived from useBoarderRoster (no seeded list, no paytime_tags reference), the create-tag entry is reachable only via a deliberate click (no Enter/blur/comma add-trigger), tags render as removable info-severity chips, and a boarder's assigned tags render as chips on its own BoarderRosterView row"
    requirement: ROSTER-02
    verification:
      - kind: other
        ref: "38-02-PLAN.md Task 1 grep-based acceptance criteria — all pass (see Verification section below)"
        status: pass
    human_judgment: true
    rationale: "The click-through flow (type a tag, click Create, see it assigned to a second boarder; see chips render on the row) was not exercised in a live browser session — no browser-automation tool or admin credentials were available to this executor, the same constraint 38-01-SUMMARY.md recorded. Static structure (grep gates) and the full unit suite (127/127) pass; the live click-through is an open UAT item."
  - id: D4
    description: "Account link picker: 'No account' first and always present, the dropdown excludes accounts already held by another boarder while keeping the edited boarder's own account visible, name-or-email fallback labels, a lazy paytime-users-list fetch on the dialog-open rising edge with its own distinct requestKey, and a load failure toasts 'Failed to load accounts.' and degrades to 'No account' only"
    requirement: ROSTER-03
    verification:
      - kind: other
        ref: "38-02-PLAN.md Task 2 grep-based acceptance criteria — all pass (see Verification section below)"
        status: pass
    human_judgment: true
    rationale: "Same browser-access constraint as D3 — the filtered-dropdown behavior, the self-link-preserved-on-reopen case, and the load-failure degrade path are not live-clicked. Mapper payload shape and requestKey distinctness (requestKeys.spec.ts) are unit-tested and pass."

duration: ~35min
completed: 2026-08-04
status: complete
---

# Phase 38 Plan 02: Boarder Roster Foundation Summary

**Usage-derived tag vocabulary (no seeded list, no `paytime_tags` collection) with a create-behind-a-click `AutoComplete` picker, tag chips on roster rows, and a filtered "No account"-first account-link `Select` — both wired against `boarderSchema`'s normalize/dedupe transform and `paytimeBoarderMapper`'s pinned payload shape.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 2/2
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- `boarderSchema.ts` gained `normalizeTag`, `titleCaseTag`, `MaxTagLength`, and a `tags` transform that runs the per-element bound before normalizing (trim → collapse whitespace → lowercase) and de-duplicating with first-seen order preserved, all covered by a new 6-test spec
- `ManageBoarder.vue`'s tag picker derives its entire option vocabulary from `useBoarderRoster()`'s already-loaded roster — no fetch, no seeded array, no `paytime_tags` reference anywhere in source (TAG-01's whole reason for existing)
- The create-tag entry (`Create tag: "…"`) is reachable only through an explicit `@option-select` click; no `@keyup.enter`/`@keydown.enter` handler exists anywhere in the file, so typing alone can never invent a tag (D-38-03)
- Tag chips (`Tag severity="info"`) render on both the dialog (removable) and `BoarderRosterView.vue`'s roster rows (read-only); a boarder with zero tags renders no chips and no placeholder
- The account link picker fetches `users` lazily on the dialog-open rising edge (detected via the seed-on-open watch's `previous` argument, not a separate mount hook) under its own `paytime-users-list` requestKey, filters out accounts already held by another boarder while always keeping the boarder-under-edit's own account visible, and degrades to "No account" only on fetch failure
- `paytimeBoarderMapper.spec.ts` extended with the exactly-four-keys create assertion and an empty-string-user/empty-tags-array update passthrough assertion

## Task Commits

1. **Task 1: Tag vocabulary — normalize in Zod, derive options from usage, create behind a deliberate click** - `44babae` (feat)
2. **Task 2: Account link picker — filtered users dropdown with "No account" as a first-class choice** - `e41ba46` (feat)

_No plan-metadata commit yet — this SUMMARY plus STATE/ROADMAP/REQUIREMENTS updates are committed together as the final step below._

## Files Created/Modified

- `src/lib/paytime/boarderSchema.ts` - `normalizeTag`, `titleCaseTag`, `MaxTagLength` exports; `tags` field now bounds-then-transforms (normalize + drop-empty + dedupe)
- `src/lib/paytime/__tests__/boarderSchema.spec.ts` - new spec: multi-spelling normalization, whitespace-only drop, empty-array acceptance, over-length field error, non-mutation of input, `titleCaseTag`
- `src/components/projects/paytime/ManageBoarder.vue` - tag picker (chips + `AutoComplete`, vocabulary from `useBoarderRoster`) and account picker (`Select` with filter, lazy `paytime-users-list` fetch, `accountOptions` filtering)
- `src/components/projects/paytime/BoarderRosterView.vue` - tag chips rendered under each boarder's name, inside the existing `min-w-0` details column
- `src/lib/pocketbase/__tests__/paytimeBoarderMapper.spec.ts` - added exactly-four-keys create assertion and empty-user/empty-tags update passthrough assertion

## Decisions Made

- **Suggestion sentinel uses an explicit `isCreate` boolean field, not label string-matching.** A boarder could legitimately hold a tag whose text resembles `Create tag: "…"`; distinguishing by an object property (not by parsing the rendered label) keeps that case correct (D-38-03).
- **The users-list fetch is triggered from the existing seed-on-open `watch`'s `previous` argument**, not a second `watch`/`watchEffect`. `watch(() => [visible, record], ([isVisible, current], previous) => {...})` gives direct access to the prior tuple, so `wasVisible = previous?.[0] ?? false` cleanly detects the open-transition without introducing a new lifecycle hook or a manual "has fetched once" flag.

## Deviations from Plan

None — plan executed as written; no Rule 1/2/3 auto-fixes were required.

**Grep-gate note (not a code defect, same category as 38-01-SUMMARY.md's `value="by-boarder"` note):** the plan's Task 2 acceptance criterion `grep -Fc 'is_active' src/lib/pocketbase/paytimeBoarderMapper.ts == 1 (create only — D-38-18)` undercounts. That file's doc comments (written in Plan 01, unchanged here) discuss `is_active` five times in prose plus twice in code (`is_active: input.is_active` in the create mapper, and the `Omit<BoarderInput, "is_active">` type parameter that enforces its exclusion from update) — a literal count of 7, not 1. The underlying intent the criterion is checking — `is_active` is sent only by `mapToCreateBoarder` and is excluded from `mapToUpdateBoarder`'s returned object — is true and is what `paytimeBoarderMapper.spec.ts`'s `not.toHaveProperty("is_active")` assertion actually pins. No code change was made to chase the literal grep count, since doing so would mean stripping the deviation-documenting comments Plan 01 deliberately wrote.

## Issues Encountered

**Same open verification item as 38-01, now extended to this plan's two new interactive pickers.** No live browser session or admin credentials were available to this executor (prod PocketBase MCP tools are RecordRead/SchemaRead only; no browser-automation tool was invoked). Everything automatable was run and passed: `npm run type-check` (clean), the full unit suite via `npx vitest run --exclude '**/node_modules/**' --exclude '**/.claude/**'` (127/127, up from the 119/119 baseline — 6 new `boarderSchema.spec.ts` tests + 2 new `paytimeBoarderMapper.spec.ts` tests), `npm run lint` (0 new errors — the 10 pre-existing errors are all in `VaccinationDetail.vue`/`guard.spec.ts` and an orphaned `.claude/worktrees/` duplicate, none touched by this plan), and every grep-based acceptance criterion in both tasks. **Not run:** the live click-through flows — typing a tag and clicking "Create tag:", confirming it's immediately assignable to a second boarder, confirming chips render on the roster row, confirming the account dropdown correctly excludes a taken account while keeping the edited boarder's own, and confirming the "Failed to load accounts." toast path. Logged to `.planning/WINDOWS.md` as `unrun-verify` entries (D3/D4 above).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `boarderSchema`'s tag transform and `paytimeBoarderMapper`'s payload shape are stable; Plan 03 (row actions, kebab menu, is_active toggle) extends `BoarderRosterView.vue`/`ManageBoarder.vue` further without needing any change here.
- **Carried-forward blocker (from 38-01, not introduced here):** the two-unlinked-boarders live probe and this plan's live click-through UAT items should both be run together before Plan 03's tokenless-read/admin-gated-write probes are trusted against a roster known to support the full tag+account feature set correctly.
- Plan 03 can proceed against the code shipped here; it extends the same two files rather than depending on the open verification items being closed first.

---
*Phase: 38-boarder-roster-foundation*
*Completed: 2026-08-04*

## Self-Check: PASSED

All 5 created/modified source files plus this SUMMARY confirmed present on disk; both task commits (`44babae`, `e41ba46`) confirmed in git history.
