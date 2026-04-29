# Phase 4: Core Bug Fixes & Save UX - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Make LexTrack's data layer correct and trustworthy. Forms exist (Phase 3); Phase 4 wires them to PocketBase and surfaces async state.

In scope:
1. **Initial load on mount** (BUG-01) — opening LexTrack fetches today's items immediately
2. **Trash → PB delete** (BUG-02) — items with `id` get `pb.collection(X).delete(id)`; local-only items drop without an API call
3. **Per-item dialog Save** (UI-SAVE-01) — `ManageMeeting`, `ManageTask`, `ManageSupport` Save buttons persist that single item to PB
4. **Page-level batch Save preserved** (UI-SAVE-02) — the existing `save()` loop keeps working for unsaved local items
5. **Save indicator** (UI-SAVE-03) — page-level + dialog-level Save buttons disable + show spinner during in-flight call
6. **Error toasts + rollback** (BUG-03) — failed save/fetch/delete surfaces a vue-sonner toast; optimistic delete rolls back

Out of scope (explicitly):
- Day Status / Export — Phase 5
- New schema fields, new collections — schema is locked from Phase 1
- New TypeScript types or mapper changes — Phase 2's mapper triple is final; Phase 4 calls the existing `mapToCreate*` / `mapToUpdate*` and PB collection methods directly
- Dark-mode visual refresh, dialog redesign — Phase 3 already de-darkened; no further visual scope here
- Vitest unit tests — Phase 6's QA gate

</domain>

<decisions>
## Implementation Decisions

### Per-Item Save Semantics (UI-SAVE-01, UI-SAVE-02)

- **D-01 (Save flow):** Dialog Save button calls PB synchronously (await). On **success**: close dialog + success toast + patch the PB-returned `id` into the corresponding local-array item (so subsequent edits go through the update path, not create). On **fail**: keep dialog open + error toast — user can retry without re-typing.
- **D-02 (Page-level Save coexistence):** Page-level Save button keeps its current behavior — loops through `meetings.value`, `tasks.value`, `supports.value` and calls create-or-update per item based on `id` presence. Items that were already saved via dialog Save have an `id`, so the loop hits the update path (idempotent re-PUT). Acceptable cost for simplicity. Both Save paths share the same per-collection helper.
- **D-03 (Save helper shape):** Extract a single `saveItem(collection, item)` helper that takes the collection name + item and returns the saved record (with `id`). Both the dialog Save handlers and the page-level loop call it. Returns the PB record so the caller can patch `id` into local state.
- **D-04 (Dialog Save closes on success):** `visible.value = false` set in the dialog component AFTER the PB call resolves successfully. No optimistic close. User sees the spinner then the dialog disappears + toast appears.

### Optimistic vs Pessimistic Mutations (BUG-03)

- **D-05 (Delete is optimistic):** Trash icon click removes the item from the local array immediately, then `await pb.collection(X).delete(id)` in the background. On success, no further action. On **fail**, re-insert the item at its original index + error toast ("Couldn't delete your X — restored").
- **D-06 (Save is pessimistic):** Wait for PB to confirm before mutating. New items only appear in the local array after `getFullList`/`create` resolves; existing items only show their updated values after `update` resolves. This avoids tracking pre-edit snapshots for rollback on save failure.
- **D-07 (Local-only delete is silent):** Items without an `id` (added inline, not yet saved) are removed from the local array without any PB call. No toast (it's a no-op trivially).

### Loading Indicator Scope (UI-SAVE-03)

- **D-08 (Save buttons get the spinner):** PrimeVue Button's `:loading` prop on both the page-level Save and each dialog Save. Disable + spinner during in-flight; re-enable on resolve (success or fail).
- **D-09 (Initial-load skeleton/dim on the activity grid):** A single `isLoading` ref toggles a dimmed-grid or skeleton state on the three ActivityCards while the initial fetch (and subsequent date-change fetches) is pending. Implementation choice (PrimeVue Skeleton vs Tailwind opacity-50 dim) deferred to planner — both are acceptable. Date picker stays interactive throughout.
- **D-10 (Trash icon stays clickable):** Delete is optimistic + fast. No per-row spinner needed. If the user mass-deletes and one fails, the failed one re-inserts with a toast — clear enough feedback.
- **D-11 (No loading state on edit-icon):** Opening a dialog is local-state only; no fetch triggered. Edit click is instant.

### Error UX (BUG-03)

- **D-12 (One toast per error):** Each failed PB call shows its own `toast.error` from `vue-sonner`. No aggregation. Save loop iterates and surfaces each item's failure individually so the user knows exactly which item failed.
- **D-13 (Friendly messages):** Toast text is action-oriented and user-friendly: "Couldn't save your meeting — try again?", "Couldn't load today's items.", "Couldn't delete — restored.". The raw PB error goes to `console.error('[lextrack save]', err)` for debugging.
- **D-14 (Auto-dismiss ~5s):** Use vue-sonner default duration (4-5 seconds depending on toast type). No sticky toasts. Errors transient — user can re-trigger the action to retry.
- **D-15 (No optimistic-mutation rollback for save failures):** Because save is pessimistic (D-06), there's nothing to roll back. Toast + dialog-stays-open (for dialog) or just toast (for page-level loop) is the entire user-facing recovery path.

### Initial-Load Mechanics (BUG-01)

- **D-16 (Factor fetch into `loadForDate(date)`):** Extract the existing watcher body into a top-level async function `loadForDate(date: Date): Promise<void>` in `LexTrackView.vue`. The function performs the `Promise.all` of `getFullList` calls, sets `supports/tasks/meetings.value`, and toggles the `isLoading` flag.
- **D-17 (Mount + watcher both call `loadForDate`):** `onMounted(() => loadForDate(selectedDate.value))` plus `watch(selectedDate, (newDate) => loadForDate(newDate))`. No `{ immediate: true }` shortcut — keeps the call sites explicit.
- **D-18 (Refetch after page-level Save):** After page-level `save()` finishes (success or partial failure), call `loadForDate(selectedDate.value)` to repopulate from PB. This ensures local state has all PB-assigned `id`s and any server-side normalizations (e.g., default `duration_unit: 'minutes'` from the mapper). Per-item dialog Save does NOT refetch — it patches the returned `id` directly into the existing array entry (D-01).
- **D-19 (Wrap fetch in try/catch):** `loadForDate` catches errors → `toast.error("Couldn't load today's items.")` + `console.error`. Local arrays are NOT cleared on fetch failure — keep whatever was last loaded so the user isn't staring at a blank page after a transient network blip.

### Date-Change Race Conditions

- **D-20 (Naive last-to-resolve wins):** No abort tokens, no AbortControllers. The `isLoading` ref dims the activity grid; visually the user sees "loading" → results swap. If a stale response from a prior date arrives after a newer fetch, it'll overwrite — but the race window is tiny because date changes are deliberate human actions (~hundreds of ms apart at fastest). Acceptable for v1.
- **D-21 (Single `isLoading` flag):** One ref shared across mount-load and date-change reloads — keeps the UX uniform.

### Claude's Discretion

- **D-22 (Manage* dialogs accept a save handler from the parent OR call PB directly):** Planner decides between (a) emit `save` event up to LexTrackView and let the parent handle PB, or (b) inject the save helper as a prop / composable into the dialog. Either is fine; (a) keeps PB calls colocated with state in LexTrackView; (b) makes dialogs self-contained. Pick the one that matches the codebase's existing pattern (probably (a) — events are already used for `update`/`remove`).
- **D-23 (`saveItem` colocation):** The `saveItem` helper can live in `LexTrackView.vue` (private function) or in a new `src/composables/lextrack/useDsuPersistence.ts` (or similar). Composable is more reusable; inline is simpler. Planner picks based on whether Phase 5 is likely to reuse it (Day Status save + Export will need similar PB calls).
- **D-24 (Page-level Save error handling — partial-success semantics):** When the loop hits a failure mid-batch, do we (a) continue the loop and toast each failure, or (b) bail at first error? Recommend (a) — keep going so the user gets every successful save persisted. Planner confirms.
- **D-25 (Initial-load empty state):** During the first mount-fetch, the three `ActivityCard`s are empty arrays. `isNoEntry` is true. We don't want the page-level Save button to flicker disabled→enabled→disabled as data loads. Planner's call: keep it disabled while `isLoading` is true regardless of `isNoEntry`.

### Folded Todos

None — no project-level todos cross-referenced.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Constraints (Vue 3 / PocketBase / PrimeVue stack; no framework swaps)
- `.planning/REQUIREMENTS.md` §Bug Fixes / UI: Save & Loading — BUG-01, BUG-02, BUG-03, UI-SAVE-01, UI-SAVE-02, UI-SAVE-03
- `.planning/ROADMAP.md` §Phase 4 — Goal and 5 success criteria

### Phase 1 (locked)
- `.planning/phases/01-schema-foundation/01-CONTEXT.md` — Field shapes for the three collections
- `.planning/pocketbase-schema.md` — Collection schemas; URL field validates server-side (D-12 there)

### Phase 2 (locked)
- `.planning/phases/02-types-mappers/02-CONTEXT.md` D-09/D-12/D-15 — mapper triple is the chokepoint; legacy `duration_unit ?? 'minutes'` is normalized in `mapFromRecordMeeting`
- `src/lib/pocketbase/dsuMeetingMapper.ts` — `mapToCreateMeeting`, `mapToUpdateMeeting`, `mapFromRecordMeeting`
- `src/lib/pocketbase/dsuSupportMapper.ts` — `mapToCreateSupport`, `mapToUpdateSupport`, `mapFromRecordSupport`
- `src/lib/pocketbase/dsuTaskMapper.ts` — `mapToCreateTask`, `mapToUpdateTask`, `mapFromRecordTask`
- `src/types/lextrack/dsu_meetings/types.ts`, `src/types/lextrack/dsu_supports/types.ts`, `src/types/lextrack/dsu_tasks/types.ts` — current `DsuX` and `AddDsuX` shapes

### Phase 3 (locked)
- `.planning/phases/03-meeting-admin-ui/03-CONTEXT.md` D-17 — Phase 3 left inline-add as local-state only; Phase 4 owns persistence
- `.planning/phases/03-meeting-admin-ui/03-VERIFICATION.md` — Phase 3 verified state (5/5 criteria PASS, 8/8 reqs satisfied) — Phase 4 starts from a known-good UI baseline
- `src/composables/lextrack/useDurationField.ts` — duration toggle composable (consumed by ManageMeeting; not modified by Phase 4)

### Codebase context
- `.planning/codebase/CONVENTIONS.md` — `<script setup>` Composition API, `defineModel`, no manual PrimeVue imports, vue-sonner already wired
- `.planning/codebase/STRUCTURE.md` — `src/components/projects/lextrack/` layout
- `src/views/LexTrackView.vue` — **PRIMARY MODIFICATION TARGET** for Phase 4: factor fetch into `loadForDate`, add `onMounted`, replace local-only delete with PB delete + rollback, refactor `save()` to share helper with dialogs, add `isLoading` ref + spinner gating
- `src/components/projects/lextrack/ActivityCard.vue` — **NOT modified by Phase 4.** Trash icon stays as-is (calls parent's `removeX` via emit); page-level loading state passes down via prop or scoped via parent dim wrapper
- `src/components/projects/lextrack/ManageMeeting.vue` — **MODIFIED:** `updateMeeting` toast-stub becomes a real PB call (D-01–D-04); add `:loading` to Save button (D-08)
- `src/components/projects/lextrack/ManageTask.vue` — **MODIFIED:** same shape as ManageMeeting (`updateTask` becomes a real PB call)
- `src/components/projects/lextrack/ManageSupport.vue` — **MODIFIED:** same shape (`updateSupport` becomes a real PB call)
- `src/lib/pocketbase/index.ts` — `pb` singleton; auth is global per Phase 1's design
- `src/stores/auth.ts` — auth-gated route already in place; PB requests assume an authenticated user

### External docs
- PocketBase JS SDK 0.26 — `getFullList`, `create`, `update`, `delete` per-collection methods; error shape (`ClientResponseError` with `.status` and `.data`)
- PrimeVue Button `:loading` prop — for spinner UX (D-08)
- vue-sonner `toast.error('msg', { duration: ... })` — already used elsewhere

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`pb` singleton** (`src/lib/pocketbase/index.ts`) — already imported in `LexTrackView.vue`
- **Mapper triple per collection** (Phase 2) — `mapToCreate*`, `mapToUpdate*`, `mapFromRecord*` are the only legitimate places to convert between PB and local shapes
- **`vue-sonner`** — `toast.success`, `toast.error` available globally; already used in the Manage* dialog stubs
- **PrimeVue Button `:loading` prop** — built-in spinner; toggled via boolean ref
- **`dayjs`** — already imported and used for date formatting in the existing watcher
- **`lodash-es` `remove`** — current delete uses this; rollback can use `splice` to re-insert at index

### Established Patterns
- **`<script setup>` Composition API** with `ref`, `watch`, `computed`
- **Top-level async logic in event handlers** — current `save()` is a bare `async` function; same shape for the new `loadForDate` and rollback handlers
- **Toast on success** — `toast.success('X is updated successfully!')` is the existing pattern in the Manage* dialogs

### Integration Points
- `LexTrackView.vue` script: factor watcher body → `loadForDate(date)` (D-16), add `onMounted` (D-17), wrap in try/catch (D-19)
- `LexTrackView.vue` script: `removeSupport/Meeting/Task` → optimistic delete + PB delete + rollback (D-05, D-07)
- `LexTrackView.vue` script: `save()` → keep loop, share `saveItem` helper with dialogs (D-02, D-03), refetch on success (D-18)
- `ManageMeeting/Task/Support.vue`: emit `save` event with the item, parent handles PB (D-22 option a recommended), `:loading` on the Save button (D-08)
- `LexTrackView.vue` template: dim or skeleton the three `ActivityCard` while `isLoading` is true (D-09)

### Type Implications
- `saveItem` helper signature: probably `(collection: 'dsu_meetings' | 'dsu_tasks' | 'dsu_supports', item: SectionItem) => Promise<RecordModel>` or three overloads — planner picks
- `loadForDate` is `(date: Date) => Promise<void>`; sets refs internally
- The existing `DsuMeetingItem = AddDsuMeeting & { id?: string }` pattern stays — `id` patching after dialog save uses this shape

### Potential pitfalls
- **`remove(arr, predicate)`** mutates in place. The optimistic-delete rollback needs to capture the removed item AND its index BEFORE removing, or splice based on identity match
- **Date watcher fires on `new Date()` reference change**, not value change — already the existing behavior; mount fetch via `onMounted` avoids the `{ immediate: true }` ambiguity
- **PocketBase `create` returns the persisted record with auto-fields** (`id`, `created`, `updated`, etc.) — patching JUST the `id` into the local item is enough; running the full `mapFromRecord*` is more correct (normalizes legacy fields) but is overkill for fresh creates
- **PB error from `update` on a non-existent id** (e.g., user has stale state where item was deleted server-side) — the error toast covers this; D-13's "try again?" is the recovery path

</code_context>

<specifics>
## Specific Ideas

- The user's current pain (per `quarter-3-logs.txt` workflow): they sit down at end of day, fill in three buckets, and need confidence that data was saved. Phase 4's loading indicator + error toast are critical to this trust — silent failure (current state) is the worst outcome.
- A failed initial-load (e.g., PB instance is sleeping/cold) should NOT clear whatever the user might have already typed inline. D-19 explicitly preserves local arrays on fetch failure.
- The page-level Save batching is a multi-item action, but per-item dialog Save is the snappier path the user will use most. Both must work; the dialog Save is the more polished UX.

</specifics>

<deferred>
## Deferred Ideas

- **Per-row delete spinner** — D-10 deferred; optimistic + toast-on-failure is sufficient feedback
- **AbortController for date-change races** — Phase 4 uses naive last-wins (D-20). Revisit if real-world usage shows visible glitches.
- **Sticky error toasts** — D-14 uses auto-dismiss. Revisit if users report missing transient toast messages.
- **Aggregate "3 items failed" toast** — D-12 uses one-per-error. Revisit if mass-save failures become common.
- **`useDsuPersistence` composable** — D-23 leaves it open; planner picks. If Phase 5 needs Day Status persistence, that's the natural moment to extract.
- **Dirty-state guard** — warn user before navigating away with unsaved local items. Out of scope; could land in Phase 5 or 6.
- **Full mapper round-trip on create response** — D-12 in Phase 2 normalizes legacy `duration_unit`. Phase 4 patches just the `id` for snappiness; if a user creates and edits the same item without refetching, defaults flow through the existing mapper on update.
- **Optimistic save with rollback** — rejected (D-06). If snappiness becomes a complaint, revisit.
- **Schema migrations or new fields** — locked since Phase 1; Phase 4 strictly uses the existing collection shape.

### Reviewed Todos (not folded)
None.

</deferred>

---

*Phase: 04-bugs-and-save-ux*
*Context gathered: 2026-04-29*
