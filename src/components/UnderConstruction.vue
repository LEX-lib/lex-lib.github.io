<template>
  <div class="under-construction">
    <img src="@/assets/branding_logo.svg" alt="Site Under Construction" class="construction-image" />
    <h2>Site is currently under construction</h2>
    <p>We're working hard to bring you something awesome. Please check back soon!</p>
  </div>
</template>

<script setup lang="ts">
// No script logic needed for static message
</script>

<style scoped>
.under-construction {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 2rem;
}
.construction-image {
  width: 120px;
  margin-bottom: 1rem;
  animation: rotateY 5s linear infinite;
  transform-style: preserve-3d;
}

@keyframes rotateY {
  0% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}
</style>
