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

const router = useRouter();
const auth = useAuthStore();

const isLoading = ref(false);
const isSaving = ref(false);
const isSavingMeeting = ref(false);
const isSavingTask = ref(false);
const isSavingSupport = ref(false);

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

  // MEETINGS
  for (const item of meetings.value) {
    if(item.id){
      await pb.collection('dsu_meetings').update(item.id, mapToUpdateMeeting(item as DsuMeetings));
    }
    else {
      item.date = dayjs(selectedDate.value).format('YYYY-MM-DD');
      await pb.collection('dsu_meetings').create(item);
    }
  }

  // TASKS
  for (const item of tasks.value) {
    if(item.id){
      await pb.collection('dsu_tasks').update(item.id, mapToUpdateTask(item as DsuTasks));
    }
    else {
      item.date = dayjs(selectedDate.value).format('YYYY-MM-DD');
      await pb.collection('dsu_tasks').create(item);
    }
  }
}
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
        <div>
          <Button label="Save" :disabled="isNoEntry" @click="save"/>
        </div>
      </div>

      <div class="mt-2 mb-2 max-w-sm mx-auto">


      </div>
      <div class="grid grid-cols-3 gap-2">
        <ActivityCard v-model:section="meetings" label="Meetings" @update="updateMeeting" @remove="removeMeeting"/>
        <ActivityCard v-model:section="tasks" label="Tasks" @update="updateTask" @remove="removeTask"/>
        <ActivityCard v-model:section="supports" label="Admin" @update="updateSupport" @remove="removeSupport"/>
      </div>
    </template>

  </Card>

  <ManageMeeting
      v-model:visible="viewMeetingDialogVisibility"
      v-model:meeting="meeting"/>

  <ManageTask v-model:visible="viewTaskDialogVisibility"
              v-model:task="task"/>

  <ManageSupport
      v-model:visible="viewSupportDialogVisibility"
      v-model:support="support" />
</template>

<style scoped>

</style>
