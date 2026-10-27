<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

// Modal shell for the vehicle pages (same recipe as the settings token modal):
// backdrop + centered card, banded header with title / subtitle / close, body slot, footer slot.
const { open, title, subtitle = '' } = defineProps<{ open: boolean; title: string; subtitle?: string }>()
const emit = defineEmits<{ close: [] }>()

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-[200ms] ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-[160ms] ease-in motion-reduce:transition-none"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]" aria-hidden="true" @click="emit('close')" />
    </Transition>

    <Transition
      enter-active-class="transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      enter-from-class="opacity-0 translate-y-[8px] scale-[0.97]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.4,0,1,1)] motion-reduce:transition-none"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-[6px] scale-[0.98]"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[70] flex items-center justify-center p-[16px] pointer-events-none"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div
          class="pointer-events-auto w-full max-w-[600px] bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-[0_20px_50px_-12px_rgba(15,23,41,0.18),0_8px_20px_-8px_rgba(15,23,41,0.12)] flex flex-col overflow-hidden"
          @click.stop
        >
          <div class="relative flex flex-col gap-[2px] px-[24px] py-[16px] pr-[64px] border-b border-border-neutral-secondary">
            <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">{{ title }}</p>
            <p v-if="subtitle" class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
              {{ subtitle }}
            </p>
            <button
              type="button"
              aria-label="Fermer"
              class="absolute top-[16px] right-[16px] flex items-center justify-center p-[8px] rounded-[8px] outline-none text-text-neutral-secondary transition-[background-color,color,transform] duration-150 ease-out hover:bg-neutral-secondary hover:text-text-neutral focus-visible:shadow-ring-gray active:scale-[0.95]"
              @click="emit('close')"
            >
              <Icon name="x-mark" variant="solid" :size="20" />
            </button>
          </div>

          <div class="px-[32px] py-[24px]">
            <slot />
          </div>

          <div class="flex items-center justify-end gap-[8px] px-[24px] py-[16px] border-t border-border-neutral-secondary">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
