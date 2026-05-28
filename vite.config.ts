import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import Components from "unplugin-vue-components/vite";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

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
    VitePWA({
      registerType: "prompt",          // LOCKED: never 'autoUpdate' — CRUD forms have unsaved state
      strategies: "generateSW",        // default; no custom sw.ts needed
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon-180x180.png",
        "branding_logo.svg",
      ],
      manifest: {
        name: "Wallecx",
        short_name: "Wallecx",
        description: "Your personal vaccination and membership card vault",
        theme_color: "#002244",
        background_color: "#002244",
        display: "standalone",
        scope: "/",                    // LOCKED: scope "/" per STATE.md — NOT "/projects/wallecx"
        start_url: "/projects/wallecx",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "screenshots/screenshot-mobile.png",
            sizes: "390x844",
            type: "image/png",
            label: "Wallecx — Vaccination & Membership Card Vault",
          },
          {
            src: "screenshots/screenshot-desktop.png",
            sizes: "1280x800",
            type: "image/png",
            form_factor: "wide",
            label: "Wallecx — Vaccination & Membership Card Vault (Desktop)",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        // Exclude large non-PWA assets from precache manifest (about-me photo is 9.85 MB,
        // not needed offline for Wallecx PWA functionality)
        globIgnores: ["**/about-me-photo*"],
        // Raise limit to 3 MiB to accommodate the vendor bundle (2.57 MiB)
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",  // LOCKED: mandatory for SPA offline — no leading slash
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/i,
            handler: "NetworkOnly",       // LOCKED: PocketBase is cross-origin; belt-and-suspenders
          },
        ],
      },
      devOptions: {
        enabled: false,                   // SW disabled in dev to avoid stale cache confusion
        type: "module",
      },
    }),
    // FND-03: bundle treemap, gated on `process.env.ANALYZE === 'true'` (set by the
    // cross-env-wrapped `npm run analyze` script). A plain `npm run build` NEVER attaches
    // this plugin, so the dist/stats.html report is only produced on demand.
    ...(process.env.ANALYZE === "true"
      ? [
          visualizer({
            filename: "dist/stats.html",
            template: "treemap",
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
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
            { name: "chart-js", test: /\/chart\.js/, priority: 25 },
            { name: "jsbarcode", test: /\/jsbarcode/, priority: 25 },
            { name: "image-compression", test: /\/browser-image-compression/, priority: 25 },
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
