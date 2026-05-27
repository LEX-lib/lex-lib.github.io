import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  useMobileEnv,
  setInstallPromptEvent,
  clearInstallPromptEvent,
  type BeforeInstallPromptEvent,
} from '../useMobileEnv'

/**
 * jsdom does not implement window.matchMedia. We install a keyed mock that
 * answers each query string independently so the mobile (≤639), tablet
 * (640–1023), and display-mode:standalone queries can be toggled per test.
 *
 * The mock's `matches` is computed from a configurable viewport `width` and a
 * `standalone` flag. addEventListener/removeEventListener are spies so the
 * composable's listener wiring does not throw — the synchronous-seeding test
 * deliberately reads values WITHOUT dispatching any 'change' event.
 */
interface MatchMediaState {
  width: number
  standalone: boolean
}

const state: MatchMediaState = { width: 1024, standalone: false }

function evaluateQuery(query: string): boolean {
  if (query.includes('display-mode: standalone')) {
    return state.standalone
  }
  // Parse min-width / max-width bounds out of the query string.
  const minMatch = query.match(/min-width:\s*(\d+)px/)
  const maxMatch = query.match(/max-width:\s*(\d+)px/)
  const min = minMatch ? Number(minMatch[1]) : -Infinity
  const max = maxMatch ? Number(maxMatch[1]) : Infinity
  return state.width >= min && state.width <= max
}

function installMatchMediaMock(): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    media: query,
    get matches() {
      return evaluateQuery(query)
    },
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('useMobileEnv', () => {
  beforeEach(() => {
    state.width = 1024
    state.standalone = false
    // Ensure iOS navigator.standalone path is inert unless a test opts in.
    delete (window.navigator as Navigator & { standalone?: boolean }).standalone
    installMatchMediaMock()
    clearInstallPromptEvent()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    clearInstallPromptEvent()
  })

  describe('synchronous seeding (M-6 guard)', () => {
    it('seeds reactive values synchronously at call time, before any change event', () => {
      // Mobile viewport + standalone, evaluated the instant useMobileEnv() returns.
      state.width = 400
      state.standalone = true
      const { isMobile, isTablet, isStandalone } = useMobileEnv()
      // No 'change' event has been dispatched — these MUST already be correct.
      expect(isMobile.value).toBe(window.matchMedia('(max-width: 639px)').matches)
      expect(isMobile.value).toBe(true)
      expect(isTablet.value).toBe(
        window.matchMedia('(min-width: 640px) and (max-width: 1023px)').matches,
      )
      expect(isTablet.value).toBe(false)
      expect(isStandalone.value).toBe(window.matchMedia('(display-mode: standalone)').matches)
      expect(isStandalone.value).toBe(true)
    })
  })

  describe('breakpoint tiers (mutually exclusive)', () => {
    it('width 639 reads mobile, not tablet', () => {
      state.width = 639
      const { isMobile, isTablet } = useMobileEnv()
      expect(isMobile.value).toBe(true)
      expect(isTablet.value).toBe(false)
    })

    it('width 640 reads tablet, not mobile (boundary)', () => {
      state.width = 640
      const { isMobile, isTablet } = useMobileEnv()
      expect(isMobile.value).toBe(false)
      expect(isTablet.value).toBe(true)
    })

    it('width 800 (iPad) reads tablet, not mobile (D-04 first-class tablet)', () => {
      state.width = 800
      const { isMobile, isTablet } = useMobileEnv()
      expect(isMobile.value).toBe(false)
      expect(isTablet.value).toBe(true)
    })

    it('width 1024 reads desktop — neither mobile nor tablet', () => {
      state.width = 1024
      const { isMobile, isTablet } = useMobileEnv()
      expect(isMobile.value).toBe(false)
      expect(isTablet.value).toBe(false)
    })
  })

  describe('standalone detection', () => {
    it('reflects the mocked display-mode:standalone match', () => {
      state.standalone = true
      const { isStandalone } = useMobileEnv()
      expect(isStandalone.value).toBe(true)
    })

    it('is false when not in standalone display mode', () => {
      state.standalone = false
      const { isStandalone } = useMobileEnv()
      expect(isStandalone.value).toBe(false)
    })
  })

  describe('install-prompt capture (module singleton)', () => {
    function makeFakeEvent(): BeforeInstallPromptEvent {
      const e = new Event('beforeinstallprompt') as BeforeInstallPromptEvent
      return e
    }

    it('captures the event via setInstallPromptEvent then clears on appinstalled', () => {
      const { installPromptEvent } = useMobileEnv()
      expect(installPromptEvent.value).toBeNull()

      const fake = makeFakeEvent()
      setInstallPromptEvent(fake)
      expect(installPromptEvent.value).toBe(fake)

      // appinstalled path clears the singleton back to null.
      clearInstallPromptEvent()
      expect(installPromptEvent.value).toBeNull()
    })

    it('shares the same singleton ref across separate useMobileEnv() calls', () => {
      const first = useMobileEnv()
      const fake = makeFakeEvent()
      setInstallPromptEvent(fake)
      // A later consumer (e.g. Phase 37 Install button) sees App.vue's write.
      const second = useMobileEnv()
      expect(second.installPromptEvent.value).toBe(fake)
      expect(first.installPromptEvent.value).toBe(second.installPromptEvent.value)
    })
  })

  describe('safeAreaInsets', () => {
    it('exposes CSS env() strings for all four sides', () => {
      const { safeAreaInsets } = useMobileEnv()
      expect(safeAreaInsets.top).toBe('env(safe-area-inset-top)')
      expect(safeAreaInsets.right).toBe('env(safe-area-inset-right)')
      expect(safeAreaInsets.bottom).toBe('env(safe-area-inset-bottom)')
      expect(safeAreaInsets.left).toBe('env(safe-area-inset-left)')
    })
  })
})
