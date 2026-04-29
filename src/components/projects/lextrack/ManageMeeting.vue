<script setup lang="ts">
import { watch } from "vue";
import type { AddDsuMeeting } from "@/types/lextrack/dsu_meetings/types";
import {
  DSU_MEETING_DURATION_UNIT_VALUES,
  DSU_MEETING_DURATION_UNIT_LABELS,
} from "@/types/lextrack/dsu_meetings/constants";
import { useDurationField } from "@/composables/lextrack/useDurationField";

const visible = defineModel(
    'visible',
    {
      type: Boolean,
      default: false,
      required: true,
    });

const meeting = defineModel<AddDsuMeeting>(
    'meeting',
    {
      required: true,
    });

const props = defineProps<{ saving?: boolean }>();

const emit = defineEmits<{
  save: [item: AddDsuMeeting & { id?: string }];
}>();

// Seed the composable from the current meeting (D-04 round-trip).
const { enteredValue, unit, durationMinutes, fractionDigits, seed } = useDurationField(
  meeting.value.duration_minutes,
  meeting.value.duration_unit,
);

// Re-seed when the parent swaps which meeting is bound (e.g. user opens a different row).
// Track the meeting reference identity, not deep changes — a deep watcher would fight Edit's writes.
watch(
  () => meeting.value,
  (next) => seed(next.duration_minutes, next.duration_unit),
);

// Mirror UI changes back into the v-model'd meeting (D-03).
watch([durationMinutes, unit], ([nextMinutes, nextUnit]) => {
  meeting.value.duration_minutes = nextMinutes;
  meeting.value.duration_unit = nextUnit;
});

// Options for the SelectButton (D-06).
const durationUnitOptions = DSU_MEETING_DURATION_UNIT_VALUES.map((value) => ({
  value,
  label: DSU_MEETING_DURATION_UNIT_LABELS[value],
}));

const onSaveClick = () => emit('save', meeting.value as AddDsuMeeting & { id?: string });
</script>

<template>
  <Dialog
      modal
      v-model:visible="visible"
      header="Add New Meeting"
      @close="visible = false"
      :style="{ width: '40vw' }"
      position="right">
    <div class="space-y-4 p-4">
      <div>
        <InputText v-model="meeting.title" placeholder="Meeting Title" class="w-full" />
      </div>
      <div class="flex gap-2 items-center">
        <InputNumber
          v-model="enteredValue"
          placeholder="Duration"
          class="flex-1"
          :min="0"
          :min-fraction-digits="0"
          :max-fraction-digits="fractionDigits" />
        <SelectButton
          v-model="unit"
          :options="durationUnitOptions"
          optionLabel="label"
          optionValue="value"
          :allow-empty="false"
          aria-label="Duration unit" />
      </div>
      <div>
        <Editor v-model="meeting.description" editorStyle="height: 120px" />
      </div>
      <Button label="Save Meeting" :loading="props.saving" @click="onSaveClick" class="w-full bg-indigo-600 hover:bg-indigo-700" />
    </div>
  </Dialog>
</template>

<style scoped>

</style>
