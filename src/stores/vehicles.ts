// Fleet vehicles of the current BU + their connection state (Smartcar link).
// Shared by the vehicles listing, the vehicle detail page and the sandbox
// status switcher. Persisted to localStorage so a demo survives reloads.
// Bump the version when SEED changes so browsers drop the outdated copy.
const VEHICLES_KEY = 'cm-sandbox-vehicles-v3'

// Connection lifecycle, as exposed by the API (`connection_status`).
export type ConnectionStatus =
  | 'NOT_CONNECTED'
  | 'REQUESTED'
  | 'IN_PROGRESS'
  | 'CONNECTED'
  | 'ACTION_REQUIRED'
  | 'FAILED'
  | 'DISCONNECTED'

export type Compatibility = 'COMPATIBLE' | 'NOT_COMPATIBLE' | 'UNKNOWN'

// Sandbox switcher value: a connection status, or a non-compatible case
export type ConnectionScenario = ConnectionStatus | Exclude<Compatibility, 'COMPATIBLE'>

export interface Vehicle {
  id: string
  brand: string | null
  model: string | null
  version: string | null
  plate: string
  country: string
  vin: string | null
  year: string | null
  notes?: string
  driver: string | null
  driverEmail: string | null
  badge: string | null
  mileage: number | null
  compatibility: Compatibility
  connectionStatus: ConnectionStatus
  connectedBy: string | null
  connectedAt: string | null
}

// Brands the sandbox treats as compatible with the connection (fake rule).
export const COMPATIBLE_BRANDS = ['Renault', 'Tesla', 'Volvo', 'Kia', 'Peugeot', 'Hyundai', 'Audi', 'BMW', 'Citroën']

const SEED: Vehicle[] = [
  { id: 'v-1', brand: 'Volvo', model: 'XC40 Recharge', version: 'Twin Motor AWD', plate: 'GL-777-GL', country: 'FR', vin: null, year: null, driver: 'Claire Dubois', driverEmail: 'claire.dubois@email.com', badge: 'Badge de démo', mileage: 51453, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'Claire Dubois', connectedAt: '24 oct. 2026' },
  { id: 'v-2', brand: 'Renault', model: '4 E-Tech', version: 'Comfort Range', plate: 'FV-864-HF', country: 'FR', vin: null, year: null, driver: null, driverEmail: null, badge: null, mileage: 40000, compatibility: 'COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-3', brand: 'Tesla', model: 'Model 3', version: 'Performance', plate: 'AB-123-CD', country: 'FR', vin: null, year: null, driver: 'Julien Martin', driverEmail: 'julien.martin@email.com', badge: 'Badge 0042', mileage: 12870, compatibility: 'COMPATIBLE', connectionStatus: 'REQUESTED', connectedBy: null, connectedAt: null },
  { id: 'v-4', brand: 'Renault', model: 'Megane E-Tech', version: 'EV60 220ch Supercharge', plate: 'PR-214-ZK', country: 'FR', vin: null, year: null, driver: 'Sofia Benali', driverEmail: 'sofia.benali@email.com', badge: 'Badge 0031', mileage: 8420, compatibility: 'COMPATIBLE', connectionStatus: 'IN_PROGRESS', connectedBy: 'Sofia Benali', connectedAt: '24 oct. 2026' },
  { id: 'v-5', brand: 'Kia', model: 'EV6', version: 'GT-Line', plate: 'KL-552-PT', country: 'FR', vin: null, year: null, driver: 'Marc Leroy', driverEmail: 'marc.leroy@email.com', badge: 'Badge 0017', mileage: 33120, compatibility: 'COMPATIBLE', connectionStatus: 'ACTION_REQUIRED', connectedBy: 'Marc Leroy', connectedAt: '02 sept. 2026' },
  { id: 'v-6', brand: 'Peugeot', model: 'e-208', version: 'GT 156ch', plate: 'TP-334-QR', country: 'FR', vin: null, year: null, driver: 'Thomas Petit', driverEmail: 'thomas.petit@email.com', badge: 'Badge 0058', mileage: 21900, compatibility: 'COMPATIBLE', connectionStatus: 'FAILED', connectedBy: null, connectedAt: null },
  { id: 'v-7', brand: 'Hyundai', model: 'Kona Electric', version: '65 kWh', plate: 'LM-901-ST', country: 'FR', vin: null, year: null, driver: 'Laura Moreau', driverEmail: 'laura.moreau@email.com', badge: 'Badge 0063', mileage: 45210, compatibility: 'COMPATIBLE', connectionStatus: 'DISCONNECTED', connectedBy: 'Laura Moreau', connectedAt: '14 juin 2026' },
  { id: 'v-8', brand: null, model: null, version: null, plate: 'GH-086-FX', country: 'FR', vin: null, year: null, driver: null, driverEmail: null, badge: null, mileage: null, compatibility: 'UNKNOWN', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-9', brand: 'BYD', model: 'Seal', version: 'Design AWD', plate: 'HE-730-FD', country: 'FR', vin: null, year: null, driver: 'Inès Garnier', driverEmail: 'ines.garnier@email.com', badge: null, mileage: 67680, compatibility: 'NOT_COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
]

export const useVehiclesStore = defineStore('vehicles', () => {
  let initial: Vehicle[] = SEED.map(v => ({ ...v }))
  if (import.meta.client) {
    const stored = localStorage.getItem(VEHICLES_KEY)
    if (stored) {
      try { initial = JSON.parse(stored) as Vehicle[] } catch { /* keep seed */ }
    }
  }
  const vehicles = ref<Vehicle[]>(initial)

  if (import.meta.client) {
    watch(vehicles, v => localStorage.setItem(VEHICLES_KEY, JSON.stringify(v)), { deep: true })
  }

  const byId = (id: string) => vehicles.value.find(v => v.id === id) ?? null

  const today = () => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  // Sandbox switcher: when jumping to a "linked" status, fill who/when if missing
  const setStatus = (id: string, status: ConnectionStatus) => {
    const v = byId(id)
    if (!v) return
    v.connectionStatus = status
    if (status === 'NOT_CONNECTED' || status === 'REQUESTED') {
      v.connectedBy = null
      v.connectedAt = null
    } else if (!v.connectedBy) {
      v.connectedBy = v.driver ?? 'vous'
      v.connectedAt = today()
    }
  }

  const sendInvitation = (ids: string[]) => ids.forEach(id => setStatus(id, 'REQUESTED'))

  // The manager went through the secure connection window: waiting for the first event
  const connectSelf = (ids: string[]) => ids.forEach(id => {
    const v = byId(id)
    if (!v) return
    v.connectionStatus = 'IN_PROGRESS'
    v.connectedBy = 'vous'
    v.connectedAt = today()
  })

  const disconnect = (id: string) => setStatus(id, 'NOT_CONNECTED')

  // Sandbox panel: jump straight to a connection status or a compatibility case.
  // The model follows so the screen stays coherent (BYD = not compatible, none = unknown).
  const setScenario = (id: string, scenario: ConnectionScenario) => {
    const v = byId(id)
    if (!v) return
    if (scenario === 'UNKNOWN') return setModel(id, null)
    if (scenario === 'NOT_COMPATIBLE') return setModel(id, { brand: 'BYD', model: 'Seal', version: 'Design AWD' })
    if (v.compatibility !== 'COMPATIBLE') setModel(id, { brand: 'Renault', model: 'Megane E-Tech', version: 'EV60 220ch Supercharge' })
    setStatus(id, scenario)
  }

  const updateInfo = (id: string, patch: Partial<Pick<Vehicle, 'country' | 'plate' | 'vin' | 'year' | 'notes' | 'badge'>>) => {
    const v = byId(id)
    if (v) Object.assign(v, patch)
  }

  // A new (or removed) model invalidates the previous connection, and the
  // compatibility is recomputed from the brand (fake rule, see COMPATIBLE_BRANDS).
  const setModel = (id: string, model: { brand: string; model: string; version: string } | null) => {
    const v = byId(id)
    if (!v) return
    v.brand = model?.brand ?? null
    v.model = model?.model ?? null
    v.version = model?.version ?? null
    v.compatibility = !model ? 'UNKNOWN' : COMPATIBLE_BRANDS.includes(model.brand) ? 'COMPATIBLE' : 'NOT_COMPATIBLE'
    v.connectionStatus = 'NOT_CONNECTED'
    v.connectedBy = null
    v.connectedAt = null
  }

  const resetDemo = () => { vehicles.value = SEED.map(v => ({ ...v })) }

  return { vehicles, byId, setStatus, sendInvitation, connectSelf, disconnect, setScenario, updateInfo, setModel, resetDemo }
})
