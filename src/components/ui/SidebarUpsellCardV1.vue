<script setup lang="ts">
import briefcaseHero from '@/assets/illustrations/upsell-briefcase-hero.png'

// V1-native upsell card — single briefcase variant. Composes the
// illustration in code so we never inherit the white card frame from
// the V2 PNG (which produced ugly vertical edges on the sides of the
// V1 card). Figma 5783-24812 spec:
//   - container: bg-white/10, backdrop-blur-5, shadow, rounded-16
//   - header gradient: linear-gradient(-48.2deg, brand/200 5.78%,
//     brand/100 58.29%, yellow/100 107.87%)
//   - illustration: 3 briefcase tiles (the hero PNG, transparent bg)
// The glass surface stays in an absolute SIBLING layer so it never
// wraps the <img> — keeps retina rendering crisp.

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
    <!-- Glass backdrop (Figma spec). Sibling-positioned so the image
         subtree below stays free of any ancestor backdrop-filter. -->
    <div
      class="absolute inset-0 rounded-[16px] bg-white/10 backdrop-blur-[5px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] pointer-events-none"
      aria-hidden="true"
    />

    <!-- Card content -->
    <div class="relative rounded-[16px] overflow-hidden">
      <!-- Illustration: Figma gradient + briefcase hero PNG overlay -->
      <div
        class="relative w-[256px] h-[112px] overflow-hidden"
        :style="{
          background:
            'linear-gradient(-48.2deg, #bedbfe 5.78%, #dcebfe 58.29%, #fef9c3 107.87%)',
        }"
      >
        <img
          :src="briefcaseHero"
          alt=""
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-auto select-none pointer-events-none"
          draggable="false"
        />
      </div>

      <!-- Copy block — transparent so the glass behind shines through. -->
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
