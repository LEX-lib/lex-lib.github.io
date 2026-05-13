<script setup lang="ts">
const props = defineProps<{
  searchQuery: string;
  sortMode: string;
}>();

const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'update:sortMode': [value: string];
}>();

const sortOptions = [
  { value: 'type-asc',  label: 'Type A–Z' },
  { value: 'type-desc', label: 'Type Z–A' },
  { value: 'name-asc',  label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
];
</script>

<template>
  <div class="flex items-center gap-2 mb-4">
    <IconField class="flex-1">
      <InputIcon class="pi pi-search" />
      <InputText
        :value="searchQuery"
        placeholder="Search by name or type…"
        class="w-full"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />
      <InputIcon
        v-if="searchQuery"
        class="pi pi-times cursor-pointer"
        @click="emit('update:searchQuery', '')"
      />
    </IconField>
    <Select
      :model-value="sortMode"
      :options="sortOptions"
      option-label="label"
      option-value="value"
      class="w-36"
      @update:model-value="emit('update:sortMode', $event)"
    />
  </div>
</template>
