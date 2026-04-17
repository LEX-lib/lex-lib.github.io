<script setup lang="ts">
import { toast } from "vue-sonner";
import type { AddDsuSupport } from "@/types/lextrack/dsu_supports/types";

const visible = defineModel("visible", {
  type: Boolean,
  default: false,
  required: true,
});

const support = defineModel<AddDsuSupport>("support", {
  required: true,
});

const updateSupport = () => {
  toast.success("Support is updated successfully!");
  visible.value = false;
};

const editorStyle = {
  toolbar: { class: "bg-gray-700 border-gray-600" },
  content: { class: "bg-gray-700 border-gray-600 text-white" },
};
</script>

<template>
  <Dialog
    modal
    v-model:visible="visible"
    header="Edit Support"
    @close="visible = false"
    :style="{ width: '40vw' }"
    position="right"
  >
    <div class="space-y-4 p-4 bg-gray-700/50 rounded-lg">
      <div>
        <InputText
          v-model="support.title"
          placeholder="Support Title"
          class="w-full bg-gray-700 text-white"
        />
      </div>
      <div>
        <Editor
          v-model="support.description"
          editorStyle="height: 120px"
          :pt="editorStyle"
        />
      </div>
      <Button
        label="Save"
        @click="updateSupport"
        class="w-full bg-indigo-600 hover:bg-indigo-700"
      />
    </div>
  </Dialog>
</template>

<style scoped></style>
