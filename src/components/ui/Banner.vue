<script setup lang="ts">
import { computed } from 'vue'
type BannerType = 'brand' | 'info' | 'warning' | 'success'
type IconVariant = 'outline' | 'solid'

interface Props {
  type?: BannerType
  text?: string
  actionLabel?: string
  /** Show the action CTA on the right (or below in compact mode). */
  showAction?: boolean
  /** Compact (vertical) layout — text wraps, CTA sits below. Use when the container is narrow. */
  compact?: boolean
  /** Icon shown before the action label. Pass empty string to hide. */
  iconLeft?: string
  /** Icon shown after the action label. Pass empty string to hide. */
  iconRight?: string
  /** Heroicons variant for the action icons. */
  iconVariant?: IconVariant
}

const props = withDefaults(defineProps<Props>(), {
  type: 'brand',
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
  actionLabel: 'Button CTA',
  showAction: true,
  compact: false,
  iconLeft: 'arrow-circle-right',
  iconRight: 'arrow-circle-right',
  iconVariant: 'solid',
})

defineEmits<{
  action: []
}>()

interface TypeConfig {
  bgVar: string
  borderVar: string
  textVar: string
}

// Pull semantic colors from CSS variables so the brand swap (theme-partners)
// flows through automatically.
const typeConfig = computed<TypeConfig>(() => {
  switch (props.type) {
    case 'info':
      return {
        bgVar: 'var(--bg-accent-cyan)',
        borderVar: 'var(--border-accent-cyan)',
        textVar: 'var(--text-accent-cyan)',
      }
    case 'warning':
      return {
        bgVar: 'var(--bg-warning-surface)',
        borderVar: 'var(--border-warning-medium)',
        textVar: 'var(--text-warning-deep)',
      }
    case 'success':
      return {
        bgVar: 'var(--bg-success-surface)',
        borderVar: 'var(--border-success-medium)',
        textVar: 'var(--text-success-deep)',
      }
    case 'brand':
    default:
      return {
        bgVar: 'var(--bg-brand-surface)',
        borderVar: 'var(--border-brand-medium)',
        textVar: 'var(--text-brand-deep)',
      }
  }
})
</script>

<template>
  <div
    class="w-full flex items-center gap-[12px] px-[16px] py-[12px] rounded-[12px] border border-solid shadow-sm"
    :style="{
      backgroundColor: typeConfig.bgVar,
      borderColor: typeConfig.borderVar,
      color: typeConfig.textVar,
    }"
  >
    <div
      class="flex-1 min-w-0 flex gap-[16px] items-center justify-center"
      :class="compact ? 'flex-col' : ''"
    >
      <p
        class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-center"
        :class="compact ? 'w-full' : 'min-w-[216px]'"
      >
        {{ text }}
      </p>

      <button
        v-if="showAction"
        type="button"
        class="shrink-0 flex items-center justify-center gap-[8px] w-[121px] rounded-[8px] outline-none focus-visible:shadow-ring-gray transition-opacity duration-150 ease-out hover:opacity-80 active:scale-[0.97] motion-reduce:transition-none"
        @click="$emit('action')"
      >
        <Icon v-if="iconLeft" :name="iconLeft" :variant="iconVariant" :size="16" class="shrink-0" />
        <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] whitespace-nowrap">
          {{ actionLabel }}
        </span>
        <Icon v-if="iconRight" :name="iconRight" :variant="iconVariant" :size="16" class="shrink-0" />
      </button>
    </div>
  </div>
</template>
