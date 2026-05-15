<script setup lang="ts">
const headingClass = usePageHeadingClass()
const uiStore = useUiStore()
import { ref, computed, reactive, watch, onUnmounted } from 'vue'
import type { HorizontalTab } from '~/components/ui/HorizontalTabs.vue'
import allegoLogo    from '@/assets/logos/networks/allego.png'
import alternaLogo   from '@/assets/logos/networks/alterna.png'
import atlanteLogo   from '@/assets/logos/networks/atlante.png'
import aviaLogo      from '@/assets/logos/networks/avia.png'
import aviaPlusLogo  from '@/assets/logos/networks/avia-plus.png'
import aviaVoltLogo  from '@/assets/logos/networks/avia-volt.png'
import borneElecLogo from '@/assets/logos/networks/borne-elec.png'
import bpPulseLogo   from '@/assets/logos/networks/bp-pulse.png'
import drivecoLogo   from '@/assets/logos/networks/driveco.png'
import eTotemLogo    from '@/assets/logos/networks/e-totem.png'
import eVadeaLogo    from '@/assets/logos/networks/e-vadea.png'
import easyGoLogo    from '@/assets/logos/networks/easy-go.png'
import eborneLogo    from '@/assets/logos/networks/eborne.png'
import effiaLogo     from '@/assets/logos/networks/effia.png'
import electraLogo   from '@/assets/logos/networks/electra.png'
import engieLogo     from '@/assets/logos/networks/engie.png'
import fastnedLogo   from '@/assets/logos/networks/fastned.png'
import greenspotLogo from '@/assets/logos/networks/greenspot.png'

interface BadgeDriver { name: string; initials: string }
interface BadgeVehicle { model: string; plate: string }
interface Badge {
  id: string
  identifier: string
  driver: BadgeDriver | null
  vehicle: BadgeVehicle | null
  itinerance: boolean
  groupId: string | null
}
interface Group {
  id: string
  name: string
}

const driverPool: BadgeDriver[] = [
  { name: 'Camille Laurent',        initials: 'CL' },
  { name: 'Nicolas Mercier',        initials: 'NM' },
  { name: 'Léa Dubois',             initials: 'LD' },
  { name: 'Antoine Robert',         initials: 'AR' },
  { name: 'Sophie Moreau',          initials: 'SM' },
  { name: 'Julien Bernard',         initials: 'JB' },
  { name: 'Émilie Faure',           initials: 'EF' },
  { name: 'Hugo Lefèvre',           initials: 'HL' },
  { name: 'Inès Marchand',          initials: 'IM' },
  { name: 'Thomas Girard',          initials: 'TG' },
  { name: 'Manon Petit',            initials: 'MP' },
  { name: 'Lucas Roussel',          initials: 'LR' },
  { name: 'Chloé Vidal',            initials: 'CV' },
  { name: 'Mathieu Caron',          initials: 'MC' },
]
const vehiclePool: BadgeVehicle[] = [
  { model: 'Renault Zoé',           plate: 'AB-123-CD' },
  { model: 'Peugeot e-208',         plate: 'EF-456-GH' },
  { model: 'Tesla Model 3',         plate: 'IJ-789-KL' },
  { model: 'Hyundai Kona Electric', plate: 'MN-012-OP' },
  { model: 'Kia e-Niro',            plate: 'QR-345-ST' },
  { model: 'Volkswagen ID.3',       plate: 'UV-678-WX' },
  { model: 'BMW iX1',               plate: 'YZ-901-AB' },
  { model: 'Citroën ë-C4',          plate: 'CD-234-EF' },
  { model: 'Fiat 500e',             plate: 'GH-567-IJ' },
  { model: 'Mercedes EQA',          plate: 'KL-890-MN' },
  { model: 'Skoda Enyaq',           plate: 'OP-123-QR' },
  { model: 'Audi Q4 e-tron',        plate: 'ST-456-UV' },
]

// CMP-YYYY-NNNNNN format from the Figma — the year stays in 2020-2024,
// the serial is a stable PRN so each badge's identifier feels real.
function badgeIdentifier(seed: number): string {
  const year = 2020 + (seed % 5)
  const serial = (826000 + seed * 137) % 1000000
  return `CMP-${year}-${serial.toString().padStart(6, '0')}`
}
let seedCounter = 0
function makeBadge(groupId: string | null, slot: number): Badge {
  seedCounter += 1
  const m = (slot + (groupId?.charCodeAt(2) ?? 17)) % 20
  // 60% driver + vehicle, 20% vehicle only, 15% driver only, 5% neither.
  const hasDriver  = !(m === 0 || m === 5 || m === 9 || m === 14)
  const hasVehicle = !(m === 3 || m === 11 || m === 17 || m === 0)
  // ~92% of badges have itinérance activated — feels closer to the Figma
  // mock (48/50) than a coin flip would.
  const itinerance = m !== 4 && m !== 13
  return {
    id: `b-${groupId ?? 'pool'}-${slot}`,
    identifier: badgeIdentifier(seedCounter),
    driver:  hasDriver  ? driverPool[(slot * 3 + (groupId?.length ?? 0)) % driverPool.length]   : null,
    vehicle: hasVehicle ? vehiclePool[(slot * 5 + (groupId?.length ?? 0)) % vehiclePool.length] : null,
    itinerance,
    groupId,
  }
}
function seedBadges(groupId: string | null, count: number): Badge[] {
  return Array.from({ length: count }, (_, i) => makeBadge(groupId, i))
}

const groups: Group[] = [
  { id: 'g-1', name: 'Groupe logistique Rhône' },
  { id: 'g-2', name: 'Flotte commerciale Île-de-France' },
  { id: 'g-3', name: 'Techniciens itinérants Sud' },
  { id: 'g-4', name: 'Service livraison Lyon Centre' },
  { id: 'g-5', name: 'Équipe terrain Aquitaine' },
  { id: 'g-6', name: 'Pôle dirigeants Paris' },
  { id: 'g-7', name: 'Maintenance bornes Est' },
]

const allBadges = reactive<Badge[]>([
  ...seedBadges('g-1', 50),
  ...seedBadges('g-2', 42),
  ...seedBadges('g-3', 38),
  ...seedBadges('g-4', 45),
  ...seedBadges('g-5', 40),
  ...seedBadges('g-6', 32),
  ...seedBadges('g-7', 26),
  ...seedBadges(null, 35),
])

function groupStats(groupId: string) {
  const inGroup = allBadges.filter(b => b.groupId === groupId)
  const drivers  = new Set(inGroup.filter(b => b.driver).map(b => b.driver!.name))
  const vehicles = new Set(inGroup.filter(b => b.vehicle).map(b => b.vehicle!.plate))
  return { badges: inGroup.length, drivers: drivers.size, vehicles: vehicles.size }
}

// ── Listing state ──────────────────────────────────────────────────────────
const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return groups
  return groups.filter(g => g.name.toLowerCase().includes(q))
})

const page = ref(1)
const perPage = 9
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated = computed(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})
const rangeStart = computed(() => filtered.value.length === 0 ? 0 : (page.value - 1) * perPage + 1)
const rangeEnd = computed(() => Math.min(page.value * perPage, filtered.value.length))
function goto(n: number) {
  if (n < 1 || n > pageCount.value) return
  page.value = n
}

// Per-card ellipsis menu (shared between listing cards and detail rows —
// they never render at the same time, so one key space is fine).
const openMenuId = ref<string | null>(null)
function toggleMenu(id: string, e: MouseEvent) {
  e.stopPropagation()
  openMenuId.value = openMenuId.value === id ? null : id
}
function closeMenus() { openMenuId.value = null }

// ── Detail view ────────────────────────────────────────────────────────────
const selectedId = ref<string | null>(null)
const selectedGroup = computed(() => groups.find(g => g.id === selectedId.value) ?? null)
function openGroup(id: string) {
  selectedId.value = id
  openMenuId.value = null
}

// Loading skeleton (Figma /billing pattern): 600ms simulated fetch on
// every detail entry so the table cross-fades in instead of popping.
const isLoading = ref(false)
let loadingTimer: ReturnType<typeof setTimeout> | null = null
watch(selectedId, (id) => {
  if (loadingTimer) { clearTimeout(loadingTimer); loadingTimer = null }
  if (id) {
    isLoading.value = true
    loadingTimer = setTimeout(() => {
      isLoading.value = false
      loadingTimer = null
    }, 600)
  } else {
    isLoading.value = false
  }
})
const skeletonRows = Array.from({ length: 20 }, (_, i) => i)
onUnmounted(() => {
  if (loadingTimer) clearTimeout(loadingTimer)
})
function backToList() {
  selectedId.value = null
  resetDetailState()
}
function resetDetailState() {
  badgeSearch.value = ''
  badgePage.value = 1
  isAddingBadges.value = false
  addSearch.value = ''
  addPage.value = 1
  selectedToAdd.clear()
  selectedToRemove.clear()
  itineranceFilter.value = 'all'
  rattachementFilter.value = 'all'
  activeTab.value = 'informations'
  chargingRulesBannerVisible.value = true
  selectedRuleId.value = null
  budgetDrawerOpen.value = false
  alerteDrawerOpen.value = false
  autorisationsDrawerOpen.value = false
  vacanceDrawerOpen.value = false
  vacanceForm.creating = false
  vacanceForm.draft.name = ''
  vacanceForm.draft.range = ''
  reseauDrawerOpen.value = false
  networkPickerOpen.value = false
  clearUndo()
  dismissToast()
}

// Tabs (Figma 5959-58388)
const detailTabs: HorizontalTab[] = [
  { id: 'informations',   label: 'Informations' },
  { id: 'charging-rules', label: 'Règles de recharge' },
]
const activeTab = ref<string>('informations')

// "Ajoutez des règles de recharge" banner on the Informations tab
const chargingRulesBannerVisible = ref(true)

// Charging-rules tab — 3×2 grid of 6 rule cards (Figma 5959-38687).
type StatusIcon = 'check' | 'x-mark'
type IconVariant = 'outline' | 'solid'
interface ChargingRule {
  id: string
  title: string
  description: string
  icon: string
  iconVariant: IconVariant
  statusIcon: StatusIcon
  statusLabel: 'Activé' | 'Désactivé'
}
// Selected rule (Figma state) — click on a card to toggle the selected
// visual state. Budget de recharge also opens an edit drawer.
const selectedRuleId = ref<string | null>(null)

// Drawer state for the Budget de recharge rule (Figma 5980-29598 / 5980-28115)
const budgetDrawerOpen = ref(false)
const budgetForm = reactive({ active: false, amount: '230,00' })

// Drawer state for the Blocage vacance rule (Figma 5980-30694 / 5980-31045).
// Master toggle gates the whole feature; periods are added inline via the
// creation form. The "+ Nouvelle période" CTA stays at the bottom regardless
// of how many periods exist.
const vacanceDrawerOpen = ref(false)
interface VacancePeriod {
  id: string
  name: string
  active: boolean
  start: string  // dd/mm/yyyy
  end: string    // dd/mm/yyyy
}
const vacanceForm = reactive<{
  active: boolean
  periods: VacancePeriod[]
  creating: boolean
  draft: { name: string; range: string }
}>({
  active: true,
  periods: [],
  creating: false,
  draft: { name: '', range: '' },
})
let vacancePeriodSeq = 0
function openVacanceCreate() {
  vacanceForm.draft.name = ''
  vacanceForm.draft.range = ''
  vacanceForm.creating = true
}
function cancelVacanceCreate() {
  vacanceForm.creating = false
  vacanceForm.draft.name = ''
  vacanceForm.draft.range = ''
}
function addVacancePeriod() {
  const rawName = vacanceForm.draft.name.trim()
  if (!rawName) return
  // Default placeholder dates so a freshly created period card looks like the
  // Figma mock even without a real date picker wired up. If the user typed
  // something into "Sélectionnez une période" we'd parse it here.
  const period: VacancePeriod = {
    id: `vp-${++vacancePeriodSeq}`,
    name: /\d{4}$/.test(rawName) ? rawName : `${rawName} 2026`,
    active: false,
    start: '20/12/2025',
    end: '31/12/2025',
  }
  vacanceForm.periods.push(period)
  vacanceForm.creating = false
  vacanceForm.draft.name = ''
  vacanceForm.draft.range = ''
}

// Drawer state for the Autorisations quotidiennes rule (Figma 5980-29659).
// Master toggle gates the whole feature; each day carries its own toggle
// and either an "all day" allowance or a custom HH:MM range.
const autorisationsDrawerOpen = ref(false)
interface DayRule {
  id: string
  label: string
  active: boolean
  customHours: boolean
  start: string
  end: string
}
const autorisationsForm = reactive<{ active: boolean; days: DayRule[] }>({
  active: true,
  days: [
    { id: 'lundi',    label: 'Lundi',    active: true,  customHours: false, start: '00:00', end: '00:00' },
    { id: 'mardi',    label: 'Mardi',    active: true,  customHours: false, start: '00:00', end: '00:00' },
    { id: 'mercredi', label: 'Mercredi', active: true,  customHours: true,  start: '00:00', end: '00:00' },
    { id: 'jeudi',    label: 'Jeudi',    active: true,  customHours: false, start: '00:00', end: '00:00' },
    { id: 'vendredi', label: 'Vendredi', active: false, customHours: false, start: '00:00', end: '00:00' },
    { id: 'samedi',   label: 'Samedi',   active: false, customHours: false, start: '00:00', end: '00:00' },
    { id: 'dimanche', label: 'Dimanche', active: false, customHours: false, start: '00:00', end: '00:00' },
  ],
})

// Drawer state for the Blocage réseau rule (Figma 6010-29265 / 6010-29165).
// The drawer's "Sélectionner des réseaux" CTA opens a network picker panel
// to the left of the drawer. Each row's toggle represents authorisation:
// ON = network autorisée, OFF = network bloquée (red label, faded bg).
// Selection is committed only when the user clicks "Valider la selection".
const reseauDrawerOpen = ref(false)
const reseauForm = reactive<{ blockedNetworks: string[] }>({ blockedNetworks: [] })

interface ChargingNetwork {
  id: string
  name: string
  logo: string
  stations: number
  speed: 'fast' | 'slow'
}
const networks: ChargingNetwork[] = [
  { id: 'allego',      name: 'Allego',              logo: allegoLogo,    stations: 1879, speed: 'fast' },
  { id: 'alterna',     name: 'Alterna',             logo: alternaLogo,   stations: 1879, speed: 'fast' },
  { id: 'atlante',     name: 'Atlante',             logo: atlanteLogo,   stations: 1879, speed: 'slow' },
  { id: 'avia',        name: 'Avia',                logo: aviaLogo,      stations: 1879, speed: 'fast' },
  { id: 'avia-plus',   name: 'Avia plus',           logo: aviaPlusLogo,  stations: 1879, speed: 'fast' },
  { id: 'avia-volt',   name: 'Avia volt',           logo: aviaVoltLogo,  stations: 1879, speed: 'slow' },
  { id: 'borne-elec',  name: 'Borne-elec',          logo: borneElecLogo, stations: 1879, speed: 'slow' },
  { id: 'bp-pulse',    name: 'BP Pulse',            logo: bpPulseLogo,   stations: 1879, speed: 'fast' },
  { id: 'driveco',     name: 'Driveco',             logo: drivecoLogo,   stations: 1879, speed: 'fast' },
  { id: 'e-totem',     name: 'E-totem',             logo: eTotemLogo,    stations: 1879, speed: 'slow' },
  { id: 'e-vadea',     name: 'E-Vadea',             logo: eVadeaLogo,    stations: 1879, speed: 'slow' },
  { id: 'easy-charge', name: 'Easy charge service', logo: borneElecLogo, stations: 1879, speed: 'slow' },
  { id: 'easy-go',     name: 'Easy GO',             logo: easyGoLogo,    stations: 1879, speed: 'slow' },
  { id: 'eborne',      name: 'Eborne',              logo: eborneLogo,    stations: 1879, speed: 'slow' },
  { id: 'effia',       name: 'Effia',               logo: effiaLogo,     stations: 1879, speed: 'fast' },
  { id: 'electra',     name: 'Electra',             logo: electraLogo,   stations: 1879, speed: 'fast' },
  { id: 'engie',       name: 'Engie',               logo: engieLogo,     stations: 1879, speed: 'fast' },
  { id: 'eoliberty',   name: 'Eoliberty',           logo: borneElecLogo, stations: 1879, speed: 'slow' },
  { id: 'fastned',     name: 'Fastned',             logo: fastnedLogo,   stations: 1879, speed: 'fast' },
  { id: 'greenspot',   name: 'Greenspot',           logo: greenspotLogo, stations: 1879, speed: 'slow' },
]

// Network picker panel state (opens to the left of the réseau drawer).
const networkPickerOpen = ref(false)
type SpeedFilter = 'all' | 'fast' | 'slow'
const networkPicker = reactive<{
  search: string
  filter: SpeedFilter
  draftBlocked: Set<string>
}>({
  search: '',
  filter: 'all',
  draftBlocked: new Set<string>(),
})
const speedFilterTabs: { value: SpeedFilter; label: string }[] = [
  { value: 'all',  label: 'Tous' },
  { value: 'fast', label: 'Rapides' },
  { value: 'slow', label: 'Lents' },
]
const visibleNetworks = computed(() => {
  const q = networkPicker.search.trim().toLowerCase()
  return networks.filter(n => {
    if (networkPicker.filter !== 'all' && n.speed !== networkPicker.filter) return false
    if (q && !n.name.toLowerCase().includes(q)) return false
    return true
  })
})
const draftBlockedCount = computed(() => networkPicker.draftBlocked.size)

function openNetworkPicker() {
  networkPicker.draftBlocked = new Set(reseauForm.blockedNetworks)
  networkPicker.search = ''
  networkPicker.filter = 'all'
  networkPickerOpen.value = true
}

function cancelNetworkPicker() {
  networkPickerOpen.value = false
  networkPicker.draftBlocked.clear()
  networkPicker.search = ''
  networkPicker.filter = 'all'
}

function confirmNetworkPicker() {
  reseauForm.blockedNetworks = [...networkPicker.draftBlocked]
  networkPickerOpen.value = false
  networkPicker.search = ''
  networkPicker.filter = 'all'
}

function setNetworkAuthorized(id: string, authorized: boolean) {
  if (authorized) networkPicker.draftBlocked.delete(id)
  else networkPicker.draftBlocked.add(id)
}

function isNetworkAuthorized(id: string): boolean {
  return !networkPicker.draftBlocked.has(id)
}

// Escape closes the picker no matter which variant is open. Mirrors the
// modal convention but also a nice shortcut for the side-panel variant.
function onPickerKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && networkPickerOpen.value) {
    e.stopPropagation()
    cancelNetworkPicker()
  }
}
if (import.meta.client) {
  watch(networkPickerOpen, (open) => {
    if (open) window.addEventListener('keydown', onPickerKeydown)
    else window.removeEventListener('keydown', onPickerKeydown)
  })
}

// Switching variants mid-flight would leave the picker mounted with mismatched
// chrome — discard the draft and close on every mode change.
watch(() => uiStore.networkPickerMode, () => {
  if (networkPickerOpen.value) cancelNetworkPicker()
})

// French thousands separator with non-breaking space (matches Figma "1 879")
function fmtStations(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Drawer state for the Seuil d'alerte rule (Figma 5988-37178). Threshold type
// is either a percentage of the recharge budget or a monthly cap in euros.
const alerteDrawerOpen = ref(false)
type AlerteType = 'percentage' | 'monthly'
const alerteForm = reactive<{ active: boolean; type: AlerteType; amount: string }>({
  active: false,
  type: 'percentage',
  amount: '50',
})
const alerteTypeItems = [
  { value: 'percentage', label: 'Pourcentage du budget de recharge' },
  { value: 'monthly',    label: 'Seuil d’alerte mensuel' },
]
const alerteSuffix = computed(() => (alerteForm.type === 'percentage' ? '%' : 'Eur'))
const isAlerteAmountDisabled = computed(() => {
  if (alerteForm.type !== 'percentage') return false
  const budgetRule = rules.find(r => r.id === 'budget')
  return !budgetRule || budgetRule.statusIcon !== 'check'
})

const rules: ChargingRule[] = reactive([
  {
    id: 'budget',
    title: 'Budget de recharge',
    description: 'Fixer un budget limite à vos conducteurs par mois',
    icon: 'money-coins',
    iconVariant: 'outline',
    statusIcon: 'check',
    statusLabel: 'Activé',
  },
  {
    id: 'alerte',
    title: 'Seuil d’alerte',
    description: 'Soyez alertez si vos conducteurs dépasse un certain budget par mois',
    icon: 'bell-alert',
    iconVariant: 'outline',
    statusIcon: 'check',
    statusLabel: 'Activé',
  },
  {
    id: 'autorisations',
    title: 'Autorisations quotidiennes',
    description: 'Maîtrisez les jours et les plages horaires pendant lesquels vous souhaitez autoriser ou interdire les recharges',
    icon: 'calendar-days',
    iconVariant: 'outline',
    statusIcon: 'x-mark',
    statusLabel: 'Désactivé',
  },
  {
    id: 'vacance',
    title: 'Blocage vacance',
    description: 'Activez le blocage vacances si vous souhaitez désactiver la recharge de vos conducteurs pendant une période donnée',
    icon: 'airport-alt',
    iconVariant: 'outline',
    statusIcon: 'x-mark',
    statusLabel: 'Activé',
  },
  {
    id: 'pays',
    title: 'Blocage pays',
    description: 'Grâce à la restriction géographique, vous pouvez définir les pays dans lesquels la recharge est autorisée ou non.',
    icon: 'flag',
    iconVariant: 'outline',
    statusIcon: 'x-mark',
    statusLabel: 'Activé',
  },
  {
    id: 'reseau',
    title: 'Blocage réseau',
    description: 'Permet de définir sur quels réseaux la recharge est autorisée ou bloquée, afin de mieux contrôler vos usages',
    icon: 'route-off',
    iconVariant: 'solid',
    statusIcon: 'x-mark',
    statusLabel: 'Activé',
  },
])

function onRuleClick(rule: ChargingRule) {
  // Re-clicking the already-active card toggles the drawer off and clears the
  // active state — same affordance as clicking the header X.
  if (selectedRuleId.value === rule.id) {
    budgetDrawerOpen.value = false
    alerteDrawerOpen.value = false
    autorisationsDrawerOpen.value = false
    vacanceDrawerOpen.value = false
    reseauDrawerOpen.value = false
    networkPickerOpen.value = false
    vacanceForm.creating = false
    vacanceForm.draft.name = ''
    vacanceForm.draft.range = ''
    selectedRuleId.value = null
    return
  }

  // Clicking a card while another rule's drawer is open closes the open one
  // first so the two drawers never stack. The leave + enter animations run in
  // parallel; the entering drawer renders on top so the leaving one slides
  // away beneath it without visible overlap.
  budgetDrawerOpen.value = false
  alerteDrawerOpen.value = false
  autorisationsDrawerOpen.value = false
  vacanceDrawerOpen.value = false
  reseauDrawerOpen.value = false

  if (rule.id === 'budget') {
    selectedRuleId.value = rule.id
    budgetForm.active = rule.statusIcon === 'check'
    budgetDrawerOpen.value = true
    return
  }
  if (rule.id === 'alerte') {
    selectedRuleId.value = rule.id
    alerteForm.active = rule.statusIcon === 'check'
    alerteDrawerOpen.value = true
    return
  }
  if (rule.id === 'autorisations') {
    selectedRuleId.value = rule.id
    autorisationsForm.active = rule.statusIcon === 'check'
    autorisationsDrawerOpen.value = true
    return
  }
  if (rule.id === 'vacance') {
    selectedRuleId.value = rule.id
    vacanceForm.active = rule.statusIcon === 'check'
    vacanceDrawerOpen.value = true
    return
  }
  if (rule.id === 'reseau') {
    selectedRuleId.value = rule.id
    reseauDrawerOpen.value = true
    return
  }
  selectedRuleId.value = rule.id
}

function closeBudgetDrawer() {
  budgetDrawerOpen.value = false
  selectedRuleId.value = null
}

function saveBudget() {
  const rule = rules.find(r => r.id === 'budget')
  if (rule) {
    rule.statusIcon = budgetForm.active ? 'check' : 'x-mark'
    rule.statusLabel = budgetForm.active ? 'Activé' : 'Désactivé'
  }
  budgetDrawerOpen.value = false
  selectedRuleId.value = null
  showSuccessToast('Budget de recharge mis à jour', '')
}

function closeAutorisationsDrawer() {
  autorisationsDrawerOpen.value = false
  selectedRuleId.value = null
}

function saveAutorisations() {
  const rule = rules.find(r => r.id === 'autorisations')
  if (rule) {
    rule.statusIcon = autorisationsForm.active ? 'check' : 'x-mark'
    rule.statusLabel = autorisationsForm.active ? 'Activé' : 'Désactivé'
  }
  autorisationsDrawerOpen.value = false
  selectedRuleId.value = null
  showSuccessToast('Autorisations quotidiennes mises à jour', '')
}

function closeVacanceDrawer() {
  vacanceDrawerOpen.value = false
  vacanceForm.creating = false
  vacanceForm.draft.name = ''
  vacanceForm.draft.range = ''
  selectedRuleId.value = null
}

function closeReseauDrawer() {
  reseauDrawerOpen.value = false
  networkPickerOpen.value = false
  selectedRuleId.value = null
}

function saveReseau() {
  const rule = rules.find(r => r.id === 'reseau')
  if (rule) {
    const hasBlocked = reseauForm.blockedNetworks.length > 0
    rule.statusIcon = hasBlocked ? 'check' : 'x-mark'
    rule.statusLabel = hasBlocked ? 'Activé' : 'Désactivé'
  }
  reseauDrawerOpen.value = false
  networkPickerOpen.value = false
  selectedRuleId.value = null
  showSuccessToast('Blocage réseau mis à jour', '')
}

function saveVacance() {
  const rule = rules.find(r => r.id === 'vacance')
  if (rule) {
    rule.statusIcon = vacanceForm.active ? 'check' : 'x-mark'
    rule.statusLabel = vacanceForm.active ? 'Activé' : 'Désactivé'
  }
  vacanceDrawerOpen.value = false
  vacanceForm.creating = false
  vacanceForm.draft.name = ''
  vacanceForm.draft.range = ''
  selectedRuleId.value = null
  showSuccessToast('Blocage vacance mis à jour', '')
}

function closeAlerteDrawer() {
  alerteDrawerOpen.value = false
  selectedRuleId.value = null
}

function saveAlerte() {
  const rule = rules.find(r => r.id === 'alerte')
  if (rule) {
    rule.statusIcon = alerteForm.active ? 'check' : 'x-mark'
    rule.statusLabel = alerteForm.active ? 'Activé' : 'Désactivé'
  }
  alerteDrawerOpen.value = false
  selectedRuleId.value = null
  showSuccessToast('Seuil d’alerte mis à jour', '')
}

// Filters scoped to the selected group's badges.
type ItineranceFilter = 'all' | 'on' | 'off'
type RattachementFilter = 'all' | 'full' | 'vehicle' | 'driver' | 'none'
const itineranceFilter = ref<ItineranceFilter>('all')
const rattachementFilter = ref<RattachementFilter>('all')
const itineranceItems = [
  { value: 'all', label: 'Itinérance: Tous' },
  { value: 'on',  label: 'Activée' },
  { value: 'off', label: 'Désactivée' },
]
const rattachementItems = [
  { value: 'all',     label: 'Rattachement: Tous' },
  { value: 'full',    label: 'Conducteur + véhicule' },
  { value: 'vehicle', label: 'Véhicule seul' },
  { value: 'driver',  label: 'Conducteur seul' },
  { value: 'none',    label: 'Non rattaché' },
]

const badgesInGroup = computed(() =>
  selectedGroup.value
    ? allBadges.filter(b => b.groupId === selectedGroup.value!.id)
    : [],
)

// KPI counts — denominator is the group total so 45/50 reads as "45 of 50".
const kpis = computed(() => {
  const inGroup = badgesInGroup.value
  const total = inGroup.length
  const withVehicle = inGroup.filter(b => b.vehicle).length
  const withDriver  = inGroup.filter(b => b.driver).length
  const itinOn      = inGroup.filter(b => b.itinerance).length
  return { total, withVehicle, withDriver, itinOn }
})

function searchMatches(b: Badge, q: string) {
  if (!q) return true
  return b.identifier.toLowerCase().includes(q)
    || (b.driver?.name.toLowerCase().includes(q) ?? false)
    || (b.vehicle?.model.toLowerCase().includes(q) ?? false)
    || (b.vehicle?.plate.toLowerCase().includes(q) ?? false)
}
function passesItinerance(b: Badge) {
  if (itineranceFilter.value === 'all') return true
  if (itineranceFilter.value === 'on')  return b.itinerance
  return !b.itinerance
}
function passesRattachement(b: Badge) {
  const hasD = !!b.driver
  const hasV = !!b.vehicle
  switch (rattachementFilter.value) {
    case 'full':    return hasD && hasV
    case 'vehicle': return hasV && !hasD
    case 'driver':  return hasD && !hasV
    case 'none':    return !hasD && !hasV
    default:        return true
  }
}

const badgeSearch = ref('')
const filteredBadges = computed(() => {
  const q = badgeSearch.value.trim().toLowerCase()
  return badgesInGroup.value
    .filter(b => searchMatches(b, q))
    .filter(passesItinerance)
    .filter(passesRattachement)
})
const badgePage = ref(1)
const badgePerPage = 20
const badgePageCount = computed(() => Math.max(1, Math.ceil(filteredBadges.value.length / badgePerPage)))
const badgePaginated = computed(() => {
  const start = (badgePage.value - 1) * badgePerPage
  return filteredBadges.value.slice(start, start + badgePerPage)
})
const badgeRangeStart = computed(() => filteredBadges.value.length === 0 ? 0 : (badgePage.value - 1) * badgePerPage + 1)
const badgeRangeEnd = computed(() => Math.min(badgePage.value * badgePerPage, filteredBadges.value.length))
watch([badgeSearch, itineranceFilter, rattachementFilter], () => { badgePage.value = 1 })

// View-mode multi-select for bulk remove.
const selectedToRemove = reactive(new Set<string>())
function toggleRemoveSelection(id: string) {
  if (selectedToRemove.has(id)) selectedToRemove.delete(id)
  else selectedToRemove.add(id)
}
function clearRemoveSelection() { selectedToRemove.clear() }
const removeVisibleAllSelected = computed(() =>
  badgePaginated.value.length > 0 && badgePaginated.value.every(b => selectedToRemove.has(b.id)),
)
const removeVisibleSomeSelected = computed(() =>
  badgePaginated.value.some(b => selectedToRemove.has(b.id)) && !removeVisibleAllSelected.value,
)
function toggleSelectAllVisibleForRemove() {
  if (removeVisibleAllSelected.value) badgePaginated.value.forEach(b => selectedToRemove.delete(b.id))
  else badgePaginated.value.forEach(b => selectedToRemove.add(b.id))
}

// ── Add mode (inline picker) ───────────────────────────────────────────────
const isAddingBadges = ref(false)
const addSearch = ref('')
const addPage = ref(1)
const addPerPage = 20
const selectedToAdd = reactive(new Set<string>())

const availableBadges = computed(() => allBadges.filter(b => b.groupId === null))
const filteredAvailable = computed(() => {
  const q = addSearch.value.trim().toLowerCase()
  return availableBadges.value
    .filter(b => searchMatches(b, q))
    .filter(passesItinerance)
    .filter(passesRattachement)
})
const addPageCount = computed(() => Math.max(1, Math.ceil(filteredAvailable.value.length / addPerPage)))
const addPaginated = computed(() => {
  const start = (addPage.value - 1) * addPerPage
  return filteredAvailable.value.slice(start, start + addPerPage)
})
const addRangeStart = computed(() => filteredAvailable.value.length === 0 ? 0 : (addPage.value - 1) * addPerPage + 1)
const addRangeEnd = computed(() => Math.min(addPage.value * addPerPage, filteredAvailable.value.length))
watch(addSearch, () => { addPage.value = 1 })

function enterAddMode() {
  selectedToAdd.clear()
  selectedToRemove.clear()
  addSearch.value = ''
  addPage.value = 1
  isAddingBadges.value = true
  clearUndo()
}
function cancelAddMode() {
  isAddingBadges.value = false
  selectedToAdd.clear()
}
function toggleAddSelection(id: string) {
  if (selectedToAdd.has(id)) selectedToAdd.delete(id)
  else selectedToAdd.add(id)
}
const addVisibleAllSelected = computed(() =>
  addPaginated.value.length > 0 && addPaginated.value.every(b => selectedToAdd.has(b.id)),
)
const addVisibleSomeSelected = computed(() =>
  addPaginated.value.some(b => selectedToAdd.has(b.id)) && !addVisibleAllSelected.value,
)
function toggleSelectAllVisibleForAdd() {
  if (addVisibleAllSelected.value) addPaginated.value.forEach(b => selectedToAdd.delete(b.id))
  else addPaginated.value.forEach(b => selectedToAdd.add(b.id))
}

function confirmAdd() {
  if (!selectedGroup.value || selectedToAdd.size === 0) return
  const targetId = selectedGroup.value.id
  const count = selectedToAdd.size
  allBadges.forEach(b => {
    if (selectedToAdd.has(b.id)) b.groupId = targetId
  })
  isAddingBadges.value = false
  selectedToAdd.clear()
  showSuccessToast(
    count === 1 ? '1 badge ajouté au groupe' : `${count} badges ajoutés au groupe`,
    '',
  )
}

// ── Remove with undo (single + bulk share the same pendingUndo) ────────────
type PendingUndo = { badgeIds: string[]; groupId: string }
let pendingUndo: PendingUndo | null = null
function removeBadge(b: Badge) {
  if (!b.groupId) return
  pendingUndo = { badgeIds: [b.id], groupId: b.groupId }
  b.groupId = null
  selectedToRemove.delete(b.id)
  closeMenus()
  showUndoToast('Badge retiré du groupe', b.identifier)
}
function bulkRemoveSelected() {
  if (!selectedGroup.value || selectedToRemove.size === 0) return
  const ids = Array.from(selectedToRemove)
  const groupId = selectedGroup.value.id
  ids.forEach(id => {
    const target = allBadges.find(x => x.id === id)
    if (target) target.groupId = null
  })
  pendingUndo = { badgeIds: ids, groupId }
  selectedToRemove.clear()
  showUndoToast(
    ids.length === 1 ? '1 badge retiré du groupe' : `${ids.length} badges retirés du groupe`,
    '',
  )
}
function undoRemove() {
  if (!pendingUndo) return
  pendingUndo.badgeIds.forEach(id => {
    const target = allBadges.find(x => x.id === id)
    if (target) target.groupId = pendingUndo!.groupId
  })
  clearUndo()
  toast.visible = false
}
function clearUndo() {
  pendingUndo = null
}

// ── Floating pill (adaptive: Supprimer in view, Ajouter in add) ────────────
const pillVisible = computed(() =>
  !!selectedGroup.value && (isAddingBadges.value
    ? selectedToAdd.size > 0
    : selectedToRemove.size > 0),
)
const pillCount = computed(() =>
  isAddingBadges.value ? selectedToAdd.size : selectedToRemove.size,
)
function clearPillSelection() {
  if (isAddingBadges.value) selectedToAdd.clear()
  else clearRemoveSelection()
}
function runPillAction() {
  if (isAddingBadges.value) confirmAdd()
  else bulkRemoveSelected()
}

// ── Toast ──────────────────────────────────────────────────────────────────
type ToastKind = 'success' | 'neutral'
const toast = reactive<{
  visible: boolean
  kind: ToastKind
  title: string
  description: string
  primaryActionLabel: string
}>({
  visible: false,
  kind: 'success',
  title: '',
  description: '',
  primaryActionLabel: '',
})
let toastTimer: ReturnType<typeof setTimeout> | null = null
function dismissToast() {
  if (toastTimer) { clearTimeout(toastTimer); toastTimer = null }
  toast.visible = false
}
function showSuccessToast(title: string, description: string) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.kind = 'success'
  toast.title = title
  toast.description = description
  toast.primaryActionLabel = ''
  toast.visible = true
  toastTimer = setTimeout(() => { toast.visible = false }, 3500)
}
function showUndoToast(title: string, description: string) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.kind = 'neutral'
  toast.title = title
  toast.description = description
  toast.primaryActionLabel = 'Annuler'
  toast.visible = true
  toastTimer = setTimeout(() => {
    toast.visible = false
    clearUndo()
  }, 3500)
}
function onToastPrimary() {
  if (toast.primaryActionLabel === 'Annuler') undoRemove()
}

const fmtCount = (n: number) => n.toLocaleString('fr-FR')
</script>

<template>
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]" @click="closeMenus">

    <!-- ── LISTING ─────────────────────────────────────────────────────── -->
    <div
      v-if="!selectedGroup"
      class="mx-auto w-full flex flex-col gap-[32px]"
      :style="{ maxWidth: uiStore.getMaxWidth('/bu/groups') + 'px' }"
    >

      <!-- Page header -->
      <div class="flex items-center justify-between h-[48px] anim-fade-up" style="animation-delay: 0ms">
        <h1 :class="headingClass">
          Groupes
        </h1>
        <Button
          type="primary"
          size="md"
          icon-left="plus"
          label="Nouveau groupe"
        />
      </div>

      <div class="flex flex-col gap-[24px]">
        <div class="w-[350px] max-w-full anim-fade-up" style="animation-delay: 50ms">
          <Input
            v-model="search"
            type="leadingIcon"
            icon="magnifying-glass"
            placeholder="Recherche"
          />
        </div>

        <div
          v-if="paginated.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]"
        >
          <article
            v-for="(g, i) in paginated"
            :key="g.id"
            role="button"
            tabindex="0"
            :aria-label="`Voir ${g.name}`"
            :style="{ animationDelay: `${100 + i * 40}ms` }"
            :class="[
              'relative anim-fade-up cursor-pointer',
              'bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm',
              'p-[24px] flex flex-col gap-[16px]',
              'transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none',
              'hover:border-border-neutral hover:shadow-md hover:-translate-y-[2px]',
              'outline-none focus-visible:shadow-ring-gray',
              openMenuId === g.id ? 'z-30' : 'z-0',
            ]"
            @click="openGroup(g.id)"
            @keydown.enter="openGroup(g.id)"
            @keydown.space.prevent="openGroup(g.id)"
          >
            <div class="flex items-start gap-[16px] w-full">
              <div class="flex-1 min-w-0 flex flex-col gap-[8px] items-start">
                <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-brand">
                  <Icon name="folder" variant="solid" :size="24" class="text-white" />
                </div>
                <p class="font-sans font-semibold text-[20px] leading-[1.5] tracking-[-0.6px] text-text-neutral w-full truncate">
                  {{ g.name }}
                </p>
              </div>
              <div class="relative shrink-0">
                <button
                  type="button"
                  :class="[
                    '-mt-[4px] -mr-[8px] flex items-center justify-center w-[32px] h-[32px] rounded-[8px] transition-[background-color,color,transform] duration-150 ease-out motion-reduce:transition-none active:scale-[0.95] outline-none focus-visible:shadow-ring-gray',
                    openMenuId === g.id
                      ? 'bg-neutral-tertiary text-icon-neutral-primary'
                      : 'text-icon-neutral-secondary hover:bg-neutral-tertiary hover:text-icon-neutral-primary',
                  ]"
                  aria-label="Plus d'actions"
                  :aria-expanded="openMenuId === g.id"
                  aria-haspopup="menu"
                  @click="toggleMenu(g.id, $event)"
                >
                  <Icon name="ellipsis-vertical" variant="outline" :size="20" />
                </button>

                <Transition
                  enter-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                  enter-from-class="opacity-0 scale-[0.96] -translate-y-[4px]"
                  enter-to-class="opacity-100 scale-100 translate-y-0"
                  leave-active-class="transition-[opacity,transform] duration-[120ms] ease-out"
                  leave-from-class="opacity-100 scale-100 translate-y-0"
                  leave-to-class="opacity-0 scale-[0.96] -translate-y-[4px]"
                >
                  <div
                    v-if="openMenuId === g.id"
                    class="absolute top-[calc(100%+4px)] right-0 z-20 origin-top-right bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg py-[12px] flex flex-col gap-[4px] min-w-[180px]"
                    role="menu"
                    @click.stop
                  >
                    <div class="px-[4px] py-[2px]">
                      <button
                        type="button"
                        role="menuitem"
                        class="w-full flex items-center gap-[8px] p-[12px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                        @click="openGroup(g.id)"
                      >
                        <Icon name="pencil-square" variant="outline" :size="20" class="shrink-0 text-icon-neutral-secondary" />
                        <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral whitespace-nowrap">
                          Modifier
                        </span>
                      </button>
                    </div>
                    <div class="px-[4px] py-[2px]">
                      <button
                        type="button"
                        role="menuitem"
                        class="w-full flex items-center gap-[8px] p-[12px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                        @click="closeMenus"
                      >
                        <Icon name="trash" variant="outline" :size="20" class="shrink-0 text-icon-danger" />
                        <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-danger-medium whitespace-nowrap">
                          Supprimer
                        </span>
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>

            <div class="h-px w-full shrink-0 bg-border-neutral-tertiary" />

            <div class="flex items-stretch gap-[8px] w-full">
              <div class="flex-1 min-w-0 flex flex-col gap-[8px]">
                <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral tabular-nums">
                  {{ groupStats(g.id).badges }}
                </p>
                <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Badges
                </p>
              </div>
              <div class="w-px self-stretch bg-border-neutral-tertiary" aria-hidden="true" />
              <div class="flex-1 min-w-0 flex flex-col gap-[8px]">
                <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral tabular-nums">
                  {{ groupStats(g.id).vehicles }}
                </p>
                <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Véhicules
                </p>
              </div>
              <div class="w-px self-stretch bg-border-neutral-tertiary" aria-hidden="true" />
              <div class="flex-1 min-w-0 flex flex-col gap-[8px]">
                <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral tabular-nums">
                  {{ groupStats(g.id).drivers }}
                </p>
                <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Conducteurs
                </p>
              </div>
            </div>
          </article>
        </div>

        <div
          v-else
          class="anim-fade-up bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[48px] flex flex-col items-center justify-center gap-[8px] text-center"
          style="animation-delay: 100ms"
        >
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
            Aucun résultat
          </p>
          <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Essayez une autre recherche.
          </p>
        </div>

        <div class="flex items-center justify-between pt-[8px] anim-fade-up" style="animation-delay: 200ms">
          <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Afficher&nbsp;: <span class="font-medium text-text-neutral">{{ rangeStart }}</span> à
            <span class="font-medium text-text-neutral">{{ rangeEnd }}</span> sur
            <span class="font-medium text-text-neutral">{{ filtered.length }}</span> résultats
          </p>

          <div class="flex items-center gap-[8px]">
            <button
              type="button"
              class="flex items-center justify-center w-[36px] h-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out motion-reduce:transition-none active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed outline-none focus-visible:shadow-ring-gray"
              :disabled="page === 1"
              aria-label="Page précédente"
              @click="goto(page - 1)"
            >
              <Icon name="chevron-left" variant="solid" :size="18" />
            </button>
            <button
              v-for="n in pageCount"
              :key="n"
              type="button"
              :aria-current="page === n ? 'page' : undefined"
              :class="[
                'min-w-[36px] h-[36px] px-[10px] rounded-[8px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] transition-[background-color,color,transform] duration-150 ease-out motion-reduce:transition-none active:scale-[0.95] outline-none focus-visible:shadow-ring-gray',
                page === n
                  ? 'bg-brand-surface text-text-brand-deep'
                  : 'text-text-neutral-secondary hover:bg-neutral-secondary hover:text-text-neutral',
              ]"
              @click="goto(n)"
            >
              {{ n }}
            </button>
            <button
              type="button"
              class="flex items-center justify-center w-[36px] h-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out motion-reduce:transition-none active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed outline-none focus-visible:shadow-ring-gray"
              :disabled="page === pageCount"
              aria-label="Page suivante"
              @click="goto(page + 1)"
            >
              <Icon name="chevron-right" variant="solid" :size="18" />
            </button>
          </div>
        </div>
      </div>

      <div class="h-[60px]" />
    </div>

    <!-- ── DETAIL ──────────────────────────────────────────────────────── -->
    <div
      v-else
      class="mx-auto w-full flex flex-col gap-[32px]"
      :style="{ maxWidth: uiStore.getMaxWidth('/bu/groups') + 'px' }"
    >

      <!-- Header: back + title (left), Paramètres (right) -->
      <div class="flex items-start justify-between gap-[16px] anim-fade-up" style="animation-delay: 0ms">
        <div class="flex flex-col items-start min-w-0 flex-1">
          <button
            type="button"
            class="flex items-center gap-[8px] px-[4px] py-[4px] rounded-[4px] text-text-neutral-secondary hover:text-text-neutral transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
            @click="backToList"
          >
            <Icon name="arrow-left" variant="outline" :size="16" />
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
              Retour
            </span>
          </button>
          <h1 :class="[headingClass, 'truncate max-w-full']">
            {{ selectedGroup.name }}
          </h1>
        </div>
        <div class="shrink-0 pt-[24px]">
          <Button
            type="secondary"
            size="md"
            icon-left="cog-6-tooth"
            label="Paramètres"
          />
        </div>
      </div>

      <!-- KPI row — sits above the tabs so the metrics stay visible across
           both Informations and Règles de recharge (Figma 5931-23791). -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] anim-fade-up" style="animation-delay: 40ms">
        <div class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex flex-col gap-[12px]">
          <p class="font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-text-neutral">Nombre de badges</p>
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral tabular-nums">{{ kpis.total }}</p>
        </div>
        <div class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex flex-col gap-[12px]">
          <p class="font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-text-neutral">Attaché à un véhicule</p>
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral tabular-nums">
            {{ kpis.withVehicle }}<span class="text-text-neutral-secondary">/{{ kpis.total }}</span>
          </p>
        </div>
        <div class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex flex-col gap-[12px]">
          <p class="font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-text-neutral">Attaché à un conducteur</p>
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral tabular-nums">
            {{ kpis.withDriver }}<span class="text-text-neutral-secondary">/{{ kpis.total }}</span>
          </p>
        </div>
        <div class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex flex-col gap-[12px]">
          <p class="font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-text-neutral">Itinérance activé</p>
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral tabular-nums">
            {{ kpis.itinOn }}<span class="text-text-neutral-secondary">/{{ kpis.total }}</span>
          </p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="anim-fade-up" style="animation-delay: 60ms">
        <HorizontalTabs
          v-model="activeTab"
          :tabs="detailTabs"
          variant="underline"
        />
      </div>

      <!-- Tab content -->
      <Transition
        mode="out-in"
        enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        enter-from-class="opacity-0 translate-y-[6px]"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-[4px]"
      >
        <!-- ── Tab: Informations ──────────────────────────────────── -->
        <div v-if="activeTab === 'informations'" key="informations" class="flex flex-col gap-[32px]">

          <!-- Charging-rules banner (brand Alert) -->
          <Alert
            v-if="chargingRulesBannerVisible"
            v-model="chargingRulesBannerVisible"
            type="brand"
            title="Ajoutez des règles de recharge !"
            description="Définissez des règles de recharge pour mieux contrôler les usages et vos coûts"
            primary-action-label="Définir des règles"
            secondary-action-label="Fermer"
            :dismissable="true"
            @primary-action="activeTab = 'charging-rules'; chargingRulesBannerVisible = false"
            @secondary-action="chargingRulesBannerVisible = false"
          />

          <!-- View ↔ Add swap. The drawer (add) carries a static fake-card
               peek to suggest layering, matching the Figma Frame 6070 mock. -->
          <Transition
            mode="out-in"
            enter-active-class="transition-[opacity,transform] duration-[320ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            enter-from-class="opacity-0 translate-y-[24px]"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-[16px]"
          >
            <!-- VIEW MODE -->
            <div v-if="!isAddingBadges" key="view" class="flex flex-col gap-[16px]">
              <!-- Filter row (no card — sits directly between KPIs and table) -->
              <div class="flex flex-col lg:flex-row lg:items-center gap-[8px] anim-fade-up" style="animation-delay: 80ms">
                <div class="w-full lg:flex-1 lg:min-w-0 lg:basis-0">
                  <Input
                    v-model="badgeSearch"
                    type="leadingIcon"
                    icon="magnifying-glass"
                    placeholder="Recherche"
                  />
                </div>
                <div class="w-full lg:flex-1 lg:min-w-0 lg:basis-0">
                  <Dropdown
                    v-model="itineranceFilter"
                    :items="itineranceItems"
                    input-type="leadingIcon"
                    icon="highway"
                    :searchable="false"
                    :show-label="false"
                    :show-hint="false"
                    :teleport="true"
                  />
                </div>
                <div class="w-full lg:flex-1 lg:min-w-0 lg:basis-0">
                  <Dropdown
                    v-model="rattachementFilter"
                    :items="rattachementItems"
                    input-type="leadingIcon"
                    icon="link"
                    :searchable="false"
                    :show-label="false"
                    :show-hint="false"
                    :teleport="true"
                  />
                </div>
                <div class="shrink-0">
                  <Button
                    type="primary"
                    size="md"
                    icon-left="plus"
                    label="Ajouter des badges"
                    @click="enterAddMode"
                  />
                </div>
              </div>

              <!-- Table card -->
              <section class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-clip anim-fade-up" style="animation-delay: 100ms">
                <Transition mode="out-in" name="tab-fade">

                <!-- SKELETON (initial load — 600ms simulated) -->
                <div v-if="isLoading" key="skel">
                  <div class="hidden md:flex items-stretch w-full bg-neutral-tertiary min-h-[40px]">
                    <div class="w-[48px] shrink-0 px-[16px] py-[12px] flex items-center">
                      <Skeleton width="16px" height="16px" rounded="4px" />
                    </div>
                    <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center">
                      <Skeleton width="60px" height="14px" />
                    </div>
                    <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center">
                      <Skeleton width="70px" height="14px" />
                    </div>
                    <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center">
                      <Skeleton width="80px" height="14px" />
                    </div>
                    <div class="w-[68px] shrink-0" aria-hidden="true" />
                  </div>
                  <div
                    v-for="i in skeletonRows"
                    :key="`sk-${i}`"
                    class="flex items-stretch w-full md:min-h-[64px] border-t border-border-neutral-tertiary first:border-t-0"
                  >
                    <div class="w-[48px] shrink-0 px-[16px] py-[12px] flex items-center">
                      <Skeleton width="16px" height="16px" rounded="4px" />
                    </div>
                    <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center">
                      <Skeleton width="150px" height="14px" />
                    </div>
                    <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center">
                      <Skeleton width="100px" height="14px" />
                    </div>
                    <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center">
                      <Skeleton width="140px" height="14px" />
                    </div>
                    <div class="w-[68px] shrink-0 px-[16px] py-[12px] flex items-center justify-end">
                      <Skeleton width="20px" height="20px" rounded="6px" />
                    </div>
                  </div>
                </div>

                <!-- REAL TABLE -->
                <div v-else key="real">
                <!-- Header row -->
                <div class="hidden md:flex items-stretch w-full bg-neutral-tertiary min-h-[40px]">
                  <div class="w-[48px] shrink-0 px-[16px] py-[12px] flex items-center">
                    <button
                      type="button"
                      role="checkbox"
                      :aria-checked="removeVisibleSomeSelected ? 'mixed' : (removeVisibleAllSelected ? 'true' : 'false')"
                      :aria-label="removeVisibleAllSelected ? 'Tout désélectionner' : 'Tout sélectionner sur cette page'"
                      :class="[
                        'size-[16px] rounded-[4px] border flex items-center justify-center transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand',
                        (removeVisibleAllSelected || removeVisibleSomeSelected)
                          ? 'bg-brand border-brand'
                          : 'bg-neutral border-border-neutral-secondary hover:border-border-neutral',
                      ]"
                      @click="toggleSelectAllVisibleForRemove"
                    >
                      <Icon v-if="removeVisibleAllSelected" name="check" variant="solid" :size="12" class="text-white" />
                      <Icon v-else-if="removeVisibleSomeSelected" name="minus" variant="solid" :size="12" class="text-white" />
                    </button>
                  </div>
                  <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                    Badge
                  </div>
                  <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                    Véhicule
                  </div>
                  <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                    Conducteur
                  </div>
                  <div class="w-[68px] shrink-0" aria-hidden="true" />
                </div>

                <!-- Empty state -->
                <div
                  v-if="badgePaginated.length === 0"
                  class="px-[24px] py-[48px] flex flex-col items-center justify-center gap-[8px] text-center"
                >
                  <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                    {{ badgeSearch || itineranceFilter !== 'all' || rattachementFilter !== 'all'
                      ? 'Aucun badge' : 'Aucun badge dans ce groupe' }}
                  </p>
                  <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                    {{ badgeSearch || itineranceFilter !== 'all' || rattachementFilter !== 'all'
                      ? 'Aucun badge ne correspond aux filtres.'
                      : 'Ajoutez un badge pour commencer.' }}
                  </p>
                </div>

                <!-- Rows — billing-style anim-fade-up cascade (key on b.id so
                     pagination re-mounts new rows and re-runs the animation,
                     staggered by 20ms each). -->
                <div v-else>
                  <div
                    v-for="(b, i) in badgePaginated"
                    :key="b.id"
                    role="button"
                    tabindex="0"
                    :aria-pressed="selectedToRemove.has(b.id)"
                    :style="{ animationDelay: `${i * 20}ms` }"
                    :class="[
                      'group/row relative flex flex-col md:flex-row md:items-stretch w-full md:min-h-[64px] border-t border-border-neutral-tertiary first:border-t-0 cursor-pointer outline-none anim-fade-up',
                      'transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:bg-neutral-secondary',
                      selectedToRemove.has(b.id) ? 'bg-brand-surface hover:bg-brand-surface' : 'hover:bg-neutral-secondary',
                    ]"
                    @click="toggleRemoveSelection(b.id)"
                    @keydown.enter="toggleRemoveSelection(b.id)"
                    @keydown.space.prevent="toggleRemoveSelection(b.id)"
                  >
                    <!-- Checkbox -->
                    <div class="w-full md:w-[48px] shrink-0 px-[24px] md:px-[16px] pt-[16px] md:pt-[12px] md:py-[12px] flex md:items-center">
                      <span
                        role="checkbox"
                        :aria-checked="selectedToRemove.has(b.id)"
                        :class="[
                          'size-[16px] rounded-[4px] border flex items-center justify-center transition-colors duration-150 ease-out',
                          selectedToRemove.has(b.id)
                            ? 'bg-brand border-brand'
                            : 'bg-neutral border-border-neutral-secondary group-hover/row:border-border-neutral',
                        ]"
                      >
                        <Icon v-if="selectedToRemove.has(b.id)" name="check" variant="solid" :size="12" class="text-white" />
                      </span>
                    </div>

                    <!-- Badge -->
                    <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[12px] flex items-center">
                      <p class="min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                        {{ b.identifier }}
                      </p>
                    </div>

                    <!-- Véhicule -->
                    <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[12px] flex items-center">
                      <p class="min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                        <template v-if="b.vehicle">{{ b.vehicle.plate }}</template>
                        <span v-else aria-label="Non rattaché">--</span>
                      </p>
                    </div>

                    <!-- Conducteur -->
                    <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[12px] pb-[16px] md:pb-[12px] flex items-center">
                      <p class="min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                        <template v-if="b.driver">{{ b.driver.name }}</template>
                        <span v-else aria-label="Non rattaché">--</span>
                      </p>
                    </div>

                    <!-- Row menu (trailing) -->
                    <div class="w-full md:w-[68px] shrink-0 px-[24px] md:px-[16px] pb-[16px] md:pb-[12px] md:py-[12px] flex md:items-center md:justify-end">
                      <div class="relative">
                        <button
                          type="button"
                          :class="[
                            'flex items-center justify-center w-[32px] h-[32px] rounded-[8px] transition-[background-color,color,transform] duration-150 ease-out motion-reduce:transition-none active:scale-[0.95] outline-none focus-visible:shadow-ring-gray',
                            openMenuId === b.id
                              ? 'bg-neutral-tertiary text-icon-neutral-primary'
                              : 'text-icon-neutral-secondary hover:bg-neutral-tertiary hover:text-icon-neutral-primary',
                          ]"
                          :aria-label="`Actions sur ${b.identifier}`"
                          :aria-expanded="openMenuId === b.id"
                          aria-haspopup="menu"
                          @click.stop="toggleMenu(b.id, $event)"
                          @keydown.enter.stop
                          @keydown.space.stop
                        >
                          <Icon name="ellipsis-vertical" variant="outline" :size="20" />
                        </button>
                        <Transition
                          enter-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                          enter-from-class="opacity-0 scale-[0.96] -translate-y-[4px]"
                          enter-to-class="opacity-100 scale-100 translate-y-0"
                          leave-active-class="transition-[opacity,transform] duration-[120ms] ease-out"
                          leave-from-class="opacity-100 scale-100 translate-y-0"
                          leave-to-class="opacity-0 scale-[0.96] -translate-y-[4px]"
                        >
                          <div
                            v-if="openMenuId === b.id"
                            class="absolute top-[calc(100%+4px)] right-0 z-20 origin-top-right bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg py-[12px] flex flex-col gap-[4px] min-w-[200px]"
                            role="menu"
                            @click.stop
                          >
                            <div class="px-[4px] py-[2px]">
                              <button
                                type="button"
                                role="menuitem"
                                class="w-full flex items-center gap-[8px] p-[12px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                                @click="closeMenus"
                              >
                                <Icon name="pencil-square" variant="outline" :size="20" class="shrink-0 text-icon-neutral-secondary" />
                                <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral whitespace-nowrap">
                                  Modifier le badge
                                </span>
                              </button>
                            </div>
                            <div class="px-[4px] py-[2px]">
                              <button
                                type="button"
                                role="menuitem"
                                class="w-full flex items-center gap-[8px] p-[12px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                                @click="removeBadge(b)"
                              >
                                <Icon name="trash" variant="outline" :size="20" class="shrink-0 text-icon-danger" />
                                <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-danger-medium whitespace-nowrap">
                                  Retirer du groupe
                                </span>
                              </button>
                            </div>
                          </div>
                        </Transition>
                      </div>
                    </div>
                  </div>
                </div>

                <TableFooter
                  v-if="filteredBadges.length > 0"
                  :page="badgePage"
                  :page-count="badgePageCount"
                  :range-start="badgeRangeStart"
                  :range-end="badgeRangeEnd"
                  :total="filteredBadges.length"
                  @update:page="(n) => (badgePage = n)"
                />
                </div>
                </Transition>
              </section>
            </div>

            <!-- ADD MODE — drawer only (Figma 5931-23791 dropped the back-card
                 peek that was in the earlier 5931-24777 mock). -->
            <div v-else key="add">
              <section
                class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-lg flex flex-col"
              >
                <!-- Drawer header: title + Annuler -->
                <div class="flex items-center justify-between gap-[16px] px-[16px] py-[16px]">
                  <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
                    Sélectionnez les badges à ajouter
                  </p>
                  <Button
                    type="secondary"
                    size="md"
                    label="Annuler"
                    @click="cancelAddMode"
                  />
                </div>

                <!-- Drawer body: filter row + inner table card -->
                <div class="px-[16px] pb-[16px] flex flex-col gap-[16px]">
                  <!-- Filter row (no Ajouter button — the floating pill confirms the add) -->
                  <div class="flex flex-col lg:flex-row lg:items-center gap-[8px]">
                    <div class="w-full lg:flex-1 lg:min-w-0 lg:basis-0">
                      <Input
                        v-model="addSearch"
                        type="leadingIcon"
                        icon="magnifying-glass"
                        placeholder="Recherche"
                      />
                    </div>
                    <div class="w-full lg:flex-1 lg:min-w-0 lg:basis-0">
                      <Dropdown
                        v-model="itineranceFilter"
                        :items="itineranceItems"
                        input-type="leadingIcon"
                        icon="highway"
                        :searchable="false"
                        :show-label="false"
                        :show-hint="false"
                        :teleport="true"
                      />
                    </div>
                    <div class="w-full lg:flex-1 lg:min-w-0 lg:basis-0">
                      <Dropdown
                        v-model="rattachementFilter"
                        :items="rattachementItems"
                        input-type="leadingIcon"
                        icon="link"
                        :searchable="false"
                        :show-label="false"
                        :show-hint="false"
                        :teleport="true"
                      />
                    </div>
                  </div>

                  <!-- Table directly in drawer body (Figma 5931-23791 — no inner card) -->
                  <div>
                    <!-- Header row -->
                    <div class="hidden md:flex items-stretch w-full bg-neutral-tertiary min-h-[40px]">
                      <div class="w-[48px] shrink-0 px-[16px] py-[12px] flex items-center">
                        <button
                          type="button"
                          role="checkbox"
                          :aria-checked="addVisibleSomeSelected ? 'mixed' : (addVisibleAllSelected ? 'true' : 'false')"
                          :aria-label="addVisibleAllSelected ? 'Tout désélectionner' : 'Tout sélectionner sur cette page'"
                          :class="[
                            'size-[16px] rounded-[4px] border flex items-center justify-center transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand',
                            (addVisibleAllSelected || addVisibleSomeSelected)
                              ? 'bg-brand border-brand'
                              : 'bg-neutral border-border-neutral-secondary hover:border-border-neutral',
                          ]"
                          @click="toggleSelectAllVisibleForAdd"
                        >
                          <Icon v-if="addVisibleAllSelected" name="check" variant="solid" :size="12" class="text-white" />
                          <Icon v-else-if="addVisibleSomeSelected" name="minus" variant="solid" :size="12" class="text-white" />
                        </button>
                      </div>
                      <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                        Badge
                      </div>
                      <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                        Véhicule
                      </div>
                      <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                        Conducteur
                      </div>
                      <div class="w-[68px] shrink-0" aria-hidden="true" />
                    </div>

                    <!-- Empty -->
                    <div
                      v-if="addPaginated.length === 0"
                      class="px-[24px] py-[48px] flex flex-col items-center justify-center gap-[8px] text-center"
                    >
                      <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                        {{ addSearch || itineranceFilter !== 'all' || rattachementFilter !== 'all' ? 'Aucun badge' : 'Aucun badge disponible' }}
                      </p>
                      <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                        {{ addSearch || itineranceFilter !== 'all' || rattachementFilter !== 'all'
                          ? 'Aucun badge non rattaché ne correspond aux filtres.'
                          : 'Tous les badges sont déjà rattachés à un groupe.' }}
                      </p>
                    </div>

                    <!-- Rows -->
                    <div v-else>
                      <button
                        v-for="(b, i) in addPaginated"
                        :key="b.id"
                        type="button"
                        :aria-pressed="selectedToAdd.has(b.id)"
                        :style="{ animationDelay: `${i * 20}ms` }"
                        :class="[
                          'group/row w-full flex flex-col md:flex-row md:items-stretch md:min-h-[64px] border-t border-border-neutral-tertiary first:border-t-0 text-left anim-fade-up',
                          'transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:bg-neutral-secondary',
                          selectedToAdd.has(b.id) ? 'bg-brand-surface hover:bg-brand-surface' : 'hover:bg-neutral-secondary',
                        ]"
                        @click="toggleAddSelection(b.id)"
                      >
                        <div class="w-full md:w-[48px] shrink-0 px-[24px] md:px-[16px] pt-[16px] md:pt-[12px] md:py-[12px] flex md:items-center">
                          <span
                            role="checkbox"
                            :aria-checked="selectedToAdd.has(b.id)"
                            :class="[
                              'size-[16px] rounded-[4px] border flex items-center justify-center transition-colors duration-150 ease-out',
                              selectedToAdd.has(b.id)
                                ? 'bg-brand border-brand'
                                : 'bg-neutral border-border-neutral-secondary group-hover/row:border-border-neutral',
                            ]"
                          >
                            <Icon v-if="selectedToAdd.has(b.id)" name="check" variant="solid" :size="12" class="text-white" />
                          </span>
                        </div>
                        <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[12px] flex items-center">
                          <p class="min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                            {{ b.identifier }}
                          </p>
                        </div>
                        <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[12px] flex items-center">
                          <p class="min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                            <template v-if="b.vehicle">{{ b.vehicle.plate }}</template>
                            <span v-else>--</span>
                          </p>
                        </div>
                        <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[12px] pb-[16px] md:pb-[12px] flex items-center">
                          <p class="min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                            <template v-if="b.driver">{{ b.driver.name }}</template>
                            <span v-else>--</span>
                          </p>
                        </div>
                        <div class="w-full md:w-[68px] shrink-0" aria-hidden="true" />
                      </button>
                    </div>

                    <TableFooter
                      v-if="filteredAvailable.length > 0"
                      :page="addPage"
                      :page-count="addPageCount"
                      :range-start="addRangeStart"
                      :range-end="addRangeEnd"
                      :total="filteredAvailable.length"
                      @update:page="(n) => (addPage = n)"
                    />
                  </div>
                </div>
              </section>
            </div>
          </Transition>
        </div>

        <!-- ── Tab: Règles de recharge — 3×2 grid (Figma 5959-38687) ──── -->
        <div v-else key="charging-rules" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          <button
            v-for="(rule, i) in rules"
            :key="rule.id"
            type="button"
            :aria-pressed="selectedRuleId === rule.id"
            :style="{ animationDelay: `${40 + i * 30}ms` }"
            :class="[
              'text-left flex flex-col gap-[16px] p-[16px] rounded-[16px] overflow-clip anim-fade-up border-[1.5px] outline-none cursor-pointer',
              'transition-[background-color,border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none',
              selectedRuleId === rule.id
                ? 'bg-neutral-secondary border-border-brand shadow-ring-brand'
                : 'bg-neutral border-border-neutral-secondary shadow-sm hover:bg-neutral-hover focus-visible:shadow-ring-brand focus-visible:border-border-brand',
            ]"
            @click="onRuleClick(rule)"
          >
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-neutral-secondary border border-border-neutral-tertiary">
                <Icon :name="rule.icon" :variant="rule.iconVariant" :size="24" class="text-icon-neutral-secondary" />
              </div>
              <span class="inline-flex items-center gap-[8px] pl-[2px] pr-[8px] py-[2px] rounded-full bg-neutral-secondary border border-border-neutral-secondary">
                <svg v-if="rule.statusIcon === 'check'" width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0 block" aria-hidden="true">
                  <circle cx="10.5" cy="10.5" r="10.5" fill="#18B97E" />
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M14.2781 6.98105C14.4426 7.09072 14.487 7.31296 14.3774 7.47745L10.0819 13.9206C10.0224 14.0099 9.92608 14.0677 9.81936 14.0783C9.71264 14.0889 9.60681 14.051 9.53098 13.9752L6.66734 11.1115C6.52755 10.9718 6.52755 10.7451 6.66734 10.6053C6.80713 10.4655 7.03378 10.4655 7.17357 10.6053L9.72846 13.1602L13.7817 7.08033C13.8914 6.91584 14.1136 6.87139 14.2781 6.98105Z" fill="white" />
                </svg>
                <svg v-else width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" class="shrink-0 block" aria-hidden="true">
                  <circle cx="10.5" cy="10.5" r="10.5" fill="#94A3B8" />
                  <path d="M13.1105 7.38618C13.2503 7.24639 13.4769 7.24639 13.6167 7.38618C13.7565 7.52597 13.7565 7.75256 13.6167 7.89235L11.0061 10.5029L13.6167 13.1134L13.6414 13.1405C13.7561 13.2811 13.7477 13.4886 13.6167 13.6196C13.4856 13.7507 13.2781 13.759 13.1376 13.6443L13.1105 13.6196L10.5 11.0091L7.88942 13.6196C7.74963 13.7594 7.52304 13.7594 7.38325 13.6196C7.24346 13.4798 7.24346 13.2532 7.38325 13.1134L9.9938 10.5029L7.38325 7.89235L7.35854 7.86531C7.24385 7.72472 7.25218 7.51724 7.38325 7.38618C7.51431 7.25511 7.72179 7.24678 7.86238 7.36147L7.88942 7.38618L10.5 9.99673L13.1105 7.38618Z" fill="white" />
                </svg>
                <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                  {{ rule.statusLabel }}
                </span>
              </span>
            </div>
            <div class="flex flex-col gap-[4px] w-full">
              <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                {{ rule.title }}
              </p>
              <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                {{ rule.description }}
              </p>
            </div>
          </button>
        </div>
      </Transition>

      <div class="h-[60px]" />
    </div>

    <!-- ── Budget de recharge drawer (Figma 5980-28115 / 5980-29598) ──── -->
    <Transition
      enter-active-class="transition-transform duration-[320ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="budgetDrawerOpen"
        class="fixed right-[8px] top-[8px] bottom-[8px] z-40 w-[424px] max-w-[calc(100%-16px)] bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] flex flex-col overflow-clip"
        role="dialog"
        aria-modal="true"
        aria-label="Budget de recharge"
      >
        <!-- Header -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[68px] border-b border-border-neutral-tertiary shrink-0">
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Budget de recharge
          </p>
          <button
            type="button"
            class="shrink-0 flex items-center justify-center size-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
            aria-label="Fermer"
            @click="closeBudgetDrawer"
          >
            <Icon name="x-mark" variant="outline" :size="20" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 min-h-0 overflow-y-auto px-[16px] py-[16px] flex flex-col gap-[8px]">
          <!-- Toggle row -->
          <div class="flex items-center justify-between gap-[16px] px-[16px] py-[16px] rounded-[12px] border border-border-neutral-secondary bg-neutral">
            <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
              {{ budgetForm.active ? 'Activé' : 'Désactivé' }}
            </span>
            <Toggle
              v-model="budgetForm.active"
              size="md"
              aria-label="Activer le budget de recharge"
            />
          </div>

          <!-- Budget mensuel (visible only when active) -->
          <Transition
            enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            enter-from-class="opacity-0 -translate-y-[4px]"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-[4px]"
          >
            <div
              v-if="budgetForm.active"
              class="flex items-center gap-[16px] pl-[16px] pr-[8px] py-[8px] rounded-[12px] border border-border-neutral-secondary bg-neutral"
            >
              <span class="flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Budget mensuel
              </span>
              <div class="shrink-0 w-[180px]">
                <Input
                  v-model="budgetForm.amount"
                  type="trailingText"
                  :addon-trailing-text="'Eur'"
                  :show-currency-icon="false"
                  :trailing-separator="false"
                  placeholder="0,00"
                />
              </div>
            </div>
          </Transition>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[69px] border-t border-border-neutral-tertiary shrink-0">
          <Button type="secondary" size="md" label="Annuler" @click="closeBudgetDrawer" />
          <Button type="primary" size="md" label="Enregistrer" @click="saveBudget" />
        </div>
      </aside>
    </Transition>

    <!-- ── Seuil d'alerte drawer (Figma 5988-37178) ───────────────────── -->
    <Transition
      enter-active-class="transition-transform duration-[320ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="alerteDrawerOpen"
        class="fixed right-[8px] top-[8px] bottom-[8px] z-40 w-[424px] max-w-[calc(100%-16px)] bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] flex flex-col overflow-clip"
        role="dialog"
        aria-modal="true"
        aria-label="Seuil d'alerte"
      >
        <!-- Header -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[68px] border-b border-border-neutral-tertiary shrink-0">
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Seuil d’alerte
          </p>
          <button
            type="button"
            class="shrink-0 flex items-center justify-center size-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
            aria-label="Fermer"
            @click="closeAlerteDrawer"
          >
            <Icon name="x-mark" variant="outline" :size="20" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 min-h-0 overflow-y-auto px-[16px] py-[16px] flex flex-col gap-[8px]">
          <!-- Toggle row -->
          <div class="flex items-center justify-between gap-[16px] px-[16px] py-[16px] rounded-[12px] border border-border-neutral-secondary bg-neutral">
            <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
              {{ alerteForm.active ? 'Activé' : 'Désactivé' }}
            </span>
            <Toggle
              v-model="alerteForm.active"
              size="md"
              aria-label="Activer le seuil d'alerte"
            />
          </div>

          <!-- Type + amount (visible only when active) — both inputs sit
               inside a single outer card per Figma 5980-29501. -->
          <Transition
            enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            enter-from-class="opacity-0 -translate-y-[4px]"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-[4px]"
          >
            <div v-if="alerteForm.active" class="p-[8px] rounded-[12px] border border-border-neutral-secondary bg-neutral flex flex-col gap-[8px]">
              <Dropdown
                v-model="alerteForm.type"
                :items="alerteTypeItems"
                :searchable="false"
                :show-label="false"
                :show-hint="false"
                :teleport="true"
              />

              <div class="relative group/disabled-amount" tabindex="-1">
                <Input
                  :model-value="isAlerteAmountDisabled ? '' : alerteForm.amount"
                  type="trailingText"
                  :addon-trailing-text="alerteSuffix"
                  :show-currency-icon="false"
                  :trailing-separator="false"
                  :disabled="isAlerteAmountDisabled"
                  placeholder="0"
                  @update:model-value="(v) => (alerteForm.amount = v)"
                />
                <!-- Tooltip — hover/focus-within over the disabled input only. -->
                <div
                  v-if="isAlerteAmountDisabled"
                  class="absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] z-10 pointer-events-none w-[282px] px-[12px] py-[8px] rounded-[8px] bg-text-neutral text-[#f1f5f9] shadow-[0px_4px_6px_-2px_rgba(0,0,0,0.1)] font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-left opacity-0 -translate-y-[2px] transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none group-hover/disabled-amount:opacity-100 group-hover/disabled-amount:translate-y-0 group-focus-within/disabled-amount:opacity-100 group-focus-within/disabled-amount:translate-y-0"
                  role="tooltip"
                >
                  Définissez un budget de recharge pour utiliser cette option.
                  <span class="absolute left-1/2 -translate-x-1/2 bottom-full block size-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-text-neutral" aria-hidden="true" />
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[69px] border-t border-border-neutral-tertiary shrink-0">
          <Button type="secondary" size="md" label="Annuler" @click="closeAlerteDrawer" />
          <Button type="primary" size="md" label="Enregistrer" @click="saveAlerte" />
        </div>
      </aside>
    </Transition>

    <!-- ── Autorisations quotidiennes drawer (Figma 5980-29659) ────────── -->
    <Transition
      enter-active-class="transition-transform duration-[320ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="autorisationsDrawerOpen"
        class="fixed right-[8px] top-[8px] bottom-[8px] z-40 w-[424px] max-w-[calc(100%-16px)] bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] flex flex-col overflow-clip"
        role="dialog"
        aria-modal="true"
        aria-label="Autorisations quotidiennes"
      >
        <!-- Header -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[68px] border-b border-border-neutral-tertiary shrink-0">
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Autorisations quotidiennes
          </p>
          <button
            type="button"
            class="shrink-0 flex items-center justify-center size-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
            aria-label="Fermer"
            @click="closeAutorisationsDrawer"
          >
            <Icon name="x-mark" variant="outline" :size="20" />
          </button>
        </div>

        <!-- Body — matches Figma 5998-38070 design context exactly -->
        <div class="flex-1 min-h-0 overflow-y-auto p-[16px]">
          <div class="flex flex-col gap-[16px]">
            <!-- Master "Activé" card (rounded-16, larger label) -->
            <div class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[16px] flex items-center justify-between gap-[16px]">
              <p class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                {{ autorisationsForm.active ? 'Activé' : 'Désactivé' }}
              </p>
              <Toggle
                v-model="autorisationsForm.active"
                size="sm"
                aria-label="Activer les autorisations quotidiennes"
              />
            </div>

            <!-- Day cards — body row is always rendered; the "Modifier"
                 button is disabled (not hidden) when the day toggle is off,
                 matching the Vendredi state in Figma. -->
            <Transition
              enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              enter-from-class="opacity-0 -translate-y-[4px]"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-[4px]"
            >
              <div v-if="autorisationsForm.active" class="flex flex-col gap-[16px]">
                <article
                  v-for="day in autorisationsForm.days"
                  :key="day.id"
                  class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex flex-col gap-[8px]"
                >
                  <!-- Header row: label + toggle -->
                  <div class="flex items-center justify-between">
                    <p class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                      {{ day.label }}
                    </p>
                    <Toggle
                      v-model="day.active"
                      size="sm"
                      :aria-label="`Activer ${day.label}`"
                    />
                  </div>

                  <!-- Body row (always shown; gated by day.active for button) -->
                  <div class="flex items-center justify-between gap-[8px] py-[4px]">
                    <template v-if="!day.customHours">
                      <p class="flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                        Autorisé toute la journée
                      </p>
                      <Button
                        type="secondary"
                        size="sm"
                        label="Modifier"
                        :disabled="!day.active"
                        class="w-[77px]"
                        @click="day.customHours = true"
                      />
                    </template>
                    <template v-else>
                      <div class="flex-1 min-w-0 flex items-center gap-[8px]">
                        <div class="flex-1 min-w-0 flex items-center gap-[8px] px-[12px] py-[8px] rounded-[8px] border border-border-neutral-secondary bg-neutral shadow-sm transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none focus-within:border-brand focus-within:shadow-ring-brand">
                          <Icon name="clock" variant="outline" :size="18" class="shrink-0 text-icon-neutral-secondary" />
                          <input
                            v-model="day.start"
                            inputmode="numeric"
                            placeholder="00:00"
                            :aria-label="`Heure de début ${day.label}`"
                            class="flex-1 min-w-0 outline-none bg-transparent font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary placeholder:text-text-neutral-secondary"
                          >
                        </div>
                        <span class="shrink-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">à</span>
                        <div class="flex-1 min-w-0 flex items-center gap-[8px] px-[12px] py-[8px] rounded-[8px] border border-border-neutral-secondary bg-neutral shadow-sm transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none focus-within:border-brand focus-within:shadow-ring-brand">
                          <Icon name="clock" variant="outline" :size="18" class="shrink-0 text-icon-neutral-secondary" />
                          <input
                            v-model="day.end"
                            inputmode="numeric"
                            placeholder="00:00"
                            :aria-label="`Heure de fin ${day.label}`"
                            class="flex-1 min-w-0 outline-none bg-transparent font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary placeholder:text-text-neutral-secondary"
                          >
                        </div>
                      </div>
                      <Button
                        type="secondary"
                        size="sm"
                        label="Supprimer"
                        @click="day.customHours = false"
                      />
                    </template>
                  </div>
                </article>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[69px] border-t border-border-neutral-tertiary shrink-0">
          <Button type="secondary" size="md" label="Annuler" @click="closeAutorisationsDrawer" />
          <Button type="primary" size="md" label="Enregistrer" @click="saveAutorisations" />
        </div>
      </aside>
    </Transition>

    <!-- ── Blocage vacance drawer (Figma 5980-30694) ───────────────────── -->
    <Transition
      enter-active-class="transition-transform duration-[320ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="vacanceDrawerOpen"
        class="fixed right-[8px] top-[8px] bottom-[8px] z-40 w-[424px] max-w-[calc(100%-16px)] bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] flex flex-col overflow-clip"
        role="dialog"
        aria-modal="true"
        aria-label="Blocage vacance"
      >
        <!-- Header -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[68px] border-b border-border-neutral-tertiary shrink-0">
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Blocage vacance
          </p>
          <button
            type="button"
            class="shrink-0 flex items-center justify-center size-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
            aria-label="Fermer"
            @click="closeVacanceDrawer"
          >
            <Icon name="x-mark" variant="outline" :size="20" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 min-h-0 overflow-y-auto p-[16px]">
          <div class="flex flex-col gap-[16px]">
            <!-- Master "Activé" card -->
            <div class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[16px] flex items-center justify-between gap-[16px]">
              <p class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                {{ vacanceForm.active ? 'Activé' : 'Désactivé' }}
              </p>
              <Toggle
                v-model="vacanceForm.active"
                size="sm"
                aria-label="Activer le blocage vacance"
              />
            </div>

            <!-- Period list + creation form + empty CTA — gated by master toggle -->
            <Transition
              enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              enter-from-class="opacity-0 -translate-y-[4px]"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-[4px]"
            >
              <div v-if="vacanceForm.active" class="flex flex-col gap-[16px]">

                <!-- Saved period cards -->
                <TransitionGroup
                  tag="div"
                  class="flex flex-col gap-[16px]"
                  enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                  enter-from-class="opacity-0 -translate-y-[6px]"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none absolute"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 -translate-y-[4px]"
                >
                  <div
                    v-for="period in vacanceForm.periods"
                    :key="period.id"
                    class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[16px] flex items-center gap-[16px]"
                  >
                    <Toggle
                      v-model="period.active"
                      size="sm"
                      :aria-label="`Activer ${period.name}`"
                    />
                    <div class="flex-1 min-w-0 flex flex-col">
                      <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                        {{ period.name }}
                      </p>
                      <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
                        {{ period.start }} - {{ period.end }}
                      </p>
                    </div>
                    <button
                      type="button"
                      class="shrink-0 flex items-center justify-center size-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                      :aria-label="`Options pour ${period.name}`"
                    >
                      <Icon name="ellipsis-horizontal" variant="outline" :size="20" />
                    </button>
                  </div>
                </TransitionGroup>

                <!-- Inline creation form -->
                <Transition
                  enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                  enter-from-class="opacity-0 -translate-y-[6px]"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 -translate-y-[4px]"
                >
                  <div
                    v-if="vacanceForm.creating"
                    class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[16px] flex flex-col gap-[12px]"
                  >
                    <Input
                      v-model="vacanceForm.draft.name"
                      type="default"
                      size="md"
                      placeholder="Nom"
                      aria-label="Nom de la période"
                      @keydown.enter="addVacancePeriod"
                    />
                    <Input
                      v-model="vacanceForm.draft.range"
                      type="leadingIcon"
                      icon="calendar-days"
                      size="md"
                      placeholder="Sélectionnez une période"
                      aria-label="Sélectionnez une période"
                    />
                    <div class="flex items-center gap-[8px]">
                      <button
                        type="button"
                        class="flex-1 h-[40px] flex items-center justify-center px-[16px] rounded-[8px] border border-border-neutral bg-neutral text-text-neutral-secondary font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] hover:bg-neutral-hover transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray active:scale-[0.97]"
                        @click="cancelVacanceCreate"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        :disabled="!vacanceForm.draft.name.trim()"
                        :class="[
                          'flex-1 h-[40px] flex items-center justify-center px-[16px] rounded-[8px] font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] transition-colors duration-150 ease-out motion-reduce:transition-none outline-none',
                          !vacanceForm.draft.name.trim()
                            ? 'bg-neutral-disabled text-text-neutral-disabled cursor-not-allowed'
                            : 'bg-brand text-white hover:bg-brand-hover focus-visible:shadow-ring-brand active:scale-[0.97]',
                        ]"
                        @click="addVacancePeriod"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </Transition>

                <!-- Always-visible empty CTA — opens the inline form -->
                <button
                  type="button"
                  class="w-full h-[100px] flex items-center justify-center gap-[12px] px-[16px] rounded-[16px] border border-dashed border-border-neutral-secondary bg-neutral text-text-neutral-secondary hover:bg-neutral-hover hover:border-border-neutral transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-brand focus-visible:border-brand"
                  aria-label="Ajouter une nouvelle période de vacance"
                  @click="openVacanceCreate"
                >
                  <Icon name="plus" variant="outline" :size="24" class="shrink-0" />
                  <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px]">
                    Nouvelle période
                  </span>
                </button>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[69px] border-t border-border-neutral-tertiary shrink-0">
          <Button type="secondary" size="md" label="Annuler" @click="closeVacanceDrawer" />
          <Button type="primary" size="md" label="Enregistrer" @click="saveVacance" />
        </div>
      </aside>
    </Transition>

    <!-- ── Blocage réseau drawer (Figma 6010-29265) ─────────────────────── -->
    <Transition
      enter-active-class="transition-transform duration-[320ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="reseauDrawerOpen"
        class="fixed right-[8px] top-[8px] bottom-[8px] z-40 w-[424px] max-w-[calc(100%-16px)] bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] flex flex-col overflow-clip"
        role="dialog"
        aria-modal="true"
        aria-label="Blocage réseau"
      >
        <!-- Header -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[68px] border-b border-border-neutral-tertiary shrink-0">
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Blocage réseau
          </p>
          <button
            type="button"
            class="shrink-0 flex items-center justify-center size-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
            aria-label="Fermer"
            @click="closeReseauDrawer"
          >
            <Icon name="x-mark" variant="outline" :size="20" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 min-h-0 overflow-y-auto p-[16px]">
          <div class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex flex-col gap-[16px]">
            <div class="flex flex-col gap-[8px]">
              <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
                Bloqué des réseaux
              </p>
              <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Sélectionner des réseaux à bloqué, pour tout les autres les recharges seront autorisées
              </p>
            </div>
            <button
              type="button"
              class="w-full flex items-center justify-center gap-[8px] px-[12px] py-[8px] rounded-[8px] border border-border-neutral bg-neutral text-text-neutral-secondary font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] hover:bg-neutral-hover transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray active:scale-[0.97]"
              :class="networkPickerOpen ? 'bg-neutral-secondary' : ''"
              @click="openNetworkPicker"
            >
              {{ reseauForm.blockedNetworks.length > 0
                ? `${reseauForm.blockedNetworks.length} ${reseauForm.blockedNetworks.length > 1 ? 'réseaux bloqués' : 'réseau bloqué'}`
                : 'Sélectionner des réseaux' }}
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[69px] border-t border-border-neutral-tertiary shrink-0">
          <Button type="secondary" size="md" label="Annuler" @click="closeReseauDrawer" />
          <Button type="primary" size="md" label="Enregistrer" @click="saveReseau" />
        </div>
      </aside>
    </Transition>

    <!-- ── Network picker panel (Figma 6010-29165) — sits left of the drawer ── -->
    <Transition
      enter-active-class="transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      enter-from-class="opacity-0 translate-x-[16px]"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-[16px]"
    >
      <aside
        v-if="networkPickerOpen && uiStore.networkPickerMode === 'panel'"
        class="fixed top-[8px] bottom-[8px] right-[440px] left-[8px] md:left-[312px] z-30 bg-neutral rounded-[24px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] flex flex-col overflow-clip"
        role="dialog"
        aria-modal="false"
        aria-label="Bloquez des réseaux"
      >
        <!-- Header -->
        <div class="flex flex-col gap-[24px] p-[24px] border-b border-border-neutral-secondary shrink-0">
          <div class="flex flex-col gap-[4px]">
            <p class="font-sans font-semibold text-[20px] leading-[1.5] tracking-[-0.6px] text-text-neutral">
              Bloquez des réseaux
            </p>
            <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
              Désactiver les réseaux sur lesquelles vous ne souhaitez plus permettre la recharge
            </p>
          </div>
          <div class="flex items-center gap-[16px]">
            <div class="flex-1 min-w-0">
              <Input
                v-model="networkPicker.search"
                type="leadingIcon"
                icon="magnifying-glass"
                size="md"
                placeholder="Recherche"
                aria-label="Rechercher un réseau"
              />
            </div>
            <div class="shrink-0 inline-flex items-center gap-[4px] p-[4px] rounded-[8px] bg-neutral-secondary">
              <button
                v-for="tab in speedFilterTabs"
                :key="tab.value"
                type="button"
                :class="[
                  'px-[12px] py-[8px] rounded-[6px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray',
                  networkPicker.filter === tab.value
                    ? 'bg-neutral text-text-neutral shadow-[0px_1px_1px_0px_rgba(0,0,0,0.05)]'
                    : 'bg-transparent text-text-neutral-secondary hover:text-text-neutral',
                ]"
                @click="networkPicker.filter = tab.value"
              >
                {{ tab.label }}
              </button>
            </div>
            <button
              type="button"
              class="shrink-0 inline-flex items-center justify-center gap-[8px] min-h-[44px] px-[16px] py-[8px] rounded-[8px] border border-border-neutral bg-neutral text-text-neutral-secondary font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] hover:bg-neutral-hover transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray active:scale-[0.98]"
            >
              Trier
            </button>
          </div>
        </div>

        <!-- List -->
        <div class="flex-1 min-h-0 overflow-y-auto px-[24px] py-[8px]">
          <div v-if="visibleNetworks.length === 0" class="flex flex-col items-center justify-center py-[48px] gap-[8px] text-center">
            <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
              Aucun réseau trouvé
            </p>
            <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
              Essayez un autre terme de recherche ou ajustez le filtre.
            </p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[16px]">
            <article
              v-for="(net, i) in visibleNetworks"
              :key="net.id"
              role="button"
              tabindex="0"
              :aria-pressed="!isNetworkAuthorized(net.id)"
              :aria-label="`${net.name} — ${isNetworkAuthorized(net.id) ? 'autorisé' : 'bloqué'}. ${fmtStations(net.stations)} stations.`"
              :style="{ animationDelay: `${i * 20}ms` }"
              :class="[
                'anim-fade-up cursor-pointer rounded-[16px] border shadow-sm p-[16px] flex flex-col gap-[12px]',
                'transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out motion-reduce:transition-none',
                'hover:shadow-md hover:-translate-y-[2px]',
                'outline-none focus-visible:shadow-ring-gray',
                isNetworkAuthorized(net.id)
                  ? 'bg-neutral border-border-neutral-secondary hover:border-border-neutral'
                  : 'bg-neutral-secondary border-border-neutral-secondary hover:border-border-neutral',
              ]"
              @click="setNetworkAuthorized(net.id, !isNetworkAuthorized(net.id))"
              @keydown.enter.prevent="setNetworkAuthorized(net.id, !isNetworkAuthorized(net.id))"
              @keydown.space.prevent="setNetworkAuthorized(net.id, !isNetworkAuthorized(net.id))"
            >
              <div class="flex items-start justify-between gap-[12px]">
                <div class="shrink-0 size-[40px] rounded-[12px] border border-border-neutral-tertiary overflow-hidden bg-neutral">
                  <img :src="net.logo" :alt="`Logo ${net.name}`" class="size-full object-cover" loading="lazy" />
                </div>
                <Toggle
                  :model-value="isNetworkAuthorized(net.id)"
                  size="sm"
                  :aria-label="`Autoriser ${net.name}`"
                  @update:model-value="(v) => setNetworkAuthorized(net.id, v)"
                  @click.stop
                />
              </div>
              <div class="flex flex-col gap-[2px] min-w-0">
                <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral truncate">
                  {{ net.name }}
                </p>
                <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
                  <span>{{ fmtStations(net.stations) }} stations </span>
                  <span :class="isNetworkAuthorized(net.id) ? 'text-text-neutral-secondary' : 'text-text-danger-medium font-medium'">
                    {{ isNetworkAuthorized(net.id) ? 'autorisées' : 'bloquées' }}
                  </span>
                </p>
              </div>
            </article>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-[16px] px-[24px] py-[16px] border-t border-border-neutral-secondary shrink-0">
          <p class="flex items-baseline gap-[4px] min-w-0 whitespace-nowrap">
            <span class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral tabular-nums">
              {{ draftBlockedCount }}/{{ networks.length }}
            </span>
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
              Réseaux bloqués
            </span>
          </p>
          <div class="flex items-center gap-[8px]">
            <Button type="secondary" size="md" label="Annuler" @click="cancelNetworkPicker" />
            <Button type="primary" size="md" label="Valider la selection" @click="confirmNetworkPicker" />
          </div>
        </div>
      </aside>
    </Transition>

    <!-- ── Network picker modal (Figma 6010-43377) — centered popup variant ── -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-[200ms] ease-out motion-reduce:transition-none"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-[160ms] ease-out motion-reduce:transition-none"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="networkPickerOpen && uiStore.networkPickerMode === 'modal'"
          class="fixed inset-0 z-[60] bg-black/40"
          aria-hidden="true"
          @click="cancelNetworkPicker"
        />
      </Transition>

      <Transition
        enter-active-class="transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        enter-from-class="opacity-0 scale-[0.96] translate-y-[8px]"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-[0.97] translate-y-[6px]"
      >
        <div
          v-if="networkPickerOpen && uiStore.networkPickerMode === 'modal'"
          class="fixed inset-0 z-[61] flex items-center justify-center p-[24px] pointer-events-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="network-picker-modal-title"
        >
          <div class="pointer-events-auto w-full max-w-[840px] max-h-[calc(100vh-48px)] bg-neutral rounded-[24px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] flex flex-col overflow-clip">
            <!-- Header -->
            <div class="flex flex-col gap-[16px] p-[24px] border-b border-border-neutral-secondary shrink-0">
              <div class="flex items-start justify-between gap-[16px]">
                <div class="shrink-0 size-[37px] rounded-[12px] bg-brand flex items-center justify-center">
                  <Icon name="globe-alt" variant="outline" :size="24" class="text-white" />
                </div>
                <button
                  type="button"
                  class="shrink-0 flex items-center justify-center size-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                  aria-label="Fermer"
                  @click="cancelNetworkPicker"
                >
                  <Icon name="x-mark" variant="outline" :size="20" />
                </button>
              </div>
              <div class="flex flex-col gap-[2px]">
                <p id="network-picker-modal-title" class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                  Bloquez des réseaux
                </p>
                <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Désactiver les réseaux sur lesquelles vous ne souhaitez plus permettre la recharge
                </p>
              </div>
              <div class="flex items-center justify-between gap-[16px] flex-wrap">
                <div class="shrink-0 inline-flex items-center gap-[4px] p-[4px] rounded-[8px] bg-neutral-secondary">
                  <button
                    v-for="tab in speedFilterTabs"
                    :key="tab.value"
                    type="button"
                    :class="[
                      'px-[12px] py-[8px] rounded-[6px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray',
                      networkPicker.filter === tab.value
                        ? 'bg-neutral text-text-neutral shadow-[0px_1px_1px_0px_rgba(0,0,0,0.05)]'
                        : 'bg-transparent text-text-neutral-secondary hover:text-text-neutral',
                    ]"
                    @click="networkPicker.filter = tab.value"
                  >
                    {{ tab.label }}
                  </button>
                </div>
                <div class="flex items-center gap-[8px] shrink-0">
                  <div class="w-[300px] max-w-full">
                    <Input
                      v-model="networkPicker.search"
                      type="leadingIcon"
                      icon="magnifying-glass"
                      size="md"
                      placeholder="Recherche"
                      aria-label="Rechercher un réseau"
                    />
                  </div>
                  <button
                    type="button"
                    class="shrink-0 inline-flex items-center justify-center gap-[8px] min-h-[44px] px-[16px] py-[8px] rounded-[8px] border border-border-neutral bg-neutral text-text-neutral-secondary font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] hover:bg-neutral-hover transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray active:scale-[0.98]"
                  >
                    Trier
                  </button>
                </div>
              </div>
            </div>

            <!-- List (full-width rows, per modal Figma 6010-43377) -->
            <div class="flex-1 min-h-0 overflow-y-auto px-[24px] py-[8px]">
              <div v-if="visibleNetworks.length === 0" class="flex flex-col items-center justify-center py-[48px] gap-[8px] text-center">
                <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                  Aucun réseau trouvé
                </p>
                <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Essayez un autre terme de recherche ou ajustez le filtre.
                </p>
              </div>
              <div v-else class="flex flex-col gap-[8px]">
                <div
                  v-for="net in visibleNetworks"
                  :key="net.id"
                  :class="[
                    'flex items-center gap-[16px] p-[8px] rounded-[16px] transition-colors duration-150 ease-out motion-reduce:transition-none',
                    isNetworkAuthorized(net.id) ? 'bg-neutral' : 'bg-neutral-secondary',
                  ]"
                >
                  <div class="shrink-0 size-[37px] rounded-[12px] border border-border-neutral-tertiary overflow-hidden bg-neutral">
                    <img :src="net.logo" :alt="`Logo ${net.name}`" class="size-full object-cover" loading="lazy" />
                  </div>
                  <div class="flex-1 min-w-0 flex flex-col gap-[2px]">
                    <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral truncate">
                      {{ net.name }}
                    </p>
                    <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
                      <span>{{ fmtStations(net.stations) }} stations </span>
                      <span :class="isNetworkAuthorized(net.id) ? 'text-text-neutral-secondary' : 'text-text-danger-medium'">
                        {{ isNetworkAuthorized(net.id) ? 'autorisées' : 'bloquées' }}
                      </span>
                    </p>
                  </div>
                  <Toggle
                    :model-value="isNetworkAuthorized(net.id)"
                    size="sm"
                    :aria-label="`Autoriser ${net.name}`"
                    @update:model-value="(v) => setNetworkAuthorized(net.id, v)"
                  />
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between gap-[16px] px-[24px] py-[16px] border-t border-border-neutral-secondary shrink-0">
              <p class="flex items-baseline gap-[4px] min-w-0 whitespace-nowrap">
                <span class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral tabular-nums">
                  {{ draftBlockedCount }}/{{ networks.length }}
                </span>
                <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Réseaux bloqués
                </span>
              </p>
              <div class="flex items-center gap-[8px]">
                <Button type="secondary" size="md" label="Annuler" @click="cancelNetworkPicker" />
                <Button type="primary" size="md" label="Valider la selection" @click="confirmNetworkPicker" />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Floating selection pill — adaptive (Supprimer in view, Ajouter in add) -->
    <div class="pointer-events-none fixed left-0 right-0 bottom-[32px] z-40 flex justify-center px-[24px] md:left-[304px] md:px-[32px]">
      <Transition
        enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        enter-from-class="opacity-0 translate-y-[16px]"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-[16px]"
      >
        <div
          v-if="pillVisible"
          class="pointer-events-auto flex items-center justify-between gap-[16px] w-[634px] max-w-full h-[61px] px-[16px] rounded-[8px] bg-[#020408] border border-[#344256] text-[#f1f5f9] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
          role="region"
          aria-label="Actions sur les badges sélectionnés"
        >
          <div class="flex items-center gap-[4px] min-w-0">
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] tabular-nums">
              {{ fmtCount(pillCount) }}
            </span>
            <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px]">
              {{ pillCount > 1 ? 'éléments' : 'élément' }}
            </span>
            <button
              type="button"
              class="ml-[4px] flex items-center justify-center size-[24px] rounded-[6px] text-[#cbd5e1] hover:text-white hover:bg-white/10 transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand"
              aria-label="Effacer la sélection"
              @click="clearPillSelection"
            >
              <Icon name="x-mark" variant="solid" :size="18" />
            </button>
          </div>
          <button
            type="button"
            class="flex items-center gap-[8px] px-[8px] h-[32px] rounded-[8px] text-[#f1f5f9] hover:bg-white/10 transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand"
            @click="runPillAction"
          >
            <Icon :name="isAddingBadges ? 'plus' : 'trash'" variant="outline" :size="20" />
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
              {{ isAddingBadges ? 'Ajouter' : 'Supprimer' }}
            </span>
          </button>
        </div>
      </Transition>
    </div>

    <!-- ── Toast ─────────────────────────────────────────────────────────── -->
    <div class="pointer-events-none fixed top-[24px] right-[24px] z-50">
      <div class="pointer-events-auto">
        <Toast
          v-model="toast.visible"
          :type="toast.kind"
          :title="toast.title"
          :description="toast.description"
          :primary-action-label="toast.primaryActionLabel"
          :secondary-action-label="''"
          @primary-action="onToastPrimary"
          @dismiss="dismissToast"
        />
      </div>
    </div>
  </div>
</template>
