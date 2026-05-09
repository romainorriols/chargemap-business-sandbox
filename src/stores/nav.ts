// Sidebar/nav version: V2 (white, default) vs V1 (blue). Shared so pages can
// adapt their typography to the active nav (e.g. V1 page H1s use V1_PAGE_HEADING
// while V2 uses font-heading semibold at 28-32px).
const NAV_VERSION_KEY = 'cm-sandbox-nav-version'

export const useNavStore = defineStore('nav', () => {
  let initial = true
  if (import.meta.client) {
    const stored = localStorage.getItem(NAV_VERSION_KEY)
    if (stored !== null) initial = stored === 'true'
  }
  const isNavV2 = ref(initial)

  if (import.meta.client) {
    watch(isNavV2, v => localStorage.setItem(NAV_VERSION_KEY, String(v)))
  }

  return { isNavV2 }
})
