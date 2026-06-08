# Phase 1: Backend + Frontend Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 01-backend-frontend-foundation
**Areas discussed:** Plan structure, PocketBase setup guidance, Shell component depth

---

## Plan Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Two plans: Backend then Frontend | 01-01 = PocketBase setup + smoke test; 01-02 = frontend code | |
| One unified plan | All 10 requirements in a single plan | |
| Two plans: Backend then Frontend (Recommended) | 01-01 = PocketBase setup + smoke test; 01-02 = frontend | ✓ |

**User's choice:** Two plans (backend then frontend) — subsequently refined to 3 plans after smoke test discussion.
**Notes:** User confirmed backend and frontend as separate plans. Smoke test then raised as a separate human-action checkpoint (below), resulting in 3 total plans: 01-01 (collection setup BACK-01..04), 01-02 (smoke test BACK-05), 01-03 (frontend FRONT-01..05).

---

## PocketBase Setup Guidance Style

| Option | Description | Selected |
|--------|-------------|----------|
| Step-by-step field-by-field walkthrough | Plan lists each field with exact settings, rule strings verbatim | ✓ |
| High-level instructions with field summary table | Summary table + exact rule strings, assumes PocketBase familiarity | |
| Schema JSON to import | Generate importable PocketBase collection schema JSON | |

**User's choice:** Step-by-step field-by-field walkthrough.
**Notes:** Developer wants maximum prescriptiveness — each field with exact configuration so it can be followed as a checklist without consulting documentation.

---

## Smoke Test Documentation Format

| Option | Description | Selected |
|--------|-------------|----------|
| Separate plan: 01-02 human-action checkpoint (like Phase 0) | Mandatory gate before frontend work | ✓ |
| Embedded in backend plan as final verification task | Smoke test as last task in 01-01 | |

**User's choice:** Separate plan, human-action checkpoint — mirrors Phase 0's `00-02-PLAN.md` structure.
**Notes:** This adds a third plan to Phase 1 (01-01, 01-02, 01-03).

---

## Shell Component Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Basic layout scaffold | Page title + container div + record count | ✓ |
| Bare minimum placeholder | Just `<p>{{ records.length }} vaccination records</p>` | |
| You decide | Claude picks based on codebase patterns | |

**User's choice:** Basic layout scaffold.
**Notes:** Gives Phase 2 a natural anchor point. Follows LexTrackView's header + content area pattern.

---

## Shell Page Title

| Option | Description | Selected |
|--------|-------------|----------|
| Vaccination Records | Descriptive, matches the domain | |
| Wallecx | Brand name for the vault app | ✓ |
| You decide | Claude picks based on mini-app naming patterns | |

**User's choice:** "Wallecx" — consistent with using the mini-app brand name (LexTrack, not "Task Tracker"; Larga, not "PUV Finder").

---

## Claude's Discretion

- Exact Tailwind/PrimeVue class names for WallecxApp.vue scaffold layout
- Whether to include `// --- STATE ---` / `// --- LOGIC ---` section comments (follow LexTrackApp.vue convention)
- Exact wording of smoke-test confirmation message in the 01-02 human-action plan

## Deferred Ideas

None raised during discussion.
