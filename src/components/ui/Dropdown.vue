<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
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
  // Opt-in: render the menu inside <body> instead of in-place. Use this
  // when the dropdown lives inside an `overflow-hidden` parent that would
  // otherwise clip the menu (e.g. cards with internal scroll). Position
  // is recomputed on scroll/resize while the menu is open.
  teleport?: boolean
  menuMaxHeight?: number // px, defaults to the menu's 360px
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
  teleport: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  confirm: []
  cancel: []
}>()

const isOpen = ref(false)
const container = ref<HTMLElement | null>(null)
const menuEl = ref<HTMLElement | null>(null)

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

// Teleported menu uses `position: fixed` so it must be re-positioned manually
// (top/left/width derived from the trigger's bounding rect). Captured below.
const menuPos = ref<{ top: number; bottom: number; left: number; width: number }>({ top: 0, bottom: 0, left: 0, width: 0 })

// Open upward when the menu (max 360px, see DropdownMenu) doesn't fit below the
// trigger and there is more room above — e.g. a dropdown at the bottom of a page.
const MENU_MAX_HEIGHT = 360 + 8
const openUpward = ref(false)
function updateDirection() {
  if (!container.value) return
  const r = container.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - r.bottom
  openUpward.value = spaceBelow < MENU_MAX_HEIGHT && r.top > spaceBelow
}

function updateMenuPos() {
  if (!container.value) return
  const r = container.value.getBoundingClientRect()
  menuPos.value = { top: r.bottom + 4, bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width }
}

const menuStyle = computed(() => {
  if (!props.teleport) return undefined
  const { top, bottom, left, width } = menuPos.value
  return openUpward.value
    ? { bottom: `${bottom}px`, left: `${left}px`, width: `${width}px` }
    : { top: `${top}px`, left: `${left}px`, width: `${width}px` }
})

const toggle = () => {
  if (props.disabled) return
  if (!isOpen.value) {
    updateDirection()
    if (props.teleport) updateMenuPos()
  }
  isOpen.value = !isOpen.value
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
  const target = e.target as Node
  const inContainer = container.value?.contains(target)
  // When teleported the menu lives outside `container`, so we also have to
  // exempt it explicitly from "outside" — otherwise picking an item closes
  // the dropdown before the click reaches the option handler.
  const inMenu = menuEl.value?.contains(target)
  if (!inContainer && !inMenu) isOpen.value = false
}

watch(isOpen, (open) => {
  if (!props.teleport) return
  if (open) {
    // Recompute on the next frame in case the trigger just shifted (e.g. a
    // sibling layout change happened in the same tick as the toggle).
    nextTick(updateMenuPos)
    window.addEventListener('scroll', updateMenuPos, true)
    window.addEventListener('resize', updateMenuPos)
  } else {
    window.removeEventListener('scroll', updateMenuPos, true)
    window.removeEventListener('resize', updateMenuPos)
  }
})

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
  window.removeEventListener('scroll', updateMenuPos, true)
  window.removeEventListener('resize', updateMenuPos)
})
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

    <Teleport to="body" :disabled="!teleport">
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
          ref="menuEl"
          :class="[
            'will-change-[opacity,transform]',
            openUpward ? 'origin-bottom' : 'origin-top',
            // Teleported menus sit above modals (z-70) so they also work inside one
            teleport ? 'fixed z-[80]' : ['z-50 absolute left-0 right-0', openUpward ? 'bottom-full mb-1' : 'top-full mt-1'],
          ]"
          :style="menuStyle"
        >
          <DropdownMenu
            :size="size"
            :type="menuType"
            :items="items"
            :model-value="modelValue"
            :searchable="searchable"
            :footer="footer"
            :search-placeholder="searchPlaceholder"
            :max-height="menuMaxHeight"
            @update:model-value="onSelect"
            @cancel="onCancel"
            @confirm="onConfirm"
          />
        </div>
      </Transition>
    </Teleport>

  </div>
</template>
