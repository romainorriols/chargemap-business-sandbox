<script setup lang="ts">
// Labelled checkbox (same 16px box recipe as the billing table selection)
const { modelValue, label } = defineProps<{ modelValue: boolean; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="modelValue"
    class="group flex items-center gap-[8px] text-left outline-none rounded-[4px] focus-visible:shadow-ring-brand"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span
      :class="[
        'flex items-center justify-center shrink-0 size-[16px] rounded-[4px] border transition-colors duration-150 ease-out',
        modelValue ? 'bg-brand border-brand' : 'bg-neutral border-border-neutral group-hover:border-border-neutral',
      ]"
    >
      <Icon v-if="modelValue" name="check" variant="solid" :size="12" class="text-white" />
    </span>
    <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">{{ label }}</span>
  </button>
</template>
