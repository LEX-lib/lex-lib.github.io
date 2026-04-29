<script setup lang="ts">
import type { AddDsuTask } from "@/types/lextrack/dsu_tasks/types";
import { toast } from "vue-sonner";

const visible = defineModel(
    'visible',
    {
      type: Boolean,
      default: false,
      required: true,
    });

const task = defineModel<AddDsuTask>(
    'task',
    {
      required: true,
    });

const updateTask = () => {
  toast.success('Task is updated successfully!');
};
</script>

<template>
  <Dialog
      modal
      v-model:visible="visible"
      header="Update Task"
      @close="visible = false"
      :style="{ width: '40vw' }"
      position="right">
    <div class="space-y-4 p-4">
      <div>
        <InputText v-model="task.title" placeholder="Task Title" class="w-full" />
      </div>
      <div>
        <InputText v-model="task.jira_link" type="url" placeholder="Jira Link" class="w-full" />
      </div>
      <div>
        <Editor v-model="task.description" editorStyle="height: 120px" />
      </div>
      <Button label="Save Task" @click="updateTask" class="w-full bg-indigo-600 hover:bg-indigo-700" />
    </div>
  </Dialog>
</template>

<style scoped>

</style>