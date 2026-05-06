export interface BusinessUnit {
  id: string
  name: string
  badges: number
  vehicules: number
  conducteurs: number
  active: boolean
}

const SELECTED_BU_KEY = 'cm-sandbox-selected-bu'

// Shared BU list — sidebar BU selection, BusinessUnits page, and BU-scoped
// pages all read the same array. selectedBuId is persisted to localStorage so
// the sidebar context survives reloads.
export const useBusStore = defineStore('bus', () => {
  const bus = ref<BusinessUnit[]>([
    { id: 'bu-1', name: 'Brakson',         badges: 57, vehicules: 48, conducteurs: 31, active: true },
    { id: 'bu-2', name: 'Saabre',          badges: 36, vehicules: 29, conducteurs: 22, active: true },
    { id: 'bu-3', name: 'Chargemap',       badges: 49, vehicules: 41, conducteurs: 35, active: true },
    { id: 'bu-4', name: 'Mister EV',       badges: 38, vehicules: 44, conducteurs: 28, active: true },
    { id: 'bu-5', name: 'Cleanrider',      badges: 45, vehicules: 36, conducteurs: 30, active: true },
    { id: 'bu-6', name: 'Responsible Ads', badges: 53, vehicules: 40, conducteurs: 27, active: true },
    { id: 'bu-7', name: 'Marketing',       badges: 40, vehicules: 34, conducteurs: 25, active: true },
  ])

  let initial: string | null = null
  if (import.meta.client) {
    const stored = localStorage.getItem(SELECTED_BU_KEY)
    if (stored && bus.value.some(b => b.id === stored)) initial = stored
  }
  const selectedBuId = ref<string | null>(initial)

  if (import.meta.client) {
    watch(selectedBuId, v => {
      if (v) localStorage.setItem(SELECTED_BU_KEY, v)
      else localStorage.removeItem(SELECTED_BU_KEY)
    })
  }

  return { bus, selectedBuId }
})
