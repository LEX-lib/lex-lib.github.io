<script setup lang="ts">
const scrollToAboutMe = () => {
  document
    .querySelector("#about-me-section")
    ?.scrollIntoView({ behavior: "smooth" });
};
</script>

<template>
  <div
    class="relative bg-surface-page min-h-screen flex items-center overflow-hidden"
    id="hero-section"
  >
    <!-- Decorative background shapes -->
    <div
      class="absolute top-20 left-10 w-12 h-12 rounded-lg transform rotate-12 blur-sm hero-blob-navy-1"
    ></div>
    <div
      class="absolute bottom-20 right-10 w-24 h-24 rounded-full blur-xl"
      style="background-color: rgba(232, 152, 32, 0.15)"
    ></div>
    <div
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl -z-0 hero-blob-navy-2"
    ></div>

    <div class="container mx-auto px-6 lg:px-12 relative z-10 py-20">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <!-- Text Content -->
        <div class="text-left animate-fade-in-up">
          <div class="inline-block mb-4">
            <span
              class="font-medium tracking-wider text-sm flex items-center gap-2"
              style="color: var(--color-typo-muted)"
            >
              HI THERE <span class="animate-wave">👋</span> I'M
            </span>
          </div>

          <h1
            class="text-5xl lg:text-7xl font-bold mb-4 leading-tight"
            style="color: var(--color-typo-heading)"
          >
            Cedrick <br />
            Jhan
          </h1>

          <h2
            class="text-lg lg:text-xl font-bold tracking-wide mb-6 hero-role-gradient"
          >
            .NET DEVELOPER + VUE DEVELOPER 💻
          </h2>

          <p
            class="text-base max-w-lg mb-8 leading-relaxed"
            style="color: var(--color-typo-body)"
          >
            I'm a passionate developer focused on building robust backends with
            .NET and creating beautiful, interactive frontends with Vue.js.
          </p>

          <div class="flex flex-wrap gap-4">
            <button
              @click="scrollToAboutMe"
              class="hero-cta-primary px-8 py-3 font-bold rounded-full transition-all transform hover:scale-105"
            >
              About Me
            </button>
            <Button
              as="router-link"
              to="/projects"
              label="View Projects"
              variant="outlined"
              rounded
              class="!px-8 !py-3 !font-medium !transition-colors !no-underline"
            />
          </div>
        </div>

        <!-- Hero Image -->
        <div class="relative">
          <div
            class="relative z-10 transform transition-transform hover:scale-105 duration-500"
          >
            <img
              src="@/assets/branding_logo.svg"
              alt="Cedrick Jhan"
              class="w-full max-w-md mx-auto drop-shadow-xl"
            />
          </div>

          <!-- Decorative backing -->
          <div
            class="absolute -bottom-10 -right-10 w-32 h-32 rounded-lg rotate-12 -z-10"
            style="background-color: rgba(232, 152, 32, 0.12)"
          ></div>
          <div
            class="absolute top-10 -left-10 w-20 h-20 rounded-full -z-10 hero-blob-navy-3"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes wave {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

.animate-wave {
  display: inline-block;
  animation: wave 1.5s infinite;
  transform-origin: 70% 70%;
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Role subtitle: brand-primary → brand-accent gradient */
.hero-role-gradient {
  background: linear-gradient(
    to right,
    var(--color-brand-primary),
    var(--color-brand-accent)
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Primary CTA button using brand accent */
.hero-cta-primary {
  background-color: var(--color-brand-accent);
  color: var(--color-brand-primary);
  box-shadow: 0 0 20px rgba(232, 152, 32, 0.35);
}
.hero-cta-primary:hover {
  background-color: color-mix(in srgb, var(--color-brand-accent) 85%, var(--color-mix-target));
}

/* Decorative blobs — navy is invisible on dark page; switch to amber per D-06 */
.hero-blob-navy-1 {
  background-color: rgba(0, 34, 68, 0.12);
}
.hero-blob-navy-2 {
  background-color: rgba(0, 34, 68, 0.05);
}
.hero-blob-navy-3 {
  background-color: rgba(0, 34, 68, 0.08);
}
:global(.my-app-dark) .hero-blob-navy-1 {
  background-color: rgba(232, 152, 32, 0.18);
}
:global(.my-app-dark) .hero-blob-navy-2 {
  background-color: rgba(232, 152, 32, 0.08);
}
:global(.my-app-dark) .hero-blob-navy-3 {
  background-color: rgba(232, 152, 32, 0.12);
}
</style>
