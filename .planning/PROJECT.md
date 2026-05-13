# Lexarium

## Phase 9: Restore Edit & Delete in Grouped View — COMPLETE (2026-05-13)

**Goal:** Restore CRUD actions (Edit and Delete) to each record row inside the group detail drawer, lost when Phase 6 replaced the flat DataTable with grouped cards.

**Delivered:**
- ✓ `VaccinationGroupPanel.vue` extended with `edit` and `delete` emits; actions column now shows View / Edit / Delete buttons in a flex row (14rem wide)
- ✓ `WallecxApp.vue` Drawer wires `@edit="openManage"` and `@delete="openDelete"` — no new handler logic, just reconnected emits
- ✓ Stale-Drawer fix (WR-01/WR-02): after a delete or edit, `selectedGroup` is re-derived from the freshly recomputed `groupedVaccinations`; if the last record in a group is deleted, the Drawer closes automatically
- ✓ Slot typing fix (WR-03): `#body` slot destructure annotated as `{ data }: { data: Vaccinations }` for genuine type safety on emit calls

---

## Previous Milestone: v1.1 Vaccine Grouping — COMPLETE (2026-05-12)

**Goal:** Reorganize the Wallecx view from a flat date-sorted list into vaccine-type group cards so users can instantly find all records for a specific vaccine category.

**Delivered:**
- ✓ `vaccine_type` free-text field (required on create/edit) added to PocketBase collection and the create/edit form
- ✓ Grouped card view replacing the flat DataTable — one card per vaccine type showing type name, record count, last administered date, and thumbnail of latest card scan
- ✓ Group detail Drawer — clicking a card opens a 4-column DataTable panel (Vaccine, Date, Dose, Lot) from the right
- ✓ "Uncategorized" catch-all group for existing records without a `vaccine_type`, pinned last alphabetically
- ✓ Each record row in the group panel opens the existing `VaccinationDetail.vue` dialog on top of the open Drawer

---

## What This Is

Lexarium is a personal Vue 3 SPA portfolio hub deployed on Vercel that hosts multiple mini-apps under `/projects/`. It currently bundles four apps (LexTrack, Larga, Gift Exchange / MonitoX, API Playground) and is now adding **Wallecx** — a personal records vault. The first slice of Wallecx is a vaccination records tracker so the owner (and other authenticated users) can save and view their vaccination history anytime.

## Core Value

**Each authenticated user can save and retrieve their own vaccination records — text fields plus an attached scan/photo of the card — without ever losing access to them.**

If everything else fails, this single capability must work.

## Requirements

### Validated

<!-- Existing Lexarium capabilities, inferred from the codebase map. Locked. -->

- ✓ Vue 3 SPA portfolio shell with shared `CustomNavBar` and `RouterView` — existing
- ✓ Routing with lazy-loaded mini-apps under `/projects/<app>` and a `requiresAuth` guard — existing
- ✓ PocketBase auth (login/logout via `useAuthStore`) wired through Pinia — existing
- ✓ Brand design system (navy/amber palette, Rubik font, custom PrimeVue Aura preset, Tailwind v4 tokens) — existing
- ✓ LexTrack mini-app (`/projects/lextrack`) — existing
- ✓ Larga mini-app (`/projects/larga`) — existing
- ✓ Gift Exchange / MonitoX mini-app (`/projects/gift-exchange/*`) — existing
- ✓ API Playground mini-app (`/projects/api-playground`) — existing
- ✓ Vercel deployment via GitHub push integration — existing

### Validated in Phase 1 (2026-05-11)

- ✓ New mini-app **Wallecx** mounted at `/projects/wallecx` — `WallecxApp.vue` shell registered as lazy route
- ✓ Route is auth-gated (`meta.requiresAuth: true`), reusing the existing `useAuthStore` + router guard — router guard redirects to `/login?redirect=/projects/wallecx`
- ✓ PocketBase `wallecx_vaccinations` collection with **per-user access rules** enforced server-side — two-user smoke test confirmed cross-user isolation
- ✓ Standard vaccination fields: `vaccine_name`, `date_administered`, `dose_number`, `lot_number`, `location`, `manufacturer`, `notes`, `user` — all locked and indexed
- ✓ `card` file field for vaccination card attachment (image or PDF) — `protected: true`, 10 MB cap, MIME allowlist, thumbs configured

### Validated in v1.1 (2026-05-12)

- ✓ `vaccine_type` free-text field added to `wallecx_vaccinations` collection and the create/edit form (required on new/edited records)
- ✓ Wallecx home view groups records by vaccine type — one card per type showing name, record count, last date, thumbnail
- ✓ Records with no `vaccine_type` surface in an "Uncategorized" group card, pinned last
- ✓ Clicking a group card opens a Drawer detail panel listing all records in that group (4-column DataTable)
- ✓ Each record row in the group panel opens the existing full-detail dialog on top of the still-open Drawer

### Validated in v1.2 (2026-05-13)

- ✓ Real-time search input filters group cards by vaccine type name or any record's vaccine name (case-insensitive); empty query shows all groups
- ✓ "No results" empty state shown when search matches nothing — distinct from the zero-records state
- ✓ Sort control (Type A–Z default, Type Z–A, Name A–Z, Name Z–A) with Uncategorized always pinned last regardless of direction
- ✓ View toggle Button in the toolbar switches grouped-card layout between 2-column grid and single-column list
- ✓ Selected view persists for the browser session via sessionStorage (reset on tab close)
- ✓ `VaccinationGroupCard.vue` reused unchanged across both layouts — only the container grid class swaps

### Validated in Phase 9 (2026-05-13)

- ✓ Edit and Delete buttons present on each record row in the group detail drawer (CRUD-01)
- ✓ Edit opens `ManageVaccination.vue` pre-filled with the selected record; Delete triggers the existing `openDelete` confirm flow (CRUD-02)
- ✓ `selectedGroup` re-derived from `groupedVaccinations` after each edit/delete — Drawer stays live without requiring close/reopen; auto-closes if the last record in a group is deleted

### Out of Scope

<!-- Explicit boundaries for THIS phase. Reasoning included so we don't quietly re-scope. -->

- **Other vault record types** (identity docs, prescriptions, lab results, certificates, etc.) — Future phases. Anticipated but deliberately deferred. The vaccination collection should be designed so generalizing later is *possible*, not pre-built.
- **Reminders / notifications for upcoming doses** — Out of v1. Adds infra (cron, email/push) that the rest of Lexarium doesn't have. Defer until proven needed.
- **Sharing a record with another user / generating a shareable link** — Out of v1. Per-user privacy is the default.
- **PDF export / printable vaccination summary** — Out of v1. The attached card scan covers the "show this to a doctor" use case.
- **Calendar view** — Considered and rejected for v1. List + detail is enough for "save and view anytime."
- **OCR / auto-populating fields from the uploaded card image** — Out of v1. Manual entry is acceptable.
- **Multi-language / localization** — Out of v1. English only, matching the rest of Lexarium.
- **Public unauthenticated access** — Out of scope by design. Vaccination data is sensitive.
- **Offline-first / PWA support** — Out of v1. Online-only, matching the rest of Lexarium.

## Context

**Codebase environment** — Existing Lexarium SPA. Deep map lives in `.planning/codebase/` (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS). Key patterns Wallecx must follow:

- Mini-app convention: `src/components/projects/wallecx/WallecxApp.vue` (+ subcomponents in same folder), registered as a lazy route in `src/router/index.ts` with `meta: { requiresAuth: true }`
- Backend: shared `pb` singleton at `src/lib/pocketbase/index.ts`. New record type: `src/types/wallecx/vaccinations/types.d.ts` exporting `interface Vaccinations extends RecordModel` and a paired `AddVaccination = Omit<Vaccinations, 'id' | 'created' | 'updated'>`. Write mapper if needed: `src/lib/pocketbase/vaccinationMapper.ts`
- UI: PrimeVue (Aura preset, navy `#002244` / amber `#E89820`) + Tailwind v4 utility classes + Rubik font. Dialogs/cards follow the LexTrack style. PrimeVue components are auto-imported via `unplugin-vue-components`
- Auth: `useAuthStore` (Pinia setup store) is the only source of truth; the router guard already redirects to `/login?redirect=...` on unauthenticated access
- Date handling: `dayjs` everywhere; PocketBase date filters use `"YYYY-MM-DD"` format
- HTML safety: `dompurify` is the established sanitizer for any user-supplied rich text; vaccination records are field-based so this is mostly irrelevant unless we add a notes-with-formatting field later

**Vault generalization (informational, not a v1 requirement)** — Wallecx is intended as a personal records vault. Vaccination records are the first record type. Most-likely future record types: identity documents (passport, IDs, licenses) and other medical records (prescriptions, lab results, insurance). The schema should accommodate this *if it doesn't add complexity*, but we are NOT pre-building a generic record system in v1.

**Known concerns from the codebase map** that intersect Wallecx:

- The auth guard is client-side only — the *real* gate is PocketBase collection rules. Wallecx vaccination collection rules must enforce per-user access server-side; the route guard is just UX.
- Mini-apps share global state via the single `pb` client. Logging in for Wallecx unlocks LexTrack and the others — acceptable for a personal hub.
- `unplugin-vue-components` will auto-register every `WallecxApp.vue` subcomponent globally. Keep subcomponent names unambiguous.
- Zero test coverage in the codebase today. Vaccination CRUD on private health data is a reasonable place to seed a first round of tests (mappers, store interactions, route guard).

## Constraints

- **Tech stack**: Vue 3 + Vite 8 (rolldown) + PrimeVue 4 (Aura) + Pinia + Vue Router + Tailwind v4 + PocketBase 0.26 — Locked. Wallecx must use the existing stack; no new frameworks.
- **Hosting**: Static deploy on Vercel via GitHub push integration. No server-side code beyond what PocketBase provides — Wallecx logic that needs server enforcement (e.g. per-user record isolation) lives in PocketBase collection rules / hooks, not in the SPA.
- **Backend**: Single PocketBase instance shared across all mini-apps. New collection (e.g. `wallecx_vaccinations`) with per-user access rules. File field for the card attachment.
- **Auth**: Reuse existing PocketBase users + Pinia `useAuthStore`. No separate identity store.
- **Privacy**: Vaccination data is sensitive. Per-user isolation must be enforced server-side via PocketBase collection rules — not just client-side route guards. No telemetry / no analytics on record contents.
- **Design system**: Lexarium navy/amber palette + Rubik font + PrimeVue Aura preset — Wallecx must blend in. No new design tokens.
- **Naming**: Mini-app folder `src/components/projects/wallecx/`, root `WallecxApp.vue`, route name `wallecx`, route slug `/projects/wallecx`. Type folder `src/types/wallecx/vaccinations/`.
- **Compatibility**: Must coexist with the four existing mini-apps without breaking them; route addition only.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build Wallecx as a Lexarium mini-app rather than a separate deployment | Fits the existing portfolio pattern; reuses auth, design system, and PocketBase. Lower friction. | Validated Phase 1 |
| Vaccination records are Phase 1 of a broader personal records vault | User explicitly framed it this way; affects naming (Wallecx, not "vax-tracker") but NOT v1 schema generality | Validated Phase 1 |
| Multi-user from day 1 (vs. single-user for the owner only) | Reuses existing PocketBase auth; per-user rules avoid a future migration | Validated Phase 1 |
| File attachments included in v1 (vs. text fields only) | Real-world utility; the photo of the card *is* the record for most people | Validated Phase 1 |
| Standard field set (name, date, dose, lot, location) — not Minimal, not Comprehensive | "Comprehensive" pulls in clinical fields the user doesn't need; "Minimal" loses the lot # which is genuinely useful for recalls | Validated Phase 1 |
| List + detail view (vs. list-only or calendar) | Matches the LexTrack pattern; calendar adds build cost without earning its keep for a small dataset | ✓ Validated Phase 2 |
| Defer all other vault record types to future phases | "I just plainly want to save my vaccination records" — narrow first slice. Schema *allows* future generalization without pre-building it | Validated Phase 1 |
| Re-use Lexarium design system (navy/amber + Rubik) | No reason to introduce a new visual identity for one mini-app | ✓ Validated Phase 4 |

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

## Shipped Milestones

| Milestone | Phases | Shipped | Archive |
|-----------|--------|---------|---------|
| v1.0 MVP | 0–4 | 2026-05-12 | [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) |
| v1.1 Vaccine Grouping | 5–6 | 2026-05-12 | — |
| v1.2 Search, Sort & View Toggle | 7–9 | 2026-05-13 | — |

All 9 phases complete. Consider `/gsd-new-milestone` to plan the next milestone.

---
*Last updated: 2026-05-13 — v1.0 milestone archived. All three milestones (v1.0, v1.1, v1.2) shipped.*
