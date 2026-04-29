<script setup lang="ts">
import { toast } from "vue-sonner";
import type { AddDsuSupport } from "@/types/lextrack/dsu_supports/types";

const visible = defineModel(
    'visible',
    {
      type: Boolean,
      default: false,
      required: true,
    });

const support = defineModel<AddDsuSupport>(
    'support',
    {
      required: true,
    });

const updateSupport = () => {
  // Phase 3 boundary: persistence lands in Phase 4 (UI-SAVE-01). For now, toast only.
  toast.success('Support is updated successfully!');
  visible.value = false;
};
</script>

<template>
  <Dialog
      modal
      v-model:visible="visible"
      header="Edit Support"
      @close="visible = false"
      :style="{ width: '40vw' }"
      position="right">
    <div class="space-y-4 p-4">
      <div>
        <InputText v-model="support.title" placeholder="Support Title" class="w-full" />
      </div>
      <div>
        <InputText v-model="support.link" type="url" placeholder="Link (optional)" class="w-full" />
      </div>
      <div>
        <Editor v-model="support.description" editorStyle="height: 120px" />
      </div>
      <Button label="Save" @click="updateSupport" class="w-full bg-indigo-600 hover:bg-indigo-700" />
    </div>
  </Dialog>
</template>

<style scoped>

</style>