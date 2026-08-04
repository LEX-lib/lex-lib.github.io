---
phase: 38-boarder-roster-foundation
reviewed: 2026-08-04T10:48:55Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/types/paytime/boarders/types.d.ts
  - src/lib/paytime/boarderSchema.ts
  - src/lib/paytime/__tests__/boarderSchema.spec.ts
  - src/lib/pocketbase/paytimeBoarderMapper.ts
  - src/lib/pocketbase/__tests__/paytimeBoarderMapper.spec.ts
  - src/composables/useBoarderRoster.ts
  - src/composables/__tests__/useBoarderRoster.spec.ts
  - src/components/projects/paytime/ManageBoarder.vue
  - src/components/projects/paytime/BoarderRosterView.vue
  - src/components/projects/paytime/PayTimeApp.vue
  - src/components/projects/paytime/MonthlyReport.vue
  - src/components/projects/paytime/__tests__/requestKeys.spec.ts
  - components.d.ts
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 38: Code Review Report

**Reviewed:** 2026-08-04T10:48:55Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Reviewed the boarder-roster foundation: Zod schema/mapper, the shared `useBoarderRoster`
composable, `ManageBoarder`/`BoarderRosterView`, and the `PayTimeApp`/`MonthlyReport` integration
points, cross-referenced against `38-COLLECTION.md`'s live schema and rule text.

The four project-specific traps called out in scope were checked explicitly and are all handled
correctly in this phase's code:
- Admin gate (`PayTimeApp.vue`) uses `auth.user?.is_admin === true`, not the `isLoggedIn`
  one-token-swap that shipped in `GiftExchangeManage.vue` — matches the live `is_admin = true`
  write rules verbatim.
- PrimeVue `Tabs` in both `PayTimeApp.vue` and `MonthlyReport.vue` mount all panels (no `lazy`),
  but the three simultaneous `getFullList` calls (`PaymentLog`, `MonthlyReport`,
  `BoarderRosterView`) use three distinct `requestKey`s, and `requestKeys.spec.ts` asserts all
  three are non-null and pairwise distinct — the assertion has teeth (would fail if any key were
  missing or shared).
- The composable's own `getFullList` and `ManageBoarder`'s `users` fetch use non-colliding
  `requestKey`s (`paytime-boarders-list`, `paytime-users-list`) checked against every other
  `requestKey` string in the codebase — no collision found.
- No date-string validation exists in the boarder feature that depends on dayjs strict parsing;
  not applicable here.

Roster cache staleness after a mutation was traced end to end: `ManageBoarder`'s `saveBoarder`
emits `saved`, `BoarderRosterView` wires that straight to the shared `refresh()`, which
re-populates the shared `boarders` ref for every consumer. `toggleActive`/`removeBoarder` mutate
the shared ref only *after* the server call succeeds, so a failed mutation can't leave the UI
showing an optimistic-but-wrong state. No staleness bug found in the mutate-then-refresh path.

One real, traceable edge-case bug remains (see WR-01): the account-link picker doesn't defend
against the deliberately-permitted case (per `38-COLLECTION.md`, `cascadeDelete: false`) where a
boarder's linked `user` account has since been deleted.

## Warnings

### WR-01: Editing a boarder with an orphaned account link can fail unexpectedly

**File:** `src/components/projects/paytime/ManageBoarder.vue:77-88, 96-116, 135`
**Issue:** `38-COLLECTION.md` documents that `user`'s `cascadeDelete: false` is deliberate —
deleting a `users` account "clears the link and leaves the boarder row intact." When that
happens, the boarder's `user` field still holds the now-nonexistent id. `loadAccounts()` fetches
only currently-existing `users` rows, so `accountOptions` (built from `accounts.value`) never
contains that stale id. `linkedUser.value` is nonetheless seeded from `current?.user` on dialog
open (line 135) and is round-tripped unchanged through `saveBoarder` → `mapToUpdateBoarder` on
any edit — including one where the admin only touched `name` or `tags` and never looked at the
account field. PocketBase validates relation targets exist, so the update request would be
rejected for a field the admin never intended to change, with no visual cue in the `Select`
(no option in `accountOptions` matches the seeded value, so it renders blank/placeholder) as to
why. `describeSaveError` will surface a `user: ...` message, but the picker gives the admin
nothing to click to fix it directly — they'd have to know to explicitly pick "No account" first.
**Fix:**
```ts
// after loadAccounts() resolves, reconcile the seeded linkedUser against what's actually
// still a valid target:
const loadAccounts = async () => {
  isLoadingAccounts.value = true;
  try {
    const users = await pb.collection("users").getFullList<{ id: string; name?: string; email: string }>({
      sort: "name",
      requestKey: "paytime-users-list",
    });
    accounts.value = users.map((user) => ({ id: user.id, label: user.name || user.email }));
    // The boarder's own linked account may have been deleted since (cascadeDelete: false,
    // 38-COLLECTION.md) — don't silently resend a nonexistent id on an unrelated edit.
    if (linkedUser.value && !accounts.value.some((a) => a.id === linkedUser.value)) {
      linkedUser.value = "";
      toast.error("This boarder's linked account no longer exists. Please choose one, or leave it unlinked.");
    }
  } catch (error) {
    toast.error("Failed to load accounts.");
    console.warn("ManageBoarder: users getFullList failed", error);
    accounts.value = [];
  } finally {
    isLoadingAccounts.value = false;
  }
};
```

## Info

### IN-01: `AddPaytimeBoarder` type is exported but never used

**File:** `src/types/paytime/boarders/types.d.ts:19-22`
**Issue:** `mapToCreateBoarder` (the only create-payload builder) takes `BoarderInput` from the
Zod schema, not `AddPaytimeBoarder`. A repo-wide search found no other reference to
`AddPaytimeBoarder`. It's dead code as it stands.
**Fix:** Delete it, or if it's meant as the wire-format contract, have
`mapToCreateBoarder`'s return type reference it (`: AddPaytimeBoarder`) so it's load-bearing
rather than aspirational.

### IN-02: `myBoarder` has no production consumer yet

**File:** `src/composables/useBoarderRoster.ts:70-76`
**Issue:** `myBoarder` is computed, returned from the composable, and covered by three spec
cases, but neither `BoarderRosterView.vue` nor `ManageBoarder.vue` (the only two current
callers of `useBoarderRoster`) destructure it. This is plausibly deliberate foundation work for
a later phase (per the composable's own doc comment referencing `PaymentLog`/`ManagePayment`
siblings), not obviously dead code — flagging so it's tracked rather than silently rotting if
the consuming phase's design changes before it lands.
**Fix:** No action required now; revisit if Phase 39/40 doesn't end up consuming it.

### IN-03: Inconsistent error logging between the composable and its own view

**File:** `src/components/projects/paytime/BoarderRosterView.vue:34-58`
**Issue:** `useBoarderRoster.ts`'s `refresh()` and `ManageBoarder.vue`'s `loadAccounts`/
`saveBoarder` all pair their user-facing `toast.error(...)` with a `console.warn`/
`console.error` carrying the underlying error. `BoarderRosterView.vue`'s `toggleActive` and
`removeBoarder` use a bare `catch { toast.error(...) }` with no logged detail, so a failed
toggle/delete leaves no diagnostic trail beyond the generic toast. (This mirrors
`PaymentLog.vue`'s pre-existing `removePayment`/`deletePayment` pattern, so it's not a new
regression, just worth aligning.)
**Fix:**
```ts
} catch (error) {
  toast.error("Failed to update boarder");
  console.error("BoarderRosterView: toggleActive failed", error);
}
```

---

_Reviewed: 2026-08-04T10:48:55Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
