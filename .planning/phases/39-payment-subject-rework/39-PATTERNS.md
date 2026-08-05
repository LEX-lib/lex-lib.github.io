# Phase 39: Payment Subject Rework - Pattern Map

**Mapped:** 2026-08-05
**Files analyzed:** 11 modified/created source files + 4 modified spec files + 2 evidence artifacts
**Analogs found:** 13 / 13 (all files have an in-repo analog; one task — the multi-token rule-probe script — has no analog, see "No Analog Found")

This is a migration phase, not a greenfield one: almost every "analog" for a modified file **is that file itself** (its current shape, read in full above) plus one sibling file for the specific new idiom (empty state, delete pre-check, etc.). Phase 38's PATTERNS.md choices (mapper convention, dialog convention, composable convention) still hold and are not re-derived — only the deltas are new here.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/pocketbase/paytimePaymentMapper.ts` | utility (mapper) | transform | itself + `paytimeBoarderMapper.ts` | exact — same file, rename fields |
| `src/lib/paytime/paymentSchema.ts` | utility (validation) | transform | itself + `boarderSchema.ts` | exact — same file, add `boarder`/`recorded_by` |
| `src/types/paytime/payments/types.d.ts` | model (types) | — | itself + `types/paytime/boarders/types.d.ts` | exact — same file, rename `user`, add docblock |
| `src/components/projects/paytime/PaymentLog.vue` | component (list view) | CRUD | itself + `ExpensesListView.vue` (Wallecx, empty-state chain) + `BoarderRosterView.vue` (Phase 38 empty state) | exact — same file, new filter + new empty branch |
| `src/components/projects/paytime/ManagePayment.vue` | component (form dialog) | CRUD | itself + `ManageBoarder.vue` (Phase 38 dialog structure) | exact — same file, new guard state |
| `src/components/projects/paytime/MonthlyReport.vue` | component (report/shell) | CRUD (read, grouped) | itself | exact — same file, `expand`/grouping key swap only |
| `src/components/projects/paytime/BoarderRosterView.vue` | component (list view) | CRUD | itself + `PaymentLog.vue`'s `deletePayment`/`removePayment` split | exact — same file, new pre-check inserted before existing confirm flow |
| `src/composables/useBoarderRoster.ts` | hook/composable | CRUD (cached read) | itself (unchanged — first real consumer this phase) | exact — no edit needed, contract already fits |
| `39-COLLECTION.md`-equivalent evidence doc | doc/evidence | — | `38-COLLECTION.md` | exact — structure to mirror for VERIFY-01/02/04/05 |
| `src/lib/pocketbase/__tests__/paytimePaymentMapper.spec.ts` | test | transform | itself | exact — same file, update fixtures/assertions |
| `src/lib/paytime/__tests__/paymentSchema.spec.ts` | test | transform | itself (not yet read this session — same convention as `boarderSchema.spec.ts`/`paymentSchema.ts`) | exact |
| `src/components/projects/paytime/__tests__/paymentEdit.spec.ts` | test | request-response | itself | exact — same file, `record.user`→`record.boarder`/`recorded_by`, create-path assertion changes |
| `src/components/projects/paytime/__tests__/requestKeys.spec.ts` | test | request-response | itself | exact — already asserts 3 distinct keys (Phase 38 already extended it); Phase 39 does not need a 4th mount, only confirm the fixture's `filter` shape still matches |

## Pattern Assignments

### `src/lib/pocketbase/paytimePaymentMapper.ts` (utility, transform)

**Analog:** itself (current 47-line file, reproduced in full in RESEARCH.md Code Examples) + `src/lib/pocketbase/paytimeBoarderMapper.ts` for the "send on both create/update when no reassignment risk" contrast case.

**Current create pattern (line 3-19)** — `formData.append("user", payment.user)` becomes two appends:
```typescript
export function mapToCreatePayment(payment: AddPaytimePayment): FormData {
  const formData = new FormData();
  formData.append("boarder", payment.boarder);
  formData.append("recorded_by", payment.recorded_by);
  formData.append("category", payment.category);
  // ...unchanged fields below
```

**Docblock discipline to extend verbatim (lines 21-31)** — the existing comment on `mapToUpdatePayment` is the load-bearing artifact D-39-02/D-39-07 depend on; extend its `Omit` type and its reasoning to both new fields, do not write a new comment from scratch:
```typescript
/**
 * `user` is deliberately omitted. PocketBase evaluates the update rule
 * against the record's stored values, so `user = @request.auth.id` passes on
 * a request that also sets `user` to somebody else — which would hand the
 * record away. Never send an owner field on update.
 * ...
 */
export function mapToUpdatePayment(
  payment: Omit<AddPaytimePayment, "user">,   // → Omit<AddPaytimePayment, "boarder" | "recorded_by">
```
Change is a field-name/type-param edit to the existing docblock and signature, not a rewrite of the reasoning — the D-39-02 requirement is that this reasoning survive "verbatim in spirit."

---

### `src/lib/paytime/paymentSchema.ts` (utility, transform)

**Analog:** itself (79-line file, read in full) + `boarderSchema.ts`'s `user: z.string()` field (line 53, "empty string means no linked account") as the precedent for how an optional relation-as-string is typed in Zod here.

**Structure to extend** — `paymentSchema` currently has no relation fields at all (`user` is supplied by the component, not validated by the schema — see `ManagePayment.vue` line 186, `mapToCreatePayment({ user: auth.user.id, ...parsed.data })`). Whether `boarder`/`recorded_by` enter the Zod schema at all, or stay component-supplied like `user` does today, is Claude's discretion per CONTEXT.md — if added, follow `boarderSchema.ts`'s inline-docblock convention (lines 52, "Empty string means no linked account — see PaytimeBoarder.user") for `recorded_by`'s optionality, and reuse the existing `collectFieldErrors` (lines 66-78) unchanged — it is already field-name-agnostic.

---

### `src/types/paytime/payments/types.d.ts` (model, types)

**Analog:** itself (27 lines, read in full) + `src/types/paytime/boarders/types.d.ts`'s docblock convention (lines 9-14) for documenting the `''`-not-`null` relation-storage quirk.

**Current shape:**
```typescript
export interface PaytimePayment extends RecordModel {
  id: string;
  created: string;
  updated: string;
  user: string;                 // ← splits into boarder + recorded_by
  category: PaymentCategory;
  month: string;
  payment_date: string;
  amount?: number;
  notes?: string;
  screenshot?: string;
}
export type AddPaytimePayment = Omit<
  PaytimePayment, "id" | "created" | "updated" | "screenshot"
> & { screenshot?: File };
```

**Docblock precedent to copy verbatim in spirit** (`types/paytime/boarders/types.d.ts:9-14`):
```typescript
/**
 * PocketBase returns the empty string for an unset single relation, never
 * null (confirmed against the live `paytime_boarders.user` field, 38-COLLECTION.md)
 * — do not add `=== null` checks here, they will never fire. Use `=== ""`
 * or truthiness to test for "no linked account".
 */
user: string;
```
`recorded_by` is optional post-migration (D-39-02) — it needs this exact comment style; `boarder` is required post-migration (D-39-03) and does **not** need it, since a required relation never round-trips back to `""` (RESEARCH.md Section 5).

---

### `src/components/projects/paytime/PaymentLog.vue` (component, CRUD)

**Analog:** itself (239 lines, read in full) for the fetch/filter/render structure; `src/components/projects/wallecx/ExpensesListView.vue` lines 129-160 for the **multi-branch `v-if`/`v-else-if` empty-state chain shape**; Phase 38's `BoarderRosterView.vue` line 144-147 for the in-repo PayTime-styled empty-state markup convention (plain `<p class="text-sm opacity-70">`, no icon/card — simpler than Wallecx's icon+card pattern, and this is the one to actually copy since it's same-project, same-visual-language).

**Current filter (lines 29-51)** — becomes boarder-filtered and gains a null-boarder skip:
```typescript
const loadPayments = async () => {
  if (!auth.user) {
    return;
  }
  isLoading.value = true;
  try {
    payments.value = await pb
      .collection("paytime_payments")
      .getFullList<PaytimePayment>({
        filter: `user = "${auth.user.id}"`,     // → `boarder = "${myBoarder.value.id}"`
        sort: "-payment_date",
        requestKey: "paytime-payments-list",    // UNCHANGED per D-39-12
      });
```
D-39-09 requires the fetch to be **skipped entirely** when `myBoarder` (from `useBoarderRoster()`) is null — add that guard alongside the existing `if (!auth.user) return;` line, don't replace it.

**Empty-state branch to extend (lines 134-137)** — the existing two-state `v-if`/`v-else-if` chain gets a third state, following the Wallecx multi-state ordering convention (loading → distinct-empty → generic-empty), but with this project's plain-`<p>` PayTime styling, not Wallecx's icon+card styling:
```vue
<p v-if="isLoading" class="text-sm opacity-70">Loading…</p>
<p v-else-if="!myBoarder" class="text-sm opacity-70">
  No boarder record linked to your account yet — ask the admin to link you.
</p>
<p v-else-if="!payments.length" class="text-sm opacity-70">
  No payments logged yet.
</p>
```
Ordering matters: no-boarder must be checked **before** no-payments (D-39-09 — "no identity, not no payments").

**Wallecx's reference ordering pattern** (`ExpensesListView.vue:130-160`, cited for the *chain shape* only, not its visual style):
```vue
<WallecxSkeleton v-if="isLoading" ... />
<div v-else-if="expenses.length === 0" ...>  <!-- distinct: no records at all -->
<div v-else-if="filteredSortedExpenses.length === 0" ...>  <!-- distinct: filtered to nothing -->
```
Same "raw-empty is a different state than filtered/derived-empty" idea PaymentLog now needs (myBoarder-null is a different state than payments-empty).

---

### `src/components/projects/paytime/ManagePayment.vue` (component, CRUD)

**Analog:** itself (351 lines, read in full) for `defineModel`/`isSaving`/`describeSaveError`/save-flow structure; Phase 38's `ManageBoarder.vue` for how a Phase-38-era dialog handles a null/seed state on open (its `watch(() => [visible.value, record.value], ...)` seeding pattern, already present here at lines 78-95 — no new idiom needed, same watch just needs a `myBoarder` resolution added to it).

**`defineModel` pair (lines 27-31)** — unchanged, no analog needed beyond itself:
```typescript
const visible = defineModel<boolean>("visible", { required: true });
const record = defineModel<PaytimePayment | null>("record", { default: null });
const emit = defineEmits<{ saved: [] }>();
```

**Current create-path line that changes (lines 183-187)**:
```typescript
await pb.collection("paytime_payments")
  .create(mapToCreatePayment({ user: auth.user.id, ...parsed.data }));
// → .create(mapToCreatePayment({ boarder: myBoarder.value.id, recorded_by: auth.user.id, ...parsed.data }))
```

**D-39-10's guard** — resolve `myBoarder` from `useBoarderRoster()` (new import, not present in this file today) inside the existing seed-on-open `watch` (lines 78-95), and gate `savePayment`/the Save button the same way `isSaving` already gates it (line 335, 343: `:disabled="isSaving"` / `:disabled="isProcessingScreenshot"`) — add a third disabling condition `!myBoarder` rather than inventing a new disabling mechanism:
```typescript
const { myBoarder } = useBoarderRoster();
// in savePayment(), before building parsed:
if (!myBoarder.value) return; // Save is already disabled; this is defense-in-depth
```
Render the same `PaymentLog`-style no-boarder message in place of the form, following the identical plain-`<p>` convention used there — one copy string, reused or restated identically per D-39-09/10 (Claude's discretion on exact wording, but same visual pattern).

**`describeSaveError` (lines 131-146)** — reused verbatim, no change; this is the natural surface for a rule-rejection message reaching the UI (e.g. VERIFY-04's `:isset` guard rejecting a hand-crafted reassignment).

---

### `src/components/projects/paytime/MonthlyReport.vue` (component, report/shell)

**Analog:** itself (223 lines, read in full).

**Current fetch/group block (lines 41-83)** — the entire delta is `expand`/key-name swap, no structural change:
```typescript
const payments = await pb.collection("paytime_payments").getFullList<PaytimePayment>({
  filter: `month = "${dayjs(month.value).format("YYYY-MM")}"`,
  expand: "user",                          // → "boarder"
  sort: "payment_date",
  requestKey: "paytime-report-list",       // UNCHANGED per D-39-11
});
const byUser = new Map<string, ReportRow>();   // → byBoarder
for (const payment of payments) {
  const expandedUser = payment.expand?.user as { name?: string; email?: string } | undefined;
  const userName = expandedUser?.name || expandedUser?.email || payment.user;
  // → const expandedBoarder = payment.expand?.boarder as { name?: string } | undefined;
  // → const boarderName = expandedBoarder?.name ?? payment.boarder;  (no `|| email` fallback — boarder.name is required)
  let row = byUser.get(payment.user);      // → byBoarder.get(payment.boarder)
  if (!row) { row = { userId: payment.user, userName, others: [] }; ... }
  // → { boarderId: payment.boarder, boarderName, others: [] }
```
`ReportRow` interface (lines 23-30) renames `userId`→`boarderId`, `userName`→`boarderName`; template bindings at lines 121-122 (`:key="row.userId"`, `:header="row.userName"`) rename to match. This is a pure rename-through per RESEARCH.md's own framing — no logic changes, no restructuring of the `Tabs`/`TabPanel` shell (Phase 38 already built that).

---

### `src/components/projects/paytime/BoarderRosterView.vue` (component, CRUD)

**Analog:** itself (227 lines, read in full) for the existing `useConfirm`+`deleteBoarder`/`removeBoarder` split; `src/components/projects/paytime/PaymentLog.vue`'s identical `deletePayment`/`removePayment` split (lines 96-117) as the confirming precedent that this two-function shape is the project's standard delete pattern.

**Current delete flow (lines 50-69)** — the D-39-13 pre-check inserts as a **new async step before** `confirm.require` is called, not inside `removeBoarder`:
```typescript
const removeBoarder = async (boarder: PaytimeBoarder) => {
  try {
    await pb.collection("paytime_boarders").delete(boarder.id);
    toast.success("Boarder deleted");
    boarders.value = boarders.value.filter((item) => item.id !== boarder.id);
  } catch {
    toast.error("Failed to delete boarder");
  }
};

const deleteBoarder = (boarder: PaytimeBoarder) => {
  confirm.require({
    header: "Delete boarder",
    message: `Delete ${boarder.name}? This cannot be undone.`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: { label: "Cancel", severity: "secondary", outlined: true },
    acceptProps: { label: "Delete", severity: "danger" },
    accept: () => removeBoarder(boarder),
  });
};
```
New shape: `deleteBoarder` becomes `async`, first runs a `pb.collection("paytime_payments").getFullList({ filter: \`boarder = "${boarder.id}"\`, requestKey: null })` (or a lighter count-only call if one exists in this SDK version — check `getList` with `perPage: 1` for a cheap `totalItems`, though RESEARCH.md's D-31-B caution about `getList`'s count path 400ing on complex rules is about the *payments* listRule, which is simple here: `boarder = ...` alone), then branches:
- zero payments → existing `confirm.require(...)` unchanged, reusing the exact object above.
- one or more → a **different** message/action, reusing the same `confirm.require` shell (header/icon/rejectProps unchanged) but swapping `message` to name the count and swapping `acceptProps`/`accept` to call `toggleActive` (already implemented, lines 34-48) instead of `removeBoarder`. This reuses `toggleActive` as-is — it is the existing "Deactivate" action D-39-13 names as the alternative.

**Reused unchanged:** `toggleActive` (lines 34-48), the `rowMenu`/`rowMenuItems` popup pattern (lines 71-111), and `useConfirm` import/`ConfirmDialog`-at-shell-level (already documented in 38-PATTERNS.md's Shared Patterns — still holds, not re-derived here).

---

### `src/composables/useBoarderRoster.ts` (hook, no change needed)

**Analog:** itself (79 lines, read in full).

No edit is planned to this file — its exported contract (`{ boarders, myBoarder, refresh }`, docblock at lines 6-16 already naming "Phase 39/40 siblings (`PaymentLog`, `ManagePayment`)" as the intended consumers) already matches exactly what `PaymentLog.vue` and `ManagePayment.vue` need. `myBoarder` (lines 70-76) resolves via `boarders.value.find((boarder) => boarder.user === authId)` — this is the exact lookup both consumers call. If a plan finds itself editing this file, that is a signal the contract assumption was wrong and should be flagged, not silently patched.

---

### Evidence artifact for VERIFY-01/02/04/05 (doc, no source-code role)

**Analog:** `.planning/phases/38-boarder-roster-foundation/38-COLLECTION.md` (full file, 360 lines, read in full) — this is the structural template the planner should mirror, not reinvent.

**Structure to replicate, section by section:**
1. **Header block** naming instance URL, collection id, created/updated timestamps, and the exact MCP/tool call used to fetch them (`38-COLLECTION.md:1-12`) — "Source of these values" line is load-bearing, ties every fact to a specific tool invocation, not a transcription.
2. **`## Fields` table** — field/type/required/other-attributes columns (`38-COLLECTION.md:14-23`), same shape for the `boarder`/`recorded_by`(renamed `user`) fields.
3. **`## API rules` section**, rules pasted **verbatim** with the D-13 grep-count self-checks shown inline (`38-COLLECTION.md:315-323`: `grep -c 'is_admin' ... → N (>= 3 required)`), extended to all five rules per D-39-08's uniform-shape requirement (this phase needs the admin branch on all 5, not just 3 as in Phase 38).
4. **`## Deviations from the plan's stated schema`** section (`38-COLLECTION.md:72-118`) — the template for recording when a plan's stated intent (e.g. D-39-16's assumption about which delete outcome occurs) turns out to differ from the live observed behavior; RESEARCH.md's Open Question 1 (required-relation delete-refusal) is exactly this shape of "record what actually happened, don't assume."
5. **Numbered "Probe N" blocks with literal `curl` command + literal response + status-code interpretation** (`38-COLLECTION.md:233-313`) — this is the exact format VERIFY-01/02/04/05's D-13 paste-backs should follow: command, raw response, one sentence of interpretation, explicit statement of what the probe does and does NOT prove (see `38-COLLECTION.md:325-338`'s "What this does NOT cover" section — Phase 39's evidence doc needs the equivalent honesty section for the fallback-branch and required-relation-refusal open questions).
6. **A "Post-probe row-count confirmation (orchestrator)" closing section** (`38-COLLECTION.md:340-359`) — where a gap in the executor's own tool access gets closed by whoever *does* have the missing capability, recorded explicitly rather than left as an unclosed loop. D-39-14 exists specifically so this phase does not need this closing section (the user supplies both tokens up front) — but if a gap of this shape appears anyway, this is the template for recording it.

---

### Test files

**`src/lib/pocketbase/__tests__/paytimePaymentMapper.spec.ts`** (itself, read in full) — the exact assertions that break:
```typescript
const base: AddPaytimePayment = {
  user: "user123",              // → boarder: "boarder123", recorded_by: "user123"
  category: "electricity", month: "2026-07", payment_date: "2026-07-28",
};
// "maps required fields": expect(formData.get("user")).toBe("user123")
//   → expect(formData.get("boarder")).toBe("boarder123"); expect(formData.get("recorded_by")).toBe("user123")
// "never sends user" (mapToUpdatePayment): expect(formData.has("user")).toBe(false)
//   → expect(formData.has("boarder")).toBe(false); expect(formData.has("recorded_by")).toBe(false)
```

**`src/components/projects/paytime/__tests__/paymentEdit.spec.ts`** (itself, read in full) — the fixture `record.user: "4ygxbt0zey088di"` (line 18) becomes `record.boarder`/`record.recorded_by`; the "creates a new record" test (lines 99-112) currently only asserts `create` was called once with no field-shape assertion, so it likely does not need an assertion change — but the fixture object at the top of the file must gain `boarder`/`recorded_by` keys so `ManagePayment`'s new `myBoarder` guard (reading from `useBoarderRoster`, which this spec does **not** currently mock at all — no `vi.mock("@/composables/useBoarderRoster")` exists in this file) does not silently fail the "creates"/"updates" tests. **This is the concrete new mock this spec needs**, not present in any current PayTime spec — closest existing precedent for mocking a composable-backed dependency is `requestKeys.spec.ts`'s `pb.collection().getFullList` mock feeding `useBoarderRoster` indirectly (that spec doesn't mock the composable directly either — it mocks the `pb` client one layer down, which is the pattern to follow here too rather than mocking `useBoarderRoster` itself).

**`src/components/projects/paytime/__tests__/requestKeys.spec.ts`** (itself, read in full) — already extended by Phase 38 to mount `PaymentLog`, `MonthlyReport`, and `BoarderRosterView` together and assert 3 distinct `requestKey`s (lines 89-111). D-39-12 keeps both PayTime payment keys unchanged, so **no new mount is needed this phase** — only confirm this spec's mocked `record` fixture (lines 5-19, still has `user: "4ygxbt0zey088di"`) gets updated to the new field shape so `PaymentLog`'s render-assertion test (lines 113-119, checks `wrapper.html()` contains "July 2026") doesn't break on an unrelated fixture mismatch.

**`src/lib/paytime/__tests__/paymentSchema.spec.ts` / `boarderSchema.spec.ts`** — not read this session (RESEARCH.md's Code Examples section didn't reproduce them, and the phase's Zod-layer changes are explicitly Claude's discretion per D-39-CONTEXT). Whichever assertions currently reference `user`/`boarder` as a schema-validated field will need updating in lockstep with whatever `paymentSchema.ts` ends up doing — flagged for the planner to check when the schema-layer decision is made, not pre-analyzed here since the shape of the change is not yet locked.

## Shared Patterns

### Owner-field omission on update (locked project invariant, now doubled)
**Source:** `src/lib/pocketbase/paytimePaymentMapper.ts:21-31` (docblock + `Omit<AddPaytimePayment, "user">` type param)
**Apply to:** the same file's `mapToUpdatePayment`, extended to `Omit<AddPaytimePayment, "boarder" | "recorded_by">`. This is the single most load-bearing pattern in this phase — D-39-02 and D-39-07 both cite it directly, and the comment text itself should be extended, not replaced.

### `useConfirm` + `ConfirmDialog`-at-shell-level (unchanged from Phase 38)
**Source:** `src/components/projects/paytime/PaymentLog.vue:5,18,106-117`; `BoarderRosterView.vue:4,11,60-69`
**Apply to:** `BoarderRosterView.vue`'s extended delete pre-check — reuse the exact `confirm.require({...})` shape for both the zero-payments and has-payments branches, varying only `message`/`acceptProps`/`accept`.

### `requestKey` uniqueness (locked project invariant, unchanged)
**Source:** `PaymentLog.vue:44`, `MonthlyReport.vue:53`, `useBoarderRoster.ts:35`
**Apply to:** no new key needed this phase (D-39-12) — both existing filters change their *value*, not their `requestKey` string.

### PocketBase per-field validation unwrapping (`describeSaveError`)
**Source:** `ManagePayment.vue:131-146`
**Apply to:** unchanged, reused as-is — the natural surface for VERIFY-04's `:isset` rejection or a required-`boarder` validation error reaching the UI during manual testing.

### Breakpoint utilities on plain wrappers, never on a PrimeVue component
**Source:** `PaymentLog.vue:153,206-209`; `BoarderRosterView.vue:161,185-189`
**Apply to:** no new UI surface touches this in Phase 39 (no new row layout), but any planner adding a `recorded_by` marker prematurely (out of scope, Phase 40) would need to obey this — noted defensively.

### D-13 evidence format: command + raw response + one-sentence interpretation + explicit "what this does NOT cover"
**Source:** `38-COLLECTION.md` (full file — Probes 1/2, lines 233-313; "What this does NOT cover", lines 325-338)
**Apply to:** every VERIFY-01/02/04/05 paste-back this phase produces. This is the strongest reusable pattern for the phase's verification artifacts, not its source code.

## No Analog Found

| File / Task | Role | Data Flow | Reason |
|---|---|---|---|
| Authenticated multi-token rule-probe script (D-39-14's blocking-checkpoint deliverable — runs the two-token five-rule sweep against `curl`, asserting the status-code map in RESEARCH.md Section 3) | utility (verification script, one-off) | request-response (batch of REST calls) | Phase 38's probes (`38-COLLECTION.md` Probes 1-2) were **tokenless** one-offs — no credential handling, no auth header construction beyond a literal invalid-token string. This phase needs a script that takes two real bearer tokens (admin + non-admin), runs 10+ requests across list/view/create/update/delete for both boarders, and asserts a *different* expected status per operation (200/400/404, per RESEARCH.md's table) — no prior script in this codebase or its `.planning/` artifacts does authenticated, multi-identity, multi-endpoint assertion. Nearest partial precedent is 38-COLLECTION.md's `curl -s -w '\nHTTP_STATUS:%{http_code}\n'` invocation shape (reuse the flag, not the logic) and the project's own Node-based JSON-parsing probes (`node -e '...'`, referenced at `38-COLLECTION.md:246-249`) — combine those two primitives; there is no single file to copy wholesale. |

Everything else in this phase's scope is an in-place edit to a file this session read in full, with the delta spelled out above — not a new-pattern problem.

## Metadata

**Analog search scope:** `src/lib/pocketbase/`, `src/lib/paytime/`, `src/types/paytime/`, `src/components/projects/paytime/`, `src/components/projects/wallecx/` (one cross-reference for empty-state chain shape), `src/composables/`, `.planning/phases/38-boarder-roster-foundation/`
**Files scanned (Read this session):** `paytimePaymentMapper.ts`, `paymentSchema.ts`, `boarderSchema.ts`, `types/paytime/payments/types.d.ts`, `types/paytime/boarders/types.d.ts`, `38-COLLECTION.md`, `PaymentLog.vue`, `ManagePayment.vue`, `MonthlyReport.vue`, `BoarderRosterView.vue`, `useBoarderRoster.ts`, `paytimePaymentMapper.spec.ts`, `requestKeys.spec.ts`, `paymentEdit.spec.ts`, `ExpensesListView.vue` (lines 108-180), plus `39-CONTEXT.md`, `39-RESEARCH.md`, `38-PATTERNS.md` in full
**Pattern extraction date:** 2026-08-05
