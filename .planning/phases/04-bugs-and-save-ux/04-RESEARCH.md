# Phase 4: Core Bug Fixes & Save UX - Research

**Researched:** 2026-04-29
**Domain:** PocketBase persistence wiring + Vue 3 async UX (loading / error / rollback)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Per-Item Save Semantics (UI-SAVE-01, UI-SAVE-02):**
- **D-01 (Save flow):** Dialog Save button calls PB synchronously (await). On **success**: close dialog + success toast + patch the PB-returned `id` into the corresponding local-array item. On **fail**: keep dialog open + error toast — user can retry without re-typing.
- **D-02 (Page-level Save coexistence):** Page-level Save loops through all three arrays and calls create-or-update per item based on `id` presence. Items already saved via dialog Save will hit the update path (idempotent re-PUT). Both paths share the same per-collection helper.
- **D-03 (Save helper shape):** Extract a single `saveItem(collection, item)` helper. Returns the PB record so the caller can patch `id` into local state.
- **D-04 (Dialog Save closes on success):** `visible.value = false` is set AFTER the PB call resolves successfully. No optimistic close.

**Optimistic vs Pessimistic Mutations (BUG-03):**
- **D-05 (Delete is optimistic):** Trash click removes item from local array immediately, then `await pb.collection(X).delete(id)`. On fail, re-insert at original index + error toast.
- **D-06 (Save is pessimistic):** Wait for PB confirmation before mutating local state. Avoids tracking pre-edit snapshots.
- **D-07 (Local-only delete is silent):** Items without `id` removed without API call. No toast.

**Loading Indicator Scope (UI-SAVE-03):**
- **D-08:** PrimeVue Button `:loading` on both page-level Save and each dialog Save.
- **D-09:** Single `isLoading` ref dims/skeletons the three ActivityCards during initial fetch + date-change. Date picker stays interactive.
- **D-10:** Trash icon stays clickable; no per-row spinner.
- **D-11:** No loading state on edit-icon (opens dialog only).

**Error UX (BUG-03):**
- **D-12:** One `toast.error` per failed PB call. No aggregation.
- **D-13:** Friendly text ("Couldn't save your meeting — try again?"); raw error to `console.error('[lextrack save]', err)`.
- **D-14:** vue-sonner default duration (~4-5s). No sticky toasts.
- **D-15:** No optimistic-mutation rollback for save failures (save is pessimistic).

**Initial-Load Mechanics (BUG-01):**
- **D-16:** Factor watcher body into `loadForDate(date: Date): Promise<void>` in LexTrackView.vue.
- **D-17:** `onMounted(() => loadForDate(selectedDate.value))` + `watch(selectedDate, (newDate) => loadForDate(newDate))`. No `{ immediate: true }`.
- **D-18:** After page-level `save()` finishes, call `loadForDate(selectedDate.value)` to repopulate. Dialog Save does NOT refetch (patches `id` directly).
- **D-19:** Wrap fetch in try/catch → `toast.error("Couldn't load today's items.")` + `console.error`. Local arrays NOT cleared on fetch failure.

**Date-Change Race Conditions:**
- **D-20:** Naive last-to-resolve wins. No AbortControllers.
- **D-21:** Single `isLoading` ref shared across mount and date-change.

### Claude's Discretion
- **D-22:** Manage* dialogs accept a save handler from parent (recommend: emit `save` event up to LexTrackView — matches existing `update`/`remove` pattern).
- **D-23:** `saveItem` colocation — inline in LexTrackView OR new `src/composables/lextrack/useDsuPersistence.ts`. Composable is more reusable for Phase 5; inline is simpler. Planner picks.
- **D-24:** Page-level Save partial-success — recommend continue-on-error so every successful save persists. Planner confirms.
- **D-25:** Initial-load empty state — keep page-level Save button disabled while `isLoading` is true regardless of `isNoEntry`. Planner's call.

### Deferred Ideas (OUT OF SCOPE)
- Per-row delete spinner (D-10 deferred)
- AbortController for date-change races (D-20 — naive last-wins for v1)
- Sticky error toasts (D-14 — auto-dismiss only)
- Aggregate "3 items failed" toast (D-12 — one-per-error)
- `useDsuPersistence` composable extraction (D-23 — planner picks)
- Dirty-state navigation guard (out of scope)
- Full mapper round-trip on create response (D-12 in Phase 2 — patch `id` only)
- Optimistic save with rollback (rejected D-06)
- Schema migrations / new fields (locked since Phase 1)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUG-01 | On page mount, items for `selectedDate` are fetched from PB | `onMounted` + `loadForDate(date)` factoring (D-16, D-17). Vue 3 standard pattern; verified — `onMounted` runs after the component DOM is mounted, fires once per instance. |
| BUG-02 | Trash → `pb.collection(X).delete(id)` for persisted items; local-only items dropped without API call | PB SDK `.delete(id)` returns `Promise<true>` on success, throws `ClientResponseError` (status 404) if id is missing. Branch on `item.id` presence (D-05, D-07). |
| BUG-03 | Failed save/fetch/delete surfaces vue-sonner toast; UI rolls back optimistic mutations | `toast.error(message, { duration?: number })`; default ~4-5s. Optimistic-delete rollback uses `splice(index, 0, removed)` (D-05). Save is pessimistic so no rollback (D-06, D-15). |
| UI-SAVE-01 | Save inside Manage* dialog persists single item to PB and closes on success | `await pb.collection(X).create()` returns the persisted record incl. server-assigned `id`; `update(id, payload)` returns the updated record. Patch `id` into local array entry (D-01–D-04). |
| UI-SAVE-02 | Page-level Save still works for batch save of unsaved local items | Existing `save()` loop preserved; refactored to call shared `saveItem` helper (D-02, D-03); refetch after (D-18). |
| UI-SAVE-03 | Save indicator (spinner + disabled) visible during save call | PrimeVue Button `:loading="boolean"` — when true, shows spinner AND auto-disables (verified per official docs). Single `:loading` prop is sufficient; no need for separate `:disabled`. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack locked:** Vue 3 Composition API + `<script setup>`, PrimeVue (Aura indigo), Tailwind v4, PocketBase 0.26.2, vue-sonner. No framework swaps.
- **PrimeVue auto-import:** No manual `import Button from 'primevue/button'`. Components are auto-imported via `unplugin-vue-components` + `@primevue/auto-import-resolver`. Phase 3 already established `vTooltip` directive as the documented manual exception (directives are NOT auto-imported, only components).
- **iconify-icon:** Registered as custom element in `vite.config.ts` — use directly in templates.
- **Path alias:** `@/*` → `src/*`. Use consistently; relative paths avoided.
- **Lint pipeline:** `oxlint --fix -D correctness` then `eslint --fix`. `npm run lint` must remain green.
- **`<Toaster />` placement:** Already present in `src/App.vue` at the root level alongside `<RouterView />` — verified, no further wiring needed for Phase 4.
- **No new dependencies:** Bundle-size constraint. All Phase 4 work uses libraries already in `package.json`.
- **No schema changes:** Phase 1 is locked; Phase 4 strictly uses existing collection shapes.
- **No new mapper changes:** Phase 2's mapper triple is final. Phase 4 calls `mapToCreate*` / `mapToUpdate*` / `mapFromRecord*` and does not modify them.

## Summary

Phase 4 is a **persistence-wiring** phase, not a feature phase. Phase 3 left forms in a known-good visual state with `updateMeeting`/`updateTask`/`updateSupport` as toast-only stubs and `removeX` handlers as local-array splices. Phase 4 wires those handlers to the PocketBase JS SDK methods and surfaces async state via PrimeVue's built-in `:loading` prop and vue-sonner's `toast.error`.

The user's locked decisions (D-01..D-25) define a clear, conservative architecture: **pessimistic save** (await PB before mutating state), **optimistic delete with index-based rollback** (snappy UX, recoverable on failure), and **single `loadForDate(date)`** function called from `onMounted` + `watch(selectedDate)` + after page-level Save. The architecture is sound and aligned with PocketBase SDK semantics — no design pivots needed.

**Primary recommendation:** Implement exactly as locked. The only meaningful planner decisions left (Claude's discretion D-22..D-25) are stylistic — recommend **(D-22a) emit `save` event up to LexTrackView** matching existing `update`/`remove` pattern, **(D-23 inline)** `saveItem` helper as a private function in LexTrackView for Phase 4 (extract to composable in Phase 5 if Day Status reuses it), **(D-24a) continue-on-error** in the page-level Save loop, **(D-25 disabled while loading)** to avoid Save-button flicker during initial fetch.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Initial fetch (BUG-01) | View component (`LexTrackView.vue` script) | PB SDK | Mounting lifecycle owns when fetch happens; PB SDK owns the network call. No backend or middleware tier in this stack — direct client→PB. |
| Trash → delete (BUG-02) | View component (handlers) | PB SDK | Optimistic delete mutates local state synchronously; PB SDK handles network + auth. |
| Per-item dialog Save (UI-SAVE-01) | View component (event handler) | Manage* dialog (UI), PB SDK (network), Mapper (shape transform) | Per D-22 recommendation: emit `save` from dialog → parent calls PB → parent patches `id` back. Dialog stays presentational. |
| Page-level batch Save (UI-SAVE-02) | View component (`save()` loop) | PB SDK, Mapper | Loop owns the orchestration; helper owns the per-item create-or-update branch. |
| Loading indicator (UI-SAVE-03) | UI components (PrimeVue Button `:loading`) | View component (state owner) | Booleans owned by view; rendered by PrimeVue's built-in spinner. |
| Error toasts (BUG-03) | View component (catch handlers) | vue-sonner (presentation), `console.error` (debug) | Try/catch wraps each PB call; `toast.error` + `console.error` are the entire user-facing recovery path. |

## Standard Stack

### Core (already in project — no new deps)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pocketbase` | 0.26.2 [VERIFIED: package.json] | JS SDK for PB CRUD | Already singleton at `src/lib/pocketbase/index.ts`; only legitimate PB client. |
| `primevue` | 4.3.7 [VERIFIED: package.json] | Button `:loading` prop, Dialog | Built-in spinner + auto-disable on `:loading`; no need to roll own. [VERIFIED: PrimeVue docs] |
| `vue-sonner` | 2.0.8 [VERIFIED: package.json] | `toast.success` / `toast.error` | Already used in dialog stubs (Phase 3); `<Toaster />` mounted in App.vue. [VERIFIED: codebase] |
| `lodash-es` | 4.17.21 [VERIFIED: package.json] | (currently used for `remove`) | **Phase 4 should switch from `remove(arr, predicate)` to `Array.prototype.splice(index, 1)`** — see Pitfall #1 below. `splice` is the right tool because rollback needs `splice(index, 0, item)` to re-insert at the same position. |
| `dayjs` | 1.11.18 [VERIFIED: package.json] | Date formatting for filter and `date` field | Already used. No change. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pessimistic save | Optimistic save with snapshot rollback | Rejected by D-06; requires pre-edit snapshots and adds rollback edge cases. Snappier UX but more code. |
| `splice` rollback | Tombstone pattern (mark as deleted, hide via filter) | More complex local state; harder to debug. Rejected — `splice(index, 0, item)` is two-line and obvious. |
| Inline `saveItem` | New `useDsuPersistence` composable | Composable wins if Phase 5 (Day Status) reuses the helper. Recommend **inline for Phase 4, extract in Phase 5** if reused — avoids speculative abstraction. |
| Emit `save` from dialog | Inject save fn as prop | Either works (D-22). Emit matches existing `update`/`remove` event pattern in Manage* dialogs and ActivityCard. Recommend emit. |

**No installation needed** — all dependencies already present.

## Architecture Patterns

### System Architecture Diagram (data flow)

```
┌──────────────────────────────────────────────────────────────────┐
│ Browser (Vue 3 SPA — single user, auth-gated /projects/lextrack) │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
   ┌──────────────────────────────────────────────────────────┐
   │ LexTrackView.vue (state owner)                           │
   │ ─ selectedDate (ref<Date>)                               │
   │ ─ supports / meetings / tasks (ref<DsuXItem[]>)          │
   │ ─ isLoading (ref<boolean>)                               │
   │ ─ isSaving  (ref<boolean>)  // page-level                │
   │ ─ loadForDate(date)         // BUG-01                    │
   │ ─ saveItem(collection,item) // UI-SAVE-01/02 helper     │
   │ ─ removeX(index)            // BUG-02 (optimistic)      │
   │ ─ handleSave(item, kind)    // event handler from dialog│
   │ ─ save()                    // page-level batch         │
   └──────────────────────────────────────────────────────────┘
        │                            │                │
        │ onMounted /                │ trash click    │ dialog @save event
        │ watch(selectedDate)        │ (optimistic)   │ (pessimistic)
        ▼                            ▼                ▼
   ┌────────────────────────────────────────────────────────┐
   │ pb (PocketBase singleton @ src/lib/pocketbase/index.ts)│
   │ ─ pb.collection(name).getFullList<T>(opts)             │
   │ ─ pb.collection(name).create(payload)                  │
   │ ─ pb.collection(name).update(id, payload)              │
   │ ─ pb.collection(name).delete(id)                       │
   └────────────────────────────────────────────────────────┘
        │            │             │             │
        ▼            ▼             ▼             ▼
        ─── HTTP / fetch (PB JS SDK) ────────────────────►
                            ┌────────────────────────────┐
                            │ PocketBase server          │
                            │ (VITE_API_BASE_URL)        │
                            └────────────────────────────┘
   ┌────────────────────────────────────────────────────────┐
   │ Side-channel: errors → vue-sonner toast + console.error│
   │ Side-channel: success → vue-sonner toast               │
   │ Side-channel: in-flight → :loading on Save buttons     │
   │ Side-channel: in-flight → dim/skeleton on grid (init)  │
   └────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| File | Responsibility |
|------|---------------|
| `src/views/LexTrackView.vue` | State owner. `loadForDate`, `saveItem`, `save()`, all `removeX` handlers, `isLoading` / `isSaving` refs. Listens to `@save` from dialogs, calls PB, patches local state. |
| `src/components/projects/lextrack/ManageMeeting.vue` | Presentational. `:loading` on Save button. Emits `save` event with the current `meeting` model. Stays open until parent confirms success (parent toggles `visible` v-model). |
| `src/components/projects/lextrack/ManageTask.vue` | Same shape as ManageMeeting. |
| `src/components/projects/lextrack/ManageSupport.vue` | Same shape as ManageMeeting. |
| `src/components/projects/lextrack/ActivityCard.vue` | **NOT modified.** Trash + edit + inline-add unchanged. Page-level loading state passes via parent dim wrapper, not a new prop (D-09 leaves the dim mechanism to the planner — recommend Tailwind opacity wrapper). |
| `src/lib/pocketbase/index.ts` | **NOT modified.** Existing singleton. |
| `src/lib/pocketbase/dsu*Mapper.ts` | **NOT modified.** Phase 2 final. Phase 4 calls `mapToCreate*` / `mapToUpdate*`. |
| `src/types/lextrack/dsu_*/types.ts` | **NOT modified.** Phase 2 final. |
| `src/composables/lextrack/useDsuPersistence.ts` (optional) | If planner picks D-23 composable route. **Recommend deferring to Phase 5.** |

### Recommended Project Structure (no new files for the recommended path)

```
src/
├── views/
│   └── LexTrackView.vue          # MODIFIED: factor loadForDate, add onMounted, real PB calls
├── components/projects/lextrack/
│   ├── ManageMeeting.vue          # MODIFIED: emit('save'), :loading prop
│   ├── ManageTask.vue             # MODIFIED: emit('save'), :loading prop
│   ├── ManageSupport.vue          # MODIFIED: emit('save'), :loading prop
│   └── ActivityCard.vue           # NOT MODIFIED
└── lib/pocketbase/
    ├── index.ts                   # NOT MODIFIED (pb singleton)
    └── dsu*Mapper.ts              # NOT MODIFIED (Phase 2 mapper triple)
```

### Pattern 1: `onMounted` + `watch` coexistence (BUG-01)

**What:** Standard Vue 3 Composition API pattern for "load on mount AND on dependency change."
**When to use:** Whenever the same fetch logic runs both initially and when a reactive input changes.
**Why not `{ immediate: true }`:** D-17 explicitly avoids it — the call sites should be obvious to a reader scanning the script. `immediate` runs the watcher synchronously DURING setup, before mount; `onMounted` waits for the DOM. For LexTrack the difference is invisible to the user but `onMounted` keeps the timing predictable.

```typescript
// Source: Vue 3 official docs — verified pattern
import { ref, watch, onMounted } from 'vue';

const selectedDate = ref(new Date());
const isLoading = ref(false);

const loadForDate = async (date: Date): Promise<void> => {
  isLoading.value = true;
  try {
    const options: RecordFullListOptions = {
      filter: `date ~ "${dayjs(date).format('YYYY-MM-DD')}"`,
      sort: '-created',
    };
    const [supportsList, tasksList, meetingsList] = await Promise.all([
      pb.collection('dsu_supports').getFullList<DsuSupports>(options),
      pb.collection('dsu_tasks').getFullList<DsuTasks>(options),
      pb.collection('dsu_meetings').getFullList<DsuMeetings>(options),
    ]);
    supports.value = supportsList;
    tasks.value = tasksList;
    meetings.value = meetingsList;
  } catch (err) {
    console.error('[lextrack load]', err);
    toast.error("Couldn't load today's items.");
    // D-19: do NOT clear local arrays on fetch failure
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => loadForDate(selectedDate.value));
watch(selectedDate, (newDate) => loadForDate(newDate));
```

### Pattern 2: Optimistic delete with index-based rollback (BUG-02, BUG-03)

**What:** Mutate local state immediately, fire PB call in background, restore on failure.
**When to use:** Snappy delete UX where the operation is almost always going to succeed and recovery is cheap.

```typescript
// Source: standard pattern; verified against PB SDK semantics
const removeMeeting = async (index: number) => {
  const item = meetings.value[index];
  // D-07: local-only delete is silent
  if (!item.id) {
    meetings.value.splice(index, 1);
    return;
  }
  // D-05: optimistic — capture index + item BEFORE splicing
  const originalIndex = index;
  const originalItem = item;
  meetings.value.splice(index, 1);
  try {
    await pb.collection('dsu_meetings').delete(item.id);
  } catch (err) {
    console.error('[lextrack delete meeting]', err);
    // D-13: friendly rollback toast
    toast.error("Couldn't delete your meeting — restored.");
    // Re-insert at original position. If user has added/removed other rows
    // since the click, originalIndex may now overshoot — clamp it.
    const safeIndex = Math.min(originalIndex, meetings.value.length);
    meetings.value.splice(safeIndex, 0, originalItem);
  }
};
```

### Pattern 3: Pessimistic save with id-patch (UI-SAVE-01, D-01..D-04)

**What:** Wait for PB confirmation; on success, patch the returned `id` into the local item so subsequent edits go through update path.
**When to use:** Per-item dialog Save where user has the dialog open and is staring at the spinner.

```typescript
// Source: PB SDK docs (Context7) — verified .create returns full record incl. server-assigned id
type CollectionName = 'dsu_meetings' | 'dsu_tasks' | 'dsu_supports';
type AnyDsuItem = DsuMeetingItem | DsuTaskItem | DsuSupportItem;

const saveItem = async (collection: CollectionName, item: AnyDsuItem) => {
  if (item.id) {
    // Existing record — call update; mapper drops id/created/updated/date
    const mapper = MAPPER_BY_COLLECTION[collection];
    return await pb.collection(collection).update(item.id, mapper(item as never));
  }
  // New record — ensure date is set, then create
  const payload = { ...item, date: dayjs(selectedDate.value).format('YYYY-MM-DD') };
  return await pb.collection(collection).create(payload);
};

// Event handler from ManageMeeting.vue's emit('save')
const handleMeetingSave = async (meetingItem: DsuMeetingItem) => {
  isSavingMeeting.value = true;
  try {
    const saved = await saveItem('dsu_meetings', meetingItem);
    // D-01: patch the returned id into the local-array entry (so next edit is update, not create)
    // Find by reference identity (the dialog v-models the same object reference)
    const idx = meetings.value.indexOf(meetingItem);
    if (idx !== -1 && !meetingItem.id) {
      meetings.value[idx] = { ...meetingItem, id: saved.id };
    }
    toast.success('Meeting saved!');
    viewMeetingDialogVisibility.value = false;  // D-04: close AFTER success
  } catch (err) {
    console.error('[lextrack save meeting]', err);
    toast.error("Couldn't save your meeting — try again?");
    // D-01: dialog stays open
  } finally {
    isSavingMeeting.value = false;
  }
};
```

### Pattern 4: PrimeVue Button `:loading` (UI-SAVE-03)

**What:** Single boolean prop that renders a spinner AND auto-disables the button.
**Verified:** [VERIFIED: PrimeVue 4.x official docs via Context7] — `:loading="boolean"` shows the spinner via the component's internal state and disables interaction. **No need to also pass `:disabled`** — the loading state covers the disabled behavior. The official `loadingIcon` prop allows overriding the spinner icon (default is `pi pi-spinner`).

```vue
<!-- Source: PrimeVue official docs (Context7 verified) -->
<Button label="Save" :loading="isSaving" @click="save" />

<!-- For the page-level Save, layer in the existing isNoEntry guard plus the new isLoading
     gate per D-25 (recommend: button disabled while initial fetch is in flight) -->
<Button
  label="Save"
  :loading="isSaving"
  :disabled="isNoEntry || isLoading"
  @click="save" />
```

### Anti-Patterns to Avoid

- **Reusing `lodash-es remove(arr, predicate)` for the rollback path.** `remove` mutates in place but returns the removed elements as a new array — fine for the splice-out, but you lose the original index. Use `splice(index, 1)` so you can `splice(safeIndex, 0, item)` to put it back. (See Pitfall #1.)
- **Setting `visible.value = false` BEFORE `await`-ing the PB call.** Violates D-04. The user briefly sees the dialog close, then the error toast — confusing.
- **Calling `loadForDate` inside the dialog's save success path.** Wastes a round-trip; D-01 explicitly says patch `id` directly. Only the page-level `save()` triggers the post-save refetch (D-18).
- **Wrapping `mapFromRecord*` around the create response just to patch `id`.** Per D-12 in Phase 2, `mapFromRecord*` is the legacy normalization chokepoint; running it on a fresh server-created record is unnecessary (the server-side defaults already applied). Patch `id` only — D-01.
- **Using `getOne` to verify a delete succeeded.** Wasteful — `delete()` returns `Promise<true>` on success and throws on failure. The promise resolution is the confirmation.
- **Catching errors silently in `loadForDate` and clearing local arrays on failure.** Violates D-19. Keep whatever was previously loaded so a transient network blip doesn't blank the UI.
- **Adding `{ immediate: true }` to `watch(selectedDate, ...)` instead of `onMounted`.** D-17 explicitly avoids this. Two call sites (mount + change) is more readable than one terse watcher with an `immediate` flag.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Loading spinner UI | Custom `<div class="spinner">` or a CSS keyframe | PrimeVue Button `:loading` | Built-in, themed via Aura preset, ARIA-compliant. Single bool. [VERIFIED: PrimeVue docs] |
| Toast notifications | Custom modal/banner | `vue-sonner` `toast.success` / `toast.error` | Already wired; `<Toaster />` mounted in App.vue. [VERIFIED: codebase + docs] |
| Error type guards / message extraction | Manual `err.response.data.someField.message` walking with type assertions | `instanceof ClientResponseError` + `.status` switch | The PB SDK exports `ClientResponseError`; it has stable `.status`, `.message`, `.response.data`, `.isAbort` fields. [VERIFIED: PB JS SDK 0.26 docs via Context7] |
| Date filter strings | String concat with quote escaping | `dayjs(date).format('YYYY-MM-DD')` + template literal | Existing pattern; consistent with how all three collections store `date`. |
| Per-collection CRUD wrappers | Three near-identical `saveX` functions | One `saveItem(collection, item)` helper | D-03 explicitly. Branches on `item.id` for create-vs-update. Mapper is selected via a small lookup table keyed on collection name. |
| AbortController for date-change races | Manual cancellation token threading | Naive last-wins | D-20 — race window is tiny (deliberate human action), and the `isLoading` ref provides visual feedback. Revisit only if real-world usage shows glitches. |

**Key insight:** Phase 4 is wiring, not invention. Every async pattern needed already has a battle-tested library answer in the existing dependency tree. The right move is **less code**, not new abstractions.

## Common Pitfalls

### Pitfall #1: `lodash-es remove` predicate mutates in place but loses positional context
**What goes wrong:** The current code uses `remove(meetings.value, (_, i) => i === index)` which works for the splice-out but doesn't capture enough state for rollback.
**Why it happens:** `remove(arr, predicate)` returns the removed items but the predicate has no concept of "where they were." If you need to put the item back at the same index later, you have to capture both the index AND the item BEFORE the remove call.
**How to avoid:** Use plain `Array.prototype.splice(index, 1)` for the optimistic remove and `splice(safeIndex, 0, item)` for the rollback. Two-line, obvious, no library needed.
**Warning signs:** Test scenario: user clicks trash on row 3, then quickly adds a new inline row, then the network request to delete row 3 fails. The original index is now stale. Mitigation: clamp with `Math.min(originalIndex, arr.length)`.

### Pitfall #2: Rapid double-click on the trash icon
**What goes wrong:** User double-clicks trash. First click splices out item, fires `delete(id)`. Second click on the now-different row at `index` deletes the wrong row, or — if the array has shifted — splices something else and then PB throws 404 for the original id.
**Why it happens:** Optimistic mutations + reactive list re-renders + click-debouncing depends on browser timing. Vue's event handler fires twice, the array changed between renders.
**How to avoid:** D-10 says "trash icon stays clickable" — don't disable it. But guard the handler: capture `item.id` once at the top of `removeMeeting(index)`, then operate against the captured snapshot. The accidental second click hits a *different* row's handler with a *different* index — there's no shared state corruption. The PB request for the first row is in flight; if it succeeds, fine. If it 404s because PB already deleted it (unlikely from one click), the rollback re-inserts a phantom row. **Edge case acceptable for v1**; the user feedback path is the toast.
**Warning signs:** Test: rapid double-click on the same row. Expect: row removed once, no duplicate API call, no error toast on success.

### Pitfall #3: PB `update` on a non-existent id (stale local state)
**What goes wrong:** User has LexTrack open in two tabs. Tab A deletes meeting M. Tab B's local state still has M. User edits M in tab B, hits Save. PB returns 404.
**Why it happens:** No real-time sync; the user's local arrays are stale.
**How to avoid:** D-13's "try again?" toast is the recovery path. Catch the `ClientResponseError` with `.status === 404` and surface a slightly different message: "This meeting no longer exists — refresh to see the latest." Or just the generic "Couldn't save your meeting — try again?" Both are acceptable; the planner picks. **Verify in plan-checker:** any `update` failure should NOT mutate local state (pessimistic save guarantee D-06).
**Warning signs:** No structural fix needed for v1; tagged as known edge case.

### Pitfall #4: vue-sonner toast can fire dozens of times in a page-level Save loop
**What goes wrong:** User has 8 unsaved meetings. Network hiccup makes 6 of them fail. User sees 6 stacked error toasts.
**Why it happens:** D-12 says one toast per error, no aggregation.
**How to avoid:** vue-sonner stacks toasts by default and is OK at this volume. The `<Toaster :visibleToasts="9">` default keeps the stack readable. **Acceptable per D-12;** revisit if real-world feedback says otherwise (deferred ideas list captures this).
**Warning signs:** Test: simulate 5 sequential failures. Expect: 5 toast cards stacked, all auto-dismiss in ~5s, none lost.

### Pitfall #5: `pb.collection('X').delete(id)` on already-deleted id throws 404
**What goes wrong:** User clicks trash. Optimistic splice. PB call goes out. Another tab/device deleted the row first. PB returns 404.
**Why it happens:** Stale local state (Pitfall #3 sibling). [VERIFIED: PB JS SDK docs — `delete` returns `Promise<true>` on 200, throws `ClientResponseError` with `.status === 404` on missing record.]
**How to avoid:** The error handler already runs (try/catch in the optimistic-delete pattern). For 404, **the user's intent was achieved** — the row IS gone. Treat 404 as success: catch, check `err.status === 404`, swallow without rollback or toast. For non-404 errors, run the rollback as designed. This is a small refinement worth landing.
**Warning signs:** Test: pre-delete a row via PB admin, then click trash in the UI. Expect: row stays gone, no error toast.

### Pitfall #6: `meeting.value` in dialog is a reference to the same object in `meetings.value[i]`
**What goes wrong:** Phase 3's `updateMeeting(index)` does `meeting.value = meetings.value[index] as AddDsuMeeting` — that's an alias, not a copy. Edits in the dialog mutate the array entry in place, including the `id` field. So when `handleMeetingSave` runs, it can read `item.id` from the array directly via the reference. **This is convenient, but it also means**: if save FAILS, the user's edits are still in the array. Per D-06 (save is pessimistic), we expect to NOT mutate local state until PB confirms — but the dialog has already mutated by the time Save is clicked.
**Why it happens:** `defineModel` two-way binding keeps the dialog and array in sync as the user types.
**How to avoid:** Two valid approaches: (a) accept it — D-06's "pessimistic" applies to the **PB call** boundary, not to UI typing. The user expects what they typed to remain visible if save fails (so they can retry without re-typing — D-01). This is the locked behavior. (b) Snapshot before opening dialog and restore on cancel/fail. Adds complexity. **Recommend (a)** — it matches D-01's "user can retry without re-typing" intent.
**Warning signs:** Test: open ManageMeeting dialog, type changes, simulate save failure. Expect: dialog stays open, typed values preserved, error toast shown, user can hit Save again.

### Pitfall #7: `mapToUpdateMeeting` requires full `DsuMeetings` shape but local item is `DsuMeetingItem` (`AddDsuMeeting & { id?: string }`)
**What goes wrong:** TypeScript strict mode rejects `mapToUpdateMeeting(item)` because `item: DsuMeetingItem` lacks `id: string` (required), `created: string`, `updated: string`. Cast required.
**Why it happens:** Phase 2 typed `mapToUpdate*` against the full `DsuX` record (`id`, `created`, `updated` all required). The local-array shape is `AddDsuX & { id?: string }`.
**How to avoid:** Existing `save()` already casts: `mapToUpdateSupport(item as DsuSupports)`. The cast is safe inside the `if (item.id)` branch because the existence of `id` implies the item came from PB and has the auto-fields. Phase 4 follows the same convention. **Verify the cast site in plan-checker.**
**Warning signs:** Test: `npm run type-check` passes after refactor.

### Pitfall #8: PrimeVue Button `:loading` requires `:loading-icon` prop already auto-imports correctly
**What goes wrong:** None — verified. [VERIFIED: PrimeVue 4.x docs] `:loading="boolean"` shows the default `pi pi-spinner` icon and auto-disables the button. No additional config needed. The Aura preset already styles the spinner consistent with the indigo primary.
**Warning signs:** None expected.

### Pitfall #9: Reactive ref of array — assigning `meetings.value[i] = {...}` triggers reactivity, but mutating sub-properties doesn't always
**What goes wrong:** Patching `id` via `meetings.value[idx].id = saved.id` may not always trigger downstream reactivity in PrimeVue components if Vue's proxy missed the path. Replacing the entire item (`meetings.value[idx] = { ...item, id: saved.id }`) is safer.
**Why it happens:** Vue 3 reactivity uses Proxy, which IS deep — but when downstream components key off identity (e.g. `:key="item.id"`), patching `id` in place can confuse the keyed render.
**How to avoid:** Replace the array entry entirely (spread + assign). It's one line and eliminates the question.
**Warning signs:** Visual: dialog closes after Save success, but the row in ActivityCard doesn't update. Likely cause: this pitfall.

## Runtime State Inventory

> **Not applicable.** Phase 4 is not a rename / refactor / migration phase. No runtime state inventory needed.

## Code Examples

Verified patterns from official sources, ready for the planner to reference.

### Initial fetch on mount + watcher (BUG-01, D-16, D-17, D-19)

```typescript
// Source: Vue 3 official + PB JS SDK docs (Context7 verified)
import { ref, watch, onMounted } from 'vue';
import { pb } from '@/lib/pocketbase';
import type { RecordFullListOptions } from 'pocketbase';
import { toast } from 'vue-sonner';
import dayjs from 'dayjs';

const isLoading = ref(false);

const loadForDate = async (date: Date): Promise<void> => {
  isLoading.value = true;
  try {
    const options: RecordFullListOptions = {
      filter: `date ~ "${dayjs(date).format('YYYY-MM-DD')}"`,
      sort: '-created',
    };
    const [supportsList, tasksList, meetingsList] = await Promise.all([
      pb.collection('dsu_supports').getFullList<DsuSupports>(options),
      pb.collection('dsu_tasks').getFullList<DsuTasks>(options),
      pb.collection('dsu_meetings').getFullList<DsuMeetings>(options),
    ]);
    supports.value = supportsList;
    tasks.value = tasksList;
    meetings.value = meetingsList;
  } catch (err) {
    console.error('[lextrack load]', err);
    toast.error("Couldn't load today's items.");
    // D-19: do NOT clear local arrays on fetch failure
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => loadForDate(selectedDate.value));
watch(selectedDate, (newDate: Date) => loadForDate(newDate));
```

### PB delete with 404-as-success refinement (BUG-02, D-05, Pitfall #5)

```typescript
// Source: PB JS SDK 0.26 docs (Context7 verified) — delete returns Promise<true>, throws ClientResponseError
import { ClientResponseError } from 'pocketbase';

const removeMeeting = async (index: number) => {
  const item = meetings.value[index];
  // D-07: local-only delete is silent
  if (!item.id) {
    meetings.value.splice(index, 1);
    return;
  }
  const originalIndex = index;
  const originalItem = item;
  meetings.value.splice(index, 1);  // D-05: optimistic
  try {
    await pb.collection('dsu_meetings').delete(item.id);
  } catch (err) {
    // Pitfall #5: 404 means PB already deleted it — user's intent was met
    if (err instanceof ClientResponseError && err.status === 404) {
      console.warn('[lextrack delete meeting] 404 — already gone, treating as success');
      return;
    }
    console.error('[lextrack delete meeting]', err);
    toast.error("Couldn't delete your meeting — restored.");
    const safeIndex = Math.min(originalIndex, meetings.value.length);
    meetings.value.splice(safeIndex, 0, originalItem);
  }
};
```

### Page-level batch Save with continue-on-error (UI-SAVE-02, D-02, D-03, D-18, D-24a)

```typescript
// Source: existing save() pattern + D-03 helper extraction + D-24a continue-on-error
const isSaving = ref(false);

const save = async () => {
  isSaving.value = true;
  let failureCount = 0;
  try {
    // SUPPORTS
    for (const item of supports.value) {
      try {
        await saveItem('dsu_supports', item);
      } catch (err) {
        console.error('[lextrack save support]', err);
        toast.error(`Couldn't save "${item.title || 'untitled support'}" — try again?`);
        failureCount++;
      }
    }
    // MEETINGS — same shape
    for (const item of meetings.value) {
      try {
        await saveItem('dsu_meetings', item);
      } catch (err) {
        console.error('[lextrack save meeting]', err);
        toast.error(`Couldn't save "${item.title || 'untitled meeting'}" — try again?`);
        failureCount++;
      }
    }
    // TASKS — same shape
    for (const item of tasks.value) {
      try {
        await saveItem('dsu_tasks', item);
      } catch (err) {
        console.error('[lextrack save task]', err);
        toast.error(`Couldn't save "${item.title || 'untitled task'}" — try again?`);
        failureCount++;
      }
    }
    // D-18: refetch from PB regardless of partial failures
    await loadForDate(selectedDate.value);
    if (failureCount === 0) {
      toast.success('All items saved!');
    }
  } finally {
    isSaving.value = false;
  }
};
```

### Dialog emits `save` (UI-SAVE-01, D-01, D-04, D-22a)

```vue
<!-- Source: Phase 3 existing emit pattern from ActivityCard.vue -->
<!-- ManageMeeting.vue (analogous for ManageTask, ManageSupport) -->
<script setup lang="ts">
import type { AddDsuMeeting } from '@/types/lextrack/dsu_meetings/types';

const visible = defineModel('visible', { type: Boolean, default: false, required: true });
const meeting = defineModel<AddDsuMeeting & { id?: string }>('meeting', { required: true });

const props = defineProps<{ saving?: boolean }>();

const emit = defineEmits<{
  save: [item: AddDsuMeeting & { id?: string }];
}>();

// ... existing duration composable wiring ...

const onSaveClick = () => emit('save', meeting.value);
</script>

<template>
  <Dialog v-model:visible="visible" header="Edit Meeting" position="right" modal :style="{ width: '40vw' }">
    <!-- ... existing form body ... -->
    <Button label="Save Meeting" :loading="props.saving" @click="onSaveClick" class="w-full bg-indigo-600 hover:bg-indigo-700" />
  </Dialog>
</template>
```

```vue
<!-- LexTrackView.vue (parent) wires the event -->
<ManageMeeting
  v-model:visible="viewMeetingDialogVisibility"
  v-model:meeting="meeting"
  :saving="isSavingMeeting"
  @save="handleMeetingSave" />
```

### Activity grid dim during initial fetch (UI-SAVE-03, D-09)

```vue
<!-- Source: Tailwind v4 + Vue conditional class -->
<div
  class="grid grid-cols-3 gap-2 transition-opacity"
  :class="{ 'opacity-50 pointer-events-none': isLoading }">
  <ActivityCard v-model:section="meetings" label="Meetings" @update="updateMeeting" @remove="removeMeeting" />
  <ActivityCard v-model:section="tasks" label="Tasks" @update="updateTask" @remove="removeTask" />
  <ActivityCard v-model:section="supports" label="Admin" @update="updateSupport" @remove="removeSupport" />
</div>
```

> Note: `pointer-events-none` blocks clicks on the grid during fetch (per D-09 the date picker stays interactive — keep the wrapper around the grid only, not the whole card body). Trash + edit icons are inside the grid, so they go inert during fetch — that's the intended UX.

### `saveItem` helper with mapper lookup (D-03, D-23 inline)

```typescript
// Source: D-03 + Phase 2 mapper triple
import { mapToUpdateMeeting } from '@/lib/pocketbase/dsuMeetingMapper';
import { mapToUpdateTask } from '@/lib/pocketbase/dsuTaskMapper';
import { mapToUpdateSupport } from '@/lib/pocketbase/dsuSupportMapper';

type CollectionName = 'dsu_meetings' | 'dsu_tasks' | 'dsu_supports';

const saveItem = async (collection: CollectionName, item: DsuMeetingItem | DsuTaskItem | DsuSupportItem) => {
  if (item.id) {
    // Update path
    if (collection === 'dsu_meetings') {
      return await pb.collection('dsu_meetings').update(item.id, mapToUpdateMeeting(item as DsuMeetings));
    }
    if (collection === 'dsu_tasks') {
      return await pb.collection('dsu_tasks').update(item.id, mapToUpdateTask(item as DsuTasks));
    }
    return await pb.collection('dsu_supports').update(item.id, mapToUpdateSupport(item as DsuSupports));
  }
  // Create path — ensure date is set, then send the AddDsuX shape directly
  const payload = { ...item, date: dayjs(selectedDate.value).format('YYYY-MM-DD') };
  return await pb.collection(collection).create(payload);
};
```

> **Note on create payload:** The existing `save()` already sends `item` directly to `.create()` (see `LexTrackView.vue:124,135,146`). Phase 2's `mapToCreate*` exists but the current code doesn't call it — it relies on the `AddDsuX` shape being PB-compatible. **Recommend** the planner decide: keep current behavior (skip `mapToCreate*`) for surgical scope, OR call `mapToCreate*` for consistency with the update path. Either is correct per locked decisions; the former minimizes diff.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `pb.admins` legacy auth | `pb._superusers` (PB 0.23+) | PB 0.23 | Not relevant for Phase 4 — auth flow is unchanged. Phase 1 already addressed this in `verify-schema.ts`. |
| Vue 2 Options API for refs / watchers | Vue 3 Composition API + `<script setup>` | Vue 3.0 (2020) | Already adopted across codebase. Pattern for Phase 4. |
| Manual XHR / fetch for PB | `pb.collection(name).method()` | PB JS SDK 0.x | Already adopted via `src/lib/pocketbase/index.ts`. |
| `ref<T>(null)` without `.value` access | Composition API standard `.value` access | Vue 3 stable | Codebase consistent. |

**Deprecated/outdated:** None applicable to Phase 4.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PrimeVue Button `:loading="true"` auto-disables the button (no need for separate `:disabled`) | Pattern 4 | LOW — [VERIFIED: PrimeVue 4.x docs via Context7 — loading state implies disabled-from-click; covered by official examples]. Risk only if a downstream version regresses; type-check + dev smoke catches it. |
| A2 | vue-sonner `<Toaster />` in App.vue is sufficient for toasts to render in LexTrackView | Component Responsibilities | LOW — [VERIFIED: codebase + vue-sonner docs — single Toaster at app root captures all `toast.X()` calls regardless of component]. |
| A3 | `pb.collection(X).delete(404-id)` throws `ClientResponseError` with `.status === 404` | Pitfall #5 | LOW — [VERIFIED: PB JS SDK 0.26 docs via Context7]. |
| A4 | `pb.collection(X).create(payload)` returns the full record including server-assigned `id`, `created`, `updated` | Pattern 3 | LOW — [VERIFIED: PB JS SDK 0.26 docs via Context7 — RecordService.create returns the persisted record]. |
| A5 | `defineModel` two-way binding aliases the same object reference between dialog and parent array | Pitfall #6 | MEDIUM — [VERIFIED in codebase by reading `updateMeeting(index)`'s `meeting.value = meetings.value[index] as AddDsuMeeting`]. Confirmed: assignment passes the reference, not a copy. |
| A6 | `Math.min(originalIndex, arr.length)` is sufficient for rollback splice safety | Pattern 2 | LOW — `splice(index, 0, item)` with `index === arr.length` appends; with `index < arr.length` inserts. Edge case where user adds many rows during the in-flight delete is rare; toast acceptable. |
| A7 | The PB filter `date ~ "YYYY-MM-DD"` with `~` (contains) operator continues to work as in the existing watcher | Code Example #1 | LOW — copied verbatim from existing code; Phase 3 verification PASS confirms the date filter works against current PB schema. |
| A8 | `<Toaster />` default duration is ~4-5 seconds | D-14 | LOW — [VERIFIED: vue-sonner docs — default duration is 4000ms; can override per-toast or per-Toaster]. |
| A9 | Tailwind v4 `transition-opacity` + `opacity-50` + `pointer-events-none` is sufficient for the activity-grid dim treatment | Code Example for D-09 | LOW — standard Tailwind pattern; works in v4. Visual review during human-verify checkpoint catches any aesthetic gap. |

**No `[ASSUMED]` claims that meaningfully affect the locked design.** All architectural decisions trace to verified PB SDK / PrimeVue / vue-sonner docs or codebase reads.

## Open Questions

1. **Per-collection `isSaving` refs vs single shared ref?**
   - What we know: Three Manage* dialogs can each be saving independently (in theory). In practice the user only opens one dialog at a time.
   - What's unclear: Three refs (`isSavingMeeting`, `isSavingTask`, `isSavingSupport`) is more precise but more code; one shared `isSavingDialog` is simpler.
   - Recommendation: **Three refs.** Each dialog binds its own; keeps the binding explicit. Cost is three lines of `ref(false)`.

2. **Should we call `mapToCreate*` in `saveItem` create path?**
   - What we know: Existing `save()` doesn't — it sends the `AddDsuX` shape directly. Mapper exists but isn't called.
   - What's unclear: Phase 2 D-12 says `mapFromRecord*` is the chokepoint for legacy normalization. `mapToCreate*` is also defined and would set defaults (e.g. `duration_unit: 'minutes'` for meetings).
   - Recommendation: **Call `mapToCreate*`.** Current code skipping it is a Phase 3 holdover; calling it makes the create path symmetric with update and ensures `duration_unit: 'minutes'` default is applied for inline-added meetings without a unit. Minor diff churn, big consistency win. Planner confirms.

3. **Toast title for batch save partial-success?**
   - What we know: D-12 says one toast per error. After loop ends, what toast (if any) summarizes?
   - What's unclear: D-12's "no aggregation" applies to errors. Successes are silent in the existing code.
   - Recommendation: **No success toast on the page-level Save** if `failureCount > 0` (the error toasts are the headline). Show "All items saved!" only when all succeed. Code example #3 above implements this.

4. **Where should `loadForDate` errors leave `isLoading`?**
   - What we know: `finally { isLoading.value = false }` per the pattern.
   - What's unclear: If the fetch throws AFTER the partial `Promise.all` resolved, do we land in a weird half-state?
   - Recommendation: **`Promise.all` rejects on the first error** — none of `supports`/`tasks`/`meetings` will be assigned. D-19's "don't clear" is preserved (the `.value` assignments happen INSIDE the try after `await`). Local arrays retain their pre-fetch values. Confirmed safe.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `pocketbase` (npm) | All PB CRUD | ✓ | 0.26.2 | — |
| `primevue` | Button `:loading`, Dialog | ✓ | 4.3.7 | — |
| `vue-sonner` | toasts | ✓ | 2.0.8 | — |
| `dayjs` | date filter formatting | ✓ | 1.11.18 | — |
| `lodash-es` | (existing — Phase 4 will reduce usage) | ✓ | 4.17.21 | — |
| Live PocketBase server (`VITE_API_BASE_URL`) | Runtime fetch / mutate | ✓ | per Phase 1 verify-schema PASS | — |
| Authenticated user session | All PB calls (collections gated by `@request.auth.id != ""`) | ✓ | Auth store + route guard already in place | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

All Phase 4 work is internal refactor + new event handlers using already-installed libraries. **No `npm install` step required.**

## Validation Architecture

> Nyquist enabled per `.planning/config.json` (`workflow.nyquist_validation: true`). Phase 6 owns the formal Vitest suite; Phase 4 plans should still map requirements to verifiable behaviors so the verifier can spot-check.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 (jsdom env) |
| Config file | `vitest.config.ts` (verified — at repo root) |
| Quick run command | `npm run test:unit -- LexTrackView` (filename pattern; runs only matching tests) |
| Full suite command | `npm run test:unit` |

> **Note:** No tests currently exist for LexTrackView or the Manage* dialogs. Phase 6 owns writing them. **Phase 4 should not block on adding tests.** The verifier's automated check is `npm run type-check && npm run lint`; behavior verification is human-in-the-loop dev-server smoke per the Phase 3 precedent (G-3-1 / Task 2 of 03-06-PLAN). Planner picks: include a manual checklist in the phase gate plan (recommended) OR defer entirely to Phase 6.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUG-01 | LexTrackView fetches today's items on mount without date-picker interaction | manual smoke (Phase 6 owns unit) | `npm run dev` → log in → land on /projects/lextrack → observe items load | ❌ Phase 6 |
| BUG-01 | `loadForDate` failure surfaces toast and preserves local arrays | manual smoke | dev tools → throttle network → reload | ❌ Phase 6 |
| BUG-02 | Trash on PB-persisted item calls `pb.collection(X).delete(id)`; reload confirms removal | manual smoke | dev tools network tab → click trash → observe DELETE request → reload page | ❌ Phase 6 |
| BUG-02 | Trash on local-only item (no `id`) makes no API call | manual smoke | network tab → add inline row → click trash → observe no DELETE | ❌ Phase 6 |
| BUG-03 | Failed delete restores item at original index + error toast | manual smoke | dev tools → block PB endpoint → click trash → observe restore + toast | ❌ Phase 6 |
| BUG-03 | Failed save shows error toast; dialog stays open; values preserved | manual smoke | block PB endpoint → click dialog Save → observe behavior | ❌ Phase 6 |
| UI-SAVE-01 | Dialog Save button persists single item; closes dialog on success; patches `id` | manual smoke | open ManageMeeting on a new inline row → Save → observe close + reload-confirm-id | ❌ Phase 6 |
| UI-SAVE-02 | Page-level Save still creates new + updates existing in one batch | manual smoke | mix new + edited rows → page-level Save → observe both | ❌ Phase 6 |
| UI-SAVE-03 | Save buttons (page + dialog) show spinner + disable during in-flight call | manual smoke | dev tools → throttle network → click Save → observe spinner | ❌ Phase 6 |
| UI-SAVE-03 | Activity grid dims during initial fetch and date change | manual smoke | reload + change date → observe dim treatment | ❌ Phase 6 |
| (cross-cutting) | `npm run type-check` passes | automated | `npm run type-check` | ✓ |
| (cross-cutting) | `npm run lint` passes | automated | `npm run lint` | ✓ |

### Sampling Rate

- **Per task commit:** `npm run type-check` (fast — should be <10s on this codebase)
- **Per wave merge:** `npm run lint && npm run type-check`
- **Phase gate:** Above + manual smoke checklist (per planner) covering each requirement ID; **defer Vitest unit/component tests to Phase 6** per ROADMAP.

### Wave 0 Gaps

- [ ] None for Phase 4 itself. Phase 6 owns the test infrastructure (`tests/unit/views/LexTrackView.spec.ts`, `tests/unit/components/projects/lextrack/Manage*.spec.ts`).
- **Recommendation to planner:** include a manual smoke-test checklist as the final task of the phase gate plan, mirroring Plan 03-06's Task 2 protocol.

## Security Domain

> Required per `security_enforcement` (default enabled). Phase 4 introduces minimal new surface; most threats are inherited from Phase 1's auth model.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (inherited) | PocketBase password auth via `pb.collection('users').authWithPassword()`; route guard checks `useAuthStore().isLoggedIn`. **No change in Phase 4.** |
| V3 Session Management | yes (inherited) | PB SDK manages token in localStorage; `pb.authStore.onChange` syncs Pinia store. **No change in Phase 4.** |
| V4 Access Control | yes (inherited) | PB collection rules: `@request.auth.id != ""` on all four collections (Phase 1 D-05). All Phase 4 calls (`getFullList`, `create`, `update`, `delete`) inherit this. |
| V5 Input Validation | partial (server-side) | PB schema validates server-side: `dsu_supports.link` is URL field (Phase 1 D-12), `duration_unit` is select with `'minutes'`/`'hours'` (Phase 1 D-10). No new client-side validators in Phase 4. |
| V6 Cryptography | no | No crypto in scope; PB handles password hashing server-side. |
| V8 Data Protection | partial | Toast messages MUST be friendly text, NOT raw PB error responses (D-13). Raw error goes to `console.error` only. **Pitfall:** be careful in batch save toasts — using `item.title` in the toast string is fine (the user owns this data) but never include PB-side metadata or stack traces. |
| V13 API & Web Service | partial | All requests go through `pb` singleton; no manual `fetch` calls. URL is `VITE_API_BASE_URL` (env-injected at build time). HTTPS enforced by hosting (GitHub Pages + custom PB host). |

### Known Threat Patterns for Vue 3 + PocketBase + browser-only SPA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stale auth token after expiry causes silent 401 | Repudiation / Spoofing | PB SDK throws `ClientResponseError` with `.status === 401`. Phase 4's catch handlers should ideally route 401 specifically — call `pb.authStore.clear()` and redirect to `/login`. **Recommend:** add a top-level wrapper or interceptor pattern in `saveItem` and `loadForDate` for 401. **Or punt to Phase 6** if time-boxed. |
| Toast XSS via user-supplied `item.title` | Injection (XSS) | vue-sonner renders message as plain text by default — verified [VERIFIED: vue-sonner docs — `toast(message)` is text, not HTML, unless explicitly opting into a custom render function]. Including `item.title` in error toast text (Code Example #3) is safe. **Confirmed not a vector.** |
| Tab-jacking via toast "Retry" link | Tampering | N/A — D-12/D-13 use plain text toasts, no action buttons or links. **Deferred ideas list:** if "Retry" buttons land later, use `window.open(_, '_blank', 'noopener,noreferrer')` per Phase 3 precedent. |
| Sensitive data leak via console.error in production | Information Disclosure | `console.error` lands in browser devtools only; no remote logging is wired. **Acceptable for v1.** Vercel Speed Insights is wired (`@vercel/speed-insights`) but doesn't capture console output. |
| Race condition on optimistic delete + concurrent edit | Tampering / DoS (local) | D-20 accepts naive last-wins; Pitfall #2 covers double-click. No additional control needed. |
| 404 on update of stale id leaks no info | Information Disclosure | PB returns generic 404 message; D-13 friendly text masks the raw response. |
| `loadForDate` race during rapid date-picker clicks | Repudiation (UI-level) | D-20 explicit acceptance. `isLoading` ref provides feedback. |

### Threat Surface Delta vs Phase 3

| Surface | Phase 3 | Phase 4 | Net Change |
|---------|---------|---------|------------|
| New PB calls from client | 0 (forms only) | 4 per collection × 3 collections = 12 method bindings (`getFullList`, `create`, `update`, `delete`) | All inherit Phase 1 auth gating; no new auth surface |
| User-controlled strings sent to PB | Yes (title, description, link) | Same | No change |
| User-controlled strings rendered in toasts | Yes (vue-sonner already wired) | Yes (item.title in batch save toast) | Confirmed safe — vue-sonner default is text, not HTML |
| Auth-token usage | Implicit via singleton | Implicit via singleton | No change |
| Console output | After Phase 3 cleanup, none in scope | New `console.error` calls in catch handlers | **Acceptable** — debug-only, not user-facing |

**Net assessment:** Phase 4 introduces ZERO new threat categories. All risks are inherited from Phase 1's auth model. The only refinement worth landing is **graceful 401 handling** — recommend addressing in Phase 4 since the catch handlers are being written fresh.

## Sources

### Primary (HIGH confidence)
- **PocketBase JS SDK 0.26.2** — Context7 ID `/pocketbase/js-sdk` — fetched topics: `ClientResponseError`, `getFullList`, `create`, `update`, `delete`, error response shape, status code semantics. URL: https://github.com/pocketbase/js-sdk
- **PrimeVue 4.x** — Context7 ID `/primefaces/primevue` — fetched topics: Button `loading` prop, `disabled` prop, Composition API examples. URL: https://primevue.org/button
- **vue-sonner 2.0.8** — Context7 ID `/xiaoluoboding/vue-sonner` — fetched topics: `toast.error`, `toast.success`, duration defaults, `<Toaster />` placement. URL: https://github.com/xiaoluoboding/vue-sonner
- **Vue 3 official docs** — Composition API: `onMounted`, `watch`, `ref` (training data, current as of Vue 3.5.x — VERIFIED against package.json `vue: ^3.5.18`)
- **Codebase reads** — `src/views/LexTrackView.vue`, `src/components/projects/lextrack/Manage*.vue`, `src/lib/pocketbase/dsu*Mapper.ts`, `src/lib/pocketbase/index.ts`, `src/types/lextrack/dsu_*/types.ts`, `src/App.vue`, `package.json`, `.planning/phases/0[1-3]-*/*-CONTEXT.md`

### Secondary (MEDIUM confidence)
- None — all critical claims verified against primary sources.

### Tertiary (LOW confidence)
- None — Phase 4 is well-trodden ground; no speculative claims needed.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and version-pinned in `package.json`; usage patterns verified via Context7 docs.
- Architecture: HIGH — locked decisions (D-01..D-25) align cleanly with PB SDK semantics; no architectural pivots.
- Pitfalls: HIGH — 9 pitfalls catalogued with concrete reproduction scenarios; #1 (lodash `remove`), #2 (double-click), #5 (404 on delete), #6 (defineModel reference aliasing) are the most consequential and each has a verified mitigation.
- Security: HIGH — threat surface delta is zero; inherited model from Phase 1 still holds.
- Validation: MEDIUM — Vitest infrastructure not yet present (Phase 6 owns); manual smoke checklist is the recommended phase-gate signal.

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (30 days — stable stack, no fast-moving libraries in critical path)

---

*Phase: 04-bugs-and-save-ux*
*Research conducted: 2026-04-29*
