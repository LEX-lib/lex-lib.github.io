---
phase: 1
slug: schema-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-28
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Smoke-test script (tsx + pocketbase SDK) — not Vitest |
| **Config file** | None — script is self-contained at `.planning/phases/01-schema-foundation/verify-schema.ts` |
| **Quick run command** | `npx tsx --env-file=.env.local .planning/phases/01-schema-foundation/verify-schema.ts` |
| **Full suite command** | (same — single script) |
| **Estimated runtime** | ~3-5 seconds (network roundtrip to PocketBase) |

**Why not Vitest:** Phase 1 produces no `src/` code. The deliverables are (a) a markdown migration doc and (b) a runnable smoke-test script. The smoke-test script IS the validation artifact — it asserts the live PocketBase schema matches the spec.

---

## Sampling Rate

- **After every task commit:** N/A (Phase 1 tasks are doc-writing and script-writing, not code-modifying)
- **After Wave 0 (post-migration):** Run smoke script once; must exit 0 with all PASS lines
- **Before `/gsd-verify-work`:** Smoke script must exit 0
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | SCHEMA-04 | T-1-01 (rule blank = public) | Migration doc explicitly sets all 5 rule fields | manual | `grep -c '@request.auth.id != ""' .planning/pocketbase-schema.md` (≥ 5) | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | SCHEMA-04 | — | Each schema change has rollback note | manual | `grep -c '^### Rollback\|^**Rollback**' .planning/pocketbase-schema.md` (≥ 3) | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | SCHEMA-01/02/03 | T-1-02 (creds in repo) | Smoke script reads creds from env, never hardcoded | grep | `grep -E '(VITE_LOGIN_EMAIL\|process\.env)' .planning/phases/01-schema-foundation/verify-schema.ts` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | SCHEMA-01 | — | Script asserts `dsu_meetings.duration_unit` is select with values minutes,hours | smoke | `npx tsx --env-file=.env.local .planning/phases/01-schema-foundation/verify-schema.ts` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 1 | SCHEMA-02 | — | Script asserts `dsu_supports.link` is URL field, optional | smoke | (same) | ❌ W0 | ⬜ pending |
| 1-02-04 | 02 | 1 | SCHEMA-03 | — | Script asserts `dsu_day_status` exists with date/status fields, all 5 rules, unique index on date | smoke | (same) | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | SCHEMA-01/02/03 | — | Live PocketBase has all schema changes applied (user runs migration manually) | manual | smoke script exits 0 | depends on user | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.planning/pocketbase-schema.md` — step-by-step admin UI migration doc (covers SCHEMA-04)
- [ ] `.planning/phases/01-schema-foundation/verify-schema.ts` — smoke-test script (covers SCHEMA-01/02/03)
- [ ] `.env.local` — admin credentials in `VITE_LOGIN_EMAIL` / `VITE_LOGIN_PASSWORD` (already gitignored; user provides)

*No new dependencies — `tsx` and `pocketbase` 0.26.2 already in `package.json`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Migration doc readability/completeness | SCHEMA-04 | No automated tool can assert "doc has enough detail for the user to follow without thinking" | Read `.planning/pocketbase-schema.md` end-to-end; verify each step is unambiguous; check that field names, types, and values exactly match what the smoke script expects |
| Live PocketBase migrated correctly | SCHEMA-01/02/03 | User must manually click through PB admin UI to apply changes to the remote instance | Follow `.planning/pocketbase-schema.md`; afterward, run the smoke script; verify exit 0 |
| Rollback steps actually undo the change | SCHEMA-04 | Rollback verification requires intentionally breaking the schema, which would lose data; tested only if needed | Documented as a one-line note per change; not exercised in CI |

---

## Validation Sign-Off

- [ ] All tasks have automated verify (smoke script or grep) or Wave 0 dependencies
- [ ] Sampling continuity: smoke script covers SCHEMA-01/02/03 in one shot
- [ ] Wave 0 covers all MISSING references (verify-schema.ts and pocketbase-schema.md)
- [ ] No watch-mode flags (smoke script is one-shot exit-coded)
- [ ] Feedback latency < 5s (single network roundtrip per assertion)
- [ ] `nyquist_compliant: true` set in frontmatter once Wave 0 deliverables exist

**Approval:** pending
