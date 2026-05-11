<script setup lang="ts">
import briefcaseIllustration from '@/assets/illustrations/upsell-briefcase-illustration.png'

// V1-native upsell card. Pixel-perfect to Figma 5783-24812 —
// translucent glass surface with the Figma-exported illustration in the
// header and a white copy block below. The card sits on the deep-blue
// nav (#1e3fae); the 10%-white surface + 5px backdrop blur lets the
// nav tint the lower half while the gradient illustration pops up top.

type Variant = 'briefcase' | 'supervision'

interface Props {
  variant: Variant
  closeLabel?: string
  /** Truncated "back of the deck" pose — only the illustration peeks. */
  stacked?: boolean
}

withDefaults(defineProps<Props>(), {
  closeLabel: 'Fermer',
  stacked: false,
})

defineEmits<{
  close: []
}>()
</script>

<template>
  <div
    class="relative overflow-clip rounded-[16px] bg-white/10 backdrop-blur-[5px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-[width,height,margin] duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
    :class="stacked ? 'w-[236px] h-[80px]' : 'w-[256px]'"
  >
    <!-- Illustration header (Figma node 5783-24813, 256×120 native).
         Variants share the same composed-icons header for now — only
         the briefcase variant has an exported asset; supervision falls
         back to it until the design ships a paired illustration. -->
    <img
      :src="briefcaseIllustration"
      alt=""
      class="block w-full select-none pointer-events-none"
      :class="stacked ? 'h-[80px] object-cover object-top' : 'h-[120px]'"
      draggable="false"
    />

    <!-- Copy block — Figma px-16 py-8, neutral-inverse text on the
         translucent surface (which inherits the deep blue nav below). -->
    <div v-if="!stacked" class="px-[16px] py-[8px] flex flex-col">
      <p class="font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-[#f8fafc]">
        {{ variant === 'briefcase' ? 'Boostez votre flotte !' : 'Recharge sur site et à domicile' }}
      </p>
      <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-[#f8fafc]">
        {{ variant === 'briefcase' ? 'Découvrez les packages Business' : 'Chargemap supervise vos bornes' }}
      </p>
    </div>

    <!-- Close button — sits on the light gradient, so the icon is dark
         to keep contrast. -->
    <button
      v-if="!stacked"
      type="button"
      class="absolute top-[8px] right-[8px] size-[24px] flex items-center justify-center rounded-[8px] bg-transparent outline-none transition-colors duration-150 ease-out hover:bg-black/10 focus-visible:shadow-ring-gray motion-reduce:transition-none"
      :aria-label="closeLabel"
      @click="$emit('close')"
    >
      <Icon name="x-mark" variant="outline" :size="16" class="text-[#1e3b8a]" />
    </button>
  </div>
</template>
