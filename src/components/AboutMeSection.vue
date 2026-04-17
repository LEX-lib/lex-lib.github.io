<script setup lang="ts">
import aboutMePhoto from "@/assets/about-me-photo.png";
</script>

<template>
  <div
    class="bg-surface-card py-20 border-t border-surface-divider"
    id="about-me-section"
  >
    <div class="container mx-auto px-6 lg:px-12">
      <!-- Section Header -->
      <div
        class="mb-16"
        v-motion
        :initial="{ opacity: 0, x: -50 }"
        :visibleOnce="{ opacity: 1, x: 0, transition: { duration: 0.6 } }"
      >
        <h3
          class="text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-3"
          style="color: var(--color-typo-heading)"
        >
          About Me
          <span style="color: var(--color-brand-accent)">.</span>
        </h3>
        <div class="w-20 h-1.5 rounded-full about-underline"></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        <!-- Text Content -->
        <div
          class="lg:col-span-7 space-y-8 text-lg leading-relaxed"
          style="color: var(--color-typo-body)"
        >
          <div
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :visibleOnce="{
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, delay: 0.2 },
            }"
          >
            <p class="mb-6">
              With over five years of experience as a
              <span
                class="font-semibold"
                style="color: var(--color-brand-primary)"
                >Software Automation Quality Assurance Engineer</span
              >
              across health, education, and fintech industries, I've built a
              strong foundation in software reliability and precision.
            </p>
            <p class="mb-6">
              My journey began in quality assurance — writing test cases,
              developing automation scripts, and leading test initiatives to
              ensure robust user experiences. Over time, that passion for
              improving systems evolved into a drive to
              <span
                class="font-semibold"
                style="color: var(--color-typo-heading)"
                >build them myself</span
              >.
            </p>

            <!-- Blockquote callout -->
            <div class="p-6 rounded-r-xl my-8 border-l-4 about-blockquote">
              <p class="italic" style="color: var(--color-typo-body)">
                "Today, I'm a developer who codes with a tester's mindset —
                crafting clean, efficient, and dependable applications."
              </p>
            </div>

            <p class="mb-6">
              I enjoy learning modern technologies and bringing ideas to life,
              one thoughtful project at a time. This portfolio, built from
              scratch with
              <span
                class="font-semibold"
                style="color: var(--color-brand-primary)"
                >Vite and Vue</span
              >, is one of those projects — a space to share my growth,
              experiments, and the craft I continue to refine.
            </p>
          </div>

          <!-- Social / Connect Links -->
          <div
            class="pt-8 border-t"
            style="border-color: var(--color-surface-divider)"
            v-motion
            :initial="{ opacity: 0 }"
            :visibleOnce="{
              opacity: 1,
              transition: { duration: 0.6, delay: 0.4 },
            }"
          >
            <h4
              class="font-bold mb-4 uppercase tracking-wider text-sm"
              style="color: var(--color-typo-heading)"
            >
              Connect with me
            </h4>
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
                class="!w-12 !h-12 !transition-all !duration-300 !no-underline about-social-btn"
              />
              <Button
                as="a"
                href="mailto:cjdeferia@gmail.com"
                icon="pi pi-at"
                severity="secondary"
                text
                rounded
                aria-label="Email"
                class="!w-12 !h-12 !transition-all !duration-300 !no-underline about-social-btn"
              />
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
            <!-- Decorative frames -->
            <div
              class="absolute -inset-4 border-2 rounded-2xl md:-inset-6 z-0 about-frame"
            ></div>
            <div
              class="absolute -inset-4 border-2 rounded-2xl md:-inset-6 z-0 rotate-3 about-frame"
            ></div>

            <!-- Photo -->
            <img
              :src="aboutMePhoto"
              class="relative rounded-xl w-full h-auto shadow-2xl z-10 grayscale hover:grayscale-0 transition-all duration-700"
              alt="About Me"
            />

            <!-- Corner accent -->
            <div
              class="absolute -bottom-10 -right-10 w-24 h-24 rounded-full flex items-center justify-center shadow-lg z-20 about-corner-accent"
            >
              <iconify-icon
                icon="mdi:code-braces"
                width="40"
                height="40"
                style="color: var(--color-brand-accent)"
              ></iconify-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-underline {
  background: linear-gradient(
    to right,
    var(--color-brand-primary),
    var(--color-brand-accent)
  );
}

.about-blockquote {
  background-color: var(--color-brand-accent-light);
  border-color: var(--color-brand-accent);
}

.about-frame {
  border-color: rgba(232, 152, 32, 0.3);
}

.about-corner-accent {
  background-color: var(--color-surface-page);
  border: 1px solid var(--color-surface-divider);
}

.about-social-btn {
  color: var(--color-typo-muted) !important;
  background-color: var(--color-surface-page) !important;
}
.about-social-btn:hover {
  color: var(--color-brand-accent) !important;
  background-color: rgba(232, 152, 32, 0.12) !important;
}
</style>
