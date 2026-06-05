import { ref, readonly, type Ref } from 'vue'

const STORAGE_KEY = 'lexarium:theme'
const DARK_CLASS = 'my-app-dark'

type Theme = 'light' | 'dark'

const theme = ref<Theme>(
  document.documentElement.classList.contains(DARK_CLASS) ? 'dark' : 'light'
)

function applyTheme(value: Theme): void {
  if (value === 'dark') {
    document.documentElement.classList.add(DARK_CLASS)
  } else {
    document.documentElement.classList.remove(DARK_CLASS)
  }
}

function setTheme(value: Theme): void {
  theme.value = value
  applyTheme(value)
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // localStorage unavailable; in-memory state still works
  }
}

function toggle(): void {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}

// One-time OS preference listener — only acts when user has no explicit choice
const mql = window.matchMedia('(prefers-color-scheme: dark)')
mql.addEventListener('change', (e) => {
  let hasExplicitChoice = false
  try {
    hasExplicitChoice = localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    hasExplicitChoice = false
  }
  if (!hasExplicitChoice) {
    const next: Theme = e.matches ? 'dark' : 'light'
    theme.value = next
    applyTheme(next)
    // Do NOT write to localStorage — keep OS-tracking mode active
  }
})

export function useTheme() {
  return {
    theme: readonly(theme) as Readonly<Ref<Theme>>,
    toggle,
    setTheme,
  }
}
