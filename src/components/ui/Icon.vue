<script setup lang="ts">
import { computed } from 'vue'
import { figmaIcons } from '../../icons/figma'

interface Props {
  name: string
  variant?: 'outline' | 'solid'
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'outline',
  size: 20,
})

const figmaIcon = computed(() => {
  const icon = figmaIcons[props.name]
  if (!icon) return null
  return icon[props.variant] ?? icon.outline ?? null
})
</script>

<template>
  <!-- Figma icon -->
  <svg
    v-if="figmaIcon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    v-html="figmaIcon"
  />

  <!-- Fallback: placeholder -->
  <svg
    v-else
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/>
    <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</template>
