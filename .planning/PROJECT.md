# LexTrack Optimization

## What This Is

LexTrack is the auth-gated daily-stand-up tracker living inside the `lex-lib.github.io` Vue 3 SPA. It captures three buckets of daily work — **Meetings**, **Tasks**, and **Admin** — backed by PocketBase, and replaces the user's manual plain-text jotting (see `quarter-3-logs.txt`). This project optimizes the existing implementation: aligns it with the formal requirements doc, fixes correctness bugs, and adds the workflow features the user actually needs based on a quarter's worth of real-world logs.

## Core Value

Capturing a day's stand-up activity must be **fast, complete, and durable** — the user can sit down at the end of any day, fill in their three buckets, and trust that the data is saved correctly and readable later.

## Requirements

### Validated

<!-- Inferred from existing code in src/views/LexTrackView.vue and src/components/projects/lextrack/ -->

- ✓ User can authenticate via PocketBase (email/password) and session persists — existing
- ✓ Auth-gated route `/projects/lextrack` redirects unauthenticated users to `/login` — existing
- ✓ User can pick a date and view three sections: Meetings, Tasks, Admin (currently labeled "Admin Tasks and Support") — existing
- ✓ User can add Meeting (title, optional duration in minutes, optional description) — existing
- ✓ User can add Task (title, optional jira_link, optional description) — existing
- ✓ User can add Admin/Support (title, optional description) — existing
- ✓ User can edit any item via per-item dialog — existing (UI only; persistence is page-level)
- ✓ Page-level Save button persists all unsaved items to PocketBase — existing
- ✓ All three sections support rich-text descriptions via Quill (PrimeVue Editor) — existing

### Active

<!-- v1 scope for this milestone. -->

**A. Requirements Alignment**

- [ ] **REQ-A1** — User can mark a meeting's duration in either **minutes or hours** via a unit toggle (stored as minutes internally)
- [ ] **REQ-A2** — User can attach a single optional **link (URL)** to an Admin entry
- [ ] **REQ-A3** — Admin section is renamed/aligned with the requirements doc terminology ("Admin")

**B. Bug Fixes (from `.planning/codebase/CONCERNS.md`)**

- [ ] **REQ-B1** — Selected date's items load on page mount (not only on date change)
- [ ] **REQ-B2** — Removing an item via the trash icon **deletes it from PocketBase** (currently only mutates local array)
- [ ] **REQ-B3** — Per-item dialog "Save" button **persists that single item** to PocketBase (currently shows toast only)
- [ ] **REQ-B4** — Loading, saving, and error states are visible (toasts via `vue-sonner`, button-disabled while saving)
- [ ] **REQ-B5** — Debug `console.log` statements removed from production code paths
- [ ] **REQ-B6** — Stale commented-out code removed from `LexTrackView.vue`

**C. Workflow Features**

- [ ] **REQ-C1** — User can mark a whole day as **Sick Leave / Vacation Leave / Holiday** via a new `dsu_day_status` collection; UI hides activity sections when set
- [ ] **REQ-C2** — User can **export the current day** to text matching the format of their manual `quarter-3-logs.txt` (copy to clipboard or download)

**D. Quality**

- [ ] **REQ-D1** — Vitest unit tests cover **new** code (mappers, composables, validators, day-status logic, exporter)
- [ ] **REQ-D2** — Vitest unit/component tests cover **existing** LexTrack code paths (view orchestrator, ActivityCard, Manage* dialogs)

### Out of Scope

- **Multi-link tasks (`links: string[]`)** — User confirmed `jira_link` stays single; extra URLs go in the description Editor. Avoids schema churn.
- **Carry-over / autocomplete from prior days** — Useful but deferred; not blocking and adds non-trivial UX work.
- **Half-day / partial-day status** — Day status is whole-day only for v1.
- **Markdown-friendly paste / sub-step checklists** — Quill rich text is sufficient for now.
- **Public sharing / multi-user collaboration** — LexTrack is single-user by design.
- **Mobile-first redesign** — Desktop layout is acceptable; responsive polish can come later.

## Context

**Codebase state (see `.planning/codebase/`):**
- Vue 3 + Vite + Pinia + PrimeVue (Aura, indigo) + Tailwind v4 SPA, deployed to GitHub Pages.
- PocketBase backend at `VITE_API_BASE_URL`; single shared `pb` instance in `src/lib/pocketbase/index.ts`; auth wrapped by `useAuthStore` (`src/stores/auth.ts`).
- LexTrack lives at `/projects/lextrack` (auth-gated). Orchestrator: `src/views/LexTrackView.vue`. Components in `src/components/projects/lextrack/`. Per-entity types under `src/types/lextrack/<entity>/`. Mappers in `src/lib/pocketbase/dsu*Mapper.ts`.
- Two-stage lint: `oxlint` then `eslint` (flat config). Vitest configured but **no tests exist yet**.
- PrimeVue components are auto-imported via `unplugin-vue-components` (no manual imports).

**User signal — `quarter-3-logs.txt` (Q3 2026, ~60 days):**
- Most Tasks have a Jira link plus other URLs (PRs, MHD, Release Notes) — user keeps the Jira primary, others in description.
- Most Admin entries have URLs — current schema has none.
- Meeting durations expressed as `(1hr)`, `(55mins)`, `(2 hours)` — current schema only stores minutes.
- `SL` and `VL` whole-day entries appear repeatedly — currently no representation.
- Same Jira tickets recur across many days (G1-3859 spans Jan–Mar) — carry-over deferred to a later milestone.

**Known concerns (from `.planning/codebase/CONCERNS.md`):**
- `LexTrackView.vue` initial-load bug, missing delete persistence, dialog Save no-op, no loading/error UX, leftover console.logs and commented Dialog block.
- No tests anywhere in the project.

## Constraints

- **Tech stack** — Must stay within current stack: Vue 3 Composition API, PocketBase, PrimeVue, Tailwind v4. No framework swaps.
- **Schema** — PocketBase collections: minimize migrations; additive changes only (new optional fields, new collection for day status). No renames or destructive migrations on existing data.
- **Auth** — All LexTrack routes remain auth-gated via existing `meta.requiresAuth` + `useAuthStore`.
- **Backwards compat** — Existing data in `dsu_meetings`, `dsu_tasks`, `dsu_supports` must continue to render correctly.
- **Bundle size** — Static SPA on GitHub Pages; avoid heavy new dependencies. Reuse PrimeVue / lodash-es / dayjs already present.
- **Deployment** — `npm run deploy` (gh-pages) must continue to work; the build copies `dist/index.html → dist/404.html` for SPA fallback.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| `jira_link` stays single field on `dsu_tasks` | User's logs put extra URLs in description; avoids schema migration | — Pending |
| Admin gets `link?: string` (single optional URL) | Logs show admin entries almost always have URLs (MHD, service desk) | — Pending |
| Meeting duration: single number + min/hr unit toggle, store as minutes | Matches requirements doc ("hour or minutes"); single source of truth in DB | — Pending |
| Day status as new `dsu_day_status` collection (`{date, status}`) | Cleaner than embedding on existing collections; easy to extend later | — Pending |
| Tests: full coverage for both new and existing LexTrack code | Establishes baseline; project currently has zero tests | — Pending |
| Carry-over / autocomplete deferred | High UX effort, not blocking core value | — Pending |
| Multi-link tasks rejected | User chose to keep `jira_link` single; URLs go in description | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-28 after initialization*
