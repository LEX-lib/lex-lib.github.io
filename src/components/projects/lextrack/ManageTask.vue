<script setup lang="ts">
import type { AddDsuTask } from "@/types/lextrack/dsu_tasks/types";
import { toast } from "vue-sonner";

const visible = defineModel("visible", {
  type: Boolean,
  default: false,
  required: true,
});

const task = defineModel<AddDsuTask>("task", {
  required: true,
});

const updateTask = () => {
  //Object.assign(task.value, { ...internalTask.value })
  toast.success("Task is updated successfully!");
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
    header="Update Task"
    @close="visible = false"
    :style="{ width: '40vw' }"
    position="right"
  >
    <div class="space-y-4 p-4 bg-surface-page/60 rounded-lg">
      <div>
        <InputText
          v-model="task.title"
          placeholder="Meeting Title"
          class="w-full bg-surface-card text-typo-body"
        />
      </div>
      <div>
        <InputText
          v-model="task.jira_link"
          type="url"
          placeholder="Jira Link"
          class="w-full"
          inputClass="bg-surface-card text-typo-body w-full rounded-md"
        />
      </div>
      <div>
        <Editor
          v-model="task.description"
          editorStyle="height: 120px"
          :pt="editorStyle"
        />
      </div>
      <Button
        label="Save Task"
        @click="updateTask"
        class="w-full bg-indigo-600 hover:bg-indigo-700"
      />
    </div>
  </Dialog>
</template>

<style scoped></style>
