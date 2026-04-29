---
phase: 04-bugs-and-save-ux
plan: "04"
subsystem: lextrack-persistence
tags: [vue3, pocketbase, persistence, refactor, error-handling, optimistic-delete, save-ux]
dependency_graph:
  requires: ["04-01", "04-02", "04-03"]
  provides: ["LexTrackView-persistence", "loadForDate", "saveItem", "optimistic-delete", "handle401"]
  affects: ["src/views/LexTrackView.vue", "src/components/projects/lextrack/ManageMeeting.vue"]
tech_stack:
  added: []
  patterns:
    - "loadForDate(date) factored from watcher body — called from onMounted + watch(selectedDate)"
    - "saveItem(collection, item) shared helper — update path uses mapToUpdate*, create path uses mapToCreate*"
    - "Optimistic delete with index-based rollback — splice out optimistically, restore at clamped index on non-404 failure"
    - "handle401 centralized handler — clears auth store + router.push /login with redirect query on 401"
    - "Per-collection isSaving refs (isSavingMeeting/Task/Support) + page-level isSaving + isLoading"
    - "Tailwind transition-opacity + :class dim wrapper for activity grid during isLoading"
    - "PrimeVue Button :loading + :disabled composition for page-level Save"
key_files:
  created: []
  modified:
    - src/views/LexTrackView.vue
    - src/components/projects/lextrack/ManageMeeting.vue
decisions:
  - "D-22a: emit save event from dialog up to LexTrackView — matches existing update/remove event pattern"
  - "D-23 inline: saveItem kept inline in LexTrackView.vue for Phase 4; extract to composable in Phase 5 if Day Status reuses it"
  - "D-24a: continue-on-error in page-level save() loop — each item has its own try/catch"
  - "D-25: Save button disabled while isLoading to prevent flicker during initial fetch"
  - "RESEARCH Q#2 RESOLVED: mapToCreate* called in saveItem create path for symmetry with update path"
  - "RESEARCH Q#3 RESOLVED: success toast only when failureCount === 0"
metrics:
  duration: "~35 minutes"
  completed: "2026-04-29T04:37:00Z"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 2
---

# Phase 4 Plan 04: Wire LexTrackView.vue to PocketBase Summary

LexTrackView.vue is now the persistence owner — `loadForDate`, `saveItem`, three dialog @save handlers, three async optimistic-delete handlers, and all `isLoading`/`isSaving*` refs are wired and type-safe.

## What Was Built

### Task 1 — Imports, state refs, handle401, loadForDate, optimistic deletes (commit fb348fa)

**Final import block:**
```typescript
import { computed, onMounted, ref, watch } from 'vue';
import { isEmpty } from 'lodash-es';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { ClientResponseError } from 'pocketbase';
import type { RecordFullListOptions } from 'pocketbase';
import dayjs from 'dayjs';
// ... component imports, pb singleton, auth store, types, mappers (mapToUpdate* + mapToCreate*)
```

`remove` dropped from lodash-es; `onMounted`, `toast`, `ClientResponseError`, `useAuthStore`, `useRouter`, and all six mappers (`mapToUpdate*` + `mapToCreate*`) added.

**Final state-ref block:**
```typescript
const router = useRouter();
const auth = useAuthStore();
const isLoading = ref(false);
const isSaving = ref(false);
const isSavingMeeting = ref(false);
const isSavingTask = ref(false);
const isSavingSupport = ref(false);
```

**handle401 helper:**
```typescript
const handle401 = (err: unknown): boolean => {
  if (err instanceof ClientResponseError && err.status === 401) {
    auth.logout();
    void router.push({ path: '/login', query: { redirect: '/projects/lextrack' } });
    return true;
  }
  return false;
};
```

**loadForDate + onMounted + watcher:**
```typescript
const loadForDate = async (date: Date): Promise<void> => {
  isLoading.value = true;
  try {
    const options: RecordFullListOptions = { filter: `date ~ "${dayjs(date).format('YYYY-MM-DD')}"`, sort: '-created' };
    const [supportsList, tasksList, meetingsList] = await Promise.all([...]);
    supports.value = supportsList; tasks.value = tasksList; meetings.value = meetingsList;
  } catch (err) {
    if (handle401(err)) return;
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

**Optimistic delete pattern (per removeSupport/removeMeeting/removeTask):**
- Branch on `item.id`: no id → silent splice; has id → optimistic splice + PB delete
- 404 swallowed silently (Pitfall #5 — user intent already met)
- Non-404 errors: rollback via `splice(Math.min(originalIndex, arr.length), 0, originalItem)` + toast.error

### Task 2 — saveItem helper, three dialog @save handlers, refactored save() (commit 705df00)

**saveItem shape:**
```typescript
type CollectionName = 'dsu_meetings' | 'dsu_tasks' | 'dsu_supports';
type AnyDsuItem = DsuMeetingItem | DsuTaskItem | DsuSupportItem;

const saveItem = async (collection: CollectionName, item: AnyDsuItem) => {
  const dateStr = dayjs(selectedDate.value).format('YYYY-MM-DD');
  if (item.id) {
    // Update path: branches on collection string, calls mapToUpdate* with cast (Pitfall #7)
  }
  // Create path: calls mapToCreate* for symmetry (RESEARCH Q#2 RESOLVED)
  // For meetings: applies duration_unit: 'minutes' default per Phase 2 D-12
};
```

**Dialog handler shape (handleMeetingSave — handleTaskSave/handleSupportSave follow same pattern):**
```typescript
const handleMeetingSave = async (item: DsuMeetingItem) => {
  isSavingMeeting.value = true;
  try {
    const saved = await saveItem('dsu_meetings', item);
    const idx = meetings.value.indexOf(item);  // reference identity (Pitfall #6)
    if (idx !== -1 && !item.id) {
      meetings.value[idx] = { ...item, id: saved.id };  // spread replace (Pitfall #9)
    }
    toast.success('Meeting saved!');
    viewMeetingDialogVisibility.value = false;  // D-04: close AFTER success
  } catch (err) {
    if (handle401(err)) return;
    console.error('[lextrack save meeting]', err);
    toast.error("Couldn't save your meeting — try again?");
    // D-01: dialog stays open for retry
  } finally { isSavingMeeting.value = false; }
};
```

**Page-level save():** per-item try/catch loops (supports → meetings → tasks), `loadForDate` refetch after loop (D-18), success toast only when `failureCount === 0`.

### Task 3 — Template wiring (commit 9b6d752)

**Save button diff:**
```html
<!-- Before -->
<Button label="Save" :disabled="isNoEntry" @click="save"/>
<!-- After -->
<Button label="Save" :loading="isSaving" :disabled="isNoEntry || isLoading" @click="save"/>
```

**Activity grid dim wrapper diff:**
```html
<!-- Before -->
<div class="grid grid-cols-3 gap-2">
<!-- After -->
<div class="grid grid-cols-3 gap-2 transition-opacity"
     :class="{ 'opacity-50 pointer-events-none': isLoading }">
```

**Dialog wiring diff:**
```html
<!-- Added :saving and @save to each Manage* element -->
<ManageMeeting v-model:visible="..." v-model:meeting="meeting"
               :saving="isSavingMeeting" @save="handleMeetingSave" />
<ManageTask    v-model:visible="..." v-model:task="task"
               :saving="isSavingTask"    @save="handleTaskSave" />
<ManageSupport v-model:visible="..." v-model:support="support"
               :saving="isSavingSupport" @save="handleSupportSave" />
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `DurationUnit` type import from ManageMeeting.vue**
- **Found during:** Task 3 (`npm run lint` exit 1 — eslint `@typescript-eslint/no-unused-vars`)
- **Issue:** `type DurationUnit` was imported in ManageMeeting.vue's constants destructure but never used in the component. This lint error was introduced by plan 04-01 (Wave 1) and blocked the Task 3 lint requirement.
- **Fix:** Removed `type DurationUnit` from the import block in `ManageMeeting.vue`; the remaining `DSU_MEETING_DURATION_UNIT_VALUES` and `DSU_MEETING_DURATION_UNIT_LABELS` are still imported and used.
- **Files modified:** `src/components/projects/lextrack/ManageMeeting.vue`
- **Commit:** 9b6d752 (included in Task 3 commit)

## Known Stubs

None. All three data arrays (`meetings`, `tasks`, `supports`) are wired to PocketBase via `loadForDate` on mount and on date change. The dialog save handlers and page-level `save()` are fully wired to PB SDK calls.

## Threat Flags

None. The plan's `<threat_model>` addressed all surfaces (T-04-04-01 through T-04-04-10). The `handle401` mitigation for T-04-04-01 is implemented in every catch block. Toast text never embeds raw error objects (T-04-04-04). The `{ ...item, id: saved.id }` spread replace addresses T-04-04-08.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| `src/views/LexTrackView.vue` exists | FOUND |
| `src/components/projects/lextrack/ManageMeeting.vue` exists | FOUND |
| `04-04-SUMMARY.md` exists | FOUND |
| commit fb348fa (Task 1) | FOUND |
| commit 705df00 (Task 2) | FOUND |
| commit 9b6d752 (Task 3) | FOUND |
| `npm run type-check` exit 0 | PASSED |
| `npm run lint` exit 0 | PASSED |
