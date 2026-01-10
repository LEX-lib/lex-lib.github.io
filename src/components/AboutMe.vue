<script setup lang="ts">
import aboutMePhoto from '@/assets/about-me-photo.png';
</script>

<template>
  <div class="bg-neutral-900 text-white py-16" id="about-me-section">
    <div class="container mx-auto px-6 lg:px-12">
      <div class="mb-12">
        <h3 class="text-3xl lg:text-4xl font-bold mb-2">About Me</h3>
        <div class="w-16 h-1 bg-emerald-500 rounded"></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <!-- Text Content -->
        <div class="lg:col-span-7 space-y-6 text-gray-300 leading-relaxed text-lg">
          <p>
            I've been a quality assurance engineer for collectively over 5 years, with experience in different
            domains such as health, education, and fintech.
          </p>
          <p>
            Since the humble beginnings of my career as a QA engineer, I've been honing my skills in test case
            creation, test automation script development, test execution with different techniques, triaging
            issues, and team management.
          </p>
          <p>
            I like learning new technology tools related to test automation and applying them to projects I'm
            working on.
          </p>
          <div class="p-4 border-l-4 border-emerald-500 bg-neutral-800/50 rounded-r-lg">
            <p class="font-medium text-white">Apart from quality assurance, I'm also into web development.</p>
          </div>
          <p class="sr-only">
            I've dabbled myself lately into coding and designing a proprietorship website that houses different tools 
            that are helping my colleagues perform some of the tasks quickly and efficiently.
          </p>
          <p>
            I love being challenged; that's why I pushed myself to build this portfolio from scratch using Vite and Vue.
          </p>

          <!-- Links Section -->
          <div class="pt-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  Connect with me
                </h4>
                <div class="flex items-center gap-4">
                  <a href="https://www.linkedin.com/in/cjdeferia/" target="_blank" class="hover:text-emerald-400 transition-colors">
                    <iconify-icon icon="mdi:linkedin" width="40" height="40"></iconify-icon>
                  </a>
                  <a href="mailto:cjdeferia@gmail.com" class="hover:text-emerald-400 transition-colors">
                    <iconify-icon icon="mdi:at" width="40" height="40"></iconify-icon>
                  </a>
                </div>
              </div>

              <div>
                <h4 class="text-xl font-bold text-white mb-4">Check out my resumé</h4>
                <div class="flex items-center gap-4">
                   <a href="#" class="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors font-medium hover:underline">
                     <span>Download PDF</span>
                     <iconify-icon icon="mdi:download" width="20" height="20"></iconify-icon>
                   </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Image -->
        <div class="lg:col-span-5">
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <img :src="aboutMePhoto" class="relative rounded-lg w-full h-auto shadow-2xl ring-1 ring-white/10" alt="About Me Photo">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
iconify-icon {
  color: inherit; /* Allow color to be controlled by parent/classes */
}
</style>