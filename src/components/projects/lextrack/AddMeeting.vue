<script setup lang="ts">
import { ref } from "vue";
import type { AddDsuMeeting } from "@/types/lextrack/dsu_meetings/types";
import { toast } from "vue-sonner";

const newMeeting = ref<AddDsuMeeting>({
  date: new Date().toISOString().split("T")[0],
  title: "",
  duration_minutes: undefined,
  description: undefined,
});

const editorStyle = {
  toolbar: { class: "bg-gray-700 border-gray-600" },
  content: { class: "bg-gray-700 border-gray-600 text-white" },
};

const visible = defineModel("visible", {
  type: Boolean,
  default: false,
  required: true,
});

const meetings = defineModel("meetings", {
  type: Array<AddDsuMeeting>,
  default: [] as AddDsuMeeting[],
  required: true,
});

const addMeeting = () => {
  meetings.value.push({ ...newMeeting.value });
  console.log(meetings.value);
  Object.assign(newMeeting.value, {
    date: new Date().toISOString().split("T")[0],
    title: "",
    duration_minutes: undefined,
    description: undefined,
  });

  toast.success("Meeting added successfully!");
};
</script>

<template>
  <Dialog
    modal
    v-model:visible="visible"
    header="Add New Meeting"
    @close="visible = false"
    :style="{ width: '50vw' }"
    position="right"
  >
    <div class="space-y-4 p-4 bg-gray-700/50 rounded-lg">
      <div>
        <InputText
          v-model="newMeeting.title"
          placeholder="Meeting Title"
          class="w-full bg-gray-700 text-white"
        />
      </div>
      <div>
        <InputNumber
          v-model="newMeeting.duration_minutes"
          placeholder="Duration (minutes)"
          class="w-full"
          inputClass="bg-gray-700 text-white w-full rounded-md"
        />
      </div>
      <div>
        <Editor
          v-model="newMeeting.description"
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
  </Dialog>
</template>

<style scoped></style>
