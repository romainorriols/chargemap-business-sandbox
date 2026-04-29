<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'

type Size = 'sm' | 'md'
type Type = 'default' | 'leadingIcon' | 'country'

interface Props {
  modelValue?: string
  size?: Size
  type?: Type
  label?: string
  showLabel?: boolean
  placeholder?: string
  hint?: string
  showHint?: boolean
  badge?: string
  icon?: string
  open?: boolean
  /** Keep the focus ring on the trigger even when `open` (e.g. menu has no search input that would steal focus). */
  focused?: boolean
  destructive?: boolean
  disabled?: boolean
  optionnel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  size: 'md',
  type: 'default',
  label: '',
  showLabel: true,
  placeholder: 'Select an option',
  hint: '',
  showHint: true,
  badge: '',
  icon: '',
  open: false,
  focused: false,
  destructive: false,
  disabled: false,
  optionnel: false,
})

const emit = defineEmits<{ click: [] }>()

const triggerClasses = computed(() => [
  'flex w-full items-center justify-between rounded-md border bg-neutral transition-all duration-150 overflow-hidden outline-none focus:outline-none focus-visible:outline-none',
  props.size === 'md' ? 'h-11 px-3 gap-2' : 'px-3 py-2 gap-2',
  props.disabled
    ? 'bg-neutral-disabled border-neutral-disabled cursor-not-allowed shadow-sm'
    : props.destructive
      ? props.focused
        ? 'border-danger shadow-ring-danger'
        : 'border-danger shadow-sm focus-visible:shadow-ring-danger'
      : props.open
        ? props.focused
          ? 'border-brand shadow-ring-brand'
          : 'border-border-neutral-secondary shadow-sm'
        : 'border-border-neutral-secondary hover:border-border-neutral shadow-sm focus-visible:border-brand focus-visible:shadow-ring-brand cursor-pointer',
])

const textClasses = computed(() => [
  'font-sans leading-[1.5] tracking-[-0.03em] truncate',
  props.size === 'md' ? 'text-base' : 'text-sm',
  props.disabled
    ? 'text-text-neutral-disabled'
    : props.modelValue
      ? 'text-text-neutral'
      : 'text-text-neutral-secondary',
])

const hintClasses = computed(() => [
  'text-sm leading-[1.5] tracking-[-0.03em] font-sans',
  props.destructive ? 'text-text-danger-medium' : 'text-text-neutral-secondary',
])

const iconSize = computed(() => props.size === 'md' ? 20 : 18)
</script>

<template>
  <div class="flex flex-col gap-1 w-full">

    <!-- Label row -->
    <div v-if="label && showLabel" class="flex items-center gap-[6px]">
      <label class="flex-1 text-sm font-medium leading-[1.5] tracking-[-0.03em] text-text-neutral font-sans">
        {{ label }}
      </label>
      <span v-if="optionnel" class="text-xs leading-[1.5] tracking-[-0.03em] text-text-secondary font-sans">
        Optionnel
      </span>
    </div>

    <!-- Trigger button -->
    <button
      type="button"
      :class="triggerClasses"
      :disabled="disabled"
      @click="emit('click')"
    >
      <!-- Left: icon? + text + badge? -->
      <div class="flex items-center gap-2 min-w-0 flex-1">

        <!-- Leading icon -->
        <Icon
          v-if="type === 'leadingIcon' && icon"
          :name="icon"
          :size="iconSize"
          class="shrink-0 text-icon-neutral-secondary"
        />

        <!-- Country flag slot -->
        <slot v-if="type === 'country'" name="flag" />

        <!-- Display text -->
        <span :class="textClasses">{{ modelValue || placeholder }}</span>

        <!-- Badge -->
        <span
          v-if="badge"
          class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border border-border-neutral-secondary bg-neutral-secondary text-text-neutral-secondary text-xs font-medium font-sans leading-[1.5] tracking-[-0.03em] whitespace-nowrap"
        >
          {{ badge }}
        </span>
      </div>

      <!-- Chevron -->
      <Icon
        name="chevron-down"
        :size="iconSize"
        class="shrink-0 text-icon-neutral-secondary transition-transform duration-150"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <!-- Hint -->
    <p v-if="hint && showHint" :class="hintClasses">{{ hint }}</p>

  </div>
</template>
