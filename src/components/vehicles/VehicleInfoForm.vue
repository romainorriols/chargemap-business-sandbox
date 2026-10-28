<script setup lang="ts">
import { computed } from 'vue'
import type { DropdownItem } from '~/components/ui/DropdownMenu.vue'
import type { Vehicle, VehicleEdit } from '~/stores/vehicles'

// Vehicle details card (Figma choix-modele-0-fiche-vehicule): vehicle card with
// change / remove model, registration fields and notes. Shared by the
// "Informations" tab and the "Données" tab when the model is unknown.
// Edits are only emitted: the page decides when to apply them (draft or at once).
const { vehicle } = defineProps<{ vehicle: Vehicle }>()
const emit = defineEmits<{ edit: [patch: Partial<VehicleEdit>]; changeModel: []; removeModel: [] }>()

const flag = (cc: string) => `https://hatscripts.github.io/circle-flags/flags/${cc.toLowerCase()}.svg`
const countryItems: DropdownItem[] = [
  { value: 'FR', label: 'France', flagUrl: flag('FR') },
  { value: 'BE', label: 'Belgique', flagUrl: flag('BE') },
  { value: 'CH', label: 'Suisse', flagUrl: flag('CH') },
  { value: 'LU', label: 'Luxembourg', flagUrl: flag('LU') },
  { value: 'DE', label: 'Allemagne', flagUrl: flag('DE') },
  { value: 'IT', label: 'Italie', flagUrl: flag('IT') },
  { value: 'ES', label: 'Espagne', flagUrl: flag('ES') },
]
const selectedCountry = computed<DropdownItem | undefined>(() => countryItems.find(c => c.value === vehicle.country))

const cardClass = 'w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm'
</script>

<template>
  <div :class="[cardClass, 'p-[16px] flex flex-col gap-[16px]']">
    <VehicleCard :vehicle="vehicle">
      <template v-if="vehicle.brand">
        <Button
          type="tertiaryGray"
          size="sm"
          icon-only
          icon-left="pencil"
          label="Modifier le modèle"
          @click="emit('changeModel')"
        />
        <Button
          type="tertiaryGray"
          size="sm"
          icon-only
          icon-left="trash"
          label="Retirer le modèle"
          @click="emit('removeModel')"
        />
      </template>
      <Button
        v-else
        type="tertiaryGray"
        size="sm"
        label="Renseigner"
        @click="emit('changeModel')"
      />
    </VehicleCard>

    <!-- Registration fields -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-[16px] gap-y-[16px]">
      <Dropdown
        :model-value="vehicle.country"
        :items="countryItems"
        size="sm"
        input-type="country"
        menu-type="country"
        label="Pays d’immatriculation"
        :show-hint="false"
        search-placeholder="Rechercher un pays"
        placeholder="Sélectionner un pays"
        @update:model-value="(v: string | string[]) => emit('edit', { country: String(v) })"
      >
        <template v-if="selectedCountry" #flag>
          <img :src="selectedCountry.flagUrl" :alt="selectedCountry.label" class="shrink-0 size-5 rounded-full object-cover">
        </template>
      </Dropdown>
      <Input
        :model-value="vehicle.plate"
        size="sm"
        label="Immatriculation*"
        placeholder="Entrer l’immatriculation"
        @update:model-value="(v: string) => emit('edit', { plate: v })"
      />
      <Input
        :model-value="vehicle.vin ?? ''"
        size="sm"
        label="Numéro VIN"
        placeholder="Entrer le VIN"
        @update:model-value="(v: string) => emit('edit', { vin: v || null })"
      />
      <Input
        :model-value="vehicle.year ?? ''"
        size="sm"
        label="Année"
        placeholder="Entrer l’année"
        inputmode="numeric"
        maxlength="4"
        @update:model-value="(v: string) => emit('edit', { year: v || null })"
      />

      <!-- Free text, full width (Figma text-area 12860:5753) -->
      <div class="sm:col-span-2 flex flex-col gap-[4px]">
        <label for="vehicle-notes" class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
          Informations complémentaires
        </label>
        <textarea
          id="vehicle-notes"
          :value="vehicle.notes ?? ''"
          rows="4"
          placeholder="Saisissez des informations..."
          class="w-full resize-none rounded-md border border-border-neutral-secondary bg-neutral px-[12px] py-[10px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral placeholder:text-text-neutral-secondary shadow-sm outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-brand focus:shadow-ring-brand"
          @input="emit('edit', { notes: ($event.target as HTMLTextAreaElement).value })"
        />
      </div>
    </div>
  </div>
</template>
