<script setup lang="ts">
import { ref } from "vue";

interface Project {
  title: string;
  description: string;
  link: string;
  status: "WIP" | "Active";
  icon: string;
  tags: string[];
}

const projects = ref<Project[]>([
  {
    title: "Larga",
    description:
      "A mini-app that makes commuting in Iloilo easier. Type where you want to go and it suggests PUV routes that pass nearby.",
    link: "/projects/larga",
    status: "WIP",
    icon: "mdi:bus-side",
    tags: ["Vue 3", "Leaflet", "Maps"],
  },
  {
    title: "LexTrack",
    description:
      "A developer-focused task tracker that organises work into meetings, tasks, and admin categories — built for daily standups.",
    link: "/projects/lextrack",
    status: "WIP",
    icon: "mdi:clipboard-check-outline",
    tags: ["Vue 3", "PocketBase", "Auth"],
  },
  {
    title: "MonitoX",
    description:
      "A virtual gift-exchange app for Filipino-style Secret Santa. Create a group, shuffle assignments, and reveal your monito.",
    link: "/projects/gift-exchange/join",
    status: "Active",
    icon: "mdi:gift-outline",
    tags: ["Vue 3", "PocketBase"],
  },
  {
    title: "API Playground",
    description:
      "A browser-based API client inspired by Postman and HTTPie. Supports params, headers, auth, and a formatted response viewer.",
    link: "/projects/api-playground",
    status: "Active",
    icon: "mdi:api",
    tags: ["Vue 3", "Fetch API"],
  },
  {
    title: "Wallecx",
    description:
      "A personal health records vault. Securely store and retrieve your vaccination records — including card scans — with per-user privacy enforced server-side.",
    link: "/projects/wallecx",
    status: "WIP",
    icon: "mdi:shield-check",
    tags: ["Vue 3", "PocketBase", "Auth", "Privacy"],
  },
]);
</script>

<template>
  <div class="min-h-screen bg-surface-page">
    <!-- Page header -->
    <div class="bg-surface-card border-b border-surface-divider">
      <div class="container mx-auto px-6 lg:px-12 py-16">
        <div
          v-motion
          :initial="{ opacity: 0, y: -20 }"
          :visibleOnce="{ opacity: 1, y: 0, transition: { duration: 0.6 } }"
        >
          <h1
            class="text-4xl lg:text-5xl font-bold mb-3 flex items-center gap-3"
            style="color: var(--color-typo-heading)"
          >
            Project Directory
            <span style="color: var(--color-brand-accent)">.</span>
          </h1>
          <div class="w-20 h-1.5 rounded-full projects-underline mb-6"></div>
          <p
            class="text-lg max-w-2xl leading-relaxed"
            style="color: var(--color-typo-body)"
          >
            A collection of tools and applications I've been building — ranging
            from commute helpers to developer utilities.
          </p>
        </div>
      </div>
    </div>

    <!-- Cards grid -->
    <div class="container mx-auto px-6 lg:px-12 py-16">
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8"
      >
        <div
          v-for="(project, index) in projects"
          :key="project.title"
          v-motion
          :initial="{ opacity: 0, y: 30 }"
          :visibleOnce="{
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, delay: index * 0.1 },
          }"
          class="project-card group bg-surface-card rounded-2xl border border-surface-divider overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col"
        >
          <!-- Card top accent bar -->
          <div class="h-1 w-full projects-card-bar"></div>

          <div class="p-8 flex flex-col flex-1">
            <!-- Icon + status row -->
            <div class="flex items-start justify-between mb-6">
              <div
                class="w-14 h-14 rounded-xl flex items-center justify-center projects-icon-bg"
              >
                <iconify-icon
                  :icon="project.icon"
                  width="28"
                  height="28"
                  style="color: var(--color-brand-primary)"
                ></iconify-icon>
              </div>

              <Tag
                v-if="project.status === 'WIP'"
                value="WIP"
                severity="warn"
                class="!text-xs !font-semibold projects-tag-wip"
              />
              <Tag
                v-else-if="project.status === 'Active'"
                value="Active"
                severity="success"
                class="!text-xs !font-semibold projects-tag-active"
              />
            </div>

            <!-- Title -->
            <h2
              class="text-2xl font-bold mb-3 transition-colors duration-300"
              style="color: var(--color-typo-heading)"
            >
              {{ project.title }}
            </h2>

            <!-- Description -->
            <p
              class="leading-relaxed mb-6 flex-1"
              style="color: var(--color-typo-body)"
            >
              {{ project.description }}
            </p>

            <!-- Tags -->
            <div class="flex flex-wrap gap-2 mb-6">
              <span
                v-for="tag in project.tags"
                :key="tag"
                class="px-3 py-1 rounded-full text-xs font-medium projects-tech-tag"
              >
                {{ tag }}
              </span>
            </div>

            <!-- CTA button -->
            <Button
              as="router-link"
              :to="project.link"
              label="View Project"
              icon="pi pi-arrow-right"
              iconPos="right"
              class="w-full !font-semibold projects-cta-btn"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.projects-underline {
  background: linear-gradient(
    to right,
    var(--color-brand-primary),
    var(--color-brand-accent)
  );
}

.projects-card-bar {
  background: linear-gradient(
    to right,
    var(--color-brand-primary),
    var(--color-brand-accent)
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}
.project-card:hover .projects-card-bar {
  opacity: 1;
}

.projects-icon-bg {
  background-color: var(--color-brand-accent-light);
}

.projects-tag-wip {
  background-color: rgba(232, 152, 32, 0.12) !important;
  border: 1px solid rgba(232, 152, 32, 0.35) !important;
  color: #b07010 !important;
}
.projects-tag-active {
  background-color: rgba(26, 124, 69, 0.1) !important;
  border: 1px solid rgba(26, 124, 69, 0.3) !important;
  color: var(--color-status-success) !important;
}

.projects-tech-tag {
  background-color: var(--color-surface-page);
  border: 1px solid var(--color-surface-divider);
  color: var(--color-typo-muted);
}

.projects-cta-btn {
  background-color: var(--color-brand-primary) !important;
  border-color: var(--color-brand-primary) !important;
  color: #ffffff !important;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease !important;
}
.projects-cta-btn:hover {
  background-color: var(--color-brand-primary-dark) !important;
  border-color: var(--color-brand-primary-dark) !important;
  transform: translateY(-1px);
}

/* Phase 20 dark-mode tuning — chip text colors flipped for legibility, alpha bumped */
:global(.my-app-dark) .projects-tag-wip {
  background-color: rgba(240, 171, 64, 0.22) !important;
  border: 1px solid rgba(240, 171, 64, 0.45) !important;
  color: #fdf3dc !important;
}
:global(.my-app-dark) .projects-tag-active {
  background-color: rgba(26, 124, 69, 0.2) !important;
  border: 1px solid rgba(26, 124, 69, 0.5) !important;
  color: #6ee7a4 !important;
}
</style>
