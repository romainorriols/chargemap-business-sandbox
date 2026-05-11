<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import chargemapBusinessLogo from '@/assets/logos/chargemap-business.svg'

export interface SidebarV1MenuItem {
  id: string
  label: string
  icon: string
}

export interface SidebarV1CollapsibleGroup {
  id: string
  label: string
  icon: string
  collapsible: true
  children: { id: string; label: string }[]
}

export type SidebarV1Section = (SidebarV1MenuItem | SidebarV1CollapsibleGroup)[]

export interface SidebarV1Bu {
  id: string
  name: string
}

export interface SidebarV1User {
  name: string
  email: string
  initials?: string
}

type SidebarV1Mode = 'orga' | 'bu-selection'

interface Props {
  mode?: SidebarV1Mode
  orgaName?: string
  /** When the user is scoped into a BU, the orga switcher shows this label instead. */
  contextLabel?: string
  /** Whether the orga switcher should show "(organisation)" or "(BU)" suffix. */
  contextKind?: 'orga' | 'bu'
  /** Flat menu (orga-level nav). Mutually exclusive with sections. */
  items?: SidebarV1MenuItem[]
  /** Sectioned menu with optional collapsible groups (BU-level nav). */
  sections?: SidebarV1Section[]
  bus?: SidebarV1Bu[]
  activeId?: string
  user?: SidebarV1User | null
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'orga',
  orgaName: '',
  contextLabel: '',
  contextKind: 'orga',
  items: () => [],
  sections: () => [],
  bus: () => [],
  activeId: '',
  user: null,
})

const emit = defineEmits<{
  select: [id: string]
  'swap-orga': []
  back: []
  'select-bu': [id: string]
  'select-orga': []
}>()

const isActive = (id: string) => props.activeId === id

const isCollapsible = (
  entry: SidebarV1MenuItem | SidebarV1CollapsibleGroup,
): entry is SidebarV1CollapsibleGroup => 'collapsible' in entry && entry.collapsible

// Section view = sectioned/collapsible (BU mode). Otherwise, flat list (orga mode).
const useSections = computed(() => props.mode === 'orga' && props.sections.length > 0)

// Open/closed state per collapsible group, keyed by group id. Closed by default.
const openGroups = ref<Record<string, boolean>>({})
watch(
  () => props.sections,
  next => {
    next.forEach(section => {
      section.forEach(entry => {
        if (isCollapsible(entry) && openGroups.value[entry.id] === undefined) {
          openGroups.value[entry.id] = false
        }
      })
    })
  },
  { immediate: true, deep: true },
)
function toggleGroup(id: string) {
  openGroups.value[id] = !openGroups.value[id]
}

// Sliding pill — only for the flat orga list (when no sections).
const itemRefs = ref<Record<string, HTMLButtonElement>>({})
const pillTop = ref(0)
const pillVisible = ref(false)
const pillAnimated = ref(false)

const setItemRef = (id: string) => (el: unknown) => {
  if (el) itemRefs.value[id] = el as HTMLButtonElement
  else delete itemRefs.value[id]
}

const updatePill = async () => {
  await nextTick()
  if (props.mode !== 'orga' || useSections.value) {
    pillVisible.value = false
    return
  }
  const el = itemRefs.value[props.activeId]
  if (!el) {
    pillVisible.value = false
    return
  }
  pillTop.value = el.offsetTop
  pillVisible.value = true
}

watch(() => props.activeId, updatePill)
watch(() => props.items, updatePill, { deep: true })
watch(() => props.mode, updatePill)
watch(useSections, updatePill)

onMounted(async () => {
  await updatePill()
  requestAnimationFrame(() => {
    pillAnimated.value = true
  })
})

const pillStyle = computed(() => ({
  transform: `translateY(${pillTop.value}px)`,
  opacity: pillVisible.value ? 1 : 0,
  transition: pillAnimated.value
    ? 'transform 220ms cubic-bezier(0.77, 0, 0.175, 1), opacity 150ms ease'
    : 'opacity 150ms ease',
}))

const switcherLabel = computed(() => {
  if (props.contextLabel) {
    return props.contextKind === 'bu'
      ? `${props.contextLabel} (BU)`
      : `${props.contextLabel} (organisation)`
  }
  return `${props.orgaName} (organisation)`
})
</script>

<template>
  <!-- Outer wrapper: 304px column, 8px padding, rounded card stack -->
  <div class="flex flex-col h-full w-[304px] p-[8px]">

    <!-- Top section: logo + orga switcher -->
    <div
      class="flex flex-col p-[16px] bg-[#1e3fae] rounded-t-[16px] shrink-0"
      :class="mode === 'orga' ? 'gap-[24px] border-b border-brand' : 'gap-0'"
    >
      <img
        :src="chargemapBusinessLogo"
        alt="Chargemap Business"
        class="h-[36px] w-[162px] select-none pointer-events-none"
        draggable="false"
      />

      <!-- Orga switcher (only in orga mode — in BU selection the "Retour" item replaces it) -->
      <button
        v-if="mode === 'orga'"
        type="button"
        class="flex items-center gap-[12px] w-full px-[12px] py-[8px] rounded-[4px] bg-[#1e3fae] border border-brand outline-none transition-colors duration-150 hover:bg-brand-hover focus-visible:bg-brand-hover"
        @click="emit('swap-orga')"
      >
        <Icon
          :name="contextKind === 'bu' ? 'building-office-2' : 'building-library'"
          variant="solid"
          :size="24"
          class="text-text-neutral-inverse shrink-0"
        />
        <span class="flex-1 min-w-0 text-left font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-brand-lighter truncate">
          {{ switcherLabel }}
        </span>
        <Icon name="chevron-right" variant="outline" :size="18" class="text-brand-lighter shrink-0" />
      </button>
    </div>

    <!-- Menu list — drops its bottom border when an upsell card is
         rendered below (the card brings its own visual edge). -->
    <div
      :class="[
        'flex-1 min-h-0 p-[16px] bg-[#1e3fae] overflow-y-auto scrollbar-hide',
        $slots.upsell ? '' : 'border-b border-brand',
      ]"
    >
      <!-- ORGA mode (flat) -->
      <div v-if="mode === 'orga' && !useSections" class="relative flex flex-col gap-[4px] w-full">
        <div
          class="pointer-events-none absolute left-0 right-0 top-0 h-[40px] rounded-[6px] bg-brand"
          :style="pillStyle"
          aria-hidden="true"
        />

        <button
          v-for="item in items"
          :key="item.id"
          :ref="setItemRef(item.id)"
          type="button"
          class="group relative flex items-center gap-[12px] w-full px-[12px] py-[8px] rounded-[6px] outline-none transition-colors duration-150 active:scale-[0.98]"
          :class="isActive(item.id) ? '' : 'hover:bg-brand-hover'"
          @click="emit('select', item.id)"
        >
          <Icon
            :name="item.icon"
            variant="solid"
            :size="24"
            class="shrink-0 transition-colors duration-150"
            :class="isActive(item.id) ? 'text-text-neutral-inverse' : 'text-brand-lighter group-hover:text-text-neutral-inverse'"
          />
          <span
            class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] truncate transition-colors duration-150"
            :class="isActive(item.id) ? 'text-text-neutral-inverse' : 'text-brand-lighter group-hover:text-text-neutral-inverse'"
          >
            {{ item.label }}
          </span>
        </button>
      </div>

      <!-- ORGA mode (sectioned, with collapsibles) — used at BU scope -->
      <div v-else-if="useSections" class="flex flex-col gap-[16px] w-full">
        <div
          v-for="(section, sIdx) in sections"
          :key="`section-${sIdx}`"
          class="flex flex-col gap-[4px] w-full"
        >
          <template v-for="entry in section" :key="entry.id">
            <!-- Collapsible group -->
            <template v-if="isCollapsible(entry)">
              <button
                type="button"
                class="group relative flex items-center gap-[12px] w-full px-[12px] py-[8px] rounded-[6px] outline-none transition-colors duration-150 hover:bg-brand-hover active:scale-[0.98]"
                :aria-expanded="!!openGroups[entry.id]"
                @click="toggleGroup(entry.id)"
              >
                <Icon
                  :name="entry.icon"
                  variant="solid"
                  :size="24"
                  class="shrink-0 text-brand-lighter group-hover:text-text-neutral-inverse transition-colors duration-150"
                />
                <span class="flex-1 min-w-0 text-left font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-brand-lighter group-hover:text-text-neutral-inverse transition-colors duration-150 truncate">
                  {{ entry.label }}
                </span>
                <Icon
                  name="chevron-up"
                  variant="solid"
                  :size="18"
                  class="shrink-0 text-brand-lighter group-hover:text-text-neutral-inverse"
                  :class="['chevron', { 'chevron-collapsed': !openGroups[entry.id] }]"
                />
              </button>

              <!-- Collapsible body — grid-template-rows trick for smooth, JS-free expand/collapse -->
              <div
                class="collapse-grid"
                :class="{ 'collapse-grid-open': openGroups[entry.id] }"
                :aria-hidden="!openGroups[entry.id]"
              >
                <div class="collapse-content">
                  <div class="flex flex-col gap-[4px] w-full pt-[4px]">
                    <button
                      v-for="child in entry.children"
                      :key="child.id"
                      type="button"
                      class="group flex items-center gap-[12px] w-full px-[12px] py-[8px] rounded-[6px] outline-none transition-colors duration-150 active:scale-[0.98]"
                      :class="isActive(child.id) ? 'bg-brand' : 'hover:bg-brand-hover'"
                      @click="emit('select', child.id)"
                    >
                      <!-- 24px transparent placeholder so the child label aligns under the parent label, not the parent icon -->
                      <span class="size-[24px] shrink-0" aria-hidden="true" />
                      <span
                        class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] truncate transition-colors duration-150"
                        :class="isActive(child.id) ? 'text-text-neutral-inverse' : 'text-brand-lighter group-hover:text-text-neutral-inverse'"
                      >
                        {{ child.label }}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <!-- Plain item -->
            <button
              v-else
              type="button"
              class="group flex items-center gap-[12px] w-full px-[12px] py-[8px] rounded-[6px] outline-none transition-colors duration-150 active:scale-[0.98]"
              :class="isActive(entry.id) ? 'bg-brand' : 'hover:bg-brand-hover'"
              @click="emit('select', entry.id)"
            >
              <Icon
                :name="entry.icon"
                variant="solid"
                :size="24"
                class="shrink-0 transition-colors duration-150"
                :class="isActive(entry.id) ? 'text-text-neutral-inverse' : 'text-brand-lighter group-hover:text-text-neutral-inverse'"
              />
              <span
                class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] truncate transition-colors duration-150"
                :class="isActive(entry.id) ? 'text-text-neutral-inverse' : 'text-brand-lighter group-hover:text-text-neutral-inverse'"
              >
                {{ entry.label }}
              </span>
            </button>
          </template>
        </div>
      </div>

      <!-- BU SELECTION mode -->
      <div v-else class="flex flex-col gap-[16px] w-full">
        <button
          type="button"
          class="group flex items-center gap-[12px] w-full px-[12px] py-[8px] rounded-[6px] outline-none transition-colors duration-150 hover:bg-brand-hover active:scale-[0.98]"
          @click="emit('back')"
        >
          <Icon name="arrow-left" variant="solid" :size="24" class="text-brand-lighter shrink-0 group-hover:text-text-neutral-inverse transition-colors duration-150" />
          <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-brand-lighter group-hover:text-text-neutral-inverse transition-colors duration-150">
            Retour
          </span>
        </button>

        <div class="flex flex-col gap-[4px] w-full">
          <button
            type="button"
            class="group flex items-center gap-[12px] w-full px-[12px] py-[8px] rounded-[6px] outline-none transition-colors duration-150 hover:bg-brand-hover active:scale-[0.98]"
            @click="emit('select-orga')"
          >
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-brand-lighter group-hover:text-text-neutral-inverse transition-colors duration-150 truncate">
              {{ orgaName }}
            </span>
          </button>

          <button
            v-for="bu in bus"
            :key="bu.id"
            type="button"
            class="group flex items-center gap-[12px] w-full px-[12px] py-[8px] rounded-[6px] outline-none transition-colors duration-150 hover:bg-brand-hover active:scale-[0.98]"
            @click="emit('select-bu', bu.id)"
          >
            <svg
              class="shrink-0 text-brand-lighter group-hover:text-text-neutral-inverse transition-colors duration-150"
              width="9"
              height="17"
              viewBox="0 0 9 17"
              fill="none"
              aria-hidden="true"
            >
              <path d="M0.5 0V14C0.5 15.1046 1.39543 16 2.5 16H9" stroke="currentColor" stroke-width="1" />
            </svg>
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-brand-lighter group-hover:text-text-neutral-inverse transition-colors duration-150 truncate">
              {{ bu.name }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Upsell slot — pinned between the menu list and the newsletter row.
         Same dark-blue surface as the surrounding sections so it visually
         belongs to the nav stack; the card inside provides its own contrast. -->
    <div
      v-if="$slots.upsell"
      class="bg-[#1e3fae] border-b border-brand p-[16px] shrink-0"
    >
      <slot name="upsell" />
    </div>

    <!-- Newsletter + Centre d'aide — pinned between the menu list and the user footer.
         Each row keeps the same dark-blue surface but spans edge-to-edge with a top border. -->
    <button
      type="button"
      class="group flex items-center gap-[12px] w-full px-[16px] py-[12px] bg-[#1e3fae] border-b border-brand outline-none transition-colors duration-150 hover:bg-brand-hover focus-visible:bg-brand-hover shrink-0"
    >
      <Icon
        name="megaphone"
        variant="solid"
        :size="24"
        class="shrink-0 text-brand-lighter group-hover:text-text-neutral-inverse transition-colors duration-150"
      />
      <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-brand-lighter group-hover:text-text-neutral-inverse transition-colors duration-150">
        Recevoir la news letter
      </span>
    </button>
    <a
      href="https://chargemap-business.frontkb.com/fr"
      target="_blank"
      rel="noopener noreferrer"
      class="group flex items-center gap-[12px] w-full px-[16px] py-[12px] bg-[#1e3fae] border-b border-brand outline-none transition-colors duration-150 hover:bg-brand-hover focus-visible:bg-brand-hover shrink-0"
    >
      <Icon
        name="book-open"
        variant="solid"
        :size="24"
        class="shrink-0 text-brand-lighter group-hover:text-text-neutral-inverse transition-colors duration-150"
      />
      <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-brand-lighter group-hover:text-text-neutral-inverse transition-colors duration-150">
        Centre d'aide
      </span>
    </a>

    <!-- Footer: avatar + name + email -->
    <div
      v-if="user"
      class="flex items-center gap-[12px] p-[16px] bg-[#1e3fae] rounded-b-[16px] shrink-0"
    >
      <div class="size-[40px] rounded-full bg-neutral-secondary border border-border-neutral flex items-center justify-center shrink-0">
        <Icon name="user" variant="outline" :size="24" class="text-text-neutral-secondary" />
      </div>
      <div class="flex-1 min-w-0 flex flex-col">
        <p class="font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-brand-lighter truncate">
          {{ user.name }}
        </p>
        <p class="font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-brand-lighter truncate">
          {{ user.email }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
  Collapsible animation — grid-template-rows trick.
  - Pure CSS, no JS height measurement, no ResizeObserver.
  - Animates the implicit row height between 0fr and 1fr.
  - 240ms ease-in-out (project's existing curve), under the 300ms UI ceiling.
  - Asymmetric feel: chevron snaps a touch faster (200ms) than the body opens.
*/
.collapse-grid {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 240ms cubic-bezier(0.77, 0, 0.175, 1);
}
.collapse-grid-open {
  grid-template-rows: 1fr;
}
.collapse-content {
  overflow: hidden;
  min-height: 0;
}

/* Chevron rotation tracks the same easing as the body. Default = expanded (chevron-up). */
.chevron {
  transform: rotate(0deg);
  transition: transform 200ms cubic-bezier(0.77, 0, 0.175, 1);
}
.chevron-collapsed {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .collapse-grid,
  .chevron {
    transition: none;
  }
}

/* Hide the vertical scrollbar in the menu list while keeping scroll functional. */
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
