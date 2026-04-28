# Phase 2: Types & Mappers - Discussion Log

> **Audit trail only.** Not consumed by downstream agents — see CONTEXT.md for the canonical decisions.

**Date:** 2026-04-28
**Phase:** 02-types-mappers
**Areas discussed:** Status enum width, Enum constants pattern, Mapper coverage, Optional vs required for duration_unit (+ import path normalization)

---

## Gray Area Selection

| Option | Selected |
|---|---|
| Status enum width | ✓ |
| Enum constants pattern | ✓ |
| Mapper coverage | ✓ |
| Optional vs required for duration_unit | ✓ |

**User picked all 4.**

---

## Status Enum Width

### Q1: What do `bl` and `others` mean?

| Option | Selected |
|---|---|
| bl = bereavement leave | |
| bl = birthday leave | ✓ |
| bl = business leave / business trip | |
| Other | |

**User's choice:** bl = birthday leave (PH company perk, 1-day off in birth month)

### Q2: Which value set should `DsuDayStatus.status` use?

| Option | Selected |
|---|---|
| Match live: 5 values | ✓ |
| Locked spec: 3 values only | |
| Match live + roll out gradually | |

**User's choice:** Match live — 5 values

### Q3: `others` = catch-all?

| Option | Selected |
|---|---|
| Yes, generic catch-all | ✓ |
| Other meaning | |

**User's choice:** Yes, generic catch-all

---

## Enum Constants Pattern

### Q1: Where should enum value constants live?

| Option | Selected |
|---|---|
| Co-located in types.d.ts | |
| Separate constants file | ✓ |
| No `as const` arrays — types only | |

**User's choice:** Separate `constants.ts` file per entity

### Q2: File extension switch?

| Option | Selected |
|---|---|
| Rename `types.d.ts` → `types.ts` | ✓ |
| Keep `types.d.ts`, add `constants.ts` | |
| Skip runtime constants entirely | |

**User's choice:** Rename to `types.ts` (combined with separate constants file from Q1 → two `.ts` files per entity)

### Q3: Export human-readable labels?

| Option | Selected |
|---|---|
| Yes, label map | ✓ |
| No, UI handles labels itself | |

**User's choice:** Yes, label maps

### Q4: Apply same pattern to `duration_unit`?

| Option | Selected |
|---|---|
| Yes, same pattern | ✓ |
| No, just inline literal type | |

**User's choice:** Yes, same pattern for duration_unit

---

## Mapper Coverage

### Q1: Which mapper functions per entity?

| Option | Selected |
|---|---|
| mapToUpdate* (existing pattern) | ✓ |
| mapToCreate* (new) | ✓ |
| mapFromRecord* (new) | ✓ |

**User's choice:** All three — full mapper triple

### Q2: Where should legacy-default normalization live?

| Option | Selected |
|---|---|
| In the mapper layer | ✓ |
| In the component / view | |
| PB-side default | |

**User's choice:** In the mapper layer (`mapFromRecord*`)

### Q3: How should `dsu_day_status` mapper differ?

| Option | Selected |
|---|---|
| mapToCreate + mapFromRecord | ✓ |
| Full set: create + update + read | |
| No mapper at all | |

**User's choice:** mapToCreate + mapFromRecord (no update mapper for day status)

### Q4: Normalize all 3 existing mappers?

| Option | Selected |
|---|---|
| Yes, normalize all 3 | ✓ |
| No, only touch what schema requires | |

**User's choice:** Yes, normalize all three for symmetry

---

## Optional vs Required for `duration_unit` + Import Paths

### Q1: How should `duration_unit` be typed on `DsuMeetings`?

| Option | Selected |
|---|---|
| Required after read; optional in create payload | ✓ |
| Optional everywhere | |
| Required everywhere | |

**User's choice:** Required after read (`DsuMeetings.duration_unit: 'minutes' \| 'hours'`); optional on create (`AddDsuMeeting.duration_unit?:`); mapper fills `'minutes'` for legacy

### Q2: Normalize `RecordModel` import path?

| Option | Selected |
|---|---|
| Use `pocketbase` | ✓ |
| Use `pocketbase/dist/pocketbase.es` | |
| Don't touch existing imports | |

**User's choice:** Normalize to `pocketbase` (public package entry)

### Q3: Should `AddDsu*` switch to `Pick`-based?

| Option | Selected |
|---|---|
| Keep current `Omit` pattern | ✓ |
| Stricter — `Pick` from a narrower base | |

**User's choice:** Keep current `Omit` pattern

---

## Claude's Discretion

These were not explicitly asked but recorded in CONTEXT.md §Claude's Discretion:
- New collection directory naming (snake_case `dsu_day_status/`)
- No default exports
- No barrel file at `src/types/lextrack/index.ts`

## Deferred Ideas

- Barrel file (rejected; revisit if multi-entity imports become common)
- Stricter `Pick`-based add types (rejected; revisit if inference issues)
- i18n / locale-aware labels (out of scope per PROJECT.md)
- Zod runtime validators derived from `as const` arrays (Phase 5 consideration)
- Auto-generated PB types via `pocketbase-typegen` (bigger lift; revisit if schema changes accelerate)
