<script setup lang="ts">
const headingClass = usePageHeadingClass()
const uiStore = useUiStore()
import { ref, computed, reactive, watch, onUnmounted, nextTick } from 'vue'
import type { HorizontalTab } from '~/components/ui/HorizontalTabs.vue'
import superPartnersIcon from '@/assets/logos/chargemap-cm-badge.svg'
import superPartnersSide from '@/assets/illustrations/super-partners-side.png'
import newGroupTipIllustration from '@/assets/illustrations/new-group-tip.png'
import groupHeaderIllustration from '@/assets/illustrations/group-header.svg'

interface BadgeDriver { name: string; initials: string }
interface BadgeVehicle { model: string; plate: string }
interface Badge {
  id: string
  identifier: string
  driver: BadgeDriver | null
  vehicle: BadgeVehicle | null
  itinerance: boolean
  groupId: string | null
  costCenter: string | null
}
interface Group {
  id: string
  name: string
  manager: string
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
const costCenterPool: string[] = [
  'Direction Paris',
  'Direction Lyon',
  'Direction Marseille',
  'Direction Bordeaux',
  'Direction Lille',
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
  // ~60% of badges land on a cost center; the rest stay unassigned (--).
  const hasCostCenter = m % 5 !== 0 && m % 5 !== 3
  return {
    id: `b-${groupId ?? 'pool'}-${slot}`,
    identifier: badgeIdentifier(seedCounter),
    driver:  hasDriver  ? driverPool[(slot * 3 + (groupId?.length ?? 0)) % driverPool.length]   : null,
    vehicle: hasVehicle ? vehiclePool[(slot * 5 + (groupId?.length ?? 0)) % vehiclePool.length] : null,
    itinerance,
    groupId,
    costCenter: hasCostCenter ? costCenterPool[(slot * 7 + (groupId?.length ?? 0)) % costCenterPool.length] : null,
  }
}
function seedBadges(groupId: string | null, count: number): Badge[] {
  return Array.from({ length: count }, (_, i) => makeBadge(groupId, i))
}

const groups = reactive<Group[]>([
  { id: 'g-1', name: 'Convoyeurs Nord-Picardie', manager: 'Théo Garnier' },
  { id: 'g-2', name: 'Équipe SAV Méditerranée',  manager: 'Léa Martin'   },
])

const allBadges = reactive<Badge[]>([
  ...seedBadges('g-1', 47),
  ...seedBadges('g-2', 33),
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
// Badge-row kebab menu lives inside an overflow-clip table, so it gets
// teleported to <body> and positioned with fixed coords captured from
// the trigger button's rect when the menu opens.
const badgeMenuPos = ref({ top: 0, right: 0 })
function toggleMenu(id: string, e: MouseEvent) {
  e.stopPropagation()
  openMenuId.value = openMenuId.value === id ? null : id
}
function toggleBadgeMenu(id: string, e: MouseEvent) {
  e.stopPropagation()
  if (openMenuId.value === id) {
    openMenuId.value = null
    return
  }
  const btn = e.currentTarget as HTMLElement
  const rect = btn.getBoundingClientRect()
  badgeMenuPos.value = {
    top: rect.bottom + 4,
    right: Math.max(8, window.innerWidth - rect.right),
  }
  openMenuId.value = id
}
function closeMenus() { openMenuId.value = null }
if (import.meta.client) {
  // Close the teleported badge menu on scroll/resize so the floating
  // popup never drifts away from its anchor.
  const closeOnViewportChange = () => { if (openMenuId.value) closeMenus() }
  window.addEventListener('scroll', closeOnViewportChange, true)
  window.addEventListener('resize', closeOnViewportChange)
}

// ── Detail view ────────────────────────────────────────────────────────────
const selectedId = ref<string | null>(null)
const selectedGroup = computed(() => groups.find(g => g.id === selectedId.value) ?? null)
function openGroup(id: string) {
  selectedId.value = id
  openMenuId.value = null
}

// ── Settings view (Figma 6042-35774) ──────────────────────────────────────
// Reachable from the listing card's ellipsis menu and from a Paramètres
// pill in the detail-view header. Replaces whichever view was active.
const settingsId = ref<string | null>(null)
const selectedSettingsGroup = computed(() =>
  groups.find(g => g.id === settingsId.value) ?? null,
)
const settingsForm = reactive<{ name: string; manager: string }>({ name: '', manager: '' })
// Mock creation timestamp — not stored per group in this sandbox.
const settingsCreatedAt = '18/10/2025'
const settingsDirty = computed(() => {
  const g = selectedSettingsGroup.value
  if (!g) return false
  return settingsForm.name.trim() !== '' && (
    settingsForm.name !== g.name || settingsForm.manager !== g.manager
  )
})
// Managers offered in the dropdown: every distinct manager currently used
// across the groups list — surfaces existing values without inventing names.
const managerItems = computed(() => {
  const seen = new Set<string>()
  const list: { value: string; label: string }[] = []
  for (const g of groups) {
    if (!seen.has(g.manager)) {
      seen.add(g.manager)
      list.push({ value: g.manager, label: g.manager })
    }
  }
  return list
})

function openSettings(id: string) {
  const g = groups.find(x => x.id === id)
  if (!g) return
  // Settings layers on top of whichever view was active. We keep selectedId
  // intact so exiting drops the user back where they came from.
  settingsId.value = id
  settingsForm.name = g.name
  settingsForm.manager = g.manager
  openMenuId.value = null
}
function exitSettings() {
  settingsId.value = null
  settingsForm.name = ''
  settingsForm.manager = ''
}
function saveSettings() {
  const g = groups.find(x => x.id === settingsId.value)
  if (!g) return
  g.name = settingsForm.name.trim()
  g.manager = settingsForm.manager
  exitSettings()
  showSuccessToast('Paramètres mis à jour', '')
}
function deleteSettingsGroup() {
  if (!settingsId.value) return
  const idx = groups.findIndex(g => g.id === settingsId.value)
  if (idx >= 0) groups.splice(idx, 1)
  exitSettings()
  showSuccessToast('Groupe supprimé', '')
}

// ── Nouveau groupe (Figma 6123-25902) ─────────────────────────────────────
// Full-page creation view layered on top of the listing. Two cards stacked
// vertically: Informations (name + manager) and Composition (filterable
// table of ungrouped badges with multi-select). Saving creates the group,
// rattaches the selected badges, and drops the user back to the listing.
const isCreatingGroup = ref(false)
const createForm = reactive<{ name: string; manager: string }>({ name: '', manager: '' })
// Per-field error flags toggled by saveCreateGroup. Each cleared as soon as
// the user fills the corresponding field, so the error state never lingers.
const createError = reactive<{ name: boolean; manager: boolean }>({ name: false, manager: false })
// Refs on the field wrappers so we can scrollIntoView the first invalid
// field after a failed create attempt.
const createNameFieldRef = ref<HTMLElement | null>(null)
const createManagerFieldRef = ref<HTMLElement | null>(null)
const createSelected = reactive(new Set<string>())
// Group IDs that were created in this session. When the user opens one of
// these for the first time, charging rules are reset to all-disabled so a
// freshly created group never inherits another group's edits.
const newGroupIds = reactive(new Set<string>())

// The "Créer le groupe" CTA is gated on name + manager being set.
const canCreateGroup = computed(() => createForm.name.trim().length > 0 && !!createForm.manager)

function enterCreateGroup() {
  createForm.name = ''
  createForm.manager = ''
  createError.name = false
  createError.manager = false
  createSelected.clear()
  isCreatingGroup.value = true
}
function cancelCreateGroup() {
  isCreatingGroup.value = false
  createForm.name = ''
  createForm.manager = ''
  createError.name = false
  createError.manager = false
  createSelected.clear()
}
function saveCreateGroup() {
  const name = createForm.name.trim()
  const manager = createForm.manager
  createError.name = !name
  createError.manager = !manager
  if (createError.name || createError.manager) {
    // Scroll the first invalid field into view so the user sees the error
    // without hunting for it.
    const target = createError.name ? createNameFieldRef.value : createManagerFieldRef.value
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  const newId = `g-${Date.now()}`
  groups.push({ id: newId, name, manager })
  newGroupIds.add(newId)
  if (createSelected.size > 0) {
    const ids = new Set(createSelected)
    allBadges.forEach((b) => { if (ids.has(b.id)) b.groupId = newId })
  }
  const count = createSelected.size
  cancelCreateGroup()
  // Jump straight into the freshly created group instead of dropping back
  // to the listing — the user almost always wants to keep configuring it
  // (charging rules, settings, etc.).
  selectedId.value = newId
  const detail = count === 0
    ? ''
    : count === 1
      ? '1 badge rattaché'
      : `${count} badges rattachés`
  showSuccessToast('Groupe créé', detail)
  // The "Appliquez des règles de recharge" popover (Figma 6529-39169)
  // is opened by the selectedId watcher when it sees the brand-new id
  // (see `newGroupIds.has(id)`), so the timing is consistent with the
  // skeleton/reset run on first detail entry.
}

// Onboarding tip shown after a fresh group lands on its detail view.
const newGroupTipOpen = ref(false)
const newGroupTipRef = ref<HTMLElement | null>(null)
// Discovery modal opened from the onboarding tip — same illustration,
// fuller copy + bulleted list (Figma 6538-40440). The modal morphs out
// of the tip's bounding box via a FLIP transform on enter.
const rulesDiscoveryOpen = ref(false)
const rulesDiscoveryRef = ref<HTMLElement | null>(null)
let tipRectSnapshot: DOMRect | null = null
function closeNewGroupTip() { newGroupTipOpen.value = false }
function openRulesDiscovery() {
  // Capture the tip's rect (if visible) so the modal can morph out of
  // it. We don't unmount the tip until the modal has rendered so the
  // measurement is accurate.
  tipRectSnapshot = newGroupTipRef.value?.getBoundingClientRect() ?? null
  rulesDiscoveryOpen.value = true
  newGroupTipOpen.value = false
}
function closeRulesDiscovery() {
  rulesDiscoveryOpen.value = false
  tipRectSnapshot = null
}
function discoverChargingRules() {
  activeTab.value = 'charging-rules'
  closeRulesDiscovery()
}
// FLIP enter hook for the discovery modal. Starts the modal at the
// tip's position+size and animates to its centered final layout.
function onRulesDiscoveryEnter(el: Element, done: () => void) {
  const modalEl = el as HTMLElement
  if (!tipRectSnapshot) {
    // No source rect (e.g. modal opened without a visible tip) → just
    // fade in via CSS transition.
    modalEl.style.opacity = '0'
    modalEl.style.transform = 'scale(0.96) translateY(8px)'
    requestAnimationFrame(() => {
      modalEl.style.transition = 'opacity 220ms ease-out, transform 220ms cubic-bezier(0.23,1,0.32,1)'
      modalEl.style.opacity = '1'
      modalEl.style.transform = 'scale(1) translateY(0)'
      const onEnd = () => { modalEl.style.transition = ''; modalEl.removeEventListener('transitionend', onEnd); done() }
      modalEl.addEventListener('transitionend', onEnd, { once: true })
    })
    return
  }
  const from = tipRectSnapshot
  const to = modalEl.getBoundingClientRect()
  const dx = (from.left + from.width / 2) - (to.left + to.width / 2)
  const dy = (from.top + from.height / 2) - (to.top + to.height / 2)
  const sx = from.width / to.width
  const sy = from.height / to.height
  modalEl.style.transformOrigin = 'center center'
  modalEl.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
  modalEl.style.opacity = '0.6'
  modalEl.style.transition = 'none'
  // Force a reflow so the initial transform sticks before we trigger
  // the animation.
  void modalEl.offsetWidth
  requestAnimationFrame(() => {
    modalEl.style.transition = 'transform 380ms cubic-bezier(0.23,1,0.32,1), opacity 200ms ease-out 80ms'
    modalEl.style.transform = 'translate(0, 0) scale(1, 1)'
    modalEl.style.opacity = '1'
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'transform') return
      modalEl.style.transition = ''
      modalEl.style.transform = ''
      modalEl.style.transformOrigin = ''
      modalEl.removeEventListener('transitionend', onEnd)
      done()
    }
    modalEl.addEventListener('transitionend', onEnd)
  })
}
function onRulesDiscoveryLeave(el: Element, done: () => void) {
  const modalEl = el as HTMLElement
  modalEl.style.transition = 'opacity 160ms ease-out, transform 160ms ease-out'
  modalEl.style.opacity = '0'
  modalEl.style.transform = 'scale(0.97) translateY(6px)'
  modalEl.addEventListener('transitionend', () => done(), { once: true })
}
// Clear individual error flags as the user fills each field, so the red
// state disappears immediately on correction rather than waiting for the
// next save attempt.
watch(() => createForm.name, (v) => { if (v.trim()) createError.name = false })
watch(() => createForm.manager, (v) => { if (v) createError.manager = false })

// Loading skeleton (Figma /billing pattern): 600ms simulated fetch on
// every detail entry so the table cross-fades in instead of popping.
const isLoading = ref(false)
let loadingTimer: ReturnType<typeof setTimeout> | null = null
watch(selectedId, (id) => {
  if (loadingTimer) { clearTimeout(loadingTimer); loadingTimer = null }
  // Close the new-group onboarding tip whenever the user leaves the
  // detail it was anchored to.
  newGroupTipOpen.value = false
  if (id) {
    // First visit of a freshly created group: reset charging rules so the
    // group starts with everything désactivé regardless of edits made
    // elsewhere in the session, and surface the onboarding popover.
    if (newGroupIds.has(id)) {
      resetChargingRulesToDisabled()
      newGroupIds.delete(id)
      newGroupTipOpen.value = true
    }
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
  selectedRuleId.value = null
  budgetDrawerOpen.value = false
  autorisationsDrawerOpen.value = false
  vacanceDrawerOpen.value = false
  vacanceForm.creating = false
  vacanceForm.draft.name = ''
  vacanceForm.draft.range = ''
  reseauDrawerOpen.value = false
  networkPickerOpen.value = false
  paysDrawerOpen.value = false
  countryPickerOpen.value = false
  clearUndo()
  dismissToast()
}

// Tabs (Figma 5959-58388)
const detailTabs: HorizontalTab[] = [
  { id: 'informations',   label: 'Infos et composition' },
  { id: 'charging-rules', label: 'Règles de recharge' },
]
const activeTab = ref<string>('informations')

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
  // Mirror of the per-badge pattern (badges-cmb.vue) — each rule either
  // falls back to the BU defaults ('inherited') or has been overridden at
  // the group level ('custom'). Surfaced as a left-side pill on the card.
  origin: 'inherited' | 'custom'
}
// Selected rule (Figma state) — click on a card to toggle the selected
// visual state. Budget de recharge also opens an edit drawer.
const selectedRuleId = ref<string | null>(null)

// Drawer state for the Budget de recharge rule (Figma 5980-29598 / 5980-28115)
const budgetDrawerOpen = ref(false)
// `draftOrigin` mirrors the reseauForm pattern — the Budget+Alerte rule
// flips between inherited (read-only, follows the BU) and custom
// (editable). Both sub-toggles share the same origin since they live in
// the same rule.
function personalizeBudget() { budgetForm.draftOrigin = 'custom' }
function inheritBudget() { budgetForm.draftOrigin = 'inherited' }
const budgetForm = reactive<{ active: boolean; amount: string; draftOrigin: 'inherited' | 'custom' }>({
  active: true,
  amount: '230,00',
  draftOrigin: 'inherited',
})

// Zero-amount guard for the Budget section (Figma 5980-29334). When the user
// turns the section on but leaves the amount at 0/empty, Enregistrer is
// rejected with a compact danger Alert at the top of the drawer body and a
// destructive ring on the input. The error clears as soon as the amount
// becomes a positive number or the section is turned off.
const budgetError = ref(false)
const isBudgetAmountInvalid = computed(() => {
  const v = budgetForm.amount.trim().replace(',', '.')
  if (!v) return true
  const n = parseFloat(v)
  return !isFinite(n) || n <= 0
})
watch(() => budgetForm.amount, () => { if (budgetError.value && !isBudgetAmountInvalid.value) budgetError.value = false })
watch(() => budgetForm.active, (active) => { if (!active) budgetError.value = false })

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
  draftOrigin: 'inherited' | 'custom'
}>({
  active: false,
  periods: [],
  creating: false,
  draft: { name: '', range: '' },
  draftOrigin: 'inherited',
})
function personalizeVacance() { vacanceForm.draftOrigin = 'custom' }
function inheritVacance() { vacanceForm.draftOrigin = 'inherited' }
let vacancePeriodSeq = 0
function openVacanceCreate() {
  vacanceForm.draft.name = ''
  vacanceForm.draft.range = ''
  vacanceForm.creating = true
  vacanceRangeStart.value = null
  vacanceRangeEnd.value = null
  calendarMonth.value = new Date()
  calendarOpen.value = false
}
function cancelVacanceCreate() {
  vacanceForm.creating = false
  vacanceForm.draft.name = ''
  vacanceForm.draft.range = ''
  vacanceRangeStart.value = null
  vacanceRangeEnd.value = null
  calendarOpen.value = false
}
function addVacancePeriod() {
  const rawName = vacanceForm.draft.name.trim()
  if (!rawName) return
  // Use the picked range when present; otherwise fall back to the Figma
  // demo dates so a freshly added card still looks populated.
  const start = vacanceRangeStart.value ? fmtDMY(vacanceRangeStart.value) : '20/12/2025'
  const end = vacanceRangeEnd.value ? fmtDMY(vacanceRangeEnd.value) : '31/12/2025'
  const period: VacancePeriod = {
    id: `vp-${++vacancePeriodSeq}`,
    name: /\d{4}$/.test(rawName) ? rawName : `${rawName} 2026`,
    active: true,
    start,
    end,
  }
  vacanceForm.periods.push(period)
  vacanceForm.creating = false
  vacanceForm.draft.name = ''
  vacanceForm.draft.range = ''
  vacanceRangeStart.value = null
  vacanceRangeEnd.value = null
  calendarOpen.value = false
}

// Per-period ellipsis menu (Figma 6201-11498) — Modifier / Supprimer.
const openVacancePeriodMenuId = ref<string | null>(null)
function toggleVacancePeriodMenu(id: string) {
  openVacancePeriodMenuId.value = openVacancePeriodMenuId.value === id ? null : id
}
function editVacancePeriod(id: string) {
  const target = vacanceForm.periods.find(p => p.id === id)
  if (!target) return
  vacanceForm.draft.name = target.name
  vacanceForm.draft.range = `${target.start} - ${target.end}`
  vacanceRangeStart.value = parseDMY(target.start)
  vacanceRangeEnd.value = parseDMY(target.end)
  calendarMonth.value = vacanceRangeStart.value
    ? new Date(vacanceRangeStart.value.getFullYear(), vacanceRangeStart.value.getMonth(), 1)
    : new Date()
  vacanceForm.creating = true
  openVacancePeriodMenuId.value = null
}
function deleteVacancePeriod(id: string) {
  const idx = vacanceForm.periods.findIndex(p => p.id === id)
  if (idx >= 0) vacanceForm.periods.splice(idx, 1)
  openVacancePeriodMenuId.value = null
}

// Inline date range picker for the vacance creation form (Figma 5980-31045).
// Monday-first weekly grid, 6-row month view with leading/trailing greyed days.
const calendarOpen = ref(false)
const calendarMonth = ref(new Date())
const vacanceRangeStart = ref<Date | null>(null)
const vacanceRangeEnd = ref<Date | null>(null)
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}
function fmtDMY(d: Date): string {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
function parseDMY(s: string): Date | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const d = new Date(parseInt(m[3]!, 10), parseInt(m[2]!, 10) - 1, parseInt(m[1]!, 10))
  return isNaN(d.getTime()) ? null : d
}
interface CalendarCell { date: Date; day: number; inMonth: boolean }
const calendarCells = computed<CalendarCell[]>(() => {
  const year = calendarMonth.value.getFullYear()
  const month = calendarMonth.value.getMonth()
  const first = new Date(year, month, 1)
  const firstWeekday = (first.getDay() + 6) % 7 // 0 = Monday
  const start = new Date(year, month, 1 - firstWeekday)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return { date: d, day: d.getDate(), inMonth: d.getMonth() === month }
  })
})
const monthLabel = computed(() => {
  const s = calendarMonth.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
})
function isCellStart(c: CalendarCell) { return vacanceRangeStart.value ? isSameDay(c.date, vacanceRangeStart.value) : false }
function isCellEnd(c: CalendarCell)   { return vacanceRangeEnd.value   ? isSameDay(c.date, vacanceRangeEnd.value)   : false }
function isCellInRange(c: CalendarCell) {
  if (!vacanceRangeStart.value || !vacanceRangeEnd.value) return false
  return c.date > vacanceRangeStart.value && c.date < vacanceRangeEnd.value
}
function prevMonth() {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() - 1, 1)
}
function nextMonth() {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + 1, 1)
}
function prevYear() {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear() - 1, calendarMonth.value.getMonth(), 1)
}
function nextYear() {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear() + 1, calendarMonth.value.getMonth(), 1)
}
// Where the connecting bg-brand-surface strip should sit on a cell:
// - 'full'  → strictly between start and end (square, full cell)
// - 'right' → start cell when end is set on a later day (covers right half)
// - 'left'  → end cell (covers left half)
// - null    → no bg
type RangeStripeSide = 'full' | 'left' | 'right' | null
function cellRangeStripe(cell: CalendarCell): RangeStripeSide {
  const s = vacanceRangeStart.value
  const e = vacanceRangeEnd.value
  if (!s || !e || isSameDay(s, e)) return null
  if (isCellStart(cell)) return 'right'
  if (isCellEnd(cell)) return 'left'
  if (cell.date > s && cell.date < e) return 'full'
  return null
}
function selectCalendarDate(d: Date) {
  if (!vacanceRangeStart.value || (vacanceRangeStart.value && vacanceRangeEnd.value)) {
    vacanceRangeStart.value = d
    vacanceRangeEnd.value = null
    return
  }
  if (d < vacanceRangeStart.value) {
    vacanceRangeEnd.value = vacanceRangeStart.value
    vacanceRangeStart.value = d
  } else if (isSameDay(d, vacanceRangeStart.value)) {
    return
  } else {
    vacanceRangeEnd.value = d
  }
  if (vacanceRangeStart.value && vacanceRangeEnd.value) {
    vacanceForm.draft.range = `${fmtDMY(vacanceRangeStart.value)} - ${fmtDMY(vacanceRangeEnd.value)}`
    calendarOpen.value = false
  }
}
function resetVacanceCalendar() {
  vacanceRangeStart.value = null
  vacanceRangeEnd.value = null
  calendarOpen.value = false
  calendarMonth.value = new Date()
}

// Drawer state for the Autorisations quotidiennes rule (Figma 5980-29659).
// Master toggle gates the whole feature; each day carries its own toggle
// and either an "all day" allowance or a custom HH:MM range.

// Strips non-digits, caps at 4 chars, inserts the colon once 3+ digits are
// in. Lets the user type "0930" and see "09:30" without fighting a strict
// regex.
function maskTimeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}
// Clamps to a real HH:MM on blur — hours 0–23, minutes 0–59, zero-padded.
function clampTime(value: string): string {
  if (!value) return ''
  const m = value.match(/^(\d{1,2}):?(\d{0,2})$/)
  if (!m) return ''
  const h = Math.min(Math.max(parseInt(m[1] || '0', 10), 0), 23)
  const min = Math.min(Math.max(parseInt(m[2] || '0', 10), 0), 59)
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}
function onDayTimeInput(day: DayRule, key: 'start' | 'end', e: Event) {
  day[key] = maskTimeInput((e.target as HTMLInputElement).value)
}
function onDayTimeBlur(day: DayRule, key: 'start' | 'end') {
  day[key] = clampTime(day[key])
}

const autorisationsDrawerOpen = ref(false)
// `blocked: true` → toggle ON in red (the day is blocked for the entire
// rule). `customHours: true` + start/end → saved time window. `editing`
// is transient and surfaces the time pickers (Figma 6529-27247).
interface DayRule {
  id: string
  label: string
  blocked: boolean
  customHours: boolean
  editing: boolean
  start: string
  end: string
}
const autorisationsForm = reactive<{ active: boolean; days: DayRule[]; draftOrigin: 'inherited' | 'custom' }>({
  active: false,
  draftOrigin: 'inherited',
  days: [
    { id: 'lundi',    label: 'Lundi',    blocked: false, customHours: false, editing: false, start: '', end: '' },
    { id: 'mardi',    label: 'Mardi',    blocked: false, customHours: false, editing: false, start: '', end: '' },
    { id: 'mercredi', label: 'Mercredi', blocked: false, customHours: false, editing: false, start: '', end: '' },
    { id: 'jeudi',    label: 'Jeudi',    blocked: false, customHours: false, editing: false, start: '', end: '' },
    { id: 'vendredi', label: 'Vendredi', blocked: false, customHours: false, editing: false, start: '', end: '' },
    { id: 'samedi',   label: 'Samedi',   blocked: false, customHours: false, editing: false, start: '', end: '' },
    { id: 'dimanche', label: 'Dimanche', blocked: false, customHours: false, editing: false, start: '', end: '' },
  ],
})
function personalizeAutorisations() { autorisationsForm.draftOrigin = 'custom' }
function inheritAutorisations() { autorisationsForm.draftOrigin = 'inherited' }
function startEditingDay(day: DayRule) {
  if (!day.customHours) { day.start = ''; day.end = '' }
  day.editing = true
}
function validateDayHours(day: DayRule) {
  // Strict validation isn't required for the prototype; an empty range
  // just resets to "autorisé toute la journée".
  if (!day.start || !day.end) {
    day.editing = false
    day.customHours = false
    day.start = ''
    day.end = ''
    return
  }
  day.customHours = true
  day.editing = false
}
function resetDayHours(day: DayRule) {
  day.customHours = false
  day.editing = false
  day.start = ''
  day.end = ''
}

// Drawer state for the Blocage réseau rule (Figma 6010-29265 / 6010-29165).
// The drawer's "Sélectionner des réseaux" CTA opens a network picker panel
// to the left of the drawer. Each row's toggle represents authorisation:
// ON = network autorisée, OFF = network bloquée (red label, faded bg).
// Selection is committed only when the user clicks "Valider la selection".
const reseauDrawerOpen = ref(false)
// Inherited ↔ Custom drafts mirror the badges-cmb pattern. The drawer opens
// with the rule's current origin and only commits the change on Enregistrer.
function personalizeReseau() { reseauForm.draftOrigin = 'custom' }
function inheritReseau() { reseauForm.draftOrigin = 'inherited' }
const reseauForm = reactive<{ active: boolean; blockedNetworks: string[]; draftOrigin: 'inherited' | 'custom' }>({
  active: false,
  blockedNetworks: [],
  draftOrigin: 'inherited',
})
// Expanded state of the "Voir la liste des N réseaux bloqués" card (Figma
// 6173-13372). Defaults to expanded since the screenshot ships in that state.
const blockedNetworksListExpanded = ref(false)
const blockedNetworkDetails = computed(() =>
  networks.filter(n => reseauForm.blockedNetworks.includes(n.id)),
)

// Blocage pays — same Configuration drawer shape as the réseau rule, plus an
// Activé toggle (Figma 6123-15654). The country picker modal (Figma
// 6123-14165) reuses the réseau picker structure: search + Trier, Tout
// autorisé / Tout bloqué bulk actions, list of country-card-inline rows.
const paysDrawerOpen = ref(false)
function personalizePays() { paysForm.draftOrigin = 'custom' }
function inheritPays() { paysForm.draftOrigin = 'inherited' }
const paysForm = reactive<{ active: boolean; blockedCountries: string[]; draftOrigin: 'inherited' | 'custom' }>({
  active: false,
  blockedCountries: [],
  draftOrigin: 'inherited',
})
// Mirror of blockedNetworksListExpanded for the country drawer (Figma
// 6123-15711). Defaults to expanded.
const blockedCountriesListExpanded = ref(true)
const blockedCountryDetails = computed(() =>
  countries.filter(c => paysForm.blockedCountries.includes(c.id)),
)

interface ChargingNetwork {
  id: string
  name: string
  stations: number
  superPartner?: boolean
}
const networks: ChargingNetwork[] = [
  { id: 'allego',      name: 'Allego',              stations: 2147 },
  { id: 'alterna',     name: 'Alterna énergie',     stations: 412,  superPartner: true },
  { id: 'atlante',     name: 'Atlante',             stations: 879,  superPartner: true },
  { id: 'avia',        name: 'Avia',                stations: 256 },
  { id: 'avia-plus',   name: 'Avia Plus',           stations: 1532 },
  { id: 'avia-volt',   name: 'Avia Volt',           stations: 718 },
  { id: 'borne-elec',  name: 'Borne-elec',          stations: 94 },
  { id: 'bp-pulse',    name: 'BP Pulse',            stations: 3128 },
  { id: 'driveco',     name: 'Driveco',             stations: 1865, superPartner: true },
  { id: 'e-totem',     name: 'E-totem',             stations: 327 },
  { id: 'e-vadea',     name: 'E-Vadea',             stations: 168 },
  { id: 'easy-charge', name: 'Easy charge service', stations: 1043 },
  { id: 'easy-go',     name: 'Easy GO',             stations: 582 },
  { id: 'eborne',      name: 'Eborne',              stations: 1471 },
  { id: 'effia',       name: 'Effia',               stations: 2398 },
  { id: 'electra',     name: 'Electra',             stations: 2914 },
  { id: 'engie',       name: 'Engie',               stations: 1207 },
  { id: 'eoliberty',   name: 'Eoliberty',           stations: 63 },
  { id: 'fastned',     name: 'Fastned',             stations: 2516 },
  { id: 'greenspot',   name: 'Greenspot',           stations: 731 },
]

// Network picker modal state (Figma 6106-13915). Opened from the réseau
// drawer's "Sélectionner des réseaux" launcher. Draft selection lives
// in `draftBlocked` until the user clicks Valider, mirroring the
// snapshot/commit pattern used elsewhere on the page.
const networkPickerOpen = ref(false)
type NetworkSort = 'alpha' | 'stations-asc' | 'stations-desc'
const networkPicker = reactive<{
  search: string
  sort: NetworkSort
  draftBlocked: Set<string>
}>({
  search: '',
  sort: 'alpha',
  draftBlocked: new Set<string>(),
})
const networkSortOpen = ref(false)
const networkSortMenuRef = ref<HTMLElement | null>(null)
const networkSortItems: { value: NetworkSort; label: string }[] = [
  { value: 'alpha',          label: 'Ordre alphabétique' },
  { value: 'stations-asc',   label: 'Nombre de stations croissant' },
  { value: 'stations-desc',  label: 'Nombre de stations décroissant' },
]
// Close the sort menu on outside click. Listener is attached lazily so it
// only runs while the menu is actually open. The trigger button uses
// @click.stop, so clicking it never reaches this handler.
function onNetworkSortOutsideClick(e: MouseEvent) {
  if (!networkSortMenuRef.value) return
  if (!networkSortMenuRef.value.contains(e.target as Node)) {
    networkSortOpen.value = false
  }
}
watch(networkSortOpen, (open) => {
  if (typeof window === 'undefined') return
  if (open) {
    window.addEventListener('mousedown', onNetworkSortOutsideClick)
  } else {
    window.removeEventListener('mousedown', onNetworkSortOutsideClick)
  }
})
const visibleNetworks = computed(() => {
  const q = networkPicker.search.trim().toLowerCase()
  const filtered = q
    ? networks.filter(n => n.name.toLowerCase().includes(q))
    : [...networks]
  switch (networkPicker.sort) {
    case 'stations-asc':
      return filtered.sort((a, b) => a.stations - b.stations || a.name.localeCompare(b.name, 'fr'))
    case 'stations-desc':
      return filtered.sort((a, b) => b.stations - a.stations || a.name.localeCompare(b.name, 'fr'))
    case 'alpha':
    default:
      return filtered.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }
})
const draftBlockedCount = computed(() => networkPicker.draftBlocked.size)

function openNetworkPicker() {
  networkPicker.draftBlocked = new Set(reseauForm.blockedNetworks)
  networkPicker.search = ''
  networkPicker.sort = 'alpha'
  networkSortOpen.value = false
  networkPickerOpen.value = true
}

function cancelNetworkPicker() {
  networkPickerOpen.value = false
  networkPicker.draftBlocked.clear()
  networkPicker.search = ''
  networkSortOpen.value = false
}

function confirmNetworkPicker() {
  reseauForm.blockedNetworks = [...networkPicker.draftBlocked]
  networkPickerOpen.value = false
  networkPicker.search = ''
  networkSortOpen.value = false
}

function setNetworkAuthorized(id: string, authorized: boolean) {
  if (authorized) networkPicker.draftBlocked.delete(id)
  else networkPicker.draftBlocked.add(id)
}

// Bulk actions operate on the currently visible set so that filters and
// search work as a scope (e.g. "Lents" + "Tout bloquer" only blocks the slow
// networks). Both functions mutate the draft, never the persisted state —
// the user still has to click Enregistrer / Valider la selection to commit.
function blockAllVisible() {
  for (const net of visibleNetworks.value) {
    networkPicker.draftBlocked.add(net.id)
  }
}
function authorizeAllVisible() {
  for (const net of visibleNetworks.value) {
    networkPicker.draftBlocked.delete(net.id)
  }
}
// "All visible networks share this state already" → grey out the matching
// bulk button so it doesn't pretend to do something.
const allVisibleBlocked = computed(() =>
  visibleNetworks.value.length > 0
  && visibleNetworks.value.every(n => networkPicker.draftBlocked.has(n.id))
)
const allVisibleAuthorized = computed(() =>
  visibleNetworks.value.length > 0
  && visibleNetworks.value.every(n => !networkPicker.draftBlocked.has(n.id))
)

function isNetworkAuthorized(id: string): boolean {
  return !networkPicker.draftBlocked.has(id)
}

// Escape closes the modal — registered only while the picker is open.
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

// French thousands separator with non-breaking space (matches Figma "1 879")
function fmtStations(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// "Allego" → "AL", "BP Pulse" → "BP" — avatar tile fallback when we
// don't render branded logos (Figma 6106-13915 always uses initials).
function initialsFor(name: string): string {
  return name.replace(/[^A-Za-zÀ-ÿ]/g, '').slice(0, 2).toUpperCase()
}

// Country list backing the Blocage pays rule — limited to the 10 countries
// authored in Figma 6123-14165, in the same display order. Flags use the
// circle-flags CDN already wired in settings.vue.
const countryFlag = (cc: string) =>
  `https://hatscripts.github.io/circle-flags/flags/${cc.toLowerCase()}.svg`
interface Country { id: string; name: string; flagUrl: string }
const countries: Country[] = ([
  ['DE', 'Allemagne'], ['AT', 'Autriche'], ['BE', 'Belgique'],
  ['ES', 'Espagne'], ['FR', 'France'],     ['IT', 'Italie'],
  ['LU', 'Luxembourg'], ['NL', 'Pays-Bas'], ['CH', 'Suisse'],
  ['PT', 'Portugal'],
] as const).map(([id, name]) => ({ id, name, flagUrl: countryFlag(id) }))

const countryPickerOpen = ref(false)
const countryPicker = reactive<{ search: string; draftBlocked: Set<string> }>({
  search: '',
  draftBlocked: new Set<string>(),
})
const visibleCountries = computed(() => {
  const q = countryPicker.search.trim().toLowerCase()
  if (!q) return countries
  return countries.filter(c => c.name.toLowerCase().includes(q))
})
const draftBlockedCountriesCount = computed(() => countryPicker.draftBlocked.size)

function openCountryPicker() {
  countryPicker.draftBlocked = new Set(paysForm.blockedCountries)
  countryPicker.search = ''
  countryPickerOpen.value = true
}
function cancelCountryPicker() {
  countryPickerOpen.value = false
  countryPicker.draftBlocked.clear()
  countryPicker.search = ''
}
function confirmCountryPicker() {
  paysForm.blockedCountries = [...countryPicker.draftBlocked]
  countryPickerOpen.value = false
  countryPicker.search = ''
}
function isCountryAuthorized(id: string): boolean {
  return !countryPicker.draftBlocked.has(id)
}
function setCountryAuthorized(id: string, authorized: boolean) {
  if (authorized) countryPicker.draftBlocked.delete(id)
  else countryPicker.draftBlocked.add(id)
}
function blockAllVisibleCountries() {
  for (const c of visibleCountries.value) countryPicker.draftBlocked.add(c.id)
}
function authorizeAllVisibleCountries() {
  for (const c of visibleCountries.value) countryPicker.draftBlocked.delete(c.id)
}
const allVisibleCountriesBlocked = computed(() =>
  visibleCountries.value.length > 0
  && visibleCountries.value.every(c => countryPicker.draftBlocked.has(c.id))
)
const allVisibleCountriesAuthorized = computed(() =>
  visibleCountries.value.length > 0
  && visibleCountries.value.every(c => !countryPicker.draftBlocked.has(c.id))
)
function onCountryPickerKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && countryPickerOpen.value) {
    e.stopPropagation()
    cancelCountryPicker()
  }
}
if (import.meta.client) {
  watch(countryPickerOpen, (open) => {
    if (open) window.addEventListener('keydown', onCountryPickerKeydown)
    else window.removeEventListener('keydown', onCountryPickerKeydown)
  })
}

// Alerte sub-section state lives alongside Budget inside the combined
// "Budget et alertes" drawer (Figma 5980-29598). Threshold type is either a
// percentage of the recharge budget or a monthly cap in euros. The percentage
// option needs Budget to be active in the same drawer session, otherwise the
// amount field is disabled with a tooltip explaining the constraint.
type AlerteType = 'percentage' | 'monthly'
const alerteForm = reactive<{ active: boolean; type: AlerteType; amount: string }>({
  active: true,
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
  return !budgetForm.active
})

const rules: ChargingRule[] = reactive([
  {
    id: 'budget',
    title: 'Budget et alertes',
    description: 'Fixer un budget et des alertes par email, en cas de dépassement les conducteurs peuvent activer le relais par CB',
    icon: 'wallet',
    iconVariant: 'solid',
    statusIcon: 'check',
    statusLabel: 'Activé',
    origin: 'inherited',
  },
  {
    id: 'autorisations',
    title: 'Autorisations quotidiennes',
    description: 'Maîtrisez les jours et les plages horaires pendant lesquels vous souhaitez autoriser ou interdire les recharges',
    icon: 'calendar-days',
    iconVariant: 'solid',
    statusIcon: 'check',
    statusLabel: 'Activé',
    origin: 'inherited',
  },
  {
    id: 'vacance',
    title: 'Blocage vacance',
    description: 'Activez le blocage vacances si vous souhaitez désactiver la recharge de vos conducteurs pendant une période donnée',
    icon: 'airport-alt',
    iconVariant: 'solid',
    statusIcon: 'check',
    statusLabel: 'Activé',
    origin: 'inherited',
  },
  {
    id: 'pays',
    title: 'Bloquer des pays',
    description: 'Définissez pays par pays ceux dans lesquels la recharge est autorisée ou interdite',
    icon: 'flag',
    iconVariant: 'solid',
    statusIcon: 'check',
    statusLabel: 'Activé',
    origin: 'inherited',
  },
  {
    id: 'reseau',
    title: 'Bloquer des réseaux',
    description: 'Définissez réseau par réseau ceux sur lesquels la recharge est autorisée ou interdite',
    icon: 'map-pin',
    iconVariant: 'solid',
    statusIcon: 'check',
    statusLabel: 'Activé',
    origin: 'inherited',
  },
])

// Reset every charging rule card and its drawer form state to the disabled
// default. Called the first time the user opens a newly created group so the
// group never inherits another group's edits.
function resetChargingRulesToDisabled() {
  rules.forEach((rule) => {
    rule.statusIcon = 'x-mark'
    rule.statusLabel = 'Désactivé'
  })
  budgetForm.active = false
  alerteForm.active = false
  autorisationsForm.active = false
  vacanceForm.active = false
  vacanceForm.periods.splice(0, vacanceForm.periods.length)
  vacanceForm.creating = false
  vacanceForm.draft.name = ''
  vacanceForm.draft.range = ''
  reseauForm.active = false
  reseauForm.blockedNetworks.splice(0, reseauForm.blockedNetworks.length)
  paysForm.active = false
  paysForm.blockedCountries.splice(0, paysForm.blockedCountries.length)
}

// Track the cursor position over a rule card and expose it as CSS vars so the
// spotlight overlay (rendered as the first child of the button) can centre its
// radial-gradient on the pointer — same effect as the Vercel marketplace cards.
function onRuleCardMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--card-mx', `${e.clientX - rect.left}px`)
  el.style.setProperty('--card-my', `${e.clientY - rect.top}px`)
}

function onRuleClick(rule: ChargingRule) {
  // Re-clicking the already-active card toggles the drawer off and clears the
  // active state — same affordance as clicking the header X.
  if (selectedRuleId.value === rule.id) {
    budgetDrawerOpen.value = false
    autorisationsDrawerOpen.value = false
    vacanceDrawerOpen.value = false
    reseauDrawerOpen.value = false
    paysDrawerOpen.value = false
    networkPickerOpen.value = false
    countryPickerOpen.value = false
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
  autorisationsDrawerOpen.value = false
  vacanceDrawerOpen.value = false
  reseauDrawerOpen.value = false
  paysDrawerOpen.value = false

  if (rule.id === 'budget') {
    // The "Budget et alertes" card opens one drawer with both sub-toggles.
    // We don't reseed budgetForm.active / alerteForm.active from the rule
    // status — the form state is the source of truth between saves, since
    // one rule status represents two independent toggles. The drawer's
    // origin draft is reseeded from the rule so the banner CTA reflects
    // the live state when the user re-opens it.
    selectedRuleId.value = rule.id
    budgetForm.draftOrigin = rule.origin
    budgetDrawerOpen.value = true
    return
  }
  if (rule.id === 'autorisations') {
    selectedRuleId.value = rule.id
    autorisationsForm.active = rule.statusIcon === 'check'
    autorisationsForm.draftOrigin = rule.origin
    autorisationsDrawerOpen.value = true
    return
  }
  if (rule.id === 'vacance') {
    selectedRuleId.value = rule.id
    vacanceForm.active = rule.statusIcon === 'check'
    vacanceForm.draftOrigin = rule.origin
    vacanceDrawerOpen.value = true
    return
  }
  if (rule.id === 'reseau') {
    selectedRuleId.value = rule.id
    reseauForm.active = rule.statusIcon === 'check'
    reseauForm.draftOrigin = rule.origin
    reseauDrawerOpen.value = true
    return
  }
  if (rule.id === 'pays') {
    selectedRuleId.value = rule.id
    paysForm.active = rule.statusIcon === 'check'
    paysForm.draftOrigin = rule.origin
    paysDrawerOpen.value = true
    return
  }
  selectedRuleId.value = rule.id
}

function closeBudgetDrawer() {
  budgetDrawerOpen.value = false
  budgetError.value = false
  selectedRuleId.value = null
}

function saveBudget() {
  if (budgetForm.active && isBudgetAmountInvalid.value) {
    budgetError.value = true
    return
  }
  commitBudget()
}

function commitBudget() {
  const rule = rules.find(r => r.id === 'budget')
  if (rule) {
    rule.origin = budgetForm.draftOrigin
    const active = budgetForm.active || alerteForm.active
    rule.statusIcon = active ? 'check' : 'x-mark'
    rule.statusLabel = active ? 'Activé' : 'Désactivé'
  }
  budgetDrawerOpen.value = false
  budgetError.value = false
  selectedRuleId.value = null
  showSuccessToast('Budget et alertes mis à jour', '')
}

function closeAutorisationsDrawer() {
  autorisationsDrawerOpen.value = false
  selectedRuleId.value = null
}

function saveAutorisations() {
  commitAutorisations()
}

function commitAutorisations() {
  const rule = rules.find(r => r.id === 'autorisations')
  if (rule) {
    rule.statusIcon = autorisationsForm.active ? 'check' : 'x-mark'
    rule.statusLabel = autorisationsForm.active ? 'Activé' : 'Désactivé'
    rule.origin = autorisationsForm.draftOrigin
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
  openVacancePeriodMenuId.value = null
  resetVacanceCalendar()
  selectedRuleId.value = null
}

function closeReseauDrawer() {
  reseauDrawerOpen.value = false
  networkPickerOpen.value = false
  networkPicker.draftBlocked.clear()
  networkPicker.search = ''
  selectedRuleId.value = null
}

// Trash button on the "Réseaux bloqués" summary row — just clears the
// selection. The rule's Activé / Désactivé status is now driven by the
// Toggle, not by whether the list is empty.
function clearReseauBlocklist() {
  reseauForm.blockedNetworks = []
  networkPicker.draftBlocked.clear()
}

function saveReseau() {
  commitReseau()
}

function commitReseau() {
  const rule = rules.find(r => r.id === 'reseau')
  if (rule) {
    rule.statusIcon = reseauForm.active ? 'check' : 'x-mark'
    rule.statusLabel = reseauForm.active ? 'Activé' : 'Désactivé'
    rule.origin = reseauForm.draftOrigin
  }
  reseauDrawerOpen.value = false
  networkPickerOpen.value = false
  networkPicker.search = ''
  selectedRuleId.value = null
  showSuccessToast('Blocage réseau mis à jour', '')
}

function closePaysDrawer() {
  paysDrawerOpen.value = false
  countryPickerOpen.value = false
  countryPicker.draftBlocked.clear()
  countryPicker.search = ''
  selectedRuleId.value = null
}

function clearPaysBlocklist() {
  paysForm.blockedCountries = []
  countryPicker.draftBlocked.clear()
}

function savePays() {
  commitPays()
}

function commitPays() {
  const rule = rules.find(r => r.id === 'pays')
  if (rule) {
    rule.statusIcon = paysForm.active ? 'check' : 'x-mark'
    rule.statusLabel = paysForm.active ? 'Activé' : 'Désactivé'
    rule.origin = paysForm.draftOrigin
  }
  paysDrawerOpen.value = false
  countryPickerOpen.value = false
  countryPicker.search = ''
  selectedRuleId.value = null
  showSuccessToast('Blocage pays mis à jour', '')
}

function saveVacance() {
  commitVacance()
}

function commitVacance() {
  const rule = rules.find(r => r.id === 'vacance')
  if (rule) {
    rule.statusIcon = vacanceForm.active ? 'check' : 'x-mark'
    rule.statusLabel = vacanceForm.active ? 'Activé' : 'Désactivé'
    rule.origin = vacanceForm.draftOrigin
  }
  vacanceDrawerOpen.value = false
  vacanceForm.creating = false
  vacanceForm.draft.name = ''
  vacanceForm.draft.range = ''
  selectedRuleId.value = null
  showSuccessToast('Blocage vacance mis à jour', '')
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
// Badge currently driving the teleported row menu (null when the open
// menu belongs to another context like a listing-group card).
const currentMenuBadge = computed(() => {
  if (!openMenuId.value) return null
  return badgePaginated.value.find(b => b.id === openMenuId.value) ?? null
})
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

// ── Modal infinite scroll ─────────────────────────────────────────────────
// The "Ajouter des badges" modal replaces TableFooter pagination with lazy
// chunk loading: each scroll near the bottom appends the next chunk after a
// short simulated delay, with skeleton rows shown during the wait. The
// inline swap variant keeps its own pagination (addPage / addPaginated).
const addModalChunk = 20
const addModalLoaded = ref(addModalChunk)
const addModalLoading = ref(false)
let addModalLoadTimer: ReturnType<typeof setTimeout> | null = null

const addModalVisible = computed(() => filteredAvailable.value.slice(0, addModalLoaded.value))
const addModalHasMore = computed(() => addModalLoaded.value < filteredAvailable.value.length)
const addModalAllSelected = computed(() =>
  addModalVisible.value.length > 0 && addModalVisible.value.every(b => selectedToAdd.has(b.id)),
)
const addModalSomeSelected = computed(() =>
  addModalVisible.value.some(b => selectedToAdd.has(b.id)) && !addModalAllSelected.value,
)
function toggleSelectAllVisibleForModal() {
  if (addModalAllSelected.value) addModalVisible.value.forEach(b => selectedToAdd.delete(b.id))
  else addModalVisible.value.forEach(b => selectedToAdd.add(b.id))
}
function resetAddModalScroll() {
  if (addModalLoadTimer) { clearTimeout(addModalLoadTimer); addModalLoadTimer = null }
  addModalLoading.value = false
  addModalLoaded.value = addModalChunk
}
function loadMoreAddModal() {
  if (addModalLoading.value || !addModalHasMore.value) return
  addModalLoading.value = true
  if (addModalLoadTimer) clearTimeout(addModalLoadTimer)
  addModalLoadTimer = setTimeout(() => {
    addModalLoaded.value = Math.min(addModalLoaded.value + addModalChunk, filteredAvailable.value.length)
    addModalLoading.value = false
    addModalLoadTimer = null
  }, 450)
}
function onAddModalScroll(e: Event) {
  const el = e.currentTarget as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) loadMoreAddModal()
}
// Resetting the loaded count when the search query changes keeps the user
// from seeing stale chunks from a previous query while typing.
watch(addSearch, () => { if (addBadgesModalOpen.value) resetAddModalScroll() })
const addModalSkeletonRows = Array.from({ length: 6 }, (_, i) => i)
onUnmounted(() => { if (addModalLoadTimer) clearTimeout(addModalLoadTimer) })

// Modal vs swap entry point — the sandbox toggle (uiStore.addBadgesVariant)
// chooses which surface the "Ajouter des badges" CTA opens. State is shared:
// selectedToAdd / addSearch / addPage drive both UIs.
//
// addBadgesModalMode disambiguates the two entry points that both open the
// modal: 'detail' adds badges to an existing group, 'create' stages badges
// for the new-group flow (selection ends up in createSelected on confirm).
const addBadgesModalOpen = ref(false)
const addBadgesModalMode = ref<'detail' | 'create'>('detail')
function enterAddMode() {
  selectedToAdd.clear()
  selectedToRemove.clear()
  addSearch.value = ''
  addPage.value = 1
  clearUndo()
  if (uiStore.addBadgesVariant === 'modal') {
    resetAddModalScroll()
    addBadgesModalMode.value = 'detail'
    addBadgesModalOpen.value = true
  } else {
    isAddingBadges.value = true
  }
}
function openCreateBadgesModal() {
  // Seed the modal's staging set with whatever the user has already added
  // so reopening shows their prior selection pre-checked.
  selectedToAdd.clear()
  createSelected.forEach(id => selectedToAdd.add(id))
  addSearch.value = ''
  addPage.value = 1
  resetAddModalScroll()
  addBadgesModalMode.value = 'create'
  addBadgesModalOpen.value = true
}
function cancelAddMode() {
  isAddingBadges.value = false
  selectedToAdd.clear()
}
function cancelAddBadgesModal() {
  addBadgesModalOpen.value = false
  selectedToAdd.clear()
}
function confirmAddBadgesModal() {
  if (addBadgesModalMode.value === 'create') {
    createSelected.clear()
    selectedToAdd.forEach(id => createSelected.add(id))
    addBadgesModalOpen.value = false
    selectedToAdd.clear()
    return
  }
  if (!selectedGroup.value || selectedToAdd.size === 0) return
  confirmAdd()
  addBadgesModalOpen.value = false
}
// Escape closes the add-badges modal — listener bound only while it is open.
function onAddBadgesModalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && addBadgesModalOpen.value) {
    e.stopPropagation()
    cancelAddBadgesModal()
  }
}
if (import.meta.client) {
  watch(addBadgesModalOpen, (open) => {
    if (open) window.addEventListener('keydown', onAddBadgesModalKeydown)
    else window.removeEventListener('keydown', onAddBadgesModalKeydown)
  })
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
// Per-row "Transférer" entry — routes to the same modal as the bulk
// action with a single-badge id set.
function transferBadge(b: Badge) {
  openTransferModal([b.id])
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

// ── Floating pill (adaptive: Supprimer in view, Ajouter in add) ───────────
// The create flow uses inline Annuler / Créer le groupe CTAs at the bottom
// of the page (Figma 6156-15123), so the pill is intentionally not shown
// while creating a new group.
const pillMode = computed<'remove' | 'add' | null>(() => {
  if (isCreatingGroup.value) return null
  if (!selectedGroup.value) return null
  if (isAddingBadges.value) return selectedToAdd.size > 0 ? 'add' : null
  return selectedToRemove.size > 0 ? 'remove' : null
})
const pillVisible = computed(() => pillMode.value !== null)
const pillCount = computed(() => {
  switch (pillMode.value) {
    case 'add':    return selectedToAdd.size
    case 'remove': return selectedToRemove.size
    default:       return 0
  }
})
function clearPillSelection() {
  switch (pillMode.value) {
    case 'add':    selectedToAdd.clear();   break
    case 'remove': clearRemoveSelection();  break
  }
}
function runPillAction() {
  switch (pillMode.value) {
    case 'add':    confirmAdd();         break
    case 'remove': bulkRemoveSelected(); break
  }
}
// Transferring badges to another group of the same BU opens a small
// picker dialog (Figma 6529-11525). The same dialog services the per-row
// kebab "Transférer" entry and the floating bulk-action "Transférer"
// CTA — only the badge id set changes.
const transferModalOpen = ref(false)
const transferTargetGroupId = ref<string>('')
const transferBadgeIds = ref<string[]>([])
const transferGroupItems = computed(() =>
  groups
    .filter(g => g.id !== selectedGroup.value?.id)
    .map(g => ({ value: g.id, label: g.name })),
)
function openTransferModal(ids: string[]) {
  if (ids.length === 0) return
  transferBadgeIds.value = ids
  transferTargetGroupId.value = ''
  transferModalOpen.value = true
  closeMenus()
}
function closeTransferModal() {
  transferModalOpen.value = false
  transferTargetGroupId.value = ''
  transferBadgeIds.value = []
}
function confirmTransfer() {
  const targetId = transferTargetGroupId.value
  if (!targetId) return
  const target = groups.find(g => g.id === targetId)
  if (!target) return
  const ids = [...transferBadgeIds.value]
  ids.forEach(id => {
    const badge = allBadges.find(b => b.id === id)
    if (badge) badge.groupId = target.id
  })
  selectedToRemove.clear()
  closeTransferModal()
  showSuccessToast(
    ids.length === 1
      ? `Badge transféré vers ${target.name}`
      : `${ids.length} badges transférés vers ${target.name}`,
    '',
  )
}
function bulkTransferSelected() {
  if (!selectedGroup.value) return
  openTransferModal(Array.from(selectedToRemove))
}

// ── Pill positioning ────────────────────────────────────────────────────────
// Default = 32px from viewport bottom. When the table ends short of the
// viewport (e.g. only 3 rows), anchor the pill 32px below the table instead
// so it doesn't float in empty space. Recomputed on scroll / resize / table
// height changes (ResizeObserver).
const tableBlockRef = ref<HTMLElement | null>(null)
const pillBottomPx = ref(32)
const PILL_HEIGHT = 61
const PILL_GAP = 32

function updatePillBottom() {
  const el = tableBlockRef.value
  if (!el) {
    pillBottomPx.value = PILL_GAP
    return
  }
  const rect = el.getBoundingClientRect()
  const viewportH = window.innerHeight
  // Distance from viewport bottom if we anchor the pill 32px below the table.
  // Negative when the table extends past the viewport — in that case we keep
  // the default 32px so the pill stays pinned to the viewport.
  const proposed = viewportH - rect.bottom - PILL_GAP - PILL_HEIGHT
  pillBottomPx.value = Math.max(PILL_GAP, proposed)
}

let pillResizeObserver: ResizeObserver | null = null
if (import.meta.client) {
  watch(
    [pillVisible, tableBlockRef],
    async ([visible, el]) => {
      if (visible && el) {
        await nextTick()
        updatePillBottom()
        window.addEventListener('scroll', updatePillBottom, { passive: true })
        window.addEventListener('resize', updatePillBottom)
        pillResizeObserver?.disconnect()
        pillResizeObserver = new ResizeObserver(updatePillBottom)
        pillResizeObserver.observe(el)
      } else {
        window.removeEventListener('scroll', updatePillBottom)
        window.removeEventListener('resize', updatePillBottom)
        pillResizeObserver?.disconnect()
        pillResizeObserver = null
      }
    },
    { immediate: true },
  )
  onUnmounted(() => {
    window.removeEventListener('scroll', updatePillBottom)
    window.removeEventListener('resize', updatePillBottom)
    pillResizeObserver?.disconnect()
  })
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

    <!-- ── SETTINGS (Figma 6042-35774) — layers on top of listing/detail ── -->
    <div
      v-if="selectedSettingsGroup"
      class="mx-auto w-full max-w-[800px] flex flex-col gap-[32px]"
    >

      <!-- Header: illustration + ← Retour back + page title (matches group detail header) -->
      <div class="flex items-center gap-[12px] anim-fade-up" style="animation-delay: 0ms">
        <img
          :src="groupHeaderIllustration"
          alt=""
          aria-hidden="true"
          class="shrink-0 w-[96px] h-[88px] select-none pointer-events-none"
          draggable="false"
        />
        <div class="flex flex-col items-start min-w-0 flex-1">
          <button
            type="button"
            class="flex items-center gap-[8px] px-[4px] py-[4px] rounded-[4px] text-text-neutral-secondary hover:text-text-neutral transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
            @click="exitSettings"
          >
            <Icon name="arrow-left" variant="outline" :size="16" />
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
              Retour
            </span>
          </button>
          <h1 class="font-sans font-medium text-[24px] leading-[1.5] tracking-[-0.72px] text-text-neutral truncate max-w-full">
            Paramètres de {{ selectedSettingsGroup.name }}
          </h1>
        </div>
      </div>

      <!-- Informations section + Date / Supprimer card + footer actions -->
      <div class="flex flex-col gap-[16px] anim-fade-up" style="animation-delay: 80ms">

        <!-- Informations section -->
        <div class="flex flex-col gap-[16px]">
          <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
            Informations
          </p>
          <div class="bg-neutral border border-border-neutral-secondary rounded-[8px] shadow-sm p-[16px]">
            <div class="flex flex-col gap-[16px] w-full">
              <Input
                v-model="settingsForm.name"
                label="Nom du groupe"
                placeholder="Nom du groupe"
              />
              <Dropdown
                v-model="settingsForm.manager"
                label="Manager"
                :items="managerItems"
                :searchable="false"
                :show-hint="false"
                placeholder="Sélectionner un manager"
              />
            </div>
          </div>
        </div>

        <!-- Supression section -->
        <div class="flex flex-col gap-[16px]">
          <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
            Suppression
          </p>
          <div class="bg-neutral border border-border-neutral-secondary rounded-[8px] shadow-sm p-[16px]">
            <div class="flex items-center gap-[16px] w-full">
              <div class="flex-1 min-w-0 flex flex-col">
                <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral truncate">
                  {{ selectedSettingsGroup.name }}
                </p>
                <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Créé le {{ settingsCreatedAt }}
                </p>
              </div>
              <button
                type="button"
                class="shrink-0 inline-flex items-center justify-center gap-[8px] px-[12px] py-[8px] rounded-[8px] bg-danger text-white font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] hover:bg-danger-hover transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-error active:scale-[0.97]"
                @click="deleteSettingsGroup"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <!-- Footer actions -->
        <div class="flex items-center justify-end gap-[16px] w-full">
          <Button type="secondary" size="md" label="Annuler" @click="exitSettings" />
          <Button type="primary" size="md" label="Enregistrer" :disabled="!settingsDirty" @click="saveSettings" />
        </div>
      </div>
    </div>

    <!-- ── NOUVEAU GROUPE (Figma 6156-15123) ───────────────────────────── -->
    <!-- Spacing per Figma: 32px between sections; cards 16px padding;
         4px between title and subtitle inside card headers. -->
    <div
      v-else-if="isCreatingGroup"
      class="mx-auto w-full max-w-[800px] flex flex-col gap-[32px]"
    >
      <!-- Header: illustration + Retour back + page title -->
      <div class="flex items-center gap-[12px] anim-fade-up" style="animation-delay: 0ms">
        <img
          :src="groupHeaderIllustration"
          alt=""
          aria-hidden="true"
          class="shrink-0 w-[96px] h-[88px] select-none pointer-events-none"
          draggable="false"
        />
        <div class="flex flex-col items-start min-w-0 flex-1">
          <button
            type="button"
            class="flex items-center gap-[8px] px-[4px] py-[4px] rounded-[4px] text-text-neutral-secondary hover:text-text-neutral transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
            @click="cancelCreateGroup"
          >
            <Icon name="arrow-left" variant="outline" :size="16" />
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
              Retour
            </span>
          </button>
          <h1 :class="headingClass">
            Nouveau groupe
          </h1>
        </div>
      </div>

      <!-- Informations card -->
      <section class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-clip anim-fade-up" style="animation-delay: 40ms">
        <div class="p-[16px] flex flex-col gap-[4px]">
          <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
            Informations
          </p>
          <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Le responsable du groupe recevra toutes les notifications liées à ce groupe
          </p>
        </div>
        <div class="h-px w-full bg-border-neutral-tertiary" aria-hidden="true" />
        <div class="px-[16px] pt-[16px] pb-[16px] flex flex-col gap-[16px]">
          <div ref="createNameFieldRef" class="scroll-mt-[120px]">
            <Input
              v-model="createForm.name"
              placeholder="Nom de votre groupe"
              :destructive="createError.name"
              :hint="createError.name ? 'Veuillez renseigner un nom de groupe' : ''"
            />
          </div>
          <div ref="createManagerFieldRef" class="scroll-mt-[120px]">
            <Dropdown
              v-model="createForm.manager"
              :items="managerItems"
              :show-label="false"
              placeholder="Sélectionnez un responsable"
              :searchable="true"
              search-placeholder="Rechercher un responsable"
              :show-hint="createError.manager"
              :hint="createError.manager ? 'Veuillez sélectionner un responsable' : ''"
              :destructive="createError.manager"
              :teleport="true"
            />
          </div>
        </div>
      </section>

      <!-- Composition card — Figma 6156-15134 (empty) / 6156-15364 (filled) -->
      <section class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-clip anim-fade-up" style="animation-delay: 80ms">
        <div class="p-[16px] flex flex-col gap-[4px]">
          <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
            Composition
          </p>
          <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Ajoutez les badges à associer à ce groupe
          </p>
        </div>
        <div class="h-px w-full bg-border-neutral-tertiary" aria-hidden="true" />
        <div class="px-[16px] pt-[16px] pb-[16px] flex items-center justify-between gap-[16px]">
          <p class="min-w-0 font-sans text-[16px] leading-[1.5] tracking-[-0.48px]">
            <template v-if="createSelected.size === 0">
              <span class="font-medium text-text-neutral tabular-nums">0</span>
              <span class="text-text-neutral-secondary"> badge ajouté</span>
            </template>
            <template v-else>
              <span class="font-semibold text-text-neutral tabular-nums">{{ createSelected.size }} {{ createSelected.size === 1 ? 'badge' : 'badges' }}</span>
              <span class="text-text-neutral-secondary"> dans le groupe</span>
            </template>
          </p>
          <div class="shrink-0 flex items-center gap-[12px]">
            <Button
              type="secondary"
              size="md"
              :label="createSelected.size === 0 ? 'Ajouter des badges' : 'Modifier la sélection'"
              @click="openCreateBadgesModal"
            />
            <Button
              v-if="createSelected.size > 0"
              type="secondary"
              size="md"
              :icon-only="true"
              icon-left="trash"
              aria-label="Vider la sélection"
              @click="createSelected.clear()"
            />
          </div>
        </div>
      </section>

      <!-- Bottom CTAs — equal-width Annuler / Créer le groupe per Figma -->
      <div class="flex items-center gap-[16px] anim-fade-up" style="animation-delay: 120ms">
        <Button
          class="flex-1"
          type="secondary"
          size="md"
          label="Annuler"
          @click="cancelCreateGroup"
        />
        <Button
          class="flex-1"
          type="primary"
          size="md"
          label="Créer le groupe"
          :disabled="!canCreateGroup"
          @click="saveCreateGroup"
        />
      </div>

    </div>

    <!-- ── LISTING ─────────────────────────────────────────────────────── -->
    <div
      v-else-if="!selectedGroup"
      class="mx-auto w-full flex flex-col gap-[32px]"
      :style="{
        maxWidth: uiStore.groupListVariant === 'compact'
          ? '1280px'
          : uiStore.getMaxWidth('/bu/groups') + 'px',
      }"
    >

      <!-- Page header -->
      <div class="flex items-center justify-between gap-[16px] anim-fade-up" style="animation-delay: 0ms">
        <div class="flex items-center gap-[12px] min-w-0">
          <img
            :src="groupHeaderIllustration"
            alt=""
            aria-hidden="true"
            class="shrink-0 w-[96px] h-[88px] select-none pointer-events-none"
            draggable="false"
          />
          <h1 :class="[headingClass, 'truncate']">
            Groupes
          </h1>
        </div>
        <Button
          type="primary"
          size="md"
          icon-left="plus"
          label="Nouveau groupe"
          @click="enterCreateGroup"
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
              'bg-neutral border border-border-neutral-secondary shadow-sm',
              'p-[24px] flex flex-col gap-[16px]',
              'transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none',
              'outline-none focus-visible:shadow-ring-gray',
              openMenuId === g.id ? 'z-30' : 'z-0',
              uiStore.groupListVariant === 'compact'
                ? 'rounded-[8px] hover:border-border-neutral'
                : 'rounded-[16px] hover:border-border-neutral hover:shadow-md hover:-translate-y-[2px]',
            ]"
            @click="openGroup(g.id)"
            @keydown.enter="openGroup(g.id)"
            @keydown.space.prevent="openGroup(g.id)"
          >
            <div class="flex items-start gap-[16px] w-full">
              <div class="flex-1 min-w-0 flex flex-col gap-[8px] items-start">
                <!-- Compact: naked solid folder icon (24px, neutral gray). Detailed: brand tile. -->
                <Icon
                  v-if="uiStore.groupListVariant === 'compact'"
                  name="folder"
                  variant="solid"
                  :size="24"
                  class="text-icon-neutral-secondary"
                />
                <div
                  v-else
                  class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-brand"
                >
                  <Icon name="folder" variant="solid" :size="24" class="text-white" />
                </div>
                <p
                  :class="[
                    'font-sans w-full truncate text-text-neutral',
                    uiStore.groupListVariant === 'compact'
                      ? 'font-medium text-[16px] leading-[1.5] tracking-[-0.48px]'
                      : 'font-semibold text-[20px] leading-[1.5] tracking-[-0.6px]',
                  ]"
                >
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
                    class="absolute top-[calc(100%+4px)] right-0 z-20 origin-top-right bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg py-[12px] flex flex-col gap-[4px] min-w-[220px]"
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
                        <Icon name="list-bullet" variant="solid" :size="20" class="shrink-0 text-icon-neutral-secondary" />
                        <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral whitespace-nowrap">
                          Détails
                        </span>
                      </button>
                    </div>
                    <div class="px-[4px] py-[2px]">
                      <button
                        type="button"
                        role="menuitem"
                        class="w-full flex items-center gap-[8px] p-[12px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                        @click="openSettings(g.id)"
                      >
                        <Icon name="cog-6-tooth" variant="outline" :size="20" class="shrink-0 text-icon-neutral-secondary" />
                        <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral whitespace-nowrap">
                          Paramètres
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

            <!-- Compact: 2 stats stacked as label/value rows (Figma 6042-23251) -->
            <template v-if="uiStore.groupListVariant === 'compact'">
              <div class="flex items-center gap-[16px] w-full">
                <p class="flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Badges
                </p>
                <p class="shrink-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral text-right whitespace-nowrap tabular-nums">
                  {{ groupStats(g.id).badges }}
                </p>
              </div>
              <div class="flex items-center gap-[16px] w-full">
                <p class="flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Manager
                </p>
                <p class="shrink-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral text-right whitespace-nowrap truncate max-w-[60%]">
                  {{ g.manager }}
                </p>
              </div>
            </template>

            <!-- Detailed: 3 stats (Badges / Véhicules / Conducteurs) -->
            <div v-else class="flex items-stretch gap-[8px] w-full">
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

      <!-- Header: illustration + back + title (left), Paramètres (right) -->
      <div class="flex items-center justify-between gap-[16px] anim-fade-up" style="animation-delay: 0ms">
        <div class="flex items-center gap-[12px] min-w-0 flex-1">
          <img
            :src="groupHeaderIllustration"
            alt=""
            aria-hidden="true"
            class="shrink-0 w-[96px] h-[88px] select-none pointer-events-none"
            draggable="false"
          />
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
        </div>
        <div class="shrink-0">
          <Button
            type="secondary"
            size="md"
            icon-left="cog-6-tooth"
            label="Paramètres"
            @click="openSettings(selectedGroup.id)"
          />
        </div>
      </div>

      <!-- Tabs -->
      <div class="anim-fade-up" style="animation-delay: 40ms">
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
        <!-- ── Tab: Infos et composition ──────────────────────────── -->
        <div v-if="activeTab === 'informations'" key="informations" class="flex flex-col gap-[32px]">

          <!-- KPI strip — Responsable / Badges / Véhicules / Conducteurs
               (Figma 6467-45264). Single bordered container with 4 columns
               separated by 1px vertical dividers on desktop (rows + top
               dividers on mobile). Each KPI carries a small brand icon
               tile, the value on top and the label below. -->
          <section class="bg-neutral border border-border-neutral-tertiary rounded-[16px] shadow-sm anim-fade-up" style="animation-delay: 60ms">
            <div class="flex flex-col lg:flex-row lg:items-stretch">
              <div class="flex-1 min-w-0 p-[24px] flex flex-col gap-[16px]">
                <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-brand">
                  <Icon name="identification" variant="solid" :size="24" class="text-white" />
                </div>
                <div class="flex flex-col gap-[4px] min-w-0">
                  <p class="font-sans font-semibold text-[24px] leading-[1.5] tracking-[-0.72px] text-text-neutral truncate">{{ selectedGroup.manager }}</p>
                  <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Responsable</p>
                </div>
              </div>
              <div class="flex-1 min-w-0 p-[24px] flex flex-col gap-[16px] border-t lg:border-t-0 lg:border-l border-border-neutral-tertiary">
                <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-brand">
                  <Icon name="charging-badge-pass" variant="solid" :size="24" class="text-white" />
                </div>
                <div class="flex flex-col gap-[4px] min-w-0">
                  <p class="font-sans font-semibold text-[24px] leading-[1.5] tracking-[-0.72px] text-text-neutral tabular-nums">{{ kpis.total }}</p>
                  <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Badges</p>
                </div>
              </div>
              <div class="flex-1 min-w-0 p-[24px] flex flex-col gap-[16px] border-t lg:border-t-0 lg:border-l border-border-neutral-tertiary">
                <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-brand">
                  <Icon name="car" variant="solid" :size="24" class="text-white" />
                </div>
                <div class="flex flex-col gap-[4px] min-w-0">
                  <p class="font-sans font-semibold text-[24px] leading-[1.5] tracking-[-0.72px] text-text-neutral tabular-nums">{{ kpis.withVehicle }}</p>
                  <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Véhicules</p>
                </div>
              </div>
              <div class="flex-1 min-w-0 p-[24px] flex flex-col gap-[16px] border-t lg:border-t-0 lg:border-l border-border-neutral-tertiary">
                <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-brand">
                  <Icon name="user-group" variant="solid" :size="24" class="text-white" />
                </div>
                <div class="flex flex-col gap-[4px] min-w-0">
                  <p class="font-sans font-semibold text-[24px] leading-[1.5] tracking-[-0.72px] text-text-neutral tabular-nums">{{ kpis.withDriver }}</p>
                  <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Conducteurs</p>
                </div>
              </div>
            </div>
          </section>

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
              <!-- Table card -->
              <section ref="tableBlockRef" class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-clip anim-fade-up" style="animation-delay: 100ms">
                <!-- Table header — search + Ajouter des badges, sits inside the
                     card with a hairline bottom border (Figma 6622-10793) -->
                <div class="flex items-center justify-between gap-[16px] p-[16px] border-b border-border-neutral-secondary">
                  <div class="flex-1 min-w-0 max-w-[256px]">
                    <Input
                      v-model="badgeSearch"
                      type="leadingIcon"
                      icon="magnifying-glass"
                      placeholder="Recherche"
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
                    <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center">
                      <Skeleton width="90px" height="14px" />
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
                    <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center">
                      <Skeleton width="120px" height="14px" />
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
                  <div class="flex-[300] min-w-[200px] px-[16px] py-[12px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                    Centre de coûts
                  </div>
                  <div class="w-[68px] shrink-0" aria-hidden="true" />
                </div>

                <!-- Empty state -->
                <div
                  v-if="badgePaginated.length === 0"
                  class="px-[24px] py-[48px] flex flex-col items-center justify-center gap-[8px] text-center"
                >
                  <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                    {{ badgeSearch ? 'Aucun badge' : 'Aucun badge dans ce groupe' }}
                  </p>
                  <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                    {{ badgeSearch
                      ? 'Aucun badge ne correspond à votre recherche.'
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
                      'hover:bg-neutral-secondary',
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

                    <!-- Véhicule — link colour matches Figma's
                         --text-link-medium token (#1e40af). -->
                    <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[12px] flex items-center">
                      <p class="min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] truncate">
                        <button
                          v-if="b.vehicle"
                          type="button"
                          class="text-text-link-medium hover:underline outline-none focus-visible:underline"
                          @click.stop
                        >{{ b.vehicle.plate }}</button>
                        <span v-else class="text-text-neutral-secondary" aria-label="Non rattaché">--</span>
                      </p>
                    </div>

                    <!-- Conducteur -->
                    <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[12px] flex items-center">
                      <p class="min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] truncate">
                        <button
                          v-if="b.driver"
                          type="button"
                          class="text-text-link-medium hover:underline outline-none focus-visible:underline"
                          @click.stop
                        >{{ b.driver.name }}</button>
                        <span v-else class="text-text-neutral-secondary" aria-label="Non rattaché">--</span>
                      </p>
                    </div>

                    <!-- Centre de coûts -->
                    <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[12px] pb-[16px] md:pb-[12px] flex items-center">
                      <p class="min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                        <template v-if="b.costCenter">{{ b.costCenter }}</template>
                        <span v-else aria-label="Aucun centre de coûts">--</span>
                      </p>
                    </div>

                    <!-- Row menu trigger — the menu itself lives in a
                         shared Teleport at the bottom of the template so
                         it can escape the table's overflow-clip. -->
                    <div class="w-full md:w-[68px] shrink-0 px-[24px] md:px-[16px] pb-[16px] md:pb-[12px] md:py-[12px] flex md:items-center md:justify-end">
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
                        @click.stop="toggleBadgeMenu(b.id, $event)"
                        @keydown.enter.stop
                        @keydown.space.stop
                      >
                        <Icon name="ellipsis-vertical" variant="outline" :size="20" />
                      </button>
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
                ref="tableBlockRef"
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

                  <!-- Table — bordered rounded container, same style as the create flow -->
                  <div class="border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-hidden">
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
                      <div class="flex-[300] min-w-[200px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                        Badge
                      </div>
                      <div class="flex-[300] min-w-[200px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                        Véhicule
                      </div>
                      <div class="flex-[300] min-w-[200px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                        Conducteur
                      </div>
                      <div class="flex-[300] min-w-[200px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                        Centre de coûts
                      </div>
                      <div class="w-[68px] shrink-0" aria-hidden="true" />
                    </div>

                    <!-- Empty -->
                    <div
                      v-if="addPaginated.length === 0"
                      class="px-[24px] py-[48px] flex flex-col items-center justify-center gap-[8px] text-center border-t border-border-neutral-tertiary"
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
                          'group/row w-full flex flex-col md:flex-row md:items-stretch md:min-h-[64px] border-t border-border-neutral-tertiary text-left anim-fade-up',
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
                        <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[12px] flex items-center">
                          <p class="min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                            <template v-if="b.driver">{{ b.driver.name }}</template>
                            <span v-else>--</span>
                          </p>
                        </div>
                        <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[12px] pb-[16px] md:pb-[12px] flex items-center">
                          <p class="min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                            <template v-if="b.costCenter">{{ b.costCenter }}</template>
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

        <!-- ── Tab: Règles de recharge — 3×2 grid (Figma 6464-10384) ────
             Two pills at the top right: origin (Hérité de la BU /
             Personnalisé) + status (Activé / Désactivé). The icon tile
             flips to the brand purple when the rule is on and to a flat
             gray when off. Same inherited↔custom principle as the
             per-badge cards (badges-cmb.vue). -->
        <div v-else key="charging-rules" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-[16px]">
          <button
            v-for="(rule, i) in rules"
            :key="rule.id"
            type="button"
            :style="{ animationDelay: `${40 + i * 30}ms` }"
            :class="[
              'group relative text-left flex flex-col gap-[24px] pt-[16px] px-[16px] pb-[24px] rounded-[16px] overflow-clip anim-fade-up border outline-none cursor-pointer h-full',
              'transition-[background-color,border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none',
              'shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]',
              selectedRuleId === rule.id
                ? 'bg-brand-surface border-border-brand-medium focus-visible:shadow-ring-brand'
                : 'bg-neutral border-border-neutral-tertiary focus-visible:shadow-ring-brand focus-visible:border-border-brand',
            ]"
            @click="onRuleClick(rule)"
            @mousemove="onRuleCardMove"
          >
            <!-- Mouse-tracking spotlight (Vercel-style). Sits behind the
                 content; opacity fades in on hover. Hidden once the card is
                 selected so the solid blue background isn't muddied. -->
            <span
              v-if="selectedRuleId !== rule.id"
              aria-hidden="true"
              class="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out motion-reduce:transition-none"
              style="background: radial-gradient(360px circle at var(--card-mx, 50%) var(--card-my, 50%), rgba(145, 195, 253, 0.28), transparent 60%);"
            />
            <div class="relative flex items-center justify-between gap-[8px] w-full">
              <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-brand">
                <Icon
                  :name="rule.icon"
                  :variant="rule.iconVariant"
                  :size="24"
                  class="text-white"
                />
              </div>
              <div class="shrink-0 flex items-center gap-[8px]">
                <span class="inline-flex items-center justify-center px-[10px] py-[2px] rounded-[16px] border border-[#e4e4e7] bg-[#fafafa] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-[#48566a] whitespace-nowrap">
                  {{ rule.origin === 'inherited' ? 'Hérité de la BU' : 'Personnalisé' }}
                </span>
                <span
                  :class="[
                    'inline-flex items-center justify-center px-[10px] py-[2px] rounded-[16px] border font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] whitespace-nowrap',
                    rule.statusIcon === 'check'
                      ? 'bg-[var(--bg-accent-brand)] border-[var(--border-brand-medium)] text-[var(--text-accent-brand)]'
                      : 'bg-[#fafafa] border-[#e4e4e7] text-[#48566a]',
                  ]"
                >
                  {{ rule.statusLabel }}
                </span>
              </div>
            </div>
            <div class="relative flex flex-col gap-[8px] w-full">
              <p class="font-sans font-medium text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
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

    <!-- ── Budget de recharge drawer (Figma 5980-28115) ─────────────────
         Header drops the rule name in favour of "Configuration"; the
         body opens with the section title + description, then stacks
         label/control rows with hairline separators. Backdrop closes
         on outside click. -->
    <Transition
      enter-active-class="transition-opacity duration-[200ms] ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-[160ms] ease-out motion-reduce:transition-none"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="budgetDrawerOpen"
        class="fixed inset-0 z-[39] bg-black/40"
        aria-hidden="true"
        @click="closeBudgetDrawer"
      />
    </Transition>

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
        aria-label="Configuration du budget de recharge"
      >
        <!-- Header -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[68px] border-b border-border-neutral-tertiary shrink-0">
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Configuration
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

        <!-- Body — origin banner + Budget section + Alerte section
             (Figma 6467-21083 / 6467-21158). Each section is a single
             card: a title row with the toggle inline, plus the editable
             sub-content folded into the same card when the toggle is on. -->
        <div class="flex-1 min-h-0 overflow-y-auto px-[16px] py-[16px] flex flex-col gap-[16px]">

          <!-- Origin banner — same shape as the reseau drawer. -->
          <section class="bg-neutral-secondary rounded-[12px] p-[16px] flex flex-col gap-[16px]">
            <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-brand">
              <Icon
                :name="budgetForm.draftOrigin === 'custom' ? 'lock-open' : 'lock-closed'"
                variant="solid"
                :size="24"
                class="text-white"
              />
            </div>
            <div class="flex flex-col gap-[4px]">
              <p class="font-sans font-medium text-[20px] leading-[1.5] tracking-[-0.6px] text-text-neutral">
                {{ budgetForm.draftOrigin === 'custom' ? 'Règle personnalisée' : 'Règle héritée de la BU' }}
              </p>
              <p v-if="budgetForm.draftOrigin === 'custom'" class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Cette règle est propre à ce groupe, elle ne suivra plus les modifications de la <span class="text-text-brand-medium hover:underline cursor-pointer">règle BU</span>.
              </p>
              <p v-else class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Cliquez sur personnaliser, pour définir des règles propre uniquement à ce groupe.
              </p>
            </div>
            <Button
              type="primary"
              size="md"
              :label="budgetForm.draftOrigin === 'custom' ? 'Suivre les règles de la BU' : 'Personnaliser'"
              @click="budgetForm.draftOrigin === 'custom' ? inheritBudget() : personalizeBudget()"
            />
          </section>

          <!-- Budget section — padded header + hairline + padded body.
               Body only renders (with the hairline above it) when there
               is something to show below the header. -->
          <section class="bg-neutral border border-border-neutral-secondary rounded-[12px] overflow-clip flex flex-col">
            <div class="p-[16px] flex items-center justify-between gap-[16px]">
              <span class="font-sans font-medium text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                Budget
              </span>
              <Toggle
                v-if="budgetForm.draftOrigin === 'custom'"
                v-model="budgetForm.active"
                size="md"
                aria-label="Activer le budget de recharge"
              />
            </div>

            <!-- Custom + active: budget mensuel input. -->
            <template v-if="budgetForm.draftOrigin === 'custom' && budgetForm.active">
              <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />
              <div class="p-[16px] flex flex-col gap-[6px]">
                <label class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
                  Budget mensuel
                </label>
                <Input
                  v-model="budgetForm.amount"
                  type="trailingText"
                  :addon-trailing-text="'Eur'"
                  :show-currency-icon="false"
                  :trailing-separator="false"
                  :destructive="budgetError"
                  placeholder="0,00"
                  :hint="budgetError ? 'Veuillez définir un budget supérieur à 0.00 €' : ''"
                  :show-hint="budgetError"
                />
              </div>
            </template>

            <!-- Inherited: read-only État + the configured Budget mensuel
                 when the rule overall is active (Figma 6467-21025 /
                 6467-21932). Hairline between rows. -->
            <template v-if="budgetForm.draftOrigin === 'inherited'">
              <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />
              <div class="p-[16px] flex flex-col gap-[16px]">
                <div class="flex items-center justify-between gap-[16px]">
                  <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                    État
                  </span>
                  <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral text-right">
                    {{ budgetForm.active ? 'Activé' : 'Désactivé' }}
                  </span>
                </div>
                <template v-if="budgetForm.active || alerteForm.active">
                  <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />
                  <div class="flex items-center justify-between gap-[16px]">
                    <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                      Budget mensuel
                    </span>
                    <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral text-right tabular-nums">
                      {{ budgetForm.amount }} Eur
                    </span>
                  </div>
                </template>
              </div>
            </template>
          </section>

          <!-- Alerte section — same shape as Budget. -->
          <section class="bg-neutral border border-border-neutral-secondary rounded-[12px] overflow-clip flex flex-col">
            <div class="p-[16px] flex items-center justify-between gap-[16px]">
              <span class="font-sans font-medium text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                Alerte
              </span>
              <Toggle
                v-if="budgetForm.draftOrigin === 'custom'"
                v-model="alerteForm.active"
                size="md"
                aria-label="Activer le seuil d'alerte"
              />
            </div>

            <!-- Custom + active: type dropdown + amount input. Amount
                 disabled with the same tooltip-explained constraint when
                 percentage type is selected without a budget. -->
            <template v-if="budgetForm.draftOrigin === 'custom' && alerteForm.active">
              <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />
              <div class="p-[16px] flex flex-col gap-[16px]">
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
                    v-model="alerteForm.amount"
                    type="trailingText"
                    :addon-trailing-text="alerteSuffix"
                    :show-currency-icon="false"
                    :trailing-separator="false"
                    :disabled="isAlerteAmountDisabled"
                    placeholder="0"
                  />
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
            </template>

            <!-- Inherited: read-only État + threshold when the rule
                 overall is active (mirrors Budget's behaviour). Hairline
                 between rows. -->
            <template v-if="budgetForm.draftOrigin === 'inherited'">
              <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />
              <div class="p-[16px] flex flex-col gap-[16px]">
                <div class="flex items-center justify-between gap-[16px]">
                  <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                    État
                  </span>
                  <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral text-right">
                    {{ alerteForm.active ? 'Activé' : 'Désactivé' }}
                  </span>
                </div>
                <template v-if="budgetForm.active || alerteForm.active">
                  <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />
                  <div class="flex items-center justify-between gap-[16px]">
                    <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                      Si le budget dépasse
                    </span>
                    <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral text-right tabular-nums">
                      {{ alerteForm.amount }}{{ alerteForm.type === 'percentage' ? '%' : ' Eur' }}
                    </span>
                  </div>
                </template>
              </div>
            </template>
          </section>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[69px] border-t border-border-neutral-tertiary shrink-0">
          <Button type="secondary" size="md" label="Annuler" @click="closeBudgetDrawer" />
          <Button type="primary" size="md" label="Enregistrer" @click="saveBudget" />
        </div>
      </aside>
    </Transition>

    <!-- ── Autorisations quotidiennes drawer (Figma 5980-29659) — same
         Configuration / Section Title pattern as the Budget et alertes
         drawer. Day rules stay as bordered sub-cards below the master
         toggle. -->
    <Transition
      enter-active-class="transition-opacity duration-[200ms] ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-[160ms] ease-out motion-reduce:transition-none"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="autorisationsDrawerOpen"
        class="fixed inset-0 z-[39] bg-black/40"
        aria-hidden="true"
        @click="closeAutorisationsDrawer"
      />
    </Transition>

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
        aria-label="Configuration des autorisations quotidiennes"
      >
        <!-- Header -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[68px] border-b border-border-neutral-tertiary shrink-0">
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Configuration
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

        <!-- Body — origin banner + master "Autorisations quotidiennes"
             card + day cards (Figma 6529-27036 / 6529-27845). The master
             card collapses to title + toggle in custom mode; an État row
             is shown in inherited. Each day card carries the 4 variants
             defined in 6529-27247: autorisé all-day / editing range /
             custom hours / blocked. -->
        <div class="flex-1 min-h-0 overflow-y-auto px-[16px] py-[16px] flex flex-col gap-[16px]">

          <!-- Origin banner — same shape as the budget/réseau drawers. -->
          <section class="bg-neutral-secondary rounded-[12px] p-[16px] flex flex-col gap-[16px]">
            <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-brand">
              <Icon
                :name="autorisationsForm.draftOrigin === 'custom' ? 'lock-open' : 'lock-closed'"
                variant="solid"
                :size="24"
                class="text-white"
              />
            </div>
            <div class="flex flex-col gap-[4px]">
              <p class="font-sans font-medium text-[20px] leading-[1.5] tracking-[-0.6px] text-text-neutral">
                {{ autorisationsForm.draftOrigin === 'custom' ? 'Règle personnalisée' : 'Règle héritée de la BU' }}
              </p>
              <p v-if="autorisationsForm.draftOrigin === 'custom'" class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Cette règle est propre à ce groupe, elle ne suivra plus les modifications de la <span class="text-text-brand-medium hover:underline cursor-pointer">règle BU</span>.
              </p>
              <p v-else class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Cliquez sur personnaliser, pour définir une règle propre uniquement à ce groupe.
              </p>
            </div>
            <Button
              type="primary"
              size="md"
              :label="autorisationsForm.draftOrigin === 'custom' ? 'Suivre les règles de la BU' : 'Personnaliser'"
              @click="autorisationsForm.draftOrigin === 'custom' ? inheritAutorisations() : personalizeAutorisations()"
            />
          </section>

          <!-- Master Autorisations card -->
          <section class="bg-neutral border border-border-neutral-secondary rounded-[12px] overflow-clip flex flex-col">
            <div class="p-[16px] flex items-center justify-between gap-[16px]">
              <span class="font-sans font-medium text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                Autorisations quotidiennes
              </span>
              <Toggle
                v-if="autorisationsForm.draftOrigin === 'custom'"
                v-model="autorisationsForm.active"
                size="md"
                aria-label="Activer les autorisations quotidiennes"
              />
            </div>
            <template v-if="autorisationsForm.draftOrigin === 'inherited'">
              <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />
              <div class="p-[16px] flex items-center justify-between gap-[16px]">
                <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                  État
                </span>
                <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral text-right">
                  {{ autorisationsForm.active ? 'Activé' : 'Désactivé' }}
                </span>
              </div>
            </template>
          </section>

          <!-- Day cards — surface when the master toggle is on. In custom
               mode every part is interactive; in inherited mode the cards
               are read-only summaries. -->
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
                :class="[
                  'rounded-[16px] border border-border-neutral-secondary overflow-clip flex flex-col gap-[16px] p-[16px] h-[125px] justify-center',
                  day.blocked ? 'bg-neutral-secondary' : 'bg-neutral',
                ]"
              >
                <!-- Header — day label + (custom only) red block toggle.
                     Matches Figma 6529-27247 exactly: parent holds the
                     16px padding + 16px gap, children are w-full. -->
                <div class="flex items-center gap-[16px] w-full">
                  <p
                    :class="[
                      'flex-1 min-w-0 font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px]',
                      day.blocked ? 'text-text-neutral-disabled' : 'text-text-neutral',
                    ]"
                  >
                    {{ day.label }}
                  </p>
                  <button
                    v-if="autorisationsForm.draftOrigin === 'custom'"
                    type="button"
                    role="switch"
                    :aria-checked="day.blocked"
                    :aria-label="`Bloquer ${day.label}`"
                    :class="[
                      'relative shrink-0 inline-flex items-center w-[36px] h-[20px] rounded-[12px] p-[2px] outline-none',
                      'transition-[background-color] duration-200 ease-out motion-reduce:transition-none',
                      'focus-visible:shadow-ring-gray',
                      day.blocked ? 'bg-danger' : 'bg-[var(--bg-neutral-tertiary)]',
                    ]"
                    @click="day.blocked = !day.blocked"
                  >
                    <span
                      class="block size-[16px] rounded-full bg-white shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_0_rgba(0,0,0,0.1)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                      :style="{ transform: day.blocked ? 'translateX(16px)' : 'translateX(0)' }"
                    />
                  </button>
                </div>

                <!-- Separator — full width of the padded area, 1px line via
                     border-t (color guaranteed by the same utility the card
                     border uses). Inset by 16px on each side because it
                     lives inside the parent's p-[16px]. -->
                <div class="w-full border-t border-border-neutral-secondary" aria-hidden="true" />

                <!-- Body — h-[37px] is fixed across every variant so the
                     overall card height never shifts. -->
                <div class="flex items-center gap-[16px] w-full h-[37px]">
                  <!-- Variant 4: blocked -->
                  <template v-if="day.blocked">
                    <p class="flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-disabled">
                      Bloqué toute la journée
                    </p>
                  </template>

                  <!-- Variant 2: editing time range (custom only) -->
                  <template v-else-if="day.editing && autorisationsForm.draftOrigin === 'custom'">
                    <div class="flex-1 min-w-0 flex items-center gap-[8px]">
                      <div class="flex-1 min-w-0 flex items-center gap-[8px] px-[12px] py-[8px] rounded-[8px] border border-border-neutral-secondary bg-neutral shadow-sm transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none focus-within:border-brand focus-within:shadow-ring-brand">
                        <Icon name="clock" variant="outline" :size="18" class="shrink-0 text-icon-neutral-secondary" />
                        <input
                          :value="day.start"
                          inputmode="numeric"
                          placeholder="00:00"
                          maxlength="5"
                          :aria-label="`Heure de début ${day.label}`"
                          class="flex-1 min-w-0 outline-none bg-transparent font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral placeholder:text-text-neutral-secondary"
                          @input="onDayTimeInput(day, 'start', $event)"
                          @blur="onDayTimeBlur(day, 'start')"
                        >
                      </div>
                      <span class="shrink-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">à</span>
                      <div class="flex-1 min-w-0 flex items-center gap-[8px] px-[12px] py-[8px] rounded-[8px] border border-border-neutral-secondary bg-neutral shadow-sm transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none focus-within:border-brand focus-within:shadow-ring-brand">
                        <Icon name="clock" variant="outline" :size="18" class="shrink-0 text-icon-neutral-secondary" />
                        <input
                          :value="day.end"
                          inputmode="numeric"
                          placeholder="00:00"
                          maxlength="5"
                          :aria-label="`Heure de fin ${day.label}`"
                          class="flex-1 min-w-0 outline-none bg-transparent font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral placeholder:text-text-neutral-secondary"
                          @input="onDayTimeInput(day, 'end', $event)"
                          @blur="onDayTimeBlur(day, 'end')"
                        >
                      </div>
                    </div>
                    <Button
                      type="secondary"
                      size="sm"
                      label="Valider"
                      @click="validateDayHours(day)"
                    />
                  </template>

                  <!-- Variant 3: saved custom hours (pencil + reset icons) -->
                  <template v-else-if="day.customHours">
                    <p class="flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                      Autorisé de {{ day.start }} à {{ day.end }}
                    </p>
                    <template v-if="autorisationsForm.draftOrigin === 'custom'">
                      <div class="shrink-0 flex items-center gap-[8px]">
                        <button
                          type="button"
                          class="flex items-center justify-center size-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                          :aria-label="`Modifier la plage horaire pour ${day.label}`"
                          @click="startEditingDay(day)"
                        >
                          <Icon name="pencil" variant="outline" :size="18" />
                        </button>
                        <button
                          type="button"
                          class="flex items-center justify-center size-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                          :aria-label="`Réinitialiser la plage horaire pour ${day.label}`"
                          @click="resetDayHours(day)"
                        >
                          <Icon name="arrow-path" variant="outline" :size="18" />
                        </button>
                      </div>
                    </template>
                  </template>

                  <!-- Variant 1: authorized all day (default) -->
                  <template v-else>
                    <p class="flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                      Autorisé toute la journée
                    </p>
                    <Button
                      v-if="autorisationsForm.draftOrigin === 'custom'"
                      type="secondary"
                      size="sm"
                      label="Modifier"
                      @click="startEditingDay(day)"
                    />
                  </template>
                </div>
              </article>
            </div>
          </Transition>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[69px] border-t border-border-neutral-tertiary shrink-0">
          <Button type="secondary" size="md" label="Annuler" @click="closeAutorisationsDrawer" />
          <Button
            type="primary"
            size="md"
            label="Enregistrer"
            :disabled="autorisationsForm.draftOrigin === 'inherited'"
            @click="saveAutorisations"
          />
        </div>
      </aside>
    </Transition>

    <!-- ── Blocage vacance drawer (Figma 5980-31045) — Configuration-style
         layout: Section Title block, Activé row, then the saved
         periods / creation form / "Nouvelle période" CTA. -->
    <Transition
      enter-active-class="transition-opacity duration-[200ms] ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-[160ms] ease-out motion-reduce:transition-none"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="vacanceDrawerOpen"
        class="fixed inset-0 z-[39] bg-black/40"
        aria-hidden="true"
        @click="closeVacanceDrawer"
      />
    </Transition>

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
        <!-- Header — same "Configuration" label as the other rule
             drawers (Figma 6529-29869). -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[68px] border-b border-border-neutral-tertiary shrink-0">
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Configuration
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

        <!-- Body — origin banner + master "Blocage vacance" card + period
             list / creation form (custom mode only). Figma 6529-29824 /
             6529-29869. -->
        <div class="flex-1 min-h-0 overflow-y-auto px-[16px] py-[16px] flex flex-col gap-[16px]">

          <!-- Origin banner — same shape as the other rule drawers. -->
          <section class="bg-neutral-secondary rounded-[12px] p-[16px] flex flex-col gap-[16px]">
            <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-brand">
              <Icon
                :name="vacanceForm.draftOrigin === 'custom' ? 'lock-open' : 'lock-closed'"
                variant="solid"
                :size="24"
                class="text-white"
              />
            </div>
            <div class="flex flex-col gap-[4px]">
              <p class="font-sans font-medium text-[20px] leading-[1.5] tracking-[-0.6px] text-text-neutral">
                {{ vacanceForm.draftOrigin === 'custom' ? 'Règle personnalisée' : 'Règle héritée de la BU' }}
              </p>
              <p v-if="vacanceForm.draftOrigin === 'custom'" class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Cette règle est propre à ce groupe, elle ne suivra plus les modifications de la <span class="text-text-brand-medium hover:underline cursor-pointer">règle BU</span>.
              </p>
              <p v-else class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Cliquez sur personnaliser, pour définir une règle propre uniquement à ce groupe.
              </p>
            </div>
            <Button
              type="primary"
              size="md"
              :label="vacanceForm.draftOrigin === 'custom' ? 'Suivre les règles de la BU' : 'Personnaliser'"
              @click="vacanceForm.draftOrigin === 'custom' ? inheritVacance() : personalizeVacance()"
            />
          </section>

          <!-- Master Blocage vacance card. Custom (Figma 6529-29869):
               single row, title left + toggle right. Inherited (Figma
               6529-30309 / 6529-30382): title + hairline + read-only
               État row, no description. -->
          <section
            v-if="vacanceForm.draftOrigin === 'custom'"
            class="bg-neutral border border-border-neutral-secondary rounded-[12px] p-[16px] flex items-center justify-between gap-[16px]"
          >
            <p class="font-sans font-medium text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
              Blocage vacance
            </p>
            <Toggle
              v-model="vacanceForm.active"
              size="md"
              aria-label="Activer le blocage vacance"
            />
          </section>
          <section
            v-else
            class="bg-neutral border border-border-neutral-secondary rounded-[12px] overflow-clip flex flex-col"
          >
            <div class="p-[16px]">
              <p class="font-sans font-medium text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                Blocage vacance
              </p>
            </div>
            <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />
            <div class="p-[16px] flex items-center justify-between gap-[16px]">
              <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                État
              </span>
              <span
                :class="[
                  'font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-right',
                  vacanceForm.active ? 'text-text-neutral' : 'text-text-neutral-disabled',
                ]"
              >
                {{ vacanceForm.active ? 'Activé' : 'Désactivé' }}
              </span>
            </div>
          </section>

          <!-- Inherited + active: read-only period cards (Figma
               6529-30451) when periods exist, else "Pas de période
               définie" placeholder (Figma 6529-30382). -->
          <template v-if="vacanceForm.draftOrigin === 'inherited' && vacanceForm.active">
            <div
              v-if="vacanceForm.periods.length"
              class="flex flex-col gap-[12px]"
            >
              <div
                v-for="period in vacanceForm.periods"
                :key="period.id"
                class="bg-neutral border border-border-neutral-secondary rounded-[16px] p-[16px] flex items-center gap-[16px]"
              >
                <Toggle
                  :model-value="period.active"
                  size="sm"
                  disabled
                  :aria-label="`${period.name} (lecture seule)`"
                />
                <div class="flex-1 min-w-0 flex flex-col">
                  <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral truncate">
                    {{ period.name }}
                  </p>
                  <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
                    {{ period.start }} - {{ period.end }}
                  </p>
                </div>
              </div>
            </div>
            <section
              v-else
              class="bg-neutral border border-border-neutral-secondary rounded-[12px] h-[80px] flex items-center justify-center px-[16px]"
            >
              <p class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                Pas de période définie
              </p>
            </section>
          </template>

          <!-- Period list + creation form + empty CTA — gated by master toggle -->
          <Transition
            enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            enter-from-class="opacity-0 -translate-y-[4px]"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-[4px]"
          >
            <div v-if="vacanceForm.active && vacanceForm.draftOrigin === 'custom'" class="flex flex-col gap-[12px]">
                <!-- Saved period cards -->
                <TransitionGroup
                  tag="div"
                  class="flex flex-col gap-[12px]"
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
                    class="bg-neutral border border-border-neutral-secondary rounded-[16px] p-[16px] flex items-center gap-[16px]"
                  >
                    <Toggle
                      v-model="period.active"
                      size="sm"
                      :aria-label="`Activer ${period.name}`"
                    />
                    <div class="flex-1 min-w-0 flex flex-col">
                      <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral truncate">
                        {{ period.name }}
                      </p>
                      <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
                        {{ period.start }} - {{ period.end }}
                      </p>
                    </div>
                    <div class="relative shrink-0">
                      <button
                        type="button"
                        :class="[
                          'flex items-center justify-center size-[36px] rounded-[8px] transition-[background-color,color,transform] duration-150 ease-out motion-reduce:transition-none active:scale-[0.95] outline-none focus-visible:shadow-ring-gray',
                          openVacancePeriodMenuId === period.id
                            ? 'bg-neutral-tertiary text-icon-neutral-primary'
                            : 'text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary',
                        ]"
                        :aria-label="`Options pour ${period.name}`"
                        :aria-expanded="openVacancePeriodMenuId === period.id"
                        aria-haspopup="menu"
                        @click.stop="toggleVacancePeriodMenu(period.id)"
                      >
                        <Icon name="ellipsis-horizontal" variant="outline" :size="20" />
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
                          v-if="openVacancePeriodMenuId === period.id"
                          class="absolute top-[calc(100%+4px)] right-0 z-20 origin-top-right bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg py-[12px] flex flex-col gap-[4px] min-w-[200px]"
                          role="menu"
                          @click.stop
                        >
                          <div class="px-[4px] py-[2px]">
                            <button
                              type="button"
                              role="menuitem"
                              class="w-full flex items-center gap-[8px] p-[12px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                              @click="editVacancePeriod(period.id)"
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
                              @click="deleteVacancePeriod(period.id)"
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
                    class="bg-neutral border border-border-neutral-secondary rounded-[16px] p-[16px] flex flex-col gap-[12px]"
                  >
                    <Input
                      v-model="vacanceForm.draft.name"
                      type="default"
                      size="md"
                      placeholder="Nom"
                      aria-label="Nom de la période"
                      @keydown.enter="addVacancePeriod"
                    />
                    <div class="relative">
                      <button
                        type="button"
                        :class="[
                          'flex items-center gap-[8px] w-full h-[44px] px-[12px] rounded-[8px] border bg-neutral shadow-sm transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none outline-none',
                          calendarOpen ? 'border-brand shadow-ring-brand' : 'border-border-neutral-secondary hover:border-border-neutral focus-visible:border-brand focus-visible:shadow-ring-brand',
                        ]"
                        :aria-expanded="calendarOpen"
                        aria-haspopup="dialog"
                        aria-label="Sélectionnez une période"
                        @click="calendarOpen = !calendarOpen"
                      >
                        <Icon name="calendar-days" variant="outline" :size="20" class="shrink-0 text-icon-neutral-secondary" />
                        <span
                          :class="[
                            'flex-1 min-w-0 text-left font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] truncate',
                            vacanceForm.draft.range ? 'text-text-neutral' : 'text-text-neutral-secondary',
                          ]"
                        >
                          {{ vacanceForm.draft.range || 'Sélectionnez une période' }}
                        </span>
                      </button>

                      <Transition
                        enter-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                        enter-from-class="opacity-0 -translate-y-[4px]"
                        enter-to-class="opacity-100 translate-y-0"
                        leave-active-class="transition-[opacity,transform] duration-[120ms] ease-out motion-reduce:transition-none"
                        leave-from-class="opacity-100 translate-y-0"
                        leave-to-class="opacity-0 -translate-y-[4px]"
                      >
                        <div
                          v-if="calendarOpen"
                          class="absolute top-[calc(100%+8px)] left-0 right-0 z-30 bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-lg p-[12px] flex flex-col gap-[8px]"
                          role="dialog"
                          aria-label="Sélecteur de date"
                        >
                          <!-- Month / year navigation — chevrons on the sides,
                               month label centered with a tiny year-stepper
                               (chevron-up/down) docked to its right (Figma). -->
                          <div class="flex items-center justify-between gap-[8px]">
                            <button
                              type="button"
                              class="flex items-center justify-center size-[28px] rounded-[6px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                              aria-label="Mois précédent"
                              @click="prevMonth"
                            >
                              <Icon name="chevron-left" variant="solid" :size="16" />
                            </button>
                            <div class="flex items-center gap-[6px]">
                              <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral capitalize tabular-nums">
                                {{ monthLabel }}
                              </p>
                              <div class="flex flex-col items-center justify-center -my-[2px]">
                                <button
                                  type="button"
                                  class="flex items-center justify-center w-[14px] h-[10px] rounded-[3px] text-icon-neutral-secondary hover:text-icon-neutral-primary hover:bg-neutral-secondary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                                  aria-label="Année suivante"
                                  @click="nextYear"
                                >
                                  <Icon name="chevron-up" variant="solid" :size="10" />
                                </button>
                                <button
                                  type="button"
                                  class="flex items-center justify-center w-[14px] h-[10px] rounded-[3px] text-icon-neutral-secondary hover:text-icon-neutral-primary hover:bg-neutral-secondary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                                  aria-label="Année précédente"
                                  @click="prevYear"
                                >
                                  <Icon name="chevron-down" variant="solid" :size="10" />
                                </button>
                              </div>
                            </div>
                            <button
                              type="button"
                              class="flex items-center justify-center size-[28px] rounded-[6px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                              aria-label="Mois suivant"
                              @click="nextMonth"
                            >
                              <Icon name="chevron-right" variant="solid" :size="16" />
                            </button>
                          </div>

                          <!-- Weekday labels — full-width tracks so the range
                               strip below joins seamlessly across cells. -->
                          <div class="grid grid-cols-7">
                            <div
                              v-for="d in ['lu','ma','me','je','ve','sa','di']"
                              :key="d"
                              class="h-[36px] flex items-center justify-center font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-text-neutral-secondary"
                            >
                              {{ d }}
                            </div>
                          </div>

                          <!-- Day grid — each cell carries an absolute range
                               strip (full / left-half / right-half) behind a
                               circular day button. Strip joins seamlessly
                               across cells because tracks have no gaps. -->
                          <div class="grid grid-cols-7">
                            <div
                              v-for="(cell, i) in calendarCells"
                              :key="i"
                              class="h-[36px] relative flex items-center justify-center"
                            >
                              <div
                                v-if="cellRangeStripe(cell)"
                                :class="[
                                  'absolute inset-y-[2px] bg-brand-surface',
                                  cellRangeStripe(cell) === 'full' ? 'inset-x-0' : '',
                                  cellRangeStripe(cell) === 'right' ? 'right-0 left-1/2' : '',
                                  cellRangeStripe(cell) === 'left' ? 'left-0 right-1/2' : '',
                                ]"
                                aria-hidden="true"
                              />
                              <button
                                type="button"
                                :class="[
                                  'relative size-[32px] flex items-center justify-center rounded-full font-sans text-[14px] leading-[1.5] tracking-[-0.42px] tabular-nums transition-colors duration-100 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray',
                                  isCellStart(cell) || isCellEnd(cell)
                                    ? 'bg-brand text-white font-medium'
                                    : isCellInRange(cell)
                                    ? 'text-text-brand-deep font-normal'
                                    : cell.inMonth
                                    ? 'text-text-neutral font-normal hover:bg-neutral-secondary'
                                    : 'text-text-neutral-secondary/60 font-normal hover:bg-neutral-secondary',
                                ]"
                                @click="selectCalendarDate(cell.date)"
                              >
                                {{ cell.day }}
                              </button>
                            </div>
                          </div>
                        </div>
                      </Transition>
                    </div>
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

                <!-- Empty CTA — only when the inline creation form is
                     not showing. Full label (Figma 6529-30015) when no
                     periods yet; compact "+"-only card (Figma 6529-30180)
                     once at least one period has been added. -->
                <button
                  v-if="!vacanceForm.creating && vacanceForm.periods.length === 0"
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
                <button
                  v-else-if="!vacanceForm.creating"
                  type="button"
                  class="w-full h-[64px] flex items-center justify-center rounded-[16px] border border-dashed border-border-neutral-secondary bg-neutral text-text-neutral-secondary hover:bg-neutral-hover hover:border-border-neutral transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-brand focus-visible:border-brand"
                  aria-label="Ajouter une nouvelle période de vacance"
                  @click="openVacanceCreate"
                >
                  <Icon name="plus" variant="outline" :size="24" class="shrink-0" />
                </button>
              </div>
            </Transition>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[69px] border-t border-border-neutral-tertiary shrink-0">
          <Button type="secondary" size="md" label="Annuler" @click="closeVacanceDrawer" />
          <Button
            type="primary"
            size="md"
            label="Enregistrer"
            :disabled="vacanceForm.draftOrigin === 'inherited'"
            @click="saveVacance"
          />
        </div>
      </aside>
    </Transition>

    <!-- ── Blocage réseau drawer (Figma 6123-13732) — Configuration-style
         layout. Body is a single row pairing "Réseaux autorisés" with
         a count and a "Bloquer des réseaux" CTA that opens the picker
         modal. -->
    <Transition
      enter-active-class="transition-opacity duration-[200ms] ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-[160ms] ease-out motion-reduce:transition-none"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="reseauDrawerOpen"
        class="fixed inset-0 z-[39] bg-black/40"
        aria-hidden="true"
        @click="closeReseauDrawer"
      />
    </Transition>

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
        aria-label="Bloquer des réseaux"
      >
        <!-- Header -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[68px] border-b border-border-neutral-tertiary shrink-0">
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Configuration
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

        <!-- Body — origin banner + Bloquer des réseaux section, optionally
             followed by the collapsible "Liste des réseaux bloqués" card
             (Figma 6467-26489). The section card adapts its content to
             the draftOrigin × active matrix. -->
        <div class="flex-1 min-h-0 overflow-y-auto px-[16px] py-[16px] flex flex-col gap-[16px]">

          <!-- Origin banner — read-only "Règle héritée de la BU" with a
               Personnaliser CTA, or editable "Règle personnalisée" with a
               Suivre les règles de la BU CTA. Background sits on
               bg-neutral-secondary so the banner reads as a meta /
               information block above the editable section card. -->
          <section class="bg-neutral-secondary rounded-[12px] p-[16px] flex flex-col gap-[16px]">
            <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-brand">
              <Icon
                :name="reseauForm.draftOrigin === 'custom' ? 'lock-open' : 'lock-closed'"
                variant="solid"
                :size="24"
                class="text-white"
              />
            </div>
            <div class="flex flex-col gap-[4px]">
              <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                {{ reseauForm.draftOrigin === 'custom' ? 'Règle personnalisée' : 'Règle héritée de la BU' }}
              </p>
              <p v-if="reseauForm.draftOrigin === 'custom'" class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Cette règle est propre à ce groupe, elle ne suivra plus les modifications de la <span class="text-text-brand-medium hover:underline cursor-pointer">règle BU</span>.
              </p>
              <p v-else class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Cliquez sur personnaliser, pour définir des règles propre uniquement à ce groupe.
              </p>
            </div>
            <Button
              type="primary"
              size="md"
              :label="reseauForm.draftOrigin === 'custom' ? 'Suivre les règles de la BU' : 'Personnaliser'"
              @click="reseauForm.draftOrigin === 'custom' ? inheritReseau() : personalizeReseau()"
            />
          </section>

          <!-- Bloquer des réseaux section — two stacked rows separated by a
               bottom border on the header row (Figma 6467-22576 /
               6467-22877). Mirrors the pays drawer's draftOrigin × active
               matrix. Header carries the title + toggle (custom only); the
               body row swaps between count + edit/trash (custom + active +
               filled), "Gérer les réseaux" CTA (custom + active + empty),
               read-only "État Désactivé" (inherited + inactive), or
               read-only count (inherited + active). -->
          <section class="bg-neutral border border-border-neutral-secondary rounded-[16px] overflow-clip flex flex-col">
            <!-- Header row -->
            <div
              :class="[
                'h-[69px] px-[16px] flex items-center gap-[16px]',
                (reseauForm.draftOrigin === 'inherited' || reseauForm.active)
                  ? 'border-b border-border-neutral-secondary'
                  : '',
              ]"
            >
              <span class="flex-1 min-w-0 font-sans font-medium text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
                Bloquer des réseaux
              </span>
              <Toggle
                v-if="reseauForm.draftOrigin === 'custom'"
                v-model="reseauForm.active"
                size="md"
                aria-label="Activer le blocage de réseaux"
              />
            </div>

            <!-- Custom + active body row -->
            <div
              v-if="reseauForm.draftOrigin === 'custom' && reseauForm.active"
              class="h-[76px] px-[16px] flex items-center gap-[16px]"
            >
              <p class="flex-1 min-w-0 font-sans text-[16px] leading-[1.5] tracking-[-0.48px] truncate">
                <span class="font-medium text-text-neutral tabular-nums">{{ reseauForm.blockedNetworks.length }} {{ reseauForm.blockedNetworks.length <= 1 ? 'réseau' : 'réseaux' }}</span>
                <span class="font-normal text-text-neutral-secondary">
                  {{ reseauForm.blockedNetworks.length <= 1 ? ' bloqué' : ' bloqués' }}
                </span>
              </p>
              <template v-if="reseauForm.blockedNetworks.length > 0">
                <div class="shrink-0 flex items-center gap-[8px]">
                  <button
                    type="button"
                    class="flex items-center justify-center p-[8px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                    aria-label="Modifier la liste de blocage"
                    @click="openNetworkPicker"
                  >
                    <Icon name="pencil" variant="outline" :size="20" />
                  </button>
                  <button
                    type="button"
                    class="flex items-center justify-center p-[8px] rounded-[8px] text-icon-neutral-secondary hover:bg-danger-surface hover:text-icon-danger transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                    aria-label="Vider la liste de blocage"
                    @click="clearReseauBlocklist"
                  >
                    <Icon name="trash" variant="outline" :size="20" />
                  </button>
                </div>
              </template>
              <Button v-else type="secondary" size="sm" label="Gérer les réseaux" @click="openNetworkPicker" />
            </div>

            <!-- Inherited + inactive body row: read-only État/Désactivé -->
            <div
              v-else-if="reseauForm.draftOrigin === 'inherited' && !reseauForm.active"
              class="h-[76px] px-[16px] flex items-center justify-between gap-[16px]"
            >
              <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                État
              </span>
              <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-disabled">
                Désactivé
              </span>
            </div>

            <!-- Inherited + active body row: read-only blocked count -->
            <div
              v-else-if="reseauForm.draftOrigin === 'inherited' && reseauForm.active"
              class="h-[76px] px-[16px] flex items-center gap-[16px]"
            >
              <p class="flex-1 min-w-0 font-sans text-[16px] leading-[1.5] tracking-[-0.48px] truncate">
                <span class="font-medium text-text-neutral tabular-nums">{{ reseauForm.blockedNetworks.length }} {{ reseauForm.blockedNetworks.length <= 1 ? 'réseau' : 'réseaux' }}</span>
                <span class="font-normal text-text-neutral-secondary">
                  {{ reseauForm.blockedNetworks.length <= 1 ? ' bloqué' : ' bloqués' }}
                </span>
              </p>
            </div>
          </section>

          <!-- Collapsible "Liste des réseaux bloqués" card — only when the
               rule is on and at least one network is blocked. Same shape as
               the pays drawer accordion (rounded-16, title 18px, p-8 chevron). -->
          <template v-if="reseauForm.active && reseauForm.blockedNetworks.length > 0">
            <div class="border border-border-neutral-secondary rounded-[16px] p-[16px] flex flex-col gap-[16px]">
              <div class="flex items-center justify-between gap-[16px]">
                <p class="flex-1 min-w-0 font-sans font-medium text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
                  Liste des réseaux bloqués
                </p>
                <button
                  type="button"
                  :aria-expanded="blockedNetworksListExpanded"
                  aria-label="Afficher ou masquer la liste"
                  class="shrink-0 flex items-center justify-center p-[8px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                  @click="blockedNetworksListExpanded = !blockedNetworksListExpanded"
                >
                  <Icon
                    :name="blockedNetworksListExpanded ? 'chevron-up' : 'chevron-down'"
                    variant="outline"
                    :size="20"
                  />
                </button>
              </div>

              <Transition
                enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                enter-from-class="opacity-0 -translate-y-[4px]"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-[4px]"
              >
                <div v-if="blockedNetworksListExpanded" class="flex flex-col gap-[16px]">
                  <div
                    v-for="net in blockedNetworkDetails"
                    :key="net.id"
                    class="flex items-center gap-[12px] p-[12px] rounded-[16px] bg-neutral-secondary"
                  >
                    <div class="shrink-0 size-[38px] rounded-[12px] bg-[#f1f5f9] border border-[#f1f5f9] flex items-center justify-center">
                      <p class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-[#94a3b8]">
                        {{ initialsFor(net.name) }}
                      </p>
                    </div>
                    <div class="min-w-0 flex flex-col">
                      <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-disabled truncate">
                        {{ net.name }}
                      </p>
                      <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-disabled truncate">
                        Réseau bloqué
                      </p>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[69px] border-t border-border-neutral-tertiary shrink-0">
          <Button type="secondary" size="md" label="Annuler" @click="closeReseauDrawer" />
          <Button type="primary" size="md" label="Enregistrer" @click="saveReseau" />
        </div>
      </aside>
    </Transition>

    <!-- ── Blocage pays drawer (Figma 6123-15654) — Configuration-style
         layout with Activé toggle, then a "Pays bloqués" row pairing a
         count with a "Bloquer des pays" CTA that opens the country picker
         modal. -->
    <Transition
      enter-active-class="transition-opacity duration-[200ms] ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-[160ms] ease-out motion-reduce:transition-none"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="paysDrawerOpen"
        class="fixed inset-0 z-[39] bg-black/40"
        aria-hidden="true"
        @click="closePaysDrawer"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-[320ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="paysDrawerOpen"
        class="fixed right-[8px] top-[8px] bottom-[8px] z-40 w-[424px] max-w-[calc(100%-16px)] bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] flex flex-col overflow-clip"
        role="dialog"
        aria-modal="true"
        aria-label="Gérer les pays autorisés"
      >
        <!-- Header -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[68px] border-b border-border-neutral-tertiary shrink-0">
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Configuration
          </p>
          <button
            type="button"
            class="shrink-0 flex items-center justify-center size-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
            aria-label="Fermer"
            @click="closePaysDrawer"
          >
            <Icon name="x-mark" variant="outline" :size="20" />
          </button>
        </div>

        <!-- Body — origin banner + Bloquer des pays section card,
             optionally followed by the collapsible "Liste des pays
             bloqués" card (Figma 6529-24720 / 6529-24721). Mirrors
             the réseau drawer's draftOrigin × active matrix. -->
        <div class="flex-1 min-h-0 overflow-y-auto px-[16px] py-[16px] flex flex-col gap-[16px]">

          <!-- Origin banner — read-only "Règle héritée de la BU" with a
               Personnaliser CTA, or editable "Règle personnalisée" with a
               Suivre les règles de la BU CTA. -->
          <section class="bg-neutral-secondary rounded-[12px] p-[16px] flex flex-col gap-[16px]">
            <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-brand">
              <Icon
                :name="paysForm.draftOrigin === 'custom' ? 'lock-open' : 'lock-closed'"
                variant="solid"
                :size="24"
                class="text-white"
              />
            </div>
            <div class="flex flex-col gap-[4px]">
              <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                {{ paysForm.draftOrigin === 'custom' ? 'Règle personnalisée' : 'Règle héritée de la BU' }}
              </p>
              <p v-if="paysForm.draftOrigin === 'custom'" class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Cette règle est propre à ce groupe, elle ne suivra plus les modifications de la <span class="text-text-brand-medium hover:underline cursor-pointer">règle BU</span>.
              </p>
              <p v-else class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Cliquez sur personnaliser, pour définir une règle propre uniquement à ce groupe.
              </p>
            </div>
            <Button
              type="primary"
              size="md"
              :label="paysForm.draftOrigin === 'custom' ? 'Suivre les règles de la BU' : 'Personnaliser'"
              @click="paysForm.draftOrigin === 'custom' ? inheritPays() : personalizePays()"
            />
          </section>

          <!-- Bloquer des pays section — two stacked rows separated by
               a bottom border on the header row (Figma 6529-24722 /
               6529-24724 / 6586-65288). Header carries the title +
               toggle (custom only); the body row swaps between count
               + edit/trash (custom + active), Gérer les pays CTA
               (custom + active + empty), read-only count (inherited
               + active) or "État Désactivé" (inherited + inactive). -->
          <section class="bg-neutral border border-border-neutral-secondary rounded-[16px] overflow-clip flex flex-col">
            <!-- Header row -->
            <div
              :class="[
                'h-[69px] px-[16px] flex items-center gap-[16px]',
                (paysForm.draftOrigin === 'inherited' || paysForm.active)
                  ? 'border-b border-border-neutral-secondary'
                  : '',
              ]"
            >
              <span class="flex-1 min-w-0 font-sans font-medium text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
                Bloquer des pays
              </span>
              <Toggle
                v-if="paysForm.draftOrigin === 'custom'"
                v-model="paysForm.active"
                size="md"
                aria-label="Activer le blocage de pays"
              />
            </div>

            <!-- Custom + active body row -->
            <div
              v-if="paysForm.draftOrigin === 'custom' && paysForm.active"
              class="h-[76px] px-[16px] flex items-center gap-[16px]"
            >
              <p class="flex-1 min-w-0 font-sans text-[16px] leading-[1.5] tracking-[-0.48px] truncate">
                <span class="font-medium text-text-neutral tabular-nums">{{ paysForm.blockedCountries.length }} pays</span>
                <span class="font-normal text-text-neutral-secondary">
                  {{ paysForm.blockedCountries.length <= 1 ? ' bloqué' : ' bloqués' }}
                </span>
              </p>
              <template v-if="paysForm.blockedCountries.length > 0">
                <div class="shrink-0 flex items-center gap-[8px]">
                  <button
                    type="button"
                    class="flex items-center justify-center p-[8px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                    aria-label="Modifier la liste de blocage"
                    @click="openCountryPicker"
                  >
                    <Icon name="pencil" variant="outline" :size="20" />
                  </button>
                  <button
                    type="button"
                    class="flex items-center justify-center p-[8px] rounded-[8px] text-icon-neutral-secondary hover:bg-danger-surface hover:text-icon-danger transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                    aria-label="Vider la liste de blocage"
                    @click="clearPaysBlocklist"
                  >
                    <Icon name="trash" variant="outline" :size="20" />
                  </button>
                </div>
              </template>
              <Button v-else type="secondary" size="sm" label="Gérer les pays" @click="openCountryPicker" />
            </div>

            <!-- Inherited + inactive body row: read-only État/Désactivé -->
            <div
              v-else-if="paysForm.draftOrigin === 'inherited' && !paysForm.active"
              class="h-[76px] px-[16px] flex items-center justify-between gap-[16px]"
            >
              <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                État
              </span>
              <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-disabled">
                Désactivé
              </span>
            </div>

            <!-- Inherited + active body row: read-only blocked count -->
            <div
              v-else-if="paysForm.draftOrigin === 'inherited' && paysForm.active"
              class="h-[76px] px-[16px] flex items-center gap-[16px]"
            >
              <p class="flex-1 min-w-0 font-sans text-[16px] leading-[1.5] tracking-[-0.48px] truncate">
                <span class="font-medium text-text-neutral tabular-nums">{{ paysForm.blockedCountries.length }} pays</span>
                <span class="font-normal text-text-neutral-secondary">
                  {{ paysForm.blockedCountries.length <= 1 ? ' bloqué' : ' bloqués' }}
                </span>
              </p>
            </div>
          </section>

          <!-- Collapsible "Liste des pays bloqués" card — only when the
               rule is on and at least one pays is blocked (Figma
               6529-24722 / 6529-24724). -->
          <template v-if="paysForm.active && paysForm.blockedCountries.length > 0">
            <div class="border border-border-neutral-secondary rounded-[16px] p-[16px] flex flex-col gap-[16px]">
              <div class="flex items-center justify-between gap-[16px]">
                <p class="flex-1 min-w-0 font-sans font-medium text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
                  Liste des pays bloqués
                </p>
                <button
                  type="button"
                  :aria-expanded="blockedCountriesListExpanded"
                  aria-label="Afficher ou masquer la liste"
                  class="shrink-0 flex items-center justify-center p-[8px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                  @click="blockedCountriesListExpanded = !blockedCountriesListExpanded"
                >
                  <Icon
                    :name="blockedCountriesListExpanded ? 'chevron-up' : 'chevron-down'"
                    variant="outline"
                    :size="20"
                  />
                </button>
              </div>

              <Transition
                enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                enter-from-class="opacity-0 -translate-y-[4px]"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-[4px]"
              >
                <div v-if="blockedCountriesListExpanded" class="flex flex-col gap-[16px]">
                  <div
                    v-for="c in blockedCountryDetails"
                    :key="c.id"
                    class="flex items-center gap-[12px] p-[12px] rounded-[16px] bg-neutral-secondary"
                  >
                    <img
                      :src="c.flagUrl"
                      :alt="`Drapeau ${c.name}`"
                      class="shrink-0 size-[24px] rounded-full object-cover opacity-50"
                      loading="lazy"
                    />
                    <div class="min-w-0 flex flex-col">
                      <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-disabled truncate">
                        {{ c.name }}
                      </p>
                      <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-disabled truncate">
                        Pays bloqué
                      </p>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[69px] border-t border-border-neutral-tertiary shrink-0">
          <Button type="secondary" size="md" label="Annuler" @click="closePaysDrawer" />
          <Button
            type="primary"
            size="md"
            label="Enregistrer"
            :disabled="paysForm.draftOrigin === 'inherited'"
            @click="savePays"
          />
        </div>
      </aside>
    </Transition>

    <!-- ── Network picker modal (Figma 6106-17325) — centered 800×800
         popup. Header = title + subtitle only. Filters row pairs
         Search + Trier with the Tout autorisé · Tout bloqué bulk
         actions. Body is a single-column list of network-card-inline
         rows with hairline separators. Footer puts the count on the
         left and Annuler + Valider on the right. -->
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
          v-if="networkPickerOpen"
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
          v-if="networkPickerOpen"
          class="fixed inset-0 z-[61] flex items-center justify-center p-[24px] pointer-events-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="network-picker-modal-title"
        >
          <div
            :class="[
              'pointer-events-auto w-full h-full max-h-[800px] flex gap-[8px]',
              uiStore.networkPickerVariant === 'super-partners' ? 'max-w-[1208px]' : 'max-w-[800px]',
            ]"
          >
            <!-- Decorative Super Partners side panel — single PNG, no inputs.
                 Figma 6106-14504 has two separate 400×800 + 800×800 cards
                 with an 8px gap between them, not one merged container. -->
            <aside
              v-if="uiStore.networkPickerVariant === 'super-partners'"
              class="hidden lg:block shrink-0 w-[400px] h-full bg-neutral border border-border-neutral-secondary rounded-[16px] overflow-hidden"
              aria-hidden="true"
            >
              <img :src="superPartnersSide" alt="" class="w-full h-full object-cover" />
            </aside>

          <div class="flex-1 min-w-0 max-h-full bg-neutral border border-border-neutral-secondary rounded-[16px] flex flex-col overflow-clip">
            <!-- Header — title + subtitle on the left, X close on the right (Figma `header`) -->
            <div class="flex items-center justify-between gap-[16px] px-[16px] py-[16px] border-b border-border-neutral-secondary shrink-0">
              <div class="flex flex-col gap-[2px] min-w-0">
                <p id="network-picker-modal-title" class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
                  {{ uiStore.networkPickerVariant === 'block-mode' ? 'Bloquer des réseaux' : 'Gérer les réseaux autorisés' }}
                </p>
                <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
                  {{ uiStore.networkPickerVariant === 'block-mode'
                    ? 'Bloquez les réseaux sur lesquels la recharge ne doit pas être autorisée.'
                    : 'Désactivez les réseaux sur lesquels la recharge ne doit pas être autorisée.' }}
                </p>
              </div>
              <button
                type="button"
                class="shrink-0 flex items-center justify-center size-[44px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                aria-label="Fermer"
                @click="cancelNetworkPicker"
              >
                <Icon name="x-mark" variant="outline" :size="20" />
              </button>
            </div>

            <!-- Filters row — Search + Trier on the left, Tout autorisé · Tout bloqué on the right -->
            <div class="flex items-center justify-between gap-[16px] px-[24px] py-[16px] border-b border-border-neutral-secondary shrink-0">
              <div class="flex items-center gap-[8px] min-w-0">
                <div class="w-[300px] min-w-[200px] max-w-full">
                  <Input
                    v-model="networkPicker.search"
                    type="leadingIcon"
                    icon="magnifying-glass"
                    size="md"
                    placeholder="Recherche"
                    aria-label="Rechercher un réseau"
                  />
                </div>
                <div class="relative shrink-0">
                  <button
                    type="button"
                    :aria-haspopup="true"
                    :aria-expanded="networkSortOpen"
                    class="inline-flex items-center justify-center gap-[8px] min-h-[44px] px-[16px] py-[8px] rounded-[8px] border border-border-neutral bg-neutral text-text-neutral-secondary font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] hover:bg-neutral-hover transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray active:scale-[0.98]"
                    @click.stop="networkSortOpen = !networkSortOpen"
                  >
                    <Icon name="funnel" variant="outline" :size="20" />
                    Trier
                  </button>
                  <!-- Sort dropdown menu (Figma 6138-41805) -->
                  <Transition
                    enter-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                    enter-from-class="opacity-0 scale-[0.97] -translate-y-[4px]"
                    enter-to-class="opacity-100 scale-100 translate-y-0"
                    leave-active-class="transition-[opacity,transform] duration-[120ms] ease-out motion-reduce:transition-none"
                    leave-from-class="opacity-100 scale-100 translate-y-0"
                    leave-to-class="opacity-0 scale-[0.97] -translate-y-[4px]"
                  >
                    <div
                      v-if="networkSortOpen"
                      ref="networkSortMenuRef"
                      role="menu"
                      class="absolute left-0 top-[calc(100%+4px)] z-20 min-w-[280px] bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg py-[12px] flex flex-col gap-[4px] origin-top-left"
                    >
                      <div
                        v-for="opt in networkSortItems"
                        :key="opt.value"
                        class="px-[4px] py-[2px]"
                      >
                        <button
                          type="button"
                          role="menuitemradio"
                          :aria-checked="networkPicker.sort === opt.value"
                          :class="[
                            'w-full flex items-center justify-between gap-[8px] p-[12px] rounded-[8px] text-left',
                            'transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray',
                            networkPicker.sort === opt.value
                              ? 'bg-neutral-hover'
                              : 'hover:bg-neutral-secondary',
                          ]"
                          @click="networkPicker.sort = opt.value; networkSortOpen = false"
                        >
                          <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                            {{ opt.label }}
                          </span>
                          <Icon
                            v-if="networkPicker.sort === opt.value"
                            name="check"
                            variant="outline"
                            :size="20"
                            class="shrink-0 text-icon-brand"
                          />
                        </button>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
              <div class="shrink-0 flex items-center gap-[8px]">
                <button
                  type="button"
                  :disabled="allVisibleAuthorized"
                  class="inline-flex items-center justify-center px-[12px] py-[8px] rounded-[8px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary hover:text-text-neutral hover:bg-neutral-secondary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-neutral-secondary"
                  @click="authorizeAllVisible"
                >
                  Tout autorisé
                </button>
                <div class="h-[24px] w-px bg-border-neutral-tertiary" aria-hidden="true" />
                <button
                  type="button"
                  :disabled="allVisibleBlocked"
                  class="inline-flex items-center justify-center px-[12px] py-[8px] rounded-[8px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary hover:text-text-neutral hover:bg-neutral-secondary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-neutral-secondary"
                  @click="blockAllVisible"
                >
                  Tout bloqué
                </button>
              </div>
            </div>

            <!-- Scrollable list of network-card-inline rows with hairline separators -->
            <div class="flex-1 min-h-0 overflow-y-auto px-[16px] py-[8px]">
              <div v-if="visibleNetworks.length === 0" class="h-full flex flex-col items-center justify-center gap-[8px] text-center py-[48px]">
                <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                  Aucun réseau trouvé
                </p>
                <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Essayez un autre terme de recherche.
                </p>
              </div>
              <template v-else>
                <template v-for="(net, i) in visibleNetworks" :key="net.id">
                  <div
                    v-if="i > 0"
                    class="my-[8px] h-px bg-border-neutral-tertiary"
                    aria-hidden="true"
                  />
                  <article
                    role="button"
                    tabindex="0"
                    :aria-pressed="!isNetworkAuthorized(net.id)"
                    :aria-label="`${net.name} — ${isNetworkAuthorized(net.id) ? 'autorisé' : 'bloqué'}. ${fmtStations(net.stations)} stations.`"
                    :class="[
                      'cursor-pointer flex items-center justify-between p-[12px] rounded-[16px]',
                      'transition-[background-color] duration-200 ease-out motion-reduce:transition-none',
                      'outline-none focus-visible:shadow-ring-gray',
                      uiStore.networkPickerVariant === 'block-mode'
                        ? 'bg-neutral hover:bg-neutral-secondary'
                        : isNetworkAuthorized(net.id)
                          ? 'bg-neutral hover:bg-neutral-secondary'
                          : 'bg-neutral-secondary hover:bg-neutral-tertiary',
                    ]"
                    @click="setNetworkAuthorized(net.id, !isNetworkAuthorized(net.id))"
                    @keydown.enter.prevent="setNetworkAuthorized(net.id, !isNetworkAuthorized(net.id))"
                    @keydown.space.prevent="setNetworkAuthorized(net.id, !isNetworkAuthorized(net.id))"
                  >
                    <div class="flex items-center gap-[12px] shrink-0">
                      <div
                        :class="[
                          'shrink-0 size-[38px] rounded-[12px] overflow-hidden flex items-center justify-center border',
                          isNetworkAuthorized(net.id)
                            ? 'bg-neutral-secondary border-border-neutral-tertiary'
                            : 'bg-[#f1f5f9] border-[#f1f5f9]',
                        ]"
                      >
                        <p
                          :class="[
                            'font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px]',
                            isNetworkAuthorized(net.id) ? 'text-text-neutral-secondary' : 'text-[#94a3b8]',
                          ]"
                        >
                          {{ initialsFor(net.name) }}
                        </p>
                      </div>
                      <div class="w-[250px] flex flex-col">
                        <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral truncate">
                          {{ net.name }}
                        </p>
                        <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] truncate">
                          <template v-if="uiStore.networkPickerVariant === 'block-mode'">
                            <template v-if="isNetworkAuthorized(net.id)">
                              <span class="text-text-neutral-secondary">{{ fmtStations(net.stations) }} stations autorisées</span>
                            </template>
                            <template v-else>
                              <span class="text-text-neutral-secondary">{{ fmtStations(net.stations) }} stations </span>
                              <span class="text-[#e21d48]">bloquées</span>
                            </template>
                          </template>
                          <template v-else-if="isNetworkAuthorized(net.id)">
                            <span class="text-text-neutral-secondary">{{ fmtStations(net.stations) }} stations autorisées</span>
                          </template>
                          <template v-else>
                            <span class="text-text-neutral-secondary">{{ fmtStations(net.stations) }} stations </span>
                            <span class="text-[#e21d48]">bloquées</span>
                          </template>
                        </p>
                      </div>
                    </div>
                    <div
                      v-if="net.superPartner"
                      :class="[
                        'shrink-0 inline-flex items-center gap-[4px] pl-[6px] pr-[8px] py-[2px] rounded-[16px] bg-[#faf5ff] border border-[#ead6ff]',
                        uiStore.networkPickerVariant === 'super-partners'
                          ? ''
                          : 'relative group/sp cursor-default',
                      ]"
                      :tabindex="uiStore.networkPickerVariant === 'super-partners' ? -1 : 0"
                      :role="uiStore.networkPickerVariant === 'super-partners' ? undefined : 'button'"
                      :aria-describedby="uiStore.networkPickerVariant === 'super-partners' ? undefined : `sp-tip-${net.id}`"
                      @click.stop
                      @keydown.enter.stop
                      @keydown.space.stop
                    >
                      <img :src="superPartnersIcon" alt="" aria-hidden="true" class="size-[12px] shrink-0" />
                      <span class="font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-[#9234ea] whitespace-nowrap">
                        Super Partners
                      </span>
                      <!-- Hover/focus tooltip — hidden in the super-partners variant
                           since the left card already explains the label. -->
                      <span
                        v-if="uiStore.networkPickerVariant !== 'super-partners'"
                        :id="`sp-tip-${net.id}`"
                        role="tooltip"
                        class="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-30 w-max max-w-[320px] px-[12px] py-[8px] rounded-[8px] bg-text-neutral text-white font-sans font-normal text-[13px] leading-[1.45] tracking-[-0.26px] text-left shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] opacity-0 -translate-y-[2px] transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none group-hover/sp:opacity-100 group-hover/sp:translate-y-0 group-focus-visible/sp:opacity-100 group-focus-visible/sp:translate-y-0 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:size-0 after:border-l-[8px] after:border-r-[8px] after:border-t-[6px] after:border-l-transparent after:border-r-transparent after:border-t-text-neutral"
                      >
                        Le label Super Partners distingue les réseaux de recharge offrant des tarifs négociés et une expérience utilisateur de confiance.
                      </span>
                    </div>
                    <!-- Toggle — lib component on default / super-partners; a
                         custom neutral↔rose track when block-mode is on
                         (Figma 6395-19503). The knob sits left on neutral
                         (authorised, status quo) and slides right on rose
                         (blocked, the active decision the user just made). -->
                    <button
                      v-if="uiStore.networkPickerVariant === 'block-mode'"
                      type="button"
                      role="switch"
                      :aria-checked="!isNetworkAuthorized(net.id)"
                      :aria-label="`${isNetworkAuthorized(net.id) ? 'Bloquer' : 'Autoriser'} ${net.name}`"
                      :class="[
                        'relative shrink-0 inline-flex items-center w-[36px] h-[20px] rounded-[12px] p-[2px] outline-none',
                        'transition-[background-color] duration-200 ease-out motion-reduce:transition-none',
                        'focus-visible:shadow-ring-gray',
                        isNetworkAuthorized(net.id) ? 'bg-[var(--bg-neutral-tertiary)]' : 'bg-[#e11d48]',
                      ]"
                      @click.stop="setNetworkAuthorized(net.id, !isNetworkAuthorized(net.id))"
                    >
                      <span
                        class="block size-[16px] rounded-full bg-white shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_0_rgba(0,0,0,0.1)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                        :style="{ transform: isNetworkAuthorized(net.id) ? 'translateX(0)' : 'translateX(16px)' }"
                      />
                    </button>
                    <Toggle
                      v-else
                      :model-value="isNetworkAuthorized(net.id)"
                      size="sm"
                      :aria-label="`Autoriser ${net.name}`"
                      @update:model-value="(v) => setNetworkAuthorized(net.id, v)"
                      @click.stop
                    />
                  </article>
                </template>
              </template>
            </div>

            <!-- Footer — count on the left, Annuler + Valider on the right (Figma bottom container) -->
            <div class="flex items-center justify-between gap-[16px] px-[24px] py-[16px] border-t border-border-neutral-secondary shrink-0">
              <p class="flex items-center gap-[4px] min-w-0 whitespace-nowrap">
                <span class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral tabular-nums">
                  {{ draftBlockedCount }}/{{ networks.length }}
                </span>
                <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Réseaux bloqués
                </span>
              </p>
              <div class="shrink-0 flex items-center gap-[12px]">
                <Button type="secondary" size="md" label="Annuler" @click="cancelNetworkPicker" />
                <Button type="primary" size="md" label="Valider" @click="confirmNetworkPicker" />
              </div>
            </div>
          </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Country picker modal (Figma 6123-14165) — same single-card
         pattern as the network picker, no side panel. Country rows show
         a circular flag, name, and "Pays autorisé / Pays bloqué". -->
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
          v-if="countryPickerOpen"
          class="fixed inset-0 z-[60] bg-black/40"
          aria-hidden="true"
          @click="cancelCountryPicker"
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
          v-if="countryPickerOpen"
          class="fixed inset-0 z-[61] flex items-center justify-center p-[24px] pointer-events-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="country-picker-modal-title"
        >
          <div
            class="pointer-events-auto w-full max-w-[800px] max-h-[840px] flex bg-neutral border border-border-neutral-secondary rounded-[16px] overflow-clip"
          >
            <div class="flex-1 min-w-0 max-h-full flex flex-col overflow-hidden">
              <!-- Header — icon tile (top-left) + X close (top-right),
                   title + subtitle below (Figma 6529-25981). Padding is
                   16px all around, the inner column gap is 16px, and
                   the title sits 2px above its subtitle. -->
              <div class="p-[16px] border-b border-border-neutral-secondary shrink-0 flex flex-col gap-[16px]">
                <div class="flex items-start justify-between gap-[16px]">
                  <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-brand">
                    <Icon name="flag" variant="solid" :size="24" class="text-white" />
                  </div>
                  <button
                    type="button"
                    class="shrink-0 flex items-center justify-center p-[12px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                    aria-label="Fermer"
                    @click="cancelCountryPicker"
                  >
                    <Icon name="x-mark" variant="outline" :size="20" />
                  </button>
                </div>
                <div class="flex flex-col gap-[2px]">
                  <p id="country-picker-modal-title" class="font-sans font-medium text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                    Bloquer des pays
                  </p>
                  <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                    Désactivez les pays dans lesquels la recharge ne doit pas être autorisée.
                  </p>
                </div>
              </div>

              <!-- Search row — full-width search input, p-[24px] per
                   Figma 6529-25991. -->
              <div class="px-[24px] py-[16px] border-b border-border-neutral-secondary shrink-0">
                <div class="w-[300px] min-w-[200px] max-w-full">
                  <Input
                    v-model="countryPicker.search"
                    type="leadingIcon"
                    icon="magnifying-glass"
                    size="md"
                    placeholder="Recherche"
                    aria-label="Rechercher un pays"
                  />
                </div>
              </div>

              <!-- Scrollable list -->
              <div class="flex-1 min-h-0 overflow-y-auto px-[16px] py-[8px]">
                <div v-if="visibleCountries.length === 0" class="h-full flex flex-col items-center justify-center gap-[8px] text-center py-[48px]">
                  <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                    Aucun pays trouvé
                  </p>
                  <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                    Essayez un autre terme de recherche.
                  </p>
                </div>
                <template v-else>
                  <template v-for="(c, i) in visibleCountries" :key="c.id">
                    <div
                      v-if="i > 0"
                      class="my-[8px] h-px bg-border-neutral-tertiary"
                      aria-hidden="true"
                    />
                    <article
                      role="button"
                      tabindex="0"
                      :aria-pressed="!isCountryAuthorized(c.id)"
                      :aria-label="`${c.name} — ${isCountryAuthorized(c.id) ? 'autorisé' : 'bloqué'}.`"
                      :class="[
                        'cursor-pointer flex items-center justify-between p-[12px] rounded-[16px] overflow-clip',
                        'transition-[background-color] duration-200 ease-out motion-reduce:transition-none',
                        'outline-none focus-visible:shadow-ring-gray',
                        isCountryAuthorized(c.id)
                          ? 'bg-neutral hover:bg-neutral-secondary'
                          : 'bg-neutral-secondary hover:bg-neutral-tertiary',
                      ]"
                      @click="setCountryAuthorized(c.id, !isCountryAuthorized(c.id))"
                      @keydown.enter.prevent="setCountryAuthorized(c.id, !isCountryAuthorized(c.id))"
                      @keydown.space.prevent="setCountryAuthorized(c.id, !isCountryAuthorized(c.id))"
                    >
                      <div class="flex items-center gap-[12px] shrink-0">
                        <img
                          :src="c.flagUrl"
                          alt=""
                          aria-hidden="true"
                          :class="[
                            'shrink-0 size-[24px] rounded-full object-cover',
                            'transition-opacity duration-200 ease-out motion-reduce:transition-none',
                            !isCountryAuthorized(c.id) ? 'opacity-50' : '',
                          ]"
                          loading="lazy"
                        />
                        <div class="w-[250px] flex flex-col">
                          <p
                            :class="[
                              'font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] truncate',
                              isCountryAuthorized(c.id) ? 'text-text-neutral' : 'text-text-neutral-disabled',
                            ]"
                          >
                            {{ c.name }}
                          </p>
                          <p
                            :class="[
                              'font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] truncate',
                              isCountryAuthorized(c.id) ? 'text-text-neutral-secondary' : 'text-text-neutral-disabled',
                            ]"
                          >
                            {{ isCountryAuthorized(c.id) ? 'Pays autorisé' : 'Pays bloqué' }}
                          </p>
                        </div>
                      </div>
                      <!-- Toggle — neutral track when autorisé, red
                           (bg-danger) track when bloqué (Figma 6123-13872). -->
                      <button
                        type="button"
                        role="switch"
                        :aria-checked="!isCountryAuthorized(c.id)"
                        :aria-label="`${isCountryAuthorized(c.id) ? 'Bloquer' : 'Autoriser'} ${c.name}`"
                        :class="[
                          'relative shrink-0 inline-flex items-center w-[36px] h-[20px] rounded-[12px] p-[2px] outline-none',
                          'transition-[background-color] duration-200 ease-out motion-reduce:transition-none',
                          'focus-visible:shadow-ring-gray',
                          isCountryAuthorized(c.id) ? 'bg-neutral-tertiary' : 'bg-danger',
                        ]"
                        @click.stop="setCountryAuthorized(c.id, !isCountryAuthorized(c.id))"
                      >
                        <span
                          class="block size-[16px] rounded-full bg-white shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_0_rgba(0,0,0,0.1)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                          :style="{ transform: isCountryAuthorized(c.id) ? 'translateX(0)' : 'translateX(16px)' }"
                        />
                      </button>
                    </article>
                  </template>
                </template>
              </div>

              <!-- Footer — count grows to fill, Tout autorisé + Tout
                   bloqué grouped, then Valider separated (Figma
                   6529-25981 / 6580-56665). No Annuler — the X in the
                   header closes the modal. -->
              <div class="flex items-center gap-[8px] px-[24px] py-[16px] border-t border-border-neutral-secondary shrink-0">
                <p class="flex flex-1 min-w-0 items-center gap-[4px] whitespace-nowrap">
                  <span class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral tabular-nums">
                    {{ draftBlockedCountriesCount }}/{{ countries.length }}
                  </span>
                  <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                    Pays bloqués
                  </span>
                </p>
                <div class="shrink-0 flex items-center gap-[8px]">
                  <Button
                    type="secondary"
                    size="md"
                    label="Tout autorisé"
                    :disabled="allVisibleCountriesAuthorized"
                    @click="authorizeAllVisibleCountries"
                  />
                  <Button
                    type="secondary"
                    size="md"
                    label="Tout bloqué"
                    :disabled="allVisibleCountriesBlocked"
                    @click="blockAllVisibleCountries"
                  />
                </div>
                <Button type="primary" size="md" label="Valider" @click="confirmCountryPicker" />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Ajouter des badges modal (Figma 6131-33437) — centered popup
         alternative to the in-page table swap. Selected via the sandbox
         "Ajout badges" toggle. Search + checkbox-table + footer count
         with Annuler / Valider. -->
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
          v-if="addBadgesModalOpen"
          class="fixed inset-0 z-[60] bg-black/40"
          aria-hidden="true"
          @click="cancelAddBadgesModal"
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
          v-if="addBadgesModalOpen"
          class="fixed inset-0 z-[61] flex items-center justify-center p-[24px] pointer-events-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-badges-modal-title"
        >
          <div class="pointer-events-auto w-full max-w-[800px] h-full max-h-[800px] bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] flex flex-col overflow-clip">
            <!-- Header — title + close X -->
            <div class="flex items-center justify-between gap-[32px] px-[16px] py-[16px] border-b border-border-neutral-secondary shrink-0">
              <p id="add-badges-modal-title" class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
                Ajouter des badges
              </p>
              <button
                type="button"
                class="shrink-0 flex items-center justify-center size-[44px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                aria-label="Fermer"
                @click="cancelAddBadgesModal"
              >
                <Icon name="x-mark" variant="outline" :size="20" />
              </button>
            </div>

            <!-- Filters — search only (Figma) -->
            <div class="flex items-center gap-[8px] px-[24px] py-[16px] border-b border-border-neutral-secondary shrink-0">
              <div class="w-[300px] min-w-[200px] max-w-full">
                <Input
                  v-model="addSearch"
                  type="leadingIcon"
                  icon="magnifying-glass"
                  size="md"
                  placeholder="Recherche"
                  aria-label="Rechercher un badge"
                />
              </div>
            </div>

            <!-- Body — full-width table, sticky header, infinite scroll -->
            <div class="flex-1 min-h-0 flex flex-col">
              <!-- Header row — full width, sits flush with the modal walls -->
              <div class="hidden md:flex items-stretch w-full bg-neutral-tertiary min-h-[40px] shrink-0">
                <div class="w-[48px] shrink-0 px-[16px] py-[12px] flex items-center">
                  <button
                    type="button"
                    role="checkbox"
                    :aria-checked="addModalSomeSelected ? 'mixed' : (addModalAllSelected ? 'true' : 'false')"
                    :aria-label="addModalAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'"
                    :class="[
                      'size-[16px] rounded-[4px] border flex items-center justify-center transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand',
                      (addModalAllSelected || addModalSomeSelected)
                        ? 'bg-brand border-brand'
                        : 'bg-neutral border-border-neutral-secondary hover:border-border-neutral',
                    ]"
                    @click="toggleSelectAllVisibleForModal"
                  >
                    <Icon v-if="addModalAllSelected" name="check" variant="solid" :size="12" class="text-white" />
                    <Icon v-else-if="addModalSomeSelected" name="minus" variant="solid" :size="12" class="text-white" />
                  </button>
                </div>
                <div class="flex-[300] min-w-[160px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Badge
                </div>
                <div class="flex-[300] min-w-[160px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Véhicule
                </div>
                <div class="flex-[300] min-w-[160px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Conducteur
                </div>
                <div class="flex-[300] min-w-[160px] px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Centre de coûts
                </div>
              </div>

              <!-- Scrollable row area (infinite scroll, see loadMoreAddModal) -->
              <div class="flex-1 min-h-0 overflow-y-auto" @scroll.passive="onAddModalScroll">
                <!-- Empty -->
                <div
                  v-if="addModalVisible.length === 0 && !addModalLoading"
                  class="px-[24px] py-[48px] flex flex-col items-center justify-center gap-[8px] text-center"
                >
                  <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                    {{ addSearch ? 'Aucun badge' : 'Aucun badge disponible' }}
                  </p>
                  <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                    {{ addSearch
                      ? 'Aucun badge non rattaché ne correspond à votre recherche.'
                      : 'Tous les badges sont déjà rattachés à un groupe.' }}
                  </p>
                </div>

                <!-- Rows -->
                <div v-else>
                  <button
                    v-for="(b, i) in addModalVisible"
                    :key="b.id"
                    type="button"
                    :aria-pressed="selectedToAdd.has(b.id)"
                    :style="{ animationDelay: `${(i % addModalChunk) * 20}ms` }"
                    :class="[
                      'group/row w-full flex flex-col md:flex-row md:items-stretch md:min-h-[64px] border-b border-border-neutral-tertiary text-left anim-fade-up',
                      'transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:bg-neutral-secondary',
                      'hover:bg-neutral-secondary',
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
                    <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[12px] flex items-center">
                      <p class="min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                        <template v-if="b.driver">{{ b.driver.name }}</template>
                        <span v-else>--</span>
                      </p>
                    </div>
                    <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[12px] pb-[16px] md:pb-[12px] flex items-center">
                      <p class="min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                        <template v-if="b.costCenter">{{ b.costCenter }}</template>
                        <span v-else>--</span>
                      </p>
                    </div>
                  </button>
                </div>

                <!-- Lazy-load skeleton rows — shown while the next chunk is
                     simulated as fetching. Same column proportions as the
                     real rows so the layout doesn't shift on swap. -->
                <div v-if="addModalLoading">
                  <div
                    v-for="i in addModalSkeletonRows"
                    :key="`add-skel-${i}`"
                    class="w-full hidden md:flex items-stretch min-h-[64px] border-b border-border-neutral-tertiary"
                  >
                    <div class="w-[48px] shrink-0 px-[16px] py-[12px] flex items-center">
                      <Skeleton width="16px" height="16px" rounded="4px" />
                    </div>
                    <div class="flex-[300] min-w-[160px] px-[16px] py-[12px] flex items-center">
                      <Skeleton width="140px" height="14px" rounded="4px" />
                    </div>
                    <div class="flex-[300] min-w-[160px] px-[16px] py-[12px] flex items-center">
                      <Skeleton width="110px" height="14px" rounded="4px" />
                    </div>
                    <div class="flex-[300] min-w-[160px] px-[16px] py-[12px] flex items-center">
                      <Skeleton width="160px" height="14px" rounded="4px" />
                    </div>
                    <div class="flex-[300] min-w-[160px] px-[16px] py-[12px] flex items-center">
                      <Skeleton width="120px" height="14px" rounded="4px" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer — count on the left, Annuler + Ajouter les badges on the right -->
            <div class="flex items-center justify-between gap-[8px] px-[24px] py-[16px] border-t border-border-neutral-secondary shrink-0">
              <p class="flex items-baseline gap-[2px] min-w-0 whitespace-nowrap">
                <span class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral tabular-nums">
                  {{ selectedToAdd.size }} {{ selectedToAdd.size === 1 ? 'badge' : 'badges' }}
                </span>
                <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                  {{ selectedToAdd.size === 1 ? 'Sélectionné' : 'Sélectionnés' }}
                </span>
              </p>
              <div class="shrink-0 flex items-center gap-[12px]">
                <Button type="secondary" size="md" label="Annuler" @click="cancelAddBadgesModal" />
                <Button type="primary" size="md" label="Ajouter les badges" :disabled="addBadgesModalMode === 'detail' && selectedToAdd.size === 0" @click="confirmAddBadgesModal" />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>


    <!-- ── Badge row kebab menu (teleported) ─────────────────────────────
         The table card uses overflow-clip for its rounded corners, so the
         per-row menu lives at the page root and gets fixed-positioned
         from the trigger's rect on open. -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        enter-from-class="opacity-0 scale-[0.96] -translate-y-[4px]"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-[120ms] ease-out motion-reduce:transition-none"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-[0.96] -translate-y-[4px]"
      >
        <div
          v-if="currentMenuBadge"
          :style="{ top: badgeMenuPos.top + 'px', right: badgeMenuPos.right + 'px' }"
          class="fixed z-[60] origin-top-right bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg py-[8px] flex flex-col min-w-[220px]"
          role="menu"
          @click.stop
        >
          <div class="px-[4px]">
            <button
              type="button"
              role="menuitem"
              class="w-full flex items-center gap-[8px] p-[12px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
              @click="transferBadge(currentMenuBadge)"
            >
              <Icon name="switch-horizontal" variant="outline" :size="20" class="shrink-0 text-icon-neutral-secondary" />
              <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral whitespace-nowrap">
                Transférer
              </span>
            </button>
          </div>
          <div class="px-[4px]">
            <button
              type="button"
              role="menuitem"
              class="w-full flex items-center gap-[8px] p-[12px] rounded-[8px] text-left hover:bg-danger-surface transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-error"
              @click="removeBadge(currentMenuBadge)"
            >
              <Icon name="trash" variant="outline" :size="20" class="shrink-0 text-icon-danger" />
              <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-danger-medium whitespace-nowrap">
                Supprimer du groupe
              </span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Transfer-badges modal (Figma 6529-11525) ──────────────────────
         Compact picker fronting both transfer entry points (per-row
         kebab + bulk pill). Lists the BU's other groups; on confirm,
         the selected badge id set is reassigned and a toast acknowledges.
         Backdrop / X = Annuler. -->
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
          v-if="transferModalOpen"
          class="fixed inset-0 z-[70] bg-black/40"
          aria-hidden="true"
          @click="closeTransferModal"
        />
      </Transition>

      <Transition
        enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        enter-from-class="opacity-0 scale-[0.96] translate-y-[8px]"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-[0.97] translate-y-[6px]"
      >
        <div
          v-if="transferModalOpen"
          class="fixed inset-0 z-[71] flex items-center justify-center p-[24px] pointer-events-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-modal-title"
          aria-describedby="transfer-modal-desc"
        >
          <div class="pointer-events-auto w-full max-w-[600px] bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] flex flex-col">
            <!-- Header — title row + X + description below, hairline at
                 the bottom (Figma 6529-34908). -->
            <div class="flex flex-col gap-[8px] px-[24px] py-[16px] border-b border-border-neutral-secondary">
              <div class="flex items-center gap-[16px]">
                <p id="transfer-modal-title" class="flex-1 min-w-0 font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                  Transférer des badges
                </p>
                <button
                  type="button"
                  class="shrink-0 flex items-center justify-center size-[24px] text-icon-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray rounded-[4px]"
                  aria-label="Fermer"
                  @click="closeTransferModal"
                >
                  <Icon name="x-mark" variant="outline" :size="20" />
                </button>
              </div>
              <p id="transfer-modal-desc" class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Transférer les badges vers un autre groupe de cette Business unit.
              </p>
            </div>

            <!-- Body — target group dropdown only -->
            <div class="px-[24px] py-[16px] flex flex-col gap-[6px] border-b border-border-neutral-secondary">
              <label class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
                Sélectionnez le groupe cible
              </label>
              <Dropdown
                v-model="transferTargetGroupId"
                :items="transferGroupItems"
                placeholder="Sélectionnez un groupe"
                :searchable="false"
                :show-label="false"
                :show-hint="false"
              />
            </div>

            <!-- Footer — Annuler + Transférer aligned right -->
            <div class="flex items-center justify-end gap-[12px] px-[24px] py-[16px]">
              <Button type="secondary" size="md" label="Annuler" @click="closeTransferModal" />
              <Button
                type="primary"
                size="md"
                label="Transférer"
                :disabled="!transferTargetGroupId"
                @click="confirmTransfer"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Floating selection pill — adaptive (Supprimer in view, Ajouter in add).
         Anchored 32px from viewport bottom by default; if the table ends
         short of the viewport, the pill rides up to sit 32px below the
         table so it doesn't float in empty space. -->
    <div
      class="pointer-events-none fixed left-0 right-0 z-40 flex justify-center px-[24px] md:left-[304px] md:px-[32px] transition-[bottom] duration-200 ease-out motion-reduce:transition-none"
      :style="{ bottom: pillBottomPx + 'px' }"
    >
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
              {{ pillCount > 1 ? 'badges' : 'badge' }}
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
          <!-- Action area — single CTA when adding, Transférer + Supprimer pair
               (with a vertical divider between them) when removing. Figma
               5931-23349 surfaces both bulk actions on the dark pill. -->
          <div class="flex items-center gap-[4px]">
            <template v-if="pillMode === 'add'">
              <button
                type="button"
                class="flex items-center gap-[8px] px-[8px] h-[32px] rounded-[8px] text-[#f1f5f9] hover:bg-white/10 transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand"
                @click="runPillAction"
              >
                <Icon name="plus" variant="outline" :size="20" />
                <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
                  Ajouter
                </span>
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                class="flex items-center gap-[8px] px-[8px] h-[32px] rounded-[8px] text-[#f1f5f9] hover:bg-white/10 transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand"
                @click="bulkTransferSelected"
              >
                <Icon name="switch-horizontal" variant="outline" :size="20" />
                <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
                  Transférer
                </span>
              </button>
              <div class="h-[16px] w-px bg-[#344256]" aria-hidden="true" />
              <button
                type="button"
                class="flex items-center gap-[8px] px-[8px] h-[32px] rounded-[8px] text-[#f1f5f9] hover:bg-white/10 transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand"
                @click="runPillAction"
              >
                <Icon name="trash" variant="outline" :size="20" />
                <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
                  Supprimer du groupe
                </span>
              </button>
            </template>
          </div>
        </div>
      </Transition>
    </div>

    <!-- ── New-group onboarding popover (Figma 6529-39169) ───────────────
         Surfaced right after a group is created and the user lands on
         the new detail. Encourages configuring charging rules. Sits in
         the bottom-right above the bulk-action pill / table content. -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        enter-from-class="opacity-0 translate-y-[16px]"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-[16px]"
      >
        <div
          v-if="newGroupTipOpen"
          ref="newGroupTipRef"
          class="fixed bottom-[24px] right-[24px] z-[55] w-[340px] bg-neutral border border-border-neutral-tertiary rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] p-[16px] flex flex-col gap-[16px] cursor-pointer"
          role="dialog"
          aria-labelledby="new-group-tip-title"
          @click="openRulesDiscovery"
        >
          <!-- Illustration section (Figma 6529-40070) — single PNG that
               already carries the gray surround + stacked card shadow. -->
          <img
            :src="newGroupTipIllustration"
            alt=""
            aria-hidden="true"
            class="w-full h-auto block rounded-[12px]"
          />

          <!-- Tip copy -->
          <div class="flex flex-col gap-[4px]">
            <p id="new-group-tip-title" class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
              Appliquez des règles de recharges !
            </p>
            <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
              Définissez des règles de recharge applicables à l'ensemble du groupe afin de mieux maîtriser les usages de vos conducteurs et le budget de votre flotte.
            </p>
          </div>

          <!-- Actions — full-width split, Fermer (tertiary) / Découvrir.
               The whole card is clickable too, so the buttons stop the
               click so they don't double-fire. -->
          <div class="flex items-stretch gap-[8px]" @click.stop>
            <Button class="flex-1" type="tertiaryGray" size="sm" label="Fermer" @click="closeNewGroupTip" />
            <Button class="flex-1" type="primary" size="sm" label="Découvrir" @click="openRulesDiscovery" />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Rules discovery modal (Figma 6538-40440) ─────────────────────
         Opens from the onboarding popover. Larger card with the same
         illustration, fuller copy and a 5-rule bulleted list. Enters
         via a FLIP morph from the popover's bounding rect. -->
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
          v-if="rulesDiscoveryOpen"
          class="fixed inset-0 z-[70] bg-black/40"
          aria-hidden="true"
          @click="closeRulesDiscovery"
        />
      </Transition>

      <Transition
        :css="false"
        @enter="onRulesDiscoveryEnter"
        @leave="onRulesDiscoveryLeave"
      >
        <div
          v-if="rulesDiscoveryOpen"
          class="fixed inset-0 z-[71] flex items-center justify-center p-[24px] pointer-events-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rules-discovery-title"
        >
          <div
            ref="rulesDiscoveryRef"
            class="pointer-events-auto w-full max-w-[600px] bg-neutral border border-border-neutral-tertiary rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] p-[16px] flex flex-col gap-[16px]"
          >
            <img
              :src="newGroupTipIllustration"
              alt=""
              aria-hidden="true"
              class="w-full h-auto block rounded-[12px]"
            />
            <div class="flex flex-col gap-[8px]">
              <p id="rules-discovery-title" class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                Appliquez des règles de recharge !
              </p>
              <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Définissez des règles de recharge applicables à l'ensemble du groupe afin de mieux maîtriser les usages de vos conducteurs et le budget de votre flotte.
              </p>
              <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Par défaut, tous les badges du groupe héritent des règles définies au niveau de votre Business unit. Vous pouvez aussi en configurer certaines spécifiquement pour ce groupe, parmi :
              </p>
              <ul class="list-disc pl-[20px] flex flex-col gap-[2px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                <li>Budget et alertes mensuels</li>
                <li>Autorisations quotidiennes</li>
                <li>Blocage vacance</li>
                <li>Bloquer des réseaux</li>
                <li>Bloquer des pays</li>
              </ul>
            </div>
            <div class="flex items-stretch gap-[8px]">
              <Button class="flex-1" type="tertiaryGray" size="md" label="Fermer" @click="closeRulesDiscovery" />
              <Button class="flex-1" type="primary" size="md" label="Découvrir" @click="discoverChargingRules" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
