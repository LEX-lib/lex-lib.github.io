# Phase 0: Pre-Wallecx Cleanup - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Strip `VITE_LOGIN_EMAIL` / `VITE_LOGIN_PASSWORD` from the codebase before any sensitive Wallecx (vaccination records) surface exists, so the production bundle cannot carry shipped credentials. Add a regression guard to prevent reintroduction. Credential rotation is an out-of-band user action — confirmed separately.

**In scope:** env.d.ts declaration removal, call-site removal (currently zero), `npm run lint:secrets` guard, out-of-band rotation confirmation checklist item.
**Out of scope:** local.jsonc file cleanup, new CI pipeline, pre-commit hooks, any Wallecx feature work.

</domain>

<decisions>
## Implementation Decisions

### Grep Guard (CLEAN-03)
- **D-01:** Implement as an `npm run lint:secrets` script — a `grep -r VITE_LOGIN_ src/` one-liner added to `package.json`. Zero new tooling dependencies, runs on demand, chainable into `npm run lint`. No pre-commit hook, no CI workflow (CI doesn't exist yet and is out of scope for this phase).

### local.jsonc Post-Rotation
- **D-02:** Leave `local.jsonc` as-is after credential rotation. File is gitignored (`.gitignore:48`) and the rotation (CLEAN-02) is the requirement — file content cleanup is not required by this phase. Do not modify `local.jsonc` as part of the code change.

### Login Regression Verification
- **D-03:** Manual smoke test — document in success criteria. Login.vue uses only user-entered values; it has no dependency on `VITE_LOGIN_*` env vars. A `npm run dev` + login attempt by the developer confirms no regression. No automated test required for this phase.

### Claude's Discretion
- The exact wording / exit code behavior of the `lint:secrets` npm script (grep exit code 0 = no matches = pass; exit code 1 = matches found = fail). Standard grep behavior handles this naturally.
- Whether to add an accompanying comment or note in `package.json` explaining the script's purpose.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 0 — Goal, requirements (CLEAN-01..03), and success criteria
- `.planning/REQUIREMENTS.md` §Pre-Wallecx Cleanup — CLEAN-01, CLEAN-02, CLEAN-03 definitions

### Codebase Context
- `.planning/codebase/CONCERNS.md` §Security Considerations — "Env-injected dev-login credentials shipped to client (HIGH)" and "Plaintext credentials in local.jsonc (CRITICAL)" entries provide background on the problem this phase solves
- `env.d.ts` — The file to edit: remove lines 7-8 (`VITE_LOGIN_EMAIL` and `VITE_LOGIN_PASSWORD` from `ImportMetaEnv`)
- `package.json` — Where to add the `lint:secrets` script (alongside existing `lint:oxlint` and `lint:eslint` entries)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No reusable components — this is a config/security cleanup phase with no frontend work.

### Established Patterns
- **npm scripts pattern:** `package.json` runs scripts as `lint:oxlint` and `lint:eslint` chained via `run-s lint:*`. A new `lint:secrets` entry follows this naming convention and will be picked up automatically by `run-s lint:*`.
- **env.d.ts:** Single `ImportMetaEnv` interface at `env.d.ts:3`. Remove the two `VITE_LOGIN_` lines only — preserve all other env var declarations.

### Integration Points
- `env.d.ts` → TypeScript type-checks all `import.meta.env.VITE_*` references across `src/`. Removing the declarations will surface any remaining call sites as type errors (there are none currently, confirmed by grep).
- `package.json` scripts section → `lint` script already chains `lint:*` entries via `run-s`; adding `lint:secrets` is automatically included.

### Current Call-Site Status
- `grep -r VITE_LOGIN_ src/` returns **zero matches** — no call sites exist under `src/`.
- `VITE_LOGIN_*` declarations exist only in `env.d.ts` lines 7-8.
- `local.jsonc` (gitignored) contains the plaintext values — not touched by this phase.

</code_context>

<specifics>
## Specific Ideas

No specific UI references or "I want it like X" moments — this is a pure cleanup phase.

</specifics>

<deferred>
## Deferred Ideas

- **`.env.example` file** — CONCERNS.md flags missing `.env.example` as HIGH priority. Surfaced during discussion; belongs in a future cleanup/housekeeping phase, not Phase 0 (not in CLEAN-01..03 scope).
- **GitHub Actions CI workflow** — CONCERNS.md flags missing CI as HIGH. The `lint:secrets` guard is the Phase 0 commitment; a full CI workflow (lint + type-check + build on PR) is a natural follow-on but out of scope here.
- **Pre-commit hook** — Considered as the guard mechanism; deferred to a future phase. The npm script covers the CLEAN-03 requirement with less tooling overhead.

</deferred>

---

*Phase: 00-pre-wallecx-cleanup*
*Context gathered: 2026-05-10*
