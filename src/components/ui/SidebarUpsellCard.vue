<script setup lang="ts">
import briefcaseCard from '@/assets/illustrations/upsell-briefcase-card.png'
import supervisionCard from '@/assets/illustrations/upsell-supervision-card.png'

type Variant = 'briefcase' | 'supervision'

interface Props {
  variant: Variant
  closeLabel?: string
  /**
   * When true, card is rendered in its truncated "back stack" form:
   * narrower, fixed height, top band peeking above the front card.
   */
  stacked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  closeLabel: 'Fermer',
  stacked: false,
})

defineEmits<{
  close: []
}>()

// Both variants: the PNG already contains the full card (frame, shadow, text) — we just
// size it and overlay the X button. Dims match so the two cards line up identically in the
// grid (same 16px peek, same transition).
const dims = { full: 'w-[256px] h-[181px]', stacked: 'w-[236px] h-[164px]' }
</script>

<template>
  <!-- Briefcase: the full card lives inside the PNG, so the wrapper has no frame styling. -->
  <div
    v-if="variant === 'briefcase'"
    class="relative overflow-hidden transition-[width,height,margin] duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
    :class="stacked ? dims.stacked : dims.full"
  >
    <img
      :src="briefcaseCard"
      alt="Boostez votre flotte — Découvrez les packages Business"
      class="absolute inset-0 w-full h-full object-cover object-top select-none pointer-events-none"
      draggable="false"
    />
    <!-- Hide baked-in X when stacked (peek area behind another card). -->
    <div
      v-if="stacked"
      class="absolute top-[4px] right-[4px] size-[28px] rounded-[6px] backdrop-blur-md pointer-events-none"
      aria-hidden="true"
    />
    <button
      v-if="!stacked"
      type="button"
      class="absolute top-[7px] right-[7px] size-[24px] rounded-[8px] bg-transparent active:scale-[0.95] transition-transform duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
      :aria-label="closeLabel"
      @click="$emit('close')"
    />
  </div>

  <!-- Supervision: PNG is the full card visual. X button overlaid, only when card is alone. -->
  <div
    v-else
    class="relative overflow-hidden transition-[width,height,margin] duration-[320ms] delay-[60ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
    :class="stacked ? dims.stacked : dims.full"
  >
    <img
      :src="supervisionCard"
      alt="Recharge sur site et à domicile — Chargemap supervise vos bornes"
      class="absolute inset-0 w-full h-full object-cover object-top select-none pointer-events-none"
      draggable="false"
    />
    <!-- Hide baked-in X when stacked (peek area behind another card). -->
    <div
      v-if="stacked"
      class="absolute top-[4px] right-[4px] size-[28px] rounded-[6px] backdrop-blur-md pointer-events-none"
      aria-hidden="true"
    />
    <button
      v-if="!stacked"
      type="button"
      class="absolute top-[7px] right-[7px] size-[24px] rounded-[8px] bg-transparent active:scale-[0.95] transition-transform duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
      :aria-label="closeLabel"
      @click="$emit('close')"
    />
  </div>
</template>
