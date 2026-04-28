# Phase 1: Schema Foundation - Research

**Researched:** 2026-04-28
**Domain:** PocketBase schema management, admin UI migration documentation, Node.js TypeScript smoke-test scripting
**Confidence:** MEDIUM (admin UI navigation verified via community sources; field shape verified via SDK source; exact admin UI screenshots unavailable)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Schema is applied **manually via the PocketBase admin UI**. No `pb_migrations/` JSON files in this repo.
- **D-02:** `.planning/pocketbase-schema.md` contains **step-by-step admin UI instructions** — numbered click-throughs with exact field names, types, options, and validation rules.
- **D-03:** Each change has a **brief rollback note** per step. Mandatory for every change.
- **D-04:** Phase 1 ships a **smoke-test script** at `.planning/phases/01-schema-foundation/verify-schema.ts` that hits `VITE_API_BASE_URL` and confirms each new field/collection exists.
- **D-05:** Existing `dsu_meetings`, `dsu_tasks`, `dsu_supports` use `@request.auth.id != ""` for all rules.
- **D-06:** New `dsu_day_status` adopts the same auth-only rules for all five rule fields.
- **D-07:** No `owner`/`user` reference field on `dsu_day_status`.
- **D-08:** Single unique DB index on `dsu_day_status.date`.
- **D-09:** `dsu_meetings.duration_unit` is optional, no default backfill. Undefined = `'minutes'` in Phase 2+.
- **D-10:** `duration_unit` is a PocketBase **select field** (`minutes`, `hours`).
- **D-11:** `dsu_day_status.status` is a PocketBase **select field** (`sl`, `vl`, `holiday`).
- **D-12:** `dsu_supports.link` is a PocketBase **URL field**, optional.
- **D-13:** `dsu_day_status.date` is a PocketBase **plain text field**, `YYYY-MM-DD` format.
- **D-14:** Migration doc at `.planning/pocketbase-schema.md` (project-level, not phase directory).

### Claude's Discretion

All discretion items (D-09 through D-14) are already locked via the context above.

### Deferred Ideas (OUT OF SCOPE)

- Migration tooling / `pb_migrations/` JSON — rejected for v1.
- Owner-scoped access — rejected for v1.
- Backfill default for legacy `dsu_meetings.duration_unit` — rejected for v1.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCHEMA-01 | `dsu_meetings` has `duration_unit` field (`'minutes' \| 'hours'`) | Select field with `maxSelect: 1`, `values: ['minutes', 'hours']`; optional (not required). Admin UI: edit collection > New field > Select type. |
| SCHEMA-02 | `dsu_supports` has optional `link?: string` field for URLs | URL field type; optional. Admin UI: edit collection > New field > URL type. |
| SCHEMA-03 | New `dsu_day_status` collection with `{date: string, status: 'sl' \| 'vl' \| 'holiday'}` and unique index on `date` | New base collection, text + select fields, Rules tab for auth-only, Indexes tab for unique constraint. |
| SCHEMA-04 | All schema changes documented in `.planning/pocketbase-schema.md` with exact admin steps | Step-by-step click-through doc covering all three changes with rollback notes. |
</phase_requirements>

---

## Summary

Phase 1 is a **documentation + scripting phase**. No application code changes. The deliverables are two files: a manual migration doc (`.planning/pocketbase-schema.md`) and a smoke-test TypeScript script (`.planning/phases/01-schema-foundation/verify-schema.ts`). The actual schema changes are made by the user following the doc against their live PocketBase instance.

The technical work involves (a) knowing the exact PocketBase admin UI navigation for the installed server version and (b) writing a Node-runnable TypeScript script that uses `pocketbase@0.26.2` to authenticate and call `pb.collections.getOne()` to verify field presence and field properties.

**Key insight:** The PocketBase JS SDK `0.26.2` corresponds to a PocketBase server in the `0.22.x`–`0.26.x` range. The admin UI in that range has a stable interface: left-sidebar collection list, "New collection" button, per-collection edit drawer with Schema / Rules / Indexes tabs. [VERIFIED: pocketbase.io/docs, community articles]

**Primary recommendation:** Write the migration doc first (it encodes all spec decisions as human instructions), then write the verify script to programmatically assert the same spec (collection exists, field exists with correct type/options, index contains `UNIQUE`). The smoke script is the gate before Phase 2.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Schema definition (`duration_unit`, `link`, `dsu_day_status`) | Database / Storage (PocketBase server) | — | Fields live on the remote PB instance; this repo holds only the client SDK and types |
| Migration documentation | Static files (`.planning/`) | — | Human-executed runbook; no runtime component |
| Schema verification | Backend Integration (Node.js script, not browser) | — | Requires admin-level `collections.getOne` call; runs outside Vite |
| Access rules (`@request.auth.id != ""`) | Database / Storage (PocketBase server) | — | Rules enforced at DB query layer by PB, not in frontend |
| Unique index on `dsu_day_status.date` | Database / Storage (PocketBase server) | — | SQLite-level constraint created via PB Indexes tab |

---

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pocketbase (npm) | 0.26.2 (locked) | JS SDK for auth + collections API | Only official client; `pb.collections.getOne()` is the introspection API |
| tsx | 4.21.0 (system-wide via npx) | Run `.ts` files in Node without compilation | Zero-config TypeScript runner; already available on the dev machine |
| dotenv (Node built-in via `--env-file`) | Node 22 built-in | Load `.env` vars for verify script | No extra dep; Node 20.6+ supports `--env-file` flag |

[VERIFIED: `tsx --version` confirmed 4.21.0 system-wide; `node --version` confirmed v22.14.0; `npm view pocketbase version` confirmed 0.26.8 latest, 0.26.2 installed per package.json]

### No New Dependencies Required

The smoke-test script needs only `pocketbase` (already a production dependency) and `tsx` (already system-wide). **Do not add `tsx` to devDependencies** unless the planner decides to make `verify:schema` a permanent npm script; if so, `tsx` is the right addition (`npm install -D tsx`).

**Version verification:**
```bash
npm view pocketbase version   # 0.26.8 latest; project uses 0.26.2
tsx --version                 # 4.21.0 system-wide
node --version                # v22.14.0
```

[VERIFIED: npm registry + local environment check]

---

## Architecture Patterns

### System Architecture Diagram

```
User reads .planning/pocketbase-schema.md
        |
        v
User applies changes in PocketBase Admin UI
  ┌─────────────────────────────────────────────┐
  │  PocketBase Admin Dashboard (browser)        │
  │  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
  │  │ dsu_     │  │ dsu_     │  │ dsu_day_  │  │
  │  │ meetings │  │ supports │  │ status    │  │
  │  │ (edit)   │  │ (edit)   │  │ (create)  │  │
  │  │ +field   │  │ +field   │  │ +fields   │  │
  │  │ duration │  │ link     │  │ date      │  │
  │  │ _unit    │  │ (URL)    │  │ status    │  │
  │  └──────────┘  └──────────┘  │ rules     │  │
  │                               │ index     │  │
  │                               └───────────┘  │
  └─────────────────────────────────────────────┘
        |
        v
User runs: npx tsx .planning/phases/01-schema-foundation/verify-schema.ts
        |
        v
Script: new PocketBase(VITE_API_BASE_URL)
  --> pb.collection('users').authWithPassword(email, password)
  --> pb.collections.getOne('dsu_meetings')   → assert field 'duration_unit' type='select'
  --> pb.collections.getOne('dsu_supports')   → assert field 'link' type='url'
  --> pb.collections.getOne('dsu_day_status') → assert collection exists
                                              → assert field 'date' type='text'
                                              → assert field 'status' type='select'
                                              → assert indexes contains 'UNIQUE'
  --> PASS / FAIL with descriptive output
```

### Recommended Project Structure (additions only)

```
.planning/
├── pocketbase-schema.md          # Migration doc (SCHEMA-04 deliverable)
└── phases/
    └── 01-schema-foundation/
        ├── 01-CONTEXT.md         # existing
        ├── 01-RESEARCH.md        # this file
        └── verify-schema.ts      # Smoke-test script (SCHEMA-04 / D-04 deliverable)
```

No changes to `src/` in this phase.

### Pattern 1: PocketBase Admin UI Navigation (v0.22+)

**What:** The admin dashboard structure for creating/editing collections. Based on verified community sources and the official docs (which document the same API surface).

**Steps for editing an existing collection (adding a field):**

1. Navigate to `VITE_API_BASE_URL/_/` in your browser (PocketBase admin).
2. In the left sidebar, find the collection name (e.g., `dsu_meetings`).
3. Click the **settings cog icon** next to the collection name, OR click the collection name then the settings icon in the top area of the panel.
4. The collection edit drawer/modal opens. You are on the **Fields** tab by default.
5. Scroll to the bottom of the field list and click **"+ New field"** (or the add button).
6. Choose the field type from the type selector.
7. Fill in the field name and type-specific options.
8. Click **Save** (or equivalent confirm button) in the field editor.
9. Click **Save** on the collection editor to commit all pending changes.

**Steps for creating a new collection:**

1. In the left sidebar, click **"New collection"** (or the `+` button near the Collections heading).
2. Enter the collection name.
3. Choose type: **Base** (not Auth, not View).
4. Add fields via **"+ New field"** (same as above).
5. Switch to the **Rules** tab. Set all five rule fields: `listRule`, `viewRule`, `createRule`, `updateRule`, `deleteRule`.
6. Switch to the **Indexes** tab. Add any indexes.
7. Click **Create** (or **Save**).

[VERIFIED: pocketbase.io/docs/collections, karakabakov.com/posts/using-pocketbase-as-backend, deepwiki.com/pocketbase/pocketbase/5.3-collection-management-ui]

### Pattern 2: Select Field Configuration

**What:** How to configure a `select` field with constrained values and single-select.

**In the Admin UI:**
- Field type: **Select**
- Field name: `duration_unit` (or `status`)
- **Options** section:
  - **Max select**: `1` (single-select; value stored as a `string`, not array)
  - **Options / Values**: type each allowed value and press Enter/Add — e.g., `minutes`, then `hours`
- Required: leave unchecked (optional field per D-09/D-11)

**Resulting field shape in `pb.collections.getOne()` response:**
```typescript
{
  name: 'duration_unit',
  type: 'select',
  required: false,
  maxSelect: 1,
  values: ['minutes', 'hours'],
  // ...other CollectionField base props
}
```

[VERIFIED: pocketbase.io/jsvm/classes/SelectField.html, community discussion #6897 showing validation_required when values not set]
[CITED: pocketbase.io/jsvm/classes/SelectField.html — "The list of accepted values" and "Specifies the max allowed selected values"]

**Critical:** `values` is **required** for select fields — if you save a select field without at least one value, PocketBase returns a `validation_required` error. Always fill in the values before saving.

### Pattern 3: URL Field Configuration

**What:** The built-in URL field type stores a URL string with server-side format validation.

**In the Admin UI:**
- Field type: **URL**
- Field name: `link`
- Required: leave unchecked (optional)

**Behavior:**
- PocketBase validates URL format on **the server** when a non-empty value is submitted. [CITED: pocketbase.io/docs/collections — "URLField defines `url` type field for storing a single URL string value"]
- Default / empty value is `""` (empty string), not `null`. The frontend should treat both `""` and missing key as "no link". [CITED: pocketbase.io/docs/collections — "default: `""`"]
- No client-side browser validation is added by PocketBase; that is the frontend's responsibility.

**Resulting field shape:**
```typescript
{
  name: 'link',
  type: 'url',
  required: false,
  // ...other CollectionField base props
}
```

### Pattern 4: Text Field for Date

**What:** Plain text field storing `YYYY-MM-DD` dates to avoid PocketBase `date` type timezone coercion.

**In the Admin UI:**
- Field type: **Text**
- Field name: `date`
- Required: **checked** (every day-status record must have a date)
- Min length / Max length / Pattern: leave blank (the unique index enforces uniqueness; format validated only in frontend/smoke test)

**Rationale:** PocketBase's `date` field stores RFC3339 datetimes and converts during serialization. Plain text sidesteps timezone surprises — matches the existing convention in `dsu_meetings`, `dsu_tasks`, `dsu_supports` where `date` is already a text field. [VERIFIED: existing types `dsu_meetings/types.d.ts` — `date: string`]

### Pattern 5: Unique Index via Admin UI Indexes Tab

**What:** How to add a single-field unique index in the PocketBase admin UI.

**In the Admin UI:**
1. In the collection edit drawer, switch to the **Indexes** tab.
2. Click **"+ New index"** (or equivalent add button).
3. A text input accepts a raw SQL CREATE INDEX statement.
4. Enter:
   ```sql
   CREATE UNIQUE INDEX idx_dsu_day_status_date ON dsu_day_status (date)
   ```
5. Click Save on the index, then Save on the collection.

**Shape in collections API response:**
```json
"indexes": [
  "CREATE UNIQUE INDEX `idx_dsu_day_status_date` ON `dsu_day_status` (`date`)"
]
```

The smoke-test can check: `collection.indexes.some(idx => idx.includes('UNIQUE') && idx.includes('date'))`.

[VERIFIED: github.com/pocketbase/pocketbase/discussions/2424 — official maintainer confirms SQL string format]
[CITED: pocketbase.io/docs/api-collections — indexes is `Array<string>` of SQL expressions]

**Partial index note:** If you want the unique constraint to ignore empty values (not applicable here since `date` is required), add a `WHERE date != ''` clause. For this phase, no WHERE clause is needed.

### Pattern 6: Access Rules Syntax

**What:** Auth-only rule applied to all five rule fields.

**Value:** `@request.auth.id != ""`

**In the Admin UI:**
- In the collection edit drawer, switch to the **Rules** tab.
- Five fields: List, View, Create, Update, Delete.
- Paste `@request.auth.id != ""` into each of the five fields.
- The UI has a CodeMirror editor with autocomplete.

[CITED: pocketbase.io/docs/collections — "Rules use `@request.auth.id != ""` to verify authenticated users"]

### Pattern 7: Smoke-Test Script Structure

**What:** A standalone TypeScript script using `pocketbase` SDK to verify schema post-migration.

**Runner:** `npx tsx .planning/phases/01-schema-foundation/verify-schema.ts`

**Why tsx, not ts-node or Vitest:**
- `tsx` is already system-wide (v4.21.0 confirmed). Zero new deps.
- `ts-node` is not installed. `vitest` is for unit tests, not CLI scripts.
- `tsx` handles ESM imports natively (the `pocketbase` package is ESM-only in its default export). [VERIFIED: pocketbase npm package `dist-tags.latest: 0.26.8`; ESM-only confirmed via README]

**Env var loading:** Use Node 22's `--env-file` flag:
```bash
npx tsx --env-file=.env.local .planning/phases/01-schema-foundation/verify-schema.ts
```
Or fall back to `dotenv` if `--env-file` is not available. But since Node 22 is confirmed, `--env-file` is the zero-dep path.

**Script skeleton:**
```typescript
// Source: PocketBase JS SDK README + this project's src/lib/pocketbase/index.ts pattern
import PocketBase from 'pocketbase';

const BASE_URL = process.env.VITE_API_BASE_URL!;
const EMAIL    = process.env.VITE_LOGIN_EMAIL!;
const PASSWORD = process.env.VITE_LOGIN_PASSWORD!;

const pb = new PocketBase(BASE_URL);

// Auth: use regular user auth (not superuser/admin token)
await pb.collection('users').authWithPassword(EMAIL, PASSWORD);

// Collection introspection requires admin/superuser token in PB 0.22+
// Regular users cannot call pb.collections.getOne() — requires superuser
// Use pb.admins.authWithPassword (pre-0.23) or pb.collection('_superusers') (0.23+)
// For SDK 0.26.2 targeting PB ~0.22: pb.admins.authWithPassword(EMAIL, PASSWORD)
// OR: authenticate as regular user and attempt — if 403, use admins API
```

**Critical security note on collections API access:** [ASSUMED - see Assumptions Log A1]
The `pb.collections.getOne()` endpoint requires **superuser / admin authentication** in PocketBase. A regular `users` collection auth token will return a 403. The smoke script must authenticate with admin credentials.

- Pre-PB 0.23: `pb.admins.authWithPassword(email, password)`
- PB 0.23+: `pb.collection('_superusers').authWithPassword(email, password)` — isSuperuser check via `pb.authStore.isSuperuser`
- SDK 0.26.2 exposes `pb.authStore.isSuperuser` [CITED: js-sdk README — "Admin status is checkable via: `pb.authStore.isSuperuser`"]

The smoke test should use `VITE_LOGIN_EMAIL`/`VITE_LOGIN_PASSWORD` (already in env.d.ts), which are the admin credentials. If those credentials are for a regular user account, the test will 403 — this is an open question for the user (see Open Questions).

**Field lookup helper:**
```typescript
// CollectionModel.fields: Array<CollectionField>
// CollectionField: { id, name, type, system, hidden, presentable, [key: string]: any }
function findField(collection: CollectionModel, name: string) {
  return collection.fields.find(f => f.name === name);
}

// Assertions
const meetings = await pb.collections.getOne('dsu_meetings');
const durationUnit = findField(meetings, 'duration_unit');
assert(durationUnit, 'dsu_meetings.duration_unit field missing');
assert(durationUnit.type === 'select', `expected select, got ${durationUnit.type}`);
assert(
  durationUnit.values?.includes('minutes') && durationUnit.values?.includes('hours'),
  'duration_unit missing expected values'
);
```

[CITED: github.com/pocketbase/js-sdk/blob/master/src/tools/dtos.ts — CollectionField type]

### Anti-Patterns to Avoid

- **Using `pb.collection('dsu_meetings').getFullList()` for schema verification** — this fetches records, not schema. Use `pb.collections.getOne()`.
- **Using the PocketBase `date` field type for `dsu_day_status.date`** — introduces RFC3339 serialization and timezone coercion. Use `text` instead (D-13).
- **Calling `pb.collections.getOne()` without admin auth** — returns 403; the collections API is superuser-only.
- **Leaving `values` empty on a select field** — PocketBase returns `validation_required`. Always fill values before saving.
- **Using `maxSelect: 2+` for single-select fields** — changes return type from `string` to `string[]`, breaking existing mappers.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL validation on `link` field | Custom regex validation in forms | PocketBase URL field type | Server-enforced; handles protocol, format. Frontend can add Zod refinement in Phase 3 if needed. |
| Uniqueness check on `date` in app code | Pre-save `getList` check + conditional create | Unique index on PocketBase | Race condition safe; database-enforced; already decided (D-08). |
| TypeScript compilation for smoke script | `tsc` + `node dist/...` pipeline | `tsx` | Zero setup, handles ESM imports, no tsconfig changes needed for a one-off script. |
| Enum validation of `duration_unit` / `status` values | App-side allow-list check | PocketBase select field with `values` | Server rejects invalid values at write time; no need to duplicate client-side. |

---

## Common Pitfalls

### Pitfall 1: Select Field Saved Without Values

**What goes wrong:** User clicks "New field", sets type to Select, enters a name, and clicks Save before entering allowed values. PocketBase returns a `validation_required` error.

**Why it happens:** `values` is a required configuration for select fields in PocketBase. The UI may not make this obvious.

**How to avoid:** Migration doc must instruct: enter all allowed values before clicking Save. Include a "Verify step" that shows the values list is populated.

**Warning signs:** Admin UI shows a red error after clicking Save; field does not appear in the schema.

### Pitfall 2: Collections API Requires Admin Auth

**What goes wrong:** Smoke script authenticates as a regular user via `pb.collection('users').authWithPassword()`, then calls `pb.collections.getOne()` and gets a 403.

**Why it happens:** The collections management API is restricted to superusers/admins. Regular auth tokens do not have schema-read permission.

**How to avoid:** Smoke script must use admin credentials. Use `pb.admins.authWithPassword()` (PB <0.23) or check `pb.authStore.isSuperuser` after auth to confirm. [ASSUMED — see A1 regarding exact API for the user's specific PB version]

**Warning signs:** Script exits with `ClientResponseError: Failed to authenticate` or `403 Forbidden` on `getOne` call.

### Pitfall 3: doc / Script Drift

**What goes wrong:** The migration doc says "add field `duration_unit`" but the smoke script checks for `duration_units` (typo). Or the doc is updated but the script is not.

**Why it happens:** Two artifacts encoding the same spec — they can diverge.

**How to avoid:** Planner should sequence: write doc first (defines the canonical field names), then write script from the doc. Field names in the script are string literals copied verbatim from the doc.

**Warning signs:** Script PASS but field name in doc doesn't match production — smoke test checks wrong name.

### Pitfall 4: node_modules Not Installed

**What goes wrong:** User runs `npx tsx verify-schema.ts` in the project root without running `npm install` first. The `pocketbase` import fails with `Cannot find module 'pocketbase'`.

**Why it happens:** `node_modules/` is not present — the project has a `package.json` but no installed deps (confirmed: `node_modules/` directory absent at research time).

**How to avoid:** Migration doc and smoke-test readme-comment must include prerequisite: `npm install`. The `npx tsx` invocation must be run from the project root so Node resolves `pocketbase` from `./node_modules`.

**Warning signs:** `Error: Cannot find module 'pocketbase'` — classic missing deps error.

### Pitfall 5: Idempotency — User Applies a Step Twice

**What goes wrong:** User runs through the migration doc a second time (e.g., forgot if they applied step 2) and tries to create `dsu_day_status` again, getting a "collection already exists" error.

**Why it happens:** Manual migration docs don't track application state.

**How to avoid:** Each step starts with: "Verify `[field/collection]` does not exist. If it already exists with the correct configuration, skip this step." This is already noted in the CONTEXT.md `<specifics>` section (D-14 pattern).

**Warning signs:** PocketBase admin shows an error toast when trying to create a duplicate collection.

### Pitfall 6: PocketBase Server Version Mismatch

**What goes wrong:** User's PocketBase server is older than 0.22 and the admin UI looks different, or newer than 0.26 and some navigation has changed (the 0.37.0 release was a full UI rewrite with dark mode).

**Why it happens:** The JS SDK version (0.26.2) is a loose proxy for the server version but doesn't guarantee exact parity.

**How to avoid:** Migration doc should note the expected server version range (0.22–0.26). If the user's UI looks different (e.g., has dark mode and a new layout from 0.37+), instruct them to consult the current docs — the field types and index syntax remain stable.

**Warning signs:** Admin UI has dark mode + redesigned layout = likely 0.37+; click-through steps may have renamed buttons.

---

## Code Examples

### Smoke-Test: Full Pattern

```typescript
// Source: PocketBase JS SDK README (pocketbase.io/docs/) + project env conventions
// Runner: npx tsx --env-file=.env.local .planning/phases/01-schema-foundation/verify-schema.ts
import PocketBase, { type CollectionModel } from 'pocketbase';

const BASE_URL = process.env.VITE_API_BASE_URL;
const EMAIL    = process.env.VITE_LOGIN_EMAIL;
const PASSWORD = process.env.VITE_LOGIN_PASSWORD;

if (!BASE_URL || !EMAIL || !PASSWORD) {
  console.error('Missing env vars: VITE_API_BASE_URL, VITE_LOGIN_EMAIL, VITE_LOGIN_PASSWORD');
  process.exit(1);
}

const pb = new PocketBase(BASE_URL);

// Admin auth — required for collections API
// SDK 0.26 supports pb.admins.authWithPassword for PB servers < 0.23
// and pb.collection('_superusers').authWithPassword for PB 0.23+
// Try the modern path first; fall back if needed.
try {
  await pb.collection('_superusers').authWithPassword(EMAIL, PASSWORD);
} catch {
  // PB < 0.23 fallback
  await (pb as any).admins.authWithPassword(EMAIL, PASSWORD);
}

function findField(col: CollectionModel, name: string) {
  return col.fields.find((f) => f.name === name);
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  PASS: ${message}`);
  }
}

// --- SCHEMA-01: dsu_meetings.duration_unit ---
console.log('\nChecking dsu_meetings.duration_unit...');
const meetings = await pb.collections.getOne('dsu_meetings');
const durationUnit = findField(meetings, 'duration_unit');
assert(!!durationUnit, 'field duration_unit exists');
assert(durationUnit?.type === 'select', 'duration_unit type is select');
assert(durationUnit?.maxSelect === 1, 'duration_unit maxSelect is 1');
assert(
  durationUnit?.values?.includes('minutes') && durationUnit?.values?.includes('hours'),
  'duration_unit values include minutes and hours'
);
assert(!durationUnit?.required, 'duration_unit is optional (not required)');

// --- SCHEMA-02: dsu_supports.link ---
console.log('\nChecking dsu_supports.link...');
const supports = await pb.collections.getOne('dsu_supports');
const link = findField(supports, 'link');
assert(!!link, 'field link exists');
assert(link?.type === 'url', 'link type is url');
assert(!link?.required, 'link is optional');

// --- SCHEMA-03: dsu_day_status collection ---
console.log('\nChecking dsu_day_status collection...');
const dayStatus = await pb.collections.getOne('dsu_day_status');
assert(!!dayStatus, 'dsu_day_status collection exists');
assert(dayStatus.type === 'base', 'dsu_day_status is a base collection');

const dateField = findField(dayStatus, 'date');
assert(!!dateField, 'field date exists');
assert(dateField?.type === 'text', 'date type is text');
assert(!!dateField?.required, 'date is required');

const statusField = findField(dayStatus, 'status');
assert(!!statusField, 'field status exists');
assert(statusField?.type === 'select', 'status type is select');
assert(statusField?.maxSelect === 1, 'status maxSelect is 1');
assert(
  statusField?.values?.includes('sl') &&
  statusField?.values?.includes('vl') &&
  statusField?.values?.includes('holiday'),
  'status values include sl, vl, holiday'
);
assert(!!statusField?.required, 'status is required');

// Rules: all five should be @request.auth.id != ""
const EXPECTED_RULE = '@request.auth.id != ""';
['listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule'].forEach((rule) => {
  assert(
    (dayStatus as any)[rule] === EXPECTED_RULE,
    `dsu_day_status.${rule} = '${EXPECTED_RULE}'`
  );
});

// Unique index on date
assert(
  dayStatus.indexes.some((idx) => idx.includes('UNIQUE') && idx.toUpperCase().includes('DATE')),
  'dsu_day_status has a UNIQUE index on date'
);

const failed = process.exitCode === 1;
console.log(failed ? '\nResult: FAILED — fix the above issues then re-run.' : '\nResult: PASSED — schema is ready for Phase 2.');
```

### Migration Doc Idempotency Pattern

```markdown
### Step 2.3 — Add `duration_unit` field to `dsu_meetings`

**Verify first:** In the `dsu_meetings` field list, check if `duration_unit` already exists.
If it does **and** it is a Select field with values `minutes`, `hours` — **skip this step**.

1. Click the settings cog next to `dsu_meetings` in the sidebar.
2. In the **Fields** tab, click **+ New field**.
3. Field type: **Select**
4. Field name: `duration_unit`
5. In the Options panel:
   - Max select: `1`
   - Add value: `minutes` (press Enter)
   - Add value: `hours` (press Enter)
6. Leave **Required** unchecked.
7. Click **Save field**.
8. Click **Save** on the collection editor.

**To undo:** Delete the `duration_unit` field from the Fields tab. Existing records are unaffected (they will no longer have the field).
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PocketBase schema fields stored as `schema[]` array | Fields stored as `fields[]` array with `CollectionField` shape | PB 0.23+ | Smoke script uses `collection.fields`, not `collection.schema` |
| `pb.admins.authWithPassword()` for admin auth | `pb.collection('_superusers').authWithPassword()` | PB 0.23 | Smoke script needs dual-path auth (see Pattern 7) |
| Unique constraint via per-field "Unique" checkbox | Unique index via SQL string in the Indexes tab | PB 0.14+ | "Unique" field option is outdated; use Indexes tab |

[CITED: github.com/pocketbase/pocketbase/discussions/2287 — "Unique constraint field error is gone after v0.14"]
[CITED: pocketbase.io — SDK README `pb.authStore.isSuperuser`]

**Deprecated / outdated:**
- `collection.schema[]` property: renamed to `collection.fields[]` in PB 0.23+. Do not reference `schema` in the smoke script.
- Per-field "Unique" checkbox in field configuration: removed after 0.14; replaced by the Indexes tab.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The user's PocketBase server version is in the 0.22–0.26 range, matching the JS SDK 0.26.2 vintage; the admin UI navigation described (cog icon, Fields/Rules/Indexes tabs) is accurate for that range. | Architecture Patterns, Admin UI Navigation | If server is 0.37+, button labels may differ; the doc will be misleading. Migration doc should note the expected UI version. |
| A2 | `VITE_LOGIN_EMAIL` / `VITE_LOGIN_PASSWORD` are admin/superuser credentials (not a regular user account). | Pitfall 2, Smoke-Test code example | If they are regular user creds, `pb.collections.getOne()` will 403. Script needs to handle or document this. |
| A3 | The `_superusers` collection auth path works for the user's PB version (0.23+ path). The fallback to `pb.admins.authWithPassword()` handles pre-0.23. | Code Examples | If neither path works, the smoke script cannot authenticate for schema introspection. |
| A4 | `dsu_day_status.status` and `dsu_day_status.date` should both be `required: true`. (D-11 says status is a select field; D-13 says date is text. Neither explicitly says required.) | Schema field spec | If required is left as false, the smoke test assertion on `required` will fail. Planner should confirm: are both fields required? |

---

## Open Questions

1. **Are `VITE_LOGIN_EMAIL` / `VITE_LOGIN_PASSWORD` admin-level credentials?**
   - What we know: These env vars exist in `env.d.ts` as optional. They are used for testing.
   - What's unclear: Whether they correspond to a PocketBase `_superusers` record or a regular `users` record. Only superusers can call the collections management API.
   - Recommendation: The smoke script should first attempt `pb.collection('_superusers').authWithPassword(...)` and catch/fallback. The migration doc should include a note: "the verify script requires admin credentials in VITE_LOGIN_EMAIL / VITE_LOGIN_PASSWORD."

2. **What is the user's actual PocketBase server version?**
   - What we know: JS SDK is 0.26.2. PB server version is not pinned in this repo.
   - What's unclear: Whether the server is 0.22, 0.23, 0.26, or newer (e.g., 0.37 with the UI rewrite).
   - Recommendation: Migration doc should open with: "These steps target PocketBase server 0.22–0.26. If your admin UI has a dark theme and significantly different layout, you are likely on 0.37+; consult the current PocketBase docs instead."

3. **Should `date` and `status` on `dsu_day_status` be `required`?**
   - What we know: D-13 says `date` is text `YYYY-MM-DD`; D-11 says `status` is select. Both are semantically required (a day status record without a date or status is nonsensical).
   - Recommendation: Mark both as **Required** in the admin UI and assert `required === true` in the smoke script. If the planner disagrees, this is a trivial change to the doc + script.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | tsx runner, `--env-file` flag | Yes | v22.14.0 | — |
| tsx | Smoke-test runner | Yes (system, via npx) | 4.21.0 | `ts-node` if tsx unavailable (not installed) |
| npm / node_modules | `pocketbase` import in script | **No — `npm install` not yet run** | — | Run `npm install` first |
| PocketBase server instance | Smoke-test `pb.collections.getOne()` | Unknown (external service) | Unknown | — |
| `.env.local` with admin creds | Smoke-test auth | Unknown | — | Script exits with clear error if missing |

**Missing dependencies with no fallback:**
- PocketBase server must be running and reachable at `VITE_API_BASE_URL` — no fallback (smoke test is inherently live).
- `npm install` must be run before executing the script — add as prerequisite in the script header comment and migration doc.

**Missing dependencies with fallback:**
- `tsx` available system-wide; if user doesn't have it, `npx tsx` will install it ephemerally.

---

## Validation Architecture

> `workflow.nyquist_validation: true` in `.planning/config.json` — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npm run test:unit -- --run` |
| Full suite command | `npm run test:unit -- --run` |

**Note:** Phase 1 produces no application code, only documentation and a standalone script. Vitest is not the right tool for verifying schema migration. The validation artifact for this phase is the smoke-test script itself, which IS the test.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCHEMA-01 | `dsu_meetings.duration_unit` select field with values `minutes`/`hours` | smoke (integration) | `npx tsx --env-file=.env.local .planning/phases/01-schema-foundation/verify-schema.ts` | No — Wave 0 creates it |
| SCHEMA-02 | `dsu_supports.link` URL field, optional | smoke (integration) | same command | same file |
| SCHEMA-03 | `dsu_day_status` collection with fields, rules, unique index on `date` | smoke (integration) | same command | same file |
| SCHEMA-04 | Migration doc exists and is complete | manual review | `cat .planning/pocketbase-schema.md` — check for all three steps | No — Wave 0 creates it |

**Manual-only justification:** SCHEMA-04 (migration doc completeness) requires human review — no automated tool can assert "the doc has enough detail for a user to follow." The verify script covers SCHEMA-01/02/03 programmatically.

### Sampling Rate

- **Per task commit:** Not applicable (no unit tests; the verify script is run by the user post-migration)
- **Per wave merge:** Run the smoke test once after migration: `npx tsx --env-file=.env.local .planning/phases/01-schema-foundation/verify-schema.ts`
- **Phase gate:** Smoke test exits 0 (all PASS) before Phase 2 begins.

### Wave 0 Gaps

- [ ] `.planning/phases/01-schema-foundation/verify-schema.ts` — covers SCHEMA-01/02/03; created as part of this phase's deliverables (it IS the wave 0 artifact)
- [ ] `.planning/pocketbase-schema.md` — covers SCHEMA-04; created as part of this phase's deliverables

*(No Vitest infrastructure gaps — this phase adds no `src/` code and therefore no unit tests.)*

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 1 |
|-----------|------------------|
| `@/*` alias maps to `./src/*` | Smoke script must NOT use `@/` imports — it runs outside Vite. Import `pocketbase` directly. |
| Two-stage lint: `oxlint` then `eslint --fix` | Smoke script at `.planning/` is outside `src/`; lint scripts target `src/` only. No lint required for the script. |
| Prettier runs on `src/` only | Script formatting is the author's discretion. |
| `npm run deploy` must continue to work | Phase 1 adds no `src/` files; deploy is unaffected. |
| No framework swaps, additive schema only | Fully respected — no code changes, no destructive schema changes. |
| `node_modules` not present | `npm install` is a prerequisite step for running the smoke script. |

---

## Security Domain

> `security_enforcement` not set in config.json — treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes (smoke script authenticates) | PocketBase `authWithPassword` — use admin creds from `.env.local` (gitignored), never hardcode |
| V3 Session Management | No | Script is a one-shot CLI; no session persistence |
| V4 Access Control | Yes (collection rules) | `@request.auth.id != ""` on all five rule fields — same as existing collections |
| V5 Input Validation | Partial | URL field: server-side validation by PocketBase; select field: server-side enum enforcement |
| V6 Cryptography | No | No crypto in this phase |

### Known Threat Patterns for This Phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Hardcoded credentials in verify script | Information Disclosure | Use `--env-file=.env.local`; script reads `process.env.*`; never commit credentials |
| Unauthenticated access to `dsu_day_status` | Elevation of Privilege | `@request.auth.id != ""` on all five rules — same as existing dsu_* collections |
| Missing rule fields (left null = public access) | Elevation of Privilege | Migration doc must explicitly set all five rule fields, not leave any blank (blank = unrestricted public access in PocketBase) |

**Critical:** In PocketBase, a **blank / null rule = unrestricted public access**. The migration doc must set ALL FIVE rules (`listRule`, `viewRule`, `createRule`, `updateRule`, `deleteRule`) to `@request.auth.id != ""`. Leaving any one blank makes that operation publicly accessible.

---

## Sources

### Primary (HIGH confidence)
- [PocketBase Collections Docs](https://pocketbase.io/docs/collections/) — Field types, URL field default, select field, access rules syntax
- [PocketBase API Collections Docs](https://pocketbase.io/docs/api-collections/) — `indexes` array shape (SQL strings), collection model fields
- [PocketBase JS SDK — SelectField JSVM reference](https://pocketbase.io/jsvm/classes/SelectField.html) — `values` required, `maxSelect` semantics
- [PocketBase JS SDK source — dtos.ts](https://github.com/pocketbase/js-sdk/blob/master/src/tools/dtos.ts) — `CollectionModel`, `CollectionField` TypeScript types
- [PocketBase JS SDK README](https://github.com/pocketbase/js-sdk) — `authWithPassword`, Node.js import syntax, `isSuperuser`

### Secondary (MEDIUM confidence)
- [GitHub Discussion #2424 — Unique indexes](https://github.com/pocketbase/pocketbase/discussions/2424) — Maintainer confirms SQL string format for indexes, partial index WHERE clause
- [DeepWiki — Collection Management UI](https://deepwiki.com/pocketbase/pocketbase/5.3-collection-management-ui) — Admin UI component names, tab structure
- [GitHub Discussion #6897 — Select field validation_required](https://github.com/pocketbase/pocketbase/discussions/6897) — Confirmed that empty `values` on select field causes validation error
- [GitHub Discussion #2287 — Unique constraint history](https://github.com/pocketbase/pocketbase/discussions/2287) — Confirmed per-field unique checkbox removed after 0.14

### Tertiary (LOW confidence)
- [karakabakov.com — Using PocketBase as backend](https://karakabakov.com/posts/using-pocketbase-as-backend/) — Admin UI cog icon, Rules tab description (community article, no date)

---

## Metadata

**Confidence breakdown:**
- PocketBase field types (select, URL, text): HIGH — verified via official JSVM reference + docs
- Admin UI navigation steps: MEDIUM — verified via community sources; no official screenshot walkthrough found
- Collections API (`pb.collections.getOne`) shape: HIGH — verified via SDK source code
- Unique index SQL syntax: HIGH — verified via official maintainer in GitHub discussion
- Smoke-test script (tsx + ESM + auth): MEDIUM — pattern is verified; exact dual-path auth for pre/post 0.23 is ASSUMED (A3)

**Research date:** 2026-04-28
**Valid until:** 2026-05-28 (stable; PocketBase admin UI stable in 0.22–0.26 range; note 0.37 introduced a UI rewrite)
