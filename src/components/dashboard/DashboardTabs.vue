<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

export interface HorizontalTab {
  id: string
  label: string
}

interface Props {
  tabs: HorizontalTab[]
  modelValue: string
}
const props = defineProps<Props>()
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
  <div class="bg-neutral-secondary flex p-[4px] rounded-[10px] w-fit">
    <div class="relative flex gap-[4px] items-center">
      <!-- Sliding active-pill indicator -->
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
</template>
