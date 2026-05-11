<script setup lang="ts">
import briefcaseCard from '@/assets/illustrations/upsell-briefcase-card.png'

// V1-native upsell card — single briefcase variant. Reuses V2's
// high-res PNG (the same `upsell-briefcase-card.png` used by
// `SidebarUpsellCard`), clipped to the gradient illustration portion;
// V1 renders its own white copy + close button on the deep blue nav
// underneath instead of bundling the white text section from the PNG.

interface Props {
  closeLabel?: string
}

withDefaults(defineProps<Props>(), {
  closeLabel: 'Fermer',
})

defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="relative w-[256px] overflow-hidden rounded-[16px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)]">
    <!-- Illustration — same render pipeline as V2: img 256×181 with
         object-cover object-top, parent height clips the white text
         section out so only the gradient + briefcase tiles remain. -->
    <div class="relative w-[256px] h-[112px] overflow-hidden">
      <img
        :src="briefcaseCard"
        alt=""
        class="absolute inset-0 w-full h-full object-cover object-top select-none pointer-events-none"
        :style="{ width: '256px', height: '181px' }"
        draggable="false"
      />
    </div>

    <!-- Copy block — sits on the deep blue nav directly. -->
    <div class="relative px-[16px] py-[8px] flex flex-col">
      <p class="font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-[#f8fafc]">
        Boostez votre flotte !
      </p>
      <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-[#f8fafc]">
        Découvrez les packages Business
      </p>
    </div>

    <!-- Close button — dark icon on the light gradient. -->
    <button
      type="button"
      class="absolute top-[8px] right-[8px] size-[24px] flex items-center justify-center rounded-[8px] bg-transparent outline-none transition-colors duration-150 ease-out hover:bg-black/10 focus-visible:shadow-ring-gray motion-reduce:transition-none"
      :aria-label="closeLabel"
      @click="$emit('close')"
    >
      <Icon name="x-mark" variant="outline" :size="16" class="text-[#1e3b8a]" />
    </button>
  </div>
</template>
