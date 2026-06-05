import { ref, onMounted, onBeforeUnmount } from 'vue'

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function readPalette(): string[] {
  return [1, 2, 3, 4, 5, 6, 7, 8].map(i => readVar(`--color-chart-${i}`))
}

/**
 * Reactive CSS-variable theme tracker for Chart.js canvas.
 *
 * Chart.js renders to <canvas>, which cannot read CSS variables — Chart.js needs
 * literal color strings at draw time. This composable bridges the gap:
 *
 * 1. Reads --color-chart-1..8 + axis/grid/surface tokens via getComputedStyle()
 *    at composable construction time (synchronous, no flicker on first render).
 * 2. Attaches a MutationObserver to the <html> element (NOT <body> — useTheme.ts
 *    places .my-app-dark on document.documentElement). Class mutations trigger
 *    a re-read of all variables; the refs update; PrimeVue Chart's deep-watch
 *    on `options` triggers reinit() with the new colors.
 * 3. Tears down the observer in onBeforeUnmount.
 *
 * Returns 7 reactive refs. Consumers (e.g., ExpensesReportsView.vue) wire them
 * into a `chartOptions` computed; the dependency makes the chart re-render
 * automatically when the theme toggles.
 */
export function useChartTheme() {
  // Synchronous initial read — pattern from useTheme.ts:8-10. Document and CSS
  // are parsed by the time any child component sets up.
  const paletteColors = ref<string[]>(readPalette())
  const axisColor     = ref<string>(readVar('--color-typo-body'))
  const mutedColor    = ref<string>(readVar('--color-typo-muted'))
  const headingColor  = ref<string>(readVar('--color-typo-heading'))
  const gridColor     = ref<string>(readVar('--color-surface-divider'))
  const surfaceColor  = ref<string>(readVar('--color-surface-card'))
  const dividerColor  = ref<string>(readVar('--color-surface-divider'))

  let observer: MutationObserver | null = null

  function refreshFromDom() {
    paletteColors.value = readPalette()
    axisColor.value     = readVar('--color-typo-body')
    mutedColor.value    = readVar('--color-typo-muted')
    headingColor.value  = readVar('--color-typo-heading')
    gridColor.value     = readVar('--color-surface-divider')
    surfaceColor.value  = readVar('--color-surface-card')
    dividerColor.value  = readVar('--color-surface-divider')
  }

  onMounted(() => {
    // Re-read once on mount in case the dark class was applied AFTER the
    // composable's synchronous initial read but BEFORE first paint.
    refreshFromDom()

    observer = new MutationObserver(refreshFromDom)

    // CRITICAL: observe document.documentElement (<html>). useTheme.ts (lines
    // 12-18) toggles `.my-app-dark` on the <html> element, NOT document.body.
    // The UI-SPEC's example code observes <body> — that example is WRONG for
    // this project (26-RESEARCH.md §Where the dark class actually lives).
    //
    // Defensively also observe <body> so a future relocation of the class
    // doesn't break dark-mode chart theming.
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return {
    paletteColors,
    axisColor,
    mutedColor,
    headingColor,
    gridColor,
    surfaceColor,
    dividerColor,
  }
}
