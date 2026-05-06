<script setup lang="ts">
// /bu/[id] → /bu/[id]/home (BU pages always land on home).
const route = useRoute()
await navigateTo(`/bu/${route.params.id}/home`, { replace: true })
</script>

<template>
  <div />
</template>
