/**
 * Phase 1 Schema Foundation — smoke test
 *
 * Runs against the live PocketBase instance at VITE_API_BASE_URL and asserts the
 * Phase 1 schema spec is in place. This is the automated gate before Phase 2.
 *
 * Prerequisites:
 *  - `npm install` has been run (script imports the `pocketbase` SDK from node_modules)
 *  - `.env.local` contains:
 *      VITE_API_BASE_URL=<your PocketBase URL>
 *      VITE_LOGIN_EMAIL=<superuser email>
 *      VITE_LOGIN_PASSWORD=<superuser password>
 *  - Migration steps in `.planning/pocketbase-schema.md` have been applied
 *
 * Run:
 *   npm run verify:schema
 *   # or directly:
 *   npx tsx --env-file=.env.local .planning/phases/01-schema-foundation/verify-schema.ts
 *
 * Auth note: pb.collections.getOne() requires SUPERUSER credentials. Regular `users`
 * collection logins return 403. The script attempts the PB 0.23+ `_superusers`
 * collection auth path first, falls back to the pre-0.23 `pb.admins.authWithPassword`.
 *
 * Exit code 0 = all PASS = schema ready for Phase 2.
 * Exit code 1 = at least one assertion failed; FAIL line names the missing/incorrect field.
 */

import PocketBase, { type CollectionModel } from 'pocketbase';

const BASE_URL = process.env.VITE_API_BASE_URL;
const EMAIL    = process.env.VITE_LOGIN_EMAIL;
const PASSWORD = process.env.VITE_LOGIN_PASSWORD;

if (!BASE_URL || !EMAIL || !PASSWORD) {
  console.error('Missing env vars. Required: VITE_API_BASE_URL, VITE_LOGIN_EMAIL, VITE_LOGIN_PASSWORD');
  console.error('Did you run with --env-file=.env.local? Use `npm run verify:schema`.');
  process.exit(1);
}

const pb = new PocketBase(BASE_URL);

// PB 0.23+ uses pb.collection('_superusers'); older uses pb.admins. Try modern first.
try {
  await pb.collection('_superusers').authWithPassword(EMAIL, PASSWORD);
} catch (modernErr) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (pb as any).admins.authWithPassword(EMAIL, PASSWORD);
  } catch (legacyErr) {
    console.error('Failed to authenticate as superuser via either _superusers (PB 0.23+) or admins (PB <0.23) path.');
    console.error('Modern path error:', modernErr instanceof Error ? modernErr.message : modernErr);
    console.error('Legacy path error:', legacyErr instanceof Error ? legacyErr.message : legacyErr);
    console.error('Note: pb.collections.getOne() requires superuser credentials. Verify VITE_LOGIN_EMAIL/PASSWORD are admin/superuser, not regular user.');
    process.exit(1);
  }
}

type Field = { name: string; type: string; required?: boolean; maxSelect?: number; values?: string[] };

function findField(col: CollectionModel, name: string): Field | undefined {
  return (col.fields as Field[]).find((f) => f.name === name);
}

let failed = 0;
function assert(condition: unknown, message: string): void {
  if (condition) {
    console.log(`  PASS: ${message}`);
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

// --- SCHEMA-01: dsu_meetings.duration_unit ---
console.log('\nChecking dsu_meetings.duration_unit (SCHEMA-01)...');
const meetings = await pb.collections.getOne('dsu_meetings');
const durationUnit = findField(meetings, 'duration_unit');
assert(!!durationUnit, 'field duration_unit exists on dsu_meetings');
if (durationUnit) {
  assert(durationUnit.type === 'select', `duration_unit type is select (got: ${durationUnit.type})`);
  assert(durationUnit.maxSelect === 1, `duration_unit maxSelect is 1 (got: ${durationUnit.maxSelect})`);
  assert(
    Array.isArray(durationUnit.values) &&
      durationUnit.values.includes('minutes') &&
      durationUnit.values.includes('hours'),
    `duration_unit values include minutes and hours (got: ${JSON.stringify(durationUnit.values)})`
  );
  assert(!durationUnit.required, 'duration_unit is optional (required=false) per D-09');
}

// --- SCHEMA-02: dsu_supports.link ---
console.log('\nChecking dsu_supports.link (SCHEMA-02)...');
const supports = await pb.collections.getOne('dsu_supports');
const link = findField(supports, 'link');
assert(!!link, 'field link exists on dsu_supports');
if (link) {
  assert(link.type === 'url', `link type is url (got: ${link.type})`);
  assert(!link.required, 'link is optional (required=false) per D-12');
}

// --- SCHEMA-03: dsu_day_status collection ---
console.log('\nChecking dsu_day_status collection (SCHEMA-03)...');
let dayStatus: CollectionModel | undefined;
try {
  dayStatus = await pb.collections.getOne('dsu_day_status');
} catch (err) {
  console.error(`  FAIL: dsu_day_status collection does not exist (${err instanceof Error ? err.message : err})`);
  failed++;
}

if (dayStatus) {
  assert(dayStatus.type === 'base', `dsu_day_status is a base collection (got: ${dayStatus.type})`);

  const dateField = findField(dayStatus, 'date');
  assert(!!dateField, 'field date exists on dsu_day_status');
  if (dateField) {
    assert(dateField.type === 'text', `date type is text (got: ${dateField.type}) per D-13`);
    assert(!!dateField.required, 'date is required=true');
  }

  const statusField = findField(dayStatus, 'status');
  assert(!!statusField, 'field status exists on dsu_day_status');
  if (statusField) {
    assert(statusField.type === 'select', `status type is select (got: ${statusField.type}) per D-11`);
    assert(statusField.maxSelect === 1, `status maxSelect is 1 (got: ${statusField.maxSelect})`);
    assert(
      Array.isArray(statusField.values) &&
        statusField.values.includes('sl') &&
        statusField.values.includes('vl') &&
        statusField.values.includes('holiday'),
      `status values include sl, vl, holiday (got: ${JSON.stringify(statusField.values)})`
    );
    assert(!!statusField.required, 'status is required=true');
  }

  // All five access rules — security gate per T-1-01 (blank rule = public access)
  const EXPECTED_RULE = '@request.auth.id != ""';
  const ruleNames = ['listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule'] as const;
  for (const rule of ruleNames) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (dayStatus as any)[rule];
    assert(value === EXPECTED_RULE, `dsu_day_status.${rule} = '${EXPECTED_RULE}' (got: ${JSON.stringify(value)})`);
  }

  // Unique index on date
  const indexes = (dayStatus.indexes ?? []) as string[];
  assert(
    indexes.some((idx) => idx.toUpperCase().includes('UNIQUE') && idx.toLowerCase().includes('date')),
    `dsu_day_status has a UNIQUE index referencing date (got: ${JSON.stringify(indexes)})`
  );
}

if (failed > 0) {
  console.error(`\nResult: FAILED — ${failed} assertion(s) failed. Fix the schema in PocketBase admin and re-run.`);
  process.exit(1);
} else {
  console.log('\nResult: PASSED — schema is ready for Phase 2.');
  process.exit(0);
}
