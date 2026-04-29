<script setup lang="ts">
import {ref} from "vue";
import type {AddDsuMeeting} from "@/types/lextrack/dsu_meetings/types";
import type {AddDsuSupport} from "@/types/lextrack/dsu_supports/types";
import type {AddDsuTask} from "@/types/lextrack/dsu_tasks/types";

// define a union type
type SectionItem = AddDsuMeeting | AddDsuSupport | AddDsuTask

const section = defineModel<SectionItem[]>('section',
     { required: true }
)

const props = defineProps<{
  label : string;
}>();

const emit = defineEmits<{
  update: [index : number]
  remove: [index : number]
}>()


const showInputGroup = ref(false);
const hideInputGroup = (event : Event) => {
  if (event instanceof KeyboardEvent && event.key === "Escape") {
    showInputGroup.value = false;
  }
  if (event instanceof KeyboardEvent && event.key === "Enter") {
    const title = (event.target as HTMLInputElement).value;
    if (props.label === 'Meetings') {
      // D-15: pre-seed duration_unit so the dialog round-trips cleanly
      section.value.push({
        title,
        duration_unit: 'minutes',
        duration_minutes: undefined,
      } as SectionItem);
    } else if (props.label === 'Admin') {
      // D-16: link starts undefined; icon hides until set
      section.value.push({
        title,
        link: undefined,
      } as SectionItem);
    } else {
      // Tasks (and any future label): minimal shape
      section.value.push({ title } as SectionItem);
    }
    (event.target as HTMLInputElement).value = "";
  }
}

const edit = (index : number) => emit('update', index);
const remove = (index : number) => emit('remove', index);

/** D-11/D-12: generic per-row link helper. Returns the URL on Support (link) or Task
 *  (jira_link); meetings have neither so it returns undefined and the icon is hidden. */
const getRowLink = (item: SectionItem): string | undefined => {
  if ('link' in item && item.link) return item.link;
  if ('jira_link' in item && item.jira_link) return item.jira_link;
  return undefined;
};

/** D-09: Open the row's link in a new tab with `noopener noreferrer` to block tab-jacking. */
const openRowLink = (item: SectionItem) => {
  const url = getRowLink(item);
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

</script>

<template>
  <div class="mb-2">
    <Card>
      <template #title>
        <div class="flex items-center justify-between w-full">
          <span>{{ label }}</span>
          <Button rounded size="small" @click="showInputGroup = true">
            <template #icon>
              <iconify-icon icon="mdi:add" width="16" height="16"></iconify-icon>
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
            <iconify-icon icon="mdi:bookmark-box-outline" width="20" height="20" style="color: #024"></iconify-icon>
          </InputGroupAddon>
          <InputText placeholder="Title" size="small" inputmode="text" @keydown="hideInputGroup"/>
        </InputGroup>

        <template v-for="(item, index) in section" :key="index">
          <InputGroup class="my-1">
            <InputGroupAddon>
              <iconify-icon icon="mdi:bookmark" width="20" height="20" style="color: #024"></iconify-icon>
            </InputGroupAddon>
            <InputText placeholder="Title" size="small" inputmode="text" readonly :model-value="item.title"/>
            <InputGroupAddon v-if="getRowLink(item)">
              <Button
                rounded
                size="small"
                variant="text"
                severity="secondary"
                v-tooltip="getRowLink(item)"
                aria-label="Open link in new tab"
                @click="openRowLink(item)">
                <template #icon>
                  <iconify-icon icon="mdi:open-in-new" width="20" height="20"></iconify-icon>
                </template>
              </Button>
            </InputGroupAddon>
            <InputGroupAddon>
              <Button rounded size="small" variant="text" severity="secondary" @click="edit(index)">
                <template #icon>
                  <iconify-icon icon="mdi:edit-outline" width="20" height="20"></iconify-icon>
                </template>
              </Button>
            </InputGroupAddon>
            <InputGroupAddon>
              <Button rounded size="small" variant="text" severity="secondary" @click="remove(index)">
                <template #icon>
                  <iconify-icon icon="mdi:delete-circle" width="20" height="20"></iconify-icon>
                </template>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </template>

      </template>
    </Card>
  </div>
</template>

<style scoped>

</style>