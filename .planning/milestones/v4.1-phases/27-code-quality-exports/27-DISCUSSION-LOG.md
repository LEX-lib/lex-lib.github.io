# Phase 27: Code Quality & Exports — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 27-code-quality-exports
**Areas discussed:** CQ items already done, Export payload shape, Export placement in Expenses, Export scope

---

## Pre-Discussion Finding

Before presenting gray areas, a codebase scout revealed that both CQ-01 and CQ-02 fixes are already implemented in the live code (pre-shipped during Phase 23/24 work). This finding was noted upfront so the user could decide how plans should handle them.

---

## CQ Items Already Done

| Option | Description | Selected |
|--------|-------------|----------|
| Run tests to confirm, document as done | Plans include `npm run test:unit`; mark CQ-01/CQ-02 as verified. No re-implementation. | ✓ |
| Re-implement from scratch | Ignore existing code, redo the fixes. | |
| Skip entirely | Focus purely on exports; CQ items pre-shipped. | |

**User's choice:** Run tests to confirm, document as done (recommended default)
**Notes:** Plans should include an explicit verification step so REQUIREMENTS.md CQ-01/CQ-02 get marked satisfied with evidence.

---

## Export Payload Shape — Memberships

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, static file URL | Include `card_image_url: pb.files.getURL(r, r.card_image)`. Mirrors vaccination pattern. | ✓ |
| No file URL — omit card_image | Cleaner JSON, but loses card image reference. | |
| You decide | Follow vaccination export exactly. | |

**User's choice:** Yes, static file URL (recommended default)
**Notes:** Requires auth to access the URL, but serves as a complete backup reference.

---

## Export Payload Shape — Expenses

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, static receipt URL | Include `receipt_url: pb.files.getURL(r, r.receipt)`. Protected file — URL needs token, but included for backup. | ✓ |
| No receipt URL | Simpler export, omit protected file reference. | |
| You decide | Match whatever makes sense for consistency. | |

**User's choice:** Yes, static receipt URL (mirrors vaccinations)
**Notes:** receipt field is protected=true, so the URL alone doesn't work without a token — but the reference is still useful for a backup export.

---

## Export Placement in Expenses

| Option | Description | Selected |
|--------|-------------|----------|
| Main tab header row — same as vaccinations/memberships | Next to "Add Expense" in ExpensesTab.vue header. Always visible, consistent across all three tabs. | ✓ |
| Inside the List sub-tab only | Only visible when List is active. Breaks the pattern. | |
| Floating action or separate row | More prominent but adds vertical space. | |

**User's choice:** Main tab header row (recommended default)
**Notes:** ExpensesTab has List/Reports sub-tabs but the download button lives in the shell above them — same as how vaccinations has the button outside any sub-view.

---

## Export Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All records — ignore active filters | Fresh `getFullList` call. Complete backup. Matches vaccination export. | ✓ |
| Only displayed records | Export currently filtered set. Risk of incomplete export if filters are active. | |

**User's choice:** All records — ignore active filters (recommended default)
**Notes:** Users want a complete backup; exporting a filtered subset would be confusing and potentially misleading as a backup tool.

---

## Claude's Discretion

- Exact field ordering in the JSON payload envelope
- Whether to add a `requestKey` to the export `getFullList` (non-reactive one-off call)

## Deferred Ideas

None raised during this discussion.
