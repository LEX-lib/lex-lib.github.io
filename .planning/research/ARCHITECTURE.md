# Architecture Research

**Domain:** Wallecx mini-app inside existing Lexarium SPA — Phase 1 = vaccination records vault
**Researched:** 2026-05-10
**Confidence:** HIGH (constrained almost entirely by directly-observed Lexarium conventions in `.planning/codebase/` and the LexTrack reference implementation)

## Standard Architecture

Wallecx is a thin **feature slice** layered onto the existing Lexarium SPA. No new architectural primitives are introduced — every box below already exists for LexTrack and is being mirrored.

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Routing / Auth Layer                         │
│  src/router/index.ts  ──────  beforeEach(requiresAuth) guard         │
│        │                                                             │
│        ▼ (lazy import)                                               │
├─────────────────────────────────────────────────────────────────────┤
│                          Mini-App Layer                              │
│   src/components/projects/wallecx/                                   │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                     WallecxApp.vue                          │   │
│   │  (route component — owns selectedRecord / dialog state)    │   │
│   │                                                             │   │
│   │  ┌──────────────────────┐  ┌────────────────────────────┐  │   │
│   │  │  VaccinationList     │  │  ManageVaccination (Dialog)│  │   │
│   │  │  (table / cards)     │  │  - Form fields + file slot │  │   │
│   │  └──────────┬───────────┘  └────────────┬───────────────┘  │   │
│   │             │ row click                  │ save / delete    │   │
│   │             ▼                            ▼                  │   │
│   │  ┌──────────────────────────────────────────────────────┐  │   │
│   │  │   VaccinationDetail (Dialog or panel)                │  │   │
│   │  │   - All fields read-only + AttachmentPreview         │  │   │
│   │  └──────────────────────────────────────────────────────┘  │   │
│   │                                                             │   │
│   │  ┌──────────────────────────────────────────────────────┐  │   │
│   │  │   AttachmentPreview (image OR PDF, dual rendering)   │  │   │
│   │  └──────────────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│        │                                                             │
├────────┼────────────────────────────────────────────────────────────┤
│        ▼                                                             │
│                       Backend Client Layer                           │
│   src/lib/pocketbase/index.ts (singleton `pb`)                       │
│   src/lib/pocketbase/vaccinationMapper.ts (mapToUpdateVaccination)   │
├─────────────────────────────────────────────────────────────────────┤
│                            Type Layer                                │
│   src/types/wallecx/vaccinations/types.d.ts                          │
│      Vaccinations extends RecordModel  +  AddVaccination             │
├─────────────────────────────────────────────────────────────────────┤
│                       PocketBase (server-side)                       │
│   collection: wallecx_vaccinations                                   │
│   - per-user rules: @request.auth.id != "" && user = @request.auth.id│
│   - file field: card (single, image|PDF)                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `WallecxApp.vue` | Mini-app root, owns `records` ref, dialog visibility, `selectedRecord`, calls `pb.collection('wallecx_vaccinations').getFullList<Vaccinations>()` on mount. Mirrors `LexTrackView.vue`'s role. | `<script setup lang="ts">`, `ref` + `onMounted`, no Pinia store needed. |
| `VaccinationList.vue` | Renders user's records sorted by `date_administered` desc. Emits `view`, `edit`, `remove`. Mirrors `ActivityCard.vue`. | PrimeVue `<DataTable>` or card grid, `defineEmits<{ view: [id: string]; edit: [id: string]; remove: [id: string] }>()`. |
| `ManageVaccination.vue` | Create / edit dialog with form (`vaccine_name`, `date_administered`, `dose_number`, `lot_number`, `location`, `card` file). Validates with Zod via `@primevue/forms`. | `<Dialog v-model:visible>` + `<Form :resolver="zodResolver(...)">`, mirrors `ManageTask.vue`. |
| `VaccinationDetail.vue` | Read-only view: all fields + embedded `AttachmentPreview`. | `<Dialog>` or inline panel; PrimeVue `<Card>` body. |
| `AttachmentPreview.vue` | Given a `Vaccinations` record + filename, builds preview URL via `pb.files.getURL(record, record.card)` and renders `<img>` for images, `<iframe>` (or download link) for PDF based on MIME/extension sniff. | `computed(() => isPdf ? ... : ...)`, no PocketBase calls of its own. |
| `vaccinationMapper.ts` | `mapToUpdateVaccination(record)` strips `id`, `created`, `updated`, `user`, `card` (file replacement is a separate `FormData` flow) before `update`. | Pure function returning a plain object — exact shape of `dsuTaskMapper.ts`. |
| `types.d.ts` | `Vaccinations extends RecordModel` + `AddVaccination = Omit<...>`. | Mirrors `dsu_tasks/types.d.ts`. |

**Why no Pinia store:** LexTrack — the closest analog and a more complex CRUD surface — holds all its state in `LexTrackView.vue` with plain `ref`. Adding a `useWallecxStore` would diverge from the existing pattern without paying for itself in v1. Auth is the only cross-cutting state, and `useAuthStore` already covers it.

## Recommended Project Structure

```
src/
├── components/projects/wallecx/         # Mini-app feature folder (kebab-case per CONVENTIONS)
│   ├── WallecxApp.vue                   # Route component, list + dialog orchestration
│   ├── VaccinationList.vue              # Records table/cards, emits view/edit/remove
│   ├── ManageVaccination.vue            # Create/edit dialog with Zod-validated form + file upload
│   ├── VaccinationDetail.vue            # Read-only detail panel/dialog
│   └── AttachmentPreview.vue            # Image-or-PDF renderer (reused by Detail and Manage)
├── lib/pocketbase/
│   └── vaccinationMapper.ts             # mapToUpdateVaccination — strips id/created/updated/user/card
├── types/wallecx/vaccinations/          # snake_case folder matching collection name suffix
│   └── types.d.ts                       # Vaccinations + AddVaccination
├── router/index.ts                      # +1 lazy route entry: /projects/wallecx (requiresAuth)
└── views/ProjectsView.vue               # +1 entry in `projects` array (directory listing)
```

### Structure Rationale

- **`src/components/projects/wallecx/`:** All Lexarium mini-apps live here (`lextrack/`, `larga/`, `gift-exchange/`, `api-playground/`). Folder name is kebab-case route slug, root SFC is `<Name>App.vue`. Non-negotiable per `STRUCTURE.md` "Where to Add New Code → New mini-app".
- **No `src/views/WallecxView.vue`:** Optional. LexTrack is the only mini-app that uses a view-shell wrapper, and `ARCHITECTURE.md` explicitly flags this as inconsistent. Going straight from router → `WallecxApp.vue` matches `LargaApp.vue` and `ApiPlaygroundApp.vue` and is the better pattern.
- **`src/types/wallecx/vaccinations/`:** Matches the existing `src/types/lextrack/dsu_tasks/` shape: `<feature>/<collection_snake_case>/types.d.ts`. The `vaccinations/` segment makes future record types (`identity_documents/`, `medical_records/`) sit cleanly alongside.
- **`src/lib/pocketbase/vaccinationMapper.ts`:** Flat, mirrors `dsuTaskMapper.ts`. Module name uses camelCase per `CONVENTIONS.md`.
- **No constants subfolder:** None needed in v1. Vaccine name list, dose numbers, etc. are free-text fields.

## Architectural Patterns

### Pattern 1: PocketBase Per-User Collection Isolation

**What:** Every CRUD operation is gated server-side by collection rules tying records to `@request.auth.id`. The route guard is **only UX** — the real authorization boundary lives in PocketBase.

**When to use:** Any collection holding user-private data. For Wallecx, this is the entire collection.

**Trade-offs:** Requires a `user` relation field on every record (small storage cost). Forgetting any one of the five rules silently leaks data; this is the highest-risk part of the milestone.

**Collection definition (PocketBase admin or migration):**

```
Collection: wallecx_vaccinations
Type: base

Fields:
  user                relation → users (required, single, cascadeDelete)
  vaccine_name        text     (required, min 1, max 200)
  date_administered   date     (required)
  dose_number         number   (optional, min 1, max 20, integer)
  lot_number          text     (optional, max 100)
  location            text     (optional, max 200)
  card                file     (optional, maxSelect 1, maxSize 5_242_880,
                                mimeTypes [image/jpeg, image/png, image/webp,
                                           image/heic, application/pdf],
                                thumbs [100x100, 400x400])

Indexes:
  CREATE INDEX idx_wallecx_vacc_user_date
    ON wallecx_vaccinations (user, date_administered DESC)

Rules (all five MUST be set; empty = public):
  listRule:   @request.auth.id != "" && user = @request.auth.id
  viewRule:   @request.auth.id != "" && user = @request.auth.id
  createRule: @request.auth.id != "" && @request.body.user = @request.auth.id
  updateRule: @request.auth.id != "" && user = @request.auth.id
  deleteRule: @request.auth.id != "" && user = @request.auth.id
```

The `createRule` form is deliberately different — it inspects `@request.body.user` because `user` doesn't yet exist on a not-yet-created record. This is the standard PocketBase idiom.

### Pattern 2: Mirror LexTrack's State + CRUD Loop

**What:** Local `ref<Vaccinations[]>([])` in `WallecxApp.vue`, fetched in `onMounted` (and refetched after save/delete), passed to `VaccinationList` via `v-model`. Edits flow through a single `selectedRecord` ref bound to `ManageVaccination` via `v-model:record`.

**When to use:** Single-screen CRUD with <100 records (v1 scope).

**Trade-offs:** No optimistic update sophistication, no caching across navigations — fine here, refetch is cheap, and switching to a Pinia store later is mechanical.

**Sketch:**

```ts
// WallecxApp.vue
const records = ref<Vaccinations[]>([]);
const selected = ref<AddVaccination | Vaccinations | null>(null);
const manageVisible = ref(false);
const detailVisible = ref(false);

const fetch = async () => {
  records.value = await pb
    .collection("wallecx_vaccinations")
    .getFullList<Vaccinations>({ sort: "-date_administered" });
};

onMounted(fetch);

const onSaved = async () => {
  manageVisible.value = false;
  await fetch();
};
```

### Pattern 3: File Upload via FormData, Read via `pb.files.getURL`

**What:** PocketBase file fields require `FormData` on create/update. Reads use `pb.files.getURL(record, filename, { thumb })`. Same field stores both image and PDF — MIME-sniff at render time.

**When to use:** Whenever a record has a binary attachment. Vaccination card is the primary example for v1.

**Trade-offs:** A single mixed `card` field (vs `card_image` + `card_pdf`) keeps the schema simple and dodges the "user uploads PDF, then re-uploads photo" awkwardness of two fields. Cost: the preview component must branch on MIME. This is a 10-line component — worth it.

**Create:**

```ts
// ManageVaccination.vue (excerpt)
const save = async (form: VaccinationFormValues, file: File | null) => {
  const data = new FormData();
  data.append("user", auth.user!.id);
  data.append("vaccine_name", form.vaccine_name);
  data.append("date_administered", dayjs(form.date_administered).format("YYYY-MM-DD"));
  if (form.dose_number != null) data.append("dose_number", String(form.dose_number));
  if (form.lot_number) data.append("lot_number", form.lot_number);
  if (form.location) data.append("location", form.location);
  if (file) data.append("card", file);

  if (props.record?.id) {
    await pb.collection("wallecx_vaccinations").update<Vaccinations>(props.record.id, data);
  } else {
    await pb.collection("wallecx_vaccinations").create<Vaccinations>(data);
  }
  emit("saved");
};
```

**Read / preview:**

```ts
// AttachmentPreview.vue
const props = defineProps<{ record: Vaccinations }>();
const url = computed(() =>
  props.record.card ? pb.files.getURL(props.record, props.record.card) : null
);
const thumbUrl = computed(() =>
  props.record.card
    ? pb.files.getURL(props.record, props.record.card, { thumb: "400x400" })
    : null
);
const isPdf = computed(() => /\.pdf$/i.test(props.record.card ?? ""));
```

```vue
<template>
  <div v-if="url">
    <img v-if="!isPdf" :src="thumbUrl ?? url" alt="Vaccination card" class="max-w-full rounded" />
    <iframe v-else :src="url" class="w-full h-[60vh] rounded" title="Vaccination card PDF" />
  </div>
</template>
```

### Pattern 4: Vault-Friendly Schema Without Pre-Built Generality

**What:** The collection name (`wallecx_vaccinations`) and folder name (`vaccinations`) are *deliberately specific*. PROJECT.md is explicit: "the schema should accommodate [future record types] *if it doesn't add complexity*, but we are NOT pre-building a generic record system in v1."

**When to use:** Phase 1. Future record types get their own collections (`wallecx_identity_documents`, `wallecx_medical_records`) with their own type folders. No `wallecx_records` polymorphic table. No `record_type` discriminator. No JSON blob schemas.

**Trade-offs:** When phase 2 lands, adding a new collection + type folder + a couple of components is cheaper than the migration tax of a generic schema that turned out wrong. The shared shape across collections (per-user `user` relation, optional `card`-style file field, common audit columns) is the only "vault" abstraction worth carrying forward — and that's just convention, not code.

## Data Flow

### Request Flow — Create with Attachment

```
[User clicks "Add vaccination"]
        │
        ▼
[WallecxApp.vue] → manageVisible=true, selected=null
        │
        ▼
[ManageVaccination.vue] (Dialog opens)
        │   user fills form, picks file via PrimeVue <FileUpload mode="basic">
        │   form validated by zodResolver (vaccine_name + date_administered required)
        ▼
[save()] → builds FormData, appends user=auth.user.id + fields + file
        │
        ▼
[pb.collection('wallecx_vaccinations').create(data)]
        │   PocketBase: createRule checks @request.body.user = @request.auth.id
        │              file written to PB_DATA/storage; record persisted
        ▼
[server returns Vaccinations record]
        │
        ▼
[emit('saved')] → WallecxApp.fetch() → records.value updated → list re-renders
        │
        ▼
[toast.success("Vaccination saved")]   ← vue-sonner
```

### Request Flow — Read + Preview

```
[Route /projects/wallecx]
        │
        ▼
[router.beforeEach] → auth.isLoggedIn? no → /login?redirect=/projects/wallecx
                      yes ↓
[WallecxApp.onMounted] → pb.collection('wallecx_vaccinations')
                            .getFullList<Vaccinations>({ sort: '-date_administered' })
        │   PocketBase: listRule → returns ONLY rows where user = caller
        ▼
[records.value populated] → VaccinationList renders rows
        │
        ▼
[User clicks row] → emit('view', id) → WallecxApp sets selected, detailVisible=true
        │
        ▼
[VaccinationDetail] embeds <AttachmentPreview :record="selected" />
        │
        ▼
[AttachmentPreview] computes pb.files.getURL(record, record.card)
                    PocketBase serves file (auth check via signed URL or auth header)
                    branches on .pdf vs image → <iframe> or <img>
```

### State Management

No new Pinia store. State map:

| State | Owner | Reactive shape |
|-------|-------|----------------|
| Auth (user, isLoggedIn) | `useAuthStore` (existing) | shared, Pinia |
| Records list | `WallecxApp.vue` | `ref<Vaccinations[]>` |
| Selected record | `WallecxApp.vue` | `ref<Vaccinations \| AddVaccination \| null>` |
| Dialog visibility | `WallecxApp.vue` | two `ref<boolean>` |
| Form values | `ManageVaccination.vue` | local `reactive` (per `Login.vue` convention for grouped form state) |
| Preview URL | `AttachmentPreview.vue` | `computed` from props |

## Suggested Build Order

The build order below is dictated by dependencies — every step unblocks the next, and each step is independently mergeable / verifiable.

1. **PocketBase schema + rules** (server-side, no code commits)
   - Create `wallecx_vaccinations` collection in PocketBase admin (or migration file)
   - Set all five rules + indexes
   - Smoke-test from PB admin: create row as user A, log in as user B, confirm A's row is invisible
   - **Unblocks:** every subsequent step. **Risk gate:** if the rules are wrong, every later step is built on a leaky foundation.

2. **Type module** — `src/types/wallecx/vaccinations/types.d.ts`
   - `interface Vaccinations extends RecordModel` (id/created/updated/user/vaccine_name/date_administered/dose_number?/lot_number?/location?/card?)
   - `type AddVaccination = Omit<Vaccinations, 'id' | 'created' | 'updated'>`
   - **Unblocks:** mapper + every component that imports the type. Pure data, no runtime.

3. **Mapper** — `src/lib/pocketbase/vaccinationMapper.ts`
   - `mapToUpdateVaccination(r: Vaccinations)` returning the writable subset (everything except id/created/updated/user/card — file replacement is its own FormData flow)
   - **Unblocks:** edit path in `ManageVaccination.vue`.

4. **Route registration + auth gate** — `src/router/index.ts`
   - Add `{ path: '/projects/wallecx', name: 'wallecx', component: () => import('@/components/projects/wallecx/WallecxApp.vue'), meta: { requiresAuth: true } }`
   - Existing `beforeEach` guard handles redirect for free
   - **Unblocks:** local navigation testing. Stub `WallecxApp.vue` with a single `<div>Wallecx</div>` while the rest is built.

5. **`WallecxApp.vue` shell** — list + fetch only
   - `onMounted` → `pb.collection('wallecx_vaccinations').getFullList<Vaccinations>({ sort: '-date_administered' })`
   - Render with a placeholder `VaccinationList` (or inline `<DataTable>`) — no edit path yet
   - **Verifies:** auth gate, listRule, type module, env wiring all work end-to-end. **Unblocks:** every interactive piece.

6. **`VaccinationList.vue`** — extract list rendering, wire `view`/`edit`/`remove` emits
   - **Unblocks:** Detail and Manage dialogs (which open in response to its emits).

7. **`AttachmentPreview.vue`** — image / PDF branching renderer
   - Built **before** Detail + Manage so both can use it
   - **Unblocks:** detail and edit/preview-existing flows.

8. **`VaccinationDetail.vue`** — read-only panel/dialog using `AttachmentPreview`
   - **Unblocks:** "view a record" UX. Independent of write paths.

9. **`ManageVaccination.vue`** — create + edit dialog
   - Form with `zodResolver` (vaccine_name + date_administered required, dose_number int min 1, file MIME/size client-side check)
   - FormData create / mapper-based update
   - **Unblocks:** full CRUD.

10. **Delete flow** — confirm dialog from `VaccinationList` row, `pb.collection(...).delete(id)`, refetch, toast
    - Tiny, but worth its own step so it isn't wedged into Manage.

11. **Projects directory entry** — add Wallecx tile to `src/views/ProjectsView.vue` `projects` array
    - Pure UX, lowest risk, last so the link only appears when the destination works.

12. **Seed tests** (optional but flagged in PROJECT.md "Known concerns"): mapper unit test + auth-gate route guard test — first tests in the codebase, low-effort high-signal targets.

**Critical path:** 1 → 2 → 5. Steps 3, 4 are tiny. 6–11 are leaf work that can fan out once the shell is up.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user, <50 records (v1 reality) | `getFullList` + client-side sort. No pagination, no caching. Current plan is already correct here. |
| 10 users, <500 records each | Still fine. PocketBase indexes on `(user, date_administered DESC)` keep listRule queries cheap. |
| 100+ users, 1000+ records each | Switch `getFullList` → paginated `getList(page, perPage)` and add a search/filter input. Move state to a Pinia store if cross-route caching becomes valuable. |
| New record types added (phase 2+) | Add new collections + type folders, NOT a polymorphic table. Lift shared UI bits (`AttachmentPreview`, file upload helpers) into `src/components/projects/wallecx/shared/` only after the second collection exists and the duplication is real. |

### Scaling Priorities

1. **First bottleneck:** unbounded `getFullList` once one user accumulates many records. Fix: paginate.
2. **Second bottleneck:** file storage growth on the PocketBase host. Fix: configure PocketBase S3 backend (already supported by PB 0.26) — zero app-side change because `pb.files.getURL` keeps working.

## Anti-Patterns

### Anti-Pattern 1: Trusting the Client-Side Auth Guard for Authorization

**What people do:** Set `meta: { requiresAuth: true }` and assume vaccination data is private.
**Why it's wrong:** The guard runs in the browser. Anyone hitting the PocketBase REST endpoint directly bypasses it. Without all five collection rules set, a logged-in user can read/edit/delete *every* user's records.
**Do this instead:** Configure all five PocketBase rules (`listRule`, `viewRule`, `createRule`, `updateRule`, `deleteRule`) to compare `user` against `@request.auth.id`. Treat the route guard as UX only. Verify by signing in as a second user in an incognito window before merging.

### Anti-Pattern 2: Pre-Building a Generic "Records" Vault

**What people do:** Phase 1 ships a `wallecx_records` collection with `record_type: 'vaccination' | 'identity' | 'medical'` and a JSON `data` blob, "to make phase 2 easier."
**Why it's wrong:** Explicitly out of scope per PROJECT.md ("the schema should accommodate [future] *if it doesn't add complexity*, but we are NOT pre-building a generic record system"). Polymorphic schemas defeat PocketBase's typed fields, kill the type layer, and the second record type usually needs different fields anyway, forcing the migration the abstraction was supposed to prevent.
**Do this instead:** One concrete collection per record type. Convention — not abstraction — carries the "vault" identity (`wallecx_*` prefix, `user` relation, optional file field).

### Anti-Pattern 3: Two File Fields (`card_image` + `card_pdf`)

**What people do:** Add a separate field per accepted MIME type "for type safety."
**Why it's wrong:** Splits the user's mental model ("here's my card") into two backend slots, makes "they uploaded a PDF, now they want to replace it with a photo" awkward, and bloats the schema. The MIME-sniff at render is ten lines.
**Do this instead:** Single `card` field with PocketBase `mimeTypes` whitelisting `image/*` + `application/pdf`. Branch in `AttachmentPreview.vue`.

### Anti-Pattern 4: Storing the File as a Base64 String in a Text Field

**What people do:** Skip PocketBase file fields, base64-encode the upload into a text column.
**Why it's wrong:** ~33% size inflation, blows past PocketBase's default body-size limit on a single 5MB scan, breaks `pb.files.getURL`, and prevents `thumbs` generation.
**Do this instead:** PocketBase file field with `maxSize` and `thumbs` configured. Always.

### Anti-Pattern 5: Forgetting to Strip `user` From the Update Payload

**What people do:** Spread the entire `Vaccinations` record into `pb.collection(...).update(id, record)`.
**Why it's wrong:** Resending `user` is harmless when correct, but if any client-side bug ever mutates `record.user`, the `updateRule` will reject the request with a confusing message — or, worse, in a future schema where `updateRule` is laxer, silently re-assign ownership.
**Do this instead:** `mapToUpdateVaccination` returns only the writable, non-immutable, non-relation fields — exactly mirroring `mapToUpdateTask`. File replacement is a separate FormData call.

### Anti-Pattern 6: Letting `unplugin-vue-components` Auto-Register Conflicting Names

**What people do:** Name a subcomponent `List.vue` or `Detail.vue` because "it's inside `wallecx/`."
**Why it's wrong:** PROJECT.md's "Known concerns" calls this out: `unplugin-vue-components` auto-registers globally. `List.vue` will clash with future mini-apps' lists.
**Do this instead:** Prefix every Wallecx subcomponent with `Vaccination*` (or, for shared, `Wallecx*`). `VaccinationList.vue`, `VaccinationDetail.vue`, `ManageVaccination.vue`, `AttachmentPreview.vue` (this last is generic enough to keep, but if a second app needs one, rename to `WallecxAttachmentPreview.vue`).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PocketBase | Shared `pb` singleton from `@/lib/pocketbase`; collection: `wallecx_vaccinations` | Server-side rules are the real auth boundary. File uploads via FormData; reads via `pb.files.getURL`. |
| Vercel | Static deploy via GitHub push; no app-side change | New route resolves client-side via Vercel's default SPA rewrite. No `vercel.json` needed. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Router ↔ `WallecxApp.vue` | Lazy `import()` + `requiresAuth` meta | Same pattern as LexTrack. |
| `WallecxApp.vue` ↔ `useAuthStore` | `auth.user!.id` read on create (for `user` field), `auth.isLoggedIn` indirectly via guard | No store writes — auth is read-only here. |
| `WallecxApp.vue` ↔ subcomponents | `defineProps` / `defineEmits` / `defineModel` per CONVENTIONS Vue 3 patterns | Mirror `LexTrackView.vue` ↔ `ActivityCard` / `ManageTask` wiring. |
| `ManageVaccination.vue` ↔ PocketBase | Direct via `pb`; create=FormData, update=FormData (when file changed) or `mapToUpdateVaccination` JSON | One component owns its own writes — no service layer. Matches LexTrack. |
| `AttachmentPreview.vue` ↔ PocketBase | Read-only via `pb.files.getURL(record, filename, { thumb })` | Pure render component, no async. |
| `ProjectsView.vue` ↔ Wallecx | One row in the `projects` array | No coupling beyond the route name + label. |

## Sources

- `.planning/codebase/ARCHITECTURE.md` — Lexarium architecture analysis (2026-05-10) — HIGH confidence
- `.planning/codebase/STRUCTURE.md` — directory layout and "Where to Add New Code" — HIGH confidence
- `.planning/codebase/CONVENTIONS.md` — naming, Vue 3 patterns, error handling — HIGH confidence
- `.planning/PROJECT.md` — Wallecx requirements, constraints, decisions — HIGH confidence
- `src/components/projects/lextrack/LexTrackApp.vue`, `src/views/LexTrackView.vue` — reference implementation — HIGH confidence
- `src/lib/pocketbase/dsuTaskMapper.ts`, `src/types/lextrack/dsu_tasks/types.d.ts` — mapper + type pattern — HIGH confidence
- `src/router/index.ts` — auth guard + lazy route pattern — HIGH confidence
- PocketBase 0.26 docs — collection rules, file fields, `pb.files.getURL`, FormData uploads (https://pocketbase.io/docs/collections/, https://pocketbase.io/docs/files-handling/) — HIGH confidence

---
*Architecture research for: Wallecx Phase 1 inside Lexarium*
*Researched: 2026-05-10*
