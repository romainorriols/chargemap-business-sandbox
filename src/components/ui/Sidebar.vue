<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import Icon from './Icon.vue'

type OrgaType = 'Orga' | 'BU'
type SidebarMode = 'orga' | 'bu-selection'

export interface SidebarMenuItem {
  id: string
  label: string
  icon: string
}

export interface SidebarCollapsibleGroup {
  id: string
  label: string
  icon: string
  collapsible: true
  children: { id: string; label: string }[]
}

export type SidebarSection = (SidebarMenuItem | SidebarCollapsibleGroup)[]

export interface SidebarGroup {
  heading?: string
  items: SidebarMenuItem[]
  /** Gap between items in px (Figma: 8 for Pilotage, 4 for Paramètres). Default 4. */
  itemsGap?: 4 | 8
}

export interface SidebarBu {
  id: string
  name: string
}

export interface SidebarUser {
  name: string
  email: string
  initials?: string
}

interface Props {
  /** 'orga' = normal nav. 'bu-selection' = BU picker shown in place of the menu list. */
  mode?: SidebarMode
  orgaType?: OrgaType
  orgaName?: string
  /** When the user is scoped into a BU, the orga switcher shows this label instead. */
  contextLabel?: string
  /** Whether the orga switcher should show "Organisation" or "Business Unit" sub-label. */
  contextKind?: 'orga' | 'bu'
  /** Flat orga-level nav. Mutually exclusive with sections. */
  groups?: SidebarGroup[]
  /** Sectioned nav with optional collapsible groups (BU-level nav). */
  sections?: SidebarSection[]
  /** BU list shown in 'bu-selection' mode. */
  bus?: SidebarBu[]
  adminItem?: SidebarMenuItem | null
  activeId?: string
  user?: SidebarUser | null
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'orga',
  orgaType: 'Orga',
  orgaName: '',
  contextLabel: '',
  contextKind: 'orga',
  groups: () => [],
  sections: () => [],
  bus: () => [],
  adminItem: null,
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
  entry: SidebarMenuItem | SidebarCollapsibleGroup,
): entry is SidebarCollapsibleGroup => 'collapsible' in entry && entry.collapsible

// Section view active when sections are provided AND we're in normal nav mode.
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

// Switcher label/icon — when scoped into a BU, the swapper reflects it.
const orgaLabel = computed(() => {
  const kind = props.contextLabel ? props.contextKind : (props.orgaType === 'BU' ? 'bu' : 'orga')
  return kind === 'bu' ? 'Business Unit' : 'Organisation'
})
const orgaIcon = computed(() => {
  const kind = props.contextLabel ? props.contextKind : (props.orgaType === 'BU' ? 'bu' : 'orga')
  return kind === 'bu' ? 'building-office-2' : 'building-library'
})
const switcherName = computed(() => props.contextLabel || props.orgaName)

const userInitials = computed(() => {
  if (!props.user) return ''
  if (props.user.initials) return props.user.initials
  return props.user.name
    .split(' ')
    .map(s => s[0] || '')
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

const itemClass = (active: boolean) => [
  'group relative flex gap-[8px] h-[36px] min-h-[36px] items-center px-[8px] py-[4px] rounded-[12px] w-full outline-none',
  'transition duration-200 ease-out active:scale-[0.97]',
  active ? '' : 'hover:bg-brand-surface',
]

// Sectioned/collapsible/BU-selection items don't use the sliding pill — bake the
// active background directly so the active row remains highlighted regardless.
const itemClassDirect = (active: boolean) => [
  'group flex gap-[8px] h-[36px] min-h-[36px] items-center px-[8px] py-[4px] rounded-[12px] w-full outline-none',
  'transition duration-200 ease-out active:scale-[0.97]',
  active ? 'bg-brand-surface' : 'hover:bg-brand-surface',
]

const itemTextClass = (active: boolean) => [
  'flex-1 min-w-0 font-sans font-medium text-[14px] leading-[20px] tracking-[-0.28px] text-left truncate transition-colors duration-200 ease-out',
  active
    ? 'text-text-brand-deep'
    : 'text-text-neutral-secondary group-hover:text-text-brand-medium',
]

const itemIconClass = (active: boolean) => [
  'transition-colors duration-200 ease-out',
  active
    ? 'text-icon-brand-deep'
    : 'text-icon-neutral-secondary group-hover:text-icon-brand',
]

// Sliding pill indicator — follows the active menu-item
const contentRef = ref<HTMLDivElement | null>(null)
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
  // Pill only follows the flat groups view — collapsible sections use direct bg bindings.
  if (useSections.value || props.mode !== 'orga') {
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
watch(() => props.groups, updatePill, { deep: true })
watch(() => props.adminItem, updatePill, { deep: true })
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
</script>

<template>
  <div class="flex flex-col h-full w-[288px] bg-neutral">

    <!-- Main container -->
    <div class="flex-1 min-h-0 flex flex-col gap-[32px] p-[16px] overflow-y-auto">

      <!-- OrgaSwapper — only shown in normal nav mode. In BU-selection mode, the
           "Retour" item replaces it as the first menu entry. -->
      <button
        v-if="mode === 'orga'"
        type="button"
        class="bg-neutral border border-border-neutral-secondary flex gap-[12px] items-center overflow-hidden p-[8px] rounded-[12px] w-full shrink-0 text-left transition-colors duration-100 hover:bg-neutral-hover outline-none focus-visible:border-brand focus-visible:shadow-ring-brand"
        @click="emit('swap-orga')"
      >
        <div class="bg-brand border border-border-neutral-tertiary flex flex-col items-center justify-center p-[8px] rounded-[8px] shadow-sm shrink-0 size-[32px]">
          <div class="overflow-hidden relative shrink-0 size-[16px]">
            <Icon :name="orgaIcon" variant="solid" :size="16" class="text-icon-neutral-inverse" />
          </div>
        </div>
        <div class="flex flex-col items-start min-w-0 text-text-neutral-secondary" style="flex: 1 0 0;">
          <span class="font-sans font-normal text-[10px] leading-none w-full">
            {{ orgaLabel }}
          </span>
          <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] w-full overflow-hidden text-ellipsis whitespace-nowrap">
            {{ switcherName }}
          </span>
        </div>
        <div class="overflow-hidden relative shrink-0 size-[16px]">
          <Icon name="chevron-up-down" variant="solid" :size="16" class="text-icon-neutral-secondary" />
        </div>
      </button>

      <!-- Content (admin + groups) -->
      <div ref="contentRef" class="relative flex-1 flex flex-col gap-[32px] w-full">

        <!-- BU SELECTION mode -->
        <div v-if="mode === 'bu-selection'" class="flex flex-col gap-[24px] w-full">
          <button
            type="button"
            :class="itemClassDirect(false)"
            @click="emit('back')"
          >
            <span class="flex items-center px-[4px] shrink-0">
              <Icon name="arrow-left" variant="outline" :size="20" class="text-icon-neutral-secondary group-hover:text-icon-brand transition-colors duration-200 ease-out" />
            </span>
            <span class="flex-1 min-w-0 font-sans font-medium text-[14px] leading-[20px] tracking-[-0.28px] text-left truncate text-text-neutral-secondary group-hover:text-text-brand-medium transition-colors duration-200 ease-out">
              Retour
            </span>
          </button>

          <div class="flex flex-col gap-[4px] w-full">
            <button
              type="button"
              :class="itemClassDirect(false)"
              @click="emit('select-orga')"
            >
              <span class="flex items-center px-[4px] shrink-0">
                <Icon name="building-library" variant="outline" :size="20" class="text-icon-neutral-secondary group-hover:text-icon-brand transition-colors duration-200 ease-out" />
              </span>
              <span class="flex-1 min-w-0 font-sans font-medium text-[14px] leading-[20px] tracking-[-0.28px] text-left truncate text-text-neutral-secondary group-hover:text-text-brand-medium transition-colors duration-200 ease-out">
                {{ orgaName }}
              </span>
            </button>

            <button
              v-for="bu in bus"
              :key="bu.id"
              type="button"
              :class="itemClassDirect(false)"
              @click="emit('select-bu', bu.id)"
            >
              <!-- Curved connector mirrors V1's tree visual, in V2 neutral tones. -->
              <span class="flex items-center justify-center w-[20px] px-[4px] shrink-0">
                <svg
                  class="text-icon-neutral-secondary group-hover:text-icon-brand transition-colors duration-200 ease-out"
                  width="9"
                  height="17"
                  viewBox="0 0 9 17"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M0.5 0V14C0.5 15.1046 1.39543 16 2.5 16H9" stroke="currentColor" stroke-width="1" />
                </svg>
              </span>
              <span class="flex-1 min-w-0 font-sans font-medium text-[14px] leading-[20px] tracking-[-0.28px] text-left truncate text-text-neutral-secondary group-hover:text-text-brand-medium transition-colors duration-200 ease-out">
                {{ bu.name }}
              </span>
            </button>
          </div>
        </div>

        <!-- ORGA SECTIONED mode (BU scope, with collapsibles) -->
        <template v-else-if="useSections">
          <div
            v-for="(section, sIdx) in sections"
            :key="`section-${sIdx}`"
            class="flex flex-col gap-[4px] w-full"
          >
            <template v-for="entry in section" :key="entry.id">
              <!-- Collapsible group header -->
              <template v-if="isCollapsible(entry)">
                <button
                  type="button"
                  :class="itemClassDirect(false)"
                  :aria-expanded="!!openGroups[entry.id]"
                  @click="toggleGroup(entry.id)"
                >
                  <span class="flex items-center px-[4px] shrink-0">
                    <Icon :name="entry.icon" variant="outline" :size="20" class="text-icon-neutral-secondary group-hover:text-icon-brand transition-colors duration-200 ease-out" />
                  </span>
                  <span class="flex-1 min-w-0 font-sans font-medium text-[14px] leading-[20px] tracking-[-0.28px] text-left truncate text-text-neutral-secondary group-hover:text-text-brand-medium transition-colors duration-200 ease-out">
                    {{ entry.label }}
                  </span>
                  <Icon
                    name="chevron-up"
                    variant="outline"
                    :size="16"
                    class="shrink-0 mr-[4px] text-icon-neutral-secondary group-hover:text-icon-brand transition-colors duration-200 ease-out"
                    :class="['chevron', { 'chevron-collapsed': !openGroups[entry.id] }]"
                  />
                </button>

                <!-- Children — grid-template-rows trick for smooth expand/collapse -->
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
                        :class="itemClassDirect(isActive(child.id))"
                        @click="emit('select', child.id)"
                      >
                        <span class="size-[20px] shrink-0" aria-hidden="true" />
                        <span :class="itemTextClass(isActive(child.id))">{{ child.label }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Plain item -->
              <button
                v-else
                type="button"
                :class="itemClassDirect(isActive(entry.id))"
                @click="emit('select', entry.id)"
              >
                <span class="flex items-center px-[4px] shrink-0">
                  <Icon :name="entry.icon" variant="outline" :size="20" :class="itemIconClass(isActive(entry.id))" />
                </span>
                <span :class="itemTextClass(isActive(entry.id))">{{ entry.label }}</span>
              </button>
            </template>
          </div>
        </template>

        <!-- ORGA FLAT mode (default — flat groups + sliding pill) -->
        <template v-else>
          <!-- Sliding active-pill indicator -->
          <div
            class="pointer-events-none absolute left-0 top-0 w-full h-[36px] rounded-[12px] bg-brand-surface"
            :style="pillStyle"
            aria-hidden="true"
          />

          <!-- Admin top-level item -->
          <button
            v-if="adminItem"
            type="button"
            :ref="setItemRef(adminItem.id)"
            :class="itemClass(isActive(adminItem.id))"
            @click="emit('select', adminItem.id)"
          >
            <span class="flex items-center px-[4px] shrink-0">
              <Icon :name="adminItem.icon" variant="outline" :size="20" :class="itemIconClass(isActive(adminItem.id))" />
            </span>
            <span :class="itemTextClass(isActive(adminItem.id))">{{ adminItem.label }}</span>
          </button>

          <!-- Groups -->
          <div
            v-for="(group, gIdx) in groups"
            :key="group.heading ?? `group-${gIdx}`"
            class="flex flex-col gap-[8px] w-full"
          >
            <div v-if="group.heading" class="flex items-start overflow-hidden px-[12px] w-full">
              <p class="font-sans font-semibold text-[12px] leading-[1.5] tracking-[-0.36px] text-text-neutral-secondary whitespace-nowrap">
                {{ group.heading }}
              </p>
            </div>
            <div
              :class="[
                'flex flex-col w-full',
                group.itemsGap === 8 ? 'gap-[8px]' : 'gap-[4px]',
              ]"
            >
              <button
                v-for="item in group.items"
                :key="item.id"
                :ref="setItemRef(item.id)"
                type="button"
                :class="itemClass(isActive(item.id))"
                @click="emit('select', item.id)"
              >
                <span class="flex items-center px-[4px] shrink-0">
                  <Icon :name="item.icon" variant="outline" :size="20" :class="itemIconClass(isActive(item.id))" />
                </span>
                <span :class="itemTextClass(isActive(item.id))">{{ item.label }}</span>
              </button>
            </div>
          </div>
        </template>

      </div>
    </div>

    <!-- Upsell slot (sits above the footer, outside the scroll area) -->
    <div v-if="$slots.upsell" class="shrink-0 px-[16px] w-full">
      <slot name="upsell" />
    </div>

    <!-- Footer (user profile) -->
    <div v-if="user" class="shrink-0 p-[16px] w-full">
      <div class="flex gap-[12px] items-center overflow-hidden px-[12px] py-[8px] rounded-[8px] w-full">
        <div class="bg-neutral-secondary border border-border-neutral rounded-full w-[32px] h-[32px] shrink-0 flex items-center justify-center">
          <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            {{ userInitials }}
          </p>
        </div>
        <div class="flex-1 min-w-0 flex flex-col">
          <p class="font-sans font-normal text-[12px] leading-[1.5] tracking-[-0.36px] text-[#1d283a] truncate">
            {{ user.name }}
          </p>
          <p class="font-sans font-normal text-[12px] leading-[1.5] tracking-[-0.36px] text-text-secondary truncate">
            {{ user.email }}
          </p>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Collapsible animation — same grid-template-rows trick as V1, V2 tokens. */
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
</style>
