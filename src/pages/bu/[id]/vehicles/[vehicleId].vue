<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { HorizontalTab, HorizontalTabBadgeTone } from '~/components/ui/HorizontalTabs.vue'
import type { ConnectionStatus, Vehicle, VehicleEdit } from '~/stores/vehicles'
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
  TO_MATCH: { label: 'À associer', tone: 'orange' },
}

// Compatible vehicle never connected: a banner sends the manager to the Données tab
// (hidden on that tab, where the connection options already are)
const showConnectBanner = computed<boolean>(() =>
  vehicle.value?.compatibility === 'COMPATIBLE'
  && vehicle.value.connectionStatus === 'NOT_CONNECTED'
  && activeTab.value !== 'donnees',
)

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

// Unsaved edits (model, registration fields, notes): applied together with "Modifier"
const toEdit = (v: Vehicle): VehicleEdit => ({
  brand: v.brand, model: v.model, version: v.version, country: v.country, plate: v.plate, vin: v.vin, year: v.year, notes: v.notes ?? '',
})
const edits = ref<VehicleEdit | null>(null)
const resetEdits = () => { edits.value = vehicle.value ? toEdit(vehicle.value) : null }
// Follow the saved vehicle (other vehicle, VIN set by a match…) unless there are unsaved edits
watch(
  () => (vehicle.value ? JSON.stringify(toEdit(vehicle.value)) : ''),
  (_, before) => { if (!edits.value || JSON.stringify(edits.value) === before) resetEdits() },
  { immediate: true },
)

const draftVehicle = computed<Vehicle | null>(() => (vehicle.value && edits.value ? { ...vehicle.value, ...edits.value } : vehicle.value))
const isDirty = computed<boolean>(() =>
  !!vehicle.value && !!edits.value && JSON.stringify(toEdit(vehicle.value)) !== JSON.stringify(edits.value),
)
const onEdit = (patch: Partial<VehicleEdit>) => {
  if (!vehicle.value) return
  if (isEditing.value) {
    if (edits.value) Object.assign(edits.value, patch)
    return
  }
  vehiclesStore.saveVehicle(vehicle.value.id, { ...toEdit(vehicle.value), ...patch })
}

const onModelSelected = (model: { brand: string; model: string; version: string }) => {
  onEdit(model)
  isModelModalOpen.value = false
}

// Pages showing the vehicle details form edit through a draft + "Retour à la liste / Modifier" footer
const isEditing = computed<boolean>(() =>
  activeTab.value === 'informations'
  || (activeTab.value === 'donnees' && vehicle.value?.compatibility === 'UNKNOWN'),
)
const listPath = computed<string>(() => `/bu/${route.params.id}/vehicles`)

const saveVehicle = () => {
  if (!vehicle.value || !edits.value) return
  vehiclesStore.saveVehicle(vehicle.value.id, edits.value)
  resetEdits()
  showToast('Véhicule modifié', 'Les informations du véhicule ont été enregistrées.')
}

const removeModel = () => onEdit({ brand: null, model: null, version: null })
</script>

<template>
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]">
    <div class="mx-auto w-full max-w-[800px] flex flex-col gap-[32px]">
      <Transition
        enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        enter-from-class="opacity-0 -translate-y-[4px]"
        leave-active-class="transition-[opacity,transform] duration-[160ms] ease-in motion-reduce:transition-none"
        leave-to-class="opacity-0 -translate-y-[4px]"
      >
        <Banner
          v-if="showConnectBanner"
          type="brand"
          text="Connectez ce véhicule pour que le kilométrage et les recharges remontent automatiquement."
          action-label="Connecter"
          icon-left="link"
          icon-right=""
          icon-variant="solid"
          @action="activeTab = 'donnees'"
        />
      </Transition>

      <!-- Page header -->
      <div class="flex items-center gap-[16px] anim-fade-up" style="animation-delay: 0ms">
        <img :src="vehicleIllustration" alt="" class="w-[96px] h-[88px] shrink-0 object-contain">
        <div class="flex flex-col items-start justify-center">
          <NuxtLink
            :to="listPath"
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
            :vehicle="draftVehicle ?? vehicle"
            @edit="onEdit"
            @change-model="isModelModalOpen = true"
            @remove-model="removeModel"
          />

          <ConnectionTab
            v-else-if="activeTab === 'donnees'"
            :vehicle="vehicle"
            :draft="draftVehicle ?? vehicle"
            @toast="showToast"
            @edit="onEdit"
            @change-model="isModelModalOpen = true"
            @remove-model="removeModel"
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

      <!-- Edit footer (Figma fiche véhicule) -->
      <div v-if="vehicle && isEditing" class="flex items-center justify-end gap-[12px]">
        <Button type="secondary" size="md" label="Retour à la liste" @click="navigateTo(listPath)" />
        <Button type="primary" size="md" label="Modifier" :disabled="!isDirty" @click="saveVehicle" />
      </div>
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
