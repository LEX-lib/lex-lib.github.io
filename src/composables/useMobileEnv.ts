import { ref, watch, type Ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { useIsMobile } from './useIsMobile'

/**
 * `useMobileEnv` — the single mobile primitive every later v4.3 phase consumes
 * (Phase 33 FND-01). Returns ONE object of refs/functions (D-01):
 * `{ isMobile, isTablet, isStandalone, installPromptEvent, safeAreaInsets }`.
 *
 * It EXTENDS, does NOT replace, `useIsMobile.ts` (D-02, A-43-1). The existing
 * `useIsMobile()` keeps returning `Ref<boolean>` at 639px verbatim and its
 * callers are NOT migrated. `isMobile` here is produced by calling
 * `useIsMobile()` internally so the 639px breakpoint has a SINGLE source of
 * truth and the two composables can never diverge.
 *
 * Breakpoint tiers (D-03 / D-04), mutually exclusive:
 *   - isMobile : viewport width ≤ 639px (Tailwind `sm:` minus 1)
 *   - isTablet : viewport width 640–1023px (Tailwind `sm:` … `lg:` minus 1)
 *   - desktop  : viewport width ≥ 1024px (implicit `!isMobile && !isTablet`)
 * iPad portrait (768–820px) reads isTablet === true, isMobile === false.
 *
 * All reactive values are seeded SYNCHRONOUSLY (M-6 race): `useMediaQuery`
 * seeds from `window.matchMedia(...).matches` at call time, and `useIsMobile`
 * already seeds synchronously. Consumers see the correct value on first render
 * BEFORE any media-query 'change' event fires.
 *
 * Capture-only (D-05, M-9): `installPromptEvent` is a module-scope singleton
 * ref written via `setInstallPromptEvent` / cleared via `clearInstallPromptEvent`
 * (registered from App.vue, see FND-02). This composable NEVER calls `.prompt()`
 * — Phase 37 owns the user-gesture-gated call. No Pinia store is introduced.
 */

/**
 * Minimal `beforeinstallprompt` event shape. TS lib.dom does not ship a
 * `BeforeInstallPromptEvent` type, so we define the surface we rely on.
 * `prompt()` is intentionally typed but NEVER called in Phase 33.
 */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

/** Safe-area inset shape. CSS `env()` strings — consumed by Phase 34 sticky surfaces. */
export interface SafeAreaInsets {
  top: string
  right: string
  bottom: string
  left: string
}

// Module-scope singleton for the captured install-prompt event (A-43-4, D-05).
// A SINGLE ref shared across every useMobileEnv() call so App.vue's write is
// visible to all future readers (Phase 37's Install button). NOT a Pinia store.
const installPromptEvent = ref<BeforeInstallPromptEvent | null>(null)

/**
 * Store the captured `beforeinstallprompt` event in the module singleton.
 * Called from App.vue's listener (FND-02). Capture-only — does not prompt.
 */
export function setInstallPromptEvent(event: BeforeInstallPromptEvent | null): void {
  installPromptEvent.value = event
}

/**
 * Clear the captured install-prompt event (e.g. on `appinstalled`).
 */
export function clearInstallPromptEvent(): void {
  installPromptEvent.value = null
}

/** Synchronous standalone detection (lifted from PwaInstallBanner.vue's isInStandaloneMode). */
function detectStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  )
}

export interface MobileEnv {
  /** true when viewport width ≤ 639px — shares useIsMobile's single source of truth. */
  isMobile: Ref<boolean>
  /** true when viewport width is 640–1023px (iPad portrait reads tablet, D-04). */
  isTablet: Ref<boolean>
  /** true when running as an installed PWA (display-mode standalone or iOS navigator.standalone). */
  isStandalone: Ref<boolean>
  /** Module-scope singleton: the captured beforeinstallprompt event, or null. Capture-only (D-05). */
  installPromptEvent: Ref<BeforeInstallPromptEvent | null>
  /** CSS env() strings for safe-area insets (Phase 34 sticky surfaces). */
  safeAreaInsets: SafeAreaInsets
}

export function useMobileEnv(): MobileEnv {
  // isMobile delegates to useIsMobile() → 639px single source of truth (D-02).
  const isMobile = useIsMobile()

  // isTablet: 640–1023px inclusive. useMediaQuery seeds synchronously from
  // window.matchMedia(...).matches and self-manages listener cleanup.
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)')

  // isStandalone: seeded synchronously so both the iOS navigator.standalone path
  // and the standalone-on-launch case are correct on first render (M-6 guard).
  // Kept reactive via a one-directional watcher on the display-mode media query:
  // once true (either from the seed or from a mid-session install), it stays true.
  // { immediate: false } so the synchronous seed above is the SINGLE source for
  // the initial value; the watcher only handles subsequent runtime flips.
  const standaloneMatch = useMediaQuery('(display-mode: standalone)')
  const isStandalone = ref(detectStandalone())
  watch(standaloneMatch, (matched) => {
    if (matched) isStandalone.value = true
  }, { immediate: false })

  // safeAreaInsets: static CSS env() strings. The simplest correct default —
  // Phase 34 binds these directly into `padding`/`inset` styles; the browser
  // resolves the actual pixel value per device + orientation.
  const safeAreaInsets: SafeAreaInsets = {
    top: 'env(safe-area-inset-top)',
    right: 'env(safe-area-inset-right)',
    bottom: 'env(safe-area-inset-bottom)',
    left: 'env(safe-area-inset-left)',
  }

  return {
    isMobile,
    isTablet,
    isStandalone,
    installPromptEvent,
    safeAreaInsets,
  }
}
