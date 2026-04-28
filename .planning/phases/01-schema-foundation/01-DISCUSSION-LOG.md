# Phase 1: Schema Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 01-schema-foundation
**Areas discussed:** Migration strategy, Access rules for new collection
**Areas resolved by Claude's discretion:** Backfill behavior, Field types in PocketBase

---

## Gray Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Migration strategy | Apply via PocketBase admin UI manually (and document the steps), or via pb_migrations JSON files committed to a backend repo | ✓ |
| Backfill behavior | Existing `dsu_meetings` records have no `duration_unit`. Required-with-default vs optional-null-treated-as-minutes | |
| Field types in PocketBase | Select fields with constrained values vs plain text; URL field type vs plain text | |
| Access rules for new collection | Same auth rules as existing dsu_* collections? Owner-scoped vs auth-only | ✓ |

**User's choice:** Migration strategy + Access rules
**Notes:** Backfill and field types were left to Claude's discretion. Captured in CONTEXT.md §Claude's Discretion as D-09 through D-13.

---

## Migration Strategy

### Q1: How will you actually apply these PocketBase schema changes?

| Option | Description | Selected |
|--------|-------------|----------|
| Manual via PB admin UI | I'll click through the admin UI; doc has exact steps | ✓ |
| pb_migrations JSON | Commit JSON migration files to a backend repo | |
| Both — docs + JSON | Document manual steps AND emit a JSON migration file | |

**User's choice:** Manual via PB admin UI

### Q2: What should `.planning/pocketbase-schema.md` contain?

| Option | Description | Selected |
|--------|-------------|----------|
| Step-by-step admin UI instructions | Numbered click-through steps with field names, types, options | ✓ |
| Schema definition only | JSON-style schema spec; user figures out application | |
| Both — spec + steps | Schema spec at the top, click-through steps below | |

**User's choice:** Step-by-step admin UI instructions

### Q3: Should the doc include rollback / 'how to undo' instructions?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, brief rollback per change | One-liner per field added or collection created | ✓ |
| No | Additive-only changes are low-risk | |

**User's choice:** Yes, brief rollback per change

### Q4: How should I verify the schema is correctly applied before moving to Phase 2?

| Option | Description | Selected |
|--------|-------------|----------|
| Smoke test script | TS script that hits PocketBase and confirms each field/collection exists | ✓ |
| Manual checklist | Doc lists what to verify in admin UI | |
| Trust the migration | If it applied without error it's fine | |

**User's choice:** Smoke test script

---

## Access Rules for New Collection

### Q1: What's the current PocketBase access rule on existing `dsu_*` collections?

| Option | Description | Selected |
|--------|-------------|----------|
| Auth-only (`@request.auth.id != ""`) | Any logged-in user; effectively single-user | ✓ |
| Owner-scoped | Records have owner field; rules filter by user.id | |
| Other / not sure | Will check | |

**User's choice:** Auth-only

### Q2: What access rules should `dsu_day_status` have?

| Option | Description | Selected |
|--------|-------------|----------|
| Match existing dsu_* | Whatever rule the others use | ✓ |
| Auth-only (read+write+delete) | Same as auth-only above | |
| Owner-scoped | Add owner field referencing users | |

**User's choice:** Match existing dsu_*

### Q3: Should the new collection include an owner/user reference field?

| Option | Description | Selected |
|--------|-------------|----------|
| No | App is single-user by design; don't add unused fields | ✓ |
| Yes — nullable user reference | Future-proof for multi-user | |

**User's choice:** No

### Q4: Date uniqueness — how strict?

| Option | Description | Selected |
|--------|-------------|----------|
| Single unique index on `date` | Only one record per date; updates replace | ✓ |
| Soft uniqueness | Frontend enforces via fetch-then-update | |

**User's choice:** Single unique index on `date`

---

## Claude's Discretion

The following gray areas were not selected for discussion. Claude picked sensible defaults documented in CONTEXT.md §Claude's Discretion (D-09 through D-13):

- **Backfill behavior:** `duration_unit` is optional with no PB-side backfill; frontend treats undefined as `'minutes'`.
- **`duration_unit` field type:** PocketBase select field, values `minutes` / `hours`.
- **`status` field type:** PocketBase select field, values `sl` / `vl` / `holiday`.
- **`link` field type:** PocketBase URL field (built-in URL validation), optional.
- **`date` field type on day status:** plain text `YYYY-MM-DD`, matching existing `dsu_*` convention.

## Deferred Ideas

- Moving to `pb_migrations/` JSON-based migrations (rejected for v1; revisit if schema changes accelerate).
- Owner-scoped access rules (rejected for v1; tied to single-user out-of-scope decision).
- PB-side backfill of legacy `duration_unit` records (rejected for v1; revisit if Phase 3 finds the null-handling brittle).
