<script setup lang="ts">
const headingClass = usePageHeadingClass()
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
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

// Filters dropdown — two-level menu (Figma 6568-2760). Left panel lists
// the categories, right panel reveals checkboxes for the active one.
// Inside a category: OR (union of matches). Across categories: AND.
type FilterCategory = 'statuts' | 'package'
type StatusFilter = 'suspecte' | 'self-service'
const filterMenuOpen = ref(false)
const filterCategory = ref<FilterCategory>('statuts')
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
const PACKAGE_OPTIONS: OrgaPackage[] = ['Classic', 'Advanced', 'Entreprise', 'Legacy']

const filterAnchor = ref<HTMLElement | null>(null)
function onPointerDown(e: PointerEvent) {
  if (filterMenuOpen.value && filterAnchor.value && !filterAnchor.value.contains(e.target as Node)) {
    filterMenuOpen.value = false
  }
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && filterMenuOpen.value) filterMenuOpen.value = false
}
onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
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

function onMenu(_id: string) { /* placeholder — no per-card actions wired yet */ }
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
              <!-- Filtres button — opens a two-level dropdown (Figma
                   6568-2760). Categories on the left, options on the
                   right. Closes on outside click / Escape. -->
              <div ref="filterAnchor" class="relative">
                <Button
                  type="secondary"
                  size="md"
                  :label="activeFilterCount ? `Filtres (${activeFilterCount})` : 'Filtres'"
                  @click="filterMenuOpen = !filterMenuOpen"
                />
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
                    class="absolute top-[calc(100%+8px)] right-0 z-30 flex gap-[8px]"
                    role="dialog"
                    aria-label="Filtres"
                  >
                    <!-- Left panel — categories -->
                    <div class="w-[200px] bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg p-[4px] flex flex-col gap-[2px]">
                      <button
                        type="button"
                        :class="[
                          'flex items-center justify-between gap-[8px] px-[12px] py-[10px] rounded-[6px] text-left transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray',
                          filterCategory === 'statuts' ? 'bg-neutral-secondary' : 'hover:bg-neutral-secondary',
                        ]"
                        @click="filterCategory = 'statuts'"
                      >
                        <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
                          Statuts
                        </span>
                        <Icon name="chevron-right" variant="outline" :size="16" class="text-icon-neutral-secondary" />
                      </button>
                      <button
                        type="button"
                        :class="[
                          'flex items-center justify-between gap-[8px] px-[12px] py-[10px] rounded-[6px] text-left transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray',
                          filterCategory === 'package' ? 'bg-neutral-secondary' : 'hover:bg-neutral-secondary',
                        ]"
                        @click="filterCategory = 'package'"
                      >
                        <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
                          Package
                        </span>
                        <Icon name="chevron-right" variant="outline" :size="16" class="text-icon-neutral-secondary" />
                      </button>
                    </div>

                    <!-- Right panel — options for the active category -->
                    <div class="w-[220px] bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg p-[4px] flex flex-col gap-[2px]">
                      <template v-if="filterCategory === 'statuts'">
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
                  </div>
                </Transition>
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
              @menu="onMenu"
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
  </div>
</template>
