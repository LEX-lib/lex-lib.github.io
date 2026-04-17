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

// Common styles for the Editor component
const editorStyle = {
  toolbar: { class: "bg-gray-700 border-gray-600" },
  content: { class: "bg-gray-700 border-gray-600 text-white" },
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
  <div class="bg-gray-900 min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-4xl bg-gray-800 p-8 rounded-lg shadow-lg">
      <h1 class="text-3xl font-bold text-center mb-2 text-white">
        LexTrack Daily Activities 📝
      </h1>
      <p class="text-center text-gray-400 mb-6">
        Select a date to log or view your activities.
      </p>

      <!-- Date Selector -->
      <div class="mb-8 max-w-sm mx-auto">
        <label for="date" class="block text-sm font-medium text-gray-300 mb-2"
          >Selected Date</label
        >
        <DatePicker
          v-model="selectedDate"
          showIcon
          inputId="date"
          class="w-full"
          :pt="{
            input: {
              class: 'w-full bg-gray-700 border-gray-600 text-white rounded-md',
            },
            panel: { class: 'bg-gray-800 border-gray-700' },
          }"
        />
      </div>

      <!-- Tabbed Interface for Activities -->
      <TabView
        :pt="{
          nav: { class: 'bg-gray-800 border-b border-gray-700' },
          navContent: { class: 'bg-gray-800' },
          inkbar: { class: 'bg-indigo-500' },
        }"
      >
        <!-- Main Tasks Tab -->
        <TabPanel
          value="0"
          header="Main Tasks"
          :pt="{ headerAction: { class: 'bg-gray-800 text-white' } }"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Form for adding a new task -->
            <div class="space-y-4 p-4 bg-gray-700/50 rounded-lg">
              <h3 class="font-bold text-lg text-white">Add New Task</h3>
              <div>
                <InputText
                  v-model="newTask.name"
                  placeholder="Task Name"
                  class="w-full bg-gray-700 text-white"
                />
              </div>
              <div>
                <InputText
                  v-model="newTask.jira"
                  placeholder="Jira Ticket Link"
                  class="w-full bg-gray-700 text-white"
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
              class="space-y-3 p-4 bg-gray-900/50 rounded-lg max-h-96 overflow-y-auto"
            >
              <h3 class="font-bold text-lg text-white">
                Logged Tasks for Today
              </h3>
              <div v-if="!tasks.length" class="text-gray-400">
                No tasks logged for this date.
              </div>
              <div
                v-for="(task, index) in tasks"
                :key="`task-${index}`"
                class="bg-gray-700 p-3 rounded-md"
              >
                <p class="font-bold text-white">{{ task.task_name }}</p>
                <a
                  :href="task.jira_link"
                  target="_blank"
                  class="text-sm text-indigo-400 hover:underline truncate"
                  >{{ task.jira_link }}</a
                >
                <div
                  class="text-sm text-gray-300 mt-2"
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
          :pt="{ headerAction: { class: 'bg-gray-800 text-white' } }"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Form for adding a new meeting -->
            <div class="space-y-4 p-4 bg-gray-700/50 rounded-lg">
              <h3 class="font-bold text-lg text-white">Add New Meeting</h3>
              <div>
                <InputText
                  v-model="newMeeting.title"
                  placeholder="Meeting Title"
                  class="w-full bg-gray-700 text-white"
                />
              </div>
              <div>
                <InputNumber
                  v-model="newMeeting.duration"
                  placeholder="Duration (minutes)"
                  class="w-full"
                  inputClass="bg-gray-700 text-white w-full rounded-md"
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
              class="space-y-3 p-4 bg-gray-900/50 rounded-lg max-h-96 overflow-y-auto"
            >
              <h3 class="font-bold text-lg text-white">
                Logged Meetings for Today
              </h3>
              <div v-if="!meetings.length" class="text-gray-400">
                No meetings logged for this date.
              </div>
              <div
                v-for="(meeting, index) in meetings"
                :key="`meeting-${index}`"
                class="bg-gray-700 p-3 rounded-md"
              >
                <div class="flex justify-between items-center">
                  <p class="font-bold text-white">{{ meeting.title }}</p>
                  <span
                    class="text-xs bg-gray-600 text-white px-2 py-1 rounded-full"
                    >{{ meeting.duration_minutes }} mins</span
                  >
                </div>
                <div
                  class="text-sm text-gray-300 mt-2"
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
          :pt="{ headerAction: { class: 'bg-gray-800 text-white' } }"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Form for adding new admin support -->
            <div class="space-y-4 p-4 bg-gray-700/50 rounded-lg">
              <h3 class="font-bold text-lg text-white">
                Add Admin/Support Task
              </h3>
              <div>
                <InputText
                  v-model="newAdminSupport.title"
                  placeholder="Task Title"
                  class="w-full bg-gray-700 text-white"
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
              class="space-y-3 p-4 bg-gray-900/50 rounded-lg max-h-96 overflow-y-auto"
            >
              <h3 class="font-bold text-lg text-white">Logged Support Tasks</h3>
              <div v-if="!adminSupports.length" class="text-gray-400">
                No support tasks logged for this date.
              </div>
              <div
                v-for="(support, index) in adminSupports"
                :key="`support-${index}`"
                class="bg-gray-700 p-3 rounded-md"
              >
                <p class="font-bold text-white">{{ support.title }}</p>
                <div
                  class="text-sm text-gray-300 mt-2"
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
/* PrimeVue custom overrides for dark theme consistency */
.p-datepicker-header,
.p-tabview-nav-link {
  background: #374151 !important;
  color: #f9fafb !important;
  border-bottom: 1px solid #4b5563 !important;
}

.p-tabview-nav-link.p-highlight {
  color: #a5b4fc !important;
}

.p-datepicker-title,
.p-datepicker-next,
.p-datepicker-prev {
  color: #f9fafb !important;
}

.p-datepicker-calendar td > span.p-highlight {
  background: #4f46e5 !important;
  color: #ffffff !important;
}

.p-inputnumber-input {
  width: 100%;
}
</style>
