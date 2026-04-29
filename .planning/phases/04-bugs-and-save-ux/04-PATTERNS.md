# Phase 4: Core Bug Fixes & Save UX - Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 4 modified + 1 optional new = 5
**Analogs found:** 4 / 4 (modified files have same-file analogs); 1 optional new file has a Phase 3 reference analog

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/views/LexTrackView.vue` (MODIFIED) | view (state owner) | request-response + CRUD orchestration | self (existing `watch` body, `save()` loop, `removeX` handlers) | exact (in-place refactor) |
| `src/components/projects/lextrack/ManageMeeting.vue` (MODIFIED) | dialog component | event-driven (emit save) + request-response (await PB via parent) | self (existing `updateMeeting` toast stub) + `ActivityCard.vue` emit pattern | exact |
| `src/components/projects/lextrack/ManageTask.vue` (MODIFIED) | dialog component | event-driven (emit save) + request-response | self (existing `updateTask` toast stub) + ManageMeeting (target shape) | exact |
| `src/components/projects/lextrack/ManageSupport.vue` (MODIFIED) | dialog component | event-driven (emit save) + request-response | self (existing `updateSupport` toast stub) + ManageMeeting (target shape) | exact |
| `src/composables/lextrack/useDsuPersistence.ts` (OPTIONAL — D-23) | composable | CRUD helpers | `src/composables/lextrack/useDurationField.ts` | role-match (composable shape only; data flow differs) |

> **Recommendation per RESEARCH.md:** keep `saveItem` inline in `LexTrackView.vue` for Phase 4. Defer the composable extraction to Phase 5 if Day Status reuses it. The composable file row above is included only in case the planner picks the composable route.

## Pattern Assignments

### `src/views/LexTrackView.vue` (view, request-response + CRUD)

**Analog:** self — Phase 4 is an in-place refactor. All five sub-patterns are extracted from existing structure.

#### Imports pattern (existing — extend, don't replace)

**Source:** `src/views/LexTrackView.vue:1-16`
```typescript
import {computed, ref, watch} from 'vue';
import { remove, isEmpty } from 'lodash-es'
import ActivityCard from "@/components/projects/lextrack/ActivityCard.vue";
import type {AddDsuTask, DsuTasks} from "@/types/lextrack/dsu_tasks/types";
import type {AddDsuSupport, DsuSupports} from "@/types/lextrack/dsu_supports/types";
import type {AddDsuMeeting, DsuMeetings} from "@/types/lextrack/dsu_meetings/types";
import ManageMeeting from "@/components/projects/lextrack/ManageMeeting.vue";
import ManageTask from "@/components/projects/lextrack/ManageTask.vue";
import ManageSupport from "@/components/projects/lextrack/ManageSupport.vue";
import { pb } from '@/lib/pocketbase';
import type { RecordFullListOptions } from 'pocketbase';
import dayjs from "dayjs";
import {mapToUpdateSupport} from "@/lib/pocketbase/dsuSupportMapper.ts";
import {mapToUpdateMeeting} from "@/lib/pocketbase/dsuMeetingMapper.ts";
import {mapToUpdateTask} from "@/lib/pocketbase/dsuTaskMapper.ts";
```

**Phase 4 changes to imports:**
- ADD `onMounted` to `vue` imports (needed for D-17 mount load).
- ADD `import { toast } from "vue-sonner";` (needed for D-13 error toasts; Manage* dialogs already have this pattern).
- ADD `import { ClientResponseError } from 'pocketbase';` (needed for Pitfall #5 — 404-as-success on delete).
- DROP `remove` from `lodash-es` import — replaced by `Array.prototype.splice` per Pitfall #1 (RESEARCH.md). Keep `isEmpty`.
- ADD `mapToCreateMeeting`/`mapToCreateTask`/`mapToCreateSupport` — RESEARCH Q#2 RESOLVED: `saveItem` create path calls these mappers for symmetry with the update path, and applies the `duration_unit: 'minutes'` legacy default per Phase 2 D-12 for inline-added meetings.

#### Pattern A — `loadForDate(date)` factoring (BUG-01, D-16, D-17, D-19)

**Analog source:** existing `watch(selectedDate, ...)` body — `src/views/LexTrackView.vue:90-113`
```typescript
watch(selectedDate, async (newDate : Date) => {
  // Here you can add logic to fetch or filter activities based on the new date

  const options : RecordFullListOptions = {
    filter: `date ~ "${dayjs(newDate).format('YYYY-MM-DD')}"`,
    sort: '-created'
  }

  // (commented-out individual awaits — drop on refactor)

  const [supportsList,tasksList,meetingsList] = await Promise.all([
    pb.collection('dsu_supports').getFullList<DsuSupports>(options),
    pb.collection('dsu_tasks').getFullList<DsuTasks>(options),
    pb.collection('dsu_meetings').getFullList<DsuMeetings>(options)
  ])

  supports.value = supportsList;
  tasks.value = tasksList;
  meetings.value = meetingsList;
});
```

**Phase 4 target shape (extracted into `loadForDate` + try/catch + isLoading):**
```typescript
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

**What to copy:** filter string, `sort: '-created'`, `Promise.all` shape with the three `getFullList<T>` calls in the same order, ref-assignment ordering (supports → tasks → meetings).
**What to change:** wrap in `try/catch/finally`, manage `isLoading.value`, drop the dead commented-out lines (LexTrackView.vue:98-102).

#### Pattern B — Optimistic delete with index-based rollback (BUG-02, BUG-03, D-05, D-07)

**Analog source:** existing `removeMeeting` / `removeSupport` / `removeTask` — `src/views/LexTrackView.vue:36-39, 58-61, 81-84`
```typescript
const removeMeeting = (index : number) => {
  meeting.value = meetings.value[index] as AddDsuMeeting;
  remove(meetings.value, (_, i) => i === index);
}
```

**Phase 4 target shape (per RESEARCH.md Pattern 2 + Pitfall #5):**
```typescript
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
    // Pitfall #5: 404 means PB already deleted it — user intent met
    if (err instanceof ClientResponseError && err.status === 404) {
      console.warn('[lextrack delete meeting] 404 — already gone');
      return;
    }
    console.error('[lextrack delete meeting]', err);
    toast.error("Couldn't delete your meeting — restored.");
    // Pitfall #1: clamp the rollback index
    const safeIndex = Math.min(originalIndex, meetings.value.length);
    meetings.value.splice(safeIndex, 0, originalItem);
  }
};
```

**Apply same shape to** `removeSupport` (collection `'dsu_supports'`, toast text "Couldn't delete your admin item — restored.") and `removeTask` (collection `'dsu_tasks'`, toast text "Couldn't delete your task — restored.").
**What to drop:** the `meeting.value = meetings.value[index] as AddDsuMeeting` line — that was a leftover from the local-state-only delete; not needed in optimistic delete (we capture `originalItem` instead).
**What to drop:** the `remove(arr, predicate)` lodash call — replaced by `splice(index, 1)`.

#### Pattern C — `saveItem(collection, item)` helper (UI-SAVE-01, UI-SAVE-02, D-03)

**Analog source:** existing per-collection save loop — `src/views/LexTrackView.vue:115-149`
```typescript
const save = async () => {

  // SUPPORTS
  for (const item of supports.value) {
    if(item.id){
      await pb.collection('dsu_supports').update(item.id, mapToUpdateSupport(item as DsuSupports));
    }
    else {
      item.date = dayjs(selectedDate.value).format('YYYY-MM-DD');
      await pb.collection('dsu_supports').create(item);
    }
  }

  // MEETINGS — same shape (lines 129-137)
  // TASKS    — same shape (lines 140-148)
}
```

**Phase 4 target shape (extracted helper, mapper-lookup pattern):**
```typescript
type CollectionName = 'dsu_meetings' | 'dsu_tasks' | 'dsu_supports';
type AnyDsuItem = DsuMeetingItem | DsuTaskItem | DsuSupportItem;

const saveItem = async (collection: CollectionName, item: AnyDsuItem) => {
  if (item.id) {
    // Update path — branch per collection because the mapper signatures differ
    if (collection === 'dsu_meetings') {
      return await pb.collection('dsu_meetings').update(item.id, mapToUpdateMeeting(item as DsuMeetings));
    }
    if (collection === 'dsu_tasks') {
      return await pb.collection('dsu_tasks').update(item.id, mapToUpdateTask(item as DsuTasks));
    }
    return await pb.collection('dsu_supports').update(item.id, mapToUpdateSupport(item as DsuSupports));
  }
  // Create path — ensure date, then create
  const payload = { ...item, date: dayjs(selectedDate.value).format('YYYY-MM-DD') };
  return await pb.collection(collection).create(payload);
};
```

**What to copy:** the `if(item.id) update / else create` branch logic verbatim; the `dayjs(selectedDate.value).format('YYYY-MM-DD')` date-stamping for create; the `as DsuSupports`/`as DsuMeetings`/`as DsuTasks` casts (Pitfall #7 — required because mapper expects full record).
**What to change:** parameterize on `collection` argument; return the PB record so callers can patch `id` (D-01); do NOT mutate `item.date` in place (current code on lines 123, 134, 145 does `item.date = ...` which mutates the local array — replace with spread `payload = { ...item, date: ... }` to keep the create payload pure and avoid unexpected reactivity).

#### Pattern D — Page-level batch `save()` with continue-on-error (UI-SAVE-02, D-02, D-18, D-24a)

**Analog source:** existing `save()` loop — `src/views/LexTrackView.vue:115-149` (same as Pattern C analog)

**Phase 4 target shape:**
```typescript
const isSaving = ref(false);

const save = async () => {
  isSaving.value = true;
  let failureCount = 0;
  try {
    for (const item of supports.value) {
      try { await saveItem('dsu_supports', item); }
      catch (err) {
        console.error('[lextrack save support]', err);
        toast.error(`Couldn't save "${item.title || 'untitled admin item'}" — try again?`);
        failureCount++;
      }
    }
    for (const item of meetings.value) {
      try { await saveItem('dsu_meetings', item); }
      catch (err) {
        console.error('[lextrack save meeting]', err);
        toast.error(`Couldn't save "${item.title || 'untitled meeting'}" — try again?`);
        failureCount++;
      }
    }
    for (const item of tasks.value) {
      try { await saveItem('dsu_tasks', item); }
      catch (err) {
        console.error('[lextrack save task]', err);
        toast.error(`Couldn't save "${item.title || 'untitled task'}" — try again?`);
        failureCount++;
      }
    }
    // D-18: refetch from PB regardless of partial failures (gives every item its server id)
    await loadForDate(selectedDate.value);
    if (failureCount === 0) {
      toast.success('All items saved!');
    }
  } finally {
    isSaving.value = false;
  }
};
```

**What to copy:** the three sequential `for ... of` loops in the order supports → meetings → tasks (matches existing).
**What to change:** wrap each iteration in its own try/catch (continue-on-error per D-24a); call `saveItem` instead of inlined PB code; add `isSaving` toggle + post-loop `loadForDate` refetch + final success toast.

#### Pattern E — Dialog `@save` event handler (UI-SAVE-01, D-01, D-04, D-22a)

**No existing analog** — Phase 3 left dialogs as toast-only stubs. **Reference shape comes from RESEARCH.md Pattern 3** (verified against PB SDK semantics):
```typescript
const isSavingMeeting = ref(false);
// also: isSavingTask, isSavingSupport (Open Question #1 recommendation: three refs)

const handleMeetingSave = async (meetingItem: DsuMeetingItem) => {
  isSavingMeeting.value = true;
  try {
    const saved = await saveItem('dsu_meetings', meetingItem);
    // D-01: patch the returned id into the local-array entry (so next edit is update, not create)
    const idx = meetings.value.indexOf(meetingItem);
    if (idx !== -1 && !meetingItem.id) {
      // Pitfall #9: replace the array entry entirely, don't mutate sub-property
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
// Apply same shape to handleTaskSave, handleSupportSave
```

**What to copy from analog:** the existing `viewMeetingDialogVisibility.value = false` close pattern (currently only in ManageSupport.vue:23 stub; needs to move to parent post-success).
**Apply same shape to** `handleTaskSave` and `handleSupportSave`. Toast text per D-13.

#### Template: dim wrapper (UI-SAVE-03, D-09)

**Analog source:** existing template — `src/views/LexTrackView.vue:174-178`
```html
<div class="grid grid-cols-3 gap-2">
  <ActivityCard v-model:section="meetings" label="Meetings" @update="updateMeeting" @remove="removeMeeting"/>
  <ActivityCard v-model:section="tasks" label="Tasks" @update="updateTask" @remove="removeTask"/>
  <ActivityCard v-model:section="supports" label="Admin" @update="updateSupport" @remove="removeSupport"/>
</div>
```

**Phase 4 target shape (Tailwind opacity dim):**
```html
<div
  class="grid grid-cols-3 gap-2 transition-opacity"
  :class="{ 'opacity-50 pointer-events-none': isLoading }">
  <ActivityCard v-model:section="meetings" label="Meetings" @update="updateMeeting" @remove="removeMeeting"/>
  <ActivityCard v-model:section="tasks" label="Tasks" @update="updateTask" @remove="removeTask"/>
  <ActivityCard v-model:section="supports" label="Admin" @update="updateSupport" @remove="removeSupport"/>
</div>
```

**Save button update** (existing line 166):
```html
<!-- BEFORE -->
<Button label="Save" :disabled="isNoEntry" @click="save"/>

<!-- AFTER (D-08, D-25) -->
<Button label="Save" :loading="isSaving" :disabled="isNoEntry || isLoading" @click="save"/>
```

**Manage* dialog wiring update** (existing lines 183-192):
```html
<!-- BEFORE -->
<ManageMeeting v-model:visible="viewMeetingDialogVisibility" v-model:meeting="meeting"/>
<ManageTask v-model:visible="viewTaskDialogVisibility" v-model:task="task"/>
<ManageSupport v-model:visible="viewSupportDialogVisibility" v-model:support="support" />

<!-- AFTER (D-22a emit pattern) -->
<ManageMeeting
  v-model:visible="viewMeetingDialogVisibility"
  v-model:meeting="meeting"
  :saving="isSavingMeeting"
  @save="handleMeetingSave"/>
<ManageTask
  v-model:visible="viewTaskDialogVisibility"
  v-model:task="task"
  :saving="isSavingTask"
  @save="handleTaskSave"/>
<ManageSupport
  v-model:visible="viewSupportDialogVisibility"
  v-model:support="support"
  :saving="isSavingSupport"
  @save="handleSupportSave"/>
```

---

### `src/components/projects/lextrack/ManageMeeting.vue` (dialog component, event-driven)

**Analog A (the local toast stub to refactor):** `src/components/projects/lextrack/ManageMeeting.vue:51-54`
```typescript
const updateMeeting = () => {
  // Phase 3 boundary: persistence lands in Phase 4 (UI-SAVE-01). For now, toast only.
  toast.success('Meeting is updated successfully!');
};
```

**Analog B (emit pattern to copy from):** `src/components/projects/lextrack/ActivityCard.vue:18-21, 52-53`
```typescript
const emit = defineEmits<{
  update: [index : number]
  remove: [index : number]
}>()

const edit = (index : number) => emit('update', index);
const remove = (index : number) => emit('remove', index);
```

**Phase 4 target shape for ManageMeeting.vue script:**
```typescript
const visible = defineModel(
    'visible',
    {
      type: Boolean,
      default: false,
      required: true,
    });

const meeting = defineModel<AddDsuMeeting>(
    'meeting',
    {
      required: true,
    });

const props = defineProps<{ saving?: boolean }>();

const emit = defineEmits<{
  save: [item: AddDsuMeeting & { id?: string }];
}>();

// ... existing duration composable wiring stays unchanged (lines 26-49) ...

const onSaveClick = () => emit('save', meeting.value as AddDsuMeeting & { id?: string });
```

**What to remove:** the `toast` import (now unused locally — toasts fire from the parent), the `updateMeeting` function body that calls `toast.success`.
**What to keep:** all existing `useDurationField` wiring and watchers (lines 26-49) — this is Phase 3 work and is final.
**Template change** (line 88):
```html
<!-- BEFORE -->
<Button label="Save Meeting" @click="updateMeeting" class="w-full bg-indigo-600 hover:bg-indigo-700" />

<!-- AFTER (D-08 :loading) -->
<Button label="Save Meeting" :loading="props.saving" @click="onSaveClick" class="w-full bg-indigo-600 hover:bg-indigo-700" />
```

---

### `src/components/projects/lextrack/ManageTask.vue` (dialog component, event-driven)

**Analog (sibling target shape):** ManageMeeting.vue post-Phase-4 (above).
**Analog (existing stub to refactor):** `src/components/projects/lextrack/ManageTask.vue:19-21`
```typescript
const updateTask = () => {
  toast.success('Task is updated successfully!');
};
```

**Phase 4 target shape:**
```typescript
const props = defineProps<{ saving?: boolean }>();
const emit = defineEmits<{
  save: [item: AddDsuTask & { id?: string }];
}>();
const onSaveClick = () => emit('save', task.value as AddDsuTask & { id?: string });
```

**Template change** (line 42):
```html
<Button label="Save Task" :loading="props.saving" @click="onSaveClick" class="w-full bg-indigo-600 hover:bg-indigo-700" />
```

**What to remove:** `toast` import (line 3) and `updateTask` body.

---

### `src/components/projects/lextrack/ManageSupport.vue` (dialog component, event-driven)

**Analog (sibling target shape):** ManageMeeting.vue post-Phase-4 (above).
**Analog (existing stub to refactor):** `src/components/projects/lextrack/ManageSupport.vue:19-23`
```typescript
const updateSupport = () => {
  // Phase 3 boundary: persistence lands in Phase 4 (UI-SAVE-01). For now, toast only.
  toast.success('Support is updated successfully!');
  visible.value = false;
};
```

**Phase 4 target shape:**
```typescript
const props = defineProps<{ saving?: boolean }>();
const emit = defineEmits<{
  save: [item: AddDsuSupport & { id?: string }];
}>();
const onSaveClick = () => emit('save', support.value as AddDsuSupport & { id?: string });
```

**Template change** (line 44):
```html
<Button label="Save" :loading="props.saving" @click="onSaveClick" class="w-full bg-indigo-600 hover:bg-indigo-700" />
```

**What to remove:** `toast` import (line 2), `updateSupport` body, AND the local `visible.value = false` (line 22 — close moves to the parent post-success per D-04).

---

### `src/composables/lextrack/useDsuPersistence.ts` (OPTIONAL, composable, CRUD)

> Only relevant if the planner picks D-23's composable route. **Recommendation: skip for Phase 4.**

**Analog (composable shape only):** `src/composables/lextrack/useDurationField.ts:1-63`

**Imports + export pattern** (lines 1-15):
```typescript
import { computed, ref, type ComputedRef, type Ref, type WritableComputedRef } from 'vue';
import type { DurationUnit } from '@/types/lextrack/dsu_meetings/constants';

export interface UseDurationFieldReturn {
    /** ... JSDoc on each return field ... */
    enteredValue: WritableComputedRef<number | null>;
    // ...
}
```

**Function signature pattern** (lines 33-36):
```typescript
export function useDurationField(
    savedMinutes: number | undefined,
    savedUnit: DurationUnit | undefined,
): UseDurationFieldReturn {
```

**What to copy if extracting:** The `export interface UseXReturn` named-return-type pattern; the JSDoc per field; the `export function useX(...): UseXReturn` signature shape; the `return { ... }` of named members at the bottom.
**What's different about `useDsuPersistence`:** it's a stateless utility wrapper, not a stateful composable — likely cleaner as plain functions in a `src/lib/pocketbase/persistence.ts` module than a `useX` composable. Composable-shape is appropriate only if it owns refs (`isLoading`, `isSaving`).

---

## Shared Patterns

### Pattern: PocketBase singleton import

**Source:** `src/lib/pocketbase/index.ts:1-5`
```typescript
import PocketBase from "pocketbase";
const baseUrl = import.meta.env.VITE_API_BASE_URL;
export const pb = new PocketBase(baseUrl);
```
**Apply to:** Already imported as `import { pb } from '@/lib/pocketbase';` in `LexTrackView.vue:11`. **Do not re-create.** Manage* dialogs do NOT import `pb` — they emit to parent (D-22a).

### Pattern: vue-sonner toast (existing convention)

**Source:** `src/components/projects/lextrack/ManageMeeting.vue:3, 53` — `import { toast } from "vue-sonner"; toast.success('...');`
**Source:** `src/components/projects/lextrack/ManageSupport.vue:2, 21` — same shape

**Apply to LexTrackView.vue (NEW import):**
```typescript
import { toast } from "vue-sonner";

// success
toast.success('All items saved!');
toast.success('Meeting saved!');

// error (D-13 friendly text — never include raw err)
toast.error("Couldn't load today's items.");
toast.error("Couldn't save your meeting — try again?");
toast.error("Couldn't delete your meeting — restored.");
```

**Move FROM Manage* dialogs:** Remove the `toast` import + `toast.success` call from each Manage* dialog. Toasts now fire from the parent `handleXSave` after the PB call resolves.

### Pattern: `console.error` namespacing for debug

**Source:** RESEARCH.md D-13 (no existing codebase analog — current code lacks structured error logging)
```typescript
console.error('[lextrack save meeting]', err);
console.error('[lextrack delete meeting]', err);
console.error('[lextrack load]', err);
```
**Apply to:** Every catch block in LexTrackView.vue. Bracket-prefix tag pattern: `[lextrack <action> <entity>]`.

### Pattern: `<script setup lang="ts">` Composition API

**Source:** All Vue components in this phase (ManageMeeting.vue:1, LexTrackView.vue:1, ActivityCard.vue:1).
**Apply to:** All modifications keep `<script setup lang="ts">`. No Options API.

### Pattern: `defineModel` two-way binding (existing convention)

**Source:** `src/components/projects/lextrack/ManageMeeting.vue:12-24`
```typescript
const visible = defineModel(
    'visible',
    {
      type: Boolean,
      default: false,
      required: true,
    });

const meeting = defineModel<AddDsuMeeting>(
    'meeting',
    {
      required: true,
    });
```
**Apply to:** Keep this exact pattern in all three Manage* dialogs. Do not change `defineModel` shape; only ADD `defineProps<{ saving?: boolean }>()` and `defineEmits<{ save: [...] }>()` alongside.

### Pattern: Type alias for inline-add items with optional id

**Source:** `src/views/LexTrackView.vue:22, 43, 65`
```typescript
type DsuSupportItem = AddDsuSupport & { id?: string };
type DsuMeetingItem = AddDsuMeeting & { id?: string };
type DsuTaskItem = AddDsuTask & { id?: string };
```
**Apply to:** Keep these aliases. `saveItem`'s `AnyDsuItem` union (Pattern C) is the union of these three. Use the same shape in `defineEmits<{ save: [item: AddDsuMeeting & { id?: string }] }>()` in each Manage* dialog.

### Pattern: Mapper cast inside `if (item.id)` branch (Pitfall #7)

**Source:** `src/views/LexTrackView.vue:120, 131, 142` (existing convention)
```typescript
await pb.collection('dsu_supports').update(item.id, mapToUpdateSupport(item as DsuSupports));
```
**Apply to:** `saveItem` helper. The cast is safe because the `if (item.id)` guard implies the item came from PB and has the auto-fields (`created`, `updated`).

### Pattern: `dayjs(date).format('YYYY-MM-DD')` for PB date strings

**Source:** `src/views/LexTrackView.vue:94, 123, 134, 145`
```typescript
filter: `date ~ "${dayjs(newDate).format('YYYY-MM-DD')}"`
item.date = dayjs(selectedDate.value).format('YYYY-MM-DD');
```
**Apply to:** `loadForDate` filter and `saveItem` create-path date stamping. **Note:** in `saveItem`, prefer `payload = { ...item, date: ... }` over mutation (`item.date = ...`) to keep create payload pure (Pattern C above).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (Phase 4 dialog `@save` event handlers in LexTrackView) | view event handler | request-response | Phase 3 left dialogs as local toast stubs; no parent-side save handler exists. Reference shape lives in RESEARCH.md Pattern 3 — `loadForDate` is the closest "async + try/catch + isLoading + toast" template in this codebase. |
| (`ClientResponseError` import) | error type | n/a | Not previously imported anywhere in `src/`. New for Phase 4 (Pitfall #5). |
| (`onMounted` import in LexTrackView) | lifecycle | n/a | Existing watcher only; no `onMounted` use in `src/views/LexTrackView.vue` today. New for Phase 4 (D-17). |

## Metadata

**Analog search scope:**
- `src/views/` (LexTrackView only — single auth-gated DSU view)
- `src/components/projects/lextrack/` (4 components)
- `src/composables/lextrack/` (1 composable — `useDurationField.ts`)
- `src/lib/pocketbase/` (singleton + 3 mappers)
- `src/types/lextrack/` (3 type modules)

**Files scanned:** 11 source files (read fully) + glob across `src/composables/**/*.ts`.

**Key insight for the planner:** Phase 4 is overwhelmingly an in-place refactor of `LexTrackView.vue`. Of the five sub-patterns inside that file, four (A/B/C/D) have direct same-file analogs — the planner can author plans as "replace lines X-Y with shape Z" rather than "build new from scratch." Only Pattern E (the dialog `@save` parent handler) is genuinely new code, and it follows the same `try/catch/finally + toast + console.error + isLoading toggle` shape as Pattern A. The three Manage* dialogs are surface-level edits (drop a toast stub, add a prop, add an emit, swap the button click handler).

**Pattern extraction date:** 2026-04-29
