# PocketBase Schema Migration — LexTrack v1

This document is the canonical migration runbook for Phase 1 schema changes in the LexTrack
optimization milestone. All three changes below are applied manually via the PocketBase admin
UI against your live PocketBase instance — there are no automated migration files in this repo.
The changes are **additive only**: no existing data is renamed, dropped, or modified. After
applying all three sections, run the smoke test (`npm run verify:schema`) to confirm the live
schema matches this spec before starting Phase 2.

> **PocketBase version note:** These steps target PocketBase server **v0.22–0.26** (admin UI
> with a left sidebar collection list, settings cog per collection, and Fields / Rules / Indexes
> tabs per collection edit drawer). If your admin UI has a dark theme and a significantly
> redesigned layout (typically v0.37+), the underlying field types and SQL index syntax remain
> valid — consult the current PocketBase docs for navigation differences.

---

## Prerequisites

Before following this runbook, confirm:

1. You have admin / superuser credentials for the PocketBase instance at `VITE_API_BASE_URL`.
2. You can reach `<VITE_API_BASE_URL>/_/` in a browser and log in to the admin dashboard.
3. `npm install` has been run in this repo so the `pocketbase` package is available for the
   smoke test script (`npm run verify:schema`).
4. Your `.env.development` file contains `VITE_API_BASE_URL`, `VITE_LOGIN_EMAIL`, and
   `VITE_LOGIN_PASSWORD` with the admin/superuser credentials. The smoke script uses these to
   authenticate against the collections management API. (`.env.development` is gitignored —
   safe for credentials. If you'd rather keep dev-server vars and superuser creds in
   different files, put the superuser creds in `.env.local` and change the script in
   `package.json` to point at it.)

---

## Section 1: Add `duration_unit` field to `dsu_meetings` (SCHEMA-01)

### Pre-flight check (idempotency)

Open the `dsu_meetings` collection in the admin UI. In the field list, check whether
`duration_unit` already exists. If it **does** exist and it is a **Select** field with the
values `minutes` and `hours` — **skip this section entirely.** Re-applying it would cause an
error.

### Steps

1. Navigate to `<VITE_API_BASE_URL>/_/` in your browser and log in to the admin dashboard.

2. In the left sidebar, find `dsu_meetings`. Click the **settings cog icon** next to it.

3. The collection edit drawer opens. You should be on the **Fields** tab by default.

4. Scroll to the bottom of the field list and click **+ New field**.

5. Choose field type: **Select**.

6. Enter field name: `duration_unit` (exact: lowercase, underscore, no spaces).

7. In the field's **Options** panel:
   - Set **Max select** to `1`.
   - In the values input, type `minutes` then press **Enter** to add it.
   - Type `hours` then press **Enter** to add it.
   - **Critical:** both values must be added before clicking Save. Saving a Select field with
     an empty values list returns a `validation_required` error and the field will not be
     created.
   - Confirm both `minutes` and `hours` appear in the values list.

8. Leave **Required** unchecked. This field is optional — existing `dsu_meetings` records do
   not get backfilled. The Phase 2 mapper and Phase 3 UI treat `undefined` (absent field) as
   `'minutes'` (the legacy default), so existing data continues to render correctly.

9. Click **Save** on the field editor to close the field panel.

10. Click **Save** on the collection editor to commit the change to the collection.

### Verification

After saving, re-open the `dsu_meetings` collection edit drawer and confirm:
- `duration_unit` appears in the field list
- Its type shows as **Select**
- Its allowed values are `minutes` and `hours`

### Rollback

Open `dsu_meetings` via the settings cog. On the **Fields** tab, find `duration_unit` and
click its delete icon. Click **Save** on the collection editor. Existing meeting records are
unaffected — they simply no longer carry the field. This is a safe additive rollback; no
existing data is lost.

---

## Section 2: Add `link` field to `dsu_supports` (SCHEMA-02)

### Pre-flight check (idempotency)

Open the `dsu_supports` collection in the admin UI. In the field list, check whether `link`
already exists. If it **does** exist and it is a **URL** field — **skip this section
entirely.**

### Steps

1. Navigate to `<VITE_API_BASE_URL>/_/` and log in (skip if continuing directly from
   Section 1 in the same session).

2. In the left sidebar, click the **settings cog icon** next to `dsu_supports`.

3. The collection edit drawer opens. Select the **Fields** tab.

4. Scroll to the bottom and click **+ New field**.

5. Choose field type: **URL**.

6. Enter field name: `link` (exact: lowercase, no spaces).

7. Leave **Required** unchecked. This field is optional — the frontend treats both an empty
   string (`""`) and a missing key as "no link". Existing `dsu_supports` records are unaffected.

8. Click **Save** on the field editor.

9. Click **Save** on the collection editor.

### Verification

Re-open the `dsu_supports` collection and confirm:
- `link` appears in the field list
- Its type shows as **URL**
- Required is unchecked

### Rollback

Open `dsu_supports` via the settings cog. On the **Fields** tab, delete the `link` field.
Click **Save** on the collection editor. Existing support records are unaffected.

---

## Section 3: Create `dsu_day_status` collection (SCHEMA-03)

### Pre-flight check (idempotency)

In the admin sidebar, check whether `dsu_day_status` already exists. If it **does** exist,
open it and verify:
- Fields: `date` (Text, required) and `status` (Select with values `sl`, `vl`, `holiday`,
  required)
- All five access rules equal `@request.auth.id != ""`
- A UNIQUE index on `date` exists

If all of the above are already correct — **skip this section entirely.** If the collection
exists but is misconfigured, delete it (see Rollback at the bottom of this section) and
re-create it by following the steps below.

### Steps

1. Navigate to `<VITE_API_BASE_URL>/_/` and log in.

2. In the left sidebar, click **+ New collection** (or the `+` icon near the Collections
   heading).

3. Enter the collection name: `dsu_day_status` (exact: lowercase, underscores).

4. Set the collection type to **Base** — NOT Auth, NOT View.

5. You are now on the **Fields** tab. Add the following two fields:

   **Field A — `date`:**
   - Click **+ New field**.
   - Field type: **Text**
   - Field name: `date`
   - Check **Required** (every day-status record must have a date; a record without a date
     is invalid).
   - Leave Min length, Max length, and Pattern blank. The unique index (added below) enforces
     one record per date. The `YYYY-MM-DD` format is enforced by the frontend — using the
     plain **Text** type instead of PocketBase's native **Date** type avoids timezone coercion
     during RFC3339 serialization.
   - Click **Save** on the field editor.

   **Field B — `status`:**
   - Click **+ New field**.
   - Field type: **Select**
   - Field name: `status`
   - Set **Max select** to `1`.
   - In the values input, add each value and press **Enter**:
     - `sl` (Sick Leave)
     - `vl` (Vacation Leave)
     - `holiday`
   - Confirm all three values — `sl`, `vl`, `holiday` — appear in the values list.
   - Check **Required** (a status record without a status value is nonsensical).
   - **Critical:** add all three values before clicking Save; an empty Select values list
     causes a `validation_required` error.
   - Click **Save** on the field editor.

6. Switch to the **Rules** tab.

   > **Critical security step:** In PocketBase, a blank (null) rule means **unrestricted
   > public access** for that operation. All five rules below must be set to a non-empty
   > string before saving the collection.

   Paste this exact string into **each** of the five rule fields — do not leave any blank:

   ```
   @request.auth.id != ""
   ```

   The five fields to set:

   | Rule field | Value |
   |------------|-------|
   | **List rule** | `@request.auth.id != ""` |
   | **View rule** | `@request.auth.id != ""` |
   | **Create rule** | `@request.auth.id != ""` |
   | **Update rule** | `@request.auth.id != ""` |
   | **Delete rule** | `@request.auth.id != ""` |

   Verify that each of the five rule input fields is non-empty before proceeding to the
   next step.

7. Switch to the **Indexes** tab.

   - Click **+ New index** (or the equivalent add button).
   - A text input accepts a raw SQL `CREATE INDEX` statement.
   - Paste the following **exactly** — copy-paste to avoid typos:

     ```sql
     CREATE UNIQUE INDEX idx_dsu_day_status_date ON dsu_day_status (date)
     ```

   - Click **Save** on the index row.

8. Click **Create** (or **Save**) on the collection editor to commit the new collection.

### Verification

After saving, re-open the `dsu_day_status` collection and confirm:

- **Fields tab:** `date` (Text, required) and `status` (Select, required, values: `sl` / `vl`
  / `holiday`) appear in the field list.
- **Rules tab:** all five rule fields contain `@request.auth.id != ""` — none are blank.
- **Indexes tab:** an index appears whose SQL contains `UNIQUE` and references `date`.

### Rollback

In the left sidebar, click the settings cog next to `dsu_day_status` and choose **Delete
collection**, then confirm. Because `dsu_day_status` is new in Phase 1, deleting it does not
affect any other LexTrack data — it is a completely safe, non-destructive rollback.

---

## Post-migration: Verify with the smoke script

After applying all three sections above, run the smoke test from the **project root**:

```sh
npm run verify:schema
```

The script (`.planning/phases/01-schema-foundation/verify-schema.ts`) does the following:

1. Reads `VITE_API_BASE_URL`, `VITE_LOGIN_EMAIL`, and `VITE_LOGIN_PASSWORD` from `.env.development` (configured in `package.json`).
2. Authenticates against PocketBase using the admin/superuser credentials.
3. Calls `pb.collections.getOne()` for each of the three affected collections.
4. Asserts every field name, field type, option values, access rule string, and unique index
   for this phase.
5. Prints `PASS` or `FAIL` for each assertion and exits with code 0 on full pass.

If any assertion fails, the printed `FAIL` line tells you which specific field, rule, or index
did not match. Re-open the relevant collection in the admin UI, fix the mismatch, and re-run
the script.

A clean `PASS` on all assertions means the live PocketBase schema is ready for Phase 2.

---

## Quick Reference

| Change | Collection | Field | Type | Required | Values / Notes |
|--------|------------|-------|------|----------|----------------|
| SCHEMA-01 | `dsu_meetings` | `duration_unit` | Select | No | `minutes`, `hours` |
| SCHEMA-02 | `dsu_supports` | `link` | URL | No | Optional URL |
| SCHEMA-03 | `dsu_day_status` | `date` | Text | Yes | `YYYY-MM-DD` format |
| SCHEMA-03 | `dsu_day_status` | `status` | Select | Yes | `sl`, `vl`, `holiday` |
| SCHEMA-03 | `dsu_day_status` | *(all rules)* | Rules | — | `@request.auth.id != ""` × 5 |
| SCHEMA-03 | `dsu_day_status` | *(index)* | Index | — | `CREATE UNIQUE INDEX idx_dsu_day_status_date ON dsu_day_status (date)` |
