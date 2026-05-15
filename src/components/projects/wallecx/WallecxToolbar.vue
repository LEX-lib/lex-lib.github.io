<script setup lang="ts">
withDefaults(
  defineProps<{
    searchQuery: string;
    sortMode: string;
    viewMode: 'grid' | 'list';
    sortOptions: { value: string; label: string }[];
    showToggle?: boolean;
  }>(),
  {
    showToggle: false,
  },
);

const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'update:sortMode': [value: string];
  'update:viewMode': [value: 'grid' | 'list'];
}>();
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
        role="button"
        tabindex="0"
        aria-label="Clear search"
        @click="emit('update:searchQuery', '')"
        @keydown.enter="emit('update:searchQuery', '')"
        @keydown.space.prevent="emit('update:searchQuery', '')"
      />
    </IconField>
    <Select
      :model-value="sortMode"
      :options="sortOptions"
      option-label="label"
      option-value="value"
      class="w-36 min-h-[44px]"
      @update:model-value="emit('update:sortMode', $event)"
    />
    <Button
      v-if="showToggle"
      severity="secondary"
      size="small"
      class="min-h-[44px] min-w-[44px] touch-manipulation"
      :aria-label="viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'"
      :title="viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'"
      @click="emit('update:viewMode', viewMode === 'grid' ? 'list' : 'grid')"
    >
      <iconify-icon
        :icon="viewMode === 'grid' ? 'mdi:view-list' : 'mdi:view-grid'"
        width="20"
        height="20"
        aria-hidden="true"
      ></iconify-icon>
    </Button>
  </div>
</template>
