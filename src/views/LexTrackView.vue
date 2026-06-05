<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { remove, isEmpty } from "lodash-es";
import ActivityCard from "@/components/projects/lextrack/ActivityCard.vue";
import type { AddDsuTask, DsuTasks } from "@/types/lextrack/dsu_tasks/types";
import type {
  AddDsuSupport,
  DsuSupports,
} from "@/types/lextrack/dsu_supports/types";
import type {
  AddDsuMeeting,
  DsuMeetings,
} from "@/types/lextrack/dsu_meetings/types";
import ManageMeeting from "@/components/projects/lextrack/ManageMeeting.vue";
import ManageTask from "@/components/projects/lextrack/ManageTask.vue";
import ManageSupport from "@/components/projects/lextrack/ManageSupport.vue";
import { pb } from "@/lib/pocketbase";
import type { RecordFullListOptions } from "pocketbase";
import dayjs from "dayjs";
import { mapToUpdateSupport } from "@/lib/pocketbase/dsuSupportMapper.ts";
import { mapToUpdateMeeting } from "@/lib/pocketbase/dsuMeetingMapper.ts";
import { mapToUpdateTask } from "@/lib/pocketbase/dsuTaskMapper.ts";

const selectedDate = ref(new Date());

/** SUPPORTS */
/** SUPPORTS */
type DsuSupportItem = AddDsuSupport & { id?: string };
const supports = ref<DsuSupportItem[]>([]);
const support = ref<AddDsuSupport>({
  date: new Date().toISOString().split("T")[0],
  title: "",
  description: undefined,
});
const viewSupportDialogVisibility = ref(false);

const updateSupport = (index: number) => {
  support.value = supports.value[index] as AddDsuSupport;
  viewSupportDialogVisibility.value = true;
};

const removeSupport = (index: number) => {
  support.value = supports.value[index] as AddDsuSupport;
  remove(supports.value, (_, i) => i === index);
};

/** MEETINGS */
/** MEETINGS */
type DsuMeetingItem = AddDsuMeeting & { id?: string };
const meetings = ref<DsuMeetingItem[]>([]);
const meeting = ref<AddDsuMeeting>({
  date: new Date().toISOString().split("T")[0],
  title: "",
  duration_minutes: undefined,
  description: undefined,
});
const viewMeetingDialogVisibility = ref(false);

const updateMeeting = (index: number) => {
  meeting.value = meetings.value[index] as AddDsuMeeting;
  viewMeetingDialogVisibility.value = true;
};

const removeMeeting = (index: number) => {
  meeting.value = meetings.value[index] as AddDsuMeeting;
  remove(meetings.value, (_, i) => i === index);
};

/** TASKS */
/** TASKS */
type DsuTaskItem = AddDsuTask & { id?: string };
const tasks = ref<DsuTaskItem[]>([]);
const task = ref<AddDsuTask>({
  date: new Date().toISOString().split("T")[0],
  title: "",
  jira_link: undefined,
  description: undefined,
});
const viewTaskDialogVisibility = ref(false);

const updateTask = (index: number) => {
  task.value = tasks.value[index] as AddDsuTask;
  //console.log(index);
  // task.value = tasks.value[index] as AddDsuTask;
  viewTaskDialogVisibility.value = true;
};

const removeTask = (index: number) => {
  task.value = tasks.value[index] as AddDsuTask;
  remove(tasks.value, (_, i) => i === index);
};

const isNoEntry = computed(() => {
  return (
    isEmpty(meetings.value) && isEmpty(tasks.value) && isEmpty(supports.value)
  );
});

watch(selectedDate, async (newDate: Date) => {
  //console.log('Selected date changed:', newDate);
  // Here you can add logic to fetch or filter activities based on the new date

  const options: RecordFullListOptions = {
    filter: `date ~ "${dayjs(newDate).format("YYYY-MM-DD")}"`,
    sort: "-created",
  };

  // const supportsList = await pb.collection('dsu_supports').getFullList(options);
  //
  // const tasksList = await pb.collection('dsu_tasks').getFullList(options);
  //
  // const meetingsList = await pb.collection('dsu_meetings').getFullList(options);

  const [supportsList, tasksList, meetingsList] = await Promise.all([
    pb.collection("dsu_supports").getFullList<DsuSupports>(options),
    pb.collection("dsu_tasks").getFullList<DsuTasks>(options),
    pb.collection("dsu_meetings").getFullList<DsuMeetings>(options),
  ]);

  supports.value = supportsList;
  tasks.value = tasksList;
  meetings.value = meetingsList;

  //console.log(supportsList);
});

const save = async () => {
  // SUPPORTS
  for (const item of supports.value) {
    if (item.id) {
      await pb
        .collection("dsu_supports")
        .update(item.id, mapToUpdateSupport(item as DsuSupports));
    } else {
      item.date = dayjs(selectedDate.value).format("YYYY-MM-DD");
      await pb.collection("dsu_supports").create(item);
    }
  }

  // MEETINGS
  for (const item of meetings.value) {
    if (item.id) {
      await pb
        .collection("dsu_meetings")
        .update(item.id, mapToUpdateMeeting(item as DsuMeetings));
    } else {
      item.date = dayjs(selectedDate.value).format("YYYY-MM-DD");
      await pb.collection("dsu_meetings").create(item);
    }
  }

  // TASKS
  for (const item of tasks.value) {
    if (item.id) {
      await pb
        .collection("dsu_tasks")
        .update(item.id, mapToUpdateTask(item as DsuTasks));
    } else {
      item.date = dayjs(selectedDate.value).format("YYYY-MM-DD");
      await pb.collection("dsu_tasks").create(item);
    }
  }

  //console.log(supports.value);
};
</script>

<template>
  <!--  <LexTrackApp/>-->
  <Card>
    <template v-slot:content>
      <div class="flex justify-between items-end">
        <div>
          <label for="date" class="block text-sm font-medium mb-2"
            >Selected Date</label
          >
          <DatePicker
            v-model="selectedDate"
            showIcon
            inputId="date"
            class="w-full"
          />
        </div>
        <div>
          <Button label="Save" :disabled="isNoEntry" @click="save" />
        </div>
      </div>

      <div class="mt-2 mb-2 max-w-sm mx-auto"></div>
      <div class="grid grid-cols-3 gap-2">
        <ActivityCard
          v-model:section="meetings"
          label="Meetings"
          @update="updateMeeting"
          @remove="removeMeeting"
        />
        <ActivityCard
          v-model:section="tasks"
          label="Tasks"
          @update="updateTask"
          @remove="removeTask"
        />
        <ActivityCard
          v-model:section="supports"
          label="Admin Tasks and Support"
          @update="updateSupport"
          @remove="removeSupport"
        />
      </div>
    </template>
  </Card>

  <!--  <Button label="Show" @click="visible = true" />-->

  <!--  <Dialog v-model:visible="visible" header="Add DSU Update" :style="{ width: '50vw' }">-->
  <!--    <div class="mb-2 max-w-sm mx-auto">-->
  <!--      <label for="date" class="block text-sm font-medium mb-2">Selected Date</label>-->
  <!--      <DatePicker-->
  <!--          v-model="selectedDate"-->
  <!--          showIcon-->
  <!--          inputId="date"-->
  <!--          class="w-full"-->
  <!--      />-->
  <!--    </div>-->
  <!--    <Divider/>-->
  <!--    <div class="mb-2 max-w-sm mx-auto">-->
  <!--      <h4 class="mb-1 font-bold">Meetings</h4>-->
  <!--      <template v-for="(meeting, index) in meetings" :key="index">-->
  <!--        <Chip :label="meeting.title" icon="pi pi-calendar" removable class="mr-2 mb-2" @remove="removeMeeting($event, index)"/>-->
  <!--      </template>-->
  <!--      <Button fluid label="Add" rounded size="small" @click="addMeetingDialogVisibility = true">-->
  <!--        <template #icon>-->
  <!--          <iconify-icon icon="mdi:add" width="24" height="24"></iconify-icon>-->
  <!--        </template>-->
  <!--      </Button>-->
  <!--    </div>-->
  <!--    <Divider/>-->
  <!--    <div class="mb-2 max-w-sm mx-auto">-->
  <!--      <h4 class="mb-1 font-bold">Tasks</h4>-->
  <!--      <Button fluid label="Add" rounded size="small">-->
  <!--        <template #icon>-->
  <!--          <iconify-icon icon="mdi:add" width="24" height="24"></iconify-icon>-->
  <!--        </template>-->
  <!--      </Button>-->
  <!--    </div>-->
  <!--    <Divider/>-->
  <!--    <div class="mb-2 max-w-sm mx-auto">-->
  <!--      <h4 class="mb-1 font-bold">Admin Tasks and Support</h4>-->
  <!--      <Button fluid label="Add" rounded size="small">-->
  <!--        <template #icon>-->
  <!--          <iconify-icon icon="mdi:add" width="24" height="24"></iconify-icon>-->
  <!--        </template>-->
  <!--      </Button>-->
  <!--    </div>-->
  <!--  </Dialog>-->

  <!--  <AddMeeting-->
  <!--      v-model:visible="addMeetingDialogVisibility"-->
  <!--      v-model:meetings="meetings"-->
  <!--  />-->

  <ManageMeeting
    v-model:visible="viewMeetingDialogVisibility"
    v-model:meeting="meeting"
  />

  <ManageTask v-model:visible="viewTaskDialogVisibility" v-model:task="task" />

  <ManageSupport
    v-model:visible="viewSupportDialogVisibility"
    v-model:support="support"
  />
</template>

<style scoped></style>
