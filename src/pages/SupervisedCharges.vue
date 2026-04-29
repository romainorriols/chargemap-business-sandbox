<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Icon from '../components/ui/Icon.vue'
import Input from '../components/ui/Input.vue'
import Dropdown from '../components/ui/Dropdown.vue'
import Button from '../components/ui/Button.vue'
import Skeleton from '../components/ui/Skeleton.vue'
import TableFooter from '../components/ui/TableFooter.vue'
import Alert from '../components/ui/Alert.vue'
import Toast from '../components/ui/Toast.vue'
import HorizontalTabs, { type HorizontalTab } from '../components/ui/HorizontalTabs.vue'
import { bus } from '../state/bus'
import { isNavV2, V1_PAGE_HEADING } from '../state/nav'

// ─── Data generation ─────────────────────────────────────────────────────────
// Mulberry32 — seeded PRNG so the table is identical across reloads.
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = makeRng(424242)
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rng() * arr.length)]
const between = (min: number, max: number) => min + rng() * (max - min)

// 10 bornes réparties sur 3 zones du site — `pick()` les réutilise sur les 200 lignes,
// ce qui colle à la réalité (une même borne sert de nombreuses recharges).
const STATIONS = [
  { name: 'Place 04', location: 'Parking souterrain' },
  { name: 'Place 11', location: 'Parking souterrain' },
  { name: 'Place 23', location: 'Parking souterrain' },
  { name: 'Place 31', location: 'Parking souterrain' },
  { name: 'Place 12', location: 'Parking visiteurs' },
  { name: 'Place 79', location: 'Parking visiteurs' },
  { name: 'Borne A1', location: 'Quai logistique' },
  { name: 'Borne A2', location: 'Quai logistique' },
  { name: 'Borne B7', location: 'Quai logistique' },
  { name: 'Borne C2', location: 'Quai logistique' },
] as const

const DRIVERS = [
  'John Doe', 'Marie Dupont', 'Pierre Martin', 'Sophie Lefèvre',
  'Lucas Bernard', 'Camille Roux', 'Thomas Garnier', 'Léa Moreau',
] as const

// Modern French plates: AA-NNN-AA. 1 plate per driver = consistent identity per row.
const driverPlate: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  const letters = 'ABCDEFGHJKLMNPQRSTVWXYZ'
  for (const d of DRIVERS) {
    const a = letters[Math.floor(rng() * letters.length)] + letters[Math.floor(rng() * letters.length)]
    const n = String(Math.floor(between(100, 999))).padStart(3, '0')
    const b = letters[Math.floor(rng() * letters.length)] + letters[Math.floor(rng() * letters.length)]
    map[d] = `${a}-${n}-${b}`
  }
  return map
})()

// Domicile reimbursement status — drives the lead-icon badge in the home-charges table.
// 'suspect' = anomaly detected on the charge, reimbursement paused pending analysis.
// Applies across Entreprise / Domicile / Câbles connectés (Entreprise also renders the
// leading status icon column in this case).
type ReimbursementStatus = 'reimbursed' | 'pending' | 'rejected' | 'to-pay' | 'in-progress' | 'suspect'

// Câbles connectés location — where the connected-cable charge took place.
type LocationKind = 'home' | 'away' | 'unknown'

// Journal des autorisations — accept/reject decision the gateway returned at attempt time.
type AuthorizationStatus = 'accepted' | 'rejected'

interface ChargeRow {
  id: string
  zoneName: string
  zoneSubLabel: string
  date: string         // dd/mm/yyyy
  time: string         // HHhmm (Europe/Paris)
  energyKwh: number
  costEur: number
  // Identifiant column — at least one of (driver|plate) is set, OR badge falls back.
  driver: string | null
  plate: string | null
  badgeCode: string | null
  badgeBu: string | null
  durationLabel: string
  revenueEur: number
  // Domicile-specific — driver who initiated the home charge + reimbursement state.
  homeDriver: string
  reimbursementStatus: ReimbursementStatus
  // Câbles connectés-specific — location detected by the connected cable.
  location: LocationKind
  // En-cours / Journal — connection kind of the charge, used by both tabs.
  // liveLine1/2 are populated for every row so the Journal can also use them in column 1.
  inProgress: boolean
  liveLine1: string  // top label (zone name OR driver name)
  liveLine2: string  // bottom label (location, "Câble connecté", "Domicile")
  liveSinceMin: number // elapsed minutes since the charge started (0 if not in-progress)
  liveKind: 'entreprise' | 'cable' | 'home' // also drives the journal "Type" implicit grouping
  // Journal des autorisations — gateway accept/reject + an unknown-badge fallback path.
  authorizationStatus: AuthorizationStatus
  unknownBadge: boolean
  rfid: string | null // populated only when unknownBadge is true (for the hover tooltip)
  // Données partielles — borne/câble qui remonte des valeurs proches de zéro
  // (kWh / coût / durée). Masqué par défaut sur Entreprise / Domicile / Câbles connectés.
  isParasitic: boolean
}

// Badge code is always issued by Chargemap → fixed "CMP" prefix.
function makeBadgeCode(): string {
  const yyMM = `${String(Math.floor(between(20, 26)))}${pad(Math.floor(between(1, 13)))}`
  const serial = String(Math.floor(between(100000, 999999)))
  return `CMP-${yyMM}-${serial}`
}

// Tariff: ~0.305 €/kWh business pricing in France.
const TARIFF_EUR_PER_KWH = 0.305
// Charging power options (kW) — drives duration alongside energy.
const POWERS_KW = [3.7, 7, 11, 22] as const

function pad(n: number) { return n < 10 ? `0${n}` : `${n}` }

// Generate dates descending from "now" backward, ~1.5 charges per day average.
function generateRows(count: number): ChargeRow[] {
  const rows: ChargeRow[] = []
  // Anchor at 2026-04-26 11:39 to match the Figma's most-recent row.
  const NOW_MS = new Date(2026, 3, 26, 11, 39).getTime()
  let anchor = new Date(NOW_MS)
  const buNames = bus.map(b => b.name)
  // Per-run rates — the seeded RNG keeps things reproducible, but the run-time
  // fluctuation makes the dataset feel less hand-tuned. Parasitic readings
  // happen on a few percent of charges; suspect anomalies are marginal.
  const parasiticRate = 0.02 + rng() * 0.03  // 2% – 5%
  const suspectRate   = 0.02 + rng() * 0.02  // 2% – 4%
  for (let i = 0; i < count; i++) {
    // Step back by 4-14 hours per row → dataset spans ~50 days.
    anchor = new Date(anchor.getTime() - between(4, 14) * 60 * 60 * 1000)
    const zone = pick(STATIONS)
    const driverCandidate = pick(DRIVERS)
    // ~3% of rows are "parasitic" — bornes/câbles that occasionally report
    // near-zero energy/cost/duration. The rate is randomized per generator run
    // (between ~2% and ~5%) so the count varies across reloads / scenarios
    // instead of being a hard-coded constant. Marked on every row in the
    // dataset; the Entreprise listing later filters them out (see `filtered`)
    // since parasitic readings only happen on Domicile/Câbles connectés.
    const isParasitic = rng() < parasiticRate
    let energy: number
    let cost: number
    let totalMin: number
    if (isParasitic) {
      energy = Math.round(between(0.02, 0.20) * 100) / 100
      cost = Math.round(energy * TARIFF_EUR_PER_KWH * 100) / 100
      totalMin = Math.max(1, Math.round(between(1, 4)))
      pick(POWERS_KW) // keep the RNG sequence stable for the rest of the row
    } else {
      energy = Math.round(between(5, 48) * 100) / 100
      cost = Math.round(energy * TARIFF_EUR_PER_KWH * 100) / 100
      const power = pick(POWERS_KW)
      totalMin = Math.max(5, Math.round((energy / power) * 60))
    }
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    // Parasitic rows get a sub-hour label ("01min") matching the borne's report;
    // standard rows keep the canonical "HHhMMmin" form.
    const durationLabel = isParasitic ? `${pad(totalMin)}min` : `${pad(h)}h${pad(m)}min`

    // Identifier variant: 50% both, 18% driver only, 18% plate only, 14% badge fallback.
    const r = rng()
    let driver: string | null = null
    let plate: string | null = null
    let badgeCode: string | null = null
    let badgeBu: string | null = null
    if (r < 0.50) {
      driver = driverCandidate
      plate = driverPlate[driverCandidate]
    } else if (r < 0.68) {
      driver = driverCandidate
    } else if (r < 0.86) {
      plate = driverPlate[driverCandidate]
    } else {
      badgeBu = buNames.length ? pick(buNames) : 'Chargemap'
      badgeCode = makeBadgeCode()
    }

    // Reimbursement status (Domicile tab) — derived from the charge's age so the
    // listing tells a coherent story: recent charges are still being processed
    // (à décider / appel de fonds), older ones are resolved (remboursée / non prévu).
    // 'suspect' wins over the age-based assignment: anomaly detected, analysis pending.
    const daysAgo = (NOW_MS - anchor.getTime()) / 86_400_000
    const sr = rng()
    let reimbursementStatus: ReimbursementStatus
    if (rng() < suspectRate) {
      reimbursementStatus = 'suspect'
    } else if (daysAgo < 7) {
      // Just-submitted: pending or to-pay.
      reimbursementStatus = sr < 0.55 ? 'pending' : 'to-pay'
    } else if (daysAgo < 21) {
      // In review: mostly in-progress, some pending leftovers, occasional rejection.
      reimbursementStatus = sr < 0.65 ? 'in-progress' : sr < 0.85 ? 'pending' : 'rejected'
    } else {
      // Resolved: reimbursed mostly, a few rejections.
      reimbursementStatus = sr < 0.92 ? 'reimbursed' : 'rejected'
    }

    // Câbles connectés location — most charges happen at home, some away, occasional unknown.
    const lr = rng()
    const location: LocationKind = lr < 0.70 ? 'home' : lr < 0.90 ? 'away' : 'unknown'

    // Connection kind / display lines — set on every row (Journal uses them too).
    const kr = rng()
    let liveLine1: string
    let liveLine2: string
    let liveKind: ChargeRow['liveKind']
    if (kr < 0.30) {
      liveLine1 = zone.name
      liveLine2 = zone.location
      liveKind = 'entreprise'
    } else if (kr < 0.65) {
      liveLine1 = driverCandidate
      liveLine2 = 'Câble connecté'
      liveKind = 'cable'
    } else {
      liveLine1 = driverCandidate
      liveLine2 = 'Domicile'
      liveKind = 'home'
    }
    // In-progress: the 15 most recent rows are currently active charging sessions.
    const inProgress = i < 15
    const liveSinceMin = inProgress ? Math.max(5, Math.floor(between(5, 240))) : 0

    // Authorization journal — most attempts are accepted; ~7% rejected.
    // Unknown badges (~7%) get an RFID fingerprint instead of a CMP code.
    const authorizationStatus: AuthorizationStatus = rng() < 0.93 ? 'accepted' : 'rejected'
    const unknownBadge = rng() < 0.07
    const rfid: string | null = unknownBadge
      ? Array.from({ length: 14 }, () => '0123456789ABCDEF'[Math.floor(rng() * 16)]).join('')
      : null

    rows.push({
      id: `c-${i + 1}`,
      zoneName: zone.name,
      zoneSubLabel: zone.location,
      date: `${pad(anchor.getDate())}/${pad(anchor.getMonth() + 1)}/${anchor.getFullYear()}`,
      time: `${pad(anchor.getHours())}h${pad(anchor.getMinutes())}`,
      energyKwh: energy,
      costEur: cost,
      driver,
      plate,
      badgeCode,
      badgeBu,
      durationLabel,
      revenueEur: 0, // Entreprise tab → no revenue per the Figma reference.
      homeDriver: driverCandidate,
      reimbursementStatus,
      location,
      inProgress,
      liveLine1,
      liveLine2,
      liveSinceMin,
      liveKind,
      authorizationStatus,
      unknownBadge,
      rfid,
      isParasitic,
    })
  }
  // Visibility guarantee — for each tab-scoped listing (entreprise / home /
  // cable), if the seeded RNG happened to produce zero suspect rows in the
  // tab's first page, promote one to suspect so the indicator is reachable
  // without paginating. We pick a non-parasitic row to avoid stacking two
  // anomaly markers on the same line.
  for (const kind of ['entreprise', 'home', 'cable'] as const) {
    const firstPage = rows.filter(r => r.liveKind === kind).slice(0, 15)
    if (firstPage.length === 0) continue
    if (firstPage.some(r => r.reimbursementStatus === 'suspect')) continue
    const seed = firstPage.find(r => !r.isParasitic && r.reimbursementStatus !== 'suspect')
    if (seed) seed.reimbursementStatus = 'suspect'
  }
  return rows
}

const charges = ref<ChargeRow[]>(generateRows(200))

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = computed<HorizontalTab[]>(() => [
  { id: 'en-cours',    label: 'Recharges en cours', count: inProgressCount.value },
  { id: 'entreprise',  label: 'Entreprise' },
  { id: 'domicile',    label: 'Domicile' },
  { id: 'cable',       label: 'Câble connectés' },
  { id: 'auth-journal',label: 'Journal des autorisations' },
])
const activeTab = ref('entreprise')

// ─── Filters ─────────────────────────────────────────────────────────────────
// Entreprise tab: Recherche + Date. Domicile tab: Recherche + Date + États.
const search = ref('')
const dateFilter = ref('')
const statusFilter = ref<string[]>([])
const locationFilter = ref<string[]>([])
const liveKindFilter = ref<string[]>([])
const badgeKnownFilter = ref<string[]>([])
const authorizationFilter = ref<string[]>([])
// Recharges parasites — affichées par défaut. Le bandeau permet de les masquer.
const hideParasitic = ref(false)

const dateItems = [
  { value: '',     label: 'Toutes les dates' },
  { value: '7d',   label: '7 derniers jours' },
  { value: '30d',  label: '30 derniers jours' },
  { value: '90d',  label: '90 derniers jours' },
]
const ALL_STATUS_ITEMS = [
  { value: 'reimbursed',  label: 'Recharge remboursée' },
  { value: 'pending',     label: 'Remboursement prévu' },
  { value: 'in-progress', label: 'Remboursement en cours' },
  { value: 'to-pay',      label: 'Appel de fonds à payer' },
  { value: 'rejected',    label: 'Remboursement non prévu' },
  { value: 'suspect',     label: 'Recharge suspecte' },
]
const locationItems = [
  { value: 'home',    label: 'Domicile' },
  { value: 'away',    label: 'Hors domicile' },
  { value: 'unknown', label: 'Inconnu' },
]
const liveKindItems = [
  { value: 'entreprise', label: 'Entreprise' },
  { value: 'home',       label: 'Domicile' },
  { value: 'cable',      label: 'Câble connecté' },
]
const badgeKnownItems = [
  { value: 'known',   label: 'Badges connus' },
  { value: 'unknown', label: 'Badges inconnus' },
]
const authorizationItems = [
  { value: 'accepted', label: 'Acceptée' },
  { value: 'rejected', label: 'Rejetée' },
]

const isDomicile = computed(() => activeTab.value === 'domicile')
const isCable = computed(() => activeTab.value === 'cable')
// Tabs that share the home-charges domain (status icon, "Décider des remboursements", États filter).
const isHomeDomain = computed(() => isDomicile.value || isCable.value)
const isInProgressTab = computed(() => activeTab.value === 'en-cours')
const isAuthJournalTab = computed(() => activeTab.value === 'auth-journal')
// Tabs where parasitic-data filtering is meaningful: Domicile + Câbles connectés only.
// Excluded:
// - Entreprise (parasitic readings don't occur on entreprise stations)
// - Recharges en cours (values aren't final yet)
// - Journal des autorisations (tracks gateway accept/reject, not metering)
const supportsParasiticFilter = computed(() => isHomeDomain.value)
// Leading status icon column — Entreprise (suspect-only) + Domicile + Câbles connectés.
const hasStatusColumn = computed(() =>
  activeTab.value === 'entreprise' || isHomeDomain.value,
)

// Total live charges — drives the count badge on the "Recharges en cours" tab.
const inProgressCount = computed(() => charges.value.filter(c => c.inProgress).length)

// In decision mode, the États dropdown is restricted to the two actionable statuses.
const statusItems = computed(() => decisionMode.value
  ? ALL_STATUS_ITEMS.filter(s => s.value === 'pending' || s.value === 'rejected')
  : ALL_STATUS_ITEMS,
)

// ─── Decision mode ──────────────────────────────────────────────────────────
// Triggered from the "Décider des remboursements" header button. Filters the
// listing to actionable rows (pending/rejected), enables row selection via a
// new leading checkbox column, and shows a floating bulk-action bar.
const decisionMode = ref(false)
const decisionInfoVisible = ref(true)
const selectedRowIds = ref<Set<string>>(new Set())
// Snapshot the actionable rows when decision mode opens. Rows already-decided in this
// session stay visible with their new status icon — the cohort is frozen at entry,
// so we don't lose what we just acted on.
const decisionCohortIds = ref<Set<string>>(new Set())

function enterDecisionMode() {
  decisionMode.value = true
  decisionInfoVisible.value = true
  decisionCohortIds.value = new Set(
    charges.value
      .filter(c => c.reimbursementStatus === 'pending' || c.reimbursementStatus === 'rejected')
      .map(c => c.id),
  )
  selectedRowIds.value = new Set()
  // Drop any earlier status selection that may now be invalid (e.g. "Remboursée").
  statusFilter.value = statusFilter.value.filter(v => v === 'pending' || v === 'rejected')
  page.value = 1
}
function exitDecisionMode() {
  decisionMode.value = false
  selectedRowIds.value = new Set()
  decisionCohortIds.value = new Set()
}
// Leave decision mode automatically if the user navigates away from the home domain.
watch(isHomeDomain, on => { if (!on) exitDecisionMode() })

function toggleRow(id: string) {
  const next = new Set(selectedRowIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedRowIds.value = next
}
function isRowSelected(id: string) {
  return selectedRowIds.value.has(id)
}
const allVisibleSelected = computed(() =>
  paginated.value.length > 0 && paginated.value.every(c => selectedRowIds.value.has(c.id)),
)
const someVisibleSelected = computed(() =>
  paginated.value.some(c => selectedRowIds.value.has(c.id)) && !allVisibleSelected.value,
)
function toggleSelectAllVisible() {
  const next = new Set(selectedRowIds.value)
  if (allVisibleSelected.value) {
    paginated.value.forEach(c => next.delete(c.id))
  } else {
    paginated.value.forEach(c => next.add(c.id))
  }
  selectedRowIds.value = next
}
function clearSelection() {
  selectedRowIds.value = new Set()
}

// Toast feedback for bulk decisions — top-right overlay, auto-hides after 4s.
const toast = reactive<{ visible: boolean; title: string; description: string }>({
  visible: false,
  title: '',
  description: '',
})
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(title: string, description: string) {
  toast.title = title
  toast.description = description
  toast.visible = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.visible = false }, 4000)
}

// Bulk actions — mutate the selected rows' status, fire a confirmation toast, exit decision mode.
function bulkSetStatus(next: ReimbursementStatus) {
  const ids = selectedRowIds.value
  const count = ids.size
  if (count === 0) return
  charges.value.forEach(c => {
    if (ids.has(c.id)) c.reimbursementStatus = next
  })
  const noun = count > 1 ? 'recharges marquées' : 'recharge marquée'
  if (next === 'pending') {
    showToast(
      `${count} ${noun} Remboursement prévu`,
      'Elles seront incluses dans l\'appel de fonds du mois suivant.',
    )
  } else if (next === 'rejected') {
    showToast(
      `${count} ${noun} Remboursement non prévu`,
      'Aucun remboursement ne sera effectué pour ces recharges.',
    )
  }
  // Confirmation = end of the decision session. Toast persists (independent state).
  exitDecisionMode()
}

// Apply every filter EXCEPT the parasitic toggle. Used both to count hidden parasitic
// rows in the current scope (so the strip only shows when there's actually something to
// reveal) and as the source for the final `filtered` computation.
const filteredExceptParasitic = computed(() => {
  const q = search.value.trim().toLowerCase()
  // Date cutoff (in days from 2026-04-26 anchor — matches the dataset).
  const anchorMs = new Date(2026, 3, 26, 23, 59).getTime()
  const cutoff = (() => {
    if (dateFilter.value === '7d') return anchorMs - 7 * 86_400_000
    if (dateFilter.value === '30d') return anchorMs - 30 * 86_400_000
    if (dateFilter.value === '90d') return anchorMs - 90 * 86_400_000
    return null
  })()

  return charges.value.filter(c => {
    // En-cours tab shows only currently-active charging sessions.
    if (isInProgressTab.value && !c.inProgress) return false
    // Tab-scoped row sets — each listing gets its own subset of the dataset
    // (~30% entreprise / ~35% home / ~35% cable) so the 3 tabs are not the
    // same listing copy-pasted under a different header.
    if (activeTab.value === 'entreprise' && c.liveKind !== 'entreprise') return false
    if (isDomicile.value && c.liveKind !== 'home') return false
    if (isCable.value && c.liveKind !== 'cable') return false
    // Decision mode pins the visible set to the cohort captured at entry, so rows
    // the user just decided keep their place (with their new status icon).
    if (decisionMode.value && !decisionCohortIds.value.has(c.id)) return false
    if (q) {
      const haystack = [c.zoneName, c.driver, c.plate, c.badgeCode, c.badgeBu, c.homeDriver]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    if (cutoff !== null) {
      const [d, m, y] = c.date.split('/').map(Number)
      const ts = new Date(y, m - 1, d).getTime()
      if (ts < cutoff) return false
    }
    // Status filter applies on home-domain tabs and inside decision mode (filtered to pending/rejected at the dropdown level).
    if ((isHomeDomain.value || decisionMode.value) && statusFilter.value.length && !statusFilter.value.includes(c.reimbursementStatus)) return false
    if (isCable.value && locationFilter.value.length && !locationFilter.value.includes(c.location)) return false
    if (isInProgressTab.value && liveKindFilter.value.length && !liveKindFilter.value.includes(c.liveKind)) return false
    if (isAuthJournalTab.value) {
      if (badgeKnownFilter.value.length) {
        const isKnown = c.unknownBadge ? 'unknown' : 'known'
        if (!badgeKnownFilter.value.includes(isKnown)) return false
      }
      if (authorizationFilter.value.length && !authorizationFilter.value.includes(c.authorizationStatus)) return false
    }
    return true
  })
})

const filtered = computed(() => {
  // Entreprise: parasitic readings don't occur on entreprise stations — always strip.
  if (activeTab.value === 'entreprise') {
    return filteredExceptParasitic.value.filter(c => !c.isParasitic)
  }
  // Domicile / Câbles connectés: respect the user's strip toggle.
  if (supportsParasiticFilter.value && hideParasitic.value) {
    return filteredExceptParasitic.value.filter(c => !c.isParasitic)
  }
  return filteredExceptParasitic.value
})

// Number of parasitic rows present in the current scope — drives the visibility of
// the in-table strip ("X recharges aux données partielles masquées · Afficher").
const parasiticInScopeCount = computed(() =>
  supportsParasiticFilter.value
    ? filteredExceptParasitic.value.filter(c => c.isParasitic).length
    : 0,
)

const page = ref(1)
const perPage = 15
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated = computed(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})
const rangeStart = computed(() => (filtered.value.length === 0 ? 0 : (page.value - 1) * perPage + 1))
const rangeEnd = computed(() => Math.min(page.value * perPage, filtered.value.length))

// Reset to page 1 when filters or active tab change.
function resetPage() { page.value = 1 }
watch(activeTab, () => {
  page.value = 1
  // Switching tabs always leaves decision mode — its cohort belongs to the previous tab's listing.
  if (decisionMode.value) exitDecisionMode()
})
// Toggling the parasitic strip also resets pagination — the row set changes size.
watch(hideParasitic, () => { page.value = 1 })

// Tooltip — teleported to <body> so it isn't clipped by the table card's overflow-clip.
// Two flavours, picked by whether `title` is set:
//   - simple (no title): 1+ lines, semibold/medium body, nowrap (status labels, "Badge inconnu")
//   - rich (title set):  bold title in primary white + body in muted secondary, wraps up to 290px
const statusTip = ref<{ x: number; y: number; title?: string; lines: string[] } | null>(null)
function showStatusTip(
  event: MouseEvent | FocusEvent,
  label: string | string[],
  options: { title?: string } = {},
) {
  const el = event.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  const lines = Array.isArray(label) ? label : [label]
  statusTip.value = { x: r.left + r.width / 2, y: r.top - 8, lines, title: options.title }
}
function hideStatusTip() { statusTip.value = null }

// Convenience wrapper — pulls the right tooltip shape out of statusConfig: rich (title +
// body) when the status defines a description, simple (label only) otherwise.
function showStatusForRow(event: MouseEvent | FocusEvent, status: ReimbursementStatus) {
  const cfg = statusConfig(status)
  if ('description' in cfg && cfg.description) {
    showStatusTip(event, [cfg.description], { title: cfg.label })
  } else {
    showStatusTip(event, cfg.label)
  }
}

// Reimbursement status badge — exact tokens from Figma 5169-95182 (lime/indigo/slate fills, all lowercase for Tailwind arbitrary values).
// `description` is set for statuses that warrant a richer two-part tooltip (title + body).
const statusConfig = (s: ReimbursementStatus) => {
  switch (s) {
    case 'reimbursed':
      return { bg: 'bg-[#f7fee7]', icon: 'check-circle',             fg: 'text-[#82cb15]', label: 'Recharge remboursée' }
    case 'pending':
      return { bg: 'bg-[#f0f3ff]', icon: 'currency-euro',            fg: 'text-[#6467f2]', label: 'Remboursement prévu' }
    case 'rejected':
      return { bg: 'bg-[#f8fafc]', icon: 'currency-euro-slash',      fg: 'text-[#65758b]', label: 'Remboursement non prévu' }
    case 'to-pay':
      return { bg: 'bg-[#f8fafc]', icon: 'clipboard-document-list',  fg: 'text-[#65758b]', label: 'Appel de fonds à payer' }
    case 'in-progress':
      return { bg: 'bg-[#faf5ff]', icon: 'switch-horizontal',        fg: 'text-[#7c3bed]', label: 'Remboursement en cours' }
    case 'suspect':
      return {
        bg: 'bg-[#fff0f1]', icon: 'exclamation-triangle', fg: 'text-[#f43e5c]', label: 'Recharge suspecte',
        description: "Une anomalie a été détectée sur cette recharge. Nous sommes en cours d'analyse. Le remboursement sera traité après correction.",
      }
  }
}

// Câbles connectés location pill — colored avatar circle (same brand color across all 3) + label.
const locationConfig = (k: LocationKind) => {
  switch (k) {
    case 'home':    return { label: 'Domicile',      icon: 'home',                 dotBg: 'bg-brand' }
    case 'away':    return { label: 'Hors domicile', icon: 'highway',              dotBg: 'bg-brand' }
    case 'unknown': return { label: 'Inconnu',       icon: 'question-mark-circle', dotBg: 'bg-brand' }
  }
}

// Currency formatter (FR locale — comma as decimal separator).
const fmtAmount = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtEnergy = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// "Depuis 1h22min" / "Depuis 22min" — chooses h+min or min depending on duration.
function liveSinceLabel(totalMin: number): string {
  if (totalMin < 60) return `${totalMin}min`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h${m.toString().padStart(2, '0')}min`
}

// Skeleton loading
const isLoading = ref(true)
onMounted(() => { setTimeout(() => { isLoading.value = false }, 600) })
const skeletonRows = Array.from({ length: 12 }, (_, i) => i)
</script>

<template>
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]">
    <div class="mx-auto w-full max-w-[1500px] flex flex-col gap-[28px]">

      <!-- Page header -->
      <div class="flex items-center justify-between gap-[16px] anim-fade-up" style="animation-delay: 0ms">
        <h1
          :class="isNavV2
            ? 'font-heading font-semibold text-[28px] leading-[1.3] tracking-[-0.84px] text-text-neutral'
            : V1_PAGE_HEADING"
        >
          {{ isAuthJournalTab ? 'Journal des autorisations'
            : isInProgressTab ? 'Recharges en cours'
            : isCable ? 'Recharges câbles connectés'
            : isDomicile ? 'Recharges domicile'
            : 'Recharges entreprise' }}
        </h1>
        <div class="flex items-center gap-[12px]">
          <Button type="secondary" size="md" label="Exporter" icon-left="arrow-down-tray" />
          <Button
            v-if="isHomeDomain && !decisionMode"
            type="primary"
            size="md"
            label="Décider des remboursements"
            @click="enterDecisionMode"
          />
          <Button
            v-if="isHomeDomain && decisionMode"
            type="primary"
            size="md"
            label="Quitter"
            @click="exitDecisionMode"
          />
        </div>
      </div>

      <!-- Tabs -->
      <div class="anim-fade-up" style="animation-delay: 40ms">
        <HorizontalTabs
          :tabs="TABS"
          v-model="activeTab"
          variant="underline"
        />
      </div>

      <!-- Decision-mode info banner -->
      <Alert
        v-if="decisionMode && decisionInfoVisible"
        v-model="decisionInfoVisible"
        type="brand"
        title="Décider des remboursements"
        description="Sélectionnez des recharges puis choisissez Rembourser ou Ne pas rembourser. Vous avez jusqu'au 4 du mois pour décider. Après le 4, toute recharge marquée Rembourser sera incluse dans l'appel de fonds du mois suivant."
        primary-action-label="J'ai compris"
        secondary-action-label="Voir la doc"
        :dismissable="true"
        @primary-action="decisionInfoVisible = false"
      />

      <!-- Filter row -->
      <div
        class="relative z-20 flex items-center gap-[16px] flex-wrap anim-fade-up"
        style="animation-delay: 80ms"
      >
        <div class="w-[260px]">
          <Input
            v-model="search"
            type="leadingIcon"
            icon="magnifying-glass"
            placeholder="Recherche"
            @input="resetPage"
          />
        </div>
        <div class="w-[260px]">
          <Dropdown
            v-model="dateFilter"
            :items="dateItems"
            input-type="leadingIcon"
            icon="calendar"
            :searchable="false"
            placeholder="Date"
            :show-label="false"
            :show-hint="false"
            @update:model-value="resetPage"
          />
        </div>
        <div v-if="isHomeDomain" class="w-[260px]">
          <Dropdown
            v-model="statusFilter"
            :items="statusItems"
            input-type="leadingIcon"
            menu-type="multiselect"
            icon="check-circle"
            :searchable="false"
            :placeholder="statusFilter.length ? `${statusFilter.length} états sélectionnés` : 'États: Tous'"
            :show-label="false"
            :show-hint="false"
            @update:model-value="resetPage"
          />
        </div>
        <div v-if="isCable" class="w-[260px]">
          <Dropdown
            v-model="locationFilter"
            :items="locationItems"
            input-type="leadingIcon"
            menu-type="multiselect"
            icon="map-pin"
            :searchable="false"
            :placeholder="locationFilter.length ? `${locationFilter.length} lieux sélectionnés` : 'Lieux: Tous'"
            :show-label="false"
            :show-hint="false"
            @update:model-value="resetPage"
          />
        </div>
        <div v-if="isInProgressTab" class="w-[260px]">
          <Dropdown
            v-model="liveKindFilter"
            :items="liveKindItems"
            input-type="leadingIcon"
            menu-type="multiselect"
            icon="bolt"
            :searchable="false"
            :placeholder="liveKindFilter.length ? `${liveKindFilter.length} types sélectionnés` : 'Type: Tous'"
            :show-label="false"
            :show-hint="false"
            @update:model-value="resetPage"
          />
        </div>
        <div v-if="isAuthJournalTab" class="w-[260px]">
          <Dropdown
            v-model="badgeKnownFilter"
            :items="badgeKnownItems"
            input-type="leadingIcon"
            menu-type="multiselect"
            icon="check-circle"
            :searchable="false"
            :placeholder="badgeKnownFilter.length ? `${badgeKnownFilter.length} badges sélectionnés` : 'Badges: Tous'"
            :show-label="false"
            :show-hint="false"
            @update:model-value="resetPage"
          />
        </div>
        <div v-if="isAuthJournalTab" class="w-[260px]">
          <Dropdown
            v-model="authorizationFilter"
            :items="authorizationItems"
            input-type="leadingIcon"
            menu-type="multiselect"
            icon="wifi"
            :searchable="false"
            :placeholder="authorizationFilter.length ? `${authorizationFilter.length} autorisations sélectionnées` : 'Autorisation: Toutes'"
            :show-label="false"
            :show-hint="false"
            @update:model-value="resetPage"
          />
        </div>
      </div>

      <!-- Données partielles bandeau — extracted from the table card and floats
           above it as its own pill so it scales cleanly across listing widths.
           Only on Entreprise / Domicile / Câbles connectés, when parasitic rows
           are present in scope. -->
      <Transition
        enter-active-class="transition-[opacity,max-height,margin] duration-200 ease-out"
        enter-from-class="opacity-0 max-h-0 -mt-[28px]"
        enter-to-class="opacity-100 max-h-[80px] mt-0"
        leave-active-class="transition-[opacity,max-height,margin] duration-150 ease-out"
        leave-from-class="opacity-100 max-h-[80px] mt-0"
        leave-to-class="opacity-0 max-h-0 -mt-[28px]"
      >
        <div
          v-if="supportsParasiticFilter && !isLoading && parasiticInScopeCount > 0"
          class="w-full flex items-center gap-[16px] px-[16px] py-[16px] bg-neutral-tertiary border border-border-neutral-tertiary rounded-[16px] overflow-hidden anim-fade-up -mt-[12px]"
          style="animation-delay: 120ms"
        >
          <div class="flex flex-1 min-w-px items-center gap-[8px]">
            <Icon
              :name="hideParasitic ? 'eye-slash' : 'wifi-exclamation'"
              variant="outline"
              :size="18"
              class="text-icon-neutral-secondary shrink-0"
            />
            <p class="font-sans text-[14px] leading-[1.5] tracking-[-0.42px] whitespace-nowrap">
              <span class="font-medium text-text-neutral">Recharges</span>
              <span class="font-normal text-text-neutral-secondary">
                parasites {{ hideParasitic ? 'masquées' : 'affichées' }}
              </span>
            </p>
            <span
              tabindex="0"
              class="inline-flex shrink-0 outline-none rounded-[4px] focus-visible:shadow-ring-gray"
              aria-label="À propos des recharges parasites"
              @mouseenter="showStatusTip($event, ['Recharges dont la borne ou le câble', 'remonte des valeurs proches de zéro'])"
              @mouseleave="hideStatusTip"
              @focusin="showStatusTip($event, ['Recharges dont la borne ou le câble', 'remonte des valeurs proches de zéro'])"
              @focusout="hideStatusTip"
            >
              <Icon
                name="information-circle"
                variant="outline"
                :size="16"
                class="text-icon-neutral-secondary"
              />
            </span>
          </div>
          <button
            type="button"
            class="shrink-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-[#1e40af] hover:underline outline-none rounded-[4px] focus-visible:shadow-ring-brand transition-colors"
            @click="hideParasitic = !hideParasitic"
          >
            {{ hideParasitic ? 'Afficher' : 'Masquer' }}
          </button>
        </div>
      </Transition>

      <!-- Table card -->
      <section
        :class="[
          'w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-clip anim-fade-up',
          supportsParasiticFilter && !isLoading && parasiticInScopeCount > 0 ? '-mt-[12px]' : '',
        ]"
        style="animation-delay: 120ms"
      >
        <!-- Header row — Journal des autorisations -->
        <div v-if="isAuthJournalTab" class="flex items-stretch w-full bg-neutral-tertiary min-h-[40px]">
          <!-- Status icon column (no header label) -->
          <div class="w-[64px] shrink-0 px-[16px] py-[8px]" />
          <div class="flex-[292] min-w-[200px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Zone de recharge
          </div>
          <div class="flex-[292] min-w-px px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Date
          </div>
          <div class="flex-[292] min-w-[200px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Badge
          </div>
          <div class="w-[156px] shrink-0 px-[16px] py-[8px] flex items-center justify-end font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Actions
          </div>
        </div>

        <!-- Header row — Recharges en cours -->
        <div v-else-if="isInProgressTab" class="flex items-stretch w-full bg-neutral-tertiary min-h-[40px]">
          <div class="flex-[222] min-w-[200px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Zone de recharge
          </div>
          <div class="flex-[222] min-w-[140px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Date
          </div>
          <div class="flex-[222] min-w-px px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Énergie
          </div>
          <div class="flex-[222] min-w-[180px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Badge
          </div>
          <div class="w-[220px] shrink-0 px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Progression
          </div>
        </div>

        <!-- Header row — Entreprise variant -->
        <div v-else-if="!isHomeDomain" class="flex items-stretch w-full bg-neutral-tertiary min-h-[40px]">
          <!-- Status icon column (no header label) — only renders an icon for suspect rows -->
          <div class="w-[64px] shrink-0 px-[16px] py-[8px]" />
          <div class="flex-[200] min-w-[180px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Zone de recharge
          </div>
          <div class="flex-[137] min-w-[180px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Date
          </div>
          <div class="flex-[137] min-w-px px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Énergie
          </div>
          <div class="flex-[137] min-w-px px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Coût
          </div>
          <div class="flex-[200] min-w-[180px] px-[16px] py-[8px] flex items-center gap-[8px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            <span
              class="relative inline-flex shrink-0 group/tip outline-none"
              tabindex="0"
              aria-describedby="tip-identifiant"
            >
              <Icon
                name="information-circle"
                variant="outline"
                :size="16"
                class="text-icon-neutral-secondary"
              />
              <span
                id="tip-identifiant"
                role="tooltip"
                class="pointer-events-none absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-30 w-max max-w-[280px] px-[12px] py-[8px] rounded-[8px] bg-text-neutral text-[#f1f5f9] whitespace-normal font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] opacity-0 translate-y-[2px] transition-[opacity,transform] duration-150 ease-out group-hover/tip:opacity-100 group-hover/tip:translate-y-0 group-focus-visible/tip:opacity-100 group-focus-visible/tip:translate-y-0 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:size-0 before:border-l-[8px] before:border-r-[8px] before:border-b-[6px] before:border-l-transparent before:border-r-transparent before:border-b-text-neutral"
              >
                Conducteur et/ou véhicule associé à la recharge. Si aucun n'est renseigné, le badge utilisé est affiché.
              </span>
            </span>
            Identifiant
          </div>
          <div class="flex-[137] min-w-px px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Durée
          </div>
          <div class="flex-[137] min-w-px px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Revenu
          </div>
        </div>

        <!-- Header row — Domicile variant -->
        <div v-else-if="isDomicile" class="flex items-stretch w-full bg-neutral-tertiary min-h-[40px]">
          <!-- Master checkbox (decision mode only) -->
          <div v-if="decisionMode" class="w-[48px] shrink-0 px-[16px] py-[8px] flex items-center">
            <button
              type="button"
              role="checkbox"
              :aria-checked="someVisibleSelected ? 'mixed' : (allVisibleSelected ? 'true' : 'false')"
              class="size-[16px] rounded-[4px] border flex items-center justify-center transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand"
              :class="(allVisibleSelected || someVisibleSelected) ? 'bg-brand border-brand' : 'bg-neutral border-border-neutral-secondary hover:border-border-neutral'"
              @click="toggleSelectAllVisible"
            >
              <Icon v-if="allVisibleSelected" name="check" variant="solid" :size="12" class="text-white" />
              <Icon v-else-if="someVisibleSelected" name="minus" variant="solid" :size="12" class="text-white" />
            </button>
          </div>
          <!-- Status icon column (no header label) -->
          <div class="w-[64px] shrink-0 px-[16px] py-[8px]" />
          <div class="flex-[200] min-w-[180px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Domicile
          </div>
          <div class="flex-[158] min-w-[180px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Date
          </div>
          <div class="flex-[158] min-w-px px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Énergie
          </div>
          <div class="flex-[158] min-w-px px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Coût
          </div>
          <div class="flex-[200] min-w-[180px] px-[16px] py-[8px] flex items-center gap-[8px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            <span
              class="relative inline-flex shrink-0 group/tip outline-none"
              tabindex="0"
              aria-describedby="tip-identifiant-home"
            >
              <Icon
                name="information-circle"
                variant="outline"
                :size="16"
                class="text-icon-neutral-secondary"
              />
              <span
                id="tip-identifiant-home"
                role="tooltip"
                class="pointer-events-none absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-30 w-max max-w-[280px] px-[12px] py-[8px] rounded-[8px] bg-text-neutral text-[#f1f5f9] whitespace-normal font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] opacity-0 translate-y-[2px] transition-[opacity,transform] duration-150 ease-out group-hover/tip:opacity-100 group-hover/tip:translate-y-0 group-focus-visible/tip:opacity-100 group-focus-visible/tip:translate-y-0 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:size-0 before:border-l-[8px] before:border-r-[8px] before:border-b-[6px] before:border-l-transparent before:border-r-transparent before:border-b-text-neutral"
              >
                Conducteur et/ou véhicule associé à la recharge. Si aucun n'est renseigné, le badge utilisé est affiché.
              </span>
            </span>
            Identifiant
          </div>
          <div class="flex-[158] min-w-px px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Durée
          </div>
        </div>

        <!-- Header row — Câbles connectés variant -->
        <div v-else class="flex items-stretch w-full bg-neutral-tertiary min-h-[40px]">
          <!-- Master checkbox (decision mode only) -->
          <div v-if="decisionMode" class="w-[48px] shrink-0 px-[16px] py-[8px] flex items-center">
            <button
              type="button"
              role="checkbox"
              :aria-checked="someVisibleSelected ? 'mixed' : (allVisibleSelected ? 'true' : 'false')"
              class="size-[16px] rounded-[4px] border flex items-center justify-center transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand"
              :class="(allVisibleSelected || someVisibleSelected) ? 'bg-brand border-brand' : 'bg-neutral border-border-neutral-secondary hover:border-border-neutral'"
              @click="toggleSelectAllVisible"
            >
              <Icon v-if="allVisibleSelected" name="check" variant="solid" :size="12" class="text-white" />
              <Icon v-else-if="someVisibleSelected" name="minus" variant="solid" :size="12" class="text-white" />
            </button>
          </div>
          <div class="w-[64px] shrink-0 px-[16px] py-[8px]" />
          <div class="flex-[192] min-w-[180px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Conducteur
          </div>
          <div class="flex-[113] min-w-[180px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Date
          </div>
          <div class="flex-[113] min-w-px px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Énergie
          </div>
          <div class="flex-[113] min-w-px px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Coût
          </div>
          <div class="flex-[200] min-w-[180px] px-[16px] py-[8px] flex items-center gap-[8px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            <span
              class="relative inline-flex shrink-0 group/tip outline-none"
              tabindex="0"
              aria-describedby="tip-identifiant-cable"
            >
              <Icon
                name="information-circle"
                variant="outline"
                :size="16"
                class="text-icon-neutral-secondary"
              />
              <span
                id="tip-identifiant-cable"
                role="tooltip"
                class="pointer-events-none absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-30 w-max max-w-[280px] px-[12px] py-[8px] rounded-[8px] bg-text-neutral text-[#f1f5f9] whitespace-normal font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] opacity-0 translate-y-[2px] transition-[opacity,transform] duration-150 ease-out group-hover/tip:opacity-100 group-hover/tip:translate-y-0 group-focus-visible/tip:opacity-100 group-focus-visible/tip:translate-y-0 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:size-0 before:border-l-[8px] before:border-r-[8px] before:border-b-[6px] before:border-l-transparent before:border-r-transparent before:border-b-text-neutral"
              >
                Conducteur et/ou véhicule associé à la recharge. Si aucun n'est renseigné, le badge utilisé est affiché.
              </span>
            </span>
            Identifiant
          </div>
          <div class="flex-[113] min-w-px px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Durée
          </div>
          <div class="w-[180px] shrink-0 px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Lieu
          </div>
        </div>

        <!-- Skeleton loading -->
        <div v-if="isLoading" class="flex flex-col">
          <div
            v-for="(row, ri) in skeletonRows"
            :key="`sk-${row}`"
            :class="[
              'flex items-stretch w-full min-h-[66px]',
              ri < skeletonRows.length - 1 ? 'border-b border-[#f1f5f9]' : '',
            ]"
          >
            <!-- Status placeholder — present on Entreprise (suspect-only icon) + Domicile + Câbles connectés -->
            <div v-if="hasStatusColumn" class="w-[64px] shrink-0 px-[16px] py-[12px] flex items-center">
              <Skeleton width="32px" height="32px" rounded="8px" />
            </div>
            <div class="flex-[200] min-w-[180px] px-[16px] py-[12px] flex flex-col justify-center gap-[6px]">
              <Skeleton width="160px" height="14px" />
              <Skeleton v-if="!isHomeDomain" width="110px" height="14px" />
            </div>
            <div :class="[isHomeDomain ? 'flex-[158]' : 'flex-[137]', 'min-w-[180px] px-[16px] py-[12px] flex flex-col justify-center gap-[6px]']">
              <Skeleton width="80px" height="14px" />
              <Skeleton width="100px" height="14px" />
            </div>
            <div :class="[isHomeDomain ? 'flex-[158]' : 'flex-[137]', 'min-w-px px-[16px] py-[12px] flex items-center']">
              <Skeleton width="60px" height="14px" />
            </div>
            <div :class="[isHomeDomain ? 'flex-[158]' : 'flex-[137]', 'min-w-px px-[16px] py-[12px] flex items-center']">
              <Skeleton width="50px" height="14px" />
            </div>
            <div class="flex-[200] min-w-[180px] px-[16px] py-[12px] flex flex-col justify-center gap-[6px]">
              <Skeleton width="80px" height="14px" />
              <Skeleton width="80px" height="14px" />
            </div>
            <div :class="[isHomeDomain ? 'flex-[158]' : 'flex-[137]', 'min-w-px px-[16px] py-[12px] flex items-center']">
              <Skeleton width="70px" height="14px" />
            </div>
            <div v-if="!isHomeDomain" class="flex-[137] min-w-px px-[16px] py-[12px] flex items-center">
              <Skeleton width="48px" height="14px" />
            </div>
            <div v-if="isCable" class="w-[180px] shrink-0 px-[16px] py-[12px] flex items-center">
              <Skeleton width="100px" height="24px" rounded="9999px" />
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!filtered.length"
          class="flex items-center justify-center min-h-[200px] px-[16px] py-[24px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary"
        >
          Aucune recharge ne correspond à ces critères.
        </div>

        <!-- Body rows — Journal des autorisations -->
        <TransitionGroup
          v-else-if="isAuthJournalTab"
          name="charges-row"
          tag="div"
          class="flex flex-col"
          move-class="transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        >
          <div
            v-for="(c, ci) in paginated"
            :key="c.id"
            :class="[
              'flex items-stretch w-full min-h-[66px] transition-colors duration-150 ease-out hover:bg-neutral-secondary',
              ci < paginated.length - 1 ? 'border-b border-[#f1f5f9]' : '',
            ]"
          >
            <!-- Status icon (authorization accept/reject) -->
            <div class="w-[64px] shrink-0 px-[16px] py-[12px] flex items-center">
              <span
                tabindex="0"
                class="inline-flex shrink-0 outline-none"
                :aria-label="c.authorizationStatus === 'accepted' ? 'Acceptée' : 'Rejetée'"
                @mouseenter="showStatusTip($event, c.authorizationStatus === 'accepted' ? 'Acceptée' : 'Rejetée')"
                @mouseleave="hideStatusTip"
                @focusin="showStatusTip($event, c.authorizationStatus === 'accepted' ? 'Acceptée' : 'Rejetée')"
                @focusout="hideStatusTip"
              >
                <span
                  :class="[
                    'size-[32px] rounded-[8px] flex items-center justify-center shrink-0',
                    c.authorizationStatus === 'accepted' ? 'bg-[#f7fee7]' : 'bg-[#fff0f1]',
                  ]"
                >
                  <Icon
                    :name="c.authorizationStatus === 'accepted' ? 'check-circle' : 'x-circle'"
                    variant="solid"
                    :size="16"
                    :class="c.authorizationStatus === 'accepted' ? 'text-[#82cb15]' : 'text-[#f43e5c]'"
                  />
                </span>
              </span>
            </div>
            <!-- Driver / connection -->
            <div class="flex-[292] min-w-[200px] px-[16px] py-[12px] flex flex-col justify-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <span class="font-normal text-text-neutral truncate">{{ c.liveLine1 }}</span>
              <span class="font-normal text-text-neutral-secondary truncate">{{ c.liveLine2 }}</span>
            </div>
            <!-- Date / time -->
            <div class="flex-[292] min-w-px px-[16px] py-[12px] flex flex-col justify-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <span class="font-normal text-text-neutral truncate">{{ c.date }}</span>
              <span class="font-normal text-text-neutral-secondary truncate">{{ c.time }}</span>
            </div>
            <!-- Badge — known shows CMP code (link blue), unknown shows neutral text + tooltip with RFID -->
            <div class="flex-[292] min-w-[200px] px-[16px] py-[12px] flex items-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <a
                v-if="!c.unknownBadge"
                href="#"
                class="font-normal text-[#1e40af] hover:underline truncate"
              >
                {{ c.badgeCode || `CMP-2401-${c.id.slice(2).padStart(6, '0')}` }}
              </a>
              <span
                v-else
                tabindex="0"
                class="font-normal text-text-neutral truncate cursor-default outline-none focus-visible:underline"
                @mouseenter="showStatusTip($event, ['Badge privé inconnu de Chargemap Business', `RFID: ${c.rfid}`])"
                @mouseleave="hideStatusTip"
                @focusin="showStatusTip($event, ['Badge privé inconnu de Chargemap Business', `RFID: ${c.rfid}`])"
                @focusout="hideStatusTip"
              >
                Badge inconnu
              </span>
            </div>
            <!-- Actions -->
            <div class="w-[156px] shrink-0 px-[16px] py-[12px] flex items-center justify-end gap-[8px]">
              <!-- "Ajouter le badge à Chargemap Business" — only for unknown badges -->
              <button
                v-if="c.unknownBadge"
                type="button"
                class="size-[36px] flex items-center justify-center rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 outline-none focus-visible:shadow-ring-gray"
                aria-label="Ajouter le badge à Chargemap Business"
                @mouseenter="showStatusTip($event, ['Ajouter le badge à', 'Chargemap Business'])"
                @mouseleave="hideStatusTip"
                @focusin="showStatusTip($event, ['Ajouter le badge à', 'Chargemap Business'])"
                @focusout="hideStatusTip"
              >
                <Icon name="plus" variant="outline" :size="20" />
              </button>
              <!-- "Voir la charge" -->
              <button
                type="button"
                class="size-[36px] flex items-center justify-center rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 outline-none focus-visible:shadow-ring-gray"
                aria-label="Voir la charge"
                @mouseenter="showStatusTip($event, 'Voir la charge')"
                @mouseleave="hideStatusTip"
                @focusin="showStatusTip($event, 'Voir la charge')"
                @focusout="hideStatusTip"
              >
                <Icon name="bolt" variant="outline" :size="20" />
              </button>
              <!-- "Voir la borne" -->
              <button
                type="button"
                class="size-[36px] flex items-center justify-center rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 outline-none focus-visible:shadow-ring-gray"
                aria-label="Voir la borne"
                @mouseenter="showStatusTip($event, 'Voir la borne')"
                @mouseleave="hideStatusTip"
                @focusin="showStatusTip($event, 'Voir la borne')"
                @focusout="hideStatusTip"
              >
                <Icon name="charging-station" variant="outline" :size="20" />
              </button>
            </div>
          </div>
        </TransitionGroup>

        <!-- Body rows — Recharges en cours -->
        <TransitionGroup
          v-else-if="isInProgressTab"
          name="charges-row"
          tag="div"
          class="flex flex-col"
          move-class="transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        >
          <div
            v-for="(c, ci) in paginated"
            :key="c.id"
            :class="[
              'flex items-stretch w-full min-h-[66px] transition-colors duration-150 ease-out hover:bg-neutral-secondary',
              ci < paginated.length - 1 ? 'border-b border-[#f1f5f9]' : '',
            ]"
          >
            <!-- Zone / live source -->
            <div class="flex-[222] min-w-[200px] px-[16px] py-[12px] flex flex-col justify-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <span class="font-normal text-text-neutral truncate">{{ c.liveLine1 }}</span>
              <span class="font-normal text-text-neutral-secondary truncate">{{ c.liveLine2 }}</span>
            </div>
            <!-- Date / time -->
            <div class="flex-[222] min-w-[140px] px-[16px] py-[12px] flex flex-col justify-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <span class="font-normal text-text-neutral truncate">{{ c.date }}</span>
              <span class="font-normal text-text-neutral-secondary truncate">{{ c.time }}</span>
            </div>
            <!-- Énergie -->
            <div class="flex-[222] min-w-px px-[16px] py-[12px] flex items-center font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums whitespace-nowrap">
              {{ fmtEnergy(c.energyKwh) }} kWh
            </div>
            <!-- Badge — driver + plate, fallback uses CMP code (single line). -->
            <div class="flex-[222] min-w-[180px] px-[16px] py-[12px] flex flex-col justify-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <template v-if="c.driver || c.plate">
                <a v-if="c.driver" href="#" class="font-normal text-[#1e40af] hover:underline truncate">{{ c.driver }}</a>
                <a v-if="c.plate" href="#" class="font-normal text-[#1e40af] hover:underline truncate">{{ c.plate }}</a>
              </template>
              <template v-else>
                <a href="#" class="font-normal text-[#1e40af] hover:underline truncate">{{ c.badgeCode }}</a>
              </template>
            </div>
            <!-- Progression — pulsing dots + status + elapsed time -->
            <div class="w-[220px] shrink-0 px-[16px] py-[12px] flex flex-col justify-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <div class="flex items-center gap-[8px]">
                <span class="live-dots" aria-hidden="true">
                  <span /><span /><span />
                </span>
                <span class="font-normal text-text-neutral truncate">Recharge en cours</span>
              </div>
              <span class="font-normal text-text-neutral-secondary truncate">Depuis {{ liveSinceLabel(c.liveSinceMin) }}</span>
            </div>
          </div>
        </TransitionGroup>

        <!-- Body rows — Entreprise variant -->
        <TransitionGroup
          v-else-if="!isHomeDomain"
          name="charges-row"
          tag="div"
          class="flex flex-col"
          move-class="transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        >
          <div
            v-for="(c, ci) in paginated"
            :key="c.id"
            :class="[
              'flex items-stretch w-full min-h-[66px] transition-colors duration-150 ease-out hover:bg-neutral-secondary',
              ci < paginated.length - 1 ? 'border-b border-[#f1f5f9]' : '',
            ]"
          >
            <!-- Status icon — Entreprise charges aren't reimbursed, so only the
                 'suspect' anomaly state ever shows here. Other statuses render
                 as an empty cell (column reserved for layout consistency). -->
            <div class="w-[64px] shrink-0 px-[16px] py-[12px] flex items-center">
              <span
                v-if="c.reimbursementStatus === 'suspect'"
                tabindex="0"
                class="inline-flex shrink-0 outline-none"
                :aria-label="statusConfig('suspect').label"
                @mouseenter="showStatusForRow($event, 'suspect')"
                @mouseleave="hideStatusTip"
                @focusin="showStatusForRow($event, 'suspect')"
                @focusout="hideStatusTip"
              >
                <span :class="['size-[32px] rounded-[8px] flex items-center justify-center shrink-0', statusConfig('suspect').bg]">
                  <Icon
                    :name="statusConfig('suspect').icon"
                    variant="solid"
                    :size="16"
                    :class="statusConfig('suspect').fg"
                  />
                </span>
              </span>
            </div>
            <!-- Zone -->
            <div class="flex-[200] min-w-[180px] px-[16px] py-[12px] flex flex-col justify-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <span class="font-normal text-text-neutral truncate">{{ c.zoneName }}</span>
              <span class="font-normal text-text-neutral-secondary truncate">{{ c.zoneSubLabel }}</span>
            </div>
            <!-- Date / time -->
            <div class="flex-[137] min-w-[180px] px-[16px] py-[12px] flex flex-col justify-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <span class="font-normal text-text-neutral truncate">{{ c.date }}</span>
              <span class="font-normal text-text-neutral-secondary truncate">{{ c.time }} (Europe/Paris)</span>
            </div>
            <!-- Énergie — parasitic rows show a discreet signal-slash icon next to the value -->
            <div class="flex-[137] min-w-px px-[16px] py-[12px] flex items-center gap-[6px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums whitespace-nowrap">
              <span
                v-if="c.isParasitic"
                tabindex="0"
                class="inline-flex shrink-0 outline-none"
                aria-label="Recharge parasite"
                @mouseenter="showStatusTip($event, ['Recharge parasite', 'données proches de zéro'])"
                @mouseleave="hideStatusTip"
                @focusin="showStatusTip($event, ['Recharge parasite', 'données proches de zéro'])"
                @focusout="hideStatusTip"
              >
                <Icon name="signal-slash" variant="outline" :size="14" class="text-icon-neutral-secondary" />
              </span>
              {{ fmtEnergy(c.energyKwh) }} kWh
            </div>
            <!-- Coût -->
            <div class="flex-[137] min-w-px px-[16px] py-[12px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums whitespace-nowrap">
              {{ fmtAmount(c.costEur) }} €
            </div>
            <!-- Identifiant — at least one of (driver|plate); else badge code + BU. Both lines link blue. -->
            <div class="flex-[200] min-w-[180px] px-[16px] py-[12px] flex flex-col justify-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <template v-if="c.driver || c.plate">
                <a v-if="c.driver" href="#" class="font-normal text-[#1e40af] hover:underline truncate">{{ c.driver }}</a>
                <a v-if="c.plate" href="#" class="font-normal text-[#1e40af] hover:underline truncate">{{ c.plate }}</a>
              </template>
              <template v-else>
                <a href="#" class="font-normal text-[#1e40af] hover:underline truncate">{{ c.badgeCode }}</a>
              </template>
            </div>
            <!-- Durée -->
            <div class="flex-[137] min-w-px px-[16px] py-[12px] flex items-center font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums whitespace-nowrap">
              {{ c.durationLabel }}
            </div>
            <!-- Revenu -->
            <div class="flex-[137] min-w-px px-[16px] py-[12px] flex items-center font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums whitespace-nowrap">
              {{ fmtAmount(c.revenueEur) }} €
            </div>
          </div>
        </TransitionGroup>

        <!-- Body rows — Domicile variant -->
        <TransitionGroup
          v-else-if="isDomicile"
          name="charges-row"
          tag="div"
          class="flex flex-col"
          move-class="transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        >
          <div
            v-for="(c, ci) in paginated"
            :key="c.id"
            :class="[
              'flex items-stretch w-full min-h-[66px] transition-colors duration-150 ease-out hover:bg-neutral-secondary',
              ci < paginated.length - 1 ? 'border-b border-[#f1f5f9]' : '',
              isRowSelected(c.id) ? 'bg-brand-surface' : '',
            ]"
          >
            <!-- Row checkbox (decision mode only) -->
            <div v-if="decisionMode" class="w-[48px] shrink-0 px-[16px] py-[12px] flex items-center">
              <button
                type="button"
                role="checkbox"
                :aria-checked="isRowSelected(c.id)"
                class="size-[16px] rounded-[4px] border flex items-center justify-center transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand"
                :class="isRowSelected(c.id) ? 'bg-brand border-brand' : 'bg-neutral border-border-neutral-secondary hover:border-border-neutral'"
                @click="toggleRow(c.id)"
              >
                <Icon v-if="isRowSelected(c.id)" name="check" variant="solid" :size="12" class="text-white" />
              </button>
            </div>
            <!-- Status icon (reimbursement state) — tooltip is teleported to <body> in the root template -->
            <div class="w-[64px] shrink-0 px-[16px] py-[12px] flex items-center">
              <span
                tabindex="0"
                class="inline-flex shrink-0 outline-none"
                :aria-label="statusConfig(c.reimbursementStatus).label"
                @mouseenter="showStatusForRow($event, c.reimbursementStatus)"
                @mouseleave="hideStatusTip"
                @focusin="showStatusForRow($event, c.reimbursementStatus)"
                @focusout="hideStatusTip"
              >
                <span
                  :class="['size-[32px] rounded-[8px] flex items-center justify-center shrink-0', statusConfig(c.reimbursementStatus).bg]"
                >
                  <Icon
                    :name="statusConfig(c.reimbursementStatus).icon"
                    variant="solid"
                    :size="16"
                    :class="statusConfig(c.reimbursementStatus).fg"
                  />
                </span>
              </span>
            </div>
            <!-- Driver name (Domicile column) -->
            <div class="flex-[200] min-w-[180px] px-[16px] py-[12px] flex items-center font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
              {{ c.homeDriver }}
            </div>
            <!-- Date / time -->
            <div class="flex-[158] min-w-[180px] px-[16px] py-[12px] flex flex-col justify-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <span class="font-normal text-text-neutral truncate">{{ c.date }}</span>
              <span class="font-normal text-text-neutral-secondary truncate">{{ c.time }} (Europe/Paris)</span>
            </div>
            <!-- Énergie — parasitic rows show a discreet signal-slash icon next to the value -->
            <div class="flex-[158] min-w-px px-[16px] py-[12px] flex items-center gap-[6px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums whitespace-nowrap">
              <span
                v-if="c.isParasitic"
                tabindex="0"
                class="inline-flex shrink-0 outline-none"
                aria-label="Recharge parasite"
                @mouseenter="showStatusTip($event, ['Recharge parasite', 'données proches de zéro'])"
                @mouseleave="hideStatusTip"
                @focusin="showStatusTip($event, ['Recharge parasite', 'données proches de zéro'])"
                @focusout="hideStatusTip"
              >
                <Icon name="signal-slash" variant="outline" :size="14" class="text-icon-neutral-secondary" />
              </span>
              {{ fmtEnergy(c.energyKwh) }} kWh
            </div>
            <!-- Coût -->
            <div class="flex-[158] min-w-px px-[16px] py-[12px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums whitespace-nowrap">
              {{ fmtAmount(c.costEur) }} €
            </div>
            <!-- Identifiant -->
            <div class="flex-[200] min-w-[180px] px-[16px] py-[12px] flex flex-col justify-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <template v-if="c.driver || c.plate">
                <a v-if="c.driver" href="#" class="font-normal text-[#1e40af] hover:underline truncate">{{ c.driver }}</a>
                <a v-if="c.plate" href="#" class="font-normal text-[#1e40af] hover:underline truncate">{{ c.plate }}</a>
              </template>
              <template v-else>
                <a href="#" class="font-normal text-[#1e40af] hover:underline truncate">{{ c.badgeCode }}</a>
              </template>
            </div>
            <!-- Durée -->
            <div class="flex-[158] min-w-px px-[16px] py-[12px] flex items-center font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums whitespace-nowrap">
              {{ c.durationLabel }}
            </div>
          </div>
        </TransitionGroup>

        <!-- Body rows — Câbles connectés variant -->
        <TransitionGroup
          v-else
          name="charges-row"
          tag="div"
          class="flex flex-col"
          move-class="transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        >
          <div
            v-for="(c, ci) in paginated"
            :key="c.id"
            :class="[
              'flex items-stretch w-full min-h-[66px] transition-colors duration-150 ease-out hover:bg-neutral-secondary',
              ci < paginated.length - 1 ? 'border-b border-[#f1f5f9]' : '',
              isRowSelected(c.id) ? 'bg-brand-surface' : '',
            ]"
          >
            <!-- Row checkbox (decision mode only) -->
            <div v-if="decisionMode" class="w-[48px] shrink-0 px-[16px] py-[12px] flex items-center">
              <button
                type="button"
                role="checkbox"
                :aria-checked="isRowSelected(c.id)"
                class="size-[16px] rounded-[4px] border flex items-center justify-center transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand"
                :class="isRowSelected(c.id) ? 'bg-brand border-brand' : 'bg-neutral border-border-neutral-secondary hover:border-border-neutral'"
                @click="toggleRow(c.id)"
              >
                <Icon v-if="isRowSelected(c.id)" name="check" variant="solid" :size="12" class="text-white" />
              </button>
            </div>
            <!-- Status icon -->
            <div class="w-[64px] shrink-0 px-[16px] py-[12px] flex items-center">
              <span
                tabindex="0"
                class="inline-flex shrink-0 outline-none"
                :aria-label="statusConfig(c.reimbursementStatus).label"
                @mouseenter="showStatusForRow($event, c.reimbursementStatus)"
                @mouseleave="hideStatusTip"
                @focusin="showStatusForRow($event, c.reimbursementStatus)"
                @focusout="hideStatusTip"
              >
                <span
                  :class="['size-[32px] rounded-[8px] flex items-center justify-center shrink-0', statusConfig(c.reimbursementStatus).bg]"
                >
                  <Icon
                    :name="statusConfig(c.reimbursementStatus).icon"
                    variant="solid"
                    :size="16"
                    :class="statusConfig(c.reimbursementStatus).fg"
                  />
                </span>
              </span>
            </div>
            <!-- Conducteur -->
            <div class="flex-[192] min-w-[180px] px-[16px] py-[12px] flex items-center font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
              {{ c.homeDriver }}
            </div>
            <!-- Date / time -->
            <div class="flex-[113] min-w-[180px] px-[16px] py-[12px] flex flex-col justify-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <span class="font-normal text-text-neutral truncate">{{ c.date }}</span>
              <span class="font-normal text-text-neutral-secondary truncate">{{ c.time }} (Europe/Paris)</span>
            </div>
            <!-- Énergie — parasitic rows show a discreet signal-slash icon next to the value -->
            <div class="flex-[113] min-w-px px-[16px] py-[12px] flex items-center gap-[6px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums whitespace-nowrap">
              <span
                v-if="c.isParasitic"
                tabindex="0"
                class="inline-flex shrink-0 outline-none"
                aria-label="Recharge parasite"
                @mouseenter="showStatusTip($event, ['Recharge parasite', 'données proches de zéro'])"
                @mouseleave="hideStatusTip"
                @focusin="showStatusTip($event, ['Recharge parasite', 'données proches de zéro'])"
                @focusout="hideStatusTip"
              >
                <Icon name="signal-slash" variant="outline" :size="14" class="text-icon-neutral-secondary" />
              </span>
              {{ fmtEnergy(c.energyKwh) }} kWh
            </div>
            <!-- Coût -->
            <div class="flex-[113] min-w-px px-[16px] py-[12px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums whitespace-nowrap">
              {{ fmtAmount(c.costEur) }} €
            </div>
            <!-- Identifiant — fallback uses "connect cable {driver}" instead of a CMP badge code on this tab. -->
            <div class="flex-[200] min-w-[180px] px-[16px] py-[12px] flex flex-col justify-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <template v-if="c.driver || c.plate">
                <a v-if="c.driver" href="#" class="font-normal text-[#1e40af] hover:underline truncate">{{ c.driver }}</a>
                <a v-if="c.plate" href="#" class="font-normal text-[#1e40af] hover:underline truncate">{{ c.plate }}</a>
              </template>
              <template v-else>
                <a href="#" class="font-normal text-[#1e40af] hover:underline truncate">connected cable</a>
                <a href="#" class="font-normal text-[#1e40af] hover:underline truncate">{{ c.homeDriver }}</a>
              </template>
            </div>
            <!-- Durée -->
            <div class="flex-[113] min-w-px px-[16px] py-[12px] flex items-center font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums whitespace-nowrap">
              {{ c.durationLabel }}
            </div>
            <!-- Lieu — pill with colored avatar circle + label -->
            <div class="w-[180px] shrink-0 px-[16px] py-[12px] flex items-center">
              <span class="inline-flex items-center gap-[8px] pl-[2px] pr-[8px] py-[2px] rounded-full bg-neutral-secondary border border-border-neutral-secondary">
                <span :class="['inline-flex items-center justify-center size-[21px] rounded-full shrink-0', locationConfig(c.location).dotBg]">
                  <Icon :name="locationConfig(c.location).icon" variant="solid" :size="12" class="text-white" />
                </span>
                <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                  {{ locationConfig(c.location).label }}
                </span>
              </span>
            </div>
          </div>
        </TransitionGroup>

        <!-- Footer -->
        <TableFooter
          v-if="!isLoading && filtered.length"
          :page="page"
          :page-count="pageCount"
          :range-start="rangeStart"
          :range-end="rangeEnd"
          :total="filtered.length"
          @update:page="(n: number) => (page = n)"
        />
      </section>

      <!-- Bulk action bar — sits in the page flow under the table card and sticks
           to the viewport at 32px from the bottom while in view, so it tracks the
           table area instead of being permanently glued to the screen edge. -->
      <Transition
        enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        enter-from-class="opacity-0 translate-y-[8px]"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-150 ease-out"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-[8px]"
      >
        <div
          v-if="decisionMode && selectedRowIds.size > 0"
          class="sticky bottom-[32px] z-50 self-center flex items-center justify-between w-[634px] h-[63px] p-[16px] rounded-[8px] bg-[#020408] border border-[#344256] shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)]"
        >
          <button
            type="button"
            class="flex items-center gap-[4px] outline-none rounded-[4px] focus-visible:shadow-ring-brand"
            @click="clearSelection"
            aria-label="Effacer la sélection"
          >
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-[#f1f5f9] tabular-nums">{{ selectedRowIds.size }}</span>
            <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-[#f1f5f9]">Sélectionnées</span>
            <Icon name="x-mark" variant="solid" :size="18" class="text-[#f1f5f9]" />
          </button>

          <div class="flex items-center gap-[12px]">
            <button
              type="button"
              class="flex items-center gap-[8px] rounded-[8px] outline-none focus-visible:shadow-ring-brand transition-transform duration-150 active:scale-[0.97]"
              @click="bulkSetStatus('pending')"
            >
              <Icon name="check-circle" variant="outline" :size="20" class="text-[#f1f5f9]" />
              <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-[#f1f5f9]">Rembourser</span>
            </button>
            <span class="h-[18px] w-px bg-[#344256]" aria-hidden="true" />
            <button
              type="button"
              class="flex items-center gap-[8px] rounded-[8px] outline-none focus-visible:shadow-ring-brand transition-transform duration-150 active:scale-[0.97]"
              @click="bulkSetStatus('rejected')"
            >
              <Icon name="x-circle" variant="outline" :size="20" class="text-[#f1f5f9]" />
              <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-[#f1f5f9]">Ne pas rembourser</span>
            </button>
          </div>
        </div>
      </Transition>

    </div>

    <!-- Status tooltip — teleported so it escapes the table card's overflow-clip.
         Inline transform handles the centering; opacity-only animation avoids fighting with that transform. -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-150 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-100 ease-out"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="statusTip"
          role="tooltip"
          :class="[
            'pointer-events-none fixed z-50 px-[12px] py-[8px] rounded-[8px] bg-text-neutral font-sans text-[12px] leading-[1.5] tracking-[-0.36px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]',
            statusTip.title
              ? 'flex flex-col gap-[4px] w-max max-w-[290px] text-left'
              : 'w-max max-w-[280px] text-center',
          ]"
          :style="{ left: `${statusTip.x}px`, top: `${statusTip.y - 6}px`, transform: 'translate(-50%, -100%)' }"
        >
          <p
            v-if="statusTip.title"
            class="font-semibold text-[#f1f5f9]"
          >
            {{ statusTip.title }}
          </p>
          <p
            v-for="(line, i) in statusTip.lines"
            :key="i"
            :class="statusTip.title
              ? 'font-normal text-[#94a3b8] whitespace-normal'
              : 'font-medium text-[#f1f5f9] whitespace-nowrap'"
          >
            {{ line }}
          </p>
          <span
            aria-hidden="true"
            class="absolute left-1/2 -translate-x-1/2 top-full block size-0 border-l-[8px] border-r-[8px] border-t-[6px] border-l-transparent border-r-transparent border-t-text-neutral"
          />
        </div>
      </Transition>
    </Teleport>


    <!-- Toast overlay — fired by bulk decision actions, top-right, auto-hides after 4s -->
    <Teleport to="body">
      <div class="pointer-events-none fixed top-[24px] right-[24px] z-[60]">
        <div class="pointer-events-auto">
          <Toast
            v-model="toast.visible"
            type="success"
            :title="toast.title"
            :description="toast.description"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.charges-row-enter-active,
.charges-row-leave-active {
  transition: opacity 200ms ease, transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
}
.charges-row-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.charges-row-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.charges-row-leave-active {
  position: relative;
}

/*
  Live charging "3 dots" loader — pure CSS, no Lottie / no watermark.
  Mirrors the Figma mock (25×6 area, brand-colored dots) with a staggered scale+opacity pulse.
*/
.live-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: 25px;
  height: 6px;
  flex-shrink: 0;
}
.live-dots > span {
  display: block;
  width: 5px;
  height: 5px;
  border-radius: 9999px;
  background-color: var(--brand-base, #2463eb);
  animation: live-dots-pulse 1400ms infinite ease-in-out both;
}
.live-dots > span:nth-child(2) { animation-delay: 160ms; }
.live-dots > span:nth-child(3) { animation-delay: 320ms; }

@keyframes live-dots-pulse {
  0%, 80%, 100% { transform: scale(0.5); opacity: 0.35; }
  40%           { transform: scale(1.0); opacity: 1.0;  }
}

@media (prefers-reduced-motion: reduce) {
  .live-dots > span {
    animation: none;
    opacity: 0.7;
  }
}
</style>
