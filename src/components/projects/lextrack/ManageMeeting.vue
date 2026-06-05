<script setup lang="ts">
import type { AddDsuMeeting } from "@/types/lextrack/dsu_meetings/types";
import { toast } from "vue-sonner";

const visible = defineModel("visible", {
  type: Boolean,
  default: false,
  required: true,
});

const meeting = defineModel<AddDsuMeeting>("meeting", {
  required: true,
});

const updateMeeting = () => {
  toast.success("Meeting is updated successfully!");
};

// Phase 21-01 refactor: semantic tokens auto-switch via Phase 18's
// .my-app-dark block in base.css.
const editorStyle = {
  toolbar: { class: "bg-surface-card border-surface-divider" },
  content: {
    class: "bg-surface-card border-surface-divider text-typo-body",
  },
};
</script>

<template>
  <Dialog
    modal
    v-model:visible="visible"
    header="Add New Meeting"
    @close="visible = false"
    :style="{ width: '40vw' }"
    position="right"
  >
    <div class="space-y-4 p-4 bg-surface-page/60 rounded-lg">
      <div>
        <InputText
          v-model="meeting.title"
          placeholder="Meeting Title"
          class="w-full bg-surface-card text-typo-body"
        />
      </div>
      <div>
        <InputNumber
          v-model="meeting.duration_minutes"
          placeholder="Duration (minutes)"
          class="w-full"
          inputClass="bg-surface-card text-typo-body w-full rounded-md"
        />
      </div>
      <div>
        <Editor
          v-model="meeting.description"
          editorStyle="height: 120px"
          :pt="editorStyle"
        />
      </div>
      <Button
        label="Save Meeting"
        @click="updateMeeting"
        class="w-full bg-indigo-600 hover:bg-indigo-700"
      />
    </div>
  </Dialog>
</template>

<style scoped></style>
