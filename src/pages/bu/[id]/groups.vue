<script setup lang="ts">
const headingClass = usePageHeadingClass()
const uiStore = useUiStore()
import { ref, computed, reactive, watch } from 'vue'

interface BadgeDriver { name: string; initials: string }
interface BadgeVehicle { model: string; plate: string }
interface Badge {
  id: string
  identifier: string
  driver: BadgeDriver | null
  vehicle: BadgeVehicle | null
  groupId: string | null
}
interface Group {
  id: string
  name: string
}

// Realistic FR fleet pools — drivers, vehicles. Seed walks them with a
// deterministic offset per group so each group has a distinct distribution.
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

let badgeSerial = 78000
function makeBadge(groupId: string | null, slot: number): Badge {
  badgeSerial += 7 + (slot % 5)
  // Spread linkage so the table tells a real story:
  //   60% driver + vehicle, 20% vehicle only (pool car),
  //   15% driver only (badge issued, vehicle pending), 5% neither.
  const m = (slot + (groupId?.charCodeAt(2) ?? 17)) % 20
  const hasDriver  = !(m === 0 || m === 5 || m === 9 || m === 14)
  const hasVehicle = !(m === 3 || m === 11 || m === 17 || m === 0)
  return {
    id: `b-${groupId ?? 'pool'}-${slot}`,
    identifier: `CMB-${badgeSerial.toString().padStart(5, '0')}`,
    driver:  hasDriver  ? driverPool[(slot * 3 + (groupId?.length ?? 0)) % driverPool.length]   : null,
    vehicle: hasVehicle ? vehiclePool[(slot * 5 + (groupId?.length ?? 0)) % vehiclePool.length] : null,
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

// Single source of truth: every badge in the BU, with its groupId (or null
// for the unassigned pool). Add = set groupId; Remove = set groupId to null.
const allBadges = reactive<Badge[]>([
  ...seedBadges('g-1', 22),
  ...seedBadges('g-2', 18),
  ...seedBadges('g-3', 16),
  ...seedBadges('g-4', 20),
  ...seedBadges('g-5', 16),
  ...seedBadges('g-6', 14),
  ...seedBadges('g-7', 12),
  ...seedBadges(null, 28),
])

// Derived stats — listing cards and detail subhead both read from here, so
// add/remove flips the visible numbers immediately.
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

// Card-level ellipsis menu — one open at a time, close on outside click.
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
  clearUndo()
  dismissToast()
}

const badgesInGroup = computed(() =>
  selectedGroup.value
    ? allBadges.filter(b => b.groupId === selectedGroup.value!.id)
    : [],
)
const selectedStats = computed(() => selectedGroup.value
  ? groupStats(selectedGroup.value.id)
  : { badges: 0, drivers: 0, vehicles: 0 },
)

// Detail: badge search + pagination scoped to the selected group.
const badgeSearch = ref('')
function matches(b: Badge, q: string) {
  if (!q) return true
  return b.identifier.toLowerCase().includes(q)
    || (b.driver?.name.toLowerCase().includes(q) ?? false)
    || (b.vehicle?.model.toLowerCase().includes(q) ?? false)
    || (b.vehicle?.plate.toLowerCase().includes(q) ?? false)
}
const filteredBadges = computed(() => {
  const q = badgeSearch.value.trim().toLowerCase()
  return badgesInGroup.value.filter(b => matches(b, q))
})
const badgePage = ref(1)
const badgePerPage = 10
const badgePageCount = computed(() => Math.max(1, Math.ceil(filteredBadges.value.length / badgePerPage)))
const badgePaginated = computed(() => {
  const start = (badgePage.value - 1) * badgePerPage
  return filteredBadges.value.slice(start, start + badgePerPage)
})
const badgeRangeStart = computed(() => filteredBadges.value.length === 0 ? 0 : (badgePage.value - 1) * badgePerPage + 1)
const badgeRangeEnd = computed(() => Math.min(badgePage.value * badgePerPage, filteredBadges.value.length))
watch(badgeSearch, () => { badgePage.value = 1 })

// ── Add mode ───────────────────────────────────────────────────────────────
const isAddingBadges = ref(false)
const addSearch = ref('')
const addPage = ref(1)
const addPerPage = 10
const selectedToAdd = reactive(new Set<string>())

// View-mode multi-select for bulk remove. Keyed by badge id so selection
// survives pagination / search changes; cleared on mode transitions and
// when the user leaves the detail view.
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

const availableBadges = computed(() => allBadges.filter(b => b.groupId === null))
const filteredAvailable = computed(() => {
  const q = addSearch.value.trim().toLowerCase()
  return availableBadges.value.filter(b => matches(b, q))
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
// Master checkbox: tri-state (all / some / none) on the visible (paginated) rows.
const visibleAllSelected = computed(() =>
  addPaginated.value.length > 0 && addPaginated.value.every(b => selectedToAdd.has(b.id)),
)
const visibleSomeSelected = computed(() =>
  addPaginated.value.some(b => selectedToAdd.has(b.id)) && !visibleAllSelected.value,
)
function toggleSelectAllVisible() {
  if (visibleAllSelected.value) addPaginated.value.forEach(b => selectedToAdd.delete(b.id))
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

// ── Remove with undo (single + bulk) ───────────────────────────────────────
// Single trash and bulk "Retirer N badge(s)" both go through this — the
// toast's "Annuler" button restores the saved badgeIds to their previous
// group. Stored as an array so the same code handles both flows.
type PendingUndo = { badgeIds: string[]; groupId: string }
let pendingUndo: PendingUndo | null = null
function removeBadge(b: Badge) {
  if (!b.groupId) return
  pendingUndo = { badgeIds: [b.id], groupId: b.groupId }
  b.groupId = null
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

// FR-locale count formatter.
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

      <!-- Content -->
      <div class="flex flex-col gap-[24px]">

        <!-- Search -->
        <div class="w-[350px] max-w-full anim-fade-up" style="animation-delay: 50ms">
          <Input
            v-model="search"
            type="leadingIcon"
            icon="magnifying-glass"
            placeholder="Recherche"
          />
        </div>

        <!-- Groups grid -->
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
            <!-- Header: folder tile + name (left), ellipsis menu (right) -->
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

            <!-- Separator -->
            <div class="h-px w-full shrink-0 bg-border-neutral-tertiary" />

            <!-- Stats row: 3 columns separated by thin vertical dividers -->
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

        <!-- Empty state (search with no results) -->
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

        <!-- Footer: range + pagination -->
        <div class="flex items-center justify-between pt-[8px] anim-fade-up" style="animation-delay: 200ms">
          <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Afficher&nbsp;: <span class="font-medium text-text-neutral">{{ rangeStart }}</span> à
            <span class="font-medium text-text-neutral">{{ rangeEnd }}</span> sur
            <span class="font-medium text-text-neutral">{{ filtered.length }}</span> résultats
          </p>

          <div class="flex items-center gap-[8px]">
            <button
              type="button"
              class="flex items-center justify-center w-[36px] h-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out motion-reduce:transition-none active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-icon-neutral-secondary outline-none focus-visible:shadow-ring-gray"
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
              class="flex items-center justify-center w-[36px] h-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out motion-reduce:transition-none active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-icon-neutral-secondary outline-none focus-visible:shadow-ring-gray"
              :disabled="page === pageCount"
              aria-label="Page suivante"
              @click="goto(page + 1)"
            >
              <Icon name="chevron-right" variant="solid" :size="18" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer spacer -->
      <div class="h-[60px]" />
    </div>

    <!-- ── DETAIL ──────────────────────────────────────────────────────── -->
    <div
      v-else
      class="mx-auto w-full flex flex-col gap-[32px]"
      :style="{ maxWidth: uiStore.getMaxWidth('/bu/groups') + 'px' }"
    >

      <!-- Header: back + name + metric subhead -->
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
          <p class="mt-[8px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            <span class="font-medium text-text-neutral tabular-nums">{{ selectedStats.badges }}</span> badges
            <span class="mx-[8px]" aria-hidden="true">·</span>
            <span class="font-medium text-text-neutral tabular-nums">{{ selectedStats.vehicles }}</span> véhicules
            <span class="mx-[8px]" aria-hidden="true">·</span>
            <span class="font-medium text-text-neutral tabular-nums">{{ selectedStats.drivers }}</span> conducteurs
          </p>
        </div>
      </div>

      <!-- Badges card -->
      <section
        class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-clip anim-fade-up"
        style="animation-delay: 80ms"
      >
        <Transition
          mode="out-in"
          enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
          enter-from-class="opacity-0 translate-y-[6px]"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-[4px]"
        >
          <!-- ── VIEW MODE ──────────────────────────────────────────── -->
          <div v-if="!isAddingBadges" key="view">
            <!-- Card header -->
            <div class="flex flex-col gap-[16px] p-[24px] border-b border-border-neutral-tertiary">
              <div class="flex items-center justify-between gap-[16px] flex-wrap">
                <div class="flex items-center gap-[12px] min-w-0">
                  <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                    Badges
                  </p>
                  <span class="inline-flex items-center px-[8px] h-[22px] rounded-full bg-neutral-tertiary font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-text-neutral-secondary tabular-nums">
                    {{ fmtCount(filteredBadges.length) }}
                  </span>
                </div>
                <Button
                  type="secondary"
                  size="md"
                  icon-left="plus"
                  label="Ajouter un badge"
                  @click="enterAddMode"
                />
              </div>
              <div class="w-full max-w-[420px]">
                <Input
                  v-model="badgeSearch"
                  type="leadingIcon"
                  icon="magnifying-glass"
                  placeholder="Rechercher un badge, conducteur, véhicule…"
                />
              </div>
            </div>

            <!-- Table header -->
            <div class="hidden md:flex items-stretch w-full bg-neutral-tertiary min-h-[40px]">
              <div class="w-[56px] shrink-0 px-[20px] py-[10px] flex items-center">
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
              <div class="flex-[280] min-w-[220px] px-[8px] py-[10px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Badge
              </div>
              <div class="flex-[300] min-w-[200px] px-[16px] py-[10px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Conducteur
              </div>
              <div class="flex-[320] min-w-[220px] px-[16px] py-[10px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Véhicule
              </div>
              <div class="w-[80px] shrink-0" aria-hidden="true" />
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
                {{ badgeSearch ? 'Aucun badge ne correspond à cette recherche.' : 'Ajoutez un badge pour commencer.' }}
              </p>
            </div>

            <!-- Table rows -->
            <TransitionGroup
              v-else
              tag="div"
              enter-active-class="transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              enter-from-class="opacity-0 -translate-y-[6px]"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              leave-from-class="opacity-100 translate-x-0"
              leave-to-class="opacity-0 translate-x-[12px]"
              move-class="transition-transform duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
            >
              <div
                v-for="b in badgePaginated"
                :key="b.id"
                role="button"
                tabindex="0"
                :aria-pressed="selectedToRemove.has(b.id)"
                :class="[
                  'group/row relative flex flex-col md:flex-row md:items-stretch w-full md:min-h-[68px] border-t border-border-neutral-tertiary first:border-t-0 cursor-pointer outline-none',
                  'transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:bg-neutral-secondary',
                  selectedToRemove.has(b.id) ? 'bg-brand-surface hover:bg-brand-surface' : 'hover:bg-neutral-secondary',
                ]"
                @click="toggleRemoveSelection(b.id)"
                @keydown.enter="toggleRemoveSelection(b.id)"
                @keydown.space.prevent="toggleRemoveSelection(b.id)"
              >
                <!-- Checkbox -->
                <div class="w-full md:w-[56px] shrink-0 px-[24px] md:px-[20px] pt-[16px] md:pt-[10px] md:py-[10px] flex md:items-center">
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

                <!-- Badge identifier -->
                <div class="flex-[280] min-w-0 px-[24px] md:px-[8px] py-[8px] md:py-[10px] flex items-center gap-[12px]">
                  <div class="shrink-0 flex items-center justify-center size-[36px] rounded-[10px] bg-brand-surface">
                    <Icon name="charging-badge-pass" variant="solid" :size="20" class="text-text-brand-deep" />
                  </div>
                  <p class="min-w-0 font-mono font-medium text-[14px] leading-[1.5] tracking-[-0.28px] text-text-neutral truncate">
                    {{ b.identifier }}
                  </p>
                </div>

                <!-- Conducteur -->
                <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[10px] flex items-center gap-[10px]">
                  <template v-if="b.driver">
                    <div class="shrink-0 flex items-center justify-center size-[28px] rounded-full bg-brand-surface">
                      <span class="font-sans font-semibold text-[11px] leading-none tracking-[-0.22px] text-text-brand-deep">
                        {{ b.driver.initials }}
                      </span>
                    </div>
                    <p class="min-w-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                      {{ b.driver.name }}
                    </p>
                  </template>
                  <span
                    v-else
                    class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary italic"
                  >
                    Non rattaché
                  </span>
                </div>

                <!-- Véhicule -->
                <div class="flex-[320] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[10px] flex items-center gap-[10px]">
                  <template v-if="b.vehicle">
                    <p class="min-w-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                      {{ b.vehicle.model }}
                    </p>
                    <span class="shrink-0 inline-flex items-center px-[8px] h-[22px] rounded-[6px] border border-border-neutral-tertiary bg-neutral-tertiary font-mono font-medium text-[12px] leading-none tracking-[-0.24px] text-text-neutral-secondary">
                      {{ b.vehicle.plate }}
                    </span>
                  </template>
                  <span
                    v-else
                    class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary italic"
                  >
                    Non rattaché
                  </span>
                </div>

                <!-- Remove action (trailing) — single-row quick delete -->
                <div class="w-full md:w-[80px] shrink-0 px-[24px] md:px-[16px] pb-[16px] md:pb-[10px] md:py-[10px] flex md:items-center md:justify-end">
                  <button
                    type="button"
                    class="flex items-center justify-center size-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-danger-surface hover:text-icon-danger focus-visible:bg-danger-surface focus-visible:text-icon-danger transition-[background-color,color,transform] duration-150 ease-out motion-reduce:transition-none active:scale-[0.95] outline-none focus-visible:shadow-ring-gray"
                    :aria-label="`Retirer le badge ${b.identifier} du groupe`"
                    @click.stop="removeBadge(b)"
                    @keydown.enter.stop
                    @keydown.space.stop
                  >
                    <Icon name="trash" variant="outline" :size="18" />
                  </button>
                </div>
              </div>
            </TransitionGroup>

            <!-- Pagination footer -->
            <TableFooter
              v-if="filteredBadges.length > 0"
              :page="badgePage"
              :page-count="badgePageCount"
              :range-start="badgeRangeStart"
              :range-end="badgeRangeEnd"
              :total="filteredBadges.length"
              @update:page="(n) => (badgePage = n)"
            />

            <!-- Bulk action bar — visible while 1+ badges are selected -->
            <Transition
              enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              enter-from-class="opacity-0 translate-y-[8px]"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-[8px]"
            >
              <div
                v-if="selectedToRemove.size > 0"
                class="flex items-center justify-between gap-[16px] px-[24px] py-[16px] border-t border-border-neutral-tertiary bg-neutral"
              >
                <div class="flex items-center gap-[12px] min-w-0">
                  <span class="inline-flex items-center px-[8px] h-[22px] rounded-full bg-brand-surface font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-text-brand-deep tabular-nums">
                    {{ fmtCount(selectedToRemove.size) }} sélectionné{{ selectedToRemove.size > 1 ? 's' : '' }}
                  </span>
                  <button
                    type="button"
                    class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary hover:text-text-neutral transition-colors duration-150 ease-out outline-none rounded-[4px] focus-visible:shadow-ring-gray"
                    @click="clearRemoveSelection"
                  >
                    Désélectionner
                  </button>
                </div>
                <Button
                  type="destructive"
                  size="md"
                  icon-left="trash"
                  :label="selectedToRemove.size === 1
                    ? 'Retirer du groupe'
                    : `Retirer ${fmtCount(selectedToRemove.size)} badges`"
                  @click="bulkRemoveSelected"
                />
              </div>
            </Transition>
          </div>

          <!-- ── ADD MODE ───────────────────────────────────────────── -->
          <div v-else key="add">
            <!-- Card header (add mode) -->
            <div class="flex flex-col gap-[16px] p-[24px] border-b border-border-neutral-tertiary">
              <div class="flex items-center justify-between gap-[16px] flex-wrap">
                <div class="flex items-center gap-[12px] min-w-0">
                  <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                    Ajouter des badges
                  </p>
                  <Transition
                    enter-active-class="transition-[opacity,transform] duration-[180ms] ease-out motion-reduce:transition-none"
                    enter-from-class="opacity-0 scale-[0.92]"
                    enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition-[opacity,transform] duration-[120ms] ease-out motion-reduce:transition-none"
                    leave-from-class="opacity-100 scale-100"
                    leave-to-class="opacity-0 scale-[0.92]"
                  >
                    <span
                      v-if="selectedToAdd.size > 0"
                      class="inline-flex items-center px-[8px] h-[22px] rounded-full bg-brand-surface font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-text-brand-deep tabular-nums"
                    >
                      {{ fmtCount(selectedToAdd.size) }} sélectionné{{ selectedToAdd.size > 1 ? 's' : '' }}
                    </span>
                  </Transition>
                </div>
                <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  <span class="tabular-nums">{{ fmtCount(filteredAvailable.length) }}</span> badge{{ filteredAvailable.length > 1 ? 's' : '' }} non rattaché{{ filteredAvailable.length > 1 ? 's' : '' }}
                </span>
              </div>
              <div class="w-full max-w-[420px]">
                <Input
                  v-model="addSearch"
                  type="leadingIcon"
                  icon="magnifying-glass"
                  placeholder="Rechercher un badge, conducteur, véhicule…"
                />
              </div>
            </div>

            <!-- Table header (add mode, with master checkbox) -->
            <div class="hidden md:flex items-stretch w-full bg-neutral-tertiary min-h-[40px]">
              <div class="w-[56px] shrink-0 px-[20px] py-[10px] flex items-center">
                <button
                  type="button"
                  role="checkbox"
                  :aria-checked="visibleSomeSelected ? 'mixed' : (visibleAllSelected ? 'true' : 'false')"
                  :aria-label="visibleAllSelected ? 'Tout désélectionner' : 'Tout sélectionner sur cette page'"
                  :class="[
                    'size-[16px] rounded-[4px] border flex items-center justify-center transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand',
                    (visibleAllSelected || visibleSomeSelected)
                      ? 'bg-brand border-brand'
                      : 'bg-neutral border-border-neutral-secondary hover:border-border-neutral',
                  ]"
                  @click="toggleSelectAllVisible"
                >
                  <Icon v-if="visibleAllSelected" name="check" variant="solid" :size="12" class="text-white" />
                  <Icon v-else-if="visibleSomeSelected" name="minus" variant="solid" :size="12" class="text-white" />
                </button>
              </div>
              <div class="flex-[280] min-w-[220px] px-[8px] py-[10px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Badge
              </div>
              <div class="flex-[300] min-w-[200px] px-[16px] py-[10px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Conducteur
              </div>
              <div class="flex-[320] min-w-[220px] px-[16px] py-[10px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Véhicule
              </div>
            </div>

            <!-- Empty state (add mode) -->
            <div
              v-if="addPaginated.length === 0"
              class="px-[24px] py-[48px] flex flex-col items-center justify-center gap-[8px] text-center"
            >
              <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                {{ addSearch ? 'Aucun badge' : 'Aucun badge disponible' }}
              </p>
              <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                {{ addSearch
                  ? 'Aucun badge non rattaché ne correspond à cette recherche.'
                  : 'Tous les badges sont déjà rattachés à un groupe.' }}
              </p>
            </div>

            <!-- Table rows (add mode, with checkboxes) -->
            <div v-else>
              <button
                v-for="b in addPaginated"
                :key="b.id"
                type="button"
                :aria-pressed="selectedToAdd.has(b.id)"
                :class="[
                  'group/row w-full flex flex-col md:flex-row md:items-stretch md:min-h-[68px] border-t border-border-neutral-tertiary first:border-t-0 text-left',
                  'transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:bg-neutral-secondary',
                  selectedToAdd.has(b.id) ? 'bg-brand-surface hover:bg-brand-surface' : 'hover:bg-neutral-secondary',
                ]"
                @click="toggleAddSelection(b.id)"
              >
                <!-- Checkbox column -->
                <div class="w-full md:w-[56px] shrink-0 px-[24px] md:px-[20px] pt-[16px] md:pt-[10px] md:py-[10px] flex md:items-center">
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

                <!-- Badge identifier -->
                <div class="flex-[280] min-w-0 px-[24px] md:px-[8px] py-[8px] md:py-[10px] flex items-center gap-[12px]">
                  <div class="shrink-0 flex items-center justify-center size-[36px] rounded-[10px] bg-brand-surface">
                    <Icon name="charging-badge-pass" variant="solid" :size="20" class="text-text-brand-deep" />
                  </div>
                  <p class="min-w-0 font-mono font-medium text-[14px] leading-[1.5] tracking-[-0.28px] text-text-neutral truncate">
                    {{ b.identifier }}
                  </p>
                </div>

                <!-- Conducteur -->
                <div class="flex-[300] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[10px] flex items-center gap-[10px]">
                  <template v-if="b.driver">
                    <div class="shrink-0 flex items-center justify-center size-[28px] rounded-full bg-brand-surface">
                      <span class="font-sans font-semibold text-[11px] leading-none tracking-[-0.22px] text-text-brand-deep">
                        {{ b.driver.initials }}
                      </span>
                    </div>
                    <p class="min-w-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                      {{ b.driver.name }}
                    </p>
                  </template>
                  <span
                    v-else
                    class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary italic"
                  >
                    Non rattaché
                  </span>
                </div>

                <!-- Véhicule -->
                <div class="flex-[320] min-w-0 px-[24px] md:px-[16px] py-[8px] md:py-[10px] pb-[16px] md:pb-[10px] flex items-center gap-[10px]">
                  <template v-if="b.vehicle">
                    <p class="min-w-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                      {{ b.vehicle.model }}
                    </p>
                    <span class="shrink-0 inline-flex items-center px-[8px] h-[22px] rounded-[6px] border border-border-neutral-tertiary bg-neutral-tertiary font-mono font-medium text-[12px] leading-none tracking-[-0.24px] text-text-neutral-secondary">
                      {{ b.vehicle.plate }}
                    </span>
                  </template>
                  <span
                    v-else
                    class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary italic"
                  >
                    Non rattaché
                  </span>
                </div>
              </button>
            </div>

            <!-- Pagination -->
            <TableFooter
              v-if="filteredAvailable.length > 0"
              :page="addPage"
              :page-count="addPageCount"
              :range-start="addRangeStart"
              :range-end="addRangeEnd"
              :total="filteredAvailable.length"
              @update:page="(n) => (addPage = n)"
            />

            <!-- Sticky action bar -->
            <div class="flex items-center justify-between gap-[16px] px-[24px] py-[16px] border-t border-border-neutral-tertiary bg-neutral">
              <Button
                type="secondary"
                size="md"
                label="Annuler"
                @click="cancelAddMode"
              />
              <Button
                type="primary"
                size="md"
                :label="selectedToAdd.size === 0
                  ? 'Ajouter au groupe'
                  : `Ajouter ${fmtCount(selectedToAdd.size)} badge${selectedToAdd.size > 1 ? 's' : ''}`"
                :disabled="selectedToAdd.size === 0"
                @click="confirmAdd"
              />
            </div>
          </div>
        </Transition>
      </section>

      <!-- Footer spacer -->
      <div class="h-[60px]" />
    </div>

    <!-- ── Toast (top-right, fixed) ─────────────────────────────────────── -->
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
