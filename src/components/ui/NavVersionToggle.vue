<script setup lang="ts">
interface Props {
  /** true = V2 (white nav), false = V1 (blue nav) */
  modelValue: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <div
    class="fixed bottom-[16px] right-[16px] z-50 flex items-center gap-[12px] p-[16px] bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)]"
  >
    <span class="font-sans font-medium text-[20px] leading-[1.5] tracking-[-0.6px] text-text-neutral whitespace-nowrap">
      Nav V2
    </span>
    <Toggle
      :model-value="modelValue"
      size="md"
      aria-label="Basculer entre la nav V1 (bleu) et la nav V2 (blanc)"
      @update:model-value="value => emit('update:modelValue', value)"
    />
  </div>
</template>
