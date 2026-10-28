<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DropdownItem } from '~/components/ui/DropdownMenu.vue'
import type { HorizontalTab } from '~/components/ui/HorizontalTabs.vue'
import type { Vehicle } from '~/stores/vehicles'
import { vehiclePhotoUrl } from '~/utils/vehicleCatalog'

// Shown after a multi-vehicle connection when some vehicles returned by the
// manufacturer account (identified by their VIN) can't be matched automatically:
// several fleet vehicles share the same model + year and have no VIN in Business.
// Figma modale-association-v2: "Associer manuellement" / "Importer un CSV" tabs.
export interface MatchGroup {
  label: string // "Renault Megane E-Tech · 2023"
  vins: string[] // returned by the manufacturer account
  candidates: Vehicle[] // fleet vehicles it could be
}
type Mode = 'manual' | 'csv'

const { open, groups } = defineProps<{ open: boolean; groups: MatchGroup[] }>()
const emit = defineEmits<{ close: []; confirm: [matches: { vehicleId: string; vin: string }[]]; later: [] }>()

const MODES: HorizontalTab[] = [
  { id: 'manual', label: 'Associer manuellement' },
  { id: 'csv', label: 'Importer un CSV' },
]
const mode = ref<Mode>('manual')
const assignment = ref<Record<string, string>>({}) // vin → vehicle id
const csvImported = ref(false)

watch(() => open, (isOpen) => {
  if (!isOpen) return
  mode.value = 'manual'
  assignment.value = {}
  csvImported.value = false
})

const ambiguousCount = computed<number>(() => groups.reduce((n, g) => n + g.vins.length, 0))
const rows = computed(() => groups.flatMap(group => group.vins.map(vin => ({
  vin,
  group,
  photo: vehiclePhotoUrl(group.candidates[0].brand, group.candidates[0].model),
}))))

// A plate can only be picked once
const itemsFor = (group: MatchGroup, vin: string): DropdownItem[] => {
  const takenElsewhere = Object.entries(assignment.value).filter(([v]) => v !== vin).map(([, id]) => id)
  return group.candidates
    .filter(c => !takenElsewhere.includes(c.id))
    .map(c => ({ value: c.id, label: c.plate }))
}
const assign = (vin: string, value: string | string[]) => { assignment.value = { ...assignment.value, [vin]: String(value) } }

// Prototype: the CSV import is simulated, VINs are filled in for the candidates in order
const importCsv = () => { csvImported.value = true }

const matches = computed<{ vehicleId: string; vin: string }[]>(() => {
  if (mode.value === 'csv') {
    return csvImported.value ? groups.flatMap(g => g.vins.map((vin, i) => ({ vehicleId: g.candidates[i].id, vin }))) : []
  }
  return Object.entries(assignment.value).map(([vin, vehicleId]) => ({ vehicleId, vin }))
})
const isComplete = computed<boolean>(() => matches.value.length === ambiguousCount.value)

const textClass = 'font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px]'
const linkClass = 'text-text-brand-medium underline underline-offset-2 hover:no-underline'
</script>

<template>
  <VehicleModal
    :open="open"
    size="lg"
    :title="`${ambiguousCount} véhicules à associer`"
    subtitle="Ces véhicules ont le même modèle et la même année, sans VIN dans Chargemap Business : nous ne pouvons pas les associer automatiquement. Associez-les manuellement ou via CSV avec leur immatriculation et leur VIN."
    @close="emit('close')"
  >
    <!-- Fills the fixed-height modal body: the list scrolls, both tabs keep the same size -->
    <div class="h-full flex flex-col gap-[16px]">
      <HorizontalTabs v-model="mode" :tabs="MODES" full-width />

      <!-- Manual: one row per vehicle of the manufacturer account -->
      <ul v-if="mode === 'manual'" class="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <li
          v-for="row in rows"
          :key="row.vin"
          class="flex items-center gap-[8px] px-[12px] py-[8px] border-b border-border-neutral-secondary"
        >
          <img v-if="row.photo" :src="row.photo" alt="" class="w-[84px] h-[48px] shrink-0 object-contain">
          <div class="flex-1 min-w-0 flex flex-col">
            <span :class="[textClass, 'text-text-neutral truncate']">{{ row.group.label }}</span>
            <span :class="[textClass, 'text-text-neutral-secondary truncate tabular-nums']">{{ row.vin }}</span>
          </div>
          <div class="w-[200px] shrink-0">
            <Dropdown
              :model-value="assignment[row.vin] ?? ''"
              :items="itemsFor(row.group, row.vin)"
              size="sm"
              :show-label="false"
              :show-hint="false"
              :searchable="false"
              teleport
              placeholder="Immatriculation"
              @update:model-value="(v: string | string[]) => assign(row.vin, v)"
            />
          </div>
        </li>
      </ul>

      <!-- CSV: drop zone + help, then the import result -->
      <template v-else>
        <div
          v-if="!csvImported"
          class="flex-1 min-h-0 flex flex-col items-center justify-center gap-[12px] px-[24px] rounded-[12px] border border-border-neutral-secondary bg-neutral text-center"
        >
          <span class="flex items-center justify-center size-[36px] rounded-[8px] border border-border-neutral-secondary shadow-sm">
            <Icon name="cloud-arrow-up" :size="18" class="text-icon-brand" />
          </span>
          <div class="flex flex-col gap-[4px]">
            <p :class="[textClass, 'text-text-neutral-secondary']">
              <button type="button" class="font-medium text-text-brand-medium hover:underline" @click="importCsv">Importer un fichier</button>
              ou le glisser-déposer ici
            </p>
            <p class="font-sans font-normal text-[12px] leading-[1.5] text-text-neutral-secondary">CSV · colonnes immatriculation et VIN</p>
          </div>
        </div>
        <div v-else class="flex items-center gap-[12px] px-[16px] py-[14px] rounded-[12px] border border-border-neutral-secondary">
          <Icon name="check-circle" :size="20" class="shrink-0 text-[#18b97e]" />
          <div class="flex-1 min-w-0 flex flex-col">
            <span :class="[textClass, 'font-medium text-text-neutral truncate']">vin-flotte.csv</span>
            <span :class="[textClass, 'text-text-neutral-secondary']">{{ ambiguousCount }} véhicules associés</span>
          </div>
          <Button type="tertiaryGray" size="sm" label="Remplacer" @click="csvImported = false" />
        </div>
        <p :class="[textClass, 'text-text-neutral-secondary']">
          Pour un import sans erreur, partez du <a href="#" :class="linkClass" @click.prevent>fichier modèle</a>
          ou consultez la <a href="#" :class="linkClass" @click.prevent>documentation</a>.
        </p>
      </template>
    </div>

    <template #footer>
      <Button type="secondary" size="sm" label="Plus tard" @click="emit('later')" />
      <Button type="primary" size="sm" label="Associer les véhicules" :disabled="!isComplete" @click="emit('confirm', matches)" />
    </template>
  </VehicleModal>
</template>
