<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DropdownItem } from '~/components/ui/DropdownMenu.vue'
import type { Vehicle } from '~/stores/vehicles'

// "Informations" tab of the vehicle detail page (Figma choix-modele-0-fiche-vehicule):
// vehicle card (change / remove model), registration fields, attached badges.
const { vehicle } = defineProps<{ vehicle: Vehicle }>()
const emit = defineEmits<{ changeModel: []; removeModel: [] }>()

const { updateInfo } = useVehiclesStore()

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

// Attached badge (the sandbox keeps a single badge per vehicle)
const BADGE_ITEMS: DropdownItem[] = ['Badge 0012', 'Badge 0024', 'Badge 0031', 'Badge 0042', 'Badge 0075', 'Badge 0088']
  .map(b => ({ value: b, label: b }))
const isAttaching = ref(false)
const badgeToAttach = ref('')

const startAttach = () => {
  badgeToAttach.value = ''
  isAttaching.value = true
}
const attachBadge = () => {
  if (!badgeToAttach.value) return
  updateInfo(vehicle.id, { badge: badgeToAttach.value })
  isAttaching.value = false
}

const sectionTitleClass = 'font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral'
const cardClass = 'w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm'
</script>

<template>
  <div class="flex flex-col gap-[40px]">
    <!-- Informations -->
    <section class="flex flex-col gap-[16px]">
      <h2 :class="sectionTitleClass">Informations</h2>

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
            @update:model-value="(v: string | string[]) => updateInfo(vehicle.id, { country: String(v) })"
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
            @update:model-value="(v: string) => updateInfo(vehicle.id, { plate: v })"
          />
          <Input
            :model-value="vehicle.vin ?? ''"
            size="sm"
            label="Numéro VIN"
            placeholder="Entrer le VIN"
            @update:model-value="(v: string) => updateInfo(vehicle.id, { vin: v || null })"
          />
          <Input
            :model-value="vehicle.year ?? ''"
            size="sm"
            label="Année"
            placeholder="Entrer l’année"
            inputmode="numeric"
            maxlength="4"
            @update:model-value="(v: string) => updateInfo(vehicle.id, { year: v || null })"
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
              @input="updateInfo(vehicle.id, { notes: ($event.target as HTMLTextAreaElement).value })"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Badges attachés -->
    <section class="flex flex-col gap-[16px]">
      <div class="flex flex-col gap-[2px]">
        <h2 :class="sectionTitleClass">Badges attachés</h2>
        <p class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
          Assignez un ou plusieurs badges à ce véhicule en les sélectionnant dans la liste.
        </p>
      </div>

      <div :class="[cardClass, 'flex flex-col']">
        <div class="flex items-center justify-between gap-[16px] px-[16px] py-[12px] border-b border-border-neutral-secondary">
          <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
            {{ vehicle.badge ? '1 badge attaché' : 'Aucun badge attaché' }}
          </span>
          <Button type="tertiaryGray" size="sm" icon-only icon-left="plus" label="Attacher un badge" @click="startAttach" />
        </div>

        <div v-if="vehicle.badge" class="flex items-center justify-between gap-[16px] px-[16px] py-[12px]">
          <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">{{ vehicle.badge }}</span>
          <Button type="tertiaryGray" size="sm" icon-only icon-left="ellipsis-horizontal" label="Actions du badge" />
        </div>

        <div
          v-if="isAttaching"
          :class="['flex flex-col sm:flex-row sm:items-center gap-[8px] px-[16px] py-[12px]', vehicle.badge ? 'border-t border-border-neutral-secondary' : '']"
        >
          <div class="flex-1 min-w-0">
            <Dropdown
              v-model="badgeToAttach"
              :items="BADGE_ITEMS"
              size="sm"
              :show-label="false"
              :show-hint="false"
              :searchable="false"
              placeholder="Sélectionnez des badges"
            />
          </div>
          <div class="flex items-center gap-[8px] shrink-0">
            <Button type="secondary" size="sm" label="Annuler" @click="isAttaching = false" />
            <Button type="primary" size="sm" label="Attacher" :disabled="!badgeToAttach" @click="attachBadge" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
