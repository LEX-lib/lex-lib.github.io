/**
 * PwaInstallBanner.vue — Behavior tests for Phase 37 Plan 03
 *
 * Tests cover:
 * - Test 1: Android branch renders when installPromptEvent !== null && !isStandalone && !isDismissed()
 * - Test 2: iOS branch renders when isIosSafari() && installPromptEvent === null && !isStandalone && !isDismissed()
 * - Test 3: isStandalone === true suppresses BOTH branches (D-37-08 hard gate)
 * - Test 4: isDismissed() migrates legacy 'true' value lazily (D-37-07)
 * - Test 5: isDismissed() returns true within 30 days, false after 30 days
 * - Test 6: handleAndroidInstall calls prompt() synchronously before await, calls clearInstallPromptEvent()
 * - Test 7: dismiss buttons write JSON dismissal record with correct platform
 *
 * Strategy: Mount the component via @vue/test-utils and interact with the
 * mocked environment to verify each behavior. useMobileEnv module singleton
 * is mocked so tests control installPromptEvent and isStandalone.
 */
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import type { BeforeInstallPromptEvent } from '@/composables/useMobileEnv'

// --- Module mocks ---
// Mock useMobileEnv so tests control installPromptEvent and isStandalone.
const mockInstallPromptEvent = ref<BeforeInstallPromptEvent | null>(null)
const mockIsStandalone = ref(false)
const mockClearInstallPromptEvent = vi.fn()

vi.mock('@/composables/useMobileEnv', () => ({
  useMobileEnv: () => ({
    installPromptEvent: mockInstallPromptEvent,
    isStandalone: mockIsStandalone,
  }),
  clearInstallPromptEvent: mockClearInstallPromptEvent,
}))

// Import component AFTER mock setup.
// We use a dynamic import inside beforeEach to get a fresh module for each test.
// However, Vue component modules may be cached. Use the static import but reset refs.
import PwaInstallBanner from '../PwaInstallBanner.vue'

const BANNER_DISMISSED_KEY = 'wallecx_pwa_banner_dismissed'

// --- Browser API mocks ---
function mockIosSafariUA(): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    configurable: true,
    writable: true,
  })
}

function mockAndroidChromeUA(): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    configurable: true,
    writable: true,
  })
}

function restoreUA(): void {
  // Restore to a non-iOS UA
  Object.defineProperty(window.navigator, 'userAgent', {
    value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    configurable: true,
    writable: true,
  })
}

function makeFakePromptEvent(outcome: 'accepted' | 'dismissed' = 'accepted'): BeforeInstallPromptEvent {
  const evt = {
    type: 'beforeinstallprompt',
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome, platform: 'android' }),
    platforms: ['web'],
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as BeforeInstallPromptEvent
  return evt
}

describe('PwaInstallBanner', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.removeItem(BANNER_DISMISSED_KEY)
    // Reset module-singleton mocks
    mockInstallPromptEvent.value = null
    mockIsStandalone.value = false
    mockClearInstallPromptEvent.mockClear()
    // Default to non-iOS, non-standalone
    restoreUA()
    // Reset matchMedia mock for standalone detection
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
    delete (window.navigator as Navigator & { standalone?: boolean }).standalone
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.removeItem(BANNER_DISMISSED_KEY)
  })

  // -----------------------------------------------------------------
  // Test 1: Android branch renders when conditions met
  // -----------------------------------------------------------------
  describe('Test 1: Android branch renders when installPromptEvent !== null', () => {
    it('renders the Android branch when installPromptEvent is non-null, not standalone, not dismissed', async () => {
      mockAndroidChromeUA()
      mockInstallPromptEvent.value = makeFakePromptEvent()
      mockIsStandalone.value = false

      const wrapper = mount(PwaInstallBanner)
      await nextTick()

      // Android branch should be visible
      expect(wrapper.text()).toContain('Install Wallecx for faster access and home-screen shortcuts.')
      // iOS branch should NOT be visible
      expect(wrapper.text()).not.toContain('Tap')
      expect(wrapper.text()).not.toContain('Add to Home Screen')
    })
  })

  // -----------------------------------------------------------------
  // Test 2: iOS branch renders when isIosSafari && installPromptEvent === null
  // -----------------------------------------------------------------
  describe('Test 2: iOS branch renders when isIosSafari && installPromptEvent === null', () => {
    it('renders iOS branch when on iOS Safari with no install prompt event', async () => {
      mockIosSafariUA()
      mockInstallPromptEvent.value = null
      mockIsStandalone.value = false

      const wrapper = mount(PwaInstallBanner)
      await nextTick()

      // iOS branch visible
      expect(wrapper.text()).toContain('Add to Home Screen')
      // Android branch NOT visible simultaneously
      expect(wrapper.text()).not.toContain('Install Wallecx for faster access')
    })

    it('iOS branch does NOT render when installPromptEvent is non-null (Android takes priority)', async () => {
      mockIosSafariUA()
      mockInstallPromptEvent.value = makeFakePromptEvent()
      mockIsStandalone.value = false

      const wrapper = mount(PwaInstallBanner)
      await nextTick()

      // Neither iOS-specific text should appear as a standalone branch
      // (The Android branch renders v-else-if, so iOS v-if should be false when Android event present)
      // Actually: D-37-01 says iOS shows when installPromptEvent === null
      // Since installPromptEvent !== null, iOS branch should not show
      expect(wrapper.text()).not.toContain('Tap')
    })
  })

  // -----------------------------------------------------------------
  // Test 3: isStandalone suppresses BOTH branches (D-37-08 hard gate)
  // -----------------------------------------------------------------
  describe('Test 3: isStandalone === true suppresses both branches', () => {
    it('suppresses iOS branch when standalone', async () => {
      mockIosSafariUA()
      mockInstallPromptEvent.value = null
      mockIsStandalone.value = true

      const wrapper = mount(PwaInstallBanner)
      await nextTick()

      expect(wrapper.text()).not.toContain('Add to Home Screen')
      expect(wrapper.text()).not.toContain('Install Wallecx for faster access')
    })

    it('suppresses Android branch when standalone', async () => {
      mockAndroidChromeUA()
      mockInstallPromptEvent.value = makeFakePromptEvent()
      mockIsStandalone.value = true

      const wrapper = mount(PwaInstallBanner)
      await nextTick()

      expect(wrapper.text()).not.toContain('Install Wallecx for faster access')
    })
  })

  // -----------------------------------------------------------------
  // Test 4: isDismissed() migrates legacy 'true' lazily (D-37-07)
  // -----------------------------------------------------------------
  describe('Test 4: isDismissed() migrates legacy "true" schema', () => {
    it('migrates legacy "true" to JSON schema and returns dismissed (suppresses banner)', async () => {
      // Simulate legacy Phase 14 dismissal
      localStorage.setItem(BANNER_DISMISSED_KEY, 'true')

      mockIosSafariUA()
      mockInstallPromptEvent.value = null
      mockIsStandalone.value = false

      const wrapper = mount(PwaInstallBanner)
      await nextTick()

      // Banner should be suppressed (dismissed)
      expect(wrapper.text()).not.toContain('Add to Home Screen')

      // The stored value should now be JSON (migration happened)
      const stored = localStorage.getItem(BANNER_DISMISSED_KEY)
      expect(stored).not.toBe('true')
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveProperty('dismissedAt')
      expect(parsed).toHaveProperty('platform')
      expect(['ios', 'android']).toContain(parsed.platform)
    })

    it('migrates legacy "true" for Android context too', async () => {
      localStorage.setItem(BANNER_DISMISSED_KEY, 'true')
      mockAndroidChromeUA()
      mockInstallPromptEvent.value = makeFakePromptEvent()
      mockIsStandalone.value = false

      const wrapper = mount(PwaInstallBanner)
      await nextTick()

      // Banner suppressed due to migration
      expect(wrapper.text()).not.toContain('Install Wallecx for faster access')

      // JSON migration happened
      const stored = localStorage.getItem(BANNER_DISMISSED_KEY)
      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveProperty('dismissedAt')
      expect(parsed).toHaveProperty('platform')
    })
  })

  // -----------------------------------------------------------------
  // Test 5: isDismissed() 30-day gate
  // -----------------------------------------------------------------
  describe('Test 5: isDismissed() 30-day re-show gate', () => {
    it('returns dismissed (suppresses banner) when dismissedAt is within 30 days', async () => {
      const record = {
        dismissedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        platform: 'ios' as const,
      }
      localStorage.setItem(BANNER_DISMISSED_KEY, JSON.stringify(record))

      mockIosSafariUA()
      mockInstallPromptEvent.value = null
      mockIsStandalone.value = false

      const wrapper = mount(PwaInstallBanner)
      await nextTick()

      expect(wrapper.text()).not.toContain('Add to Home Screen')
    })

    it('shows banner when dismissedAt is older than 30 days', async () => {
      const record = {
        dismissedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(), // 31 days ago
        platform: 'ios' as const,
      }
      localStorage.setItem(BANNER_DISMISSED_KEY, JSON.stringify(record))

      mockIosSafariUA()
      mockInstallPromptEvent.value = null
      mockIsStandalone.value = false

      const wrapper = mount(PwaInstallBanner)
      await nextTick()

      expect(wrapper.text()).toContain('Add to Home Screen')
    })
  })

  // -----------------------------------------------------------------
  // Test 6: handleAndroidInstall — prompt() sync, clearInstallPromptEvent()
  // -----------------------------------------------------------------
  describe('Test 6: handleAndroidInstall — prompt() synchronous, clears singleton', () => {
    it('calls prompt() synchronously on Install button click and clears singleton on accepted', async () => {
      const fakeEvent = makeFakePromptEvent('accepted')
      mockInstallPromptEvent.value = fakeEvent
      mockIsStandalone.value = false
      mockAndroidChromeUA()

      const wrapper = mount(PwaInstallBanner)
      await nextTick()

      // Find the "Install" button (not dismiss button)
      const installBtn = wrapper.findAll('button').find(btn => btn.text() === 'Install')
      expect(installBtn).toBeDefined()

      await installBtn!.trigger('click')
      // Wait for async operations
      await nextTick()

      expect(fakeEvent.prompt).toHaveBeenCalledOnce()
      expect(mockClearInstallPromptEvent).toHaveBeenCalled()
    })

    it('writes dismissal record on dismissed outcome and clears singleton', async () => {
      const fakeEvent = makeFakePromptEvent('dismissed')
      mockInstallPromptEvent.value = fakeEvent
      mockIsStandalone.value = false
      mockAndroidChromeUA()

      const wrapper = mount(PwaInstallBanner)
      await nextTick()

      const installBtn = wrapper.findAll('button').find(btn => btn.text() === 'Install')
      await installBtn!.trigger('click')
      await nextTick()

      expect(fakeEvent.prompt).toHaveBeenCalledOnce()
      // Dismissal record should be written
      const stored = localStorage.getItem(BANNER_DISMISSED_KEY)
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed.platform).toBe('android')
      expect(parsed).toHaveProperty('dismissedAt')
      // Singleton cleared
      expect(mockClearInstallPromptEvent).toHaveBeenCalled()
    })

    it('does NOT write dismissal record on accepted outcome', async () => {
      const fakeEvent = makeFakePromptEvent('accepted')
      mockInstallPromptEvent.value = fakeEvent
      mockIsStandalone.value = false
      mockAndroidChromeUA()

      const wrapper = mount(PwaInstallBanner)
      await nextTick()

      const installBtn = wrapper.findAll('button').find(btn => btn.text() === 'Install')
      await installBtn!.trigger('click')
      await nextTick()

      // No dismissal record written on accepted
      const stored = localStorage.getItem(BANNER_DISMISSED_KEY)
      expect(stored).toBeNull()
    })
  })

  // -----------------------------------------------------------------
  // Test 7: Dismiss button writes JSON dismissal record with correct platform
  // -----------------------------------------------------------------
  describe('Test 7: Dismiss buttons write JSON dismissal record with correct platform', () => {
    it('iOS dismiss writes platform: ios in JSON record', async () => {
      mockIosSafariUA()
      mockInstallPromptEvent.value = null
      mockIsStandalone.value = false

      const wrapper = mount(PwaInstallBanner)
      await nextTick()

      // Find dismiss button (aria-label="Dismiss install banner")
      const dismissBtn = wrapper.find('[aria-label="Dismiss install banner"]')
      expect(dismissBtn.exists()).toBe(true)

      await dismissBtn.trigger('click')
      await nextTick()

      const stored = localStorage.getItem(BANNER_DISMISSED_KEY)
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed.platform).toBe('ios')
      expect(parsed).toHaveProperty('dismissedAt')
    })

    it('Android dismiss writes platform: android in JSON record and calls clearInstallPromptEvent', async () => {
      mockAndroidChromeUA()
      const fakeEvent = makeFakePromptEvent()
      mockInstallPromptEvent.value = fakeEvent
      mockIsStandalone.value = false

      const wrapper = mount(PwaInstallBanner)
      await nextTick()

      const dismissBtn = wrapper.find('[aria-label="Dismiss install banner"]')
      expect(dismissBtn.exists()).toBe(true)

      await dismissBtn.trigger('click')
      await nextTick()

      const stored = localStorage.getItem(BANNER_DISMISSED_KEY)
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed.platform).toBe('android')
      expect(parsed).toHaveProperty('dismissedAt')
      // Android dismiss clears the singleton (D-37-04)
      expect(mockClearInstallPromptEvent).toHaveBeenCalled()
    })
  })
})
