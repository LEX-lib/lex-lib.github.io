---
schema_version: 1
open_count: 2
waived_count: 0
fixed_count: 0
total_count: 2
last_updated: 2026-08-04T10:02:49.087Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 38 | unrun-verify | .planning/phases/38-boarder-roster-foundation/38-01-SUMMARY.md |  | Two-unlinked-boarders live probe (A1) and the manual admin Add-Boarder click-through were not exercised — no live browser/admin credentials available to the executor; automated verify (type-check + 195 unit tests) passed | open |  | 2026-08-04T09:41:30.545Z |  |
| 2 | 38 | unrun-verify | src/components/projects/paytime/ManageBoarder.vue |  | Tag create-behind-a-click, cross-boarder vocabulary sharing, and account-link filter/degrade flows not exercised in a live browser session (no browser-automation tool or admin credentials available) | open |  | 2026-08-04T10:02:49.087Z |  |

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
  }
]
````
