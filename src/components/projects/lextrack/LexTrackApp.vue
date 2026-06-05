<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import DOMPurify from "dompurify";

const sanitize = (html: string) => DOMPurify.sanitize(html);
// import Calendar from 'primevue/calendar';
// import InputText from 'primevue/inputtext';
// import InputNumber from 'primevue/inputnumber';
// import Editor from 'primevue/editor';
// import Button from 'primevue/button';
// import TabView from 'primevue/tabview';
// import TabPanel from 'primevue/tabpanel';

// --- STATE MANAGEMENT ---

const selectedDate = ref(new Date());

// Lists to hold activities for the selected date
// Lists to hold activities for the selected date
interface Task {
  task_name: string;
  jira_link: string;
  description: string;
  date?: string;
}
interface Meeting {
  title: string;
  duration_minutes: number;
  description: string;
  date?: string;
}
interface AdminSupport {
  title: string;
  description: string;
  date?: string;
}

const tasks = ref<Task[]>([]);
const meetings = ref<Meeting[]>([]);
const adminSupports = ref<AdminSupport[]>([]);

// Form models for new entries
const newTask = ref({ name: "", jira: "", desc: "" });
const newMeeting = ref({ title: "", duration: null, desc: "" });
const newAdminSupport = ref({ title: "", desc: "" });

// Common styles for the Editor component.
// Phase 21-01 refactor: semantic tokens auto-switch via Phase 18's .my-app-dark
// block in base.css, so a single set of classes covers both themes.
const editorStyle = {
  toolbar: { class: "bg-surface-card border-surface-divider" },
  content: {
    class: "bg-surface-card border-surface-divider text-typo-body",
  },
};

// --- LOGIC ---

// Fetch all data for a given date (stub — replace with PocketBase calls)
// Example: const dateString = date.toISOString().split('T')[0]
// tasks.value = await pb.collection('main_tasks').getFullList({ filter: `date = '${dateString}'` })
const fetchDataForDate = async () => {
  tasks.value = [];
  meetings.value = [];
  adminSupports.value = [];
};

// Watch for changes in the selected date and refetch data
watch(selectedDate, (newDate) => {
  if (newDate) {
    fetchDataForDate();
  }
});

// Fetch data for today's date when the component is first loaded
onMounted(() => {
  fetchDataForDate();
});

// --- HANDLERS for adding new items ---

const addTask = () => {
  if (!newTask.value.name || !newTask.value.desc) {
    alert("Task Name and Description are required.");
    return;
  }
  const payload = {
    date: selectedDate.value.toISOString().split("T")[0],
    task_name: newTask.value.name,
    jira_link: newTask.value.jira,
    description: newTask.value.desc,
  };
  // API Call: await pb.collection('main_tasks').create(payload);

  tasks.value.push(payload); // Optimistic update
  newTask.value = { name: "", jira: "", desc: "" }; // Reset form
};

const addMeeting = () => {
  if (!newMeeting.value.title || !newMeeting.value.desc) {
    alert("Meeting Title and Description are required.");
    return;
  }
  const payload = {
    date: selectedDate.value.toISOString().split("T")[0],
    title: newMeeting.value.title,
    duration_minutes: newMeeting.value.duration || 0,
    description: newMeeting.value.desc,
  };
  // API Call: await pb.collection('meetings').create(payload);

  meetings.value.push(payload); // Optimistic update
  newMeeting.value = { title: "", duration: null, desc: "" }; // Reset form
};

const addAdminSupport = () => {
  if (!newAdminSupport.value.title || !newAdminSupport.value.desc) {
    alert("Title and Description are required.");
    return;
  }
  const payload = {
    date: selectedDate.value.toISOString().split("T")[0],
    title: newAdminSupport.value.title,
    description: newAdminSupport.value.desc,
  };
  // API Call: await pb.collection('admin_supports').create(payload);

  adminSupports.value.push(payload); // Optimistic update
  newAdminSupport.value = { title: "", desc: "" }; // Reset form
};
</script>

<template>
  <div
    class="bg-surface-page min-h-screen flex items-center justify-center p-4"
  >
    <div
      class="w-full max-w-4xl bg-surface-card p-8 rounded-lg shadow-lg"
    >
      <h1
        class="text-3xl font-bold text-center mb-2 text-typo-heading"
      >
        LexTrack Daily Activities 📝
      </h1>
      <p class="text-center text-typo-muted mb-6">
        Select a date to log or view your activities.
      </p>

      <!-- Date Selector -->
      <div class="mb-8 max-w-sm mx-auto">
        <label
          for="date"
          class="block text-sm font-medium text-typo-body mb-2"
          >Selected Date</label
        >
        <DatePicker
          v-model="selectedDate"
          showIcon
          inputId="date"
          class="lextrack-datepicker w-full"
          :pt="{
            input: {
              class:
                'w-full bg-surface-card border-surface-divider text-typo-body rounded-md',
            },
            panel: {
              class: 'bg-surface-card border-surface-divider',
            },
          }"
        />
      </div>

      <!-- Tabbed Interface for Activities -->
      <TabView
        class="lextrack-tabview"
        :pt="{
          nav: {
            class: 'bg-surface-card border-b border-surface-divider',
          },
          navContent: { class: 'bg-surface-card' },
          inkbar: { class: 'bg-indigo-500' },
        }"
      >
        <!-- Main Tasks Tab -->
        <TabPanel
          value="0"
          header="Main Tasks"
          :pt="{
            headerAction: {
              class: 'bg-surface-card text-typo-heading',
            },
          }"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Form for adding a new task -->
            <div
              class="space-y-4 p-4 bg-surface-page/60 rounded-lg"
            >
              <h3 class="font-bold text-lg text-typo-heading">
                Add New Task
              </h3>
              <div>
                <InputText
                  v-model="newTask.name"
                  placeholder="Task Name"
                  class="w-full bg-surface-card text-typo-body"
                />
              </div>
              <div>
                <InputText
                  v-model="newTask.jira"
                  placeholder="Jira Ticket Link"
                  class="w-full bg-surface-card text-typo-body"
                />
              </div>
              <div>
                <Editor
                  v-model="newTask.desc"
                  editorStyle="height: 120px"
                  :pt="editorStyle"
                />
              </div>
              <Button
                label="Add Task"
                @click="addTask"
                class="w-full bg-indigo-600 hover:bg-indigo-700"
              />
            </div>
            <!-- List of existing tasks -->
            <div
              class="space-y-3 p-4 bg-surface-page/60 rounded-lg max-h-96 overflow-y-auto"
            >
              <h3 class="font-bold text-lg text-typo-heading">
                Logged Tasks for Today
              </h3>
              <div v-if="!tasks.length" class="text-typo-muted">
                No tasks logged for this date.
              </div>
              <div
                v-for="(task, index) in tasks"
                :key="`task-${index}`"
                class="bg-surface-card border border-surface-divider p-3 rounded-md"
              >
                <p class="font-bold text-typo-heading">
                  {{ task.task_name }}
                </p>
                <a
                  :href="task.jira_link"
                  target="_blank"
                  class="text-sm text-indigo-600 dark:text-indigo-300 hover:underline truncate"
                  >{{ task.jira_link }}</a
                >
                <div
                  class="text-sm text-typo-body mt-2"
                  v-html="sanitize(task.description)"
                ></div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- Meetings Tab -->
        <TabPanel
          value="1"
          header="Meetings"
          :pt="{
            headerAction: {
              class: 'bg-surface-card text-typo-heading',
            },
          }"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Form for adding a new meeting -->
            <div
              class="space-y-4 p-4 bg-surface-page/60 rounded-lg"
            >
              <h3 class="font-bold text-lg text-typo-heading">
                Add New Meeting
              </h3>
              <div>
                <InputText
                  v-model="newMeeting.title"
                  placeholder="Meeting Title"
                  class="w-full bg-surface-card text-typo-body"
                />
              </div>
              <div>
                <InputNumber
                  v-model="newMeeting.duration"
                  placeholder="Duration (minutes)"
                  class="w-full"
                  inputClass="bg-surface-card text-typo-body w-full rounded-md"
                />
              </div>
              <div>
                <Editor
                  v-model="newMeeting.desc"
                  editorStyle="height: 120px"
                  :pt="editorStyle"
                />
              </div>
              <Button
                label="Add Meeting"
                @click="addMeeting"
                class="w-full bg-indigo-600 hover:bg-indigo-700"
              />
            </div>
            <!-- List of existing meetings -->
            <div
              class="space-y-3 p-4 bg-surface-page/60 rounded-lg max-h-96 overflow-y-auto"
            >
              <h3 class="font-bold text-lg text-typo-heading">
                Logged Meetings for Today
              </h3>
              <div v-if="!meetings.length" class="text-typo-muted">
                No meetings logged for this date.
              </div>
              <div
                v-for="(meeting, index) in meetings"
                :key="`meeting-${index}`"
                class="bg-surface-card border border-surface-divider p-3 rounded-md"
              >
                <div class="flex justify-between items-center">
                  <p class="font-bold text-typo-heading">
                    {{ meeting.title }}
                  </p>
                  <span
                    class="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-1 rounded-full"
                    >{{ meeting.duration_minutes }} mins</span
                  >
                </div>
                <div
                  class="text-sm text-typo-body mt-2"
                  v-html="sanitize(meeting.description)"
                ></div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- Admin Support Tab -->
        <TabPanel
          value="2"
          header="Admin Support"
          :pt="{
            headerAction: {
              class: 'bg-surface-card text-typo-heading',
            },
          }"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Form for adding new admin support -->
            <div
              class="space-y-4 p-4 bg-surface-page/60 rounded-lg"
            >
              <h3 class="font-bold text-lg text-typo-heading">
                Add Admin/Support Task
              </h3>
              <div>
                <InputText
                  v-model="newAdminSupport.title"
                  placeholder="Task Title"
                  class="w-full bg-surface-card text-typo-body"
                />
              </div>
              <div>
                <Editor
                  v-model="newAdminSupport.desc"
                  editorStyle="height: 160px"
                  :pt="editorStyle"
                />
              </div>
              <Button
                label="Add Support Task"
                @click="addAdminSupport"
                class="w-full bg-indigo-600 hover:bg-indigo-700"
              />
            </div>
            <!-- List of existing admin supports -->
            <div
              class="space-y-3 p-4 bg-surface-page/60 rounded-lg max-h-96 overflow-y-auto"
            >
              <h3 class="font-bold text-lg text-typo-heading">
                Logged Support Tasks
              </h3>
              <div
                v-if="!adminSupports.length"
                class="text-typo-muted"
              >
                No support tasks logged for this date.
              </div>
              <div
                v-for="(support, index) in adminSupports"
                :key="`support-${index}`"
                class="bg-surface-card border border-surface-divider p-3 rounded-md"
              >
                <p class="font-bold text-typo-heading">
                  {{ support.title }}
                </p>
                <div
                  class="text-sm text-typo-body mt-2"
                  v-html="sanitize(support.description)"
                ></div>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>
  </div>
</template>

<style>
/* PrimeVue overrides for LexTrack.
 *
 * Phase 21-01 refactor: the previously hardcoded dark grays
 * (#374151, #4b5563, #f9fafb) have been replaced with the Phase 18
 * @theme CSS variables so the overrides auto-switch between light and
 * dark mode via the .my-app-dark block in base.css.
 *
 * The .lextrack-tabview / .lextrack-datepicker scope keeps these rules
 * from leaking to other mini-apps. */
.lextrack-datepicker .p-datepicker-header,
.lextrack-tabview .p-tabview-nav-link {
  background: var(--color-surface-card) !important;
  color: var(--color-typo-heading) !important;
  border-bottom: 1px solid var(--color-surface-divider) !important;
}

.lextrack-tabview .p-tabview-nav-link.p-highlight {
  color: #4f46e5 !important;
}

.my-app-dark .lextrack-tabview .p-tabview-nav-link.p-highlight {
  color: #a5b4fc !important;
}

.lextrack-datepicker .p-datepicker-title,
.lextrack-datepicker .p-datepicker-next,
.lextrack-datepicker .p-datepicker-prev {
  color: var(--color-typo-heading) !important;
}

.lextrack-datepicker .p-datepicker-calendar td > span.p-highlight {
  background: #4f46e5 !important;
  color: #ffffff !important;
}

.p-inputnumber-input {
  width: 100%;
}
</style>
