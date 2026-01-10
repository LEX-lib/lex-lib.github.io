<script setup lang="ts">
import { ref } from 'vue'

const projects = ref([
  {
    title: 'Larga',
    description: 'A mini-app that can help commute in Iloilo easy. Just type in the search box where you want to go, it will suggest PUV that passes near by.',
    link: '/projects/larga',
    status: 'WIP',
    image: null // Placeholder for future image
  },
  {
    title: 'LexTrack',
    description: 'A developer-focused tool that can help you write down my tasks in categories meetings, tasks, and admin works.',
    link: '/projects/lextrack',
    status: 'WIP',
    image: null
  },
  {
    title: 'MonitoX',
    description: 'A mini-app for virtual gift exchange (Filipino-style Secret Santa).',
    link: '/projects/gift-exchange/join',
    status: 'Active',
    image: null
  }
])
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <div class="container mx-auto px-4 py-8">
      <div class="mb-12 text-center">
        <h1 class="text-4xl font-bold mb-4 text-white">Project Directory</h1>
        <p class="text-gray-300 text-lg max-w-2xl mx-auto">
          Welcome to my project portfolio. Here you can explore the various tools and applications I've been working on, ranging from utility apps to developer tools.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card v-for="project in projects" :key="project.title" 
             class="group relative !bg-gray-800/50 !border !border-gray-700 overflow-hidden hover:!border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 flex flex-col pt-0">
          
          <template #title>
             <div class="flex justify-between items-start mb-2">
              <span class="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                {{ project.title }}
              </span>
              <Tag v-if="project.status === 'WIP'" value="WIP" severity="warn" class="text-xs font-medium !bg-amber-500/10 !border !border-amber-500/20 !text-amber-300" />
              <Tag v-else-if="project.status === 'Active'" value="Active" severity="success" class="text-xs font-medium !bg-emerald-500/10 !border !border-emerald-500/20 !text-emerald-300" />
            </div>
          </template>

          <template #content>
            <p class="text-gray-100 leading-relaxed mb-6 flex-1">
              {{ project.description }}
            </p>
          </template>

          <template #footer>
            <Button as="router-link" :to="project.link" label="View Project" icon="pi pi-arrow-right" iconPos="right" 
              class="w-full !bg-gray-700 hover:!bg-emerald-600 !border-none !text-white transition-all duration-300 group-hover:translate-y-[-2px] p-3" />
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-card) {
  @apply h-full flex flex-col;
}
:deep(.p-card-body) {
  @apply flex-1 flex flex-col h-full;
  padding: 1.5rem !important;
}
:deep(.p-card-content) {
  @apply flex-1;
}
</style>