---
schema_version: 1
open_count: 9
waived_count: 0
fixed_count: 0
total_count: 9
last_updated: 2026-08-05T05:37:43.597Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 38 | unrun-verify | .planning/phases/38-boarder-roster-foundation/38-01-SUMMARY.md |  | Two-unlinked-boarders live probe (A1) and the manual admin Add-Boarder click-through were not exercised — no live browser/admin credentials available to the executor; automated verify (type-check + 195 unit tests) passed | open |  | 2026-08-04T09:41:30.545Z |  |
| 2 | 38 | unrun-verify | src/components/projects/paytime/ManageBoarder.vue |  | Tag create-behind-a-click, cross-boarder vocabulary sharing, and account-link filter/degrade flows not exercised in a live browser session (no browser-automation tool or admin credentials available) | open |  | 2026-08-04T10:02:49.087Z |  |
| 3 | 38 | unrun-verify | .planning/phases/38-boarder-roster-foundation/38-COLLECTION.md |  | Authenticated re-read confirming paytime_boarders still holds exactly 7 rows after the tokenless-write probe was not independently performed (prod PocketBase MCP RecordRead not available to this executor); claim rests on HTTP 400 semantics only | open |  | 2026-08-04T10:37:17.918Z |  |
| 4 | 38 | deviation | .planning/phases/38-boarder-roster-foundation/38-COLLECTION.md |  | ROSTER-06 authenticated-non-admin write path not exercised (no non-admin credential exists); scoped as plan backstop to Phase 39 VERIFY-02 | open |  | 2026-08-04T10:37:19.079Z |  |
| 5 | 38 | unrun-verify | .planning/phases/38-boarder-roster-foundation/38-COLLECTION.md |  | Account linking (ROSTER-03) unexercised live — zero of 7 seeded boarders has a user link; unique index's uniqueness half (vs its permissive many-unlinked half) undemonstrated | open |  | 2026-08-04T10:37:20.433Z |  |
| 6 | 38 | unrun-verify | .planning/phases/38-boarder-roster-foundation/38-UI-SPEC.md |  | Seven 390px UI backstops (tag-chip wrapping, long name wrapping, tag picker overflow, truncation cases, delete-confirmation wrapping) and Admin-tab-absent-for-non-admin check not walked live | open |  | 2026-08-04T10:37:21.720Z |  |
| 7 | 39 | unrun-verify | src/components/projects/paytime/MonthlyReport.vue |  | MonthlyReport boarder-grouping/label logic not exercised by an automated test with real boarder-shaped expand data (39-01) | open |  | 2026-08-05T05:37:40.437Z |  |
| 8 | 39 | unrun-verify | src/components/projects/paytime/BoarderRosterView.vue |  | ROSTER-07 delete pre-check (both has-payments refusal and zero-payment pass-through branches) not exercised by an automated test (39-01) | open |  | 2026-08-05T05:37:42.082Z |  |
| 9 | 39 | unrun-verify | src/components/projects/paytime/PaymentLog.vue |  | PaymentLog's null-myBoarder empty-state copy and v-if ordering not independently asserted by an automated test (39-01) | open |  | 2026-08-05T05:37:43.597Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "38",
    "file": ".planning/phases/38-boarder-roster-foundation/38-01-SUMMARY.md",
    "line": null,
    "description": "Two-unlinked-boarders live probe (A1) and the manual admin Add-Boarder click-through were not exercised — no live browser/admin credentials available to the executor; automated verify (type-check + 195 unit tests) passed",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-04T09:41:30.545Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "38",
    "file": "src/components/projects/paytime/ManageBoarder.vue",
    "line": null,
    "description": "Tag create-behind-a-click, cross-boarder vocabulary sharing, and account-link filter/degrade flows not exercised in a live browser session (no browser-automation tool or admin credentials available)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-04T10:02:49.087Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "unrun-verify",
    "phase": "38",
    "file": ".planning/phases/38-boarder-roster-foundation/38-COLLECTION.md",
    "line": null,
    "description": "Authenticated re-read confirming paytime_boarders still holds exactly 7 rows after the tokenless-write probe was not independently performed (prod PocketBase MCP RecordRead not available to this executor); claim rests on HTTP 400 semantics only",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-04T10:37:17.918Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "38",
    "file": ".planning/phases/38-boarder-roster-foundation/38-COLLECTION.md",
    "line": null,
    "description": "ROSTER-06 authenticated-non-admin write path not exercised (no non-admin credential exists); scoped as plan backstop to Phase 39 VERIFY-02",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-04T10:37:19.079Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "unrun-verify",
    "phase": "38",
    "file": ".planning/phases/38-boarder-roster-foundation/38-COLLECTION.md",
    "line": null,
    "description": "Account linking (ROSTER-03) unexercised live — zero of 7 seeded boarders has a user link; unique index's uniqueness half (vs its permissive many-unlinked half) undemonstrated",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-04T10:37:20.433Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "unrun-verify",
    "phase": "38",
    "file": ".planning/phases/38-boarder-roster-foundation/38-UI-SPEC.md",
    "line": null,
    "description": "Seven 390px UI backstops (tag-chip wrapping, long name wrapping, tag picker overflow, truncation cases, delete-confirmation wrapping) and Admin-tab-absent-for-non-admin check not walked live",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-04T10:37:21.720Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "unrun-verify",
    "phase": "39",
    "file": "src/components/projects/paytime/MonthlyReport.vue",
    "line": null,
    "description": "MonthlyReport boarder-grouping/label logic not exercised by an automated test with real boarder-shaped expand data (39-01)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T05:37:40.437Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "unrun-verify",
    "phase": "39",
    "file": "src/components/projects/paytime/BoarderRosterView.vue",
    "line": null,
    "description": "ROSTER-07 delete pre-check (both has-payments refusal and zero-payment pass-through branches) not exercised by an automated test (39-01)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T05:37:42.082Z",
    "resolved_at": null
  },
  {
    "id": 9,
    "kind": "unrun-verify",
    "phase": "39",
    "file": "src/components/projects/paytime/PaymentLog.vue",
    "line": null,
    "description": "PaymentLog's null-myBoarder empty-state copy and v-if ordering not independently asserted by an automated test (39-01)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-05T05:37:43.597Z",
    "resolved_at": null
  }
]
````
