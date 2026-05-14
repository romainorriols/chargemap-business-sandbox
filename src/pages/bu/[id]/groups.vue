<script setup lang="ts">
const headingClass = usePageHeadingClass()
const uiStore = useUiStore()
import { ref, computed, watch } from 'vue'

interface BadgeDriver { name: string; initials: string }
interface BadgeVehicle { model: string; plate: string }
interface Badge {
  id: string
  identifier: string
  driver: BadgeDriver | null
  vehicle: BadgeVehicle | null
}
interface Group {
  id: string
  name: string
  badgesCount: number
  vehiclesCount: number
  driversCount: number
  badges: Badge[]
}

// Realistic FR fleet — drivers, vehicle models, plates. The detail badge list
// is a representative subset (14 entries) per group; the card stats keep the
// "full fleet" numbers to feel like a real account.
const driverPool: BadgeDriver[] = [
  { name: 'Camille Laurent',  initials: 'CL' },
  { name: 'Nicolas Mercier',  initials: 'NM' },
  { name: 'Léa Dubois',       initials: 'LD' },
  { name: 'Antoine Robert',   initials: 'AR' },
  { name: 'Sophie Moreau',    initials: 'SM' },
  { name: 'Julien Bernard',   initials: 'JB' },
  { name: 'Émilie Faure',     initials: 'EF' },
  { name: 'Hugo Lefèvre',     initials: 'HL' },
  { name: 'Inès Marchand',    initials: 'IM' },
  { name: 'Thomas Girard',    initials: 'TG' },
]
const vehiclePool: BadgeVehicle[] = [
  { model: 'Renault Zoé',         plate: 'AB-123-CD' },
  { model: 'Peugeot e-208',       plate: 'EF-456-GH' },
  { model: 'Tesla Model 3',       plate: 'IJ-789-KL' },
  { model: 'Hyundai Kona Electric', plate: 'MN-012-OP' },
  { model: 'Kia e-Niro',          plate: 'QR-345-ST' },
  { model: 'Volkswagen ID.3',     plate: 'UV-678-WX' },
  { model: 'BMW iX1',             plate: 'YZ-901-AB' },
  { model: 'Citroën ë-C4',        plate: 'CD-234-EF' },
  { model: 'Fiat 500e',           plate: 'GH-567-IJ' },
  { model: 'Mercedes EQA',        plate: 'KL-890-MN' },
]

// Deterministic seed: walk the pools with a stable offset per group so each
// group's badge list looks different without random reshuffles per render.
function seedBadges(offset: number, size = 14): Badge[] {
  const out: Badge[] = []
  for (let i = 0; i < size; i++) {
    const idx = (offset + i)
    const id = 78000 + offset * 73 + i * 11
    // Vary linkage so the table tells a real story:
    //   - 60% driver + vehicle
    //   - 20% vehicle only (pool car)
    //   - 15% driver only (badge issued, vehicle pending)
    //   -  5% neither (just provisioned)
    const m = i % 20
    const hasDriver = !(m === 0 || m === 5 || m === 9 || m === 14)
    const hasVehicle = !(m === 3 || m === 11 || m === 17 || m === 0)
    out.push({
      id: `b-${offset}-${i}`,
      identifier: `CMB-${id.toString().padStart(5, '0')}`,
      driver:  hasDriver  ? driverPool[idx % driverPool.length]  : null,
      vehicle: hasVehicle ? vehiclePool[idx % vehiclePool.length] : null,
    })
  }
  return out
}

const groups: Group[] = [
  { id: 'g-1', name: 'Groupe logistique Rhône',          badgesCount: 42, vehiclesCount: 33, driversCount: 26, badges: seedBadges(0) },
  { id: 'g-2', name: 'Flotte commerciale Île-de-France', badgesCount: 32, vehiclesCount: 33, driversCount: 26, badges: seedBadges(3) },
  { id: 'g-3', name: 'Techniciens itinérants Sud',       badgesCount: 32, vehiclesCount: 33, driversCount: 26, badges: seedBadges(6) },
  { id: 'g-4', name: 'Service livraison Lyon Centre',    badgesCount: 42, vehiclesCount: 33, driversCount: 26, badges: seedBadges(2) },
  { id: 'g-5', name: 'Équipe terrain Aquitaine',         badgesCount: 32, vehiclesCount: 33, driversCount: 26, badges: seedBadges(5) },
  { id: 'g-6', name: 'Pôle dirigeants Paris',            badgesCount: 32, vehiclesCount: 33, driversCount: 26, badges: seedBadges(8) },
  { id: 'g-7', name: 'Maintenance bornes Est',           badgesCount: 18, vehiclesCount: 14, driversCount: 12, badges: seedBadges(1, 12) },
]

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

// ── Detail view (Users.vue listing↔detail pattern) ─────────────────────────
const selectedId = ref<string | null>(null)
const selectedGroup = computed(() => groups.find(g => g.id === selectedId.value) ?? null)
function openGroup(id: string) {
  selectedId.value = id
  openMenuId.value = null
}
function backToList() {
  selectedId.value = null
  badgeSearch.value = ''
  badgePage.value = 1
}

// Detail: badge search + pagination scoped to selected group.
const badgeSearch = ref('')
const filteredBadges = computed(() => {
  if (!selectedGroup.value) return []
  const q = badgeSearch.value.trim().toLowerCase()
  if (!q) return selectedGroup.value.badges
  return selectedGroup.value.badges.filter(b =>
    b.identifier.toLowerCase().includes(q) ||
    (b.driver?.name.toLowerCase().includes(q) ?? false) ||
    (b.vehicle?.model.toLowerCase().includes(q) ?? false) ||
    (b.vehicle?.plate.toLowerCase().includes(q) ?? false),
  )
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

// FR locale grouping for the count chip ("1 234").
const fmtCount = (n: number) => n.toLocaleString('fr-FR').replace(/ /g, ' ')
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
                <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                  {{ g.badgesCount }}
                </p>
                <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Badges
                </p>
              </div>
              <div class="w-px self-stretch bg-border-neutral-tertiary" aria-hidden="true" />
              <div class="flex-1 min-w-0 flex flex-col gap-[8px]">
                <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                  {{ g.vehiclesCount }}
                </p>
                <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Véhicules
                </p>
              </div>
              <div class="w-px self-stretch bg-border-neutral-tertiary" aria-hidden="true" />
              <div class="flex-1 min-w-0 flex flex-col gap-[8px]">
                <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                  {{ g.driversCount }}
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

      <!-- Page header: back + name + metric subhead -->
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
            <span class="font-medium text-text-neutral">{{ selectedGroup.badgesCount }}</span> badges
            <span class="mx-[8px]" aria-hidden="true">·</span>
            <span class="font-medium text-text-neutral">{{ selectedGroup.vehiclesCount }}</span> véhicules
            <span class="mx-[8px]" aria-hidden="true">·</span>
            <span class="font-medium text-text-neutral">{{ selectedGroup.driversCount }}</span> conducteurs
          </p>
        </div>
      </div>

      <!-- Badges card -->
      <section
        class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-clip anim-fade-up"
        style="animation-delay: 80ms"
      >
        <!-- Card header: title + count + search + action -->
        <div class="flex flex-col gap-[16px] p-[24px] border-b border-border-neutral-tertiary">
          <div class="flex items-center justify-between gap-[16px] flex-wrap">
            <div class="flex items-center gap-[12px] min-w-0">
              <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                Badges
              </p>
              <span class="inline-flex items-center px-[8px] h-[22px] rounded-full bg-neutral-tertiary font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-text-neutral-secondary">
                {{ fmtCount(filteredBadges.length) }}
              </span>
            </div>
            <Button
              type="secondary"
              size="md"
              icon-left="plus"
              label="Ajouter un badge"
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
          <div class="flex-[280] min-w-[220px] px-[24px] py-[10px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Badge
          </div>
          <div class="flex-[300] min-w-[200px] px-[16px] py-[10px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Conducteur
          </div>
          <div class="flex-[320] min-w-[220px] px-[16px] py-[10px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Véhicule
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-if="badgePaginated.length === 0"
          class="px-[24px] py-[48px] flex flex-col items-center justify-center gap-[8px] text-center"
        >
          <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
            Aucun badge
          </p>
          <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Aucun badge ne correspond à cette recherche.
          </p>
        </div>

        <!-- Table rows -->
        <div v-else>
          <div
            v-for="(b, i) in badgePaginated"
            :key="b.id"
            :style="{ animationDelay: `${120 + i * 20}ms` }"
            class="anim-fade-up flex flex-col md:flex-row md:items-stretch w-full md:min-h-[68px] border-t border-border-neutral-tertiary first:border-t-0 transition-colors duration-150 ease-out motion-reduce:transition-none hover:bg-neutral-secondary"
          >
            <!-- Badge identifier -->
            <div class="flex-[280] min-w-0 px-[24px] py-[16px] md:py-[10px] flex items-center gap-[12px]">
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
          </div>
        </div>

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
      </section>

      <!-- Footer spacer -->
      <div class="h-[60px]" />
    </div>
  </div>
</template>
