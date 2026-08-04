---
phase: 38-boarder-roster-foundation
verified: 2026-08-04T19:00:00Z
status: human_needed
score: 7/13 truths verified
behavior_unverified: 6
overrides_applied: 0
behavior_unverified_items:
  - truth: "ROSTER-03: admin links a boarder to an existing user account (or leaves unlinked), and the account-exclusion filter keeps an already-linked account out of the picker"
    test: "Open Add/Edit Boarder, select an account from the Linked account dropdown, save, and confirm the boarder persists with that account. Then open a second boarder's dialog and confirm the just-linked account no longer appears in its dropdown. Then reopen the first (linked) boarder and confirm its own account still shows selected."
    expected: "The account persists on save; the taken account is excluded everywhere except the boarder that holds it; the unique index rejects a second boarder claiming the same account."
    why_human: "Zero of the 7 live-seeded boarders has a user link (38-COLLECTION.md). The picker's happy path, the exclusion filter, and the unique index's uniqueness half (as opposed to its proven many-unlinked-rows permissive half) have never executed against the live instance or a unit test."
  - truth: "ROSTER-05: admin edits an existing boarder's display name, tags and account link, and the change persists"
    test: "Open an existing boarder from the roster (kebab/inline Edit), change the name and/or tags and/or account, save, and confirm the row reflects the change without a page reload."
    expected: "The edit round-trips through the same ManageBoarder dialog in edit mode and persists via pb.collection('paytime_boarders').update."
    why_human: "No unit test exercises ManageBoarder.vue's edit path (only boarderSchema/paytimeBoarderMapper payload-shape tests exist), and the live seeding session (38-COLLECTION.md Task 2) only added boarders — it never edited one."
  - truth: "ROSTER-04: admin marks a boarder inactive from the row action menu, and marks them active again from the same menu"
    test: "Open the row action menu (kebab at 390px, inline buttons at desktop) for an active boarder, click Deactivate, confirm the row gets a muted Inactive badge and moves below the active boarders. Click Reactivate on the same row and confirm both reverse."
    expected: "toggleActive's single-field update persists and the shared roster ref patches in place with no refetch; the sort keeps actives first."
    why_human: "No unit test exists for BoarderRosterView.vue's toggleActive/sortedBoarders behavior, and this state transition was not exercised live (WINDOWS.md #6, 38-COLLECTION.md UNVERIFIED list)."
  - truth: "Admin deletes a boarder behind a useConfirm confirmation naming the boarder, and the row disappears from the list only after the delete resolves"
    test: "Click Delete on a throwaway boarder, confirm the dialog names that boarder, click Delete to accept, and confirm the row is removed only after the request resolves (not optimistically)."
    expected: "confirm.require fires with the boarder's name interpolated; removeBoarder deletes then filters the shared ref post-success."
    why_human: "No unit test exists for this flow and it was not exercised live in any recorded session."
  - truth: "The seven 390px UI backstops (tag-chip wrap, long name wrap in row/dialog, tag-picker overflow, long tag/account truncation, delete-confirmation wrap) render as specified rather than clipping or widening"
    test: "At 390px viewport width, walk each of the seven states named in 38-UI-SPEC.md's 'Planner note — the 7 backstops' paragraph."
    expected: "Each backstop behaves as UI-SPEC describes (wrap, not clip; truncate, not widen)."
    why_human: "Explicitly recorded as not walked in 38-COLLECTION.md and WINDOWS.md #6 — new surfaces with no shipped precedent to inherit correctness from; CSS-class presence (flex-wrap, break-words, truncate) is confirmed by grep but the rendered behavior at the actual breakpoint is not."
  - truth: "Saving the Add/Edit Boarder dialog with an empty or whitespace-only display name is rejected with the inline field error, and no record is created/changed"
    test: "Open Add Boarder, leave the name blank (or type only spaces), click Save."
    expected: "boarderSchema's trim().min(1) rejects it, fieldErrors.name renders 'Display name is required.', and no PocketBase write is attempted."
    why_human: "No unit test asserts this on boarderSchema.safeParse (boarderSchema.spec.ts covers only the tags transform), and 38-COLLECTION.md explicitly lists this as 'no record' — not exercised live either."
human_verification:
  - test: "All six behavior_unverified_items above, plus:"
    expected: "See each item's own expected outcome."
    why_human: "State-transition / round-trip behaviors present in code and wired, but not exercised by any test or live session."
  - test: "Confirm a non-admin account renders no Admin tab at all (not present-and-disabled)"
    expected: "PayTimeApp.vue's <Tab v-if=\"isAdmin\"> and <TabPanel v-if=\"isAdmin\"> both fail to render for a non-admin session."
    why_human: "Code-structurally confirmed via grep/read (v-if=\"isAdmin\" appears exactly twice, isAdmin = auth.user?.is_admin === true, not the isLoggedIn one-token-swap bug pattern) but never clicked with a live non-admin session (38-COLLECTION.md item C was not walked)."
  - test: "Review the three judgment-tier prohibitions recorded in the phase's PLAN frontmatter (non-authoritative LLM pass included below; human sign-off still required)"
    expected: "No roster/tag/deactivation copy or field editorializes about a boarder's conduct or reliability."
    why_human: "verification: judgment items are never auto-resolved. Non-authoritative check performed during this verification: BoarderRosterView.vue/ManageBoarder.vue expose only name, tags (free-text tenancy labels observed live as 'main'/'room-2'), account link, and a neutrally-worded, secondary-severity Inactive badge — no field, copy, or color found that frames a boarder as a judgment or deactivation as punitive. This is an LLM read, not a substitute for the required human sign-off."
---

# Phase 38: Boarder Roster Foundation Verification Report

**Phase Goal:** The admin maintains a tagged boarder roster entirely in-app — the canonical
payment subject every later phase builds on — before any payment data depends on it.
**Verified:** 2026-08-04T19:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | ROSTER-01: admin adds a boarder with a display name, entirely in-app | ✓ VERIFIED | `ManageBoarder.vue` create path wired to `mapToCreateBoarder`/`pb.collection("paytime_boarders").create`; **live-proven** — 7 boarders were seeded through the in-app flow only (38-COLLECTION.md), all readable back from the live instance |
| 2 | ROSTER-02: admin assigns one or more tags to a boarder | ✓ VERIFIED | Tag picker wired through `boarderSchema`'s transform; **live-proven** — seeded roster carries `main` (6 rows) and `room-2` (1 row), a real assign-existing-tag round trip |
| 3 | TAG-01: a new tag is created in-app and immediately assignable, no code/deploy | ✓ VERIFIED | **Live-proven**: `main` was created once and reused across 6 separate boarders (38-COLLECTION.md) — exactly TAG-01's round trip; no seeded vocabulary or `paytime_tags` reference anywhere in source (`grep -rc 'paytime_tags' src/` → 0) |
| 4 | ROSTER-03: admin optionally links a boarder to an existing user account, or leaves unlinked, with the taken-account filter working | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Code present and wired (`ManageBoarder.vue` account `Select`, `accountOptions` exclusion filter, mapper sends `user` on both create/update) — but **0 of 7 live rows has a `user` value**; the link-and-persist behavior and the exclusion filter have never executed against the live instance, and no unit test covers the picker's behavior (only mapper payload-shape is tested) |
| 5 | ROSTER-05: admin edits an existing boarder's name, tags, account link | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `openEdit`/`saveBoarder` wired to the same dialog in edit mode — no unit test of the edit path; not exercised live (seeding session only added rows) |
| 6 | ROSTER-04: admin deactivates and reactivates a boarder from the row action menu | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `toggleActive` wired, single write path confirmed (`grep -c 'is_active' ManageBoarder.vue` == 0), Inactive badge `severity="secondary"` confirmed — no unit test, not exercised live |
| 7 | Admin deletes a boarder behind a naming confirmation (D-38-15, part of SC1's "day-to-day roster changes") | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `useConfirm`/`removeBoarder` wired, post-success-only row removal confirmed by code read — no unit test, not exercised live |
| 8 | ROSTER-06 (read half): any authenticated user, admin or not, can read the roster | ✓ VERIFIED | `listRule`/`viewRule` = `@request.auth.id != ""` verbatim, read back live via `describe_collection` (independently re-confirmed by orchestrator) — the predicate structurally admits any authenticated caller with no `is_admin` branch to fail on |
| 9 | ROSTER-06 (write half, unauthenticated case): a tokenless write is refused | ✓ VERIFIED | Live curl probe: tokenless POST → HTTP 400; post-probe re-read via `mcp__pocketbase__list_records` (orchestrator) confirms roster unchanged at 7 rows, same ids — not merely inferred from the status code |
| 10 | VERIFY-03: unauthenticated read returns zero rows against a known non-empty roster | ✓ VERIFIED | Live curl probe against the 7-row roster: HTTP 200, parsed `items.length === 0` / `totalItems === 0` — non-vacuous per the plan's own precondition |
| 11 | A non-admin sees no Admin tab at all (client half of ROSTER-06) | ✓ VERIFIED | `v-if="isAdmin"` on both `<Tab>` and `<TabPanel>` (`grep -c` == 2), `isAdmin = auth.user?.is_admin === true` — not the `isLoggedIn` one-token-swap bug this codebase shipped once elsewhere; deterministic conditional render, confirmed by code read |
| 12 | The seven 390px UI backstops (chip wrap, long-name wrap, truncation, delete-confirm wrap) behave as UI-SPEC describes | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Supporting CSS classes present (`flex-wrap`, `break-words`, `truncate`) but none of the seven states was walked at 390px (38-COLLECTION.md, WINDOWS.md #6) |
| 13 | Empty/whitespace-only display name is rejected with an inline error and creates/changes nothing | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `boarderSchema`'s `z.string().trim().min(1, ...)` implements this, but no unit test asserts it and it was not exercised live (38-COLLECTION.md: "no record") |

**Score:** 7/13 truths verified (6 present + wired, behavior-unverified)

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | ROSTER-06 (write half, authenticated-non-admin case): a non-admin token is refused on create/update/delete | Phase 39 (VERIFY-02) | ROADMAP/REQUIREMENTS.md explicitly scope "both an admin token and a non-admin token ... all five rules exercised together" to Phase 39's VERIFY-02; no non-admin credential exists in this environment, and Plan 38-03 records this as its own `verification: backstop` truth rather than overclaiming it |
| 2 | ROSTER-07 (refuse delete with payment history) | Phase 39 | `paytime_payments.boarder` does not exist until Phase 39 — explicitly excluded from Phase 38 scope by the ROADMAP itself, not a gap here |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/phases/38-boarder-roster-foundation/38-COLLECTION.md` | D-13 paste-back evidence | ✓ VERIFIED | Non-empty, contains `listRule` etc.; independently re-confirmed against the live instance by the orchestrator (not just transcribed) |
| `src/types/paytime/boarders/types.d.ts` | `PaytimeBoarder`/`AddPaytimeBoarder` types | ✓ VERIFIED | Present, `extends RecordModel` |
| `src/lib/paytime/boarderSchema.ts` | Zod schema + tag normalization | ✓ VERIFIED | `boarderSchema`, `collectFieldErrors`, `normalizeTag`, `titleCaseTag`, `MaxTagLength` all present and exported |
| `src/lib/pocketbase/paytimeBoarderMapper.ts` | create/update payload builders | ✓ VERIFIED | `mapToCreateBoarder` (4 keys incl. `is_active`), `mapToUpdateBoarder` (3 keys, excludes `is_active`) |
| `src/composables/useBoarderRoster.ts` | cached roster read + `myBoarder` | ✓ VERIFIED, wired, data-flowing | Real `getFullList` against `paytime_boarders`, own `requestKey`, `authStore.onChange` invalidation — confirmed by 6 passing unit tests |
| `src/components/projects/paytime/ManageBoarder.vue` | Add/Edit dialog | ✓ VERIFIED, wired | 379 lines, real Zod-validated save flow, tag picker, account picker — no stub markers |
| `src/components/projects/paytime/BoarderRosterView.vue` | roster list + row actions | ✓ VERIFIED, wired | 227 lines, real row action cluster (Edit/Deactivate/Delete), Inactive badge, active-first sort — no stub markers |
| `src/composables/__tests__/useBoarderRoster.spec.ts` | dedup/cache/resolution contract tests | ✓ VERIFIED | 6 tests, all pass, non-vacuous (module reset + explicit mock assertions) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `BoarderRosterView.vue` | `boarders` (via `useBoarderRoster`) | `pb.collection("paytime_boarders").getFullList(...)` | Yes — live-confirmed 7 real rows | ✓ FLOWING |
| `ManageBoarder.vue` | `tagVocabulary` | Computed union of `boarders.value[].tags` | Yes — live-confirmed (`main`, `room-2`) | ✓ FLOWING |
| `ManageBoarder.vue` | `accountOptions` | `pb.collection("users").getFullList(...)` filtered against roster | Present and wired; never observed with real data (no boarder is linked, so filter's exclusion branch has no live case to exercise) | ⚠️ STATIC (unexercised, not hardcoded) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `PayTimeApp.vue` | `MonthlyReport.vue` | `v-if="isAdmin"` gated Tab/TabPanel | ✓ WIRED | `grep -c 'v-if="isAdmin"'` == 2 |
| `MonthlyReport.vue` | `BoarderRosterView.vue` | nested `TabPanel` | ✓ WIRED | `grep -Fc 'BoarderRosterView'` == 2 (import + usage) |
| `BoarderRosterView.vue` | `useBoarderRoster.ts` | `useBoarderRoster()` | ✓ WIRED | View never calls `getFullList` directly (`grep -Fc 'getFullList' BoarderRosterView.vue` == 0) |
| `useBoarderRoster.ts` | `paytime_boarders` (PocketBase) | `getFullList` with `requestKey: paytime-boarders-list` | ✓ WIRED | Confirmed distinct from `paytime-payments-list`/`paytime-report-list`/`paytime-users-list`, all four requestKeys unique |
| `ManageBoarder.vue` | `paytimeBoarderMapper.ts` | `mapToCreateBoarder`/`mapToUpdateBoarder` | ✓ WIRED | Both called in `saveBoarder` |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full unit suite | `npx vitest run --exclude '**/node_modules/**' --exclude '**/.claude/**'` | 127/127 passing, 17 files | ✓ PASS |
| Type-check | `npm run type-check` | Clean (`vue-tsc --build`, no output = success) | ✓ PASS |
| Boarder-specific suites | `npx vitest run useBoarderRoster.spec.ts boarderSchema.spec.ts paytimeBoarderMapper.spec.ts requestKeys.spec.ts` | 20/20 passing across 4 files | ✓ PASS |
| Structural grep gates (requestKeys, admin gate, `is_active` single-write-path, no `v-html`, no `font-semibold/bold`, no `paytime_tags`) | see commands run during this verification | All pass | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
|-------|---------|--------|--------|
| VERIFY-03 (tokenless read) | `curl` against `https://lexarium-backend.fly.dev/api/collections/paytime_boarders/records?perPage=1` | HTTP 200, `items.length=0`, `totalItems=0` against a known 7-row roster | PASS (transcript in 38-COLLECTION.md; roster row-count independently re-confirmed by the orchestrator via `mcp__pocketbase__list_records`, not merely narrated) |
| ROSTER-06 server half (tokenless write) | `curl -X POST` with no Authorization header | HTTP 400 refused; post-write re-read confirms 7 rows, same ids, unchanged | PASS (same evidence chain) |

This verifier did not independently re-run these curl probes against production — the transcripts in `38-COLLECTION.md` were already independently re-confirmed against the live instance by the orchestrator via `mcp__pocketbase__list_records`/`describe_collection` (per this task's evidence note), which is a stronger check than a third re-run would add.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| ROSTER-01 | 38-01 | Add boarder by display name | ✓ SATISFIED | Live-seeded 7 rows via in-app flow only |
| ROSTER-02 | 38-02 | Assign one or more tags | ✓ SATISFIED | Live tag round trip (`main` ×6, `room-2` ×1) |
| ROSTER-03 | 38-02 | Link to existing account or leave unlinked | ? NEEDS HUMAN | Code present/wired; never exercised (0/7 linked) |
| ROSTER-04 | 38-03 | Mark inactive/active | ? NEEDS HUMAN | Code present/wired; no test, not exercised live |
| ROSTER-05 | 38-03 | Edit name/tags/account link | ? NEEDS HUMAN | Code present/wired; no test, not exercised live |
| ROSTER-06 | 38-01, 38-03 | Any authenticated read; admin-only write | ✓ SATISFIED (unauthenticated case + read rule); authenticated-non-admin write case explicitly deferred to Phase 39 VERIFY-02 | Rule text + live probes (read/tokenless-write) all pass |
| TAG-01 | 38-02 | New tag, no code/deploy, immediately assignable | ✓ SATISFIED | Live round trip |
| VERIFY-03 | 38-03 | Unauthenticated read returns nothing | ✓ SATISFIED | Live probe, non-vacuous |

**Orphaned requirements:** None. All 8 requirement IDs mapped to Phase 38 in REQUIREMENTS.md appear in a plan's frontmatter `requirements` field (38-01: ROSTER-01, ROSTER-06; 38-02: ROSTER-02, ROSTER-03, TAG-01; 38-03: ROSTER-04, ROSTER-05, ROSTER-06, VERIFY-03). ROSTER-07 is correctly excluded per the ROADMAP's own note (payment-boarder relation doesn't exist until Phase 39) — not scored as a gap.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK` markers found in any phase-38 file | — | none |
| `ManageBoarder.vue:77-141` | WR-01 (38-REVIEW.md) | An edit on a boarder whose linked account was since deleted (`cascadeDelete: false`) round-trips the now-invalid `user` id, which PocketBase's relation-existence check rejects on an unrelated field edit | ⚠️ Warning | Not a phase-38 blocker: 0 of 7 live boarders is linked yet, so this edge case has never been hit; code review (0 critical, 1 warning) already flagged it with a concrete fix. Recommend fixing before ROSTER-03's link flow is exercised, since it directly affects that same flow's robustness. |

No debt-marker gate triggered — all findings above are pre-existing code-review observations (38-REVIEW.md), not newly discovered blockers.

### Human Verification Required

See `behavior_unverified_items` and `human_verification` in the frontmatter above for the full list with test/expected/why-human detail. Summary:

1. **Account link picker (ROSTER-03)** — link, exclude-taken-account, and reopen-shows-own-account behaviors, never exercised against the live instance.
2. **Edit boarder (ROSTER-05)** — name/tags/account edit round trip, never exercised.
3. **Deactivate/Reactivate (ROSTER-04)** — toggle round trip and sort-reorder, never exercised.
4. **Delete boarder** — confirmation + post-success removal, never exercised.
5. **Seven 390px UI backstops** — never walked.
6. **Empty/whitespace-only name rejection** — never exercised (unit or live).
7. **Non-admin session: Admin tab absent** — structurally confirmed by code; never clicked with a real non-admin session.
8. **Three judgment-tier prohibitions** (roster-as-judgment, tags-as-classification, deactivation-as-punitive) — non-authoritative LLM pass found no violations; human sign-off still required per the `verification: judgment` contract.

### Gaps Summary

No FAILED truths, no missing/stub artifacts, no broken key links, no blocker anti-patterns. The phase's foundational, security-relevant claims are the ones most thoroughly proven: ROSTER-01/02/06, TAG-01 and VERIFY-03 all have **live evidence** against the production PocketBase instance, independently re-confirmed by the orchestrator rather than taken on the executors' word. This matches the phase's own stated priority (D-13 invariant: pasted text plus behavioral probes, not acknowledgment).

What remains is the CRUD lifecycle's less-exercised half — account linking, edit, deactivate/reactivate, and delete — all of which are **present and correctly wired in code** (confirmed by direct reading of `ManageBoarder.vue`/`BoarderRosterView.vue`, cross-referenced against every PLAN acceptance grep gate, all passing) but have **zero test coverage and zero live exercise**. Per this phase's own SUMMARY/COLLECTION/WINDOWS.md, this is not a surprise finding — three consecutive execution turns openly recorded the same tooling constraint (no browser automation, no live admin session available to the executor) and flagged it rather than claiming a pass. This verification concurs with that self-assessment: the gap is real, it is exactly where the executors said it was, and it should be closed by a human clicking through the six items above before the phase is treated as fully closed — not by re-planning or code changes, since nothing here indicates the code itself is wrong.

---

_Verified: 2026-08-04T19:00:00Z_
_Verifier: Claude (gsd-verifier)_
