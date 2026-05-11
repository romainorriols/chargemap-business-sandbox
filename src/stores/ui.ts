// Sandbox UI flags. The empty-state toggle replaces every page's seed
// data with an empty list so we can demo / screenshot empty states
// without juggling routes or feature flags. Persisted to localStorage
// like the nav version, so the choice survives reloads.
const EMPTY_STATE_KEY = 'cm-sandbox-empty-state'
const MAX_WIDTH_KEY   = 'cm-sandbox-max-width'

export type SandboxMaxWidth = 2192 | 1600 | 800

export const useUiStore = defineStore('ui', () => {
  let initialEmpty = false
  let initialMax: SandboxMaxWidth = 1600
  if (import.meta.client) {
    const storedEmpty = localStorage.getItem(EMPTY_STATE_KEY)
    if (storedEmpty !== null) initialEmpty = storedEmpty === 'true'
    const storedMax = localStorage.getItem(MAX_WIDTH_KEY)
    if (storedMax === '2192' || storedMax === '1600' || storedMax === '800') {
      initialMax = Number(storedMax) as SandboxMaxWidth
    }
  }
  const showEmptyState = ref(initialEmpty)
  const maxWidth = ref<SandboxMaxWidth>(initialMax)

  if (import.meta.client) {
    watch(showEmptyState, v => localStorage.setItem(EMPTY_STATE_KEY, String(v)))
    watch(maxWidth,       v => localStorage.setItem(MAX_WIDTH_KEY,   String(v)))
  }

  return { showEmptyState, maxWidth }
})
