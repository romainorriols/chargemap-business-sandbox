// Sandbox UI flags. The empty-state toggle replaces every page's seed
// data with an empty list so we can demo / screenshot empty states
// without juggling routes or feature flags. Persisted to localStorage
// like the nav version, so the choice survives reloads.
const EMPTY_STATE_KEY = 'cm-sandbox-empty-state'

export const useUiStore = defineStore('ui', () => {
  let initial = false
  if (import.meta.client) {
    const stored = localStorage.getItem(EMPTY_STATE_KEY)
    if (stored !== null) initial = stored === 'true'
  }
  const showEmptyState = ref(initial)

  if (import.meta.client) {
    watch(showEmptyState, v => localStorage.setItem(EMPTY_STATE_KEY, String(v)))
  }

  return { showEmptyState }
})
