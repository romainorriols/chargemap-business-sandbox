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

      <!-- Close button — invisible click target overlaid on the X that
           is already baked into the PNG (top-right of the illustration),
           matching V2's pattern. Drawing our own icon would double up. -->
      <button
        type="button"
        class="absolute top-[7px] right-[7px] size-[24px] rounded-[8px] bg-transparent outline-none active:scale-[0.95] transition-transform duration-150 ease-out focus-visible:shadow-ring-gray motion-reduce:transition-none"
        :aria-label="closeLabel"
        @click="$emit('close')"
      />
    </div>
  </div>
</template>
