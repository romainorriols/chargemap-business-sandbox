<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Sidebar from './components/ui/Sidebar.vue'
import SidebarV1, { type SidebarV1Section } from './components/ui/SidebarV1.vue'
import SidebarUpsellCard from './components/ui/SidebarUpsellCard.vue'
import NavVersionToggle from './components/ui/NavVersionToggle.vue'
import Dashboard from './pages/Dashboard.vue'
import BusinessUnits from './pages/BusinessUnits.vue'
import Billing from './pages/Billing.vue'
import Orders from './pages/Orders.vue'
import Settings from './pages/Settings.vue'
import Users from './pages/Users.vue'
import BuHome from './pages/BuHome.vue'
import SupervisedCharges from './pages/SupervisedCharges.vue'
import { orga } from './state/orga'
import { bus, selectedBuId } from './state/bus'
import { isNavV2 } from './state/nav'

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

// V1 (blue) sidebar — Figma 5113-56684. Flat list, solid icons, "Projet d'installation" extra entry.
const v1Items = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'chart-pie' },
  { id: 'billing', label: 'Facturation', icon: 'wallet' },
  { id: 'orders', label: 'Commandes', icon: 'truck' },
  { id: 'bus', label: 'Business units', icon: 'building-office-2' },
  { id: 'install-project', label: "Projet d'installation", icon: 'charging-station' },
]

// V1 BU-scoped nav — Figma 5214-15304. Sections separated by 16px gaps, two collapsible groups.
const v1BuSections: SidebarV1Section[] = [
  [
    { id: 'bu-dashboard', label: 'Tableau de bord', icon: 'chart-pie' },
    { id: 'bu-shop', label: 'Boutique', icon: 'shopping-bag' },
    { id: 'bu-billing', label: 'Facturation', icon: 'wallet' },
    { id: 'bu-orders', label: 'Commandes', icon: 'truck' },
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

const STORAGE_KEY = 'cm-sandbox-active-page'
const validIds = new Set<string>([
  ...groups.flatMap(g => g.items.map(i => i.id)),
  'bu-home',
  'install-project',
])
// Allow any bu-* id (BU sub-pages) to round-trip through localStorage.
const isValidId = (id: string) => validIds.has(id) || id.startsWith('bu-')

// URL-driven state — `?page=...&bu=...&nav=v1` lets users share a deep link
// that lands on the right tab with the right nav version. URL params win over
// localStorage on initial load, then state changes write back to the URL via
// history.replaceState so the address bar stays a sharable snapshot.
const urlParams = new URLSearchParams(window.location.search)
const urlPage = urlParams.get('page')
const urlBu = urlParams.get('bu')
const urlNav = urlParams.get('nav')

if (urlNav === 'v1') isNavV2.value = false
else if (urlNav === 'v2') isNavV2.value = true

if (urlBu === 'orga') selectedBuId.value = null
else if (urlBu && bus.some(b => b.id === urlBu)) selectedBuId.value = urlBu

const stored = localStorage.getItem(STORAGE_KEY)
const initialPage = (urlPage && isValidId(urlPage)) ? urlPage
  : (stored && isValidId(stored)) ? stored
  : 'dashboard'
const activeId = ref<string>(initialPage)
watch(activeId, v => localStorage.setItem(STORAGE_KEY, v))

// Sidebar upsell stack: card 1 shows first, closing it reveals card 2, closing that hides the stack.
const upsellStep = ref<1 | 2 | 0>(1)

// V1 sidebar mode: 'orga' (normal nav) or 'bu-selection' (BU picker).
const sidebarMode = ref<'orga' | 'bu-selection'>('orga')

// Reset sidebar mode whenever we toggle nav versions, so V1 doesn't reopen mid-selection.
watch(isNavV2, () => { sidebarMode.value = 'orga' })

const currentBu = computed(() => bus.find(b => b.id === selectedBuId.value) ?? null)
const switcherContextLabel = computed(() => currentBu.value?.name ?? '')
const switcherContextKind = computed<'orga' | 'bu'>(() => (currentBu.value ? 'bu' : 'orga'))

function onSwapOrga() {
  sidebarMode.value = 'bu-selection'
}
function onBack() {
  sidebarMode.value = 'orga'
}
function onSelectBu(id: string) {
  selectedBuId.value = id
  sidebarMode.value = 'orga'
  activeId.value = 'bu-home'
}
function onSelectOrga() {
  selectedBuId.value = null
  sidebarMode.value = 'orga'
  activeId.value = 'dashboard'
}

// Keep the URL in sync with the active state so the address bar always
// reflects a sharable snapshot. `replaceState` (not pushState) avoids
// polluting the browser history on every nav.
function syncUrl() {
  const params = new URLSearchParams()
  params.set('page', activeId.value)
  params.set('bu', selectedBuId.value ?? 'orga')
  params.set('nav', isNavV2.value ? 'v2' : 'v1')
  const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`
  if (newUrl !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(null, '', newUrl)
  }
}
watch([activeId, selectedBuId, isNavV2], syncUrl, { immediate: true })
</script>

<template>
  <div
    class="flex h-screen w-screen overflow-hidden"
    :class="isNavV2 ? 'bg-neutral pt-[12px] pb-[12px] pr-[12px]' : 'bg-neutral-secondary'"
  >
    <SidebarV1
      v-if="!isNavV2"
      :mode="sidebarMode"
      :orga-name="orga.raisonSociale"
      :context-label="switcherContextLabel"
      :context-kind="switcherContextKind"
      :items="currentBu ? [] : v1Items"
      :sections="currentBu ? v1BuSections : []"
      :bus="bus"
      :user="user"
      :active-id="activeId"
      @select="(id: string) => (activeId = id)"
      @swap-orga="onSwapOrga"
      @back="onBack"
      @select-bu="onSelectBu"
      @select-orga="onSelectOrga"
    />
    <Sidebar
      v-else
      :mode="sidebarMode"
      :orga-type="currentBu ? 'BU' : 'Orga'"
      :orga-name="orga.raisonSociale"
      :context-label="switcherContextLabel"
      :context-kind="switcherContextKind"
      :groups="currentBu ? [] : groups"
      :sections="currentBu ? v1BuSections : []"
      :bus="bus"
      :user="user"
      :active-id="activeId"
      @select="(id: string) => (activeId = id)"
      @swap-orga="onSwapOrga"
      @back="onBack"
      @select-bu="onSelectBu"
      @select-orga="onSelectOrga"
    >
      <template #upsell>
        <!--
          Stacked upsell deck (Figma 4985-65475). Both cards share the same grid cell so
          the supervision card peeks 16px above the briefcase. Closing the briefcase peels
          the front card away while the supervision card simultaneously grows from its
          back/truncated pose to the full front pose (width, height, margin all transition
          with Emil's ease). Closing supervision fades the last card away.
          Upsell stack is orga-scoped only — hidden inside any BU context.
        -->
        <div
          v-if="!currentBu"
          class="inline-grid grid-cols-[max-content] grid-rows-[max-content] place-items-start"
        >
          <Transition
            enter-active-class="transition-opacity duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-[0.97]"
          >
            <SidebarUpsellCard
              v-if="upsellStep >= 1"
              variant="supervision"
              :stacked="upsellStep === 1"
              close-label="Fermer la carte Recharge sur site"
              class="col-start-1 row-start-1"
              :class="upsellStep === 1 ? 'ml-[10px]' : 'ml-0'"
              @close="upsellStep = 0"
            />
          </Transition>
          <!--
            Briefcase peels off quickly (180ms, ease-out-expo) with a slight lift + shrink so
            the supervision morph underneath can breathe. Enter is softer/slower so the deck
            settles rather than snapping.
          -->
          <Transition
            enter-active-class="transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            enter-from-class="opacity-0 translate-y-[6px] scale-[0.98]"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-[8px] scale-[0.95]"
          >
            <SidebarUpsellCard
              v-if="upsellStep === 1"
              variant="briefcase"
              close-label="Fermer la carte Boostez votre flotte"
              class="col-start-1 row-start-1 ml-0 mt-[16px]"
              @close="upsellStep = 2"
            />
          </Transition>
        </div>
      </template>
    </Sidebar>
    <main
      class="flex-1 min-w-0 bg-neutral-secondary overflow-y-auto"
      :class="isNavV2 ? 'rounded-[24px]' : ''"
    >
      <!-- BU-scoped pages: built ones routed individually, the rest fall through to BuHome. -->
      <SupervisedCharges v-if="activeId === 'bu-supervision-charges'" />
      <BuHome v-else-if="activeId === 'bu-home' || activeId.startsWith('bu-')" />
      <Dashboard v-else-if="activeId === 'dashboard'" />
      <BusinessUnits v-else-if="activeId === 'bus'" />
      <Billing v-else-if="activeId === 'billing'" />
      <Orders v-else-if="activeId === 'orders'" />
      <Settings v-else-if="activeId === 'settings'" />
      <Users v-else-if="activeId === 'users'" />
      <Dashboard v-else />
    </main>

    <NavVersionToggle v-model="isNavV2" />
  </div>
</template>
