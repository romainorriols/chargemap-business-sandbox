<script setup lang="ts">
import { computed } from 'vue'
interface Props {
  page: number
  pageCount: number
  rangeStart: number
  rangeEnd: number
  total: number
  // When `true`, drops the bg / top border / padding so the footer
  // can sit flush in a page-level row (e.g. the admin listing).
  flush?: boolean
}

const props = withDefaults(defineProps<Props>(), { flush: false })
const emit = defineEmits<{ 'update:page': [value: number] }>()

function goto(n: number) {
  if (n < 1 || n > props.pageCount) return
  emit('update:page', n)
}

// Compact pagination: always show first + last + neighbors of current,
// fill the gaps with "…". Returns numbers and 'left'/'right' ellipsis sentinels
// so two ellipses on the same row keep distinct keys.
type PageItem = number | 'left-ellipsis' | 'right-ellipsis'

const pageItems = computed<PageItem[]>(() => {
  const total = props.pageCount
  const current = props.page
  if (total <= 1) return [1]

  const items: PageItem[] = []
  // window of pages adjacent to current
  const windowStart = Math.max(2, current - 1)
  const windowEnd = Math.min(total - 1, current + 1)

  items.push(1)
  if (windowStart > 2) items.push('left-ellipsis')
  for (let i = windowStart; i <= windowEnd; i++) items.push(i)
  if (windowEnd < total - 1) items.push('right-ellipsis')
  if (total > 1) items.push(total)
  return items
})
</script>

<template>
  <div
    :class="[
      'flex items-center justify-between',
      flush ? '' : 'px-[16px] py-[12px] border-t border-border-neutral-tertiary bg-neutral',
    ]"
  >
    <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
      Afficher&nbsp;: <span class="font-medium text-text-neutral">{{ rangeStart }}</span> à
      <span class="font-medium text-text-neutral">{{ rangeEnd }}</span> sur
      <span class="font-medium text-text-neutral">{{ total }}</span> résultats
    </p>
    <div class="flex items-center gap-[8px]">
      <button
        type="button"
        class="flex items-center justify-center w-[36px] h-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-icon-neutral-secondary outline-none focus-visible:shadow-ring-gray"
        :disabled="page === 1"
        aria-label="Page précédente"
        @click="goto(page - 1)"
      >
        <Icon name="chevron-left" variant="solid" :size="18" />
      </button>
      <template v-for="item in pageItems" :key="item">
        <span
          v-if="item === 'left-ellipsis' || item === 'right-ellipsis'"
          class="min-w-[36px] h-[36px] flex items-center justify-center font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary select-none"
          aria-hidden="true"
        >
          …
        </span>
        <button
          v-else
          type="button"
          :aria-current="page === item ? 'page' : undefined"
          :class="[
            'min-w-[36px] h-[36px] px-[10px] rounded-[8px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray',
            page === item
              ? 'bg-brand-surface text-text-brand-deep'
              : 'text-text-neutral-secondary hover:bg-neutral-secondary hover:text-text-neutral',
          ]"
          @click="goto(item)"
        >
          {{ item }}
        </button>
      </template>
      <button
        type="button"
        class="flex items-center justify-center w-[36px] h-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-icon-neutral-secondary outline-none focus-visible:shadow-ring-gray"
        :disabled="page === pageCount"
        aria-label="Page suivante"
        @click="goto(page + 1)"
      >
        <Icon name="chevron-right" variant="solid" :size="18" />
      </button>
    </div>
  </div>
</template>
