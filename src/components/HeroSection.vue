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
  <div class="relative bg-neutral-900 min-h-screen flex items-center overflow-hidden" id="hero-section">
    <!-- Geometric decorative elements -->
    <div class="absolute top-20 left-10 w-12 h-12 bg-emerald-500/20 rounded-lg transform rotate-12 blur-sm"></div>
    <div class="absolute bottom-20 right-10 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -z-0"></div>

    <div class="container mx-auto px-6 lg:px-12 relative z-10">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <!-- Text Content -->
        <div class="text-left animate-fade-in-up">
          <div class="inline-block mb-4">
            <span class="text-gray-400 font-medium tracking-wider text-sm flex items-center gap-2">
              HI THERE <span class="animate-wave">👋</span> I'M
            </span>
          </div>
          
          <h1 class="text-5xl lg:text-7xl font-sans font-bold text-white mb-4 leading-tight">
            Cedrick <br />
            Jhan
          </h1>
          
          <h2 class="text-lg lg:text-xl font-bold tracking-wide mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
            .NET DEVELOPER + VUE DEVELOPER 💻
          </h2>
          
          <p class="text-gray-400 text-base max-w-lg mb-8 leading-relaxed">
            I'm a passionate developer focused on building robust backends with .NET and creating beautiful, interactive frontends with Vue.js.
          </p>
          
          <div class="flex flex-wrap gap-4">
            <button 
              @click="scrollToAboutMe"
              class="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              About Me
            </button>
            <Button 
                as="router-link"
                to="/projects"
                label="View Projects"
                variant="outlined"
                rounded
                class="!px-8 !py-3 !border-gray-700 !text-white !font-medium hover:!bg-white/5 !transition-colors !no-underline"
            />
          </div>
        </div>

        <!-- Hero Image -->
        <div class="relative">
          <div class="relative z-10 transform transition-transform hover:scale-105 duration-500">
             <!-- Using the existing logo/image or a placeholder if preferred, styled to fit -->
             <img src="@/assets/branding_logo.svg" alt="Cedrick Jhan" class="w-full max-w-md mx-auto drop-shadow-2xl">
          </div>
          
          <!-- Decorative backing for image -->
          <div class="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-lg rotate-12 -z-10"></div>
          <div class="absolute top-10 -left-10 w-20 h-20 bg-emerald-500/10 rounded-full -z-10"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
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
</style>