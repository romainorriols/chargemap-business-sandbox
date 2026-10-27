<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { DropdownItem } from '~/components/ui/DropdownMenu.vue'
import type { ConnectionScenario } from '~/stores/vehicles'

// Sandbox-only floating control center (FAB bottom-right + popover).
// Vehicles prototype branch: the generic demo options (nav, empty state, max width)
// are removed; the panel only exists on a vehicle page, to switch its connection
// scenario (statuses + compatibility cases).
const route = useRoute()
const vehicleId = computed<string | null>(() => route.path.match(/^\/bu\/[^/]+\/vehicles\/([^/]+)/)?.[1] ?? null)

const vehiclesStore = useVehiclesStore()
const currentVehicle = computed(() => (vehicleId.value ? vehiclesStore.byId(vehicleId.value) : null))
const isHidden = computed<boolean>(() => !currentVehicle.value)
const SCENARIO_ITEMS: DropdownItem[] = [
  { value: 'NOT_CONNECTED', label: 'Non connecté' },
  { value: 'REQUESTED', label: 'Invitation envoyée' },
  { value: 'IN_PROGRESS', label: 'En attente' },
  { value: 'CONNECTED', label: 'Connecté' },
  { value: 'ACTION_REQUIRED', label: 'Action requise' },
  { value: 'FAILED', label: 'Échec de connexion' },
  { value: 'DISCONNECTED', label: 'Déconnecté' },
  { value: 'NOT_COMPATIBLE', label: 'Non compatible' },
  { value: 'UNKNOWN', label: 'Compatibilité inconnue' },
]
const currentScenario = computed<string>(() => {
  const v = currentVehicle.value
  if (!v) return ''
  return v.compatibility === 'COMPATIBLE' ? v.connectionStatus : v.compatibility
})
const onScenarioChange = (value: string | string[]) => {
  if (vehicleId.value) vehiclesStore.setScenario(vehicleId.value, String(value) as ConnectionScenario)
}

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

function toggleOpen() { open.value = !open.value }
function close() { open.value = false }

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) close()
}
function onPointerDown(e: PointerEvent) {
  if (open.value && rootRef.value && !rootRef.value.contains(e.target as Node)) close()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('pointerdown', onPointerDown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('pointerdown', onPointerDown)
})
</script>

<template>
  <div v-if="!isHidden" ref="rootRef" class="fixed bottom-[16px] right-[16px] z-50 flex flex-col items-end gap-[8px]">
    <Transition
      enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      enter-from-class="opacity-0 translate-y-[6px] scale-[0.96]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-[4px] scale-[0.97]"
    >
      <div
        v-if="open"
        role="menu"
        aria-label="Sandbox controls"
        class="origin-bottom-right min-w-[220px] p-[8px] bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] flex flex-col"
      >
        <p class="px-[8px] pt-[4px] pb-[8px] font-sans font-semibold text-[11px] uppercase tracking-[0.6px] text-text-neutral-secondary">
          Sandbox
        </p>
        <div class="flex flex-col gap-[6px] px-[8px] py-[8px] w-[260px]">
          <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
            Statut connexion
          </span>
          <Dropdown
            :model-value="currentScenario"
            :items="SCENARIO_ITEMS"
            size="sm"
            :show-label="false"
            :show-hint="false"
            :searchable="false"
            placeholder="Choisir un statut"
            @update:model-value="onScenarioChange"
          />
        </div>
      </div>
    </Transition>

    <button
      type="button"
      class="size-[48px] rounded-full bg-neutral border border-border-neutral-secondary shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] flex items-center justify-center outline-none transition-colors duration-150 ease-out hover:bg-neutral-secondary focus-visible:shadow-ring-gray motion-reduce:transition-none"
      :aria-expanded="open"
      aria-haspopup="menu"
      aria-label="Ouvrir les contrôles sandbox"
      @click="toggleOpen"
    >
      <Icon
        :name="open ? 'x-mark' : 'cog-6-tooth'"
        :size="22"
        variant="solid"
        class="text-icon-neutral-secondary"
      />
    </button>
  </div>
</template>
