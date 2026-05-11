<script setup lang="ts">
import briefcaseCard from '@/assets/illustrations/upsell-briefcase-card.png'

// V1-native upsell card — single briefcase variant. Figma 5783-24812
// spec: rounded-16, bg-white/10, backdrop-blur-5px, shadow.
// The glass surface lives in an absolute sibling layer so it never
// wraps the <img> — applying backdrop-filter to an ancestor of the
// illustration forces it into a low-res compositing layer on retina
// (Chrome/Safari quirk). Keeping them as siblings preserves both the
// glass aesthetic AND V2-grade illustration quality.

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
  <div class="relative w-[256px]">
    <!-- Glass backdrop — Figma spec: bg-white/10 + backdrop-blur-5 +
         drop shadow. Sits behind the content; the image card on top
         covers the upper 112px so the glass only shines through the
         lower text area. -->
    <div
      class="absolute inset-0 rounded-[16px] bg-white/10 backdrop-blur-[5px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] pointer-events-none"
      aria-hidden="true"
    />

    <!-- Image + text card — no backdrop-filter anywhere in this subtree
         so the <img> renders at native retina resolution. -->
    <div class="relative rounded-[16px] overflow-hidden">
      <!-- Illustration: same render pipeline as V2 (img 256×181 with
           object-cover object-top, parent height clips the white text
           portion of the PNG out). -->
      <div class="relative w-[256px] h-[112px] overflow-hidden">
        <img
          :src="briefcaseCard"
          alt=""
          class="absolute inset-0 w-full h-full object-cover object-top select-none pointer-events-none"
          :style="{ width: '256px', height: '181px' }"
          draggable="false"
        />
      </div>

      <!-- Copy block — transparent so the glass behind shows through. -->
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
  </div>
</template>
