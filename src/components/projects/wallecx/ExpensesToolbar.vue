<script setup lang="ts">
defineProps<{
  searchQuery: string
  sortMode: string
  sortOptions: { value: string; label: string }[]
  selectedCategories: string[]
  categoryOptions: string[]
  dateFrom: Date | null
  dateTo: Date | null
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:sortMode': [value: string]
  'update:selectedCategories': [value: string[]]
  'update:dateFrom': [value: Date | null]
  'update:dateTo': [value: Date | null]
}>()
</script>

<template>
  <div class="flex flex-col gap-2 mb-4">

    <!-- Row 1: Search input + Sort select -->
    <div class="flex items-center gap-2">
      <!-- Search (mirrors WallecxToolbar.vue search pattern exactly) -->
      <IconField class="flex-1">
        <InputIcon class="pi pi-search" />
        <InputText
          :value="searchQuery"
          placeholder="Search by description…"
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
      <!-- Sort select (mirrors WallecxToolbar.vue sort Select exactly) -->
      <Select
        :model-value="sortMode"
        :options="sortOptions"
        option-label="label"
        option-value="value"
        class="w-36 min-h-[44px]"
        @update:model-value="emit('update:sortMode', $event)"
      />
    </div>

    <!-- Row 2: Category MultiSelect + two DatePickers; flex-wrap for narrow viewports -->
    <div class="flex items-center gap-2 flex-wrap">
      <MultiSelect
        :model-value="selectedCategories"
        :options="categoryOptions"
        placeholder="All categories"
        class="flex-1 min-h-[44px]"
        display="chip"
        @update:model-value="emit('update:selectedCategories', $event)"
      />
      <DatePicker
        :model-value="dateFrom"
        placeholder="From date"
        dateFormat="dd M yy"
        class="w-32 min-h-[44px]"
        @update:model-value="emit('update:dateFrom', ($event instanceof Date ? $event : null))"
      />
      <DatePicker
        :model-value="dateTo"
        placeholder="To date"
        dateFormat="dd M yy"
        class="w-32 min-h-[44px]"
        @update:model-value="emit('update:dateTo', ($event instanceof Date ? $event : null))"
      />
    </div>

  </div>
</template>

<style scoped>
:deep(.my-app-dark .p-inputtext) {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
  border-color: var(--color-surface-divider);
}
:deep(.my-app-dark .p-select),
:deep(.my-app-dark .p-multiselect),
:deep(.my-app-dark .p-datepicker) {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
  border-color: var(--color-surface-divider);
}
</style>
