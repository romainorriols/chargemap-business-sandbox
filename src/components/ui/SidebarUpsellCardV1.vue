<script setup lang="ts">
import briefcaseIllustration from '@/assets/illustrations/upsell-briefcase-illustration.png'

// V1-native upsell card — single briefcase variant. Figma 5783-24812
// spec: rounded-16, bg-white/10, backdrop-blur-5, shadow.
// The glass surface lives in an absolute sibling layer so it never
// wraps the <img> — applying backdrop-filter to an ancestor of the
// illustration forces it into a low-res compositing layer on retina
// (Chrome/Safari quirk). Keeping them as siblings preserves both the
// glass aesthetic AND the illustration's native quality.

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
      <!-- Illustration — the Figma export (768×360, gradient + 3
           briefcase tiles, no card frame). Container matches the PNG
           aspect ratio (256:120) so the image renders at its native
           proportions, no object-fit cropping. -->
      <img
        :src="briefcaseIllustration"
        alt=""
        class="block w-[256px] h-[120px] select-none pointer-events-none"
        draggable="false"
      />

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
