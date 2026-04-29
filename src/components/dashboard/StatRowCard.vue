<script setup lang="ts">
/**
 * Horizontal row of stats inside a white card with vertical separators between columns.
 * Each slot child renders a column. Pure layout — wraps children with 24px padding,
 * even column distribution, and a vertical 1px separator between them.
 */
defineProps<{
  /** Card height in px (179 with action link, 150 without). */
  height?: number
}>()
</script>

<template>
  <div
    class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm w-full"
    :style="{ height: height ? `${height}px` : undefined }"
  >
    <div class="flex items-stretch h-full px-[24px] py-[24px] gap-[32px] [&>*]:flex-1 [&>*]:min-w-0 [&>*+*]:relative [&>*+*]:before:absolute [&>*+*]:before:content-[''] [&>*+*]:before:-left-[16px] [&>*+*]:before:top-0 [&>*+*]:before:bottom-0 [&>*+*]:before:w-px [&>*+*]:before:bg-border-neutral-secondary">
      <slot />
    </div>
  </div>
</template>
