<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { usePageHeadingClass } from '../utils/typography'

const uiStore = useUiStore()
const headingClass = usePageHeadingClass()

type OrderStatus = 'paiement-attente' | 'validee' | 'prete' | 'expediee' | 'terminee'
type OrderType = 'Badge' | 'Licence'

interface CartItem { label: string; qty: number; price: number }
interface Recipient { initials: string; name: string; bu: string; address1: string; address2: string }
interface Order {
  id: string
  number: string
  date: string
  amountTtc: number
  status: OrderStatus
  type: OrderType
  paymentMethod: string
  bu: string
  recipient: Recipient
  items: CartItem[]
}

interface StatusVariant { label: string }
// Status pills keep the neutral accent-gray triplet (Figma 5696-18817).
// Labels are unchanged — the table view only reuses them.
const VARIANTS: Record<OrderStatus, StatusVariant> = {
  'paiement-attente': { label: 'Paiement en attente' },
  'validee':          { label: 'Validée' },
  'prete':            { label: 'Prête' },
  'expediee':         { label: 'Expédiée' },
  'terminee':         { label: 'Terminée' },
}

// Varied seed: 14 orders, mixed statuses/types, dates across April–May 2026.
const orders: Order[] = [
  { id: 'o1', number: '20260506-00170128', date: '06/05/2026', amountTtc: 137.97, status: 'expediee', type: 'Badge',
    paymentMethod: 'Prélèvement SEPA', bu: 'Chargemap',
    recipient: { initials: 'JD', name: 'John Doe',         bu: 'Brakson', address1: '7 Allée Cérès',          address2: '67000 Strasbourg, France' },
    items: [
      { label: 'Pack itinérance',          qty: 1, price: 45.99 },
      { label: 'Badge Chargemap Business', qty: 2, price: 45.99 },
    ] },
  { id: 'o2', number: '20260505-00170121', date: '05/05/2026', amountTtc: 53.89, status: 'validee', type: 'Badge',
    paymentMethod: 'Carte bancaire', bu: 'Saabre',
    recipient: { initials: 'AM', name: 'Anne Martin',      bu: 'Brakson', address1: '12 Rue du Marché',       address2: '69001 Lyon, France' },
    items: [
      { label: 'Badge Chargemap Business', qty: 1, price: 45.99 },
      { label: 'Frais de port',            qty: 1, price:  7.90 },
    ] },
  { id: 'o3', number: '20260504-00170117', date: '04/05/2026', amountTtc: 277.94, status: 'prete', type: 'Badge',
    paymentMethod: 'Prélèvement SEPA', bu: 'Mister EV',
    recipient: { initials: 'PD', name: 'Pierre Durand',    bu: 'Brakson', address1: '3 Boulevard Haussmann',  address2: '75009 Paris, France' },
    items: [
      { label: 'Adaptateur Type 2',        qty: 1, price: 89.00 },
      { label: 'Pack itinérance',          qty: 4, price: 45.99 },
      { label: 'Frais de port',            qty: 1, price:  4.98 },
    ] },
  { id: 'o4', number: '20260502-00170102', date: '02/05/2026', amountTtc: 19.90, status: 'paiement-attente', type: 'Licence',
    paymentMethod: 'Virement bancaire', bu: 'Brakson',
    recipient: { initials: 'CL', name: 'Camille Leroy',    bu: 'Brakson', address1: '9 Place Bellecour',      address2: '69002 Lyon, France' },
    items: [{ label: 'Badge Chargemap Classic', qty: 1, price: 19.90 }] },
  { id: 'o5', number: '20260430-00170091', date: '30/04/2026', amountTtc: 91.98, status: 'terminee', type: 'Badge',
    paymentMethod: 'Carte bancaire', bu: 'Chargemap',
    recipient: { initials: 'EM', name: 'Élise Moreau',     bu: 'Brakson', address1: '5 Rue des Martyrs',      address2: '38000 Grenoble, France' },
    items: [{ label: 'Pack itinérance', qty: 2, price: 45.99 }] },
  { id: 'o6', number: '20260428-00170076', date: '28/04/2026', amountTtc: 183.96, status: 'validee', type: 'Badge',
    paymentMethod: 'Prélèvement SEPA', bu: 'Cleanrider',
    recipient: { initials: 'TR', name: 'Thomas Roux',      bu: 'Brakson', address1: '21 Cours Lafayette',     address2: '69003 Lyon, France' },
    items: [{ label: 'Badge Chargemap Business', qty: 4, price: 45.99 }] },
  { id: 'o7', number: '20260425-00170059', date: '25/04/2026', amountTtc: 60.49, status: 'expediee', type: 'Badge',
    paymentMethod: 'Prélèvement SEPA', bu: 'Saabre',
    recipient: { initials: 'NR', name: 'Nina Rey',         bu: 'Brakson', address1: '8 Rue Sainte-Catherine', address2: '33000 Bordeaux, France' },
    items: [
      { label: 'Badge Chargemap Business', qty: 1, price: 45.99 },
      { label: 'Carte multi-réseaux',      qty: 1, price: 14.50 },
    ] },
  { id: 'o8', number: '20260422-00170044', date: '22/04/2026', amountTtc: 322.93, status: 'prete', type: 'Licence',
    paymentMethod: 'Carte bancaire', bu: 'Marketing',
    recipient: { initials: 'LB', name: 'Laure Bernard',    bu: 'Brakson', address1: '17 Avenue Foch',         address2: '67000 Strasbourg, France' },
    items: [
      { label: 'Adaptateur Type 2',        qty: 2, price: 89.00 },
      { label: 'Pack itinérance',          qty: 3, price: 45.99 },
      { label: 'Frais de port',            qty: 1, price:  6.96 },
    ] },
  { id: 'o9', number: '20260420-00170033', date: '20/04/2026', amountTtc: 45.99, status: 'terminee', type: 'Badge',
    paymentMethod: 'Prélèvement SEPA', bu: 'Chargemap',
    recipient: { initials: 'JD', name: 'John Doe',         bu: 'Brakson', address1: '7 Allée Cérès',          address2: '67000 Strasbourg, France' },
    items: [{ label: 'Pack itinérance', qty: 1, price: 45.99 }] },
  { id: 'o10', number: '20260417-00170018', date: '17/04/2026', amountTtc: 39.80, status: 'paiement-attente', type: 'Licence',
    paymentMethod: 'Virement bancaire', bu: 'Responsible Ads',
    recipient: { initials: 'JM', name: 'Julien Müller',    bu: 'Brakson', address1: '14 Rue de la Paix',      address2: '13001 Marseille, France' },
    items: [{ label: 'Badge Chargemap Classic', qty: 2, price: 19.90 }] },
  { id: 'o11', number: '20260415-00170006', date: '15/04/2026', amountTtc: 137.97, status: 'expediee', type: 'Badge',
    paymentMethod: 'Carte bancaire', bu: 'Mister EV',
    recipient: { initials: 'AL', name: 'Adrien Laurent',   bu: 'Brakson', address1: '6 Quai Saint-Antoine',   address2: '69005 Lyon, France' },
    items: [{ label: 'Pack itinérance', qty: 3, price: 45.99 }] },
  { id: 'o12', number: '20260412-00169995', date: '12/04/2026', amountTtc: 91.98, status: 'validee', type: 'Badge',
    paymentMethod: 'Prélèvement SEPA', bu: 'Brakson',
    recipient: { initials: 'SG', name: 'Sophie Garcia',    bu: 'Brakson', address1: '23 Avenue Jean Jaurès',  address2: '31000 Toulouse, France' },
    items: [{ label: 'Badge Chargemap Business', qty: 2, price: 45.99 }] },
  { id: 'o13', number: '20260410-00169982', date: '10/04/2026', amountTtc: 29.40, status: 'terminee', type: 'Badge',
    paymentMethod: 'Carte bancaire', bu: 'Cleanrider',
    recipient: { initials: 'MV', name: 'Marc Vidal',       bu: 'Brakson', address1: '11 Rue de la République', address2: '44000 Nantes, France' },
    items: [
      { label: 'Carte multi-réseaux', qty: 2, price: 14.50 },
      { label: 'Frais de port',       qty: 1, price:  0.40 },
    ] },
  { id: 'o14', number: '20260407-00169968', date: '07/04/2026', amountTtc: 45.99, status: 'terminee', type: 'Licence',
    paymentMethod: 'Prélèvement SEPA', bu: 'Chargemap',
    recipient: { initials: 'CD', name: 'Chloé Dupont',     bu: 'Brakson', address1: '4 Rue du Stade',         address2: '59000 Lille, France' },
    items: [{ label: 'Badge Chargemap Business', qty: 1, price: 45.99 }] },
]

const fmtAmount = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// The global Empty-state toggle wipes the order set so the KPIs fall to 0,
// the table shows the first-time empty UI, and the footer hides.
const baseOrders = computed<Order[]>(() => (uiStore.showEmptyState ? [] : orders))

const countByStatus = (s: OrderStatus): number =>
  baseOrders.value.filter(o => o.status === s).length

const kpis = computed(() => [
  { icon: 'identification',      label: 'Badges expédiés',    value: countByStatus('expediee') },
  { icon: 'charging-badge-pass', label: 'Commandes prêtes',   value: countByStatus('prete') },
  { icon: 'car',                 label: 'Commande validé',    value: countByStatus('validee') },
  { icon: 'user-group',          label: 'Paiement en attente', value: countByStatus('paiement-attente') },
])

const search = ref('')
const statusFilter = ref<string>('')
const typeFilter = ref<string>('')
// The all-option label carries the "Statut:/Type:" prefix so the closed
// dropdown reads "Statut: Tous" / "Type: Tous" per Figma 6873-3445.
const statusItems = [
  { value: '',                  label: 'Statut: Tous' },
  { value: 'paiement-attente',  label: 'Paiement en attente' },
  { value: 'validee',           label: 'Validée' },
  { value: 'prete',             label: 'Prête' },
  { value: 'expediee',          label: 'Expédiée' },
  { value: 'terminee',          label: 'Terminée' },
]
const typeItems = [
  { value: '',        label: 'Type: Tous' },
  { value: 'Badge',   label: 'Badge' },
  { value: 'Licence', label: 'Licence' },
]

const filteredOrders = computed(() => {
  const q = search.value.trim().toLowerCase()
  return baseOrders.value.filter((o) => {
    const matchesSearch = !q
      || o.number.toLowerCase().includes(q)
      || o.bu.toLowerCase().includes(q)
      || o.recipient.name.toLowerCase().includes(q)
    const matchesStatus = !statusFilter.value || o.status === statusFilter.value
    const matchesType = !typeFilter.value || o.type === typeFilter.value
    return matchesSearch && matchesStatus && matchesType
  })
})

const page = ref(1)
const perPage = 10
const pageCount = computed(() => Math.max(1, Math.ceil(filteredOrders.value.length / perPage)))
const paginated = computed(() => {
  const start = (page.value - 1) * perPage
  return filteredOrders.value.slice(start, start + perPage)
})
const rangeStart = computed(() => filteredOrders.value.length === 0 ? 0 : (page.value - 1) * perPage + 1)
const rangeEnd = computed(() => Math.min(page.value * perPage, filteredOrders.value.length))

watch([search, statusFilter, typeFilter], () => { page.value = 1 })

const isLoading = ref(true)
onMounted(() => { setTimeout(() => { isLoading.value = false }, 600) })
const skeletonRows = Array.from({ length: 7 }, (_, i) => i)
</script>

<template>
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]">
    <div
      class="mx-auto w-full flex flex-col gap-[32px]"
      :style="{ maxWidth: uiStore.getMaxWidth('/orders') + 'px' }"
    >

      <!-- Page header -->
      <div class="flex items-center gap-[16px] anim-fade-up" style="animation-delay: 0ms">
        <h1 :class="['flex-1 min-w-0', headingClass]">Commandes</h1>
        <Button
          type="primary"
          size="md"
          icon-left="plus"
          label="Commander des badges"
        />
      </div>

      <!-- KPI card — 4 stats, vertical dividers (Figma 6881-2601) -->
      <section
        class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-clip anim-fade-up"
        style="animation-delay: 50ms"
      >
        <div class="flex flex-col md:flex-row">
          <div
            v-for="(kpi, ki) in kpis"
            :key="kpi.label"
            :class="[
              'flex-1 min-w-0 p-[24px] flex flex-col gap-[8px]',
              ki > 0 ? 'border-t md:border-t-0 md:border-l border-border-neutral-tertiary' : '',
            ]"
          >
            <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-brand">
              <Icon :name="kpi.icon" variant="solid" :size="24" class="text-white" />
            </div>
            <div class="flex flex-col min-w-0">
              <p class="font-sans font-semibold text-[24px] leading-[1.5] tracking-[-0.72px] text-text-neutral tabular-nums">
                {{ kpi.value }}
              </p>
              <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                {{ kpi.label }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Table card — toolbar + table + footer (Figma 6873-3449) -->
      <section
        class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-clip anim-fade-up"
        style="animation-delay: 100ms"
      >
        <!-- Toolbar: search left, Statut / Type filters right -->
        <div class="flex flex-col lg:flex-row lg:items-center gap-[16px] p-[16px]">
          <div class="w-full lg:w-[300px]">
            <Input
              v-model="search"
              type="leadingIcon"
              icon="magnifying-glass"
              placeholder="Recherche"
            />
          </div>
          <div class="lg:ml-auto flex flex-col sm:flex-row gap-[12px]">
            <div class="w-full sm:w-[209px]">
              <Dropdown
                v-model="statusFilter"
                :items="statusItems"
                input-type="leadingIcon"
                icon="check-circle"
                :searchable="false"
                :show-label="false"
                :show-hint="false"
                placeholder="Statut: Tous"
                teleport
              />
            </div>
            <div class="w-full sm:w-[209px]">
              <Dropdown
                v-model="typeFilter"
                :items="typeItems"
                input-type="leadingIcon"
                icon="tag"
                :searchable="false"
                :show-label="false"
                :show-hint="false"
                placeholder="Type: Tous"
                teleport
              />
            </div>
          </div>
        </div>

        <!-- Header row -->
        <div class="flex items-stretch w-full bg-neutral-tertiary">
          <div class="flex-1 min-w-0 px-[16px] py-[8px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Numéro</div>
          <div class="flex-1 min-w-0 px-[16px] py-[8px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Date</div>
          <div class="flex-1 min-w-0 px-[16px] py-[8px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Montant</div>
          <div class="flex-1 min-w-0 px-[16px] py-[8px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Statut</div>
          <div class="flex-1 min-w-0 px-[16px] py-[8px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Moyen de paiement</div>
        </div>

        <!-- Skeleton -->
        <template v-if="isLoading">
          <div
            v-for="row in skeletonRows"
            :key="`sk-${row}`"
            class="flex items-stretch w-full min-h-[64px] border-t border-border-neutral-tertiary"
          >
            <div class="flex-1 min-w-0 px-[16px] py-[12px] flex items-center"><Skeleton width="150px" height="14px" /></div>
            <div class="flex-1 min-w-0 px-[16px] py-[12px] flex items-center"><Skeleton width="90px" height="14px" /></div>
            <div class="flex-1 min-w-0 px-[16px] py-[12px] flex items-center"><Skeleton width="70px" height="14px" /></div>
            <div class="flex-1 min-w-0 px-[16px] py-[12px] flex items-center"><Skeleton width="80px" height="20px" rounded="9999px" /></div>
            <div class="flex-1 min-w-0 px-[16px] py-[12px] flex items-center"><Skeleton width="110px" height="14px" /></div>
          </div>
        </template>

        <!-- Empty state — first-time experience (admin Empty-state toggle) -->
        <div
          v-else-if="uiStore.showEmptyState"
          class="min-h-[400px] flex flex-col items-center justify-center gap-[16px] p-[16px] text-center"
        >
          <div class="flex flex-col items-center">
            <img
              src="~/assets/illustrations/empty-orders.svg"
              alt=""
              width="200"
              height="200"
              class="size-[200px] shrink-0 -mb-[16px] select-none pointer-events-none"
              draggable="false"
            />
            <div class="flex flex-col items-center gap-[4px]">
              <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                Aucune commande pour le moment
              </p>
              <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Consulter ici le détails de vos commandes de badges et licences
              </p>
            </div>
          </div>
        </div>

        <!-- Filter empty -->
        <div
          v-else-if="!filteredOrders.length"
          class="min-h-[200px] flex items-center justify-center px-[16px] py-[24px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary text-center"
        >
          Aucune commande ne correspond à ces critères.
        </div>

        <!-- Rows -->
        <template v-else>
          <div
            v-for="order in paginated"
            :key="order.id"
            class="flex items-stretch w-full min-h-[64px] border-t border-border-neutral-tertiary transition-colors duration-150 ease-out motion-reduce:transition-none hover:bg-neutral-secondary"
          >
            <div class="flex-1 min-w-0 px-[16px] py-[12px] flex items-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
              {{ order.number }}
            </div>
            <div class="flex-1 min-w-0 px-[16px] py-[12px] flex items-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums">
              {{ order.date }}
            </div>
            <div class="flex-1 min-w-0 px-[16px] py-[12px] flex items-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums">
              {{ fmtAmount(order.amountTtc) }} €
            </div>
            <div class="flex-1 min-w-0 px-[16px] py-[12px] flex items-center">
              <span class="inline-flex items-center justify-center px-[8px] py-[2px] rounded-[16px] border bg-[var(--bg-accent-gray)] border-[var(--border-accent-gray)] font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-[var(--text-accent-gray)] whitespace-nowrap">
                {{ VARIANTS[order.status].label }}
              </span>
            </div>
            <div class="flex-1 min-w-0 px-[16px] py-[12px] flex items-center font-sans text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
              {{ order.paymentMethod }}
            </div>
          </div>
        </template>

        <!-- Footer pagination -->
        <TableFooter
          v-if="!isLoading && filteredOrders.length"
          :page="page"
          :page-count="pageCount"
          :range-start="rangeStart"
          :range-end="rangeEnd"
          :total="filteredOrders.length"
          class="border-t border-border-neutral-tertiary"
          @update:page="(n: number) => (page = n)"
        />
      </section>

    </div>
  </div>
</template>
