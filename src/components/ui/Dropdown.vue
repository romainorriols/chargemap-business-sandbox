<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { DropdownItem } from './DropdownMenu.vue'
type Size = 'sm' | 'md'
type InputType = 'default' | 'leadingIcon' | 'country'
type MenuType = 'default' | 'leadingIcon' | 'multiselect' | 'country'

interface Props {
  modelValue?: string | string[]
  size?: Size
  inputType?: InputType
  menuType?: MenuType
  label?: string
  showLabel?: boolean
  placeholder?: string
  hint?: string
  showHint?: boolean
  badge?: string
  icon?: string
  items?: DropdownItem[]
  searchable?: boolean
  footer?: boolean
  searchPlaceholder?: string
  destructive?: boolean
  disabled?: boolean
  optionnel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  size: 'md',
  inputType: 'default',
  menuType: 'default',
  label: '',
  showLabel: true,
  placeholder: 'Select an option',
  hint: '',
  showHint: true,
  badge: '',
  icon: '',
  items: () => [],
  searchable: true,
  footer: false,
  searchPlaceholder: 'Rechercher',
  destructive: false,
  disabled: false,
  optionnel: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  confirm: []
  cancel: []
}>()

const isOpen = ref(false)
const container = ref<HTMLElement | null>(null)

const displayValue = computed(() => {
  if (Array.isArray(props.modelValue)) {
    if (props.modelValue.length === 0) return ''
    const labels = props.modelValue.map(v =>
      props.items.find(i => i.value === v)?.label ?? v
    )
    return labels.join(', ')
  }
  return props.items.find(i => i.value === props.modelValue)?.label ?? props.modelValue ?? ''
})

const toggle = () => {
  if (!props.disabled) isOpen.value = !isOpen.value
}

const onSelect = (value: string | string[]) => {
  emit('update:modelValue', value)
  if (props.menuType !== 'multiselect') isOpen.value = false
}

const onCancel = () => {
  isOpen.value = false
  emit('cancel')
}

const onConfirm = () => {
  isOpen.value = false
  emit('confirm')
}

const onClickOutside = (e: MouseEvent) => {
  if (container.value && !container.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div ref="container" class="relative w-full">

    <DropdownInput
      :model-value="displayValue"
      :size="size"
      :type="inputType"
      :label="label"
      :show-label="showLabel"
      :placeholder="placeholder"
      :hint="hint"
      :show-hint="showHint"
      :badge="badge"
      :icon="icon"
      :open="isOpen"
      :focused="isOpen && !searchable"
      :destructive="destructive"
      :disabled="disabled"
      :optionnel="optionnel"
      @click="toggle"
    >
      <template v-if="inputType === 'country'" #flag>
        <slot name="flag" />
      </template>
    </DropdownInput>

    <Transition
      enter-active-class="transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-opacity motion-reduce:duration-150"
      enter-from-class="opacity-0 scale-[0.96] motion-reduce:scale-100"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-opacity motion-reduce:duration-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-[0.96] motion-reduce:scale-100"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 top-full mt-1 left-0 right-0 origin-top will-change-[opacity,transform]"
      >
        <DropdownMenu
          :size="size"
          :type="menuType"
          :items="items"
          :model-value="modelValue"
          :searchable="searchable"
          :footer="footer"
          :search-placeholder="searchPlaceholder"
          @update:model-value="onSelect"
          @cancel="onCancel"
          @confirm="onConfirm"
        />
      </div>
    </Transition>

  </div>
</template>
