<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { HorizontalTab } from '~/components/ui/HorizontalTabs.vue'
import type { Vehicle } from '~/stores/vehicles'
import { vehiclePhotoUrl } from '~/utils/vehicleCatalog'

// Recap after acting on several vehicles at once (Figma modale-confirmation-connexion):
// - connect: vehicles of a manufacturer account, now "En attente" (+ match counts)
// - invite: drivers invited together, now "Invitation envoyée"
// - connect with incompatible vehicles (year read from the account): Compatibles /
//   Incompatibles tabs (Figma modale-confirmation-connexion-incompatibles), plus an
//   "À associer" tab when some vehicles are still waiting for their VIN
// The list loads by batches (lazy).
export interface ConnectResult {
  kind?: 'connect' | 'invite'
  vehicles: Vehicle[]
  incompatible?: Vehicle[]
  toMatch?: Vehicle[]
  autoCount: number
  manualCount: number
  remainingCount: number
}

const { open, brand, result } = defineProps<{ open: boolean; brand: string; result: ConnectResult }>()
const emit = defineEmits<{ close: [] }>()

const FIRST_BATCH = 3
const BATCH = 5
const visibleCount = ref(FIRST_BATCH)
const isLoadingMore = ref(false)
type ListTab = 'compatibles' | 'incompatibles' | 'to-match'
const listTab = ref<ListTab>('compatibles')

const incompatibleVehicles = computed<Vehicle[]>(() => result.incompatible ?? [])
const toMatchVehicles = computed<Vehicle[]>(() => result.toMatch ?? [])
const hasIncompatible = computed<boolean>(() => incompatibleVehicles.value.length > 0)
// Tabs only when there is something besides the linked vehicles
const listTabs = computed<HorizontalTab[]>(() => [
  { id: 'compatibles', label: 'Compatibles' },
  ...(hasIncompatible.value ? [{ id: 'incompatibles', label: 'Incompatibles' }] : []),
  ...(toMatchVehicles.value.length ? [{ id: 'to-match', label: 'À associer' }] : []),
])
const LISTS: Record<ListTab, () => Vehicle[]> = {
  'compatibles': () => result.vehicles,
  'incompatibles': () => incompatibleVehicles.value,
  'to-match': () => toMatchVehicles.value,
}
const listedVehicles = computed<Vehicle[]>(() => LISTS[listTab.value]())

const resetList = () => {
  visibleCount.value = FIRST_BATCH
  isLoadingMore.value = false
}
watch(() => open, (isOpen) => {
  if (!isOpen) return
  listTab.value = 'compatibles'
  resetList()
})
watch(listTab, resetList)

const visibleVehicles = computed<Vehicle[]>(() => listedVehicles.value.slice(0, visibleCount.value))
const hiddenCount = computed<number>(() => listedVehicles.value.length - visibleCount.value)
const vehicleLabel = (v: Vehicle) => `${v.brand} ${v.model}${v.year ? ` · ${v.year}` : ''}`
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

// Prototype: fake network delay, then the next batch shows up
const loadMore = () => {
  isLoadingMore.value = true
  setTimeout(() => {
    visibleCount.value += BATCH
    isLoadingMore.value = false
  }, 500)
}

const STATS = computed(() => hasIncompatible.value
  ? [
      { value: result.autoCount + result.manualCount, label: 'Associés' },
      { value: incompatibleVehicles.value.length, label: 'Véhicules incompatibles' },
      { value: result.remainingCount, label: 'Restent à associer' },
    ]
  : [
      { value: result.autoCount, label: 'Associés automatiquement' },
      { value: result.manualCount, label: 'Associés manuellement' },
      { value: result.remainingCount, label: 'Restent à associer' },
    ])
const isInvite = computed<boolean>(() => result.kind === 'invite')
const COPY = computed(() => {
  const n = result.vehicles.length
  return isInvite.value
    ? {
        title: 'Invitations envoyées',
        subtitle: '',
        headline: plural(n, 'conducteur') + (n > 1 ? ' invités' : ' invité'),
        message: 'Ils ont reçu un lien par e-mail et dans l’app Chargemap. Leur statut est passé à « Invitation envoyée » jusqu’à ce qu’ils connectent leur véhicule.',
      }
    : {
        title: 'Connexion terminée',
        subtitle: brand ? `Compte constructeur ${brand}` : '',
        headline: plural(n, 'véhicule') + (n > 1 ? ' connectés' : ' connecté'),
        message: 'Leur statut est passé à « En attente » jusqu’à la réception de leurs premières données.',
      }
})
const rowClass = 'flex items-center gap-[12px] px-[16px] py-[10px] border-t border-border-neutral-secondary first:border-t-0'
</script>

<template>
  <VehicleModal :open="open" size="lg" :title="COPY.title" :subtitle="COPY.subtitle" @close="emit('close')">
    <div class="flex flex-col gap-[16px]">
      <div class="flex flex-col gap-[2px]">
        <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
          {{ COPY.headline }}
        </p>
        <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
          {{ COPY.message }}
        </p>
      </div>

      <div v-if="!isInvite" class="grid grid-cols-3 gap-[8px]">
        <div v-for="s in STATS" :key="s.label" class="flex flex-col gap-[2px] px-[12px] py-[12px] rounded-[8px] border border-border-neutral-secondary bg-neutral">
          <span class="font-sans font-medium text-[16px] leading-[1.5] tabular-nums text-text-neutral">{{ s.value }}</span>
          <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">{{ s.label }}</span>
        </div>
      </div>

      <HorizontalTabs v-if="listTabs.length > 1" v-model="listTab" :tabs="listTabs" full-width />

      <!-- Linked (or incompatible) vehicles: first batch, then lazy-loaded by 5 -->
      <ul class="flex flex-col max-h-[300px] overflow-y-auto rounded-[12px] border border-border-neutral-secondary">
        <li v-for="v in visibleVehicles" :key="v.id" :class="rowClass">
          <img :src="vehiclePhotoUrl(v.brand, v.model) ?? ''" alt="" class="w-[64px] h-[36px] shrink-0 object-contain">
          <div class="flex-1 min-w-0 flex flex-col">
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">{{ vehicleLabel(v) }}</span>
            <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
              {{ v.driver ? `${v.plate} · ${v.driver}` : v.plate }}
            </span>
          </div>
          <ConnectionBadge :status="listTab === 'incompatibles' ? 'NOT_COMPATIBLE' : v.connectionStatus" />
        </li>
        <template v-if="isLoadingMore">
          <li v-for="n in Math.min(BATCH, hiddenCount)" :key="`sk-${n}`" :class="rowClass">
            <Skeleton width="64px" height="36px" />
            <div class="flex-1 flex flex-col gap-[6px]"><Skeleton width="40%" /><Skeleton width="55%" /></div>
          </li>
        </template>
        <li v-else-if="hiddenCount > 0" class="border-t border-border-neutral-secondary">
          <button
            type="button"
            class="w-full px-[16px] py-[10px] text-left font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary outline-none transition-colors duration-150 ease-out hover:bg-neutral-secondary hover:text-text-neutral focus-visible:bg-neutral-secondary"
            @click="loadMore"
          >
            + {{ hiddenCount }} {{ hiddenCount > 1 ? 'autres véhicules' : 'autre véhicule' }}
          </button>
        </li>
      </ul>
    </div>

    <template #footer>
      <Button type="primary" size="sm" label="Terminer" @click="emit('close')" />
    </template>
  </VehicleModal>
</template>
