<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
/**
 * Tokens from Figma MCP (node 10880:66149 / 10880:65780) — consumed via CSS vars
 * defined in src/assets/tokens.css and mapped in tailwind.config.js.
 *   Text sm/Regular:  Inter 400 14/1.5 -3%   → tracking-[-0.42px]
 *   Text sm/Medium:   Inter 500 14/1.5 -3%
 *   Text base/Medium: Inter 500 16/1.5 -3%   → tracking-[-0.48px]
 *   Text xs/Medium:   Inter 500 12/1.5 -3%   → tracking-[-0.36px]
 */

type Size = 'sm' | 'md'
type MenuType = 'default' | 'leadingIcon' | 'multiselect' | 'country'

export interface DropdownItem {
  value: string
  label: string
  icon?: string
  badge?: string
  flagUrl?: string
  disabled?: boolean
}

interface Props {
  size?: Size
  type?: MenuType
  items?: DropdownItem[]
  modelValue?: string | string[]
  searchable?: boolean
  footer?: boolean
  searchPlaceholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  type: 'default',
  items: () => [],
  modelValue: '',
  searchable: true,
  footer: false,
  searchPlaceholder: 'Rechercher',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  cancel: []
  confirm: []
}>()

const search = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  if (props.searchable) {
    nextTick(() => searchInput.value?.focus())
  }
})

const filteredItems = computed(() =>
  props.items.filter(item =>
    item.label.toLowerCase().includes(search.value.toLowerCase())
  )
)

const isSelected = (item: DropdownItem) => {
  if (Array.isArray(props.modelValue)) return props.modelValue.includes(item.value)
  return props.modelValue === item.value
}

const toggle = (item: DropdownItem) => {
  if (item.disabled) return
  if (props.type === 'multiselect') {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const idx = current.indexOf(item.value)
    if (idx >= 0) current.splice(idx, 1)
    else current.push(item.value)
    emit('update:modelValue', current)
  } else {
    emit('update:modelValue', item.value)
  }
}

const isMd = computed(() => props.size === 'md')
const iconSize = computed(() => (isMd.value ? 20 : 18))
const itemPad = computed(() => (isMd.value ? 'p-[12px]' : 'p-[8px]'))
const labelText = computed(() =>
  isMd.value
    ? 'font-medium text-[16px] tracking-[-0.48px]'
    : 'font-normal text-[14px] tracking-[-0.42px]'
)

const itemInnerClass = (item: DropdownItem) => {
  const base = 'flex flex-1 items-center min-w-0 transition-colors duration-100'
  const cursor = item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
  const hasLeading = props.type !== 'default'

  if (props.type === 'multiselect') {
    return [base, cursor, itemPad.value, 'gap-[8px] rounded-[8px]', !item.disabled && 'hover:bg-neutral-hover']
  }

  if (isSelected(item)) {
    const radius = !isMd.value && hasLeading ? 'rounded-[6px]' : 'rounded-[8px]'
    const between = !isMd.value ? 'justify-between' : ''
    return [base, cursor, itemPad.value, radius, between, 'bg-neutral-hover']
  }

  const gap = hasLeading ? 'gap-[8px]' : ''
  return [base, cursor, itemPad.value, gap, 'rounded-[8px]', !item.disabled && 'hover:bg-neutral-hover']
}
</script>

<template>
  <!-- Menu container -->
  <div
    class="bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] w-full max-h-[360px] flex flex-col overflow-hidden"
  >
    <!-- Search (sticky, non-scrollable) -->
    <div v-if="searchable" class="px-[12px] pt-[12px] pb-[4px] w-full shrink-0">
        <div
          :class="[
            'bg-neutral border border-border-neutral-secondary rounded-[8px] shadow-sm flex gap-[8px] items-center overflow-hidden px-[12px] w-full transition-all duration-150 focus-within:border-brand focus-within:shadow-ring-brand',
            isMd ? 'h-[44px]' : 'py-[8px]',
          ]"
        >
          <Icon
            name="magnifying-glass"
            :size="iconSize"
            variant="solid"
            class="shrink-0 text-icon-neutral-secondary"
          />
          <input
            ref="searchInput"
            v-model="search"
            :placeholder="searchPlaceholder"
            :class="[
              'flex-1 min-w-0 bg-transparent border-none outline-none font-sans font-normal leading-[1.5] text-text-neutral placeholder:text-text-neutral-secondary',
              isMd ? 'text-[16px] tracking-[-0.48px]' : 'text-[14px] tracking-[-0.42px]',
            ]"
          />
        </div>
      </div>

    <!-- Scrollable items area -->
    <div
      :class="[
        'flex-1 min-h-0 overflow-y-auto flex flex-col gap-[4px] w-full',
        searchable ? 'pb-[12px]' : 'py-[12px]',
      ]"
    >
      <!-- Items -->
      <template v-if="filteredItems.length > 0">
        <div
          v-for="item in filteredItems"
          :key="item.value"
          class="flex items-center px-[4px] py-[2px] w-full shrink-0"
        >
          <div :class="itemInnerClass(item)" @click="toggle(item)">
            <!-- ======================= MULTISELECT ======================= -->
            <template v-if="type === 'multiselect'">
              <button
                type="button"
                :class="[
                  'shrink-0 w-[16px] h-[16px] rounded-[4px] flex items-center justify-center transition-colors',
                  isSelected(item)
                    ? 'bg-brand p-[2px]'
                    : 'border border-border-neutral',
                  item.disabled && 'bg-neutral-disabled border-border-neutral cursor-not-allowed',
                ]"
              >
                <Icon v-if="isSelected(item)" name="check" :size="12" class="text-icon-neutral-inverse" />
              </button>
              <p
                :class="[
                  'flex-1 min-w-0 font-sans leading-[1.5]',
                  item.disabled ? 'text-text-neutral-disabled' : 'text-text-neutral',
                  labelText,
                ]"
              >
                {{ item.label }}
              </p>
              <div
                v-if="item.badge"
                class="shrink-0 bg-neutral-secondary border border-border-neutral-secondary flex items-center justify-center px-[8px] py-[2px] rounded-[16px]"
              >
                <p class="font-sans font-medium leading-[1.5] text-[12px] text-text-neutral-secondary tracking-[-0.36px] whitespace-nowrap">
                  {{ item.badge }}
                </p>
              </div>
            </template>

            <!-- ======================= NEUTRAL (not selected) ======================= -->
            <template v-else-if="!isSelected(item)">
              <Icon
                v-if="type === 'leadingIcon' && item.icon"
                :name="item.icon"
                :size="iconSize"
                class="shrink-0 text-icon-neutral-secondary"
              />
              <img
                v-if="type === 'country' && item.flagUrl"
                :src="item.flagUrl"
                :alt="item.label"
                class="shrink-0 w-[20px] h-[20px] rounded-full object-cover"
              />
              <p
                :class="[
                  'flex-1 min-w-0 font-sans leading-[1.5]',
                  item.disabled ? 'text-text-neutral-disabled' : 'text-text-neutral',
                  labelText,
                ]"
              >
                {{ item.label }}
              </p>
              <div
                v-if="item.badge"
                class="shrink-0 bg-neutral-secondary border border-border-neutral-secondary flex items-center justify-center px-[8px] py-[2px] rounded-[16px]"
              >
                <p class="font-sans font-medium leading-[1.5] text-[12px] text-text-neutral-secondary tracking-[-0.36px] whitespace-nowrap">
                  {{ item.badge }}
                </p>
              </div>
            </template>

            <!-- ======================= SELECTED ======================= -->
            <template v-else>
              <div
                :class="[
                  'flex gap-[8px] items-center min-w-0',
                  isMd ? 'flex-1' : 'shrink-0',
                ]"
              >
                <Icon
                  v-if="type === 'leadingIcon' && item.icon"
                  :name="item.icon"
                  :size="iconSize"
                  class="shrink-0 text-icon-neutral-secondary"
                />
                <img
                  v-if="type === 'country' && item.flagUrl"
                  :src="item.flagUrl"
                  :alt="item.label"
                  class="shrink-0 w-[20px] h-[20px] rounded-full object-cover"
                />
                <p
                  :class="[
                    'font-sans leading-[1.5] text-text-neutral shrink-0 whitespace-nowrap',
                    labelText,
                  ]"
                >
                  {{ item.label }}
                </p>
                <div
                  v-if="item.badge"
                  class="shrink-0 bg-neutral-secondary border border-border-neutral-secondary flex items-center justify-center px-[8px] py-[2px] rounded-[16px]"
                >
                  <p class="font-sans font-medium leading-[1.5] text-[12px] text-text-neutral-secondary tracking-[-0.36px] whitespace-nowrap">
                    {{ item.badge }}
                  </p>
                </div>
              </div>
              <div class="flex gap-[8px] items-center justify-end shrink-0">
                <Icon name="check" :size="20" class="text-icon-brand" />
              </div>
            </template>
          </div>
        </div>
      </template>

      <p
        v-else
        class="px-[12px] py-[8px] font-sans font-normal leading-[1.5] text-[14px] text-text-neutral-secondary tracking-[-0.42px]"
      >
        Aucun résultat
      </p>
    </div>

    <!-- Footer -->
    <div v-if="footer" class="flex gap-[8px] items-center p-[8px] w-full shrink-0">
      <Button
        type="secondary"
        size="sm"
        label="Annuler"
        class="flex-1 min-w-0"
        @click="emit('cancel')"
      />
      <Button
        type="primary"
        size="sm"
        label="Valider"
        class="flex-1 min-w-0"
        @click="emit('confirm')"
      />
    </div>
  </div>
</template>
