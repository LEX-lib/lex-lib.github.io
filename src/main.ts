import { createApp } from "vue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import ConfirmationService from "primevue/confirmationservice";
import Aura from "@primeuix/themes/aura";
import "iconify-icon";
import "./assets/main.css";
import { MotionPlugin } from "@vueuse/motion";

import App from "./App.vue";
import router from "./router";
import "primeicons/primeicons.css";
import "vue-sonner/style.css";
import { definePreset } from "@primeuix/themes";

// Example: Access environment variables from Vite
// if (import.meta.env.DEV) {
//   console.info('[Env]', {
//     MODE: import.meta.env.MODE,
//     VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
//     VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
//     VITE_FEATURE_FLAG_EXAMPLE: import.meta.env.VITE_FEATURE_FLAG_EXAMPLE,
//   })
// }

// Brand palette:
//   Primary (navy):  #002244
//   Accent  (amber): #E89820
// The primary scale below is a hand-crafted navy ramp from near-white (#e8edf4)
// down to near-black (#00111f), with 500 anchored at the brand primary #002244.
const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "#e8edf4",
      100: "#c5d2e4",
      200: "#9fb4cf",
      300: "#7896ba",
      400: "#3d6a9a",
      500: "#002244", // brand primary
      600: "#001e3c",
      700: "#001833",
      800: "#00122a",
      900: "#000c1f",
      950: "#00060f",
    },
    colorScheme: {
      light: {
        primary: {
          color: "#002244",
          inverseColor: "#ffffff",
          hoverColor: "#0a3d6b",
          activeColor: "#001e3c",
        },
        highlight: {
          background: "#fdf3dc",
          focusBackground: "#e89820",
          color: "#002244",
          focusColor: "#ffffff",
        },
      },
      dark: {
        primary: {
          color: "#e89820",
          inverseColor: "#002244",
          hoverColor: "#f0ab40",
          activeColor: "#c87d10",
        },
        highlight: {
          background: "rgba(232,152,32,0.16)",
          focusBackground: "rgba(232,152,32,0.24)",
          color: "#fdf3dc",
          focusColor: "#fdf3dc",
        },
      },
    },
  },
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
    //preset: Aura,
    options: {
      prefix: "p",
      darkModeSelector: ".my-app-dark",
      cssLayer: false,
    },
  },
  ripple: true,
  pt: {
    button: {
      root: {
        class: "p-button-sm",
      },
    },
  },
});
app.use(MotionPlugin);
app.use(ConfirmationService);

app.mount("#app");
