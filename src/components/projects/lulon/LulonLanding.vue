<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-surface-page flex flex-col items-center justify-center p-4 font-sans text-gray-900 dark:text-typo-heading"
  >
    <div class="max-w-md w-full">
      <Card>
        <template #content>
          <div class="text-center py-4">
            <div class="text-5xl mb-4 text-red-600 dark:text-red-300">
              <i class="pi pi-gift"></i>
            </div>
            <h1 class="text-4xl font-bold mb-2 tracking-tight">Lulon</h1>
            <p class="text-lg text-gray-600 dark:text-typo-body mb-1">
              Unroll your secret partner.
            </p>
            <p class="text-sm text-gray-500 dark:text-typo-muted mb-8">
              A virtual gift exchange for Filipino-style Secret Santa. Join a
              group, then unroll to reveal who you picked.
            </p>

            <Button
              as="router-link"
              to="/projects/lulon/play"
              label="Join an exchange"
              icon="pi pi-user-plus"
              class="w-full"
            />

            <template v-if="authStore.isAdmin">
              <Divider align="center" type="dashed">
                <span
                  class="text-xs uppercase tracking-wider text-gray-400 dark:text-typo-muted"
                  >Organizer</span
                >
              </Divider>
              <Button
                as="router-link"
                to="/projects/lulon/manage"
                label="Manage lobbies"
                icon="pi pi-cog"
                severity="secondary"
                outlined
                class="w-full"
              />
            </template>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
