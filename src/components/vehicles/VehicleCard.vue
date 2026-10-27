<script setup lang="ts">
import { computed } from 'vue'
import type { Vehicle } from '~/stores/vehicles'
import { vehiclePhotoUrl } from '~/utils/vehicleCatalog'
import vehicleThumbnail from '~/assets/illustrations/vehicle-thumbnail.png'
import vehicleUnknown from '~/assets/illustrations/vehicle-unknown.png'

// Vehicle summary card (thumbnail, brand + model, version) shared by the
// Informations and Données tabs. The right side (actions, status pills) is a slot.
const { vehicle } = defineProps<{ vehicle: Vehicle }>()

// Unknown model → dark silhouette (Figma 12860:5624)
const photo = computed<string>(() => {
  if (!vehicle.brand) return vehicleUnknown
  return vehiclePhotoUrl(vehicle.brand, vehicle.model) ?? vehicleThumbnail
})
</script>

<template>
  <!-- Layout aligned on the Chargetrip GO vehicle card: photo 84×48, gap 8, name/subtitle 14/20 -->
  <div class="flex items-center gap-[8px] p-[12px] border border-border-neutral-secondary rounded-[8px] bg-neutral">
    <div class="flex-1 min-w-0 flex items-center gap-[8px]">
      <img :src="photo" alt="" class="w-[84px] h-[48px] shrink-0 object-contain">

      <div class="flex-1 min-w-0 flex flex-col">
        <template v-if="vehicle.brand && vehicle.model">
          <span class="font-sans font-medium text-[14px] leading-[20px] text-[#27272a] truncate">{{ vehicle.brand }} {{ vehicle.model }}</span>
          <span class="font-sans font-normal text-[14px] leading-[20px] text-[#71717a] truncate">{{ vehicle.version }}</span>
        </template>
        <template v-else>
          <span class="font-sans font-medium text-[14px] leading-[20px] text-[#27272a]">Modèle non renseigné</span>
          <span class="font-sans font-normal text-[14px] leading-[20px] text-[#71717a]">Choisissez la marque, le modèle et la version</span>
        </template>
      </div>
    </div>

    <div class="flex items-center gap-[4px] shrink-0">
      <slot />
    </div>
  </div>
</template>
