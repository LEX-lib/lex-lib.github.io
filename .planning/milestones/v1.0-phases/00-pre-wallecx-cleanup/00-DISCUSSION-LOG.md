# Phase 0: Pre-Wallecx Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 00-pre-wallecx-cleanup
**Areas discussed:** Grep guard mechanism, local.jsonc post-rotation scope, Login regression verification

---

## Grep Guard Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| npm run lint:secrets script | Add a `grep -r VITE_LOGIN_ src/` one-liner to package.json. Zero new tooling, runs on demand, chains into `npm run lint` via `run-s lint:*`. | ✓ |
| Pre-commit hook via simple-git-hooks | Add `simple-git-hooks` with the grep in `.simple-git-hooks`. Runs on every commit, bypassed with --no-verify. | |
| GitHub Actions CI workflow | Create `.github/workflows/ci.yml` that runs grep + lint + type-check + build on PR. Most reliable for teams, but no CI exists yet. | |

**User's choice:** npm run lint:secrets script
**Notes:** Zero new tooling dependency was the deciding factor. The `run-s lint:*` pattern already picks it up automatically.

---

## local.jsonc Post-Rotation Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Strip VITE_LOGIN_* keys from local.jsonc too | Consistent with removing env.d.ts declarations; local-only cleanup. | |
| Leave local.jsonc as-is | File is gitignored; CLEAN-02 only requires rotating credentials, not editing the file. | ✓ |

**User's choice:** Leave local.jsonc as-is
**Notes:** The rotation (new passwords) is the requirement. File content cleanup is not required.

---

## Login Regression Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Manual smoke test — document in success criteria | `npm run dev` + login attempt. Login.vue uses only user-entered values, so env var removal has zero functional impact. | ✓ |
| npm run type-check must pass | vue-tsc catches accidental VITE_LOGIN_* references at compile time. | |
| Both — type-check + manual smoke test | Belt-and-suspenders for a security phase. | |

**User's choice:** Manual smoke test
**Notes:** Login.vue confirmed to have no dependency on VITE_LOGIN_* vars. Manual verification is sufficient.

---

## Claude's Discretion

- Exact grep exit-code behavior in the `lint:secrets` script (standard grep handles naturally)
- Whether to add a comment in package.json explaining the script's purpose

## Deferred Ideas

- `.env.example` file — CONCERNS.md HIGH priority but out of CLEAN-01..03 scope
- GitHub Actions CI workflow — natural follow-on, out of Phase 0 scope
- Pre-commit hook — considered as guard mechanism, deferred
