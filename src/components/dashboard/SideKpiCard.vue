<script setup lang="ts">
interface Props {
  label: string
  value: string
  /** Indicator bar color (CSS value, e.g. '#22bcff'). */
  color: string
  /** Card height in px. */
  height?: number
}
withDefaults(defineProps<Props>(), {
  height: 93,
})
</script>

<template>
  <div
    class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm w-full flex flex-col gap-[16px] p-[16px] overflow-hidden"
    :style="{ height: `${height}px` }"
  >
    <div class="flex gap-[8px] items-center w-full">
      <div
        class="w-[3px] h-[21px] rounded-full shrink-0"
        :style="{ backgroundColor: color }"
      />
      <p class="flex-1 min-w-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
        {{ label }}
      </p>
    </div>
    <p class="font-sans font-semibold text-[24px] leading-[1.5] tracking-[-0.72px] text-text-neutral whitespace-nowrap">
      {{ value }}
    </p>
  </div>
</template>
