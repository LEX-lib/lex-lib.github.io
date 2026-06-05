<script setup lang="ts">
import { ref } from "vue";
import type { AddDsuMeeting } from "@/types/lextrack/dsu_meetings/types";
import type { AddDsuSupport } from "@/types/lextrack/dsu_supports/types";
import type { AddDsuTask } from "@/types/lextrack/dsu_tasks/types";

// define a union type
type SectionItem = AddDsuMeeting | AddDsuSupport | AddDsuTask;

const section = defineModel<SectionItem[]>("section", { required: true });

defineProps<{
  label: string;
}>();

const emit = defineEmits<{
  update: [index: number];
  remove: [index: number];
}>();

const showInputGroup = ref(false);
const hideInputGroup = (event: Event) => {
  if (event instanceof KeyboardEvent && event.key === "Escape") {
    showInputGroup.value = false;
  }
  if (event instanceof KeyboardEvent && event.key === "Enter") {
    section.value.push({
      title: (event.target as HTMLInputElement).value,
    } as SectionItem);
    (event.target as HTMLInputElement).value = "";
  }
};

const edit = (index: number) => emit("update", index);
const remove = (index: number) => emit("remove", index);
</script>

<template>
  <div class="mb-2">
    <Card>
      <template #title>
        <div class="flex items-center justify-between w-full">
          <span>{{ label }}</span>
          <Button rounded size="small" @click="showInputGroup = true">
            <template #icon>
              <iconify-icon
                icon="mdi:add"
                width="16"
                height="16"
              ></iconify-icon>
            </template>
          </Button>
        </div>
      </template>

      <template #content>
        <div class="flex justify-center my-1" v-if="section.length === 0">
          <span class="mr-2 text-sm font-medium">No Records</span>
        </div>
        <InputGroup v-if="showInputGroup">
          <InputGroupAddon>
            <iconify-icon
              icon="mdi:bookmark-box-outline"
              width="20"
              height="20"
              style="color: #024"
            ></iconify-icon>
          </InputGroupAddon>
          <InputText
            placeholder="Title"
            size="small"
            inputmode="text"
            @keydown="hideInputGroup"
          />
        </InputGroup>

        <template v-for="(item, index) in section" :key="index">
          <InputGroup class="my-1">
            <InputGroupAddon>
              <iconify-icon
                icon="mdi:bookmark"
                width="20"
                height="20"
                style="color: #024"
              ></iconify-icon>
            </InputGroupAddon>
            <InputText
              placeholder="Title"
              size="small"
              inputmode="text"
              readonly
              :model-value="item.title"
            />
            <InputGroupAddon>
              <Button
                rounded
                size="small"
                variant="text"
                severity="secondary"
                @click="edit(index)"
              >
                <template #icon>
                  <iconify-icon
                    icon="mdi:edit-outline"
                    width="20"
                    height="20"
                  ></iconify-icon>
                </template>
              </Button>
            </InputGroupAddon>
            <InputGroupAddon>
              <Button
                rounded
                size="small"
                variant="text"
                severity="secondary"
                @click="remove(index)"
              >
                <template #icon>
                  <iconify-icon
                    icon="mdi:delete-circle"
                    width="20"
                    height="20"
                  ></iconify-icon>
                </template>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </template>
      </template>
    </Card>
  </div>
</template>

<style scoped></style>
