<script setup lang="ts">
const headingClass = usePageHeadingClass()
import { ref, computed, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { HorizontalTab } from '~/components/ui/HorizontalTabs.vue'
import OrgaCard, { type Orga, type OrgaPackage } from '~/components/ui/OrgaCard.vue'

// Seed list of orgas — varied subscription tiers and flags so the listing
// shows every card variant out of the box.
const orgas = ref<(Orga & { active: boolean })[]>([
  { id: 'o-1', name: 'Brakson',         package: 'Advanced',   businessUnitsCount: 2, managerName: 'John Doe',         managerEmail: 'john.doe@brakson.com',          active: true },
  { id: 'o-2', name: 'Saabre',          package: 'Classic',    selfService: true, businessUnitsCount: 4, managerName: 'Léa Martin',       managerEmail: 'lea.martin@saabre.com',         active: true },
  { id: 'o-3', name: 'Chargemap',       package: 'Legacy',     businessUnitsCount: 6, managerName: 'Théo Garnier',     managerEmail: 'theo.garnier@chargemap.com',    active: true },
  { id: 'o-4', name: 'Mister EV',       package: 'Legacy',     businessUnitsCount: 1, managerName: 'Camille Laurent',  managerEmail: 'camille@misterev.com',          active: true },
  { id: 'o-5', name: 'Cleanrider',      package: 'Advanced',   businessUnitsCount: 3, managerName: 'Nicolas Mercier',  managerEmail: 'n.mercier@cleanrider.com',      active: true },
  { id: 'o-6', name: 'Responsible Ads', package: 'Advanced',   selfService: true, suspicious: true, businessUnitsCount: 2, managerName: 'Sophie Moreau',    managerEmail: 'sophie@responsible-ads.com',    active: true },
  { id: 'o-7', name: 'Marketing',       package: 'Entreprise', businessUnitsCount: 8, managerName: 'Julien Bernard',   managerEmail: 'j.bernard@marketing.io',        active: true },
  { id: 'o-8', name: 'Volthium',        package: 'Legacy',     businessUnitsCount: 1, managerName: 'Émilie Faure',     managerEmail: 'emilie.faure@volthium.com',     active: true },
  { id: 'o-9', name: 'Plug & Charge',   package: 'Classic',    businessUnitsCount: 2, managerName: 'Hugo Lefèvre',     managerEmail: 'hugo.lefevre@plugandcharge.io',  active: true },
  { id: 'o-10', name: 'EV Connect',     package: 'Advanced',   businessUnitsCount: 5, managerName: 'Inès Marchand',    managerEmail: 'ines@evconnect.com',            active: false },
  { id: 'o-11', name: 'Stellar Fleet',  package: 'Legacy',     suspicious: true, businessUnitsCount: 3, managerName: 'Thomas Girard',    managerEmail: 'thomas@stellarfleet.com',       active: false },
])

const tabs: HorizontalTab[] = [
  { id: 'organisations', label: 'Organisations' },
  { id: 'bus',           label: 'Business units' },
]
const activeTab = ref<string>('organisations')

const search = ref('')
type Scope = 'actives' | 'disabled'
const scope = ref<Scope>('actives')

// Filters dropdown — cascading menu (Figma 6568-2760). First panel
// lists the categories; the second panel surfaces on hover/focus of a
// category and reveals the checkboxes. Teleported to <body> with a
// position captured from the trigger's rect so it escapes the page's
// overflow / z-index context.
type FilterCategory = 'statuts' | 'package'
type StatusFilter = 'suspecte' | 'self-service'
const filterMenuOpen = ref(false)
const hoveredCategory = ref<FilterCategory | null>(null)
const filterMenuPos = ref({ top: 0, right: 0 })
const filters = reactive({
  statuts: new Set<StatusFilter>(),
  package: new Set<OrgaPackage>(),
})
const activeFilterCount = computed(() => filters.statuts.size + filters.package.size)
function toggleStatus(s: StatusFilter) {
  if (filters.statuts.has(s)) filters.statuts.delete(s)
  else filters.statuts.add(s)
}
function togglePackage(p: OrgaPackage) {
  if (filters.package.has(p)) filters.package.delete(p)
  else filters.package.add(p)
}
function resetFilters() {
  filters.statuts.clear()
  filters.package.clear()
}
const PACKAGE_OPTIONS: OrgaPackage[] = ['Classic', 'Advanced', 'Entreprise', 'Legacy']

const filterAnchor = ref<HTMLElement | null>(null)
const filterMenuRef = ref<HTMLElement | null>(null)
const statutsBtnRef = ref<HTMLElement | null>(null)
const packageBtnRef = ref<HTMLElement | null>(null)
const optionsPanelTop = ref(0)
function hoverCategory(cat: FilterCategory) {
  hoveredCategory.value = cat
  const btn = cat === 'statuts' ? statutsBtnRef.value : packageBtnRef.value
  // offsetTop is relative to the nearest positioned ancestor — the
  // fixed-positioned wrapper. Falls back to a sensible default so the
  // options panel never lands at top 0 unexpectedly.
  optionsPanelTop.value = btn?.offsetTop ?? 4
}
function openFilterMenu() {
  if (filterAnchor.value) {
    const rect = filterAnchor.value.getBoundingClientRect()
    filterMenuPos.value = {
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    }
  }
  filterMenuOpen.value = true
  // No auto-highlight on open — the options panel only surfaces when
  // the user actively hovers/focuses a category.
  hoveredCategory.value = null
}
function closeFilterMenu() {
  filterMenuOpen.value = false
  hoveredCategory.value = null
}
function toggleFilterMenu() {
  if (filterMenuOpen.value) closeFilterMenu()
  else openFilterMenu()
}
function onPointerDown(e: PointerEvent) {
  if (!filterMenuOpen.value) return
  const t = e.target as Node
  if (filterAnchor.value?.contains(t)) return
  if (filterMenuRef.value?.contains(t)) return
  closeFilterMenu()
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && filterMenuOpen.value) closeFilterMenu()
}
function onViewportChange() {
  if (filterMenuOpen.value) closeFilterMenu()
}
onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', onViewportChange, true)
  window.addEventListener('resize', onViewportChange)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', onViewportChange, true)
  window.removeEventListener('resize', onViewportChange)
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return orgas.value.filter((o) => {
    if (scope.value === 'actives' ? !o.active : o.active) return false
    if (q && !(
      o.name.toLowerCase().includes(q)
      || o.managerName.toLowerCase().includes(q)
      || o.managerEmail.toLowerCase().includes(q)
    )) return false
    if (filters.statuts.size > 0) {
      const matchesSuspecte = filters.statuts.has('suspecte') && !!o.suspicious
      const matchesSelfService = filters.statuts.has('self-service') && !!o.selfService
      if (!matchesSuspecte && !matchesSelfService) return false
    }
    if (filters.package.size > 0 && !filters.package.has(o.package)) return false
    return true
  })
})

// ── Per-card kebab menu (Figma 6557-5026) ───────────────────────────────
// Single shared dropdown rendered via Teleport; the page tracks which
// card is open + the trigger's rect so the menu can be fixed-positioned
// outside the cards' overflow / z-index context.
const openOrgaMenuId = ref<string | null>(null)
const orgaMenuPos = ref({ top: 0, right: 0 })
const orgaMenuRef = ref<HTMLElement | null>(null)
const currentOrgaForMenu = computed(() =>
  openOrgaMenuId.value ? orgas.value.find(o => o.id === openOrgaMenuId.value) ?? null : null,
)
function onMenu(id: string, e: MouseEvent) {
  if (openOrgaMenuId.value === id) {
    openOrgaMenuId.value = null
    return
  }
  const btn = e.currentTarget as HTMLElement
  const rect = btn.getBoundingClientRect()
  orgaMenuPos.value = {
    top: rect.bottom + 4,
    right: Math.max(8, window.innerWidth - rect.right),
  }
  openOrgaMenuId.value = id
}
function closeOrgaMenu() { openOrgaMenuId.value = null }
function onViewClient() { closeOrgaMenu() }
function onViewDetails() { closeOrgaMenu() }
function onDeactivateOrga() {
  const o = currentOrgaForMenu.value
  if (o) o.active = false
  closeOrgaMenu()
}

// Close the orga menu on outside pointerdown / scroll / Escape — same
// pattern as the Filtres dropdown above.
function onOrgaPointerDown(e: PointerEvent) {
  if (!openOrgaMenuId.value) return
  const t = e.target as Node
  if (orgaMenuRef.value?.contains(t)) return
  // The kebab button itself emits 'menu' which already toggles; avoid
  // double-handling by ignoring clicks inside an OrgaCard.
  if ((t as HTMLElement).closest?.('[data-orga-card="true"]')) return
  closeOrgaMenu()
}
function onOrgaKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && openOrgaMenuId.value) closeOrgaMenu()
}
function onOrgaViewportChange() {
  if (openOrgaMenuId.value) closeOrgaMenu()
}
onMounted(() => {
  document.addEventListener('pointerdown', onOrgaPointerDown)
  document.addEventListener('keydown', onOrgaKeydown)
  window.addEventListener('scroll', onOrgaViewportChange, true)
  window.addEventListener('resize', onOrgaViewportChange)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOrgaPointerDown)
  document.removeEventListener('keydown', onOrgaKeydown)
  window.removeEventListener('scroll', onOrgaViewportChange, true)
  window.removeEventListener('resize', onOrgaViewportChange)
})

function onCreateOrga() { /* placeholder — Nouvelle organisation flow not designed yet */ }
</script>

<template>
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]">
    <div class="mx-auto w-full max-w-[1500px] flex flex-col gap-[24px]">

      <!-- Header -->
      <div class="flex items-center justify-between h-[48px] anim-fade-up" style="animation-delay: 0ms">
        <h1 :class="headingClass">
          Organisations & BU
        </h1>
        <Button
          type="primary"
          size="md"
          icon-left="plus"
          label="Nouvelle organisation"
          @click="onCreateOrga"
        />
      </div>

      <!-- Tabs -->
      <div class="anim-fade-up" style="animation-delay: 40ms">
        <HorizontalTabs
          v-model="activeTab"
          :tabs="tabs"
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
        <!-- Organisations tab -->
        <div v-if="activeTab === 'organisations'" key="orgs" class="flex flex-col gap-[16px]">
          <!-- Search + Filtres + segmented Actives/Désactivées -->
          <div class="flex flex-col lg:flex-row lg:items-center gap-[8px] anim-fade-up" style="animation-delay: 80ms">
            <div class="w-full lg:w-[400px]">
              <Input
                v-model="search"
                type="leadingIcon"
                icon="magnifying-glass"
                placeholder="Rechercher"
              />
            </div>
            <div class="lg:ml-auto flex items-center gap-[8px]">
              <!-- Filtres button — toggles the cascading menu below. When
                   filters are active, surfaces the count and a clickable
                   X to reset (Figma 6581-3543). Custom inline so the X
                   can carry its own click target without retriggering
                   the menu toggle. -->
              <div ref="filterAnchor" class="shrink-0">
                <button
                  type="button"
                  class="inline-flex items-center gap-[8px] min-h-[44px] py-[8px] px-[16px] bg-neutral border border-border-neutral rounded-md font-sans font-medium text-[16px] tracking-[-0.03em] text-text-neutral-secondary hover:bg-neutral-hover active:scale-[0.97] transition-[background-color,transform] duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                  @click="toggleFilterMenu"
                >
                  <span class="whitespace-nowrap">
                    Filtres<span v-if="activeFilterCount" class="tabular-nums"> ({{ activeFilterCount }})</span>
                  </span>
                  <span
                    v-if="activeFilterCount"
                    role="button"
                    tabindex="0"
                    aria-label="Réinitialiser les filtres"
                    class="flex items-center justify-center size-[20px] -mr-[4px] rounded-[4px] text-icon-neutral-secondary hover:text-icon-neutral-primary hover:bg-neutral-secondary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                    @click.stop="resetFilters"
                    @keydown.enter.stop="resetFilters"
                    @keydown.space.stop.prevent="resetFilters"
                  >
                    <Icon name="x-mark" variant="outline" :size="14" />
                  </span>
                </button>
              </div>
              <!-- Segmented switch: Orga Actives / Orga désactivées
                   (Figma 6562-17021). Container is bg-neutral-tertiary
                   with 4px padding + 4px gap; each button keeps the same
                   px-[12px] py-[8px] size so the chip never reflows when
                   the selection moves. The active pill gets a white fill
                   + faint drop-shadow; the inactive pill matches the
                   container's gray. -->
              <div class="inline-flex items-center gap-[4px] bg-neutral-tertiary rounded-[8px] p-[4px]">
                <button
                  type="button"
                  :class="[
                    'px-[12px] py-[8px] rounded-[6px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] transition-[background-color,color,box-shadow] duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray',
                    scope === 'actives'
                      ? 'bg-neutral text-text-neutral drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]'
                      : 'bg-neutral-tertiary text-text-neutral-secondary hover:text-text-neutral',
                  ]"
                  @click="scope = 'actives'"
                >
                  Orga Actives
                </button>
                <button
                  type="button"
                  :class="[
                    'px-[12px] py-[8px] rounded-[6px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] transition-[background-color,color,box-shadow] duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray',
                    scope === 'disabled'
                      ? 'bg-neutral text-text-neutral drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]'
                      : 'bg-neutral-tertiary text-text-neutral-secondary hover:text-text-neutral',
                  ]"
                  @click="scope = 'disabled'"
                >
                  Orga désactivées
                </button>
              </div>
            </div>
          </div>

          <!-- Card grid — 3 columns on lg, 2 on md, 1 on small screens. -->
          <div
            v-if="filtered.length"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px] anim-fade-up"
            style="animation-delay: 100ms"
          >
            <OrgaCard
              v-for="(orga, i) in filtered"
              :key="orga.id"
              :orga="orga"
              :style="{ animationDelay: `${120 + i * 30}ms` }"
              class="anim-fade-up"
              @menu="(id, e) => onMenu(id, e)"
            />
          </div>

          <!-- Empty state -->
          <div
            v-else
            class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] flex flex-col items-center justify-center gap-[8px] min-h-[200px] text-center anim-fade-up"
            style="animation-delay: 100ms"
          >
            <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
              {{ search ? 'Aucune organisation' : (scope === 'actives' ? 'Aucune organisation active' : 'Aucune organisation désactivée') }}
            </p>
            <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
              {{ search
                ? 'Aucune organisation ne correspond à votre recherche.'
                : 'Créez votre première organisation pour commencer.' }}
            </p>
          </div>
        </div>

        <!-- Business units tab placeholder -->
        <div
          v-else
          key="bus"
          class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] flex flex-col items-center justify-center gap-[8px] min-h-[200px] text-center"
        >
          <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
            Business units
          </p>
          <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            La liste cross-orga des Business units sera ajoutée ici.
          </p>
        </div>
      </Transition>

    </div>

    <!-- Filtres dropdown (teleported) — categories panel always; the
         options panel appears next to it once a category is hovered
         or focused. Closes on outside click / Escape / scroll. -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        enter-from-class="opacity-0 scale-[0.97] -translate-y-[4px]"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-[120ms] ease-out motion-reduce:transition-none"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-[0.97] -translate-y-[4px]"
      >
        <div
          v-if="filterMenuOpen"
          ref="filterMenuRef"
          :style="{ top: filterMenuPos.top + 'px', right: filterMenuPos.right + 'px' }"
          class="fixed z-[60] w-[200px]"
          role="dialog"
          aria-label="Filtres"
        >
          <!-- Categories panel — pinned at the wrapper position. -->
          <div class="bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg p-[4px] flex flex-col gap-[2px]">
            <button
              ref="statutsBtnRef"
              type="button"
              :class="[
                'flex items-center justify-between gap-[8px] px-[12px] py-[10px] rounded-[6px] text-left transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray',
                hoveredCategory === 'statuts' ? 'bg-neutral-secondary' : 'hover:bg-neutral-secondary',
              ]"
              @mouseenter="hoverCategory('statuts')"
              @focus="hoverCategory('statuts')"
              @click="hoverCategory('statuts')"
            >
              <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
                Statuts
              </span>
              <Icon name="chevron-right" variant="outline" :size="16" class="text-icon-neutral-secondary" />
            </button>
            <button
              ref="packageBtnRef"
              type="button"
              :class="[
                'flex items-center justify-between gap-[8px] px-[12px] py-[10px] rounded-[6px] text-left transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray',
                hoveredCategory === 'package' ? 'bg-neutral-secondary' : 'hover:bg-neutral-secondary',
              ]"
              @mouseenter="hoverCategory('package')"
              @focus="hoverCategory('package')"
              @click="hoverCategory('package')"
            >
              <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
                Package
              </span>
              <Icon name="chevron-right" variant="outline" :size="16" class="text-icon-neutral-secondary" />
            </button>
          </div>

          <!-- Options panel — absolute-positioned so its top aligns with
               the hovered category row (Linear-style cascade), 8px to
               the LEFT of the categories panel. -->
          <Transition
            enter-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            enter-from-class="opacity-0 translate-x-[4px]"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition-[opacity,transform] duration-[100ms] ease-out motion-reduce:transition-none"
            leave-from-class="opacity-100 translate-x-0"
            leave-to-class="opacity-0 translate-x-[4px]"
          >
            <div
              v-if="hoveredCategory"
              :style="{ top: optionsPanelTop + 'px' }"
              class="absolute right-[calc(100%+8px)] w-[220px] bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg p-[4px] flex flex-col gap-[2px]"
            >
              <template v-if="hoveredCategory === 'statuts'">
                <button
                  v-for="opt in [{ value: 'suspecte', label: 'Suspecte' }, { value: 'self-service', label: 'Self service' }]"
                  :key="opt.value"
                  type="button"
                  class="flex items-center gap-[12px] px-[12px] py-[10px] rounded-[6px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                  @click="toggleStatus(opt.value as StatusFilter)"
                >
                  <span
                    :class="[
                      'shrink-0 size-[16px] rounded-[4px] border flex items-center justify-center transition-colors duration-150 ease-out',
                      filters.statuts.has(opt.value as StatusFilter)
                        ? 'bg-brand border-brand'
                        : 'bg-neutral border-border-neutral-secondary',
                    ]"
                  >
                    <Icon v-if="filters.statuts.has(opt.value as StatusFilter)" name="check" variant="solid" :size="12" class="text-white" />
                  </span>
                  <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                    {{ opt.label }}
                  </span>
                </button>
              </template>
              <template v-else>
                <button
                  v-for="pkg in PACKAGE_OPTIONS"
                  :key="pkg"
                  type="button"
                  class="flex items-center gap-[12px] px-[12px] py-[10px] rounded-[6px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
                  @click="togglePackage(pkg)"
                >
                  <span
                    :class="[
                      'shrink-0 size-[16px] rounded-[4px] border flex items-center justify-center transition-colors duration-150 ease-out',
                      filters.package.has(pkg)
                        ? 'bg-brand border-brand'
                        : 'bg-neutral border-border-neutral-secondary',
                    ]"
                  >
                    <Icon v-if="filters.package.has(pkg)" name="check" variant="solid" :size="12" class="text-white" />
                  </span>
                  <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                    {{ pkg }}
                  </span>
                </button>
              </template>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Per-card kebab dropdown (Figma 6557-5026) — Détails / Paramètres
         orga / Désactiver. Teleported and fixed-positioned at the clicked
         kebab's rect so it escapes any card overflow. -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        enter-from-class="opacity-0 scale-[0.97] -translate-y-[4px]"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-[120ms] ease-out motion-reduce:transition-none"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-[0.97] -translate-y-[4px]"
      >
        <div
          v-if="currentOrgaForMenu"
          ref="orgaMenuRef"
          :style="{ top: orgaMenuPos.top + 'px', right: orgaMenuPos.right + 'px' }"
          class="fixed z-[60] w-[220px] bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg p-[4px] flex flex-col gap-[2px]"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            class="flex items-center gap-[12px] px-[12px] py-[10px] rounded-[6px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
            @click="onViewDetails"
          >
            <Icon name="list-bullet" variant="outline" :size="18" class="shrink-0 text-icon-neutral-secondary" />
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
              Détails
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            class="flex items-center gap-[12px] px-[12px] py-[10px] rounded-[6px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
            @click="onViewClient"
          >
            <Icon name="cog-6-tooth" variant="outline" :size="18" class="shrink-0 text-icon-neutral-secondary" />
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
              Paramètres orga
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            class="flex items-center gap-[12px] px-[12px] py-[10px] rounded-[6px] text-left hover:bg-danger-surface transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-error"
            @click="onDeactivateOrga"
          >
            <Icon name="no-symbol" variant="outline" :size="18" class="shrink-0 text-icon-danger" />
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-danger-medium">
              Désactiver
            </span>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
