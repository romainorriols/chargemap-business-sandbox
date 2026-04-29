import { reactive, ref, watch } from 'vue'

export interface BusinessUnit {
  id: string
  name: string
  badges: number
  vehicules: number
  conducteurs: number
  active: boolean
}

// Shared list — sidebar BU selection and the BusinessUnits page bind to the same array.
export const bus = reactive<BusinessUnit[]>([
  { id: 'bu-1', name: 'Brakson',         badges: 57, vehicules: 48, conducteurs: 31, active: true },
  { id: 'bu-2', name: 'Saabre',          badges: 36, vehicules: 29, conducteurs: 22, active: true },
  { id: 'bu-3', name: 'Chargemap',       badges: 49, vehicules: 41, conducteurs: 35, active: true },
  { id: 'bu-4', name: 'Mister EV',       badges: 38, vehicules: 44, conducteurs: 28, active: true },
  { id: 'bu-5', name: 'Cleanrider',      badges: 45, vehicules: 36, conducteurs: 30, active: true },
  { id: 'bu-6', name: 'Responsible Ads', badges: 53, vehicules: 40, conducteurs: 27, active: true },
  { id: 'bu-7', name: 'Marketing',       badges: 40, vehicules: 34, conducteurs: 25, active: true },
])

// Currently scoped BU. null = at the orga level. Persisted so the sidebar context
// survives page reloads (otherwise activeId='bu-home' lands without a BU and the nav
// falls back to orga, leaving no entry highlighted).
const SELECTED_BU_KEY = 'cm-sandbox-selected-bu'
const storedBu = localStorage.getItem(SELECTED_BU_KEY)
const initialBu = storedBu && bus.some(b => b.id === storedBu) ? storedBu : null
export const selectedBuId = ref<string | null>(initialBu)
watch(selectedBuId, v => {
  if (v) localStorage.setItem(SELECTED_BU_KEY, v)
  else localStorage.removeItem(SELECTED_BU_KEY)
})
