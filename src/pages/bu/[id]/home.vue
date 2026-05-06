<script setup lang="ts">
import { computed } from 'vue'

const busStore = useBusStore()
const currentBu = computed(() => busStore.bus.find(b => b.id === busStore.selectedBuId) ?? null)
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full p-[24px] text-center">
    <h1 :class="['mb-[8px]', V1_PAGE_HEADING]">
      {{ currentBu?.name ?? 'Business unit' }}
    </h1>
    <p class="font-sans text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary max-w-[440px]">
      Les pages au niveau business unit arrivent bientôt.
    </p>
  </div>
</template>
