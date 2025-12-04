<script setup lang="ts">
import {ref} from "vue";
import type {AddDsuTask} from "@/types/lextrack/dsu_tasks/types";
import { Toaster,toast } from "vue-sonner";

const visible = defineModel(
    'visible',
    {
      type: Boolean,
      default: false,
      required: true,
    });

const internalTask = ref<AddDsuTask>();

const task = defineModel<AddDsuTask>(
    'task',
    {
      required: true,
    });

const updateTask = () => {
  //Object.assign(task.value, { ...internalTask.value })
  toast.success('Task is updated successfully!');
};

const copyToInternal = () => {
  //Object.assign(internalTask.value, { ...task.value })
  //internalTask.value = { ...task.value };
};

const editorStyle = {
  toolbar: { class: 'bg-gray-700 border-gray-600' },
  content: { class: 'bg-gray-700 border-gray-600 text-white' }
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
      @show="copyToInternal">
    <div class="space-y-4 p-4 bg-gray-700/50 rounded-lg">
      <div>
        <InputText v-model="task.title" placeholder="Meeting Title" class="w-full bg-gray-700 text-white" />
      </div>
      <div>
        <InputText v-model="task.jira_link" type="url" placeholder="Jira Link" class="w-full" inputClass="bg-gray-700 text-white w-full rounded-md" />
      </div>
      <div>
        <Editor v-model="task.description" editorStyle="height: 120px" :pt="editorStyle" />
      </div>
      <Button label="Save Task" @click="updateTask" class="w-full bg-indigo-600 hover:bg-indigo-700" />
    </div>
  </Dialog>
</template>

<style scoped>

</style>