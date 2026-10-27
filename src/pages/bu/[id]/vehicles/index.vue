<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { HorizontalTab } from '~/components/ui/HorizontalTabs.vue'
import type { DropdownItem } from '~/components/ui/DropdownMenu.vue'
import type { Vehicle } from '~/stores/vehicles'
import vehicleIllustration from '~/assets/illustrations/vehicle-header.png'

// Vehicles listing (Figma "listing-1-vehicules"). Compatibility has its own text
// column; the Connexion column only shows a status for compatible vehicles.
const headingClass = usePageHeadingClass()
const vehiclesStore = useVehiclesStore()
const route = useRoute()

const TABS: HorizontalTab[] = [
  { id: 'list', label: 'Liste des véhicules' },
  { id: 'campaigns', label: 'Campagnes kilométriques' },
]
const activeTab = ref('list')

// ─── Filters ─────────────────────────────────────────────────────────────────
const search = ref('')
const compatibilityFilter = ref<string[]>([])
const connectionFilter = ref<string[]>([])

const compatibilityItems: DropdownItem[] = [
  { value: 'COMPATIBLE', label: 'Compatible' },
  { value: 'NOT_COMPATIBLE', label: 'Non compatible' },
  { value: 'UNKNOWN', label: 'Compatibilité inconnue' },
]

const connectionItems: DropdownItem[] = [
  { value: 'NOT_CONNECTED', label: 'Non connecté' },
  { value: 'REQUESTED', label: 'Invitation envoyée' },
  { value: 'IN_PROGRESS', label: 'En attente' },
  { value: 'CONNECTED', label: 'Connecté' },
  { value: 'ACTION_REQUIRED', label: 'Action requise' },
  { value: 'FAILED', label: 'Échec de connexion' },
  { value: 'DISCONNECTED', label: 'Déconnecté' },
]

const filtered = computed<Vehicle[]>(() => {
  const q = search.value.trim().toLowerCase()
  return vehiclesStore.vehicles.filter(v => {
    if (q) {
      const haystack = [v.brand, v.model, v.plate, v.driver].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    if (compatibilityFilter.value.length && !compatibilityFilter.value.includes(v.compatibility)) return false
    // Incompatible / unknown vehicles have no connection status ("—"), so they never match this filter
    if (connectionFilter.value.length && (v.compatibility !== 'COMPATIBLE' || !connectionFilter.value.includes(v.connectionStatus))) return false
    return true
  })
})

// ─── Pagination ──────────────────────────────────────────────────────────────
const perPage = 10
const page = ref(1)
const pageCount = computed<number>(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated = computed<Vehicle[]>(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))
const rangeStart = computed<number>(() => (filtered.value.length === 0 ? 0 : (page.value - 1) * perPage + 1))
const rangeEnd = computed<number>(() => Math.min(page.value * perPage, filtered.value.length))
watch([search, compatibilityFilter, connectionFilter], () => { page.value = 1 })

// ─── Display helpers ─────────────────────────────────────────────────────────
const vehicleName = (v: Vehicle) => (v.brand && v.model ? `${v.brand} ${v.model}` : 'Modèle non renseigné')
const formatMileage = (km: number | null) => (km === null ? '—' : `${km.toLocaleString('fr-FR')} km`)
const COMPATIBILITY_LABELS: Record<Vehicle['compatibility'], string> = {
  COMPATIBLE: 'Compatible',
  NOT_COMPATIBLE: 'Non compatible',
  UNKNOWN: 'Inconnue',
}

const openVehicle = (v: Vehicle) => navigateTo(`/bu/${route.params.id}/vehicles/${v.id}`)

// Skeleton loading
const isLoading = ref(true)
onMounted(() => { setTimeout(() => { isLoading.value = false }, 600) })
const skeletonRows = Array.from({ length: 9 }, (_, i) => i)

// Column widths follow the Figma table proportions (220/240/140/120/150/200).
const COL = {
  vehicle: 'flex-[220] min-w-[180px]',
  driver: 'flex-[240] min-w-[220px]',
  badge: 'flex-[140] min-w-[120px]',
  mileage: 'flex-[120] min-w-[110px]',
  compatibility: 'flex-[150] min-w-[130px]',
  connection: 'flex-[200] min-w-[190px]',
}
const headerCell = 'px-[16px] py-[8px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary whitespace-nowrap'
const bodyCell = 'px-[16px] py-[12px] flex flex-col justify-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px]'
</script>

<template>
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]">
    <div class="mx-auto w-full max-w-[1280px] flex flex-col gap-[32px]">

      <!-- Page header -->
      <div class="flex items-center justify-between gap-[16px] anim-fade-up" style="animation-delay: 0ms">
        <div class="flex items-center gap-[16px] min-w-0">
          <img :src="vehicleIllustration" alt="" class="w-[96px] h-[88px] shrink-0 object-contain">
          <h1 :class="headingClass">Véhicules</h1>
        </div>
        <div class="flex items-center gap-[12px]">
          <Button type="primary" size="md" label="Ajouter un véhicule" icon-left="plus" />
          <Button type="secondary" size="md" icon-only icon-left="ellipsis-vertical" label="Plus d'actions" />
        </div>
      </div>

      <!-- Tabs -->
      <div class="anim-fade-up" style="animation-delay: 40ms">
        <HorizontalTabs v-model="activeTab" :tabs="TABS" variant="underline" />
      </div>

      <template v-if="activeTab === 'list'">
        <!-- Filter row (same layout as supervised charges) -->
        <div
          class="relative z-20 flex flex-col xl:flex-row xl:items-center xl:flex-wrap gap-[8px] anim-fade-up"
          style="animation-delay: 80ms"
        >
          <div class="w-full xl:w-[400px]">
            <Input
              v-model="search"
              type="leadingIcon"
              icon="magnifying-glass"
              placeholder="Plaque, conducteur, modèle…"
            />
          </div>
          <div class="w-full xl:w-[230px]">
            <Dropdown
              v-model="compatibilityFilter"
              :items="compatibilityItems"
              input-type="leadingIcon"
              menu-type="multiselect"
              icon="check-circle"
              :searchable="false"
              :placeholder="compatibilityFilter.length ? `${compatibilityFilter.length} sélectionnée(s)` : 'Compatibilité'"
              :show-label="false"
              :show-hint="false"
            />
          </div>
          <div class="w-full xl:w-[230px]">
            <Dropdown
              v-model="connectionFilter"
              :items="connectionItems"
              input-type="leadingIcon"
              menu-type="multiselect"
              icon="link"
              :searchable="false"
              :placeholder="connectionFilter.length ? `${connectionFilter.length} sélectionné(s)` : 'Statut de connexion'"
              :show-label="false"
              :show-hint="false"
            />
          </div>
        </div>

        <section
          class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-clip anim-fade-up"
          style="animation-delay: 120ms"
        >
          <!-- Scrolls horizontally on narrow screens; min width = sum of the columns' min widths -->
          <div class="overflow-x-auto">
            <div class="min-w-[950px]">
              <!-- Header row -->
              <div class="flex items-stretch w-full bg-neutral-tertiary min-h-[40px]">
                <div :class="[COL.vehicle, headerCell]">Véhicule</div>
                <div :class="[COL.driver, headerCell]">Conducteur / Immatriculation</div>
                <div :class="[COL.badge, headerCell]">Badge</div>
                <div :class="[COL.mileage, headerCell]">Kilométrage</div>
                <div :class="[COL.compatibility, 'gap-[6px]', headerCell]">
                  <Icon name="information-circle" :size="16" class="shrink-0" />
                  Compatibilité
                </div>
                <div :class="[COL.connection, 'gap-[6px]', headerCell]">
                  <Icon name="information-circle" :size="16" class="shrink-0" />
                  Connexion
                </div>
              </div>

              <!-- Skeleton loading -->
              <div v-if="isLoading" class="flex flex-col">
                <div
                  v-for="(row, ri) in skeletonRows"
                  :key="`sk-${row}`"
                  :class="['flex items-stretch w-full min-h-[66px]', ri < skeletonRows.length - 1 ? 'border-b border-[#f1f5f9]' : '']"
                >
                  <div :class="[COL.vehicle, bodyCell]"><Skeleton width="60%" /></div>
                  <div :class="[COL.driver, 'gap-[6px]', bodyCell]"><Skeleton width="55%" /><Skeleton width="35%" /></div>
                  <div :class="[COL.badge, bodyCell]"><Skeleton width="60%" /></div>
                  <div :class="[COL.mileage, bodyCell]"><Skeleton width="70%" /></div>
                  <div :class="[COL.compatibility, bodyCell]"><Skeleton width="65%" /></div>
                  <div :class="[COL.connection, bodyCell]"><Skeleton width="110px" height="24px" rounded="9999px" /></div>
                </div>
              </div>

              <!-- Empty state -->
              <div
                v-else-if="!filtered.length"
                class="flex items-center justify-center min-h-[200px] px-[16px] py-[24px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary"
              >
                Aucun véhicule ne correspond à ces critères.
              </div>

              <!-- Body rows -->
              <div v-else class="flex flex-col">
                <button
                  v-for="(v, vi) in paginated"
                  :key="v.id"
                  type="button"
                  :class="[
                    'flex items-stretch w-full min-h-[66px] text-left outline-none transition-colors duration-150 ease-out hover:bg-neutral-secondary focus-visible:bg-neutral-secondary',
                    vi < paginated.length - 1 ? 'border-b border-[#f1f5f9]' : '',
                  ]"
                  @click="openVehicle(v)"
                >
                  <div :class="[COL.vehicle, bodyCell]">
                    <span class="font-normal text-text-neutral truncate">{{ vehicleName(v) }}</span>
                  </div>
                  <div :class="[COL.driver, bodyCell]">
                    <span v-if="v.driver" class="font-normal text-text-neutral truncate">{{ v.driver }}</span>
                    <span :class="['font-normal truncate', v.driver ? 'text-text-neutral-secondary' : 'text-text-neutral']">{{ v.plate }}</span>
                  </div>
                  <div :class="[COL.badge, bodyCell]">
                    <span class="font-normal text-text-neutral truncate">{{ v.badge ?? 'Aucun' }}</span>
                  </div>
                  <div :class="[COL.mileage, bodyCell]">
                    <span class="font-normal text-text-neutral tabular-nums whitespace-nowrap">{{ formatMileage(v.mileage) }}</span>
                  </div>
                  <div :class="[COL.compatibility, bodyCell]">
                    <span :class="['font-normal truncate', v.compatibility === 'COMPATIBLE' ? 'text-text-neutral' : 'text-text-neutral-secondary']">
                      {{ COMPATIBILITY_LABELS[v.compatibility] }}
                    </span>
                  </div>
                  <!-- Connection only makes sense for compatible vehicles -->
                  <div :class="[COL.connection, 'items-start', bodyCell]">
                    <ConnectionBadge v-if="v.compatibility === 'COMPATIBLE'" :status="v.connectionStatus" />
                    <span v-else class="font-normal text-text-neutral-secondary">—</span>
                  </div>
                </button>
              </div>

            </div>
          </div>

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
      </template>

      <!-- Mileage campaigns: out of the prototype scope -->
      <div
        v-else
        class="flex items-center justify-center min-h-[200px] bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary anim-fade-up"
      >
        Les campagnes kilométriques ne font pas partie de ce prototype.
      </div>
    </div>
  </div>
</template>
