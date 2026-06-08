# Phase 37: PWA Install + Standalone Polish - Pattern Map

**Mapped:** 2026-05-29
**Files analyzed:** 9 new/modified files
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/OfflineBanner.vue` | component | event-driven | `src/components/projects/wallecx/PwaInstallBanner.vue` | role-match |
| `src/components/projects/wallecx/PwaInstallBanner.vue` | component (extend) | event-driven | self (existing file) | exact |
| `src/App.vue` | provider (extend) | event-driven | self (existing file) | exact |
| `src/components/projects/wallecx/WallecxApp.vue` | component (extend) | request-response | self (existing file) | exact |
| `vite.config.ts` | config (extend) | transform | self (existing file) | exact |
| `index.html` | config (extend) | transform | self (existing file) | exact |
| `pwa-assets.config.ts` | config (new) | transform | `vite.config.ts` VitePWA block | partial |
| `src/router/__tests__/guard.spec.ts` | test (extend) | request-response | self (existing file) | exact |
| `src/assets/wallecx-overrides.css` | config (extend) | transform | self (existing file) | exact |

---

## Pattern Assignments

### `src/components/OfflineBanner.vue` (component, event-driven) — NEW

**Analog:** `src/components/projects/wallecx/PwaInstallBanner.vue`

**Imports pattern** (PwaInstallBanner.vue lines 1–3):
```typescript
<script setup lang="ts">
import { ref, onMounted } from 'vue';
// Phase 37: OfflineBanner replaces ref/onMounted with useOnline from @vueuse/core
import { useOnline } from '@vueuse/core'
```

**Core pattern — Teleport + fixed banner** (PwaInstallBanner.vue lines 43–75):
```html
<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3"
      :style="{
        backgroundColor: '#002244',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
      }"
      role="complementary"
      aria-label="Install Wallecx"
    >
      <!-- content -->
    </div>
  </Teleport>
</template>
```

**OfflineBanner adaptation notes:**
- Replace `v-if="isVisible"` with `v-if="!isOnline"` (useOnline reactive ref)
- Change `class` from `fixed bottom-0` to `fixed top-0` (top-fixed, D-37-10)
- Change `backgroundColor` from `'#002244'` to `'var(--color-status-warning)'` which resolves to `#e89820` (base.css line 26)
- Replace `paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)'` with `paddingTop: 'env(safe-area-inset-top)'` (D-37-10)
- No dismiss button — banner auto-clears when `isOnline` flips (D-37-11)
- Add `role="status"` and `aria-live="polite"` for accessibility
- Copy: `"You're offline. Changes will resume when you reconnect."`
- `z-index: 50` matches install banner (class `z-50`)

**Complete OfflineBanner template pattern:**
```html
<Teleport to="body">
  <div
    v-if="!isOnline"
    class="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-2"
    :style="{
      backgroundColor: 'var(--color-status-warning)',
      paddingTop: 'env(safe-area-inset-top)',
      color: '#0d1117',
    }"
    role="status"
    aria-live="polite"
  >
    You're offline. Changes will resume when you reconnect.
  </div>
</Teleport>
```

---

### `src/components/projects/wallecx/PwaInstallBanner.vue` (component, event-driven) — EXTEND

**Analog:** self — existing 76-line file

**Current structure to preserve** (lines 1–41):
```typescript
<script setup lang="ts">
import { ref, onMounted } from 'vue';

const BANNER_DISMISSED_KEY = 'wallecx_pwa_banner_dismissed';
const isVisible = ref(false);

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}
```

**New imports to add** (useMobileEnv singleton consumption):
```typescript
import { useMobileEnv, clearInstallPromptEvent } from '@/composables/useMobileEnv'
const { installPromptEvent, isStandalone } = useMobileEnv()
```

**Dismissal schema upgrade** (replaces current onMounted + dismiss, D-37-06/D-37-07):
```typescript
interface DismissalRecord {
  dismissedAt: string  // ISO8601
  platform: 'ios' | 'android'
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(BANNER_DISMISSED_KEY)
    if (!raw) return false
    // D-37-07: lazy migration of Phase 14 'true' string schema
    if (raw === 'true') {
      const migrated: DismissalRecord = {
        dismissedAt: new Date().toISOString(),
        platform: isIosSafari() ? 'ios' : 'android'
      }
      localStorage.setItem(BANNER_DISMISSED_KEY, JSON.stringify(migrated))
      return true  // 30-day clock starts now for existing dismissers
    }
    const parsed: DismissalRecord = JSON.parse(raw)
    return Date.now() - Date.parse(parsed.dismissedAt) < THIRTY_DAYS_MS
  } catch {
    return true  // localStorage failure → suppress banner silently
  }
}

function writeDismissalRecord(platform: 'ios' | 'android'): void {
  try {
    const record: DismissalRecord = { dismissedAt: new Date().toISOString(), platform }
    localStorage.setItem(BANNER_DISMISSED_KEY, JSON.stringify(record))
  } catch {
    // Degrade silently
  }
}
```

**Android install handler** (new, D-37-03/D-37-04):
```typescript
async function handleAndroidInstall(): Promise<void> {
  const event = installPromptEvent.value
  if (!event) return
  // CRITICAL: call prompt() FIRST (synchronously in user-gesture), then await userChoice
  event.prompt()
  const { outcome } = await event.userChoice
  if (outcome === 'dismissed') {
    writeDismissalRecord('android')
  }
  // Both outcomes: clear singleton so banner hides this session (M-9)
  clearInstallPromptEvent()
}
```

**Updated onMounted logic** (replaces current lines 21–31):
```typescript
onMounted(() => {
  if (isStandalone.value) return  // D-37-08: hard gate first
  if (isDismissed()) return
  // Two branches are set separately; template uses v-if / v-else-if
  if (isIosSafari()) {
    isIosVisible.value = true
  }
  // Android branch visibility is driven by installPromptEvent ref reactively — no separate flag needed
})
```

**Template: two-branch layout** (one component per A-43-5, D-37-02):
```html
<template>
  <Teleport to="body">
    <!-- iOS branch (existing, v-if) -->
    <div
      v-if="isIosVisible"
      class="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3"
      :style="{
        backgroundColor: '#002244',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
      }"
      role="complementary"
      aria-label="Install Wallecx"
    >
      <!-- existing iOS content: share icon + instructions + dismiss button -->
    </div>

    <!-- Android branch (new, v-else-if) — same navy bar, swapped content (D-37-03) -->
    <div
      v-else-if="installPromptEvent && !isStandalone"
      class="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3"
      :style="{
        backgroundColor: '#002244',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
      }"
      role="complementary"
      aria-label="Install Wallecx"
    >
      <span class="flex-1 text-sm" style="color: #ffffff;">
        Install Wallecx for faster access and home-screen shortcuts.
      </span>
      <button
        class="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation px-3"
        style="color: #ffffff; background: none; border: none; cursor: pointer;"
        aria-label="Install Wallecx"
        @click="handleAndroidInstall"
      >
        Install
      </button>
      <button
        class="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
        style="color: rgba(255,255,255,0.7); background: none; border: none; cursor: pointer;"
        aria-label="Dismiss install banner"
        @click="dismissAndroid"
      >
        <iconify-icon icon="mdi:close" width="20" height="20" aria-hidden="true"></iconify-icon>
      </button>
    </div>
  </Teleport>
</template>
```

---

### `src/App.vue` (provider, event-driven) — EXTEND

**Analog:** self — existing 45-line file

**Current template** (lines 40–45):
```html
<template>
  <CustomNavBar class="mb-1" :style="{ paddingTop: 'env(safe-area-inset-top)' }" />
  <RouterView />
  <Toaster />
  <SpeedInsights v-if="isProd" />
</template>
```

**Extension: add OfflineBanner import + mount** (D-37-10):
```typescript
// Add to script imports:
import OfflineBanner from "@/components/OfflineBanner.vue";
```

```html
<!-- Updated template — OfflineBanner mounts BEFORE CustomNavBar -->
<template>
  <OfflineBanner />
  <CustomNavBar class="mb-1" :style="{ paddingTop: 'env(safe-area-inset-top)' }" />
  <RouterView />
  <Toaster />
  <SpeedInsights v-if="isProd" />
</template>
```

Note: OfflineBanner uses `<Teleport to="body">` so DOM order in template does not affect stacking context — `z-index: 50` on the teleported element governs rendering order against CustomNavBar.

---

### `src/components/projects/wallecx/WallecxApp.vue` (component, request-response) — EXTEND

**Analog:** self — existing 127-line file

**Current imports** (lines 1–9):
```typescript
import { ref, onMounted, watch, defineAsyncComponent } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { useRegisterSW } from "virtual:pwa-register/vue";
import { pb } from "@/lib/pocketbase";
import WallecxSkeleton from "./WallecxSkeleton.vue";
import PwaInstallBanner from './PwaInstallBanner.vue';
import '@/assets/wallecx-overrides.css';
```

**New imports to add:**
```typescript
import { nextTick } from "vue";  // add to vue imports
import { useRoute } from "vue-router";  // add to vue-router imports
import { useMobileEnv } from "@/composables/useMobileEnv";
```

**PWA-06: SW-update toast safe-area** (extends existing lines 23–38):
```typescript
// Current watch(needRefresh, ...) call at lines 23–38 — add style option:
toast.info("A new version of Wallecx is available.", {
  duration: Infinity,
  style: { paddingBottom: 'env(safe-area-inset-bottom)' },  // PWA-06
  action: {
    label: "Refresh",
    onClick: () => updateServiceWorker(true),
  },
  cancel: {
    label: "Later",
    onClick: () => { needRefresh.value = false; },
  },
});
```

**NFR-IOS-EVICTION-UX: eviction-aware toast** (replaces line 60 toast.info):
```typescript
const { isStandalone } = useMobileEnv()

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);
}

// In onMounted, replace line 60 toast.info call:
const message = (isIosSafari() || isStandalone.value)
  ? 'iOS may have cleared local data after 7 days without opening the app. Please sign in again. Tip: pin Wallecx to your home screen to prevent this.'
  : 'Your session has expired. Please sign in again.'
toast.info(message)
```

**PWA-09: pendingAction dispatch** (new, added inside existing onMounted, D-37-14):
```typescript
const route = useRoute()

const ACTION_TAB_MAP: Record<string, string> = {
  'add-expense': 'expenses',
  'add-vaccination': 'vaccinations',
  'add-membership': 'memberships',
  'open-reports': 'expenses',
}

const pendingAction = ref<string | null>(null)

// In onMounted, after existing persist + auth check logic:
const action = route.query.action as string | undefined
if (action && ACTION_TAB_MAP[action]) {
  activeTab.value = ACTION_TAB_MAP[action]
  await nextTick()  // Pitfall 4: let Suspense resolve tab before setting pendingAction
  pendingAction.value = action
  router.replace({ query: {} })
}
```

**Passing pendingAction as prop to async tabs:**
```html
<!-- In template, pass pendingAction to each tab component: -->
<ExpensesTab :pending-action="pendingAction" />
<VaccinationsTab :pending-action="pendingAction" />
<MembershipsTab :pending-action="pendingAction" />
```

**Tab-side watcher pattern** (example for ExpensesTab — applies to all three tabs):
```typescript
// In ExpensesTab.vue (and VaccinationsTab, MembershipsTab):
const props = defineProps<{ pendingAction?: string | null }>()

watch(() => props.pendingAction, (action) => {
  if (action === 'add-expense') openManageExpense()
  if (action === 'open-reports') activeSubTab.value = 'reports'
}, { immediate: true })  // immediate: true catches values set before watcher registers
```

---

### `vite.config.ts` (config, transform) — EXTEND

**Analog:** self — existing 146-line file

**LOCKED lines — must be byte-intact:**
```typescript
registerType: "prompt",          // LOCKED: never 'autoUpdate' — CRUD forms have unsaved state (line 28)
scope: "/",                      // LOCKED: scope "/" per STATE.md — NOT "/projects/wallecx" (line 42)
```

**Extension: add shortcuts array to manifest object** (D-37-15, after `screenshots` array, ~line 78):
```typescript
shortcuts: [
  {
    name: 'Add Expense',
    short_name: 'Add Expense',
    url: '/projects/wallecx?action=add-expense',
    icons: [{ src: 'shortcuts/shortcut-add-expense.png', sizes: '96x96', type: 'image/png', purpose: 'any' }]
  },
  {
    name: 'Add Vaccination',
    short_name: 'Add Vaccination',
    url: '/projects/wallecx?action=add-vaccination',
    icons: [{ src: 'shortcuts/shortcut-add-vaccination.png', sizes: '96x96', type: 'image/png', purpose: 'any' }]
  },
  {
    name: 'Add Membership',
    short_name: 'Add Membership',
    url: '/projects/wallecx?action=add-membership',
    icons: [{ src: 'shortcuts/shortcut-add-membership.png', sizes: '96x96', type: 'image/png', purpose: 'any' }]
  },
  {
    name: 'Open Reports',
    short_name: 'Open Reports',
    url: '/projects/wallecx?action=open-reports',
    icons: [{ src: 'shortcuts/shortcut-open-reports.png', sizes: '96x96', type: 'image/png', purpose: 'any' }]
  }
],
```

**includeAssets pattern** (existing lines 30–34 — extend if auto-precache assumption A3 fails):
```typescript
includeAssets: [
  "favicon.ico",
  "apple-touch-icon-180x180.png",
  "branding_logo.svg",
  // Add if Workbox build log shows "Skipping precaching" for new PNGs:
  // "splash/*.png",
  // "shortcuts/*.png",
],
```

Note: Workbox `globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"]` (line 81) already matches `*.png`, so splash + shortcut PNGs in `public/` subdirectories should be auto-precached. Verify in build output before adding to `includeAssets`.

---

### `index.html` (config, transform) — EXTEND

**Analog:** self — existing 34-line file

**LOCKED line — must be byte-intact** (line 9):
```html
<!-- LOCKED: viewport-fit=cover is required for env(safe-area-inset-*) non-zero values (CON-VIEWPORT-FIT / LT-09). Do not remove. -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content" />
```

**PWA-01: iOS standalone meta tags** (add after viewport meta, before `<script>` block):
```html
<!-- PWA-01: iOS standalone polish -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Wallecx" />
<!-- Per-color-scheme theme-color (light: #002244 matches manifest theme_color; dark: #0d1117 = --color-surface-page in .my-app-dark, base.css line 59) -->
<meta name="theme-color" content="#002244" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0d1117" media="(prefers-color-scheme: dark)" />
```

**PWA-02: apple-touch-startup-image link tags** (add after iOS meta tags):
```html
<!-- PWA-02: Branded splash screens (NFR-IOS-SPLASH) — generated by @vite-pwa/assets-generator -->
<!-- iPhone 14 Pro: 390×844 logical → 1179×2556 physical @3x -->
<link rel="apple-touch-startup-image"
  href="/splash/apple-splash-portrait-1179x2556.png"
  media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
<!-- Android/generic 360×780 → 1080×2340 physical @3x -->
<link rel="apple-touch-startup-image"
  href="/splash/apple-splash-portrait-1080x2340.png"
  media="(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
<!-- iPad 768×1024 → 1536×2048 physical @2x -->
<link rel="apple-touch-startup-image"
  href="/splash/apple-splash-portrait-1536x2048.png"
  media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
```

Note: If `@vite-pwa/assets-generator` with `headLinkOptions.preset: '2023'` auto-generates these link tags, use the generated tags instead — they will have authoritative media queries per device. Do not duplicate.

**Existing `color-scheme` meta** (line 27 — do not remove or duplicate):
```html
<meta name="color-scheme" content="light dark" />
```

---

### `pwa-assets.config.ts` (config, transform) — NEW (project root)

**Analog:** `vite.config.ts` VitePWA plugin block (configuration-file pattern with typed `defineConfig`)

**Pattern: typed defineConfig with preset combination:**
```typescript
// pwa-assets.config.ts — project root
import {
  defineConfig,
  minimal2023Preset,
  combinePresetAndAppleSplashScreens
} from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023'  // Auto-generates correct media query strings per Apple device
  },
  preset: combinePresetAndAppleSplashScreens(
    minimal2023Preset,
    {
      padding: 0.3,
      resizeOptions: {
        background: '#002244',  // Matches manifest.background_color
        fit: 'contain',
      },
      linkMediaOptions: { log: true, basePath: '/' }
      // Omit deviceNames to generate ALL Apple devices — use only the 3 needed PNGs in index.html
    }
  ),
  images: ['public/branding_logo.svg']  // Confirmed source image (RESEARCH Environment Availability)
})
```

**Post-generation steps required** (if CLI lacks `--output` flag):
```powershell
# Create output directories before running CLI:
New-Item -ItemType Directory -Force public\splash
New-Item -ItemType Directory -Force public\shortcuts
# Move generated splash PNGs to public/splash/
# Move generated shortcut PNGs to public/shortcuts/
```

---

### `src/router/__tests__/guard.spec.ts` (test, request-response) — EXTEND

**Analog:** self — existing 90-line file

**Current test structure to copy** (lines 66–73):
```typescript
it("redirects to /login when not authenticated", async () => {
  (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ isLoggedIn: false });
  const router = buildRouter();
  addGuard(router);
  await router.push("/projects/wallecx");
  expect(router.currentRoute.value.name).toBe("login");
  expect(router.currentRoute.value.query.redirect).toBe("/projects/wallecx");
});
```

**New test to add** (D-37-16 — query-string preservation through redirect):
```typescript
it("preserves query string in redirect when not authenticated", async () => {
  (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ isLoggedIn: false });
  const router = buildRouter();
  addGuard(router);
  await router.push("/projects/wallecx?action=add-expense");
  expect(router.currentRoute.value.name).toBe("login");
  expect(router.currentRoute.value.query.redirect).toBe("/projects/wallecx?action=add-expense");
});
```

Note: `buildRouter()` and `addGuard()` helpers are already defined (lines 27–59). The new test only adds to the existing `describe("requiresAuth guard — /projects/wallecx")` block. No new imports needed — all setup is in the existing `beforeEach`.

---

### `src/assets/wallecx-overrides.css` (config, transform) — EXTEND (optional)

**Analog:** self — existing file

**Context:** Only needed if the planner picks the CSS-override approach for SW-update toast safe-area (PWA-06 discretion item). The per-call `style` option on the `toast.info()` call is preferred (more targeted, does not affect other toasts).

**CSS override pattern** (add at end of wallecx-overrides.css — global, not scoped):
```css
/* Phase 37 PWA-06: SW-update toast safe-area — home indicator clearance on notched iPhones.
 * [data-sonner-toaster] targets the vue-sonner Toaster root. Uses !important because
 * vue-sonner sets inline padding via JS which wins over class-based rules at same specificity. */
[data-sonner-toaster] {
  padding-bottom: env(safe-area-inset-bottom) !important;
}
```

**If using per-call style approach instead** (preferred, in WallecxApp.vue watch block):
```typescript
toast.info("A new version of Wallecx is available.", {
  duration: Infinity,
  style: { paddingBottom: 'env(safe-area-inset-bottom)' },  // PWA-06
  // ... rest of options unchanged
});
```

The per-call `style` option is preferred: it is scoped to the SW-update toast only, does not touch the CSS override file, and follows the same inline-style pattern already used on banner elements.

---

## Shared Patterns

### Teleport-to-body Fixed Banner Pattern
**Source:** `src/components/projects/wallecx/PwaInstallBanner.vue` lines 43–75
**Apply to:** `OfflineBanner.vue` (new), Android branch in `PwaInstallBanner.vue` (extend)
```html
<Teleport to="body">
  <div
    v-if="condition"
    class="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3"
    :style="{
      backgroundColor: '#002244',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
    }"
    role="complementary"
    aria-label="..."
  >
```
Key invariants: `z-50` class, safe-area-aware padding via `:style` (not Tailwind class — dynamic env() values require inline style), `<Teleport to="body">` for stacking context independence.

### Safe-Area Padding Pattern
**Source:** `src/App.vue` line 41, `src/assets/wallecx-overrides.css` line 96
**Apply to:** `OfflineBanner.vue` (paddingTop), Android branch (paddingBottom)
```html
<!-- Top-fixed surfaces (OfflineBanner, CustomNavBar): -->
:style="{ paddingTop: 'env(safe-area-inset-top)' }"

<!-- Bottom-fixed surfaces (install banners): -->
:style="{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }"
```
Critical: always use `calc(env(...) + 0.75rem)` for bottom-fixed (env resolves to 0 on non-notched devices, collapsing margin). `paddingTop` on top-fixed surfaces uses plain `env()` (navbar clearance only).

### Min 44×44 Touch Target Pattern
**Source:** `src/components/projects/wallecx/PwaInstallBanner.vue` lines 65–71, `src/assets/wallecx-overrides.css` lines 71–75
**Apply to:** Install button (Android branch), dismiss buttons (both branches), OfflineBanner if it had dismiss
```html
<button
  class="min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
  ...
>
```

### useMobileEnv Module Singleton Pattern
**Source:** `src/composables/useMobileEnv.ts` lines 55–70, `src/App.vue` lines 6–10
**Apply to:** `PwaInstallBanner.vue` (installPromptEvent consumer), `WallecxApp.vue` (isStandalone for eviction copy)
```typescript
import { useMobileEnv, clearInstallPromptEvent } from '@/composables/useMobileEnv'
const { installPromptEvent, isStandalone } = useMobileEnv()
// installPromptEvent is module-scope singleton — same ref shared across all useMobileEnv() calls
// clearInstallPromptEvent() called after prompt() to prevent double-call (M-9)
```

### Dismissal localStorage Guard Pattern
**Source:** `src/components/projects/wallecx/PwaInstallBanner.vue` lines 21–30
**Apply to:** PwaInstallBanner.vue upgraded dismissal logic
```typescript
onMounted(() => {
  try {
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissed === 'true') return;
    // ... show logic
  } catch {
    // localStorage unavailable (private browsing) — silently degrade; banner does not show
  }
});
```
Phase 37 extends this: the `try/catch` wrapper is preserved; the `dismissed === 'true'` check becomes the `isDismissed()` function with JSON schema + lazy migration.

### vue-sonner Toast Pattern
**Source:** `src/components/projects/wallecx/WallecxApp.vue` lines 23–38
**Apply to:** SW-update toast (add `style`), eviction-aware copy (replace message)
```typescript
import { toast } from "vue-sonner";

toast.info("message", {
  duration: Infinity,
  action: { label: "Label", onClick: () => handler() },
  cancel: { label: "Label", onClick: () => { ref.value = false } },
});
```

### Router Guard Test Pattern
**Source:** `src/router/__tests__/guard.spec.ts` lines 27–59, 66–73
**Apply to:** New query-preservation test (D-37-16)
```typescript
// Pattern: buildRouter() + addGuard(router) + router.push(path) + expect assertions
// All in a single it() block; no new imports needed; reuses existing helpers
it("test name", async () => {
  (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ isLoggedIn: false });
  const router = buildRouter();
  addGuard(router);
  await router.push("/projects/wallecx?action=add-expense");
  expect(router.currentRoute.value.name).toBe("login");
  expect(router.currentRoute.value.query.redirect).toBe("/projects/wallecx?action=add-expense");
});
```

---

## No Analog Found

All files in Phase 37 have analogs. `pwa-assets.config.ts` is the weakest match (partial — `vite.config.ts` establishes the `defineConfig` + VitePWA typed-config pattern but is a different tool); implementation follows RESEARCH.md Pattern 1 for the `@vite-pwa/assets-generator`-specific API.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `public/splash/*.png` | static asset | n/a | Generated by CLI, not authored. No code pattern needed. |
| `public/shortcuts/*.png` | static asset | n/a | Generated by CLI, not authored. No code pattern needed. |

---

## Metadata

**Analog search scope:** `src/components/`, `src/composables/`, `src/router/`, `src/assets/`, `vite.config.ts`, `index.html`
**Files read:** 11 source files
**Pattern extraction date:** 2026-05-29
