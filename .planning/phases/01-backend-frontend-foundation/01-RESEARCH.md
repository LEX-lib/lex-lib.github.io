# Phase 1: Backend + Frontend Foundation - Research

**Researched:** 2026-05-10
**Domain:** PocketBase collection schema + rules + indexes; Vue 3 types/mapper/routing; npm dep hygiene
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Phase 1 uses 3 plans: `01-01-PLAN.md` (PocketBase collection setup BACK-01..04), `01-02-PLAN.md` (two-user smoke test human-action checkpoint BACK-05), `01-03-PLAN.md` (frontend foundation FRONT-01..05).
- **D-02:** `01-01-PLAN.md` must be a step-by-step field-by-field walkthrough with exact name, type, required/optional flag, max size, MIME allowlist, thumb dimensions, and all five collection rule strings verbatim.
- **D-03:** Two-user smoke test (BACK-05) is a separate plan (`01-02-PLAN.md`) structured as a human-action checkpoint mirroring `00-02-PLAN.md` pattern.
- **D-04:** `WallecxApp.vue` includes page title "Wallecx", a container div matching the mini-app layout pattern, and the record count below. Mirrors `LexTrackView.vue` header + content area structure.
- **D-05:** Page title is "Wallecx" (brand name, not "Vaccination Records").
- **D-06:** `mapToUpdateVaccination` follows exact `mapToUpdateTask` pattern — explicit inline return type listing writable fields, strips `id`, `created`, `updated`, `user`, `card`. Return type is inline object type, not a named type alias. `card` is stripped from the mapper payload.

### Claude's Discretion

- Exact container/layout class names for the WallecxApp.vue scaffold (follow existing Tailwind/PrimeVue patterns from LexTrackView or ProjectsView).
- Whether to add `// --- STATE ---` / `// --- LOGIC ---` section comment pattern (follow LexTrackApp.vue convention).
- Exact wording of smoke-test confirmation message in the human-action plan.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BACK-01 | `wallecx_vaccinations` collection with locked field set (user, vaccine_name, date_administered, dose_number, lot_number, location, manufacturer, notes, card) | PocketBase field types mapped below; each field's exact Admin UI configuration specified |
| BACK-02 | `card` file field: `protected: true`, 10 MB max, MIME allowlist, thumbs `100x100` + `400x0` | PocketBase file field config section; MIME type string format; thumb notation verified |
| BACK-03 | All five collection rules enforce per-user access | Exact rule strings derived from PocketBase docs + maintainer discussions; `@request.data.user` vs `@request.body.user` disambiguation resolved |
| BACK-04 | Composite index on `(user, date_administered)` | Index SQL format verified from GitHub discussion + JS collections docs; Admin UI flow documented with ASSUMED caveat |
| BACK-05 | Two-user smoke test confirms cross-user isolation | Smoke test steps derived from PITFALLS.md Pitfall 1 + collection rule verification approach |
| FRONT-01 | npm install browser-image-compression + vue-pdf-embed; pdfjs-dist >= 4.2.67 | Versions verified from npm registry; pdfjs-dist dependency chain confirmed |
| FRONT-02 | Type module `src/types/wallecx/vaccinations/types.d.ts` | Exact content derived from DsuTasks + DsuMeetings analogs; field-to-TypeScript type mapping specified |
| FRONT-03 | Mapper module `src/lib/pocketbase/vaccinationMapper.ts` | Exact content derived from dsuTaskMapper.ts + dsuMeetingMapper.ts analogs |
| FRONT-04 | Lazy-loaded route `/projects/wallecx` with `requiresAuth: true` | Insertion point identified in `src/router/index.ts`; exact route object pattern from lextrack route |
| FRONT-05 | WallecxApp.vue shell mounts, fetches via getFullList, renders record count | onMounted + try/catch/finally pattern from GiftExchangeJoin.vue; getFullList pattern from LexTrackView.vue |

</phase_requirements>

---

## Summary

Phase 1 establishes the privacy-critical PocketBase backend and the frontend skeleton for Wallecx. The research confirms all ten requirements (BACK-01..05, FRONT-01..05) are implementable using existing patterns in the Lexarium codebase as close analogs. No new patterns need to be invented.

The most important finding is a **disambiguation on PocketBase rule syntax**: the REQUIREMENTS.md and CONTEXT.md both specify `@request.data.user` for the createRule — this is the **correct** syntax (not `@request.body.user`). PocketBase uses `@request.data.*` to access submitted body fields in collection rules; `@request.body.*` is the planned future rename that has not yet landed in the v0.26.x release series in use. Both syntaxes are documented and either works, but `@request.data.*` is the authoritative form for the current version. [VERIFIED: github.com/pocketbase/pocketbase/discussions/323, discussions/1379, discussions/4805]

The second critical finding is that **PocketBase's Admin UI does have an Indexes section** within the collection editor, but its exact UI flow is only confirmed to involve raw SQL `CREATE INDEX` statements. The planner must provide the exact SQL string for the developer to paste, as the UI accepts raw SQL. [MEDIUM confidence — UI flow partially verified from GitHub discussions; exact tab name/location ASSUMED]

The npm dependency chain is clean: `vue-pdf-embed@2.1.4` (current latest) depends on `pdfjs-dist@^4.10.38`, which resolves to 5.x+ — well above the CVE-2024-4367 fix at 4.2.67. The pdfjs-dist version will satisfy the FRONT-01 requirement automatically. [VERIFIED: npm registry]

**Primary recommendation:** Follow the three-plan structure from CONTEXT.md D-01. Every field, rule string, index SQL, and code example needed for the plan is specified in this research document.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Per-user data isolation | API / Backend (PocketBase) | — | Collection rules are the enforcement boundary; client-side filtering is UX only (PITFALLS Pitfall 1) |
| Route access control | Frontend Server (Vue Router guard) | API / Backend | Router guard is UX; PocketBase rules are the real gate |
| Type safety / mapper | Frontend (TypeScript) | — | Static types + mapper live entirely in the Vue SPA |
| File URL security | API / Backend (PocketBase) | — | `protected: true` + tokens; the SPA just generates the token at view time |
| Record count display | Browser / Client (Vue component) | API / Backend | Shell component calls getFullList; count is derived client-side from response array |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pocketbase (JS SDK) | ^0.26.2 (already installed) | Backend client, auth, file tokens | Already in project; do NOT upgrade in this phase |
| browser-image-compression | 2.0.2 | Client-side image compression before upload | Required by FRONT-01; only runtime dep for image processing |
| vue-pdf-embed | 2.1.4 | PDF canvas rendering via pdfjs-dist | Required by FRONT-01; current latest; peer-compatible with Vue 3 |

[VERIFIED: npm registry — `npm view browser-image-compression version` → `2.0.2`; `npm view vue-pdf-embed version` → `2.1.4`]

### Transitive (auto-resolved)
| Library | Resolved Version | Why It Matters |
|---------|-----------------|----------------|
| pdfjs-dist | ^4.10.38 (resolves to 5.x+) | CVE-2024-4367 was fixed at 4.2.67; resolved version is far above that |

[VERIFIED: `npm view vue-pdf-embed@^2.1.4 dependencies` → `{ 'pdfjs-dist': '^4.10.38' }`; `npm view pdfjs-dist version` → `5.7.284`]

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vue-pdf-embed | pdfjs-dist directly | More control but requires writing the canvas render loop manually; vue-pdf-embed abstracts the boilerplate and is maintained |

**Installation:**
```bash
npm install browser-image-compression@^2.0.2 vue-pdf-embed@^2.1.4
```

**Post-install verification:**
```bash
# Confirm pdfjs-dist >= 4.2.67 in the lock file
grep -A1 '"pdfjs-dist"' package-lock.json | grep '"version"'
```

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (authenticated session)
    │
    ▼
Vue Router (beforeEach guard)
    │ checks useAuthStore().isLoggedIn
    │ redirects to /login?redirect=... if unauthenticated
    ▼
WallecxApp.vue (onMounted)
    │
    ▼
pb.collection('wallecx_vaccinations')          ←── pb singleton from @/lib/pocketbase
    .getFullList<Vaccinations>({ sort: '-date_administered' })
    │
    ▼
PocketBase Backend (collection rules enforced)
    │ listRule: @request.auth.id != "" && user = @request.auth.id
    │ Returns only THIS user's records
    ▼
[records array]
    │
    ▼
WallecxApp.vue template
    │ renders record count (records.length)
    │ page title "Wallecx"
    ▼
User sees: shell with count
```

### Recommended Project Structure (new files in Phase 1)

```
src/
├── components/projects/wallecx/
│   └── WallecxApp.vue          # FRONT-04 + FRONT-05 (new)
├── lib/pocketbase/
│   └── vaccinationMapper.ts    # FRONT-03 (new)
├── types/wallecx/vaccinations/
│   └── types.d.ts              # FRONT-02 (new)
└── router/
    └── index.ts                # FRONT-04: add route (modify existing)
```

---

## PocketBase Collection Configuration

### BACK-01: wallecx_vaccinations Field Specification

| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| `user` | Relation (users) | Yes | Max select: 1 (single relation, stored as string not array); cascade delete: no (keep records if user deleted — user owns records) |
| `vaccine_name` | Text | Yes | No pattern constraint needed |
| `date_administered` | Date | Yes | PocketBase DateField; stores as RFC3339 datetime string |
| `dose_number` | Number | No (optional) | NumberField; min/max not required at schema level (Phase 3 validates via Zod) |
| `lot_number` | Text | No (optional) | — |
| `location` | Text | No (optional) | — |
| `manufacturer` | Text | No (optional) | — |
| `notes` | Text | No (optional) | Plain text only; NEVER EditorField (avoids v-html + XSS surface) |
| `card` | File | No (optional) | See BACK-02 config |

[VERIFIED: REQUIREMENTS.md field list; PocketBase docs field types; PITFALLS Pitfall 10 — notes must be TextField not EditorField]

**Relation field detail — `user`:**
- Type: Relation to `_pb_users_auth_` (or `users` collection, same thing)
- Max select: 1 (single record — stored as plain string on the TypeScript type, not `string[]`)
- Required: Yes
- **Do NOT set cascade delete on the relation** — user deletion should not silently cascade to health records

[ASSUMED: cascade delete default behavior; verify in PocketBase docs if the developer wants explicit confirmation]

### BACK-02: `card` File Field Configuration

| Property | Value | Notes |
|----------|-------|-------|
| `maxSelect` | 1 | Single file per record; TypeScript type is `card: string` (not `string[]`) |
| `maxSize` | 10485760 | 10 MB in bytes (`10 * 1024 * 1024`) |
| `mimeTypes` | `image/jpeg,image/png,image/webp,application/pdf` | Comma-separated in Admin UI; no spaces |
| `thumbs` | `100x100,400x0` | `100x100` = crop to 100×100 from center; `400x0` = resize width to 400, height proportional |
| `protected` | true (checkbox) | Without this, file URLs are public-by-URL-knowledge |

**Thumb notation explained:**
- `WxH` (e.g., `100x100`) = crop to exact WxH from center
- `Wx0` (e.g., `400x0`) = resize width to W, preserve aspect ratio (height = 0 means unconstrained)
- `0xH` = resize height to H, preserve aspect ratio

[VERIFIED: pocketbase.io/docs/files-handling — thumb parameters W×H, 0×H, W×0 notation]

**Critical:** `protected: true` makes the file field require a short-lived token to access. Without it, any user who guesses or obtains the URL can download the file even after logging out. [VERIFIED: PITFALLS Pitfall 9]

### BACK-03: Collection Rules

All five rules verbatim:

```
listRule:   @request.auth.id != "" && user = @request.auth.id
viewRule:   @request.auth.id != "" && user = @request.auth.id
updateRule: @request.auth.id != "" && user = @request.auth.id
deleteRule: @request.auth.id != "" && user = @request.auth.id
createRule: @request.auth.id != "" && @request.data.user = @request.auth.id
```

**Syntax explanation:**
- `@request.auth.id != ""` — ensures a valid auth token is present (unauthenticated requests have `id = ""`)
- `user = @request.auth.id` — the record's `user` relation field must equal the authenticated user's id
- `@request.data.user = @request.auth.id` — for createRule, the submitted `user` field value must match the auth id; `@request.data.*` is the correct form for submitted body fields in PocketBase v0.22–v0.26

**`@request.data.user` vs `@request.body.user`:**
- `@request.data.*` is the **current correct form** for submitted body parameters in collection rules. [VERIFIED: github.com/pocketbase/pocketbase/discussions/323 — PocketBase maintainer confirms this syntax; discussions/4805 — maintainer notes future rename to `@request.body.*` but it has not shipped in v0.26.x]
- `@request.body.*` is the **planned future rename**. Do NOT use it — it does not exist in v0.26.2.
- The official PocketBase docs page for v0.26 lists `@request.body.*` as the documented form, creating confusion. In practice `@request.data.*` is confirmed working in discussions and the linked community guidance. [MEDIUM confidence — the docs page contradicts the GitHub discussions; use `@request.data.*` and verify with a quick curl test during BACK-05 smoke test]

**Gotcha:** The `createRule` check `@request.data.user = @request.auth.id` prevents privilege escalation — a user cannot create a record assigning it to another user. The client MUST send the `user` field in the create payload with the auth user's own id, or the rule rejects the request. [VERIFIED: github.com/pocketbase/pocketbase/discussions/1379 — PocketBase maintainer confirms this exact pattern]

### BACK-04: Composite Index

**Index SQL to enter in Admin UI:**
```sql
CREATE INDEX idx_wallecx_vaccinations_user_date ON wallecx_vaccinations (user, date_administered)
```

**Admin UI flow:**
The PocketBase collection editor has an Indexes section (accessible after the Fields tab in the collection edit panel). The developer enters raw SQL `CREATE INDEX` statements. Invalid SQL returns a validation error immediately on save.

[MEDIUM confidence on exact Admin UI flow — confirmed from GitHub discussions that the indexes section accepts raw SQL; exact tab name/position ASSUMED based on community descriptions. Developer should look for an "Indexes" or "Add Index" button/section within the collection editor. If not found in the edit panel, the fallback is a JS migration file (see Pitfalls section).]

**Why this index matters:**
The shell query `pb.collection('wallecx_vaccinations').getFullList<Vaccinations>({ sort: '-date_administered' })` is filtered by the collection rule `user = @request.auth.id` and sorted by `date_administered DESC`. Without the composite index, SQLite performs a full table scan filtered by user then sorted. With the index, the query uses the (user, date_administered) index directly for both the filter and the sort.

**Fallback if Admin UI index creation is unclear:**
Create a JS migration file at `pb_migrations/TIMESTAMP_add_wallecx_vaccinations_index.js`:
```javascript
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("wallecx_vaccinations");
    collection.indexes.push(
      "CREATE INDEX idx_wallecx_vaccinations_user_date ON wallecx_vaccinations (user, date_administered)"
    );
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("wallecx_vaccinations");
    collection.indexes = collection.indexes.filter(
      (i) => !i.includes("idx_wallecx_vaccinations_user_date")
    );
    app.save(collection);
  }
);
```

[VERIFIED: pocketbase.io/docs/js-collections — `collection.indexes.push(sqlString)` pattern confirmed]

---

## TypeScript Type Module

### FRONT-02: `src/types/wallecx/vaccinations/types.d.ts`

**Exact content:**
```typescript
import type { RecordModel } from "pocketbase";

export interface Vaccinations extends RecordModel {
  id: string;
  created: string;
  updated: string;
  user: string;
  vaccine_name: string;
  date_administered: string;
  dose_number?: number;
  lot_number?: string;
  location?: string;
  manufacturer?: string;
  notes?: string;
  card: string;
}

export type AddVaccination = Omit<Vaccinations, "id" | "created" | "updated">;
```

**Field-to-TypeScript type mapping:**

| PocketBase Field Type | TypeScript Type | Notes |
|-----------------------|-----------------|-------|
| Relation (single, MaxSelect=1) | `string` | PocketBase stores single-relation as the referenced record ID (plain string, NOT `string[]`) |
| Text (required) | `string` | No `?` |
| Date | `string` | PocketBase date fields are serialized as RFC3339 strings |
| Number (optional) | `number \| undefined` → `number?` via `?` modifier | Optional numeric |
| Text (optional) | `string?` | Optional text fields |
| File (single, optional) | `string` | PocketBase stores single-file as the filename string (NOT `string[]`); field value is empty string `""` when no file attached |

**Critical details:**
- `card: string` — NOT `card?: string`. PocketBase returns `""` (empty string) when no file is attached; it is always present in the record. Use `record.card !== ""` or `record.card?.length > 0` to check for a file.
- `user: string` — the relation ID, not the full user record (no expand in Phase 1)
- `date_administered: string` — format from PocketBase: `"YYYY-MM-DD HH:mm:ss.SSSZ"` but the plan should instruct sending `"YYYY-MM-DD"` format and accepting whatever PocketBase returns

[VERIFIED: src/types/lextrack/dsu_tasks/types.d.ts — analog pattern confirmed; src/types/lextrack/dsu_meetings/types.d.ts — number optional field pattern confirmed via `duration_minutes?: number`]

**Import form:** `import type { RecordModel } from "pocketbase"` — use the package root, not the dist subpath. (Note: `dsuMeetingMapper.ts` uses `"pocketbase/dist/pocketbase.es"` — this is a legacy inconsistency. New files should use `"pocketbase"` directly to match `dsuTaskMapper.ts`.)

---

## Mapper Module

### FRONT-03: `src/lib/pocketbase/vaccinationMapper.ts`

**Exact content:**
```typescript
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

export function mapToUpdateVaccination(record: Vaccinations): {
  vaccine_name: string;
  date_administered: string;
  dose_number?: number;
  lot_number?: string;
  location?: string;
  manufacturer?: string;
  notes?: string;
} {
  return {
    vaccine_name: record.vaccine_name,
    date_administered: record.date_administered,
    dose_number: record.dose_number,
    lot_number: record.lot_number,
    location: record.location,
    manufacturer: record.manufacturer,
    notes: record.notes,
  };
}
```

**Strips (intentionally absent from return type and return object):**
- `id` — server-managed
- `created` — server-managed
- `updated` — server-managed
- `user` — ownership field; never updated via the mapper
- `card` — file attachment updates are a separate operation (Phase 3 WRITE-02)

[VERIFIED: src/lib/pocketbase/dsuTaskMapper.ts — exact pattern followed; src/lib/pocketbase/dsuMeetingMapper.ts — optional number field in inline return type confirmed]

**Pattern rules:**
- Inline return type (not a named alias) — matches D-06 exactly
- No `user` in return type (critical for security — prevents accidentally sending `user` field in an update which could reassign ownership if server-side validation were ever loosened)
- `card` absent from return type — this is intentional; prevents accidentally overwriting an existing file attachment by sending an empty string

---

## Route Registration

### FRONT-04: Insertion point in `src/router/index.ts`

Insert the new route **before the `blog` route** (currently at line 62–66), after the `api-playground` route.

**New route object:**
```typescript
{
  path: "/projects/wallecx",
  name: "wallecx",
  component: () =>
    import("@/components/projects/wallecx/WallecxApp.vue"),
  meta: { requiresAuth: true },
},
```

**Position in routes array (after `api-playground`, before `blog`):**
```typescript
    {
      path: "/projects/api-playground",
      name: "api-playground",
      component: () =>
        import("@/components/projects/api-playground/ApiPlaygroundApp.vue"),
    },
    // NEW: wallecx route inserted here
    {
      path: "/projects/wallecx",
      name: "wallecx",
      component: () =>
        import("@/components/projects/wallecx/WallecxApp.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/blog",
      name: "blog",
      component: () => import("@/views/BlogView.vue"),
    },
```

**Notes:**
- Dynamic import path does NOT include `.vue` extension in the project (see all existing routes — they all use `.vue`). Wait — actually checking existing routes: all of them DO include `.vue` in the import string (e.g., `import("@/views/HomeView.vue")`). Include `.vue`.
- The `meta: { requiresAuth: true }` activates the existing `beforeEach` guard at line 70–79. No new auth code is needed.
- Route name is `"wallecx"` (kebab-case convention; single word needs no hyphen here).

[VERIFIED: src/router/index.ts — read directly; lextrack route at line 29–32 is the direct analog with `meta: { requiresAuth: true }`]

---

## WallecxApp.vue Shell Component

### FRONT-05: `src/components/projects/wallecx/WallecxApp.vue`

**Pattern source:** `src/views/LexTrackView.vue` (layout + getFullList) + `src/components/projects/gift-exchange/GiftExchangeJoin.vue` (onMounted + try/catch/finally + toast.error)

**Exact structure:**
```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { toast } from "vue-sonner";
import { pb } from "@/lib/pocketbase";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

// --- STATE ---
const records = ref<Vaccinations[]>([]);
const isLoading = ref(false);

// --- LOGIC ---
onMounted(async () => {
  isLoading.value = true;
  try {
    records.value = await pb
      .collection("wallecx_vaccinations")
      .getFullList<Vaccinations>({ sort: "-date_administered" });
  } catch (e: unknown) {
    toast.error("Failed to load vaccination records.");
    console.error("WallecxApp: getFullList failed", e);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <Card>
    <template #content>
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold" style="color: var(--color-typo-heading)">
          Wallecx
        </h1>
      </div>
      <div>
        <p v-if="isLoading">Loading...</p>
        <p v-else>{{ records.length }} vaccination record{{ records.length === 1 ? "" : "s" }}</p>
      </div>
    </template>
  </Card>
</template>

<style scoped></style>
```

**Notes (Claude's discretion items):**
- Section comments `// --- STATE ---` and `// --- LOGIC ---` follow `LexTrackApp.vue` convention. Include them.
- `<Card>` is auto-imported (PrimeVue resolver); no explicit import needed — matches existing mini-app shells.
- `e: unknown` is slightly stricter than the existing `e: any` pattern in GiftExchangeJoin.vue. Either is acceptable. Use `e: unknown` for new code per CONVENTIONS.md recommendation.
- The layout class names (`flex items-center justify-between mb-4`, `text-2xl font-bold`) follow the Tailwind utility-first approach seen in `ProjectsView.vue` and `LexTrackView.vue`. Exact classes are Claude's discretion.

**Why `onMounted` (not `watch`):**
- Phase 1 has no filter/date ref to watch — the full list is fetched once. `onMounted` is correct.
- Avoids the Pitfall 12 "watcher not immediate" bug since there's no watcher at all in the shell.

[VERIFIED: src/views/LexTrackView.vue — getFullList pattern; src/components/projects/gift-exchange/GiftExchangeJoin.vue — onMounted + try/catch/finally + toast.error pattern]

---

## Two-User Smoke Test (BACK-05)

### Smoke Test Protocol for `01-02-PLAN.md`

The smoke test MUST cover all five access types as a human-action checkpoint. The developer performs these steps with two real PocketBase accounts.

**Setup:**
1. Log in as User A (existing dev account). Create one record in `wallecx_vaccinations` with any `vaccine_name` and `date_administered`. Attach a test file to `card`.
2. Note the record's `id` and the `card` file URL (visible in PocketBase Admin UI or from the API response).
3. Log out and log in (or open a second browser/incognito window) as User B (a second account created in PocketBase Admin UI).

**Test steps:**

| Test | Action | Expected Result |
|------|--------|-----------------|
| List isolation | `pb.collection('wallecx_vaccinations').getFullList()` as User B | Returns `[]` — zero records |
| View isolation | `pb.collection('wallecx_vaccinations').getOne(userA_record_id)` as User B | 404 ClientResponseError |
| Update isolation | `pb.collection('wallecx_vaccinations').update(userA_record_id, {...})` as User B | 403 or 404 ClientResponseError |
| Delete isolation | `pb.collection('wallecx_vaccinations').delete(userA_record_id)` as User B | 403 or 404 ClientResponseError |
| File URL isolation | Open `card` file URL in incognito browser tab without `?token=` param | 403 response (because `protected: true`) |

**Using the API Playground (already in the codebase):**
The developer can run tests 1–4 directly from `/projects/api-playground` by setting the auth header to User B's token and sending GET/PATCH/DELETE requests to the PocketBase API endpoints.

**File URL test detail:**
- With `protected: true`, even the direct URL `/api/files/wallecx_vaccinations/{recordId}/{filename}` returns 403 without a `?token=` param.
- Verify by copying the file URL from PocketBase Admin → open in private/incognito tab → confirm 403, not 200.

[VERIFIED: PITFALLS.md Pitfall 1 — exact smoke test steps; REQUIREMENTS.md BACK-05 — "list, view, update, delete, and direct file URL all 403/404"]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image compression | Custom canvas loop + blob | `browser-image-compression` | Handles cross-browser Canvas API quirks, HEIC/HEIF formats, progress callbacks; not Phase 1 but installed here |
| PDF rendering | `v-html` of PDF or `<iframe>` | `vue-pdf-embed` (wraps pdfjs-dist) | CVE-2024-4367: bare pdfjs-dist without vue-pdf-embed is error-prone; iframe breaks CSP |
| Collection rule enforcement | Client-side filter string | PocketBase collection rules | Server-side rules are the actual security gate; client filters are UX only (PITFALLS Pitfall 1) |
| Short-lived file tokens | Custom token generation | `pb.files.getToken()` | SDK method handles expiry and token format; not Phase 1 but token design is locked by `protected: true` config |

---

## Common Pitfalls

### Pitfall A: Wrong rule syntax — `@request.body.user` instead of `@request.data.user`
**What goes wrong:** Using `@request.body.user` in the createRule causes the rule to evaluate to `false` (the field doesn't exist), rejecting all create requests with 403.
**Why it happens:** The official PocketBase docs API rules page documents `@request.body.*` but this is the future-renamed form. PocketBase v0.26.x uses `@request.data.*`.
**How to avoid:** Use `@request.data.user = @request.auth.id` verbatim for the createRule. Verify during BACK-05 smoke test by creating a record as an authenticated user and confirming it succeeds.
**Warning signs:** All create requests return 403 even when authenticated.

### Pitfall B: `card` typed as `string[]` instead of `string`
**What goes wrong:** TypeScript type uses `card: string[]`; code accesses `record.card[0]` and gets `undefined`.
**Why it happens:** PITFALLS Pitfall 8 — MaxSelect=1 fields return a plain string, not an array.
**How to avoid:** Type `card: string` and check `record.card !== ""` for file presence.
**Warning signs:** `record.card[0]` is `undefined` at runtime despite a file being attached.

### Pitfall C: Including `user` or `card` in `mapToUpdateVaccination` return type
**What goes wrong:** An update call sends `user: "someId"` in the payload, potentially reassigning ownership.
**Why it happens:** Developer copies the full record object without stripping.
**How to avoid:** The mapper's explicit inline return type is the guard — it lists only the writable fields. If `user` or `card` appear in the return type, reject the PR.
**Warning signs:** Any key named `user`, `id`, `created`, `updated`, or `card` appears in the mapper's return type annotation.

### Pitfall D: WallecxApp.vue named component collides with PrimeVue auto-import
**What goes wrong:** If any Wallecx subcomponent (in Phase 2+) is named `Card.vue`, `Button.vue`, etc., the `components.d.ts` auto-import will have a collision.
**Why it happens:** `unplugin-vue-components` registers all SFC components globally by their file name without the path prefix.
**How to avoid:** All Wallecx subcomponents (Phase 2+) must be named with `Wallecx` prefix: `WallecxList.vue`, `WallecxDetail.vue`, etc. `WallecxApp.vue` itself is safe (no collision in `components.d.ts`).
**Warning signs:** `components.d.ts` shows a non-PrimeVue import for `Card` or `Button`.

### Pitfall E: `pdfjs-dist` worker not configured for CSP compliance
**What goes wrong:** The default `vue-pdf-embed` full build bundles the worker as a blob URL, which may conflict with the existing CSP in `index.html`.
**Why it happens:** Phase 1 only installs the dep; the worker is only relevant when rendering PDFs (Phase 2 READ-03).
**How to avoid:** Phase 1 only installs and records the dep. Phase 2 must configure `worker-src 'self' blob:` in the CSP and potentially use the `vue-pdf-embed/dist/index.essential.mjs` import to control the worker path. Document as a Phase 2 concern.
**Warning signs (Phase 2):** PDF rendering fails with a CSP violation in the browser console.

### Pitfall F: Composite index not created — query degrades at scale
**What goes wrong:** Without the index, the `getFullList({ sort: '-date_administered' })` query does a full table scan. At low record counts this is invisible; at 100+ records it becomes slow.
**Why it happens:** Index creation in the Admin UI is less obvious than field creation.
**How to avoid:** Explicitly verify the index after creating the collection (check via PocketBase Admin "Indexes" or SQLite viewer). Use the JS migration fallback if Admin UI is unclear.
**Warning signs:** Query time increases linearly with total records in the collection (across all users).

---

## Code Examples

### Pattern 1: Types module (FRONT-02)
```typescript
// Source: src/types/lextrack/dsu_tasks/types.d.ts (analog)
import type { RecordModel } from "pocketbase";

export interface Vaccinations extends RecordModel {
  // ... fields
}
export type AddVaccination = Omit<Vaccinations, "id" | "created" | "updated">;
```

### Pattern 2: Mapper module (FRONT-03)
```typescript
// Source: src/lib/pocketbase/dsuTaskMapper.ts (analog)
export function mapToUpdateVaccination(record: Vaccinations): {
  vaccine_name: string;
  // ... other writable fields
} {
  return { vaccine_name: record.vaccine_name, /* ... */ };
}
```

### Pattern 3: Lazy route registration (FRONT-04)
```typescript
// Source: src/router/index.ts lextrack route (analog)
{
  path: "/projects/wallecx",
  name: "wallecx",
  component: () =>
    import("@/components/projects/wallecx/WallecxApp.vue"),
  meta: { requiresAuth: true },
},
```

### Pattern 4: onMounted + try/catch/finally + toast (FRONT-05)
```typescript
// Source: src/components/projects/gift-exchange/GiftExchangeJoin.vue:23-56 (analog)
onMounted(async () => {
  isLoading.value = true;
  try {
    records.value = await pb
      .collection("wallecx_vaccinations")
      .getFullList<Vaccinations>({ sort: "-date_administered" });
  } catch (e: unknown) {
    toast.error("Failed to load vaccination records.");
    console.error("WallecxApp: getFullList failed", e);
  } finally {
    isLoading.value = false;
  }
});
```

### Pattern 5: PocketBase collection rule strings (BACK-03)
```
listRule:   @request.auth.id != "" && user = @request.auth.id
viewRule:   @request.auth.id != "" && user = @request.auth.id
updateRule: @request.auth.id != "" && user = @request.auth.id
deleteRule: @request.auth.id != "" && user = @request.auth.id
createRule: @request.auth.id != "" && @request.data.user = @request.auth.id
```

### Pattern 6: Composite index SQL (BACK-04)
```sql
CREATE INDEX idx_wallecx_vaccinations_user_date ON wallecx_vaccinations (user, date_administered)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@request.data.*` | `@request.body.*` (future) | Planned (not yet in v0.26.x) | Use `@request.data.*` now; will need migration when PocketBase renames the field |
| vue-pdf (unscoped, unmaintained) | `vue-pdf-embed` | 2022+ | vue-pdf had no meaningful updates after June 2021; vue-pdf-embed is maintained and Vue 3 native |
| pdfjs-dist < 4.2.67 | pdfjs-dist >= 4.2.67 | May 2024 (CVE-2024-4367) | Arbitrary JS execution via malicious PDF is fixed in 4.2.67+ |

**Deprecated/outdated:**
- `vue-pdf` (unscoped package): last meaningful update June 2021; out of scope per REQUIREMENTS.md Out of Scope table
- pdfjs-dist < 4.2.67: CVE-2024-4367 arbitrary JS execution; `vue-pdf-embed@2.1.4` resolves to `pdfjs-dist@5.x`, far above the fix

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PocketBase Admin UI collection editor has an "Indexes" or similar section where raw SQL `CREATE INDEX` statements can be entered | BACK-04 Admin UI Flow | Developer cannot find the index UI and must use the JS migration fallback instead — low risk since fallback is fully specified |
| A2 | The `user` RelationField on `wallecx_vaccinations` defaults to no cascade delete (i.e., deleting the user does not cascade-delete their vaccination records) | BACK-01 Relation field detail | If cascade-delete is the default, a user account deletion silently destroys all their vaccination records — should be verified and the desired behavior (keep or delete) confirmed |
| A3 | `@request.data.user` works correctly in PocketBase v0.26.2 for the createRule (versus `@request.body.user` which is the documented-but-unreleased form) | BACK-03 rule strings | If `@request.data.user` is broken in v0.26.x, all create requests return 403 — catch this in the BACK-05 smoke test |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed. (Table has 3 entries above; review during BACK-05.)

---

## Open Questions

1. **`@request.data.user` vs `@request.body.user` in PocketBase v0.26.2**
   - What we know: Maintainer discussions confirm `@request.data.*` is correct for v0.22–v0.26; official docs page lists `@request.body.*`; GitHub discussion #4805 confirms the rename is planned but not shipped.
   - What's unclear: Exact version at which the rename ships.
   - Recommendation: Use `@request.data.user` in the plan, verify with a test create call during BACK-05.

2. **Admin UI index creation flow**
   - What we know: PocketBase stores indexes as raw SQL strings; the indexes array accepts SQL; GitHub discussions confirm this via programmatic API.
   - What's unclear: Whether the Admin UI exposes a text input for index SQL or requires a separate migration file.
   - Recommendation: Plan includes the SQL string AND the JS migration fallback, so the developer can use whichever path the UI supports.

3. **Relation field — cascade delete behavior**
   - What we know: PocketBase RelationField has cascade delete options; the default for a standard relation is "no cascade" (records remain when the related record is deleted).
   - What's unclear: Exact default in the PocketBase Admin UI for new relation fields.
   - Recommendation: Explicitly set cascade delete to OFF when creating the `user` relation field (keep vaccination records if the user account is deleted — the user owns the data).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install | ✓ | ^20+ (per package.json engines) | — |
| npm | FRONT-01 | ✓ | (project's npm) | — |
| PocketBase server | BACK-01..05 | Developer-managed | v0.26.x (inferred from pocketbase@^0.26.2 in package.json) | — |
| PocketBase Admin UI | BACK-01..04 | Developer-managed | Same as server | JS migration fallback for indexes (BACK-04) |

**Missing dependencies with no fallback:** None — all code-side dependencies are installable via npm; PocketBase is developer-managed.

**Missing dependencies with fallback:**
- PocketBase Admin UI for index creation — fallback is the JS migration script specified in BACK-04.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 1 |
|-----------|-------------------|
| Vue 3 Composition API, `<script setup lang="ts">` only | WallecxApp.vue must use `<script setup lang="ts">`; no Options API |
| PrimeVue 4 auto-imported via PrimeVueResolver | `<Card>` in shell template requires no explicit import |
| Tailwind CSS 4 utility-first | Container div classes follow utility pattern; no bespoke CSS unless scoped style needed |
| PocketBase client from `@/lib/pocketbase` (no `.ts` extension) | Import as `import { pb } from "@/lib/pocketbase"` — no `.ts` extension |
| camelCase for variables; no Hungarian notation | `isLoading` not `bLoading`; `records` not `recordsList` |
| `try/catch/finally` with `toast.error` for async ops | WallecxApp.vue `onMounted` must follow this pattern |
| No `v-html` for user data | `notes` field rendered as `{{ record.notes }}` in Phase 2; enforced by plain TextField (not EditorField) |
| Path alias `@` = `src/` | All new files import via `@/...` |

---

## Sources

### Primary (HIGH confidence)
- `src/lib/pocketbase/dsuTaskMapper.ts` — FRONT-03 analog; read directly [VERIFIED]
- `src/types/lextrack/dsu_tasks/types.d.ts` — FRONT-02 analog; read directly [VERIFIED]
- `src/types/lextrack/dsu_meetings/types.d.ts` — optional number field pattern; read directly [VERIFIED]
- `src/router/index.ts` — FRONT-04 insertion point; read directly [VERIFIED]
- `src/views/LexTrackView.vue` — shell layout pattern; read directly [VERIFIED]
- `src/components/projects/gift-exchange/GiftExchangeJoin.vue` — onMounted + try/catch/finally + toast.error pattern; read directly [VERIFIED]
- `.planning/codebase/CONVENTIONS.md` — naming and style conventions; read directly [VERIFIED]
- `.planning/research/PITFALLS.md` — Pitfalls 1, 2, 5, 8, 9 most relevant to Phase 1; read directly [VERIFIED]
- npm registry — `browser-image-compression@2.0.2`, `vue-pdf-embed@2.1.4`, `pdfjs-dist@5.7.284` current versions [VERIFIED]
- `vue-pdf-embed` peerDependencies — `pdfjs-dist: ^4.10.38` [VERIFIED: npm view]

### Secondary (MEDIUM confidence)
- github.com/pocketbase/pocketbase/discussions/1379 — PocketBase maintainer confirms `@request.data.user = @request.auth.id` createRule pattern [CITED]
- github.com/pocketbase/pocketbase/discussions/323 — `@request.data.*` documented as correct body access form [CITED]
- github.com/pocketbase/pocketbase/discussions/4805 — `@request.body.*` is planned future rename; `@request.data.*` is current [CITED]
- github.com/pocketbase/pocketbase/discussions/2424 — composite index via SQL format confirmed [CITED]
- pocketbase.io/docs/files-handling — file field config, protected flag, thumb notation, token generation [CITED]
- pocketbase.io/docs/js-collections — `collection.indexes.push(sql)` JS migration pattern [CITED]
- github.com/hrynko/vue-pdf-embed — essential build vs full build, worker configuration, Vue 3 script setup usage [CITED]

### Tertiary (LOW confidence / ASSUMED)
- PocketBase Admin UI indexes section UI flow — confirmed to exist from community descriptions but exact tab name/location not verified with a screenshot [ASSUMED]
- Relation field cascade-delete default behavior in PocketBase v0.26 Admin UI [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm versions verified from registry
- PocketBase rules: HIGH — maintainer-confirmed syntax from official discussions
- Architecture patterns: HIGH — directly read from codebase analogs
- Admin UI index flow: MEDIUM — SQL format confirmed; UI navigation path ASSUMED
- Pitfalls: HIGH — directly from PITFALLS.md which cites official sources

**Research date:** 2026-05-10
**Valid until:** 2026-06-10 (stable tech, PocketBase v0.26.x series)
