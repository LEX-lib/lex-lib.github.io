<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useMotion } from '@vueuse/motion'
const aboutMeRef = ref(null);

const { apply } = useMotion(aboutMeRef, {
  initial: { opacity: 0, y: 100 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.8 } },
})

const scrollToAboutMe = async () => {
  document.querySelector('#about-me-section')?.scrollIntoView({ behavior: 'smooth' })
  //await nextTick()
  //setTimeout(() => apply('enter'), 500) // trigger after scroll finishes
}
</script>

<template>
  <div class="container mx-auto px-4" id="hero-section">
    <div class="grid grid-cols-12 gap-4 items-center min-h-screen">
      <div class="col-span-12 lg:col-span-6 text-center lg:text-left">
        <h1 class="text-4xl lg:text-6xl font-bold mb-4 text-white">Hi, I'm CJ</h1>
        <p class="text-lg lg:text-xl mb-6 text-gray-300">I used to break code to make it better. Now I write code that works beautifully.</p>
        <div class="flex gap-4 justify-center lg:justify-start">
          <Button as="a" label="About Me" @click.prevent="scrollToAboutMe"/>
          <Button label="View Projects" />
          <Button label="Get in Touch" />
        </div>


<!--        <a href="#about-me-section" class="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition">Learn More About Me</a>-->
      </div>
      <div class="col-span-12 lg:col-span-6">
        <img src="@/assets/branding_logo.svg" alt="Hero Image" class="w-full h-auto">
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>