import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config';
// PrimeVue directives are NOT covered by unplugin-vue-components auto-import (only components are).
// Manually register Tooltip so `v-tooltip="..."` works in ActivityCard.vue.
import Tooltip from 'primevue/tooltip';
import Aura from '@primeuix/themes/aura';
import 'iconify-icon';
import './assets/main.css';
import { MotionPlugin } from '@vueuse/motion'

import App from './App.vue'
import router from './router'
import 'primeicons/primeicons.css'
import 'vue-sonner/style.css'
import { definePreset } from '@primeuix/themes';

// Example: Access environment variables from Vite
// if (import.meta.env.DEV) {
//   console.info('[Env]', {
//     MODE: import.meta.env.MODE,
//     VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
//     VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
//     VITE_FEATURE_FLAG_EXAMPLE: import.meta.env.VITE_FEATURE_FLAG_EXAMPLE,
//   })
// }

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{indigo.50}',
            100: '{indigo.100}',
            200: '{indigo.200}',
            300: '{indigo.300}',
            400: '{indigo.400}',
            500: '{indigo.500}',
            600: '{indigo.600}',
            700: '{indigo.700}',
            800: '{indigo.800}',
            900: '{indigo.900}',
            950: '{indigo.950}'
        }
    }
});


const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: MyPreset,
        //preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: '.my-app-dark',
            cssLayer: false
        }
    },
    ripple: true,
    pt: {
        button: {
            root: {
                class: 'p-button-sm'
            }
        }
    }
});
app.directive('tooltip', Tooltip);
app.use(MotionPlugin)

app.mount('#app')
