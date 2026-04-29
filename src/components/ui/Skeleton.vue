<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** CSS width — e.g. `100%`, `120px`, `8rem`. */
  width?: string
  /** CSS height — e.g. `16px`, `2rem`. Defaults to a text-line height. */
  height?: string
  /** Border radius — accepts any CSS value. Defaults to 8px (radius-md). */
  rounded?: string
  /** Circle shape overrides rounded. */
  circle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '16px',
  rounded: '8px',
  circle: false,
})

const style = computed(() => ({
  width: props.width,
  height: props.circle ? props.width : props.height,
  borderRadius: props.circle ? '9999px' : props.rounded,
}))
</script>

<template>
  <span
    :style="style"
    aria-hidden="true"
    class="skeleton block shrink-0"
  />
</template>

<style scoped>
/* Token: Surface/Neutral/Disable (#f1f5f9) → bg-neutral-tertiary.
   Highlight sweeps across at ~50% with a soft white so the shimmer reads on
   light backgrounds without flashing. */
.skeleton {
  background-color: var(--bg-neutral-tertiary);
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
  background-repeat: no-repeat;
  background-position: -150% 0;
  animation: skeleton-shimmer 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes skeleton-shimmer {
  0%   { background-position: -150% 0; }
  100% { background-position:  150% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; }
}
</style>
