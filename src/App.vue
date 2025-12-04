<script setup lang="ts">
import CustomNavBar from "@/components/CustomNavBar.vue";
import { Toaster } from "vue-sonner";
import { SpeedInsights } from '@vercel/speed-insights/vue';

function toggleDarkMode() {
  document.documentElement.classList.toggle('my-app-dark');
}
</script>

<template>
  <CustomNavBar class="mb-1"/>
  <RouterView />

  <!--
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125"/>

    <div class="wrapper">
      <HelloWorld msg="You did it!"/>

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
  -->
<!--  <Button label="Toggle Dark Mode" @click="toggleDarkMode()" />-->

  <Toaster/>
  <SpeedInsights />
</template>

<style scoped>
</style>
