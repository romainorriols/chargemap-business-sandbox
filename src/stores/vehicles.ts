// Fleet vehicles of the current BU + their connection state (Smartcar link).
// Shared by the vehicles listing, the vehicle detail page and the sandbox
// status switcher. Persisted to localStorage so a demo survives reloads.
// Bump the version when SEED changes so browsers drop the outdated copy.
const VEHICLES_KEY = 'cm-sandbox-vehicles-v14'
const PENDING_MATCHES_KEY = 'cm-sandbox-pending-matches-v1'
const CONNECT_CTA_KEY = 'cm-sandbox-connect-cta'

// Connection lifecycle, as exposed by the API (`connection_status`).
export type ConnectionStatus =
  | 'NOT_CONNECTED'
  | 'REQUESTED'
  | 'IN_PROGRESS'
  | 'CONNECTED'
  | 'ACTION_REQUIRED'
  | 'FAILED'
  | 'DISCONNECTED'
  // Found on a connected manufacturer account but not matched yet (same model +
  // year as other fleet vehicles, no VIN in Business): the manager picks its VIN.
  | 'TO_MATCH'

// UNKNOWN: no model filled in
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

// Fields edited on the vehicle page; applied together with "Modifier"
export type VehicleEdit = Pick<Vehicle, 'brand' | 'model' | 'version' | 'country' | 'plate' | 'vin' | 'year' | 'notes'>

// Brands the sandbox treats as compatible with the connection (fake rule).
// VINs returned by a manufacturer account that couldn't be told apart: they wait
// for the manager to say which fleet vehicle (candidate) each one is.
export interface PendingMatchGroup {
  id: string
  brand: string
  label: string // "Peugeot e-208 · 2024"
  vins: string[]
  candidateIds: string[]
}

export const COMPATIBLE_BRANDS = ['Renault', 'Tesla', 'Volvo', 'Kia', 'Peugeot', 'Hyundai', 'Audi', 'BMW', 'Citroën']
// Models only compatible from a given year (fake rule): key "<brand> <model>"
export const COMPATIBLE_FROM_YEAR: Record<string, number> = { 'Renault Zoe': 2019, 'Hyundai Kona Electric': 2020 }

const computeCompatibility = (v: Pick<Vehicle, 'brand' | 'model' | 'year'>): Compatibility => {
  if (!v.brand || !v.model) return 'UNKNOWN'
  if (!COMPATIBLE_BRANDS.includes(v.brand)) return 'NOT_COMPATIBLE'
  const fromYear = COMPATIBLE_FROM_YEAR[`${v.brand} ${v.model}`]
  // No year (or partial input "20"): treated as compatible, the connection isn't blocked
  if (!fromYear || !v.year || v.year.length < 4) return 'COMPATIBLE'
  return Number(v.year) >= fromYear ? 'COMPATIBLE' : 'NOT_COMPATIBLE'
}

const SEED: Vehicle[] = [
  // Order mixes statuses like a real fleet (ids are stable for demo links).
  // ~70% compatible, mostly connected; errors (action required / failed /
  // disconnected) stay a small minority.
  { id: 'v-1', brand: 'Volvo', model: 'XC40 Recharge', version: 'Twin Motor AWD', plate: 'GL-777-GL', country: 'FR', vin: null, year: null, driver: 'Claire Dubois', driverEmail: 'claire.dubois@email.com', badge: 'CMP-2306-202947', mileage: 51453, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'Claire Dubois', connectedAt: '24 oct. 2026' },
  { id: 'v-10', brand: 'Renault', model: 'Megane E-Tech', version: 'EV60 220ch Optimum Charge', plate: 'GA-412-PL', country: 'FR', vin: null, year: '2023', driver: 'Nicolas Bernard', driverEmail: 'nicolas.bernard@email.com', badge: 'CMP-2409-511788', mileage: 48210, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'Nicolas Bernard', connectedAt: '12 mars 2026' },
  { id: 'v-11', brand: 'Tesla', model: 'Model Y', version: 'Grande Autonomie', plate: 'GB-208-RT', country: 'FR', vin: null, year: '2023', driver: 'Camille Roux', driverEmail: 'camille.roux@email.com', badge: 'CMP-2512-820629', mileage: 61940, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'Camille Roux', connectedAt: '3 févr. 2026' },
  { id: 'v-2', brand: 'Renault', model: '4 E-Tech', version: 'Comfort Range', plate: 'FV-864-HF', country: 'FR', vin: null, year: null, driver: 'Hugo Lefèvre', driverEmail: 'hugo.lefevre@email.com', badge: null, mileage: 40000, compatibility: 'COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-12', brand: 'Peugeot', model: 'e-208', version: 'GT 136ch', plate: 'FZ-731-KD', country: 'FR', vin: null, year: '2022', driver: 'Antoine Fournier', driverEmail: 'antoine.fournier@email.com', badge: 'CMP-2410-126523', mileage: 72380, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'vous', connectedAt: '18 janv. 2026' },
  { id: 'v-13', brand: 'Renault', model: 'Zoe', version: 'R135', plate: 'FS-905-BN', country: 'FR', vin: null, year: '2021', driver: null, driverEmail: null, badge: 'CMP-2308-332417', mileage: 89450, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'vous', connectedAt: '18 janv. 2026' },
  { id: 'v-30', brand: 'BYD', model: 'Atto 3', version: 'Comfort', plate: 'GD-813-XR', country: 'FR', vin: null, year: '2023', driver: 'Karim Benali', driverEmail: 'karim.benali@email.com', badge: 'CMP-2102-491555', mileage: 46380, compatibility: 'NOT_COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-14', brand: 'Volvo', model: 'EX30', version: 'Single Motor', plate: 'GK-118-MC', country: 'FR', vin: null, year: '2024', driver: 'Pauline Girard', driverEmail: 'pauline.girard@email.com', badge: 'CMP-2411-641258', mileage: 18760, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'Pauline Girard', connectedAt: '7 mai 2026' },
  { id: 'v-15', brand: 'Kia', model: 'EV3', version: 'Air', plate: 'GM-347-AV', country: 'FR', vin: null, year: '2025', driver: 'Mehdi Haddad', driverEmail: 'mehdi.haddad@email.com', badge: 'CMP-2412-255993', mileage: 9870, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'Mehdi Haddad', connectedAt: '22 juil. 2026' },
  { id: 'v-35', brand: null, model: null, version: null, plate: 'GP-318-KZ', country: 'FR', vin: null, year: null, driver: 'Alexandre Noël', driverEmail: 'alexandre.noel@email.com', badge: 'CMP-2309-723972', mileage: null, compatibility: 'UNKNOWN', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-3', brand: 'Tesla', model: 'Model 3', version: 'Performance', plate: 'AB-123-CD', country: 'FR', vin: null, year: null, driver: 'Julien Martin', driverEmail: 'julien.martin@email.com', badge: 'CMP-2507-823774', mileage: 12870, compatibility: 'COMPATIBLE', connectionStatus: 'REQUESTED', connectedBy: null, connectedAt: null },
  { id: 'v-16', brand: 'Hyundai', model: 'Ioniq 5', version: '77 kWh', plate: 'GD-562-TS', country: 'FR', vin: null, year: '2023', driver: 'Élodie Lambert', driverEmail: 'elodie.lambert@email.com', badge: 'CMP-2310-461887', mileage: 54320, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'Élodie Lambert', connectedAt: '9 avr. 2026' },
  { id: 'v-17', brand: 'Renault', model: '5 E-Tech', version: 'Urban Range', plate: 'GL-903-HJ', country: 'FR', vin: null, year: '2025', driver: 'Lucas Mercier', driverEmail: 'lucas.mercier@email.com', badge: 'CMP-2401-770728', mileage: 11240, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'vous', connectedAt: '15 sept. 2026' },
  { id: 'v-18', brand: 'Citroën', model: 'ë-C4', version: '136ch Feel', plate: 'FX-276-LQ', country: 'FR', vin: null, year: '2022', driver: 'Sarah Bonnet', driverEmail: 'sarah.bonnet@email.com', badge: 'CMP-2311-976622', mileage: 66810, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'Sarah Bonnet', connectedAt: '28 févr. 2026' },
  { id: 'v-5', brand: 'Kia', model: 'EV6', version: 'GT-Line', plate: 'KL-552-PT', country: 'FR', vin: null, year: null, driver: 'Marc Leroy', driverEmail: 'marc.leroy@email.com', badge: 'CMP-2502-950099', mileage: 33120, compatibility: 'COMPATIBLE', connectionStatus: 'ACTION_REQUIRED', connectedBy: 'Marc Leroy', connectedAt: '02 sept. 2026' },
  { id: 'v-19', brand: 'Audi', model: 'Q4 e-tron', version: '40 204ch', plate: 'GC-640-WE', country: 'FR', vin: null, year: '2023', driver: 'François Dupuis', driverEmail: 'francois.dupuis@email.com', badge: 'CMP-2209-282516', mileage: 57630, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'François Dupuis', connectedAt: '11 mars 2026' },
  { id: 'v-31', brand: 'Alpine', model: 'A290', version: 'GT', plate: 'GN-674-AP', country: 'FR', vin: null, year: '2025', driver: 'Victor Lemoine', driverEmail: 'victor.lemoine@email.com', badge: 'CMP-2205-800396', mileage: 7920, compatibility: 'NOT_COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-20', brand: 'BMW', model: 'iX1', version: 'eDrive20', plate: 'GH-157-YB', country: 'FR', vin: null, year: '2024', driver: 'Manon Chevalier', driverEmail: 'manon.chevalier@email.com', badge: 'CMP-2210-797251', mileage: 27450, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'Manon Chevalier', connectedAt: '30 juin 2026' },
  { id: 'v-25', brand: 'Volvo', model: 'XC40 Recharge', version: 'Single Motor', plate: 'FW-693-GA', country: 'FR', vin: null, year: '2022', driver: 'Olivier Brunet', driverEmail: 'olivier.brunet@email.com', badge: 'CMP-2111-747350', mileage: 83210, compatibility: 'COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-21', brand: 'Renault', model: 'Scenic E-Tech', version: 'Long Range', plate: 'GJ-829-ZN', country: 'FR', vin: null, year: '2024', driver: 'Romain Gauthier', driverEmail: 'romain.gauthier@email.com', badge: 'CMP-2301-206092', mileage: 31090, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'vous', connectedAt: '5 juin 2026' },
  { id: 'v-4', brand: 'Renault', model: 'Megane E-Tech', version: 'EV60 220ch Supercharge', plate: 'PR-214-ZK', country: 'FR', vin: null, year: null, driver: 'Sofia Benali', driverEmail: 'sofia.benali@email.com', badge: 'CMP-2312-591357', mileage: 8420, compatibility: 'COMPATIBLE', connectionStatus: 'IN_PROGRESS', connectedBy: 'Sofia Benali', connectedAt: '24 oct. 2026' },
  { id: 'v-22', brand: 'Tesla', model: 'Model 3', version: 'Propulsion', plate: 'GE-384-PR', country: 'FR', vin: null, year: '2023', driver: 'Julie Perrin', driverEmail: 'julie.perrin@email.com', badge: 'CMP-2404-514933', mileage: 70120, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'Julie Perrin', connectedAt: '20 janv. 2026' },
  { id: 'v-36', brand: null, model: null, version: null, plate: 'GP-319-KZ', country: 'FR', vin: null, year: null, driver: null, driverEmail: null, badge: null, mileage: null, compatibility: 'UNKNOWN', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-23', brand: 'Peugeot', model: 'e-3008', version: 'Allure 210ch', plate: 'GN-215-CX', country: 'FR', vin: null, year: '2025', driver: 'Benoît Faure', driverEmail: 'benoit.faure@email.com', badge: 'CMP-2405-129668', mileage: 14680, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'Benoît Faure', connectedAt: '2 oct. 2026' },
  { id: 'v-24', brand: 'Kia', model: 'EV6', version: 'Air', plate: 'GF-470-DS', country: 'FR', vin: null, year: '2023', driver: 'Chloé Robin', driverEmail: 'chloe.robin@email.com', badge: 'CMP-2508-438509', mileage: 52870, compatibility: 'COMPATIBLE', connectionStatus: 'CONNECTED', connectedBy: 'Chloé Robin', connectedAt: '14 avr. 2026' },
  { id: 'v-26', brand: 'Renault', model: 'Megane E-Tech', version: 'EV40 130ch Urban Range', plate: 'GB-751-SK', country: 'FR', vin: null, year: '2023', driver: null, driverEmail: null, badge: null, mileage: 38940, compatibility: 'COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  // Same model + year as v-26 and no VIN: Smartcar VINs can't tell them apart (match popup demo)
  { id: 'v-39', brand: 'Renault', model: 'Megane E-Tech', version: 'EV60 220ch Optimum Charge', plate: 'GC-218-LT', country: 'FR', vin: null, year: '2023', driver: null, driverEmail: null, badge: 'CMP-2311-438615', mileage: 41270, compatibility: 'COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-40', brand: 'Renault', model: '5 E-Tech', version: 'Comfort Range', plate: 'GM-604-RC', country: 'FR', vin: null, year: '2025', driver: null, driverEmail: null, badge: null, mileage: 6150, compatibility: 'COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-6', brand: 'Peugeot', model: 'e-208', version: 'GT 156ch', plate: 'TP-334-QR', country: 'FR', vin: null, year: null, driver: 'Thomas Petit', driverEmail: 'thomas.petit@email.com', badge: 'CMP-2203-670926', mileage: 21900, compatibility: 'COMPATIBLE', connectionStatus: 'FAILED', connectedBy: null, connectedAt: null },
  { id: 'v-32', brand: 'Abarth', model: '500e', version: '155ch Turismo', plate: 'GH-385-QM', country: 'FR', vin: null, year: '2024', driver: 'Léa Marchand', driverEmail: 'lea.marchand@email.com', badge: null, mileage: 19560, compatibility: 'NOT_COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-27', brand: 'Citroën', model: 'ë-C3', version: 'MAX', plate: 'GP-102-LE', country: 'FR', vin: null, year: '2025', driver: 'Yasmine Bouaziz', driverEmail: 'yasmine.bouaziz@email.com', badge: 'CMP-2202-156191', mileage: 4210, compatibility: 'COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-9', brand: 'BYD', model: 'Seal', version: 'Design AWD', plate: 'HE-730-FD', country: 'FR', vin: null, year: null, driver: 'Inès Garnier', driverEmail: 'ines.garnier@email.com', badge: null, mileage: 67680, compatibility: 'NOT_COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-28', brand: 'BMW', model: 'i4', version: 'eDrive35', plate: 'GG-538-NT', country: 'FR', vin: null, year: '2024', driver: 'Guillaume Renard', driverEmail: 'guillaume.renard@email.com', badge: 'CMP-2112-362085', mileage: 29870, compatibility: 'COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-37', brand: null, model: null, version: null, plate: 'FT-582-EW', country: 'FR', vin: null, year: null, driver: 'Sophie Caron', driverEmail: 'sophie.caron@email.com', badge: 'CMP-2412-132813', mileage: null, compatibility: 'UNKNOWN', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-29', brand: 'Hyundai', model: 'Kona Electric', version: '48 kWh', plate: 'GK-926-FH', country: 'FR', vin: null, year: '2024', driver: 'Céline Arnaud', driverEmail: 'celine.arnaud@email.com', badge: 'CMP-2306-979767', mileage: 22540, compatibility: 'COMPATIBLE', connectionStatus: 'REQUESTED', connectedBy: null, connectedAt: null },
  { id: 'v-7', brand: 'Hyundai', model: 'Kona Electric', version: '65 kWh', plate: 'LM-901-ST', country: 'FR', vin: null, year: null, driver: 'Laura Moreau', driverEmail: 'laura.moreau@email.com', badge: 'CMP-2204-285661', mileage: 45210, compatibility: 'COMPATIBLE', connectionStatus: 'DISCONNECTED', connectedBy: 'Laura Moreau', connectedAt: '14 juin 2026' },
  { id: 'v-33', brand: 'Alfa Romeo', model: 'Junior Elettrica', version: '156ch', plate: 'GM-249-JU', country: 'FR', vin: null, year: '2025', driver: 'Damien Colin', driverEmail: 'damien.colin@email.com', badge: 'CMP-2308-209237', mileage: 12030, compatibility: 'NOT_COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-8', brand: null, model: null, version: null, plate: 'GH-086-FX', country: 'FR', vin: null, year: null, driver: null, driverEmail: null, badge: null, mileage: null, compatibility: 'UNKNOWN', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-34', brand: 'BYD', model: 'Seal', version: 'Design RWD', plate: 'GL-460-VS', country: 'FR', vin: null, year: '2024', driver: 'Mathilde Vidal', driverEmail: 'mathilde.vidal@email.com', badge: 'CMP-2411-518078', mileage: 33870, compatibility: 'NOT_COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-41', brand: 'Peugeot', model: 'e-208', version: 'GT 136ch', plate: 'GN-382-PE', country: 'FR', vin: null, year: '2024', driver: 'Julie Fontaine', driverEmail: 'julie.fontaine@email.com', badge: 'CMP-2405-208314', mileage: 15240, compatibility: 'COMPATIBLE', connectionStatus: 'TO_MATCH', connectedBy: null, connectedAt: null },
  { id: 'v-42', brand: 'Peugeot', model: 'e-208', version: 'GT 136ch', plate: 'GN-519-PE', country: 'FR', vin: null, year: '2024', driver: null, driverEmail: null, badge: null, mileage: 12870, compatibility: 'COMPATIBLE', connectionStatus: 'TO_MATCH', connectedBy: null, connectedAt: null },
  // Zoe without its year: compatible only from 2019, so not guaranteed (case "année non renseignée")
  { id: 'v-43', brand: 'Renault', model: 'Zoe', version: 'R110', plate: 'EK-274-JD', country: 'FR', vin: null, year: null, driver: 'Mathieu Girard', driverEmail: 'mathieu.girard@email.com', badge: 'CMP-2211-480375', mileage: 86420, compatibility: 'COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  // Hyundai account demo (no matching issue): connecting v-45, a Kona without its year,
  // brings v-46 / v-47 / v-44 along, while v-45 itself comes back as not compatible (2018)
  { id: 'v-45', brand: 'Hyundai', model: 'Kona Electric', version: '48 kWh', plate: 'GR-215-TB', country: 'FR', vin: null, year: null, driver: 'Nicolas Perrin', driverEmail: 'nicolas.perrin@email.com', badge: 'CMP-2410-358921', mileage: 18320, compatibility: 'COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-46', brand: 'Hyundai', model: 'Ioniq 5', version: '58 kWh', plate: 'GE-847-WA', country: 'FR', vin: null, year: '2023', driver: 'Laura Moreau', driverEmail: 'laura.moreau@email.com', badge: 'CMP-2307-664120', mileage: 41250, compatibility: 'COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-47', brand: 'Hyundai', model: 'Kona Electric', version: '65 kWh', plate: 'GH-392-NC', country: 'FR', vin: null, year: '2023', driver: null, driverEmail: null, badge: null, mileage: 37980, compatibility: 'COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-44', brand: 'Hyundai', model: 'Ioniq 5', version: '77 kWh', plate: 'EV-618-QS', country: 'FR', vin: null, year: '2024', driver: 'Antoine Lemaire', driverEmail: 'antoine.lemaire@email.com', badge: 'CMP-2104-207519', mileage: 94610, compatibility: 'COMPATIBLE', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
  { id: 'v-38', brand: null, model: null, version: null, plate: 'GA-947-RB', country: 'FR', vin: null, year: null, driver: null, driverEmail: null, badge: null, mileage: null, compatibility: 'UNKNOWN', connectionStatus: 'NOT_CONNECTED', connectedBy: null, connectedAt: null },
]

const SEED_PENDING: PendingMatchGroup[] = [
  { id: 'pm-peugeot', brand: 'Peugeot', label: 'Peugeot e-208 · 2024', vins: ['VR3UHZKXZRT104582', 'VR3UHZKXZRT107316'], candidateIds: ['v-41', 'v-42'] },
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

  let initialPending: PendingMatchGroup[] = SEED_PENDING.map(g => ({ ...g }))
  if (import.meta.client) {
    const stored = localStorage.getItem(PENDING_MATCHES_KEY)
    if (stored) {
      try { initialPending = JSON.parse(stored) as PendingMatchGroup[] } catch { /* keep seed */ }
    }
  }
  const pendingMatches = ref<PendingMatchGroup[]>(initialPending)
  if (import.meta.client) {
    watch(pendingMatches, g => localStorage.setItem(PENDING_MATCHES_KEY, JSON.stringify(g)), { deep: true })
  }

  if (import.meta.client) {
    watch(vehicles, v => localStorage.setItem(VEHICLES_KEY, JSON.stringify(v)), { deep: true })
  }

  // Sandbox panel (listing): style of the "Connecter" CTA, kept across reloads
  const connectCtaType = ref<'secondary' | 'tertiaryGray'>('secondary')
  if (import.meta.client) {
    if (localStorage.getItem(CONNECT_CTA_KEY) === 'tertiaryGray') connectCtaType.value = 'tertiaryGray'
    watch(connectCtaType, t => localStorage.setItem(CONNECT_CTA_KEY, t))
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
    if (!v) return
    Object.assign(v, patch)
    // The year can settle the compatibility (models compatible from a given year)
    if ('year' in patch) v.compatibility = computeCompatibility(v)
  }

  // A new (or removed) model invalidates the previous connection, and the
  // compatibility is recomputed (fake rules, see COMPATIBLE_BRANDS / COMPATIBLE_FROM_YEAR).
  const setModel = (id: string, model: { brand: string; model: string; version: string } | null) => {
    const v = byId(id)
    if (!v) return
    v.brand = model?.brand ?? null
    v.model = model?.model ?? null
    v.version = model?.version ?? null
    v.compatibility = computeCompatibility(v)
    pendingMatches.value.forEach((g) => { g.candidateIds = g.candidateIds.filter(c => c !== id) })
    v.connectionStatus = 'NOT_CONNECTED'
    v.connectedBy = null
    v.connectedAt = null
  }

  // "Modifier" on the vehicle page: a new model goes through setModel (resets the
  // connection), then the other fields (the year can settle the compatibility)
  const saveVehicle = (id: string, edit: VehicleEdit) => {
    const v = byId(id)
    if (!v) return
    const { brand, model, version, ...info } = edit
    if (brand !== v.brand || model !== v.model || version !== v.version) {
      setModel(id, brand && model && version ? { brand, model, version } : null)
    }
    updateInfo(id, info)
  }

  // Prototype: the manufacturer account returns each selected vehicle's VIN, hence its
  // model year. A missing year is filled in (2 years before the first compatible one), so
  // these vehicles turn out not compatible. Returns their ids.
  const applyAccountYears = (ids: string[]): string[] => ids.filter((id) => {
    const v = byId(id)
    const fromYear = v ? COMPATIBLE_FROM_YEAR[`${v.brand} ${v.model}`] : undefined
    if (!v || !fromYear || v.year) return false
    updateInfo(id, { year: String(fromYear - 2) })
    return v.compatibility === 'NOT_COMPATIBLE'
  })

  // "Associer plus tard": the candidates wait in "À associer"
  const addPendingMatches = (groups: PendingMatchGroup[]) => {
    groups.forEach(g => g.candidateIds.forEach(id => setStatus(id, 'TO_MATCH')))
    pendingMatches.value = [...pendingMatches.value, ...groups]
  }

  // VIN chosen for a vehicle (popup or vehicle page): it gets linked. When a group
  // is down to one VIN and one vehicle, that last pair is matched automatically.
  const resolveMatches = (matches: { vehicleId: string; vin: string }[]): string[] => {
    const linked = [...matches]
    matches.forEach((m) => {
      const g = pendingMatches.value.find(x => x.candidateIds.includes(m.vehicleId))
      if (!g) return
      g.vins = g.vins.filter(v => v !== m.vin)
      g.candidateIds = g.candidateIds.filter(id => id !== m.vehicleId)
    })
    pendingMatches.value.forEach((g) => {
      if (g.vins.length === 1 && g.candidateIds.length === 1) {
        linked.push({ vehicleId: g.candidateIds[0], vin: g.vins[0] })
        g.vins = []
        g.candidateIds = []
      }
    })
    pendingMatches.value = pendingMatches.value.filter(g => g.vins.length && g.candidateIds.length)
    linked.forEach(m => updateInfo(m.vehicleId, { vin: m.vin }))
    connectSelf(linked.map(m => m.vehicleId))
    return linked.map(m => m.vehicleId)
  }

  const resetDemo = () => {
    vehicles.value = SEED.map(v => ({ ...v }))
    pendingMatches.value = SEED_PENDING.map(g => ({ ...g, vins: [...g.vins], candidateIds: [...g.candidateIds] }))
  }

  return { vehicles, pendingMatches, connectCtaType, byId, addPendingMatches, resolveMatches, setStatus, sendInvitation, connectSelf, disconnect, setScenario, updateInfo, saveVehicle, applyAccountYears, setModel, resetDemo }
})
