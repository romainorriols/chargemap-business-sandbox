<script setup lang="ts">
import briefcaseHero from '@/assets/illustrations/upsell-briefcase-hero.png'

// V1-native upsell card. The V2 cards (SidebarUpsellCard.vue) are PNG
// blobs with a baked-in white surface — on V1's deep blue nav they read
// as alien "white blocks". This variant ships the same content but on a
// translucent surface that sits naturally inside the dark-blue nav.

type Variant = 'briefcase' | 'supervision'

interface Props {
  variant: Variant
  closeLabel?: string
  /** Truncated "back of the deck" pose — narrower, shorter, peeking. */
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
    class="relative overflow-hidden rounded-[12px] bg-white/[0.07] ring-1 ring-white/15 backdrop-blur-sm transition-[width,height,margin] duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
    :class="stacked ? 'w-[236px] h-[64px]' : 'w-[256px] min-h-[148px]'"
  >
    <!-- Briefcase: hero illustration top-right, copy bottom-left -->
    <template v-if="variant === 'briefcase'">
      <img
        v-if="!stacked"
        :src="briefcaseHero"
        alt=""
        class="absolute top-[-8px] right-[-12px] w-[120px] h-[120px] object-contain select-none pointer-events-none opacity-95"
        draggable="false"
      />
      <div
        class="relative flex flex-col gap-[4px]"
        :class="stacked ? 'p-[14px] pr-[44px]' : 'p-[16px] pt-[72px] pr-[14px]'"
      >
        <p class="font-sans font-semibold text-[14px] leading-[1.4] tracking-[-0.42px] text-white">
          Boostez votre flotte
        </p>
        <p v-if="!stacked" class="font-sans font-normal text-[12px] leading-[1.5] tracking-[-0.36px] text-brand-lighter">
          Découvrez les packages Business
        </p>
      </div>
    </template>

    <!-- Supervision: icon tile left, copy right -->
    <template v-else>
      <div
        class="relative flex items-start gap-[12px]"
        :class="stacked ? 'p-[14px] pr-[44px]' : 'p-[16px] pr-[44px]'"
      >
        <div class="size-[40px] shrink-0 rounded-[8px] bg-white/10 ring-1 ring-white/10 flex items-center justify-center">
          <Icon name="charging-station" variant="solid" :size="22" class="text-white" />
        </div>
        <div class="flex-1 min-w-0 flex flex-col gap-[4px]">
          <p class="font-sans font-semibold text-[14px] leading-[1.4] tracking-[-0.42px] text-white">
            Recharge sur site
          </p>
          <p v-if="!stacked" class="font-sans font-normal text-[12px] leading-[1.5] tracking-[-0.36px] text-brand-lighter">
            Chargemap supervise vos bornes
          </p>
        </div>
      </div>
    </template>

    <button
      v-if="!stacked"
      type="button"
      class="absolute top-[8px] right-[8px] size-[24px] rounded-[6px] flex items-center justify-center bg-transparent outline-none transition-colors duration-150 ease-out hover:bg-white/10 focus-visible:shadow-ring-gray motion-reduce:transition-none"
      :aria-label="closeLabel"
      @click="$emit('close')"
    >
      <Icon name="x-mark" variant="outline" :size="14" class="text-white/80" />
    </button>
  </div>
</template>
