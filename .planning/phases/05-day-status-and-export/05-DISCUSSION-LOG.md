# Phase 5: Day Status & Export - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 05-day-status-and-export
**Areas discussed:** Day Status control, Status banner design, Export format, Status values exposed

---

## Day Status Control

| Option | Description | Selected |
|--------|-------------|----------|
| Next to the date picker | Same top row as date picker and Save button | ✓ |
| Above the three activity columns | Dedicated row between date row and activity grid | |
| You decide | Leave placement to planner | |

**User's choice:** Next to the date picker

| Option | Description | Selected |
|--------|-------------|----------|
| SelectButton | PrimeVue SelectButton — same component as ManageMeeting min/hr toggle | ✓ |
| Dropdown / Select | Compact dropdown, less horizontal space | |
| You decide | Let planner pick | |

**User's choice:** SelectButton

| Option | Description | Selected |
|--------|-------------|----------|
| Immediately on selection | PB create/update fires on SelectButton click | ✓ |
| On page-level Save button | Staged locally, committed with other items | |

**User's choice:** Immediately on selection

---

## Status Banner Design

| Option | Description | Selected |
|--------|-------------|----------|
| Simple centred banner | Text message in the grid area, e.g. "Sick Leave — 2026-04-29" | ✓ |
| Styled PrimeVue Message/Card | Colour-coded severity + Clear link | |
| You decide | Leave visual treatment to planner | |

**User's choice:** Simple centred banner

| Option | Description | Selected |
|--------|-------------|----------|
| Click active option to deselect | `:allowEmpty=true` on SelectButton | ✓ |
| Separate Clear / × button | Explicit Clear button next to SelectButton | |

**User's choice:** Click active option to deselect

---

## Export Format

**User's reference file:** `dsu-format.md` (at repo root — canonical format spec)

Format captured:
```
[MM/DD/YYYY]
Meetings:
- {Title} ({duration} mins)

Tasks:
{jira_link} - {Title}
* comment line

- {Title}    (no jira_link)
* comment

Admin:
- {link} - {Title}
- {Title}    (no link)
* comment
```

| Option | Description | Selected |
|--------|-------------|----------|
| Single line, no sections | `[date]\nSick Leave` | ✓ |
| Other | Different format | |

**SL/VL day format:** `[MM/DD/YYYY]\nSick Leave` (full name, no sections)

| Option | Description | Selected |
|--------|-------------|----------|
| Always show stored minutes | "(60 mins)", "(15 mins)" | ✓ |
| Convert back to hr when ≥ 60 | "(1hr)", "(2hrs)" | |
| Other | Different format | |

**Duration format:** always `(N mins)`, omit if null

| Option | Description | Selected |
|--------|-------------|----------|
| Strip HTML, each line as * bullet | `* Commit line` per paragraph | ✓ |
| Skip descriptions | Title/link/duration only | |
| Other | Different handling | |

**Description handling:** strip Quill HTML, each block → `* text`

**Task without Jira link:**

| Option | Description | Selected |
|--------|-------------|----------|
| - Title (dash prefix, like Admin) | Consistent with Admin format | ✓ |
| Title only (no dash) | Same line as tasks with link but no URL | |

**Status label abbreviations:**

| Option | Description | Selected |
|--------|-------------|----------|
| Short codes: SL, VL, Holiday, BL, Others | Display labels only | |
| Full names: Sick Leave, Vacation Leave, Holiday, Birthday Leave, Others | In export and banner | ✓ |

**Notes:** SelectButton shows abbreviated labels (SL, VL, Holiday, BL, Others) for compact top row; export and banner use full names.

---

## Status Values Exposed

| Option | Description | Selected |
|--------|-------------|----------|
| All 5: SL, VL, Holiday, BL, Others | Full PB schema exposure | ✓ |
| Only 3: SL, VL, Holiday | ROADMAP literal spec | |
| You decide | Leave to planner | |

**User's choice:** All 5 values

**Export button placement:**

| Option | Description | Selected |
|--------|-------------|----------|
| Same row as Save button (top-right) | Consistent top control bar | ✓ |
| Below the activity grid | End of page, logical reading order | |
| You decide | Leave to planner | |

**User's choice:** Same row as Save button

---

## Claude's Discretion

- HTML stripping implementation — DOMParser vs regex vs utility function; no new deps
- Upsert shape for day status — store full PB record (with `id`) vs status string only
- Export button visibility while status banner is shown (decided: stays visible per D-19)

## Deferred Ideas

- Download to `.txt` file — clipboard sufficient for v1
- Hour conversion in export — user chose always-minutes
- Multi-day / range export — v2 capability (CARRY-04)
