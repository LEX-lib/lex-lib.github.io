import { ref, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * Reactive media-query helper. Returns a Ref<boolean> that tracks whether the
 * viewport width is at or below the given mobile breakpoint (default 639px,
 * matching Tailwind's `sm:` threshold of 640px — see Phase 17 D-10).
 *
 * Establishes the listener in onMounted and removes it in onUnmounted to avoid
 * leaks. The initial value is seeded synchronously from `matchMedia(...).matches`
 * so components see the correct value on first render.
 */
export function useIsMobile(breakpoint = 639): Ref<boolean> {
  const query = window.matchMedia(`(max-width: ${breakpoint}px)`)
  const isMobile = ref(query.matches)
  const handler = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches
  }
  onMounted(() => query.addEventListener('change', handler))
  onUnmounted(() => query.removeEventListener('change', handler))
  return isMobile
}
