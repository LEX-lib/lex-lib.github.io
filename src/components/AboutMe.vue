<script setup lang="ts">
import aboutMePhoto from '@/assets/about-me-photo.png';
</script>

<template>
  <div class="container mx-auto px-4" id="about-me-section">
    <h3 class="font-bold">About Me</h3>

    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-8 about-me-style">
        <div class="pb-3">
          <p>I've been a quality assurance engineer for collectively over 5 years, with experience in different
            domains such as health, education, and fintech.</p>
          <p>Since the humble beginnings of my career as a QA engineer, I've been honing my skills in test case
            creation, test automation script development, test execution with different techniques, triaging
            issues,
            and team management.</p>
          <p>I like learning new technology tools related to test automation and applying them to projects I'm
            working on.</p>
          <p>Apart from quality assurance, I'm also into web development.
          </p>
          <p class="sr-only">I've dabbled myself lately into coding and
            designing a proprietorship website that houses different tools that are helping my colleagues
            perform
            some of the tasks quickly and efficiently.</p>
          <p>I love being challenged; that's why I pushed myself to build this portfolio from scratch using Vite
            and Vue.</p>
        </div>

        <div class="pb-3">
          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-6">
              <h4 class="font-bold">Connect with me</h4>
              <div class="pt-2 flex items-center gap-4 flex-wrap">
                <div class="flex-none">
                  <a href="https://www.linkedin.com/in/cjdeferia/" target="_blank">
                    <iconify-icon icon="mdi:linkedin" width="35" height="35"></iconify-icon>
                  </a>
                </div>
                <div class="flex-none">
                  <a href="mailto:cjdeferia@gmail.com">
                    <iconify-icon icon="mdi:at" width="35" height="35"></iconify-icon>
                  </a>
                </div>
              </div>
            </div>

            <div class="col-span-6">
              <h4 class="font-bold">Check out my resumé</h4>
              <div class="pt-2 flex items-center gap-4 flex-wrap">
                <!-- Add resume links/icons here -->
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-4">
        <img :src="aboutMePhoto" class="rounded w-full h-auto" alt="About Me Photo">
      </div>
    </div>
  </div>
</template>

<style scoped>
iconify-icon {
  color: #024;
}
</style>