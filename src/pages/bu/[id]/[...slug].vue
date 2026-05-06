<script setup lang="ts">
// Catchall for BU sub-pages that don't have a dedicated route yet
// (bu-shop, bu-orders, bu-vehicles, …). Falls through to the BuHome content,
// matching the legacy AppShell behaviour where any bu-* activeId rendered BuHome.
import BuHome from './home.vue'
</script>

<template>
  <BuHome />
</template>
