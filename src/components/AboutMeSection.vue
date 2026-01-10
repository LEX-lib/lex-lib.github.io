<script setup lang="ts">
import aboutMePhoto from '@/assets/about-me-photo.png'; // Assuming same asset is available/desired
</script>

<template>
  <div class="bg-neutral-900 text-white py-20" id="about-me-section">
    <div class="container mx-auto px-6 lg:px-12">
      <!-- Section Header -->
      <div 
        class="mb-16"
        v-motion
        :initial="{ opacity: 0, x: -50 }"
        :visibleOnce="{ opacity: 1, x: 0, transition: { duration: 0.6 } }"
      >
        <h3 class="text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-3">
          About Me
          <span class="text-emerald-500">.</span>
        </h3>
        <div class="w-20 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        <!-- Text Content -->
        <div class="lg:col-span-7 space-y-8 text-lg text-gray-300 leading-relaxed font-light">
          <div 
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :visibleOnce="{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 } }"
          >
            <p class="mb-6">
              With over five years of experience as a <span class="text-emerald-400 font-medium">Software Automation Quality Assurance Engineer</span> across health, education, and fintech industries, I’ve built a strong foundation in software reliability and precision.
            </p>
            <p class="mb-6">
              My journey began in quality assurance — writing test cases, developing automation scripts, and leading test initiatives to ensure robust user experiences. Over time, that passion for improving systems evolved into a drive to <span class="text-white font-medium">build them myself</span>.
            </p>
            
            <div class="p-6 bg-neutral-800/50 border-l-4 border-emerald-500 rounded-r-xl my-8">
              <p class="italic text-gray-200">
                "Today, I’m a developer who codes with a tester’s mindset — crafting clean, efficient, and dependable applications."
              </p>
            </div>

            <p class="mb-6">
              I enjoy learning modern technologies and bringing ideas to life, one thoughtful project at a time. This portfolio, built from scratch with <span class="text-emerald-400 font-medium">Vite and Vue</span>, is one of those projects — a space to share my growth, experiments, and the craft I continue to refine.
            </p>
          </div>

          <!-- Social/Connect Links -->
          <div 
            class="pt-8 border-t border-gray-800"
            v-motion
            :initial="{ opacity: 0 }"
            :visibleOnce="{ opacity: 1, transition: { duration: 0.6, delay: 0.4 } }"
          >
            <!-- Social/Connect Links -->
            <div class="pt-8 border-t border-gray-800">
              <div>
                <h4 class="text-lg font-bold text-white mb-4 uppercase tracking-wider text-sm">Connect with me</h4>
                <div class="flex items-center gap-3">
                  <Button 
                      as="a" 
                      href="https://www.linkedin.com/in/cjdeferia/" 
                      target="_blank" 
                      icon="pi pi-linkedin" 
                      severity="secondary" 
                      text 
                      rounded 
                      aria-label="LinkedIn" 
                      class="!text-gray-400 hover:!text-emerald-400 !bg-neutral-800 hover:!bg-emerald-500/20 !w-12 !h-12 !transition-all !duration-300 !no-underline"
                  />
                  <Button 
                      as="a" 
                      href="mailto:cjdeferia@gmail.com" 
                      icon="pi pi-at" 
                      severity="secondary" 
                      text 
                      rounded 
                      aria-label="Email" 
                      class="!text-gray-400 hover:!text-emerald-400 !bg-neutral-800 hover:!bg-emerald-500/20 !w-12 !h-12 !transition-all !duration-300 !no-underline"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Image Column -->
        <div class="lg:col-span-5 relative">
          <div 
            class="relative z-10"
            v-motion
            :initial="{ opacity: 0, x: 20 }"
            :visibleOnce="{ opacity: 1, x: 0, transition: { duration: 0.8 } }"
          >
             <!-- Decorative frame -->
             <div class="absolute -inset-4 border-2 border-emerald-500/30 rounded-2xl md:-inset-6 z-0"></div>
             <div class="absolute -inset-4 border-2 border-emerald-500/30 rounded-2xl md:-inset-6 z-0 rotate-3"></div>
             
             <!-- Image -->
             <!-- Note: Using aboutMePhoto imported from assets. If not available in this component (it was in AboutMe.vue), I need to import it. 
                  Checking Outline: AboutMe.vue had "import aboutMePhoto from '@/assets/about-me-photo.png'".
                  I will assume this file exists and import it.
             -->
            <img :src="aboutMePhoto" class="relative rounded-xl w-full h-auto shadow-2xl z-10 grayscale hover:grayscale-0 transition-all duration-700" alt="About Me">
            
            <!-- Corner accent -->
            <div class="absolute -bottom-10 -right-10 w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center shadow-xl border border-gray-700 z-20">
              <iconify-icon icon="mdi:code-braces" width="40" height="40" class="text-emerald-500"></iconify-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles if needed, mostly using Tailwind */
</style>