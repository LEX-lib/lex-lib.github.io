# Architecture Research

**Domain:** Wallecx mini-app v2.0 — Adding Membership Cards as a second vault record type
**Researched:** 2026-05-13
**Confidence:** HIGH (based entirely on direct inspection of the existing Wallecx codebase and Lexarium conventions)

---

## Integration Approach Decision

**Verdict: PrimeVue Tabs within the existing `/projects/wallecx` route.**

Three options were evaluated:

### Option A — PrimeVue Tabs inside `WallecxApp.vue` (RECOMMENDED)

Split the existing `WallecxApp.vue` content into a Vaccinations tab and a new Memberships tab, rendered inside a PrimeVue `<Tabs>` / `<TabPanel>` wrapper at the top of the card.

**Why this is correct:**
- The v2.0 milestone requirement explicitly states "Wallecx tab navigation switching between Vaccinations and Memberships" — tabs are the specified UI.
- The router already resolves `/projects/wallecx` to `WallecxApp.vue`. Adding tabs keeps the URL stable; users who bookmark `/projects/wallecx` land on the app and choose their view from within, which is the right mental model for a unified vault.
- LexTrack (`LexTrackApp.vue`) already uses `<TabView>` / `<TabPanel>` (the PrimeVue 3-era API) as the pattern for switching between distinct record types inside one mini-app. v2.0 mirrors that pattern using the PrimeVue 4 `<Tabs>` / `<TabList>` / `<Tab>` / `<TabPanels>` / `<TabPanel>` API (Aura theme-aware, auto-imported).
- State for each tab (records, loading, selected) remains independent local refs — no Pinia store needed. Both sets of state live in `WallecxApp.vue` or are lifted into per-tab child root components (see component plan below).

**Trade-offs:**
- `WallecxApp.vue` grows if all state is inlined. Mitigated by extracting `VaccinationsTab.vue` and `MembershipsTab.vue` as tab-root components (each owns its own state), keeping `WallecxApp.vue` as a thin shell that renders the tab container.
- Deep-linking to a specific tab (`/projects/wallecx#memberships`) is not possible with in-component tabs. Acceptable for v2.0 — the milestone does not require deep-link sharing.

### Option B — Sub-routes (`/projects/wallecx/vaccinations` + `/projects/wallecx/memberships`)

Add child routes with a `<RouterView>` in `WallecxApp.vue`.

**Why not:**
- Would require making `/projects/wallecx` a layout route (adding `children:`, converting to a view shell, adding `<RouterView>`) — a non-trivial router restructure that touches `index.ts` and the existing `WallecxApp.vue` entry point.
- Breaks existing bookmarks to `/projects/wallecx` unless a redirect is added.
- No other Lexarium mini-app uses child routes for tab-like section switching (only Gift Exchange uses separate child routes, and those are genuinely separate screens with different auth contexts, not tabs within a single app).
- Adds router complexity that earns no user-visible feature. Tabs achieve the same UX without it.

### Option C — Separate route `/projects/wallecx-memberships`

Mount memberships as an entirely separate mini-app route.

**Why not:**
- Contradicts the Wallecx identity as a unified personal vault. Users would navigate between two disconnected apps.
- Requires duplicating shared scaffolding (auth check, Card shell, toolbar) across two routes.
- Provides no separation benefit — memberships and vaccinations share the same PocketBase instance, same auth user, same design tokens, and no conflicting state.

---

## Component Architecture

### Structural change to `WallecxApp.vue`

`WallecxApp.vue` is refactored from a single-concern vaccination screen into a **tab shell**:

```
WallecxApp.vue                     (tab container + shared ConfirmDialog)
  ├── VaccinationsTab.vue           (owns all vaccination state + logic, MOVED from WallecxApp)
  │     ├── WallecxToolbar.vue      (existing — reused as-is, vaccination-specific props)
  │     ├── VaccinationGroupCard.vue (existing — unchanged)
  │     ├── VaccinationGroupPanel.vue (existing — unchanged)
  │     ├── ManageVaccination.vue   (existing — unchanged)
  │     └── VaccinationDetail.vue   (existing — unchanged)
  │           └── AttachmentPreview.vue (existing — unchanged)
  └── MembershipsTab.vue            (new — owns all membership state + logic)
        ├── MembershipCard.vue       (new — coloured card tile in wallet grid)
        ├── ManageMembership.vue    (new — create/edit dialog, mirrors ManageVaccination.vue)
        └── MembershipDetail.vue    (new — fullscreen/dialog scan view with barcode)
              └── BarcodeDisplay.vue (new — barcode/QR renderer, shared if vaccinations ever need it)
```

### New components to create

| File | Purpose | Notes |
|------|---------|-------|
| `src/components/projects/wallecx/VaccinationsTab.vue` | Extraction of all current vaccination logic from `WallecxApp.vue`. Owns `records`, `isLoading`, grouping, search, sort, view-mode, fileToken, listToken state. | Mechanical move, not a rewrite. |
| `src/components/projects/wallecx/MembershipsTab.vue` | Root component for the memberships tab. Owns `memberships` ref, loading state, delete confirm. Calls `pb.collection('wallecx_memberships').getFullList()` on mount. | Mirrors `VaccinationsTab.vue` structure. |
| `src/components/projects/wallecx/MembershipCard.vue` | Single card tile in the memberships wallet grid. Shows card name, issuer, colour swatch, expiry badge, barcode preview. Emits `click` (open detail), `edit`, `delete`. | Visual heart of the membership UX. Colour rendered via inline `style` from `card_colour` field. |
| `src/components/projects/wallecx/ManageMembership.vue` | Create/edit Dialog. Zod schema + `@primevue/forms` `zodResolver`. Fields: card name (required), issuer (optional), barcode value (optional), barcode type Select (QR/Code128/EAN-13/Code39), card number plain text (optional), expiry DatePicker (optional), notes Textarea, card colour ColorPicker or InputText (hex), card photo FileUpload. | Mirrors `ManageVaccination.vue` structure exactly. Uses same `isSaving` guard, `FormData` create, mapper-based update, `pendingFile` for photo. |
| `src/components/projects/wallecx/MembershipDetail.vue` | Read-only detail view in a Dialog or full-screen overlay. Shows all fields + rendered barcode/QR. "Tap to go fullscreen" behaviour for scanner use. | Contains `BarcodeDisplay.vue`. |
| `src/components/projects/wallecx/BarcodeDisplay.vue` | Renders a barcode or QR code from a `value` + `type` prop using `vue-barcode` or `qrcode.vue`. Falls back to plain `card_number` text if no barcode value. | Isolated renderer — no PocketBase calls, purely presentational. Candidate for sharing if other vault types ever need barcodes. |
| `src/types/wallecx/memberships/types.d.ts` | TypeScript interface `Memberships extends RecordModel` + `AddMembership = Omit<Memberships, 'id' \| 'created' \| 'updated'>`. | Mirrors `src/types/wallecx/vaccinations/types.d.ts`. |
| `src/lib/pocketbase/membershipMapper.ts` | `mapToUpdateMembership(record: Memberships)` returning writable subset (strips `id`, `created`, `updated`, `user`, `card_photo`). | Mirrors `vaccinationMapper.ts`. |

### Existing components — modified

| File | Change |
|------|--------|
| `src/components/projects/wallecx/WallecxApp.vue` | **Significant refactor.** Remove all vaccination state, logic, and template content. Replace with a `<Tabs>` container holding two `<TabPanel>` slots mounting `VaccinationsTab` and `MembershipsTab`. Keep `<ConfirmDialog />` here (shared, singleton per page). |
| `src/router/index.ts` | **No change.** The route path, name, and component reference remain `/projects/wallecx` → `WallecxApp.vue`. |

### Existing components — unchanged (zero modification)

The following files are moved into `VaccinationsTab.vue`'s component tree but their source code does not change. The only difference is they are now children of `VaccinationsTab` instead of `WallecxApp`:

- `VaccinationGroupCard.vue`
- `VaccinationGroupPanel.vue`
- `ManageVaccination.vue`
- `VaccinationDetail.vue`
- `AttachmentPreview.vue`
- `WallecxToolbar.vue`

Because `unplugin-vue-components` auto-imports globally, moving these into `VaccinationsTab.vue` requires no import-statement changes in those files.

---

## New PocketBase Collection

```
Collection: wallecx_memberships
Type: base

Fields:
  user            relation → users (required, single, cascadeDelete)
  card_name       text     (required, min 1, max 200)
  issuer          text     (optional, max 200)
  barcode_value   text     (optional, max 500)    — raw string to encode
  barcode_type    text     (optional)              — "qr" | "code128" | "ean13" | "code39"
  card_number     text     (optional, max 100)    — human-readable fallback
  expiry_date     date     (optional)
  notes           text     (optional)
  card_colour     text     (optional, max 7)      — hex string e.g. "#1a2b3c"
  card_photo      file     (optional, maxSelect 1, maxSize 10_485_760,
                            mimeTypes [image/jpeg, image/png, image/webp],
                            thumbs [100x100, 400x400])

Indexes:
  CREATE INDEX idx_wallecx_mem_user_name
    ON wallecx_memberships (user, card_name ASC)

Rules (all five required — same per-user isolation pattern as wallecx_vaccinations):
  listRule:   @request.auth.id != "" && user = @request.auth.id
  viewRule:   @request.auth.id != "" && user = @request.auth.id
  createRule: @request.auth.id != "" && @request.body.user = @request.auth.id
  updateRule: @request.auth.id != "" && user = @request.auth.id
  deleteRule: @request.auth.id != "" && user = @request.auth.id
```

**Schema decisions:**
- `barcode_type` stored as plain text (not a PocketBase select field) so the frontend Select dropdown drives validation via Zod — consistent with how `vaccine_type` is handled.
- `card_colour` stored as a hex string. The frontend validates format with Zod `.regex(/^#[0-9a-fA-F]{6}$/)`. No separate colour model needed.
- `card_photo` is optional. Cards with no photo still render as coloured tiles — the photo is a nice-to-have, not a core display element (unlike vaccination where the card scan IS the record).
- No PDF support for `card_photo` — membership card photos are always images, not documents.

---

## Shared Patterns and Opportunities

### Pattern: Tab-Root Component as State Owner

`VaccinationsTab.vue` and `MembershipsTab.vue` each own their record slice's state independently. Neither communicates with the other. `WallecxApp.vue` does not need to know about records at all — it only holds the active tab index.

This is the cleanest separation: switching tabs unmounts/remounts the inactive tab component (unless `keepAlive` is used), which naturally resets state. If preserving scroll position across tab switches becomes important, wrap with `<KeepAlive>`.

### Pattern: Mapper Pair (type + mapper)

Every vault record type gets:
1. `src/types/wallecx/<collection>/types.d.ts` — interface + AddType
2. `src/lib/pocketbase/<collection>Mapper.ts` — mapToUpdate<Type>

For memberships:
- `src/types/wallecx/memberships/types.d.ts` — `Memberships` + `AddMembership`
- `src/lib/pocketbase/membershipMapper.ts` — `mapToUpdateMembership`

This is already the established convention from vaccinations and LexTrack's three mappers.

### Pattern: Isolated BarcodeDisplay Component

`BarcodeDisplay.vue` takes `value: string`, `type: 'qr' | 'code128' | 'ean13' | 'code39'` and `fallbackNumber?: string` as props and renders the appropriate barcode or plain text. It is completely decoupled from the Memberships type — if a future vault type (insurance cards, access badges) also needs barcode rendering, `BarcodeDisplay.vue` is already reusable.

Barcode library recommendation: `jsbarcode` (for 1D barcodes: Code128, EAN-13, Code39) + `qrcode` npm package (for QR). Both render to SVG/canvas without DOM dependencies. Alternative: a single Vue wrapper library such as `vue-barcode` if it covers all four types — verify coverage before committing.

### Pattern: Full-Screen Scan View

`MembershipDetail.vue` should implement a full-screen toggle using the Fullscreen API (`document.documentElement.requestFullscreen()`), triggered by tapping/clicking the barcode area. This is a contained behaviour inside the detail component — no router or state involvement needed. Fallback: if Fullscreen API is unavailable, render the barcode at maximum width inside a Dialog with `maximizable: true` (PrimeVue Dialog prop).

### Pattern: WallecxToolbar reuse

`WallecxToolbar.vue` currently has vaccination-specific placeholder text ("Search by name or type…") and sort options. For memberships, a separate `MembershipsToolbar.vue` is the safer choice (different sort dimensions: card name A-Z, issuer A-Z, expiry soonest). Copy-adapt, do not genericise `WallecxToolbar.vue` — the vaccination search+sort logic is different enough that a shared toolbar would need too many props.

If the toolbar shapes converge in a future milestone, consolidate then.

---

## Build Order

Dependencies dictate this order. Each step is independently verifiable.

### Phase A — Backend

**Step 1: `wallecx_memberships` PocketBase collection**
- Create collection with all fields listed above.
- Set all five per-user rules.
- Two-user smoke test: confirm cross-user isolation (same test protocol as vaccinations).
- **Unblocks:** all subsequent steps. **Risk gate:** wrong rules = data leak.

### Phase B — Type and Mapper Foundation

**Step 2: Type module** — `src/types/wallecx/memberships/types.d.ts`
- `interface Memberships extends RecordModel` mirroring all backend fields.
- `type AddMembership = Omit<Memberships, 'id' | 'created' | 'updated'>`.
- **Unblocks:** mapper, all membership components, Zod schema in `ManageMembership.vue`.

**Step 3: Mapper** — `src/lib/pocketbase/membershipMapper.ts`
- `mapToUpdateMembership(record: Memberships)` — strips `id`, `created`, `updated`, `user`, `card_photo`.
- **Unblocks:** edit path in `ManageMembership.vue`.

### Phase C — WallecxApp Refactor (Tab Shell)

**Step 4: Extract `VaccinationsTab.vue`**
- Mechanical move: lift all vaccination state, computed properties, methods, and template content from `WallecxApp.vue` into a new `VaccinationsTab.vue`.
- `WallecxApp.vue` becomes a shell that mounts `<VaccinationsTab />` directly (no tabs yet — tabs come in Step 5).
- **Verify:** vaccination features still work identically after the extraction. This is a pure refactor with no behaviour change.
- **Unblocks:** Step 5 (adding `MembershipsTab.vue` to the tab container).

**Step 5: Add PrimeVue Tabs wrapper to `WallecxApp.vue`**
- Wrap `<VaccinationsTab />` in `<Tabs>` / `<TabList>` / `<TabPanels>` with a second `<TabPanel>` showing a stub `<MembershipsTab />` (empty state).
- Verify tab switching works, PrimeVue Aura Tabs styling is correct.
- **Unblocks:** Step 6 onward (memberships content).

### Phase D — Memberships Read Path

**Step 6: `MembershipsTab.vue` shell + fetch**
- Mounts on the Memberships tab. `onMounted` → `pb.collection('wallecx_memberships').getFullList<Memberships>()`.
- Renders loading skeleton, empty state, and a placeholder card grid.
- **Verifies:** collection rules, type module, auth session all work for memberships.
- **Unblocks:** display components.

**Step 7: `BarcodeDisplay.vue`**
- Accepts `value`, `type`, `fallbackNumber` props.
- Renders QR or 1D barcode to SVG/canvas. Falls back to plain text.
- Built before `MembershipCard` and `MembershipDetail` so both can embed it.
- **Unblocks:** Steps 8 and 9.

**Step 8: `MembershipCard.vue`**
- Coloured tile card: card name, issuer, colour background, expiry badge, small barcode preview (via `BarcodeDisplay`).
- Emits `click` (open detail), `edit`, `delete`.
- **Unblocks:** full memberships read path.

**Step 9: `MembershipDetail.vue`**
- Dialog showing all fields + full-size `BarcodeDisplay`.
- Full-screen toggle via Fullscreen API.
- **Completes:** memberships read path.

### Phase E — Memberships Write Path

**Step 10: `ManageMembership.vue`**
- Create/edit Dialog. Zod schema validating required fields + hex colour + barcode type.
- `FormData` create; `mapToUpdateMembership` for update.
- Optional photo: image-only FileUpload with EXIF strip (reuse same canvas re-encode pattern from `ManageVaccination.vue`).
- `isSaving` guard, vue-sonner toasts.
- Emits `created` and `updated` to `MembershipsTab.vue`.
- **Completes:** memberships write path.

**Step 11: Delete flow in `MembershipsTab.vue`**
- `useConfirm()` confirm dialog (shared `<ConfirmDialog />` in `WallecxApp.vue` is already present).
- `await pb.collection('wallecx_memberships').delete(id)` → splice → toast.
- Same guard pattern as vaccinations: do NOT splice on failure.

### Phase F — Polish

**Step 12: `MembershipsToolbar.vue`** (optional for v2.0 MVP, add if time allows)
- Search by card name or issuer.
- Sort: Name A-Z (default), Name Z-A, Issuer A-Z, Expiry soonest.

**Step 13: Mapper unit test** — `src/lib/pocketbase/__tests__/membershipMapper.spec.ts`
- Covers `mapToUpdateMembership` (strips correct fields).
- Follows the pattern of `vaccinationMapper.spec.ts`.

---

## Full File Change Summary

### New files

```
src/
├── components/projects/wallecx/
│   ├── VaccinationsTab.vue           (extracted from WallecxApp.vue — Step 4)
│   ├── MembershipsTab.vue            (new — Step 6)
│   ├── MembershipCard.vue            (new — Step 8)
│   ├── ManageMembership.vue          (new — Step 10)
│   ├── MembershipDetail.vue          (new — Step 9)
│   └── BarcodeDisplay.vue            (new — Step 7)
├── types/wallecx/memberships/
│   └── types.d.ts                    (new — Step 2)
└── lib/pocketbase/
    ├── membershipMapper.ts           (new — Step 3)
    └── __tests__/
        └── membershipMapper.spec.ts  (new — Step 13)
```

### Modified files

```
src/
├── components/projects/wallecx/
│   └── WallecxApp.vue                (refactored to tab shell — Steps 4+5)
```

### Unchanged files (zero modification)

```
src/
├── components/projects/wallecx/
│   ├── VaccinationGroupCard.vue
│   ├── VaccinationGroupPanel.vue
│   ├── ManageVaccination.vue
│   ├── VaccinationDetail.vue
│   ├── AttachmentPreview.vue
│   └── WallecxToolbar.vue
├── router/index.ts
└── types/wallecx/vaccinations/types.d.ts
```

---

## System Diagram (post-v2.0)

```
src/router/index.ts
  /projects/wallecx (requiresAuth: true)
        │
        ▼
WallecxApp.vue (tab shell)
  ├── <ConfirmDialog /> (singleton)
  ├── <Tabs>
  │    ├── Tab: "Vaccinations"
  │    │    └── VaccinationsTab.vue
  │    │         ├── WallecxToolbar.vue
  │    │         ├── VaccinationGroupCard.vue × N
  │    │         ├── Drawer → VaccinationGroupPanel.vue
  │    │         ├── ManageVaccination.vue (Dialog)
  │    │         └── VaccinationDetail.vue (Dialog)
  │    │               └── AttachmentPreview.vue
  │    └── Tab: "Memberships"
  │         └── MembershipsTab.vue
  │              ├── MembershipCard.vue × N
  │              ├── ManageMembership.vue (Dialog)
  │              └── MembershipDetail.vue (Dialog/Fullscreen)
  │                    └── BarcodeDisplay.vue
  │
  └── PocketBase
       ├── wallecx_vaccinations (existing, unchanged)
       └── wallecx_memberships  (new)
```

---

## Anti-Patterns to Avoid

### Do not inline all membership state in `WallecxApp.vue`

The refactored `WallecxApp.vue` must only own the active tab index. Inlining both `vaccinationRecords` and `membershipRecords` plus all their logic in one file recreates the pre-refactor problem at double the size. Tab-root components (`VaccinationsTab`, `MembershipsTab`) own their own state.

### Do not genericise the mapper or type before a third record type exists

`mapToUpdateVaccination` and `mapToUpdateMembership` are separate files. Do not create a `wallecxBaseMapper.ts` abstraction. Convention carries the vault identity, not shared code. Premature abstraction here creates more coupling than it prevents.

### Do not reuse `WallecxToolbar.vue` for memberships by adding feature flags

Adding an `activeTab` prop or `mode: 'vaccination' | 'membership'` to `WallecxToolbar.vue` to conditionally render different sort options is the wrong direction. The toolbar components are cheap to clone-and-adapt. Conditional branching inside a shared toolbar makes both usages harder to understand and change.

### Do not use `v-html` for card name or barcode value

Card names and barcode values are user-supplied strings. Render with `{{ }}` interpolation only. The barcode library renders its own SVG — feed the raw string value as a prop, never interpolate it into an HTML template.

---

## Sources

- `src/components/projects/wallecx/WallecxApp.vue` — direct inspection (2026-05-13) — HIGH confidence
- `src/components/projects/lextrack/LexTrackApp.vue` — TabView/TabPanel reference pattern — HIGH confidence
- `src/components/projects/wallecx/ManageVaccination.vue` — form/mapper/FormData pattern to mirror — HIGH confidence
- `src/types/wallecx/vaccinations/types.d.ts` — type pattern to mirror — HIGH confidence
- `src/lib/pocketbase/vaccinationMapper.ts` — mapper pattern to mirror — HIGH confidence
- `.planning/PROJECT.md` (v2.0 milestone section) — feature requirements — HIGH confidence
- `.planning/codebase/ARCHITECTURE.md` — Lexarium mini-app conventions — HIGH confidence
- `.planning/codebase/CONVENTIONS.md` — naming and component conventions — HIGH confidence
- PrimeVue 4 Tabs component (Aura theme, auto-imported) — confirmed available via `primevue: ^4.3.7` in `package.json`

---
*Architecture research for: Wallecx v2.0 Membership Cards — second vault record type*
*Researched: 2026-05-13*
