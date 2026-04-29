<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Icon from '../ui/Icon.vue'

interface Props {
  title: string
  subtitle: string
  value: string
  unit: string
}
defineProps<Props>()

const menuOpen = ref(false)
const menuRoot = ref<HTMLElement | null>(null)

function toggleMenu(e: MouseEvent) {
  e.stopPropagation()
  menuOpen.value = !menuOpen.value
}

function onDocClick(e: MouseEvent) {
  if (!menuOpen.value) return
  if (menuRoot.value && !menuRoot.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}
function onEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') menuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onEsc)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onEsc)
})

function onExport() {
  menuOpen.value = false
  // Hook exporter les données here
}
</script>

<template>
  <div class="flex-1 min-w-0 bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[24px] flex flex-col gap-[24px]">
    <!-- Header -->
    <div class="flex flex-col gap-[16px] w-full">
      <div class="flex gap-[8px] items-center w-full">
        <div class="flex-1 min-w-0 h-[52px] relative">
          <Transition name="card-swap">
            <div :key="title" class="absolute inset-0 flex flex-col gap-[4px]">
              <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
                {{ title }}
              </p>
              <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
                {{ subtitle }}
              </p>
            </div>
          </Transition>
        </div>
        <slot name="tabs" />

        <!-- Options menu -->
        <div ref="menuRoot" class="relative">
          <button
            type="button"
            class="flex items-center justify-center w-[44px] h-[44px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.97] outline-none focus-visible:shadow-ring-gray"
            :class="{ 'bg-neutral-secondary text-icon-neutral-primary': menuOpen }"
            aria-label="Options"
            :aria-expanded="menuOpen"
            aria-haspopup="menu"
            @click="toggleMenu"
          >
            <Icon name="ellipsis-vertical" variant="solid" :size="20" />
          </button>

          <Transition name="dropdown">
            <div
              v-if="menuOpen"
              class="absolute top-[calc(100%+6px)] right-0 z-20 origin-top-right bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg py-[8px] min-w-[180px]"
              role="menu"
            >
              <div class="flex flex-col gap-[2px] items-stretch">
                <div class="px-[4px] py-[2px]">
                  <button
                    type="button"
                    role="menuitem"
                    class="w-full flex items-center gap-[8px] p-[8px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                    @click="onExport"
                  >
                    <Icon name="arrow-down-tray" variant="outline" :size="16" class="shrink-0 text-icon-neutral-secondary" />
                    <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                      Exporter les données
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
      <div class="h-[29px] w-full relative">
        <Transition name="card-swap">
          <div :key="`${value}${unit}`" class="absolute inset-0 flex gap-[3px] items-end">
            <p class="font-sans font-semibold text-[24px] leading-[1.2] tracking-[-0.72px] text-[#1d283a]">
              {{ value }}
            </p>
            <p class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-secondary">
              {{ unit }}
            </p>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Chart slot -->
    <div class="w-full">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* Modern tab-switch: leaving slides up+fades, entering slides up from below+fades.
   Both animate simultaneously (cross-fade) thanks to absolute positioning.
   Ease-out curve + transform/opacity only (GPU-accelerated). */
.card-swap-enter-active {
  transition:
    opacity 220ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
}
.card-swap-leave-active {
  transition:
    opacity 160ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.card-swap-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.card-swap-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Dropdown menu appearance: scale+fade from top-right anchor (Emil ease-out). */
.dropdown-enter-active {
  transition:
    opacity 180ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
}
.dropdown-leave-active {
  transition:
    opacity 120ms ease-out,
    transform 120ms ease-out;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .card-swap-enter-active,
  .card-swap-leave-active,
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: none;
  }
}
</style>
