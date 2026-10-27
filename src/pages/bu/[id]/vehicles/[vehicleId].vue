<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { HorizontalTab, HorizontalTabBadgeTone } from '~/components/ui/HorizontalTabs.vue'
import type { ConnectionStatus, Vehicle } from '~/stores/vehicles'
import vehicleIllustration from '~/assets/illustrations/vehicle-header.png'

// Vehicle detail page (Figma [BU] Véhicules — "Détails du véhicule", 800px wide).
// The "Données" tab carries the connection status badge and the connection flows.
const headingClass = usePageHeadingClass()
const vehiclesStore = useVehiclesStore()
const route = useRoute()

const activeTab = ref(typeof route.query.tab === 'string' ? route.query.tab : 'informations')
const isModelModalOpen = ref(false)

const vehicle = computed<Vehicle | null>(() => vehiclesStore.byId(String(route.params.vehicleId)))

// Header title: the vehicle's plate
const pageTitle = computed<string>(() => vehicle.value?.plate ?? 'Détails du véhicule')

// Tab badge per status (Figma horizontal-tabs): blue = neutral, orange = needs action,
// rose = failure, none once connected or when the vehicle can't be connected.
const DATA_TAB_BADGES: Record<ConnectionStatus, { label: string; tone: HorizontalTabBadgeTone } | undefined> = {
  NOT_CONNECTED: { label: 'Non connecté', tone: 'blue' },
  REQUESTED: { label: 'Invitation', tone: 'blue' },
  IN_PROGRESS: { label: 'En attente', tone: 'blue' },
  CONNECTED: undefined,
  ACTION_REQUIRED: { label: 'Action requise', tone: 'orange' },
  FAILED: { label: 'Échec', tone: 'rose' },
  DISCONNECTED: { label: 'Déconnecté', tone: 'orange' },
}

const tabs = computed<HorizontalTab[]>(() => [
  { id: 'informations', label: 'Informations' },
  {
    id: 'donnees',
    label: 'Données',
    badge: vehicle.value?.compatibility === 'COMPATIBLE' ? DATA_TAB_BADGES[vehicle.value.connectionStatus] : undefined,
  },
  { id: 'kilometrage', label: 'Kilométrage' },
  { id: 'recharges', label: 'Recharges' },
])

// Toast — one at a time, auto-dismiss after 3.5s (same as settings)
const toast = reactive<{ visible: boolean; title: string; description: string }>({ visible: false, title: '', description: '' })
let toastTimer: ReturnType<typeof setTimeout> | null = null
const showToast = (title: string, description: string) => {
  if (toastTimer) clearTimeout(toastTimer)
  Object.assign(toast, { title, description, visible: true })
  toastTimer = setTimeout(() => { toast.visible = false }, 3500)
}

const onModelSelected = (model: { brand: string; model: string; version: string }) => {
  if (!vehicle.value) return
  vehiclesStore.setModel(vehicle.value.id, model)
  isModelModalOpen.value = false
  showToast('Modèle mis à jour', `${model.brand} ${model.model} · ${model.version}`)
}

const removeModel = () => {
  if (!vehicle.value) return
  vehiclesStore.setModel(vehicle.value.id, null)
  showToast('Modèle retiré', 'Renseignez un modèle pour connaître la compatibilité du véhicule.')
}
</script>

<template>
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]">
    <div class="mx-auto w-full max-w-[800px] flex flex-col gap-[32px]">

      <!-- Page header -->
      <div class="flex items-center gap-[16px] anim-fade-up" style="animation-delay: 0ms">
        <img :src="vehicleIllustration" alt="" class="w-[96px] h-[88px] shrink-0 object-contain">
        <div class="flex flex-col items-start justify-center">
          <NuxtLink
            :to="`/bu/${route.params.id}/vehicles`"
            class="-m-[4px] inline-flex items-center gap-[8px] rounded-[4px] p-[4px] text-text-neutral-secondary outline-none transition-[color,background-color] duration-150 ease-out hover:text-text-neutral focus-visible:shadow-ring-gray motion-reduce:transition-none"
          >
            <Icon name="arrow-left" variant="outline" :size="16" />
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">Retour</span>
          </NuxtLink>
          <h1 :class="headingClass">{{ pageTitle }}</h1>
        </div>
      </div>

      <div
        v-if="!vehicle"
        class="flex items-center justify-center min-h-[200px] bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary"
      >
        Ce véhicule n’existe pas ou a été supprimé.
      </div>

      <HorizontalTabs
        v-else
        v-model="activeTab"
        :tabs="tabs"
        variant="underline"
        class="anim-fade-up"
        style="animation-delay: 40ms"
      >
        <template #panel>
          <VehicleInfoTab
            v-if="activeTab === 'informations'"
            :vehicle="vehicle"
            @change-model="isModelModalOpen = true"
            @remove-model="removeModel"
          />

          <ConnectionTab
            v-else-if="activeTab === 'donnees'"
            :vehicle="vehicle"
            @toast="showToast"
            @change-model="isModelModalOpen = true"
            @go-tab="(tab: string) => (activeTab = tab)"
          />

          <!-- Kilométrage / Recharges: out of the prototype scope -->
          <div
            v-else
            class="flex flex-col items-center justify-center gap-[4px] min-h-[200px] bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[24px] text-center"
          >
            <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">Bientôt disponible</p>
            <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
              Cette section ne fait pas partie de ce prototype.
            </p>
          </div>
        </template>
      </HorizontalTabs>
    </div>

    <ChangeModelModal :open="isModelModalOpen" @close="isModelModalOpen = false" @select="onModelSelected" />

    <!-- Toast overlay (top-right) -->
    <div class="pointer-events-none fixed top-[24px] right-[24px] z-50">
      <div class="pointer-events-auto">
        <Toast
          v-model="toast.visible"
          type="success"
          :title="toast.title"
          :description="toast.description"
          :primary-action-label="''"
          :secondary-action-label="''"
        />
      </div>
    </div>
  </div>
</template>
