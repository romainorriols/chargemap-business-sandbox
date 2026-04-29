<script setup lang="ts">
import { computed } from 'vue'
import Icon from '../ui/Icon.vue'

type AccentColor = 'indigo' | 'brand' | 'turquoise' | 'orange' | 'rose' | 'yellow' | 'purple'

interface Props {
  icon?: string
  value: string
  label: string
  link?: string
  /** Accent color for the icon container + icon. Defaults to 'indigo' (the KPI-card accent in Figma). */
  accent?: AccentColor
  /** Title-only variant: no icon, label is a section heading. Used for "Données RSE". */
  titleOnly?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  accent: 'indigo',
  titleOnly: false,
})

const iconTheme = computed(() => {
  const map: Record<AccentColor, { bg: string; fg: string }> = {
    indigo:    { bg: 'bg-[#6467f2]', fg: 'text-white' },
    brand:     { bg: 'bg-brand',     fg: 'text-white' },
    turquoise: { bg: 'bg-[#2ee09f]', fg: 'text-white' },
    orange:    { bg: 'bg-[#f97415]', fg: 'text-white' },
    rose:      { bg: 'bg-[#f43f5e]', fg: 'text-white' },
    yellow:    { bg: 'bg-[#eab408]', fg: 'text-white' },
    purple:    { bg: 'bg-[#a855f7]', fg: 'text-white' },
  }
  return map[props.accent]
})
</script>

<template>
  <!-- Title-only variant (used by "Données RSE" first column) -->
  <div
    v-if="titleOnly"
    class="flex flex-col gap-[4px] justify-center h-full"
  >
    <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
      {{ value }}
    </p>
    <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
      {{ label }}
    </p>
  </div>

  <!-- Default variant: icon + value + label + optional link -->
  <div v-else class="flex flex-col gap-[8px] min-w-0">
    <div
      v-if="icon"
      :class="['flex items-center justify-center w-[37px] h-[37px] rounded-[12px]', iconTheme.bg]"
    >
      <Icon :name="icon" variant="solid" :size="24" :class="iconTheme.fg" />
    </div>
    <div class="flex flex-col min-w-0">
      <p class="font-sans font-semibold text-[24px] leading-[1.5] tracking-[-0.72px] text-text-neutral truncate">
        {{ value }}
      </p>
      <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
        {{ label }}
      </p>
    </div>
    <a
      v-if="link"
      href="#"
      class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-brand-medium hover:text-text-brand-deep transition-colors duration-150 ease-out w-fit"
    >
      {{ link }}
    </a>
  </div>
</template>
