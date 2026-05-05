<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

export interface HorizontalTab {
  id: string
  label: string
  count?: number
}

type Variant = 'pill' | 'underline'

interface Props {
  tabs: HorizontalTab[]
  modelValue: string
  /** "pill" = segmented dark control (default). "underline" = brand-colored underline under the active label. */
  variant?: Variant
}
const props = withDefaults(defineProps<Props>(), { variant: 'pill' })
const emit = defineEmits<{
  'update:modelValue': [id: string]
}>()

const itemRefs = ref<Record<string, HTMLButtonElement>>({})
const pillLeft = ref(0)
const pillWidth = ref(0)
const pillVisible = ref(false)
const pillAnimated = ref(false)

const setItemRef = (id: string) => (el: unknown) => {
  if (el) itemRefs.value[id] = el as HTMLButtonElement
  else delete itemRefs.value[id]
}

const updatePill = async () => {
  await nextTick()
  const el = itemRefs.value[props.modelValue]
  if (!el) {
    pillVisible.value = false
    return
  }
  pillLeft.value = el.offsetLeft
  pillWidth.value = el.offsetWidth
  pillVisible.value = true
}

watch(() => props.modelValue, updatePill)
watch(() => props.tabs, updatePill, { deep: true })

onMounted(async () => {
  await updatePill()
  requestAnimationFrame(() => {
    pillAnimated.value = true
  })
})
</script>

<template>
  <!-- Single-root wrapper. When a #panel slot is supplied, tabs nav and panel
       sit as siblings inside this wrapper so external `class` (max-width, etc.)
       applies cleanly to the whole component. Internal flex-col + gap-[40px]
       gives canonical spacing between tabs and content. -->
  <div :class="['flex flex-col items-stretch w-full', $slots.panel ? 'gap-[40px]' : '']">

  <!-- Pill variant — dark segmented control with sliding white pill -->
  <div v-if="variant === 'pill'" class="bg-neutral-tertiary flex p-[4px] rounded-[8px] w-fit">
    <div class="relative flex gap-[4px] items-center">
      <div
        class="pointer-events-none absolute top-0 left-0 h-full bg-neutral rounded-[6px] shadow-sm"
        :style="{
          width: `${pillWidth}px`,
          transform: `translateX(${pillLeft}px)`,
          opacity: pillVisible ? 1 : 0,
          transition: pillAnimated
            ? 'transform 220ms cubic-bezier(0.77, 0, 0.175, 1), width 220ms cubic-bezier(0.77, 0, 0.175, 1), opacity 150ms ease'
            : 'opacity 150ms ease',
        }"
        aria-hidden="true"
      />

      <button
        v-for="tab in tabs"
        :key="tab.id"
        :ref="setItemRef(tab.id)"
        type="button"
        :class="[
          'relative z-[1] flex items-center justify-center gap-[8px] px-[12px] py-[8px] rounded-[6px] outline-none',
          'font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] whitespace-nowrap',
          'transition-[color,transform] duration-200 ease-out active:scale-[0.97]',
          tab.id === modelValue ? 'text-text-neutral' : 'text-text-neutral-secondary hover:text-text-neutral',
        ]"
        @click="emit('update:modelValue', tab.id)"
      >
        {{ tab.label }}
        <span
          v-if="tab.count !== undefined"
          :class="[
            'flex items-center justify-center px-[8px] py-[2px] rounded-[16px] border font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] tabular-nums transition-colors duration-200 ease-out',
            tab.id === modelValue
              ? 'bg-brand-surface border-border-brand-medium text-text-brand-medium'
              : 'bg-neutral-secondary border-border-neutral-secondary text-text-neutral-secondary',
          ]"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>
  </div>

  <!-- Underline variant — text-only with a sliding brand underline anchored to the bottom border -->
  <div v-else class="relative w-full border-b border-border-neutral-secondary">
    <div class="relative flex gap-[8px] items-center">
      <div
        class="pointer-events-none absolute bottom-[-1px] left-0 h-[2px] bg-brand rounded-full"
        :style="{
          width: `${pillWidth}px`,
          transform: `translateX(${pillLeft}px)`,
          opacity: pillVisible ? 1 : 0,
          transition: pillAnimated
            ? 'transform 220ms cubic-bezier(0.77, 0, 0.175, 1), width 220ms cubic-bezier(0.77, 0, 0.175, 1), opacity 150ms ease'
            : 'opacity 150ms ease',
        }"
        aria-hidden="true"
      />

      <button
        v-for="tab in tabs"
        :key="tab.id"
        :ref="setItemRef(tab.id)"
        type="button"
        :class="[
          'relative z-[1] flex items-center justify-center gap-[8px] px-[4px] py-[10px] outline-none',
          'font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] whitespace-nowrap',
          'transition-colors duration-200 ease-out',
          tab.id === modelValue ? 'text-text-brand-medium' : 'text-text-neutral-secondary hover:text-text-neutral',
        ]"
        @click="emit('update:modelValue', tab.id)"
      >
        {{ tab.label }}
        <span
          v-if="tab.count !== undefined"
          :class="[
            'flex items-center justify-center px-[8px] py-[2px] rounded-[16px] border font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] tabular-nums transition-colors duration-200 ease-out',
            tab.id === modelValue
              ? 'bg-brand-surface border-border-brand-medium text-text-brand-medium'
              : 'bg-neutral-secondary border-border-neutral-secondary text-text-neutral-secondary',
          ]"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>
  </div>

  <!-- Optional panel slot — when provided, content is wrapped in a cross-fade Transition
       keyed on the active tab. Uses the global .tab-fade-* classes (see main.css). -->
  <Transition
    v-if="$slots.panel"
    mode="out-in"
    name="tab-fade"
  >
    <div :key="modelValue" class="w-full">
      <slot name="panel" :active-tab="modelValue" />
    </div>
  </Transition>

  </div>
</template>
