/**
 * PwaInstallBanner.vue — Behavior tests for Phase 37 Plan 03
 *
 * Tests cover:
 * - Test 1: Android branch renders when installPromptEvent !== null && !isStandalone && !isDismissed()
 * - Test 2: iOS branch renders when isIosSafari() && installPromptEvent === null && !isStandalone && !isDismissed()
 * - Test 3: When isStandalone === true, NEITHER branch renders (D-37-08 hard gate)
 * - Test 4: isDismissed() migrates legacy 'true' value lazily (D-37-07)
 * - Test 5: isDismissed() 30-day gate
 * - Test 6: handleAndroidInstall calls prompt() synchronously, clears singleton
 * - Test 7: Dismiss buttons write JSON dismissal record with correct platform
 *
 * NOTE: PwaInstallBanner uses <Teleport to="body"> so rendered content is NOT
 * inside the Vue wrapper's el. We query document.body for teleported DOM.
 * Each test mounts into a fresh div attached to document.body and unmounts after.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import type { BeforeInstallPromptEvent } from '@/composables/useMobileEnv'

// Module-level mock refs accessible to the vi.mock factory via closure.
const mockInstallPromptEvent = ref<BeforeInstallPromptEvent | null>(null)
const mockIsStandalone = ref(false)

// Spy container — mutable object avoids temporal dead zone in hoisted vi.mock factory.
const spies = {
  clearInstallPromptEvent: vi.fn(),
}

vi.mock('@/composables/useMobileEnv', () => ({
  useMobileEnv: () => ({
    installPromptEvent: mockInstallPromptEvent,
    isStandalone: mockIsStandalone,
  }),
  clearInstallPromptEvent: (...args: unknown[]) => spies.clearInstallPromptEvent(...args),
}))

// Import component AFTER mock setup (Vitest hoists vi.mock above imports automatically)
import PwaInstallBanner from '../PwaInstallBanner.vue'

const BANNER_DISMISSED_KEY = 'wallecx_pwa_banner_dismissed'

// --- Per-test wrapper tracking for cleanup ---
let wrapper: VueWrapper | null = null
let mountDiv: HTMLElement | null = null

function mountBanner(): VueWrapper {
  mountDiv = document.createElement('div')
  document.body.appendChild(mountDiv)
  wrapper = mount(PwaInstallBanner, { attachTo: mountDiv })
  return wrapper
}

function unmountBanner(): void {
  if (wrapper) {
    wrapper.unmount()
    wrapper = null
  }
  if (mountDiv && mountDiv.parentNode) {
    mountDiv.parentNode.removeChild(mountDiv)
    mountDiv = null
  }
}

// --- Helpers ---

function bodyText(): string {
  // Only read from our tracked mountDiv + teleported body content
  // to avoid interference from other tests' remnants.
  return document.body.textContent ?? ''
}

function findInBody(selector: string): HTMLElement | null {
  return document.body.querySelector(selector)
}

function mockIosSafariUA(): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    configurable: true,
    writable: true,
  })
}

function mockAndroidChromeUA(): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value:
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    configurable: true,
    writable: true,
  })
}

function restoreUA(): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    configurable: true,
    writable: true,
  })
}

function makeFakePromptEvent(
  outcome: 'accepted' | 'dismissed' = 'accepted',
): BeforeInstallPromptEvent {
  return {
    type: 'beforeinstallprompt',
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome, platform: 'android' }),
    platforms: ['web'],
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as BeforeInstallPromptEvent
}

describe('PwaInstallBanner', () => {
  beforeEach(() => {
    localStorage.removeItem(BANNER_DISMISSED_KEY)
    mockInstallPromptEvent.value = null
    mockIsStandalone.value = false
    spies.clearInstallPromptEvent.mockClear()
    restoreUA()
    // Stub matchMedia — all queries return false (not standalone, not any display-mode)
    vi.stubGlobal('matchMedia', (_query: string) => ({
      matches: false,
      media: _query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    // Clear iOS navigator.standalone
    const nav = window.navigator as Navigator & { standalone?: boolean }
    if ('standalone' in nav) {
      delete nav.standalone
    }
  })

  afterEach(() => {
    unmountBanner()
    vi.unstubAllGlobals()
    localStorage.removeItem(BANNER_DISMISSED_KEY)
  })

  // -----------------------------------------------------------------
  // Test 1: Android branch renders when installPromptEvent !== null
  // -----------------------------------------------------------------
  describe('Test 1: Android branch renders when installPromptEvent !== null', () => {
    it('renders Android branch when installPromptEvent non-null, not standalone, not dismissed', async () => {
      mockAndroidChromeUA()
      mockInstallPromptEvent.value = makeFakePromptEvent()
      mockIsStandalone.value = false

      mountBanner()
      await nextTick()

      expect(bodyText()).toContain('Install Wallecx for faster access and home-screen shortcuts.')
      // iOS branch NOT rendered simultaneously (v-else-if ensures mutual exclusion)
      expect(bodyText()).not.toContain('Add to Home Screen')
    })
  })

  // -----------------------------------------------------------------
  // Test 2: iOS branch renders when isIosSafari && installPromptEvent === null
  // -----------------------------------------------------------------
  describe('Test 2: iOS branch renders when isIosSafari && installPromptEvent === null', () => {
    it('renders iOS branch on iOS Safari with no install prompt event', async () => {
      mockIosSafariUA()
      mockInstallPromptEvent.value = null
      mockIsStandalone.value = false

      mountBanner()
      await nextTick()

      expect(bodyText()).toContain('Add to Home Screen')
      // Android branch NOT visible simultaneously
      expect(bodyText()).not.toContain('Install Wallecx for faster access')
    })

    it('iOS branch NOT rendered when installPromptEvent non-null (Android takes priority)', async () => {
      mockIosSafariUA()
      mockInstallPromptEvent.value = makeFakePromptEvent()
      mockIsStandalone.value = false

      mountBanner()
      await nextTick()

      // D-37-01: iOS shows only when installPromptEvent === null.
      // In onMounted, isIosVisible is not set because isIosSafari() IS true but
      // the component now sets isIosVisible only if isIosSafari — but the Android
      // v-else-if branch shows instead. The iOS branch (v-if isIosVisible) is false.
      expect(bodyText()).not.toContain('Add to Home Screen')
    })
  })

  // -----------------------------------------------------------------
  // Test 3: isStandalone === true suppresses BOTH branches (D-37-08 hard gate)
  // -----------------------------------------------------------------
  describe('Test 3: isStandalone === true suppresses both branches', () => {
    it('suppresses iOS branch when standalone', async () => {
      mockIosSafariUA()
      mockInstallPromptEvent.value = null
      mockIsStandalone.value = true

      mountBanner()
      await nextTick()

      expect(bodyText()).not.toContain('Add to Home Screen')
      expect(bodyText()).not.toContain('Install Wallecx for faster access')
    })

    it('suppresses Android branch when standalone (reactive template gate)', async () => {
      mockAndroidChromeUA()
      mockInstallPromptEvent.value = makeFakePromptEvent()
      mockIsStandalone.value = true

      mountBanner()
      await nextTick()

      // Template: v-else-if="installPromptEvent && !isStandalone && !_dismissed"
      // isStandalone.value === true → branch not rendered
      expect(bodyText()).not.toContain('Install Wallecx for faster access')
    })
  })

  // -----------------------------------------------------------------
  // Test 4: isDismissed() migrates legacy 'true' lazily (D-37-07)
  // -----------------------------------------------------------------
  describe('Test 4: isDismissed() migrates legacy "true" schema', () => {
    it('migrates legacy "true" to JSON schema and suppresses banner', async () => {
      localStorage.setItem(BANNER_DISMISSED_KEY, 'true')
      mockIosSafariUA()
      mockInstallPromptEvent.value = null
      mockIsStandalone.value = false

      mountBanner()
      await nextTick()

      // Banner suppressed (dismissed)
      expect(bodyText()).not.toContain('Add to Home Screen')

      // Stored value migrated to JSON
      const stored = localStorage.getItem(BANNER_DISMISSED_KEY)
      expect(stored).not.toBe('true')
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveProperty('dismissedAt')
      expect(parsed).toHaveProperty('platform')
      expect(['ios', 'android']).toContain(parsed.platform)
    })

    it('migrates legacy "true" for Android context and suppresses banner', async () => {
      localStorage.setItem(BANNER_DISMISSED_KEY, 'true')
      mockAndroidChromeUA()
      mockInstallPromptEvent.value = makeFakePromptEvent()
      mockIsStandalone.value = false

      mountBanner()
      await nextTick()

      // _dismissed is set in onMounted → template v-else-if condition includes !_dismissed
      expect(bodyText()).not.toContain('Install Wallecx for faster access')

      const stored = localStorage.getItem(BANNER_DISMISSED_KEY)
      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveProperty('dismissedAt')
      expect(parsed).toHaveProperty('platform')
    })
  })

  // -----------------------------------------------------------------
  // Test 5: isDismissed() 30-day re-show gate
  // -----------------------------------------------------------------
  describe('Test 5: isDismissed() 30-day re-show gate', () => {
    it('suppresses banner when dismissedAt is within 30 days', async () => {
      localStorage.setItem(
        BANNER_DISMISSED_KEY,
        JSON.stringify({
          dismissedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          platform: 'ios',
        }),
      )
      mockIosSafariUA()
      mockInstallPromptEvent.value = null
      mockIsStandalone.value = false

      mountBanner()
      await nextTick()

      expect(bodyText()).not.toContain('Add to Home Screen')
    })

    it('shows banner when dismissedAt is older than 30 days', async () => {
      localStorage.setItem(
        BANNER_DISMISSED_KEY,
        JSON.stringify({
          dismissedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(), // 31 days ago
          platform: 'ios',
        }),
      )
      mockIosSafariUA()
      mockInstallPromptEvent.value = null
      mockIsStandalone.value = false

      mountBanner()
      await nextTick()

      expect(bodyText()).toContain('Add to Home Screen')
    })
  })

  // -----------------------------------------------------------------
  // Test 6: handleAndroidInstall — prompt() sync, clears singleton
  // -----------------------------------------------------------------
  describe('Test 6: handleAndroidInstall — prompt() synchronous, clears singleton', () => {
    it('calls prompt() on Install click and clears singleton on accepted', async () => {
      const fakeEvent = makeFakePromptEvent('accepted')
      mockInstallPromptEvent.value = fakeEvent
      mockIsStandalone.value = false
      mockAndroidChromeUA()

      mountBanner()
      await nextTick()

      // Find Install button in body (text = "Install")
      const installBtn = Array.from(document.body.querySelectorAll('button')).find(
        (btn) => btn.textContent?.trim() === 'Install',
      )
      expect(installBtn).toBeDefined()
      installBtn!.click()

      // Wait for async userChoice resolution
      await nextTick()
      await nextTick()

      expect(fakeEvent.prompt).toHaveBeenCalledOnce()
      expect(spies.clearInstallPromptEvent).toHaveBeenCalled()
    })

    it('writes dismissal record on dismissed outcome and clears singleton', async () => {
      const fakeEvent = makeFakePromptEvent('dismissed')
      mockInstallPromptEvent.value = fakeEvent
      mockIsStandalone.value = false
      mockAndroidChromeUA()

      mountBanner()
      await nextTick()

      const installBtn = Array.from(document.body.querySelectorAll('button')).find(
        (btn) => btn.textContent?.trim() === 'Install',
      )
      installBtn!.click()
      await nextTick()
      await nextTick()

      expect(fakeEvent.prompt).toHaveBeenCalledOnce()

      const stored = localStorage.getItem(BANNER_DISMISSED_KEY)
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed.platform).toBe('android')
      expect(parsed).toHaveProperty('dismissedAt')
      expect(spies.clearInstallPromptEvent).toHaveBeenCalled()
    })

    it('does NOT write dismissal record on accepted outcome', async () => {
      const fakeEvent = makeFakePromptEvent('accepted')
      mockInstallPromptEvent.value = fakeEvent
      mockIsStandalone.value = false
      mockAndroidChromeUA()

      mountBanner()
      await nextTick()

      const installBtn = Array.from(document.body.querySelectorAll('button')).find(
        (btn) => btn.textContent?.trim() === 'Install',
      )
      installBtn!.click()
      await nextTick()
      await nextTick()

      // No dismissal record written on accepted
      const stored = localStorage.getItem(BANNER_DISMISSED_KEY)
      expect(stored).toBeNull()
    })
  })

  // -----------------------------------------------------------------
  // Test 7: Dismiss buttons write JSON dismissal record with correct platform
  // -----------------------------------------------------------------
  describe('Test 7: Dismiss buttons write JSON dismissal record with correct platform', () => {
    it('iOS dismiss writes platform: ios in JSON record', async () => {
      mockIosSafariUA()
      mockInstallPromptEvent.value = null
      mockIsStandalone.value = false

      mountBanner()
      await nextTick()

      const dismissBtn = findInBody('[aria-label="Dismiss install banner"]')
      expect(dismissBtn).not.toBeNull()
      dismissBtn!.click()
      await nextTick()

      const stored = localStorage.getItem(BANNER_DISMISSED_KEY)
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed.platform).toBe('ios')
      expect(parsed).toHaveProperty('dismissedAt')
    })

    it('Android dismiss writes platform: android and calls clearInstallPromptEvent', async () => {
      mockAndroidChromeUA()
      const fakeEvent = makeFakePromptEvent()
      mockInstallPromptEvent.value = fakeEvent
      mockIsStandalone.value = false

      mountBanner()
      await nextTick()

      const dismissBtn = findInBody('[aria-label="Dismiss install banner"]')
      expect(dismissBtn).not.toBeNull()
      dismissBtn!.click()
      await nextTick()

      const stored = localStorage.getItem(BANNER_DISMISSED_KEY)
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed.platform).toBe('android')
      expect(parsed).toHaveProperty('dismissedAt')
      expect(spies.clearInstallPromptEvent).toHaveBeenCalled()
    })
  })
})
