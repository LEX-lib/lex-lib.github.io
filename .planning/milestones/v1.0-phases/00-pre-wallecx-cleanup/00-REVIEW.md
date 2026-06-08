---
phase: 00-pre-wallecx-cleanup
reviewed: 2026-05-10T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - env.d.ts
  - package.json
  - CLAUDE.md
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 0: Code Review Report

**Reviewed:** 2026-05-10
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

The three Phase 0 edits are functionally correct and meet the primary security goal: `VITE_LOGIN_EMAIL` and `VITE_LOGIN_PASSWORD` are gone from `env.d.ts`, the `ImportMetaEnv` interface remains syntactically valid, no call sites remain under `src/`, no `.env` file carries those keys, and CLAUDE.md no longer advertises the removed variables. The `lint:secrets` script is also wired correctly into the `run-s lint:*` chain.

Two warnings are raised: the `lint:secrets` script has an inverted exit-code semantic that will silently pass in every standard npm CI usage, and `AGENTS.md` (a source-code file, not a planning artifact) still documents the removed variables. Two info items cover a stale worktree copy and a leftover `VITE_FEATURE_FLAG_EXAMPLE` declaration.

---

## Warnings

### WR-01: lint:secrets exits 0 on success — npm treats exit 0 as pass, so the guard never fails

**File:** `package.json:18`

**Issue:** The script is `"grep -r VITE_LOGIN_ src/"`. POSIX `grep` exits `0` when it finds matches and `1` when it finds none. npm (and every CI runner) treats a non-zero exit as script failure. This means:

- Clean state (no `VITE_LOGIN_` in `src/`): `grep` exits `1` → **npm reports the script as failed**.
- Dirty state (`VITE_LOGIN_` reintroduced): `grep` exits `0` → **npm reports the script as passed**.

The guard is inverted relative to its stated purpose. `npm run lint` will fail every time the codebase is clean, and will silently pass every time the secret is reintroduced. The `.planning/STATE.md:73` note acknowledges this inversion and describes it as "intended alerting behavior," but that reasoning breaks down when `lint:secrets` is chained inside `run-s lint:*`: a clean run of `npm run lint` will always error on `lint:secrets`, making the lint step permanently broken for normal development use.

**Fix:** Invert the exit code so the script exits `1` (failure) when the pattern is found and `0` (success) when absent:

```json
"lint:secrets": "grep -r VITE_LOGIN_ src/ && (echo 'FAIL: VITE_LOGIN_ found in src/' && exit 1) || exit 0"
```

Or, equivalently and more readably using a shell negation:

```json
"lint:secrets": "! grep -r VITE_LOGIN_ src/"
```

The `!` prefix is supported by `sh`/`bash` and by `npm-run-all2`'s shell invocation on all platforms where this project runs.

---

### WR-02: AGENTS.md still documents VITE_LOGIN_EMAIL / VITE_LOGIN_PASSWORD as active dev shortcuts

**File:** `AGENTS.md:48`

**Issue:** Line 48 reads:

```
Dev-only shortcuts: `VITE_LOGIN_EMAIL` / `VITE_LOGIN_PASSWORD` (pre-fill login form).
```

`AGENTS.md` is checked-in source (it is not under `.planning/` and is not a lock file), so it is in scope. Any agent or developer reading this file after Phase 0 is directed to set env vars that no longer have TypeScript declarations and whose use under `src/` is now actively guarded against by `lint:secrets`. The documentation creates a false expectation and could prompt a developer to reintroduce the pattern `lint:secrets` is meant to prevent.

**Fix:** Remove or replace line 48 in `AGENTS.md`. Replace the "Dev-only shortcuts" sentence with a note that those variables have been removed, or simply delete the line and update the env-file table to match CLAUDE.md (which correctly lists only `VITE_APP_NAME` and `VITE_API_BASE_URL`).

---

## Info

### IN-01: Stale worktree copy at .claude/worktrees/ still carries old env.d.ts with VITE_LOGIN_ declarations

**File:** `.claude/worktrees/agent-a57995fd7e21d7fab/env.d.ts:7-8`

**Issue:** The worktree copy was not updated as part of this phase. It is not checked into the main working tree and is likely a transient agent workspace, but if `lint:secrets` is ever extended to scan beyond `src/` (or if the worktree is accidentally merged), the stale declarations could cause confusion. The worktree's `CLAUDE.md` and `AGENTS.md` also still reference `VITE_LOGIN_*`.

**Fix:** No immediate code change required. When the worktree is no longer needed, delete it. If the worktree is being used by an active agent for Phase 1, ensure it receives the Phase 0 changes before proceeding with any work that references the removed variables.

---

### IN-02: VITE_FEATURE_FLAG_EXAMPLE declared in env.d.ts but not documented in CLAUDE.md

**File:** `env.d.ts:6`

**Issue:** `VITE_FEATURE_FLAG_EXAMPLE` is declared in `ImportMetaEnv` as `string | boolean` but is not listed in the CLAUDE.md "Key variables" section (which now lists only `VITE_APP_NAME` and `VITE_API_BASE_URL`). This is a pre-existing inconsistency, not introduced by Phase 0, but the Phase 0 CLAUDE.md edit was an opportunity to address it.

**Fix:** Either add `VITE_FEATURE_FLAG_EXAMPLE` to the Key variables list in CLAUDE.md, or remove the declaration from `env.d.ts` if it is unused. Low priority — this does not affect security or correctness.

---

_Reviewed: 2026-05-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
