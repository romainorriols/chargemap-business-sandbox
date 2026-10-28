<script setup lang="ts">
import { ref } from 'vue'
import type { DropdownItem } from '~/components/ui/DropdownMenu.vue'
import type { Vehicle, VehicleEdit } from '~/stores/vehicles'

// "Informations" tab of the vehicle detail page (Figma choix-modele-0-fiche-vehicule):
// vehicle details (VehicleInfoForm) and attached badges.
const { vehicle } = defineProps<{ vehicle: Vehicle }>()
const emit = defineEmits<{ edit: [patch: Partial<VehicleEdit>]; changeModel: []; removeModel: [] }>()

const { updateInfo } = useVehiclesStore()

// Attached badge (the sandbox keeps a single badge per vehicle)
const BADGE_ITEMS: DropdownItem[] = ['CMP-2403-418263', 'CMP-2405-730518', 'CMP-2409-264097', 'CMP-2502-583140', 'CMP-2504-917362', 'CMP-2506-342785']
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

      <VehicleInfoForm :vehicle="vehicle" @edit="(p) => emit('edit', p)" @change-model="emit('changeModel')" @remove-model="emit('removeModel')" />
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
