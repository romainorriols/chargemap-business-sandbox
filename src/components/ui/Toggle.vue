<script setup lang="ts">
import { computed } from 'vue'

type ToggleSize = 'sm' | 'md'

interface Props {
  modelValue: boolean
  size?: ToggleSize
  disabled?: boolean
  /** Accessible label — required when no visible label sits next to the toggle. */
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  disabled: false,
  ariaLabel: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  change: [value: boolean]
}>()

// Figma 10985-924 track/thumb dims. Travel = track width − 2px padding × 2 − thumb.
const dims = computed(() =>
  props.size === 'sm'
    ? { w: 36, h: 20, thumb: 16, travel: 16 }
    : { w: 44, h: 24, thumb: 20, travel: 20 },
)

const toggle = () => {
  if (props.disabled) return
  const next = !props.modelValue
  emit('update:modelValue', next)
  emit('change', next)
}

const trackBg = computed(() => {
  if (props.disabled) return 'var(--bg-neutral-disabled)'
  return props.modelValue ? 'var(--bg-brand)' : 'var(--bg-neutral-tertiary)'
})
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="ariaLabel || undefined"
    :disabled="disabled"
    :class="[
      'relative shrink-0 inline-flex items-center rounded-[12px] p-[2px] outline-none',
      'transition-[background-color,box-shadow] duration-200 ease-out motion-reduce:transition-none',
      'focus-visible:shadow-ring-gray aria-checked:focus-visible:shadow-ring-brand',
      disabled ? 'cursor-not-allowed' : 'cursor-pointer',
    ]"
    :style="{
      width: `${dims.w}px`,
      height: `${dims.h}px`,
      backgroundColor: trackBg,
    }"
    @click="toggle"
  >
    <span
      class="block rounded-full bg-white shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_0_rgba(0,0,0,0.1)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none will-change-transform"
      :style="{
        width: `${dims.thumb}px`,
        height: `${dims.thumb}px`,
        transform: modelValue ? `translateX(${dims.travel}px)` : 'translateX(0)',
      }"
    />
  </button>
</template>
