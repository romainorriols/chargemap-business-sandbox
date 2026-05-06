<script setup lang="ts">
import { computed } from 'vue'
type ButtonType = 'primary' | 'secondary' | 'tertiaryColor' | 'tertiaryGray' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'
type ButtonState = 'default' | 'hover' | 'focus' | 'loading' | 'disabled'

interface Props {
  type?: ButtonType
  size?: ButtonSize
  state?: ButtonState
  destructive?: boolean
  iconOnly?: boolean
  loading?: boolean
  disabled?: boolean
  label?: string
  iconLeft?: string
  iconRight?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'md',
  state: 'default',
  destructive: false,
  iconOnly: false,
  loading: false,
  disabled: false,
  label: 'Button',
  iconLeft: '',
  iconRight: '',
})

const isDisabled = computed(() => props.disabled || props.state === 'disabled')
const isLoading = computed(() => props.loading || props.state === 'loading')
const isFocused = computed(() => props.state === 'focus')
const isDestructive = computed(() => props.destructive || props.type === 'destructive')

// Figma exact values:
// Sm:  py-[8px]  px-[12px] gap-[8px] text-[14px] → padding-based height ~37px
// Md:  py-[8px]  px-[16px] gap-[8px] text-[16px] min-h-[44px]
// Lg:  py-[12px] px-[20px] gap-[8px] text-[16px] → padding-based height ~48px
const sizeClasses = computed(() => {
  if (props.iconOnly) {
    return {
      sm: 'h-9 w-9',    // 36×36px
      md: 'h-11 w-11',  // 44×44px
      lg: 'h-12 w-12',  // 48×48px
    }[props.size]
  }
  return {
    sm: 'py-2 px-3 gap-2 text-sm tracking-[-0.03em]',
    md: 'min-h-[44px] py-2 px-4 gap-2 text-base tracking-[-0.03em]',
    lg: 'py-3 px-5 gap-2 text-base tracking-[-0.03em]',
  }[props.size]
})

const variantClasses = computed(() => {
  if (isDisabled.value) {
    return {
      primary:      'bg-neutral-disabled text-text-neutral-disabled cursor-not-allowed',
      secondary:    'bg-transparent border border-neutral-disabled text-text-neutral-disabled cursor-not-allowed',
      tertiaryColor:'bg-transparent text-text-neutral-disabled cursor-not-allowed',
      tertiaryGray: 'bg-transparent text-text-neutral-disabled cursor-not-allowed',
      destructive:  'bg-neutral-disabled text-text-neutral-disabled cursor-not-allowed',
    }[props.type]
  }

  const focusRingBrand = isFocused.value ? 'shadow-ring-brand' : ''
  const focusRingGray  = isFocused.value ? 'shadow-ring-gray'  : ''
  const focusRingError = isFocused.value ? 'shadow-ring-error' : ''

  if (isDestructive.value && props.type !== 'destructive') {
    const map: Record<string, string> = {
      primary:      `bg-danger text-white hover:bg-danger-hover active:scale-[0.97] focus:shadow-ring-error ${focusRingError}`,
      secondary:    `bg-transparent border border-border-danger-medium text-text-danger-medium hover:bg-danger-surface active:scale-[0.97] focus:shadow-ring-error ${focusRingError}`,
      tertiaryColor:`bg-transparent text-text-danger-medium hover:bg-danger-surface active:scale-[0.97] focus:shadow-ring-error ${focusRingError}`,
      tertiaryGray: `bg-transparent text-text-danger-medium hover:bg-danger-surface active:scale-[0.97] focus:shadow-ring-error ${focusRingError}`,
      destructive:  `bg-danger text-white hover:bg-danger-hover active:scale-[0.97] focus:shadow-ring-error ${focusRingError}`,
    }
    return map[props.type]
  }

  return {
    primary:      `bg-brand text-white hover:bg-brand-hover active:scale-[0.97] focus:shadow-ring-brand ${focusRingBrand}`,
    secondary:    `bg-transparent border border-border-neutral text-text-neutral hover:bg-neutral-secondary active:scale-[0.97] focus:shadow-ring-gray ${focusRingGray}`,
    tertiaryColor:`bg-transparent text-text-brand-medium hover:bg-brand-surface active:scale-[0.97] focus:shadow-ring-brand ${focusRingBrand}`,
    tertiaryGray: `bg-transparent text-text-neutral-secondary hover:bg-neutral-secondary active:scale-[0.97] focus:shadow-ring-gray ${focusRingGray}`,
    destructive:  `bg-danger text-white hover:bg-danger-hover active:scale-[0.97] focus:shadow-ring-error ${focusRingError}`,
  }[props.type]
})

// Figma icon sizes: Sm/Md = 20px, Lg = 24px
const iconSize = computed(() => props.size === 'lg' ? 'w-6 h-6' : 'w-5 h-5')
</script>

<template>
  <button
    :disabled="isDisabled || isLoading"
    :class="[
      'inline-flex items-center justify-center font-medium font-sans rounded-md',
      'transition-all duration-150',
      'focus:outline-none focus-visible:outline-none',
      sizeClasses,
      variantClasses,
    ]"
  >
    <template v-if="isLoading">
      <Icon :name="'spinning-loader-ring'" :size="iconSize === 'w-6 h-6' ? 24 : 20" :class="['animate-spin', iconSize]" />
      <span v-if="!iconOnly">{{ label }}</span>
    </template>

    <template v-else>
      <slot name="icon-left">
        <Icon v-if="iconLeft" :name="iconLeft" :size="iconSize === 'w-6 h-6' ? 24 : 20" />
      </slot>
      <span v-if="!iconOnly">{{ label }}</span>
      <slot name="icon-right">
        <Icon v-if="iconRight" :name="iconRight" :size="iconSize === 'w-6 h-6' ? 24 : 20" />
      </slot>
    </template>
  </button>
</template>
