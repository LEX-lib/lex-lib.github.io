<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { isEmpty } from 'lodash-es';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { ClientResponseError } from 'pocketbase';
import type { RecordFullListOptions } from 'pocketbase';
import dayjs from 'dayjs';
import ActivityCard from '@/components/projects/lextrack/ActivityCard.vue';
import ManageMeeting from '@/components/projects/lextrack/ManageMeeting.vue';
import ManageTask from '@/components/projects/lextrack/ManageTask.vue';
import ManageSupport from '@/components/projects/lextrack/ManageSupport.vue';
import { pb } from '@/lib/pocketbase';
import { useAuthStore } from '@/stores/auth';
import type { AddDsuTask, DsuTasks } from '@/types/lextrack/dsu_tasks/types';
import type { AddDsuSupport, DsuSupports } from '@/types/lextrack/dsu_supports/types';
import type { AddDsuMeeting, DsuMeetings } from '@/types/lextrack/dsu_meetings/types';
import { mapToUpdateSupport } from '@/lib/pocketbase/dsuSupportMapper';
import { mapToUpdateMeeting } from '@/lib/pocketbase/dsuMeetingMapper';
import { mapToUpdateTask } from '@/lib/pocketbase/dsuTaskMapper';
import { mapToCreateMeeting } from '@/lib/pocketbase/dsuMeetingMapper';
import { mapToCreateTask } from '@/lib/pocketbase/dsuTaskMapper';
import { mapToCreateSupport } from '@/lib/pocketbase/dsuSupportMapper';
import type { DsuDayStatus } from '@/types/lextrack/dsu_day_status/types';
import { mapToCreateDayStatus, mapFromRecordDayStatus } from '@/lib/pocketbase/dsuDayStatusMapper';

const router = useRouter();
const auth = useAuthStore();

const DAY_STATUS_OPTIONS = [
  { label: 'SL', value: 'sl' },
  { label: 'VL', value: 'vl' },
  { label: 'Holiday', value: 'holiday' },
  { label: 'BL', value: 'bl' },
  { label: 'Others', value: 'others' },
];

const isLoading = ref(false);
const isSaving = ref(false);
const isSavingMeeting = ref(false);
const isSavingTask = ref(false);
const isSavingSupport = ref(false);
const isSavingStatus = ref(false);

/**
 * Centralized 401 handler. Clears auth and bounces the user to /login with a redirect-back query.
 * Returns true if the error was a 401 (caller should NOT also fire its own toast).
 */
const handle401 = (err: unknown): boolean => {
  if (err instanceof ClientResponseError && err.status === 401) {
    console.warn('[lextrack auth] 401 — clearing session and redirecting to /login');
    auth.logout();
    void router.push({ path: '/login', query: { redirect: '/projects/lextrack' } });
    return true;
  }
  return false;
};

const selectedDate = ref(new Date());
const dayStatus = ref<DsuDayStatus | null>(null);

/** SUPPORTS */
type DsuSupportItem = AddDsuSupport & { id?: string };
const supports = ref<DsuSupportItem[]>([]);
const support = ref<AddDsuSupport>({
  date: new Date().toISOString().split('T')[0],
  title: '',
  description: undefined
});
const viewSupportDialogVisibility = ref(false);

const updateSupport = (index: number) => {
  support.value = supports.value[index] as AddDsuSupport;
  viewSupportDialogVisibility.value = true;
}

// Replaces existing removeSupport:
const removeSupport = async (index: number) => {
  const item = supports.value[index];
  // D-07: local-only delete is silent
  if (!item.id) {
    supports.value.splice(index, 1);
    return;
  }
  // D-05: optimistic — capture index + item BEFORE splicing (Pitfall #1)
  const originalIndex = index;
  const originalItem = item;
  supports.value.splice(index, 1);
  try {
    await pb.collection('dsu_supports').delete(item.id);
  } catch (err) {
    // Pitfall #5: 404 means PB already deleted it — user intent met, swallow silently
    if (err instanceof ClientResponseError && err.status === 404) {
      console.warn('[lextrack delete support] 404 — already gone, treating as success');
      return;
    }
    if (handle401(err)) return;
    console.error('[lextrack delete support]', err);
    toast.error("Couldn't delete your admin item — restored.");
    // Pitfall #1: clamp the rollback index in case array shifted during the in-flight call
    const safeIndex = Math.min(originalIndex, supports.value.length);
    supports.value.splice(safeIndex, 0, originalItem);
  }
};

/** MEETINGS */
type DsuMeetingItem = AddDsuMeeting & { id?: string };
const meetings = ref<DsuMeetingItem[]>([]);
const meeting = ref<AddDsuMeeting>({
  date: new Date().toISOString().split('T')[0],
  title: '',
  duration_minutes: undefined,
  description: undefined
});
const viewMeetingDialogVisibility = ref(false);

const updateMeeting = (index: number) => {
  meeting.value = meetings.value[index] as AddDsuMeeting;
  viewMeetingDialogVisibility.value = true;
}

// Replaces existing removeMeeting:
const removeMeeting = async (index: number) => {
  const item = meetings.value[index];
  if (!item.id) {
    meetings.value.splice(index, 1);
    return;
  }
  const originalIndex = index;
  const originalItem = item;
  meetings.value.splice(index, 1);
  try {
    await pb.collection('dsu_meetings').delete(item.id);
  } catch (err) {
    if (err instanceof ClientResponseError && err.status === 404) {
      console.warn('[lextrack delete meeting] 404 — already gone, treating as success');
      return;
    }
    if (handle401(err)) return;
    console.error('[lextrack delete meeting]', err);
    toast.error("Couldn't delete your meeting — restored.");
    const safeIndex = Math.min(originalIndex, meetings.value.length);
    meetings.value.splice(safeIndex, 0, originalItem);
  }
};

/** TASKS */
type DsuTaskItem = AddDsuTask & { id?: string };
const tasks = ref<DsuTaskItem[]>([]);
const task = ref<AddDsuTask>({
  date: new Date().toISOString().split('T')[0],
  title: '',
  jira_link: undefined,
  description: undefined
});
const viewTaskDialogVisibility = ref(false);

const updateTask = (index: number) => {
  task.value = tasks.value[index] as AddDsuTask;
  viewTaskDialogVisibility.value = true;
}

// Replaces existing removeTask:
const removeTask = async (index: number) => {
  const item = tasks.value[index];
  if (!item.id) {
    tasks.value.splice(index, 1);
    return;
  }
  const originalIndex = index;
  const originalItem = item;
  tasks.value.splice(index, 1);
  try {
    await pb.collection('dsu_tasks').delete(item.id);
  } catch (err) {
    if (err instanceof ClientResponseError && err.status === 404) {
      console.warn('[lextrack delete task] 404 — already gone, treating as success');
      return;
    }
    if (handle401(err)) return;
    console.error('[lextrack delete task]', err);
    toast.error("Couldn't delete your task — restored.");
    const safeIndex = Math.min(originalIndex, tasks.value.length);
    tasks.value.splice(safeIndex, 0, originalItem);
  }
};

const isNoEntry = computed(() => {
  return isEmpty(meetings.value) && isEmpty(tasks.value) && isEmpty(supports.value);
});

const loadForDate = async (date: Date): Promise<void> => {
  isLoading.value = true;
  try {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    const options: RecordFullListOptions = {
      filter: `date ~ "${dateStr}"`,
      sort: '-created',
    };
    const [supportsList, tasksList, meetingsList, statusList] = await Promise.all([
      pb.collection('dsu_supports').getFullList<DsuSupports>(options),
      pb.collection('dsu_tasks').getFullList<DsuTasks>(options),
      pb.collection('dsu_meetings').getFullList<DsuMeetings>(options),
      pb.collection('dsu_day_status').getFullList<DsuDayStatus>({
        filter: `date = "${dateStr}"`,
      }),
    ]);
    supports.value = supportsList;
    tasks.value = tasksList;
    meetings.value = meetingsList;
    dayStatus.value = statusList[0] ?? null;
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

type CollectionName = 'dsu_meetings' | 'dsu_tasks' | 'dsu_supports';
type AnyDsuItem = DsuMeetingItem | DsuTaskItem | DsuSupportItem;

/**
 * Shared save helper. Branches on `item.id` for create-vs-update.
 * Returns the PB record (with server-assigned auto-fields on create) so callers can patch `id`.
 * D-03 / Pitfall #7: cast inside the `if (item.id)` branch is safe — id presence implies the
 * record came from PB and has auto-fields (`created`, `updated`).
 */
const saveItem = async (collection: CollectionName, item: AnyDsuItem) => {
  const dateStr = dayjs(selectedDate.value).format('YYYY-MM-DD');

  if (item.id) {
    // Update path — uses mapToUpdate*
    if (collection === 'dsu_meetings') {
      return await pb.collection('dsu_meetings').update(item.id, mapToUpdateMeeting(item as DsuMeetings));
    }
    if (collection === 'dsu_tasks') {
      return await pb.collection('dsu_tasks').update(item.id, mapToUpdateTask(item as DsuTasks));
    }
    return await pb.collection('dsu_supports').update(item.id, mapToUpdateSupport(item as DsuSupports));
  }

  // Create path — calls mapToCreate* for symmetry with update path (RESEARCH Q#2 RESOLVED).
  // For meetings this also applies the `duration_unit: 'minutes'` legacy default per Phase 2 D-12
  // when an inline-added meeting omits the unit.
  if (collection === 'dsu_meetings') {
    return await pb.collection('dsu_meetings').create(mapToCreateMeeting({ ...item, date: dateStr } as AddDsuMeeting));
  }
  if (collection === 'dsu_tasks') {
    return await pb.collection('dsu_tasks').create(mapToCreateTask({ ...item, date: dateStr } as AddDsuTask));
  }
  return await pb.collection('dsu_supports').create(mapToCreateSupport({ ...item, date: dateStr } as AddDsuSupport));
};

/**
 * Dialog @save handler for ManageMeeting.
 * D-01: pessimistic — wait for PB; on success patch `id` and close. On fail keep dialog open.
 * Pitfall #6: meeting.value aliases the array entry via defineModel, so reference-identity lookup works.
 * Pitfall #9: replace the entry entirely instead of mutating .id in place.
 */
const handleMeetingSave = async (item: DsuMeetingItem) => {
  isSavingMeeting.value = true;
  try {
    const saved = await saveItem('dsu_meetings', item);
    const idx = meetings.value.indexOf(item);
    if (idx !== -1 && !item.id) {
      meetings.value[idx] = { ...item, id: saved.id };
    }
    toast.success('Meeting saved!');
    viewMeetingDialogVisibility.value = false;  // D-04: close AFTER success
  } catch (err) {
    if (handle401(err)) return;
    console.error('[lextrack save meeting]', err);
    toast.error("Couldn't save your meeting — try again?");
    // D-01: dialog stays open; user retries without re-typing
  } finally {
    isSavingMeeting.value = false;
  }
};

const handleTaskSave = async (item: DsuTaskItem) => {
  isSavingTask.value = true;
  try {
    const saved = await saveItem('dsu_tasks', item);
    const idx = tasks.value.indexOf(item);
    if (idx !== -1 && !item.id) {
      tasks.value[idx] = { ...item, id: saved.id };
    }
    toast.success('Task saved!');
    viewTaskDialogVisibility.value = false;
  } catch (err) {
    if (handle401(err)) return;
    console.error('[lextrack save task]', err);
    toast.error("Couldn't save your task — try again?");
  } finally {
    isSavingTask.value = false;
  }
};

const handleSupportSave = async (item: DsuSupportItem) => {
  isSavingSupport.value = true;
  try {
    const saved = await saveItem('dsu_supports', item);
    const idx = supports.value.indexOf(item);
    if (idx !== -1 && !item.id) {
      supports.value[idx] = { ...item, id: saved.id };
    }
    toast.success('Admin item saved!');
    viewSupportDialogVisibility.value = false;
  } catch (err) {
    if (handle401(err)) return;
    console.error('[lextrack save support]', err);
    toast.error("Couldn't save your admin item — try again?");
  } finally {
    isSavingSupport.value = false;
  }
};

/**
 * Page-level batch save. D-02 / D-18 / D-24a:
 * - Iterate all three arrays in order (supports → meetings → tasks).
 * - Per-item try/catch — continue on failure, toast each error.
 * - After the loop, refetch via loadForDate so every item has its server `id` and
 *   any server-side normalizations land in local state (D-18).
 * - Success toast only if zero failures (Open Question #3 in RESEARCH.md).
 */
const save = async () => {
  isSaving.value = true;
  let failureCount = 0;
  try {
    for (const item of supports.value) {
      try {
        await saveItem('dsu_supports', item);
      } catch (err) {
        if (handle401(err)) return;
        console.error('[lextrack save support]', err);
        toast.error(`Couldn't save "${item.title || 'untitled admin item'}" — try again?`);
        failureCount++;
      }
    }
    for (const item of meetings.value) {
      try {
        await saveItem('dsu_meetings', item);
      } catch (err) {
        if (handle401(err)) return;
        console.error('[lextrack save meeting]', err);
        toast.error(`Couldn't save "${item.title || 'untitled meeting'}" — try again?`);
        failureCount++;
      }
    }
    for (const item of tasks.value) {
      try {
        await saveItem('dsu_tasks', item);
      } catch (err) {
        if (handle401(err)) return;
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

/**
 * D-03: Immediately upserts or deletes the day status on PB.
 * value == null (null or undefined) means the user deselected the active option (D-04 allowEmpty).
 * D-18: stores the full PB record in dayStatus so .id is available for future delete/update.
 * CR-01: guarded by isSavingStatus to prevent duplicate-record race on rapid double-click.
 */
const setDayStatus = async (value: string | null): Promise<void> => {
  if (isSavingStatus.value) return;          // drop concurrent calls
  isSavingStatus.value = true;
  const dateStr = dayjs(selectedDate.value).format('YYYY-MM-DD');
  if (value == null) {
    // Clear path: delete existing record (WR-02: catches both null and undefined)
    if (!dayStatus.value) { isSavingStatus.value = false; return; }
    try {
      await pb.collection('dsu_day_status').delete(dayStatus.value.id);
      dayStatus.value = null;
    } catch (err) {
      if (handle401(err)) { isSavingStatus.value = false; return; }
      console.error('[lextrack day status delete]', err);
      toast.error("Couldn't clear day status — try again?");
    } finally {
      isSavingStatus.value = false;
    }
    return;
  }
  // Set path: update existing or create new
  try {
    if (dayStatus.value) {
      // Update existing record — send only status field (WR-01: do not include date in update payload)
      const updated = await pb
        .collection('dsu_day_status')
        .update<DsuDayStatus>(dayStatus.value.id, { status: value as DsuDayStatus['status'] });
      dayStatus.value = mapFromRecordDayStatus(updated);
    } else {
      // Create new record
      const created = await pb
        .collection('dsu_day_status')
        .create<DsuDayStatus>(mapToCreateDayStatus({ date: dateStr, status: value as DsuDayStatus['status'] }));
      dayStatus.value = mapFromRecordDayStatus(created);
    }
  } catch (err) {
    if (handle401(err)) { isSavingStatus.value = false; return; }
    console.error('[lextrack day status set]', err);
    toast.error("Couldn't set day status — try again?");
  } finally {
    isSavingStatus.value = false;
  }
};

/**
 * Computed for SelectButton v-model binding.
 * Returns the status string value or null when no status is set.
 */
const selectedStatus = computed(() => dayStatus.value?.status ?? null);

/**
 * Full human-readable names for the status banner and export (D-06, D-12).
 * Note: 'others' maps to 'Others' (plural) per user preference (D-12),
 * not 'Other' from DSU_DAY_STATUS_LABELS (which uses singular for the display label).
 */
const STATUS_FULL_NAMES: Record<string, string> = {
  sl: 'Sick Leave',
  vl: 'Vacation Leave',
  holiday: 'Holiday',
  bl: 'Birthday Leave',
  others: 'Others',
};

const statusFullName = computed(() =>
  dayStatus.value ? (STATUS_FULL_NAMES[dayStatus.value.status] ?? dayStatus.value.status) : ''
);

/**
 * D-14 / D-17: Strip Quill HTML using DOMParser (browser-native, no new deps).
 * Returns an array of non-empty text lines, each becomes a "* {line}" bullet in export.
 */
const stripHtml = (html: string): string[] => {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.body.querySelectorAll('p, li, div'))
    .map(el => el.textContent?.trim() ?? '')
    .filter(line => line.length > 0);
};

/**
 * D-09: Build the canonical export string from local state (no PB calls).
 * Follows dsu-format.md FORMAT spec exactly.
 */
const buildExportString = (): string => {
  const dateHeader = `[${dayjs(selectedDate.value).format('MM/DD/YYYY')}]`;

  // D-12: status day — two lines only
  if (dayStatus.value) {
    return `${dateHeader}\n${statusFullName.value}`;
  }

  const lines: string[] = [dateHeader];

  // Meetings section (D-16: skip if empty)
  if (meetings.value.length > 0) {
    lines.push('Meetings:');
    for (const m of meetings.value) {
      const duration = m.duration_minutes != null ? ` (${m.duration_minutes} mins)` : '';
      lines.push(`- ${m.title}${duration}`);
    }
  }

  // Tasks section (D-16: skip if empty)
  if (tasks.value.length > 0) {
    if (lines.length > 1) lines.push('');  // blank line separator
    lines.push('Tasks:');
    for (const t of tasks.value) {
      // D-11: jira_link prefix (no leading dash) or leading dash when absent
      const taskLine = t.jira_link ? `${t.jira_link} - ${t.title}` : `- ${t.title}`;
      lines.push(taskLine);
      if (t.description) {
        for (const bullet of stripHtml(t.description)) {
          lines.push(`* ${bullet}`);
        }
      }
    }
  }

  // Admin section (D-16: skip if empty)
  if (supports.value.length > 0) {
    if (lines.length > 1) lines.push('');  // blank line separator
    lines.push('Admin:');
    for (const s of supports.value) {
      // D-11: link prefix or plain title
      const adminLine = s.link ? `- ${s.link} - ${s.title}` : `- ${s.title}`;
      lines.push(adminLine);
      if (s.description) {
        for (const bullet of stripHtml(s.description)) {
          lines.push(`* ${bullet}`);
        }
      }
    }
  }

  return lines.join('\n');
};

/**
 * D-15: Copy export string to clipboard; toast success or failure.
 * D-19: Export button visible regardless of dayStatus (status day produces two-line format).
 * Uses execCommand fallback for browsers that block the Clipboard API on localhost.
 */
const exportDay = async (): Promise<void> => {
  const text = buildExportString();
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
      return;
    } catch {
      // fall through to execCommand fallback
    }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) toast.success('Copied to clipboard!');
    else toast.error('Copy failed — check browser permissions.');
  } catch {
    toast.error('Copy failed — check browser permissions.');
  }
};
</script>

<template>
  <Card>
    <template v-slot:content>
      <div class="flex justify-between items-end">
        <div>
          <label for="date" class="block text-sm font-medium mb-2">Selected Date</label>
          <DatePicker
              v-model="selectedDate"
              showIcon
              inputId="date"
              class="w-full"
          />
        </div>
        <div class="flex items-end">
          <SelectButton
              :modelValue="selectedStatus"
              :options="DAY_STATUS_OPTIONS"
              optionLabel="label"
              optionValue="value"
              :allowEmpty="true"
              :disabled="isLoading || isSavingStatus"
              aria-label="Mark day as"
              @change="setDayStatus($event.value)"
          />
        </div>
        <div class="flex items-end gap-2">
          <Button label="Export Day" icon="pi pi-copy" iconPos="left" :disabled="isLoading" @click="exportDay()"/>
          <Button label="Save" :loading="isSaving" :disabled="isNoEntry || isLoading" @click="save"/>
        </div>
      </div>

      <div class="mt-2 mb-2 max-w-sm mx-auto">


      </div>
      <div
          v-if="!dayStatus"
          class="grid grid-cols-3 gap-2 transition-opacity"
          :class="{ 'opacity-50 pointer-events-none': isLoading }">
        <ActivityCard v-model:section="meetings" label="Meetings" @update="updateMeeting" @remove="removeMeeting"/>
        <ActivityCard v-model:section="tasks" label="Tasks" @update="updateTask" @remove="removeTask"/>
        <ActivityCard v-model:section="supports" label="Admin" @update="updateSupport" @remove="removeSupport"/>
      </div>
      <div v-else class="flex items-center justify-center py-16 transition-opacity">
        <span class="text-xl font-semibold text-(--color-typo-heading)">
          {{ statusFullName }} — {{ dayjs(selectedDate).format('YYYY-MM-DD') }}
        </span>
      </div>
    </template>

  </Card>

  <ManageMeeting
      v-model:visible="viewMeetingDialogVisibility"
      v-model:meeting="meeting"
      :saving="isSavingMeeting"
      @save="handleMeetingSave" />

  <ManageTask
      v-model:visible="viewTaskDialogVisibility"
      v-model:task="task"
      :saving="isSavingTask"
      @save="handleTaskSave" />

  <ManageSupport
      v-model:visible="viewSupportDialogVisibility"
      v-model:support="support"
      :saving="isSavingSupport"
      @save="handleSupportSave" />
</template>

<style scoped>

</style>
