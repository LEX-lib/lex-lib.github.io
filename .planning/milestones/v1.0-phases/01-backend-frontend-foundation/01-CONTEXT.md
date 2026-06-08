# Phase 1: Backend + Frontend Foundation - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the `wallecx_vaccinations` PocketBase collection (per-user rules, file field config, composite index) and the frontend skeleton (two new runtime deps, TypeScript types, mapper, lazy route, shell component). The phase ends when Wallecx is reachable at `/projects/wallecx`, type-safe, and provably isolated per user — with a working shell that renders the authenticated user's record count. No user-facing CRUD or preview UI is built here.

**In scope:** BACK-01..05, FRONT-01..05 — PocketBase collection + rules + file config + index + smoke test; npm deps install; types module; mapper module; lazy route registration; WallecxApp.vue shell.
**Out of scope:** List view, detail view, attachment preview, CRUD dialogs, EXIF strip, any read/write UI (those are Phases 2–3).

</domain>

<decisions>
## Implementation Decisions

### Plan Structure
- **D-01:** Phase 1 uses **3 plans**:
  - `01-01-PLAN.md` — PocketBase collection setup (BACK-01..04): step-by-step field-by-field Admin UI walkthrough, all five rule strings, composite index.
  - `01-02-PLAN.md` — Two-user smoke test human-action checkpoint (BACK-05): developer performs the test with two real PocketBase accounts and confirms isolation, mirroring the Phase 0 `00-02-PLAN.md` checkpoint pattern.
  - `01-03-PLAN.md` — Frontend foundation (FRONT-01..05): npm install, types module, mapper module, lazy route, WallecxApp.vue shell.

### PocketBase Setup Guidance
- **D-02:** `01-01-PLAN.md` must be a **step-by-step field-by-field walkthrough** — each field listed with exact name, type, required/optional flag, max size, MIME allowlist, thumb dimensions, and all five collection rule strings verbatim. Developer follows it as a checklist in the PocketBase Admin UI. No assumptions about familiarity with PocketBase field configuration.

### Smoke Test
- **D-03:** The two-user smoke test (BACK-05) is a **separate plan** (`01-02-PLAN.md`), structured as a human-action checkpoint. The plan provides step-by-step instructions: create a second PocketBase account, add a record as User A, attempt list/view/update/delete/direct-file-URL as User B, and confirm all return 403 or 404. The developer confirms completion before frontend work begins.

### Shell Component
- **D-04:** `WallecxApp.vue` includes a **basic layout scaffold**: page title `"Wallecx"` (brand name, not "Vaccination Records"), a container div matching the mini-app layout pattern, and the record count rendered below. This gives Phase 2 a natural anchor point for the list component. Structure mirrors how `LexTrackView.vue` has a header + content area.
- **D-05:** Page title is **"Wallecx"** — consistent with using the mini-app brand name rather than a descriptive noun (precedent: LexTrack, not "Task Tracker"; Larga, not "PUV Finder").

### Mapper
- **D-06:** `mapToUpdateVaccination` follows the exact `mapToUpdateTask` pattern — explicit inline return type listing the writable fields (strips `id`, `created`, `updated`, `user`, `card`). Return type is an inline object type, not a named type alias. `card` is stripped from the mapper payload; attachment updates are a separate operation in Phase 3.

### Claude's Discretion
- Exact container/layout class names for the WallecxApp.vue scaffold (follow existing Tailwind/PrimeVue patterns from LexTrackView or ProjectsView).
- Whether to add a `// --- STATE ---` / `// --- LOGIC ---` section comment pattern (follow LexTrackApp.vue convention).
- Exact wording of smoke-test confirmation message in the human-action plan.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 1 — Goal, requirements (BACK-01..05, FRONT-01..05), and success criteria
- `.planning/REQUIREMENTS.md` §Backend Foundation (PocketBase) and §Frontend Foundation — full requirement definitions with exact field names, rule strings, and type signatures

### Codebase Analogs (read these to understand the exact patterns to follow)
- `src/lib/pocketbase/dsuTaskMapper.ts` — Direct analog for `vaccinationMapper.ts`; follow the same function signature and inline return type pattern
- `src/types/lextrack/dsu_tasks/types.d.ts` — Direct analog for `src/types/wallecx/vaccinations/types.d.ts`; follow the same `extends RecordModel` + `Omit` pattern
- `src/router/index.ts` — Where the new lazy route is added; follow the `meta: { requiresAuth: true }` pattern from the `lextrack` route
- `src/views/LexTrackView.vue` — Reference for shell layout structure (header + content area) and the `onMounted` + `getFullList` pattern

### Prior Phase Context
- `.planning/phases/00-pre-wallecx-cleanup/00-02-PLAN.md` — Pattern for human-action checkpoint plan structure (used for `01-02-PLAN.md`)
- `.planning/phases/00-pre-wallecx-cleanup/00-CONTEXT.md` — Phase 0 context (lint:secrets guard decision, local.jsonc decision)

### Research Findings
- `.planning/research/PITFALLS.md` — Risk register; Pitfalls 1 (per-user isolation), 2 (filter injection), 5 (PDF.js CVE) are most relevant to Phase 1
- `.planning/codebase/CONVENTIONS.md` — Naming conventions, Vue patterns, error handling, styling patterns to follow

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/pocketbase/index.ts` — Singleton `pb` client; import as `import { pb } from "@/lib/pocketbase"` (no `.ts` extension)
- `src/stores/auth.ts` — `useAuthStore()` for `isLoggedIn` check; already wired into router guard — no new auth code needed
- PrimeVue components (auto-imported): `<Button>`, `<Card>`, etc. — available without explicit import in any new SFC

### Established Patterns
- **Type module pattern:** `src/types/<feature>/<entity>/types.d.ts` exports interface extending `RecordModel` + `Add<Entity> = Omit<Entity, "id" | "created" | "updated">`
- **Mapper pattern:** `src/lib/pocketbase/<entity>Mapper.ts` exports `mapToUpdate<Entity>` with explicit inline return type
- **Route pattern:** Dynamic import with `meta: { requiresAuth: true }` for auth-gated mini-apps
- **Shell pattern:** `onMounted` + `try/catch/finally` for data fetch; `toast.error` on failure; `ref([])` for record list

### Integration Points
- `src/router/index.ts` — Add route entry for `/projects/wallecx` before the `blog` route
- `src/components/projects/wallecx/WallecxApp.vue` — New directory; follows `src/components/projects/<app>/<App>App.vue` convention
- `src/types/wallecx/vaccinations/types.d.ts` — New directory tree under `src/types/`
- `src/lib/pocketbase/vaccinationMapper.ts` — New file alongside existing mappers
- `package.json` — `npm install browser-image-compression@^2.0.2 vue-pdf-embed@^2.1.4` (FRONT-01)

### Collection Reference
- PocketBase collection name: `wallecx_vaccinations` (snake_case, matches backend convention)
- Sort query for shell: `pb.collection('wallecx_vaccinations').getFullList<Vaccinations>({ sort: '-date_administered' })`

</code_context>

<specifics>
## Specific Ideas

- The smoke test must cover all five access types: list, view, update, delete, and direct `card` file URL (without token) — all must return 403 or 404 for User B. This is the BACK-05 success criterion, not just a list check.
- `pdfjs-dist` must resolve to ≥ 4.2.67 (CVE-2024-4367 fix) — verify in `package-lock.json` after install (FRONT-01).
- `dose_number` is typed `number | undefined` (optional, matches `?` pattern from `DsuTasks.jira_link?: string`).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-backend-frontend-foundation*
*Context gathered: 2026-05-10*
