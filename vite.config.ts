import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import Components from "unplugin-vue-components/vite";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "iconify-icon",
        },
      },
    }),
    ...(process.env.NODE_ENV !== "production" ? [vueDevTools()] : []),
    Components({
      resolvers: [PrimeVueResolver()],
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "leaflet", test: /\/leaflet/, priority: 30 },
            {
              name: "primevue",
              test: /\/primevue|\/@primevue|\/@primeuix/,
              priority: 20,
            },
            {
              name: "vendor",
              test: /\/vue|\/pinia|\/vue-router|\/@vue/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
