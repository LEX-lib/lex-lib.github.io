<script setup lang="ts">

</script>

<template>
  <div class="container mx-auto px-4"
       id="about-me-section"
       v-motion
       :initial="{ opacity: 0, y: 100 }"
       :visibleOnce="{ opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }">
    <div class="pb-3 space-y-4">
      <p>With over five years of experience as a Software Automation Quality Assurance Engineer across health, education, and fintech industries, I’ve built a strong foundation in software reliability and precision.</p>

      <p>My journey began in quality assurance — writing test cases, developing automation scripts, and leading test initiatives to ensure robust user experiences. Over time, that passion for improving systems evolved into a drive to build them myself.</p>

      <p>Today, I’m a developer who codes with a tester’s mindset — crafting clean, efficient, and dependable applications. I enjoy learning modern technologies and bringing ideas to life, one thoughtful project at a time.</p>

      <p>This portfolio, built from scratch with Vite and Vue, is one of those projects — a space to share my growth, experiments, and the craft I continue to refine.</p>
    </div>
  </div>

</template>

<style scoped>

</style>