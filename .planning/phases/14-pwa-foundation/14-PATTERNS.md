# Phase 14: PWA Foundation — Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 4 non-asset files (2 modified, 1 new, 1 modified type declaration)
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `vite.config.ts` | config | build-time transform | `vite.config.ts` (itself — extend existing) | exact (self) |
| `env.d.ts` | config | build-time type declaration | `env.d.ts` (itself — append one line) | exact (self) |
| `src/components/projects/wallecx/WallecxApp.vue` | component / entry shell | event-driven + request-response | `src/components/projects/wallecx/MembershipsTab.vue` | exact (same app, same toast + onMounted + pb pattern) |
| `vercel.json` | config | request-response (edge headers) | none — first Vercel config in the project | no analog |

Asset files (`public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/maskable-icon-512x512.png`, `public/apple-touch-icon-180x180.png`) are generated binary outputs — no code pattern applies.

---

## Pattern Assignments

### `vite.config.ts` (config, build-time transform)

**Analog:** `vite.config.ts` itself — the file already exists with all surrounding plugins; the task is to add `VitePWA()` as the last plugin entry.

**Current imports block** (`vite.config.ts` lines 1–8 — read-only reference):
```typescript
import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import Components from "unplugin-vue-components/vite";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";
import tailwindcss from "@tailwindcss/vite";
```

**New import to add** (append after `tailwindcss` import):
```typescript
import { VitePWA } from "vite-plugin-pwa";
```

**Current plugins array** (`vite.config.ts` lines 11–25 — read-only reference):
```typescript
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
```

**VitePWA() plugin block to append as last plugin** (after `tailwindcss()`):
```typescript
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
        scope: "/",                    // LOCKED: scope "/" per STATE.md — not "/projects/wallecx"
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
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html", // LOCKED: mandatory for SPA offline routing
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/i,
            handler: "NetworkOnly",     // LOCKED: PocketBase is cross-origin; this is belt-and-suspenders
          },
        ],
      },
      devOptions: {
        enabled: false,                 // disable SW in dev — avoid dev-mode confusion
        type: "module",
      },
    }),
```

**Insertion point:** Add `VitePWA()` as the final entry in the `plugins` array, after `tailwindcss()`. Do not touch the `resolve` or `build.rolldownOptions` blocks — they are unchanged.

---

### `env.d.ts` (config, type declaration)

**Analog:** `env.d.ts` itself — one `/// <reference>` triple-slash directive appended after the existing `/// <reference types="vite/client" />` line.

**Current file** (`env.d.ts` lines 1–19 — read-only reference):
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_FEATURE_FLAG_EXAMPLE: string | boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<object, object, any>;
  export default component;
}
```

**Line to insert** (after line 1, before the blank line):
```typescript
/// <reference types="vite-plugin-pwa/vue" />
```

**Result — new top of file:**
```typescript
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />
```

**Why:** This adds TypeScript declarations for `import { useRegisterSW } from 'virtual:pwa-register/vue'` and `import { pwaInfo } from 'virtual:pwa-info'`. Without it, `npm run type-check` (which runs before `npm run build`) will fail with "cannot find module 'virtual:pwa-register/vue'".

---

### `src/components/projects/wallecx/WallecxApp.vue` (component, event-driven + request-response)

**Analog:** `src/components/projects/wallecx/MembershipsTab.vue` lines 1–35 (onMounted + toast + pb pattern); `src/components/projects/wallecx/VaccinationsTab.vue` lines 1–7 (watch import pattern).

**Imports pattern — current file** (`WallecxApp.vue` lines 1–6 — read-only reference):
```typescript
<script setup lang="ts">
import { ref } from "vue";
import VaccinationsTab from "./VaccinationsTab.vue";
import MembershipsTab from "./MembershipsTab.vue";
```

**New imports to add** (replace the `import { ref }` line and extend the block):
```typescript
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { useRegisterSW } from "virtual:pwa-register/vue";
import { pb } from "@/lib/pocketbase";
import VaccinationsTab from "./VaccinationsTab.vue";
import MembershipsTab from "./MembershipsTab.vue";
```

**Toast import pattern** from `src/components/projects/wallecx/MembershipsTab.vue` line 3 (exact match):
```typescript
import { toast } from 'vue-sonner'
```

**pb import pattern** from `src/components/projects/wallecx/MembershipsTab.vue` line 4 (exact match):
```typescript
import { pb } from '@/lib/pocketbase'
```

**onMounted pattern** from `src/components/projects/wallecx/MembershipsTab.vue` lines 20–35 (closest analog — async onMounted with try/catch and toast.error):
```typescript
onMounted(async () => {
  isLoading.value = true
  try {
    records.value = await pb
      .collection('wallecx_memberships')
      .getFullList<Memberships>({ ... })
  } catch (e: unknown) {
    toast.error('Failed to load membership cards.')
    console.error('MembershipsTab: getFullList failed', e)
  } finally {
    isLoading.value = false
  }
})
```

**PWA-05 + PWA-06 additions** — new `<script setup>` body content after imports:
```typescript
const router = useRouter();
const activeTab = ref<string>("vaccinations");

// --- PWA-06: SW update prompt ---
const { needRefresh, updateServiceWorker } = useRegisterSW();

watch(needRefresh, (val) => {
  if (!val) return;
  toast.info("A new version of Wallecx is available.", {
    duration: Infinity,
    action: {
      label: "Refresh",
      onClick: () => updateServiceWorker(true),
    },
    cancel: {
      label: "Later",
      onClick: () => {
        needRefresh.value = false;
      },
    },
  });
});

// --- PWA-05: Auth resilience + storage persistence ---
onMounted(async () => {
  // iOS 7-day localStorage eviction mitigation (best-effort; does not guarantee on iOS)
  if (navigator.storage?.persist) {
    try {
      await navigator.storage.persist();
    } catch {
      // Silently ignore — best-effort only
    }
  }

  // pb.authStore.isValid: synchronous JWT expiry check — does NOT depend on Pinia store
  // Complements the router guard (which checks !!user.value, not token expiry)
  if (!pb.authStore.isValid) {
    toast.info("Your session has expired. Please sign in again.");
    await router.push({
      name: "login",
      query: { redirect: "/projects/wallecx" },
    });
  }
});
```

**Router push pattern** from `src/router/index.ts` lines 77–86 (router guard — shows the `name: "login"` route name and `query.redirect` convention):
```typescript
router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.matched.some((record) => record.meta?.requiresAuth)) {
    if (!auth.isLoggedIn) {
      next({ name: "login", query: { redirect: to.fullPath } });
      return;
    }
  }
  next();
});
```

**Toaster location** — `src/App.vue` line 13: `<Toaster />` already present in App.vue root. WallecxApp.vue calls `toast()` directly; no Toaster import needed in WallecxApp.vue itself.

**Template** — the existing `<template>` block in WallecxApp.vue is unchanged. Only the `<script setup>` block is modified.

---

### `vercel.json` (config, edge request-response)

**Analog:** None — this is the first `vercel.json` in the project. Pattern comes entirely from RESEARCH.md Pattern 5 (verified against vite-pwa-org.netlify.app/deployment/vercel).

**Complete file content** (new file, no existing analog):
```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/(.*).webmanifest",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    },
    {
      "source": "/(.*).html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "max-age=31536000, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Deployment note:** `vercel.json` must be committed in the same PR as `vite-plugin-pwa` is added. Vercel applies CDN caching to `sw.js` by default; without this file, the SW cache header will not be `max-age=0` and users may receive stale service workers after deployment.

---

## Shared Patterns

### Toast import
**Source:** `src/components/projects/wallecx/MembershipsTab.vue` line 3
**Apply to:** WallecxApp.vue
```typescript
import { toast } from 'vue-sonner'
```

### PocketBase client import
**Source:** `src/components/projects/wallecx/MembershipsTab.vue` line 4
**Apply to:** WallecxApp.vue
```typescript
import { pb } from '@/lib/pocketbase'
```

### Vue Composition API imports
**Source:** `src/components/projects/wallecx/VaccinationsTab.vue` lines 2–3
**Apply to:** WallecxApp.vue — extend `import { ref }` to include `onMounted, watch`
```typescript
import { ref, onMounted, watch } from "vue";
```

### Router push with named route + query
**Source:** `src/router/index.ts` lines 80–82 (router guard convention)
**Apply to:** WallecxApp.vue onMounted — use `name: "login"` (not path string) + `query.redirect`
```typescript
next({ name: "login", query: { redirect: to.fullPath } });
// equivalent in component:
await router.push({ name: "login", query: { redirect: "/projects/wallecx" } });
```

### Script setup file structure order
**Source:** `src/components/projects/wallecx/MembershipsTab.vue` and `VaccinationsTab.vue` — consistent pattern across all Wallecx components:
1. `<script setup lang="ts">` — Vue + 3rd-party imports, then `@/` alias imports, then relative component imports
2. State declarations (`ref`, `computed`)
3. Lifecycle hooks (`onMounted`, `onUnmounted`)
4. Watchers (`watch`)
5. Handler functions

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `vercel.json` | config | edge request-response | No existing Vercel config in the project; pattern sourced from RESEARCH.md Pattern 5 |
| `public/pwa-192x192.png` | asset | n/a | Generated binary — CLI output from `@vite-pwa/assets-generator` |
| `public/pwa-512x512.png` | asset | n/a | Generated binary — CLI output from `@vite-pwa/assets-generator` |
| `public/maskable-icon-512x512.png` | asset | n/a | Generated binary — CLI output from `@vite-pwa/assets-generator` |
| `public/apple-touch-icon-180x180.png` | asset | n/a | Generated binary — CLI output from `@vite-pwa/assets-generator` |

---

## Metadata

**Analog search scope:** `src/components/projects/wallecx/`, `src/components/projects/lextrack/`, `src/stores/`, `src/router/`, `src/App.vue`, `vite.config.ts`, `env.d.ts`
**Files scanned:** 12
**Pattern extraction date:** 2026-05-14
