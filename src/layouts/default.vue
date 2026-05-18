<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SidebarV1Section } from '~/components/ui/SidebarV1.vue'

const orgaStore = useOrgaStore()
const busStore = useBusStore()
const navStore = useNavStore()

// V2 (white) sidebar groups — orga context only. BU context falls back
// to the V1 sections list because the BU IA hasn't been redesigned for V2.
const groups = [
  {
    heading: 'Pilotage',
    itemsGap: 8 as const,
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: 'chart-pie' },
      { id: 'billing', label: 'Facturation', icon: 'credit-card' },
      { id: 'orders', label: 'Commandes', icon: 'document-duplicate' },
      { id: 'bus', label: 'Business units', icon: 'building-office-2' },
    ],
  },
  {
    heading: 'Paramètres',
    itemsGap: 4 as const,
    items: [
      { id: 'settings', label: 'Paramètres', icon: 'cog-6-tooth' },
      { id: 'users', label: 'Utilisateurs', icon: 'users' },
    ],
  },
]

// Orga-level nav (V1 blue sidebar — Figma 5113-71427).
const orgaSections: SidebarV1Section[] = [
  [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'chart-pie' },
    { id: 'billing', label: 'Facturation', icon: 'wallet' },
    { id: 'orders', label: 'Commandes', icon: 'inbox-stack' },
    { id: 'bus', label: 'Business units', icon: 'building-office-2' },
    { id: 'install-project', label: "Projet d'installation", icon: 'charging-station' },
  ],
  [
    { id: 'settings', label: 'Paramètres', icon: 'cog-6-tooth' },
    { id: 'users', label: 'Utilisateurs', icon: 'users' },
  ],
]

// BU-scoped nav (V1 — Figma 5214-15304).
const buSections: SidebarV1Section[] = [
  [
    { id: 'bu-dashboard', label: 'Tableau de bord', icon: 'chart-pie' },
    { id: 'bu-shop', label: 'Boutique', icon: 'shopping-bag' },
    { id: 'bu-billing', label: 'Facturation', icon: 'wallet' },
    { id: 'bu-orders', label: 'Commandes', icon: 'inbox-stack' },
  ],
  [
    {
      id: 'bu-badges',
      label: 'Badges',
      icon: 'charging-badge-pass',
      collapsible: true,
      children: [
        { id: 'bu-badges-cmb', label: 'Chargemap Business' },
        { id: 'bu-badges-private', label: 'Badges privés' },
        { id: 'bu-badges-classic', label: 'Chargemap Classic' },
      ],
    },
    { id: 'bu-vehicles', label: 'Véhicules', icon: 'car' },
    { id: 'bu-drivers', label: 'Conducteurs', icon: 'user-group' },
    { id: 'bu-groups', label: 'Groupes', icon: 'folder-open' },
  ],
  [
    { id: 'bu-roaming', label: 'Recharge en itinérance', icon: 'plugged-car' },
    { id: 'bu-toll-parking', label: 'Péage et parking', icon: 'toll-badge' },
  ],
  [
    {
      id: 'bu-supervision',
      label: 'Supervision de bornes',
      icon: 'charging-station',
      collapsible: true,
      children: [
        { id: 'bu-supervision-charges', label: 'Recharges supervisées' },
        { id: 'bu-supervision-stations', label: 'Bornes supervisées' },
      ],
    },
  ],
  [
    { id: 'bu-settings', label: 'Paramètres BU', icon: 'cog-6-tooth' },
    { id: 'bu-users', label: 'Utilisateurs', icon: 'users' },
  ],
]

const user = { name: 'John Doe', email: 'johndoe@email.com' }

// ── Routing ↔ sidebar id mapping ──────────────────────────────────────
// Orga-level: id 1:1 with route slug, except 'dashboard' → '/'.
const ORGA_ID_TO_PATH: Record<string, string> = {
  dashboard: '/',
  billing: '/billing',
  orders: '/orders',
  bus: '/bus',
  settings: '/settings',
  users: '/users',
  'install-project': '/install-project',
}
// BU-level slug irregularity: 'bu-supervision-charges' → 'supervised-charges'.
// Everything else strips 'bu-' to derive the slug. Dedicated pages exist for
// home / settings / supervised-charges; other slugs hit the [...slug].vue
// catchall which renders the BuHome content.
const BU_ID_TO_SLUG: Record<string, string> = {
  'bu-home': 'home',
  'bu-settings': 'settings',
  'bu-supervision-charges': 'supervised-charges',
}
function buIdToSlug(id: string): string {
  return BU_ID_TO_SLUG[id] ?? id.replace(/^bu-/, '')
}
function slugToBuId(slug: string): string {
  for (const [id, sl] of Object.entries(BU_ID_TO_SLUG)) {
    if (sl === slug) return id
  }
  return `bu-${slug}`
}

const route = useRoute()

// Sidebar's :active-id derived from the URL.
const activeId = computed(() => {
  const path = route.path
  if (path.startsWith('/bu/')) {
    const segs = path.split('/').filter(Boolean) // ['bu', '<id>', '<slug>?']
    const slug = segs[2] ?? 'home'
    return slugToBuId(slug)
  }
  if (path === '/') return 'dashboard'
  const slug = path.replace(/^\//, '').split('/')[0] ?? ''
  return slug || 'dashboard'
})

// Sync selectedBuId from the URL — single source of truth for BU context.
watch(
  () => route.fullPath,
  () => {
    const id = route.params.id
    if (route.path.startsWith('/bu/') && typeof id === 'string' && busStore.bus.some(b => b.id === id)) {
      busStore.selectedBuId = id
    } else if (!route.path.startsWith('/bu/')) {
      busStore.selectedBuId = null
    }
  },
  { immediate: true },
)

function onSelect(id: string) {
  if (id.startsWith('bu-')) {
    const buId = busStore.selectedBuId
    if (!buId) return
    navigateTo(`/bu/${buId}/${buIdToSlug(id)}`)
    return
  }
  navigateTo(ORGA_ID_TO_PATH[id] ?? '/')
}

const sidebarMode = ref<'orga' | 'bu-selection'>('orga')
// Always pop back to the orga view when toggling between V1 and V2 so the
// user doesn't get stranded mid-BU-selection in the wrong sidebar variant.
watch(() => navStore.isNavV2, () => { sidebarMode.value = 'orga' })

const currentBu = computed(() => busStore.bus.find(b => b.id === busStore.selectedBuId) ?? null)
const switcherContextLabel = computed(() => currentBu.value?.name ?? '')
const switcherContextKind = computed<'orga' | 'bu'>(() => (currentBu.value ? 'bu' : 'orga'))

function onSwapOrga() { sidebarMode.value = 'bu-selection' }
function onBack() { sidebarMode.value = 'orga' }
function onSelectBu(id: string) {
  busStore.selectedBuId = id
  sidebarMode.value = 'orga'
  navigateTo(`/bu/${id}/home`)
}
function onSelectOrga() {
  busStore.selectedBuId = null
  sidebarMode.value = 'orga'
  navigateTo('/')
}
</script>

<template>
  <div
    class="flex h-screen w-screen overflow-hidden"
    :class="navStore.isNavV2 ? 'bg-neutral pt-[12px] pb-[12px] pr-[12px]' : 'bg-neutral-secondary'"
  >
    <SidebarV1
      v-if="!navStore.isNavV2"
      :mode="sidebarMode"
      :orga-name="orgaStore.raisonSociale"
      :context-label="switcherContextLabel"
      :context-kind="switcherContextKind"
      :items="[]"
      :sections="currentBu ? buSections : orgaSections"
      :bus="busStore.bus"
      :user="user"
      :active-id="activeId"
      @select="onSelect"
      @swap-orga="onSwapOrga"
      @back="onBack"
      @select-bu="onSelectBu"
      @select-orga="onSelectOrga"
    />
    <Sidebar
      v-else
      :mode="sidebarMode"
      :orga-type="currentBu ? 'BU' : 'Orga'"
      :orga-name="orgaStore.raisonSociale"
      :context-label="switcherContextLabel"
      :context-kind="switcherContextKind"
      :groups="currentBu ? [] : groups"
      :sections="currentBu ? buSections : []"
      :bus="busStore.bus"
      :user="user"
      :active-id="activeId"
      @select="onSelect"
      @swap-orga="onSwapOrga"
      @back="onBack"
      @select-bu="onSelectBu"
      @select-orga="onSelectOrga"
    />
    <main
      class="flex-1 min-w-0 bg-neutral-secondary overflow-y-auto"
      :class="navStore.isNavV2 ? 'rounded-[24px]' : ''"
    >
      <slot />
    </main>

    <SandboxControls />
  </div>
</template>
