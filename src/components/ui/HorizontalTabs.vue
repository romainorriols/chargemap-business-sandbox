<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

export interface HorizontalTab {
  id: string
  label: string
}

type Variant = 'pill' | 'underline'

interface Props {
  tabs: HorizontalTab[]
  modelValue: string
  variant?: Variant
}
const props = withDefaults(defineProps<Props>(), {
  variant: 'pill',
})
const emit = defineEmits<{
  'update:modelValue': [id: string]
}>()

// Sliding indicator state — reused by both variants (pill background and
// underline bar share the same offsetLeft / offsetWidth tracking).
const itemRefs = ref<Record<string, HTMLButtonElement>>({})
const indicatorLeft = ref(0)
const indicatorWidth = ref(0)
const indicatorVisible = ref(false)
const indicatorAnimated = ref(false)

const setItemRef = (id: string) => (el: unknown) => {
  if (el) itemRefs.value[id] = el as HTMLButtonElement
  else delete itemRefs.value[id]
}

const updateIndicator = async () => {
  await nextTick()
  const el = itemRefs.value[props.modelValue]
  if (!el) {
    indicatorVisible.value = false
    return
  }
  indicatorLeft.value = el.offsetLeft
  indicatorWidth.value = el.offsetWidth
  indicatorVisible.value = true
}

watch(() => props.modelValue, updateIndicator)
watch(() => props.tabs, updateIndicator, { deep: true })
watch(() => props.variant, updateIndicator)

onMounted(async () => {
  await updateIndicator()
  requestAnimationFrame(() => {
    indicatorAnimated.value = true
  })
})
</script>

<template>
  <div :class="['flex flex-col items-stretch w-full', $slots.panel ? 'gap-[40px]' : '']">

    <!-- Pill variant — segmented control with sliding white pill. -->
    <div v-if="variant === 'pill'" class="bg-neutral-secondary flex p-[4px] rounded-[10px] w-fit">
      <div class="relative flex gap-[4px] items-center">
        <div
          class="pointer-events-none absolute top-0 left-0 h-full bg-neutral rounded-[6px] shadow-sm"
          :style="{
            width: `${indicatorWidth}px`,
            transform: `translateX(${indicatorLeft}px)`,
            opacity: indicatorVisible ? 1 : 0,
            transition: indicatorAnimated
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
            'relative z-[1] flex items-center justify-center px-[12px] py-[8px] rounded-[6px] outline-none',
            'font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] whitespace-nowrap',
            'transition-[color,transform] duration-200 ease-out active:scale-[0.97]',
            tab.id === modelValue
              ? 'text-text-neutral'
              : 'text-text-neutral-secondary hover:text-text-neutral',
          ]"
          @click="emit('update:modelValue', tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Underline variant — page-level tabs with a 2px brand bar that slides
         under the active tab. Used on Facturation, Settings, etc. -->
    <div
      v-else
      class="relative flex items-end gap-[12px] border-b border-border-neutral-secondary"
      role="tablist"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :ref="setItemRef(tab.id)"
        type="button"
        role="tab"
        :aria-selected="tab.id === modelValue"
        :class="[
          'relative pb-[8px] px-[4px] outline-none rounded-[4px] focus-visible:shadow-ring-gray',
          'font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] whitespace-nowrap',
          'transition-colors duration-150 ease-out active:scale-[0.98]',
          tab.id === modelValue
            ? 'text-text-brand-medium'
            : 'text-text-neutral-secondary hover:text-text-neutral',
        ]"
        @click="emit('update:modelValue', tab.id)"
      >
        {{ tab.label }}
      </button>
      <span
        class="pointer-events-none absolute -bottom-[1px] left-0 h-[2px] bg-brand rounded-[1px]"
        :style="{
          width: `${indicatorWidth}px`,
          transform: `translateX(${indicatorLeft}px)`,
          opacity: indicatorVisible ? 1 : 0,
          transition: indicatorAnimated
            ? 'transform 220ms cubic-bezier(0.77, 0, 0.175, 1), width 220ms cubic-bezier(0.77, 0, 0.175, 1), opacity 150ms ease'
            : 'opacity 150ms ease',
        }"
        aria-hidden="true"
      />
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
