# Phase 11: Backend + Frontend Foundation - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the `wallecx_memberships` PocketBase collection (per-user rules, file field config, access rules) and the frontend skeleton (two new barcode library dependencies, TypeScript types, mapper module) — so that Phase 12's membership card UI components have a provably isolated, type-safe foundation to build on before any component work begins. No UI components or read/write flows are built here.

**In scope:** MBACK-01, MBACK-02, MBACK-03, MFRONT-01, MFRONT-02, MFRONT-03 — PocketBase collection + rules + file config + smoke test; npm deps install; types module; mapper module.
**Out of scope:** MembershipsTab.vue grid, MembershipCard.vue, BarcodeDisplay.vue, MembershipDetail.vue, ManageMembership.vue (Phases 12–13).

</domain>

<decisions>
## Implementation Decisions

### Plan Structure
- **D-01:** Phase 11 uses **3 plans**, mirroring Phase 1:
  - `11-01-PLAN.md` — PocketBase collection setup (MBACK-01, MBACK-02): step-by-step field-by-field Admin UI walkthrough, all five rule strings verbatim.
  - `11-02-PLAN.md` — Two-user smoke test human-action checkpoint (MBACK-03): same structure as `01-02-PLAN.md`; developer confirms isolation across all five access types (list/view/update/delete/file URL) before frontend work begins.
  - `11-03-PLAN.md` — Frontend foundation (MFRONT-01, MFRONT-02, MFRONT-03): npm install for `qrcode.vue@^3.9.1` and `jsbarcode@^3.12.3`, types module, mapper module.

### card_image File Field Configuration
- **D-02:** `card_image` file field uses **image-only** MIME allowlist: `image/jpeg,image/png,image/webp` — no PDF support. Membership cards are physical cards photographed; PDF is not applicable here (unlike vaccination certificates). MWRITE-04 also specifies image-only in the upload component.
- **D-03:** `card_image` field configuration: `protected: true`, **10MB** size cap, thumbs `100x100` + `400x0` — identical to the vaccination `card` file field (Phase 1 BACK-02 pattern).

### barcode_type Field Type
- **D-04:** `barcode_type` is a PocketBase **select field** (not plain text), configured with 5 enum values: `qr`, `code128`, `ean13`, `code39`, `number`. `maxSelect: 1`. Server-side validation rejects any value outside this set. This is a departure from ROADMAP.md which says "text, optional" — the select field is more appropriate because the value set is closed and known.

### Mapper
- **D-05:** `mapToUpdateMembership` follows the exact `mapToUpdateVaccination` pattern — explicit inline return type listing the writable fields, stripping `id`, `created`, `updated`, `user`, and `card_image`. `card_image` is stripped because attachment updates are handled as a separate operation (same reasoning as `card` in `mapToUpdateVaccination`).

### PocketBase Setup Guidance
- **D-06:** `11-01-PLAN.md` must be a **step-by-step field-by-field walkthrough** — each field listed with exact name, type, required/optional flag, max size, MIME allowlist, thumb dimensions, select options (for `barcode_type`), and all five collection rule strings verbatim. Developer follows it as a checklist in the PocketBase Admin UI.

### Claude's Discretion
- Exact ordering of fields in the PocketBase Admin UI walkthrough (follow a logical grouping: identity fields first, then barcode fields, then card_color/card_image).
- Exact wording of the smoke-test confirmation message in the human-action plan (mirror 01-02-PLAN.md style).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 11 — Goal, requirements (MBACK-01..03, MFRONT-01..03), and success criteria
- `.planning/REQUIREMENTS.md` §Backend (PocketBase) and §Frontend Foundation — full requirement definitions with exact field names, rule strings, and type signatures

### Codebase Analogs (direct patterns to follow)
- `src/lib/pocketbase/vaccinationMapper.ts` — Direct analog for `membershipMapper.ts`; follow the same function signature and inline return type pattern
- `src/types/wallecx/vaccinations/types.d.ts` — Direct analog for `src/types/wallecx/memberships/types.d.ts`; follow the same `extends RecordModel` + `Omit` pattern
- `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts` — Pattern reference for Phase 13 mapper spec (not in scope for Phase 11, but good to note for mapper design)

### Prior Phase Context (read for plan structure patterns)
- `.planning/phases/01-backend-frontend-foundation/01-CONTEXT.md` — Direct analog; D-01..06 decisions establish the patterns Phase 11 repeats
- `.planning/phases/01-backend-frontend-foundation/01-01-PLAN.md` — Template for 11-01-PLAN.md (field-by-field walkthrough format)
- `.planning/phases/01-backend-frontend-foundation/01-02-PLAN.md` — Template for 11-02-PLAN.md (human-action checkpoint format)
- `.planning/phases/01-backend-frontend-foundation/01-03-PLAN.md` — Template for 11-03-PLAN.md (frontend foundation format)

### State and Risk Register
- `.planning/STATE.md` §Risk Register (v2.0) — JsBarcode try/catch, ColorPicker hash-less storage, iOS fullscreen overlay, screen wake lock (relevant to Phase 12–13; Phase 11 lays the library foundation)
- `.planning/STATE.md` §Key Decisions (v2.0) — Locked decisions: direct v-model refs for ManageMembership, card_color stored without hash, iOS fixed overlay pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/pocketbase/index.ts` — Singleton `pb` client; import as `import { pb } from "@/lib/pocketbase"` — no changes needed
- `src/types/wallecx/vaccinations/types.d.ts` — Direct analog; new file goes at `src/types/wallecx/memberships/types.d.ts`
- `src/lib/pocketbase/vaccinationMapper.ts` — Direct analog; new file goes at `src/lib/pocketbase/membershipMapper.ts`
- `src/components/projects/wallecx/MembershipsTab.vue` — Stub exists (Phase 10); Phase 12 will flesh it out; Phase 11 does not touch it

### Established Patterns
- **Type module pattern:** `src/types/<feature>/<entity>/types.d.ts` exports `interface <Entity> extends RecordModel` + `type Add<Entity> = Omit<Entity, "id" | "created" | "updated">`
- **Mapper pattern:** `src/lib/pocketbase/<entity>Mapper.ts` exports `mapToUpdate<Entity>` with explicit inline return type listing writable fields
- **PocketBase access rules (same for all 5 types):** `listRule/viewRule/updateRule/deleteRule → "@request.auth.id != \"\" && user = @request.auth.id"`; `createRule → "@request.auth.id != \"\" && @request.body.user = @request.auth.id"`

### Integration Points
- `package.json` — `npm install qrcode.vue@^3.9.1 jsbarcode@^3.12.3`
- `src/types/wallecx/memberships/types.d.ts` — New file (new directory tree under `src/types/wallecx/`)
- `src/lib/pocketbase/membershipMapper.ts` — New file alongside existing mappers
- `components.d.ts` — Will auto-update when new Vue components are added (Phase 12+); no manual changes in Phase 11

### Collection Reference
- PocketBase collection name: `wallecx_memberships` (snake_case, matches backend convention)

</code_context>

<specifics>
## Specific Ideas

- The smoke test must cover all five access types: list, view, update, delete, and direct `card_image` file URL (without token) — all must return 403 or 404 for User B (same thoroughness as Phase 1 BACK-05).
- `barcode_type` is a **select field** in PocketBase with values `qr`, `code128`, `ean13`, `code39`, `number` — this differs from ROADMAP.md which says "text". The plan must document this decision and configure the select field with maxSelect:1.
- `expiry_date` is typed as `string` in the TypeScript interface (PocketBase dates are ISO strings), with `?` optional marker. Same pattern as `date_administered` but optional.
- `card_color` is typed as `string` (hex without `#`), optional — Zod in Phase 13 will validate `[0-9a-fA-F]{6}`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-backend-frontend-foundation*
*Context gathered: 2026-05-13*
