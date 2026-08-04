---
phase: 38
slug: boarder-roster-foundation
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-04
---

# Phase 38 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register origin: `register_authored_at_plan_time: true` — all three PLAN files carried a
`<threat_model>` block, so this audit **verifies the authored register's mitigations** rather than
retroactively constructing one. At ASVS L1 with `threats_open: 0` the short-circuit in
`secure-phase.md` step 3 applies, so no separate auditor pass was required; every closure below
cites evidence gathered during execution and independently re-confirmed against the live
PocketBase instance.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| unauthenticated internet → `paytime_boarders` read endpoint | Tokenless requests reach the collection directly; the `listRule`/`viewRule` predicate is the only thing between them and the roster | Boarder names, tags, account links, active flags |
| unauthenticated internet → `paytime_boarders` write endpoints | A created row here would mean the write rules are effectively public | Attacker-controlled roster rows |
| authenticated non-admin browser → `paytime_boarders` write endpoints | A logged-in boarder holds a valid token; only the `is_admin` predicate separates them from full roster control | Roster mutations |
| Vue client (`v-if="isAdmin"`) → PocketBase | **Cosmetic only.** Every call is re-checked server side; the client gate hides UI, it does not enforce | Admin-only UI surface |
| `users` collection → `paytime_boarders.user` relation | Deleting an account crosses into boarder data; `cascadeDelete` decides whether the boarder survives | Account identity ↔ payment subject |
| admin-typed tag text → `tags` json → roster/dialog render | Free-form text crosses from an input into stored data and back into the DOM | Untrusted display strings |
| `users` collection → account picker option labels | Every app user's name and email is read into the admin client | PII (names, emails) |
| admin browser → `paytime_boarders` delete endpoint | Permanent destructive operation; in Phase 38 the only guards are the admin-only `deleteRule` and a confirm dialog | Irrecoverable roster rows |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-38-01 | Information Disclosure | `listRule` / `viewRule` | high | mitigate | Both authored as `@request.auth.id != ""` — **live-verified verbatim** via `describe_collection`, recorded in `38-COLLECTION.md`. No rule left empty (an empty string is PUBLIC in PocketBase, not "unconfigured"). Behavioural half: tokenless GET returned `200` with `items: []` / `totalItems: 0` against a roster independently known to hold 7 rows, so the assertion is non-vacuous. | closed |
| T-38-02 | Elevation of Privilege | `createRule` / `updateRule` / `deleteRule` | high | mitigate | All three contain the literal `is_admin` (`@request.auth.is_admin = true`), live-verified — **not** the bare authenticated check that shipped once in `GiftExchangeManage.vue`. Behavioural half: tokenless POST refused (`400`), **and** the roster independently re-read afterward at exactly 7 rows with unchanged ids, so the refusal is confirmed by observed state rather than by status code alone. | closed |
| T-38-04 | Tampering | `user` relation config | high | mitigate | `cascadeDelete: false` live-verified in the collection schema and recorded verbatim. Deleting a `users` account clears the link instead of destroying the boarder row (and, from Phase 39, its payment history). | closed |
| T-38-03 | Elevation of Privilege | `PayTimeApp.vue` client admin gate | medium | mitigate | `isAdmin = auth.user?.is_admin === true` with `v-if="isAdmin"` on both `<Tab>` and `<TabPanel>`; code review confirmed the predicate is not the `isLoggedIn` one-token swap. **UAT test 7 confirmed the tab is absent — not disabled — in a real non-admin session.** Documented as cosmetic; the server rules (T-38-01/T-38-02) hold independently. | closed |
| T-38-05 | Tampering | `user` uniqueness | medium | mitigate | Unique index present and **partial**: `CREATE UNIQUE INDEX idx_cI4xxZj3yh ON paytime_boarders (user) WHERE user != ''`. RESEARCH assumption A1 is closed by observation — seven accountless rows coexisted (a plain `UNIQUE(user)` would have rejected rows 2–7, since PocketBase stores an unset relation as `''` not `NULL`). UAT test 1 then exercised the uniqueness half: one row linked, and the account correctly excluded from every other boarder's picker. | closed |
| T-38-07 | Tampering | tag text stored in `tags`, rendered as chips | low | mitigate | Verified by inspection: **no `v-html`, `innerHTML`, or any raw-HTML directive exists anywhere in `src/components/projects/paytime/` or `useBoarderRoster.ts`.** Tags reach the DOM only via `v-for="tag in boarder.tags"` into PrimeVue `Tag`'s escaped `value` binding. The Zod transform additionally bounds each tag to `MaxTagLength` and strips whitespace-only entries. | closed |
| T-38-11 | Repudiation | probe evidence | low | mitigate | Probe transcripts appended verbatim to the committed `38-COLLECTION.md` (`## VERIFY-03 / ROSTER-06 probe results`, plus `### Post-probe row-count confirmation`) rather than reported only in a SUMMARY — so a later phase re-reads what was observed instead of trusting a paraphrase (the Phase 35 `35-06-AUDIT.md` precedent). | closed |
| T-38-08 | Information Disclosure | `users` list read by the account picker | medium | accept | See Accepted Risks Log. | closed |
| T-38-10 | Denial of Service | boarder Delete with no history guard | medium | accept | See Accepted Risks Log. | closed |
| T-38-12 | Spoofing | expired / malformed token treated as authenticated | medium | accept | See Accepted Risks Log. | closed |
| T-38-06 | Repudiation | roster write attribution | low | accept | See Accepted Risks Log. | closed |
| T-38-09 | Tampering | `user` reassignment on update | low | accept | See Accepted Risks Log. | closed |
| T-38-SC | Tampering | npm/pip/cargo installs | low | accept | See Accepted Risks Log. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (`high`) count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-38-01 | T-38-08 | Every app user's name and email is read into the admin's client by the account picker. `users.listRule` already scopes broad listing to `is_admin` (D-38-13, verified against prod), the read is lazy on dialog open rather than on mount, and nothing is persisted client-side beyond the dialog's lifetime. Not mitigated further because narrowing the read needs a `users` rule change this phase is explicitly scoped out of. | Plan author (D-38-13) | 2026-08-04 |
| AR-38-02 | T-38-10 | Deleting a boarder is unrecoverable; only the admin-only `deleteRule` and a `useConfirm` dialog stand in the way. Accepted as an explicit user override (D-38-15) on the grounds that a boarder mistyped five minutes ago should be removable. Bounded by two facts: only an admin can reach the endpoint, and no payment can reference a boarder yet, so there is no history to lose. Phase 39 layers ROSTER-07's has-history refusal onto this same button. | User override (D-38-15) | 2026-08-04 |
| AR-38-03 | T-38-12 | Expired/malformed-token semantics are recorded as observed behaviour rather than asserted, because this instance has no shipped precedent for them. Accepted at L1 on a primary boundary because the tokenless case — the one an attacker reaches with no credential at all — is fully asserted in both directions, and PocketBase token validation is not code this project owns. | Plan author | 2026-08-04 |
| AR-38-04 | T-38-06 | Roster writes are not attributed to an actor. The roster is ~7 rows with exactly one admin, and Phase 39 introduces `recorded_by` on payments, where attribution actually matters. | Plan author | 2026-08-04 |
| AR-38-05 | T-38-09 | `mapToUpdateBoarder` deliberately sends `user`, so an admin can move or clear a link — that is ROSTER-03/ROSTER-05, not an escalation. Only an admin can reach the update endpoint, and the unique index prevents a reassignment producing two boarders on one account. | Plan author | 2026-08-04 |
| AR-38-06 | T-38-SC | Nothing to mitigate: this phase installed zero packages. The tag picker uses PrimeVue's already-installed `AutoComplete`, the account picker its `Select`, and the probes use `curl`/`node` from the existing toolchain. `38-RESEARCH.md`'s Package Legitimacy Audit records "not applicable". | Plan author | 2026-08-04 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-04 | 13 | 13 | 0 | Claude (`/gsd-secure-phase 38`, L1 short-circuit) |

---

## Carried Forward to Phase 39

Not Phase 38 threats, but recorded here so they are not lost:

- **ROSTER-06's authenticated-non-admin write half is proven by rule text only.** A tokenless probe
  fails under both an admin-gated rule and a merely-authenticated one, so it cannot distinguish
  them. The token-based exercise is Phase 39's VERIFY-02. The static half (all three rules contain
  the literal `is_admin`) plus the client gate (UAT test 7) is what Phase 38 establishes.
- **`38-REVIEW.md` WR-01** — a boarder whose linked account is later deleted keeps a dead relation
  id (`cascadeDelete: false`, by design per T-38-04), and the next unrelated edit round-trips it,
  so PocketBase rejects the update with nothing in the UI explaining why. Not a Phase 38 blocker,
  but as of UAT one boarder is now linked, so this is reachable — and Phase 39 makes linking central.
- **`is_active` has no server-side backstop.** PocketBase v0.23+ removed per-field defaults, so the
  default lives in `boarderSchema`/`paytimeBoarderMapper` across three deliberate write paths. Any
  future write path bypassing the mapper sets no default. Same caveat for whitespace-name rejection,
  which is Zod-only — the live schema would accept `"   "`.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-04
