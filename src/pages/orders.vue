<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { V1_PAGE_HEADING } from '../utils/typography'

type OrderStatus = 'paiement-attente' | 'validee' | 'prete' | 'expediee' | 'terminee'

interface CartItem { label: string; qty: number; price: number }
interface Recipient { initials: string; name: string; bu: string; address1: string; address2: string }
interface Order {
  id: string
  number: string
  date: string
  amountTtc: number
  status: OrderStatus
  paymentMethod: string
  bu: string
  recipient: Recipient
  items: CartItem[]
}

// Fixed 4-step journey shown in the right-hand "Étapes" card. Each step is
// rendered with a check icon if its index ≤ the order's reached step,
// otherwise with a clock icon (still upcoming).
const STEPS = [
  { title: 'Paiement en attente', description: 'Validation du paiement, cela peut prendre quelques jours' },
  { title: 'Commande validé',     description: 'La commande est prête à être préparée' },
  { title: 'Commande prête',      description: 'Commande préparée, badges visibles sur l’interface' },
  { title: 'Expedition',          description: 'Commande expédié, lien de suivi disponible' },
] as const

const stepReached: Record<OrderStatus, number> = {
  'paiement-attente': 0,
  'validee':          1,
  'prete':            2,
  'expediee':         3,
  'terminee':         3,
}

interface StatusVariant { label: string; bg: string; border: string; text: string }
// Pill colors taken verbatim from Figma (5667-21229) — accent-gray / cyan /
// turquoise / brand-purple. Same set is reused for the larger "Statut" badge
// in the Informations card (only padding & font-size differ).
const VARIANTS: Record<OrderStatus, StatusVariant> = {
  'paiement-attente': { label: 'Paiement en attente', bg: 'bg-[#fafafa]', border: 'border-[#e4e4e7]', text: 'text-[#48566a]' },
  'validee':          { label: 'Validée',             bg: 'bg-[#ebfeff]', border: 'border-[#a6f4fc]', text: 'text-[#088eaf]' },
  'prete':            { label: 'Prête',               bg: 'bg-[#f2fdf9]', border: 'border-[#bdfae3]', text: 'text-[#18b97e]' },
  'expediee':         { label: 'Expédiée',            bg: 'bg-[#f6f5ff]', border: 'border-[#c3b4fd]', text: 'text-[#7c3bed]' },
  'terminee':         { label: 'Terminée',            bg: 'bg-[#fafafa]', border: 'border-[#e4e4e7]', text: 'text-[#48566a]' },
}

const orders: Order[] = [
  { id: 'o1', number: '20260417-00169850', date: '06/05/2026', amountTtc: 5.13, status: 'expediee',
    paymentMethod: 'Prélèvement SEPA', bu: 'Chargemap',
    recipient: { initials: 'JD', name: 'John Doe',      bu: 'Brakson', address1: '7 Allée Ceres',         address2: '67000 Strasbourg, France' },
    items: [
      { label: 'Pack itinérance',          qty: 1, price: 45.99 },
      { label: 'Badge Chargemap Business', qty: 1, price: 45.99 },
    ] },
  { id: 'o2', number: '20260416-00169849', date: '05/05/2026', amountTtc: 5.13, status: 'validee',
    paymentMethod: 'Prélèvement SEPA', bu: 'Saabre',
    recipient: { initials: 'AM', name: 'Anne Martin',   bu: 'Brakson', address1: '12 Rue du Marché',      address2: '69001 Lyon, France' },
    items: [{ label: 'Badge Chargemap Business', qty: 2, price: 45.99 }] },
  { id: 'o3', number: '20260415-00169848', date: '04/05/2026', amountTtc: 5.13, status: 'validee',
    paymentMethod: 'Carte bancaire',   bu: 'Chargemap',
    recipient: { initials: 'PD', name: 'Pierre Durand', bu: 'Brakson', address1: '3 Boulevard Haussmann', address2: '75009 Paris, France' },
    items: [{ label: 'Pack itinérance', qty: 1, price: 45.99 }] },
  { id: 'o4', number: '20260414-00169847', date: '04/05/2026', amountTtc: 5.13, status: 'prete',
    paymentMethod: 'Prélèvement SEPA', bu: 'Mister EV',
    recipient: { initials: 'CL', name: 'Camille Leroy', bu: 'Brakson', address1: '9 Place Bellecour',     address2: '69002 Lyon, France' },
    items: [
      { label: 'Pack itinérance',          qty: 2, price: 45.99 },
      { label: 'Badge Chargemap Business', qty: 1, price: 45.99 },
    ] },
  { id: 'o5', number: '20260410-00169846', date: '03/05/2026', amountTtc: 5.13, status: 'paiement-attente',
    paymentMethod: 'Prélèvement SEPA', bu: 'Brakson',
    recipient: { initials: 'JD', name: 'John Doe',      bu: 'Brakson', address1: '7 Allée Ceres',         address2: '67000 Strasbourg, France' },
    items: [{ label: 'Badge Chargemap Business', qty: 1, price: 45.99 }] },
  { id: 'o6', number: '20260409-00169845', date: '03/05/2026', amountTtc: 5.13, status: 'terminee',
    paymentMethod: 'Carte bancaire',   bu: 'Chargemap',
    recipient: { initials: 'AM', name: 'Anne Martin',   bu: 'Brakson', address1: '12 Rue du Marché',      address2: '69001 Lyon, France' },
    items: [{ label: 'Pack itinérance', qty: 3, price: 45.99 }] },
  { id: 'o7', number: '20260405-00169844', date: '02/05/2026', amountTtc: 5.13, status: 'expediee',
    paymentMethod: 'Prélèvement SEPA', bu: 'Cleanrider',
    recipient: { initials: 'TR', name: 'Thomas Roux',   bu: 'Brakson', address1: '21 Cours Lafayette',    address2: '69003 Lyon, France' },
    items: [{ label: 'Badge Chargemap Business', qty: 4, price: 45.99 }] },
  { id: 'o8', number: '20260402-00169843', date: '02/05/2026', amountTtc: 5.13, status: 'terminee',
    paymentMethod: 'Prélèvement SEPA', bu: 'Chargemap',
    recipient: { initials: 'EM', name: 'Élise Moreau',  bu: 'Brakson', address1: '5 Rue des Martyrs',     address2: '38000 Grenoble, France' },
    items: [{ label: 'Pack itinérance', qty: 1, price: 45.99 }] },
  { id: 'o9', number: '20260330-00169842', date: '01/05/2026', amountTtc: 5.13, status: 'validee',
    paymentMethod: 'Carte bancaire',   bu: 'Chargemap',
    recipient: { initials: 'JD', name: 'John Doe',      bu: 'Brakson', address1: '7 Allée Ceres',         address2: '67000 Strasbourg, France' },
    items: [{ label: 'Badge Chargemap Business', qty: 2, price: 45.99 }] },
  { id: 'o10', number: '20260328-00169841', date: '30/04/2026', amountTtc: 5.13, status: 'prete',
    paymentMethod: 'Prélèvement SEPA', bu: 'Marketing',
    recipient: { initials: 'LB', name: 'Laure Bernard', bu: 'Brakson', address1: '17 Avenue Foch',        address2: '67000 Strasbourg, France' },
    items: [{ label: 'Pack itinérance', qty: 1, price: 45.99 }] },
  { id: 'o11', number: '20260326-00169840', date: '28/04/2026', amountTtc: 5.13, status: 'expediee',
    paymentMethod: 'Prélèvement SEPA', bu: 'Responsible Ads',
    recipient: { initials: 'NR', name: 'Nina Rey',      bu: 'Brakson', address1: '8 Rue Sainte-Catherine', address2: '33000 Bordeaux, France' },
    items: [{ label: 'Pack itinérance', qty: 1, price: 45.99 }] },
  { id: 'o12', number: '20260324-00169839', date: '26/04/2026', amountTtc: 5.13, status: 'terminee',
    paymentMethod: 'Carte bancaire',   bu: 'Chargemap',
    recipient: { initials: 'JD', name: 'John Doe',      bu: 'Brakson', address1: '7 Allée Ceres',         address2: '67000 Strasbourg, France' },
    items: [{ label: 'Badge Chargemap Business', qty: 1, price: 45.99 }] },
]

const fmtAmount = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const search = ref('')
const statusFilter = ref<string>('')
const statusItems = [
  { value: '',                  label: 'Tous' },
  { value: 'paiement-attente',  label: 'Paiement en attente' },
  { value: 'validee',           label: 'Validée' },
  { value: 'prete',             label: 'Prête' },
  { value: 'expediee',          label: 'Expédiée' },
  { value: 'terminee',          label: 'Terminée' },
]

const filteredOrders = computed(() => {
  const q = search.value.trim().toLowerCase()
  return orders.filter(o => {
    const matchesSearch = !q
      || o.number.toLowerCase().includes(q)
      || o.bu.toLowerCase().includes(q)
      || o.recipient.name.toLowerCase().includes(q)
    const matchesStatus = !statusFilter.value || o.status === statusFilter.value
    return matchesSearch && matchesStatus
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

const selectedId = ref<string>(orders[0].id)
const selected = computed(() => orders.find(o => o.id === selectedId.value) ?? null)

// When the active filter / search hides the currently-selected order, fall
// back to the first visible one so the detail panel never shows an order
// that's no longer in the list. If nothing matches, leave selection alone
// so the most recent context stays visible until the user changes filters.
watch(filteredOrders, (filtered) => {
  if (filtered.length && !filtered.find(o => o.id === selectedId.value)) {
    selectedId.value = filtered[0].id
  }
}, { flush: 'post' })

watch([search, statusFilter], () => { page.value = 1 })

const isLoading = ref(true)
onMounted(() => { setTimeout(() => { isLoading.value = false }, 600) })
const skeletonRows = Array.from({ length: 7 }, (_, i) => i)
</script>

<template>
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]">
    <div class="mx-auto w-full max-w-[2560px] flex flex-col gap-[32px]">

      <!-- Page header -->
      <div
        class="flex items-center gap-[16px] anim-fade-up"
        style="animation-delay: 0ms"
      >
        <h1 :class="['flex-1 min-w-0', V1_PAGE_HEADING]">Commandes</h1>
        <Button
          type="primary"
          size="md"
          icon-left="plus"
          label="Nouvelle commande"
        />
      </div>

      <!-- Master / detail grid. Left ~37.5%, right ~62.5% (Figma 0.6fr/1fr).
           Below xl the layout collapses to a single column so the detail
           panel falls underneath the list — keeps everything readable on
           narrower screens without forcing horizontal scroll. -->
      <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)] gap-[32px] items-start">

        <!-- ─── Master: orders list ─────────────────────────────────────── -->
        <section
          class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-clip flex flex-col anim-fade-up"
          style="animation-delay: 60ms"
        >
          <!-- Sticky header with search + state filter -->
          <div class="sticky top-0 z-[2] bg-neutral border-b border-border-neutral-secondary p-[16px] flex flex-col gap-[16px]">
            <Input
              v-model="search"
              type="leadingIcon"
              icon="magnifying-glass"
              placeholder="Recherche"
            />
            <Dropdown
              v-model="statusFilter"
              :items="statusItems"
              input-type="leadingIcon"
              icon="check-circle"
              :searchable="false"
              placeholder="États: Tous"
              :show-label="false"
              :show-hint="false"
            />
          </div>

          <!-- List body -->
          <div class="p-[16px] flex flex-col">
            <!-- Skeleton state -->
            <template v-if="isLoading">
              <template v-for="(row, ri) in skeletonRows" :key="`sk-${row}`">
                <div v-if="ri > 0" class="h-px w-full bg-border-neutral-tertiary my-[12px]" />
                <div class="flex items-center gap-[16px] p-[12px]">
                  <div class="flex-1 flex flex-col gap-[8px] min-w-0">
                    <Skeleton width="160px" height="14px" />
                    <div class="flex items-center gap-[8px]">
                      <Skeleton width="80px" height="20px" rounded="9999px" />
                      <Skeleton width="80px" height="20px" rounded="9999px" />
                    </div>
                  </div>
                  <Skeleton width="48px" height="14px" />
                </div>
              </template>
            </template>

            <!-- Empty state -->
            <div
              v-else-if="!filteredOrders.length"
              class="flex items-center justify-center min-h-[200px] px-[16px] py-[24px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary"
            >
              Aucune commande ne correspond à ces critères.
            </div>

            <!-- Order rows -->
            <template v-else>
              <template v-for="(order, oi) in paginated" :key="order.id">
                <div v-if="oi > 0" class="h-px w-full bg-border-neutral-tertiary my-[12px]" />
                <button
                  type="button"
                  :class="[
                    'flex items-center gap-[16px] p-[12px] rounded-[12px] w-full text-left outline-none',
                    'transition-colors duration-150 ease-out hover:bg-neutral-secondary focus-visible:shadow-ring-gray motion-reduce:transition-none',
                    selectedId === order.id ? 'bg-neutral-secondary' : 'bg-neutral',
                  ]"
                  @click="selectedId = order.id"
                >
                  <div class="flex-1 min-w-0 flex flex-col gap-[8px] items-start">
                    <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate w-full">
                      #{{ order.number }}
                    </p>
                    <div class="flex items-center gap-[8px] w-full">
                      <span class="inline-flex items-center justify-center px-[8px] py-[2px] rounded-full border bg-[#fafafa] border-[#e4e4e7] font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-[#48566a] whitespace-nowrap">
                        {{ order.date }}
                      </span>
                      <span
                        :class="[
                          'inline-flex items-center justify-center px-[8px] py-[2px] rounded-full border font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] whitespace-nowrap',
                          VARIANTS[order.status].bg,
                          VARIANTS[order.status].border,
                          VARIANTS[order.status].text,
                        ]"
                      >
                        {{ VARIANTS[order.status].label }}
                      </span>
                    </div>
                  </div>
                  <p class="shrink-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                    {{ fmtAmount(order.amountTtc) }} €
                  </p>
                </button>
              </template>
            </template>
          </div>

          <!-- Footer pagination (inside the card) -->
          <TableFooter
            v-if="!isLoading && filteredOrders.length"
            :page="page"
            :page-count="pageCount"
            :range-start="rangeStart"
            :range-end="rangeEnd"
            :total="filteredOrders.length"
            @update:page="(n: number) => (page = n)"
          />
        </section>

        <!-- ─── Detail: selected order ──────────────────────────────────── -->
        <section
          class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-clip flex flex-col anim-fade-up"
          style="animation-delay: 100ms"
        >
          <!-- Sticky header -->
          <div class="sticky top-0 z-[2] bg-neutral border-b border-border-neutral-secondary px-[16px] py-[16px] flex items-center gap-[16px]">
            <p class="flex-1 min-w-0 font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
              Détails de la commande
            </p>
            <Button
              type="secondary"
              size="sm"
              icon-left="arrow-down-tray"
              label="Facture"
              :disabled="!selected"
            />
          </div>

          <!-- Body — cross-fades when the selected order changes -->
          <div class="relative">
            <Transition
              mode="out-in"
              enter-active-class="transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              enter-from-class="opacity-0 translate-y-[6px]"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-[4px]"
            >
              <div
                v-if="isLoading"
                key="skeleton"
                class="p-[16px] flex flex-col gap-[16px]"
              >
                <div
                  v-for="i in 4"
                  :key="i"
                  class="bg-neutral border border-border-neutral-secondary rounded-[16px]"
                >
                  <div class="border-b border-border-neutral-secondary px-[16px] py-[20px]">
                    <Skeleton width="120px" height="20px" />
                  </div>
                  <div class="p-[16px] flex flex-col gap-[12px]">
                    <Skeleton width="80%" height="16px" />
                    <Skeleton width="60%" height="14px" />
                    <Skeleton width="70%" height="14px" />
                  </div>
                </div>
              </div>

              <div
                v-else-if="selected"
                :key="selected.id"
                class="p-[16px] flex flex-col gap-[16px]"
              >
                <!-- ── Étapes ────────────────────────────────────────────── -->
                <article class="bg-neutral border border-border-neutral-secondary rounded-[16px] overflow-clip">
                  <header class="border-b border-border-neutral-secondary px-[16px] min-h-[69px] flex items-center">
                    <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                      Étapes
                    </p>
                  </header>
                  <div class="p-[16px]">
                    <ol class="flex flex-col">
                      <li
                        v-for="(step, si) in STEPS"
                        :key="si"
                        :class="[
                          'flex gap-[8px] items-start relative',
                          si < STEPS.length - 1 ? 'pb-[32px]' : '',
                        ]"
                      >
                        <div
                          :class="[
                            'size-[32px] shrink-0 rounded-[8px] flex items-center justify-center',
                            si <= stepReached[selected.status] ? 'bg-[#f7fee7]' : 'bg-[#f8fafc]',
                          ]"
                        >
                          <Icon
                            :name="si <= stepReached[selected.status] ? 'check-circle' : 'clock'"
                            variant="solid"
                            :size="16"
                            :class="si <= stepReached[selected.status] ? 'text-[#65a30d]' : 'text-[#48566a]'"
                          />
                        </div>
                        <!-- Vertical connector to next step icon -->
                        <span
                          v-if="si < STEPS.length - 1"
                          aria-hidden="true"
                          class="absolute left-[15.5px] top-[36px] bottom-[4px] w-px bg-border-neutral-secondary"
                        />
                        <div class="flex-1 min-w-0 flex flex-col gap-[4px]">
                          <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                            {{ step.title }}
                          </p>
                          <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                            {{ step.description }}
                          </p>
                        </div>
                      </li>
                    </ol>
                  </div>
                </article>

                <!-- ── Commande (cart items) ────────────────────────────── -->
                <article class="bg-neutral border border-border-neutral-secondary rounded-[16px] overflow-clip">
                  <header class="border-b border-border-neutral-secondary px-[16px] min-h-[69px] flex items-center">
                    <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                      Commande
                    </p>
                  </header>
                  <div class="p-[16px] flex flex-col">
                    <template v-for="(item, ii) in selected.items" :key="ii">
                      <div v-if="ii > 0" class="h-px w-full bg-border-neutral-tertiary my-[16px]" />
                      <div class="flex items-center gap-[24px] w-full">
                        <p class="flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                          {{ item.label }}
                        </p>
                        <p class="flex-1 min-w-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
                          Quantité {{ item.qty }}
                        </p>
                        <p class="shrink-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral text-right whitespace-nowrap tabular-nums">
                          {{ fmtAmount(item.price) }} €
                        </p>
                      </div>
                    </template>
                  </div>
                </article>

                <!-- ── Informations ─────────────────────────────────────── -->
                <article class="bg-neutral border border-border-neutral-secondary rounded-[16px] overflow-clip">
                  <header class="border-b border-border-neutral-secondary px-[16px] min-h-[69px] flex items-center">
                    <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                      Informations
                    </p>
                  </header>
                  <div class="p-[16px] flex flex-col">
                    <!-- Statut row (badge value) -->
                    <div class="flex items-center justify-between py-[2px] gap-[16px]">
                      <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                        Statut
                      </p>
                      <span
                        :class="[
                          'inline-flex items-center justify-center px-[10px] py-[2px] rounded-full border font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] whitespace-nowrap',
                          VARIANTS[selected.status].bg,
                          VARIANTS[selected.status].border,
                          VARIANTS[selected.status].text,
                        ]"
                      >
                        {{ VARIANTS[selected.status].label }}
                      </span>
                    </div>
                    <div class="h-px w-full bg-border-neutral-tertiary my-[16px]" />
                    <div class="flex items-center justify-between py-[2px] gap-[16px]">
                      <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                        Numéro de commande
                      </p>
                      <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral text-right truncate">
                        {{ selected.number }}
                      </p>
                    </div>
                    <div class="h-px w-full bg-border-neutral-tertiary my-[16px]" />
                    <div class="flex items-center justify-between py-[2px] gap-[16px]">
                      <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                        Moyen de paiement
                      </p>
                      <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral text-right truncate">
                        {{ selected.paymentMethod }}
                      </p>
                    </div>
                    <div class="h-px w-full bg-border-neutral-tertiary my-[16px]" />
                    <div class="flex items-center justify-between py-[2px] gap-[16px]">
                      <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                        Business unit
                      </p>
                      <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral text-right truncate">
                        {{ selected.bu }}
                      </p>
                    </div>
                  </div>
                </article>

                <!-- ── Livraison / facturation ──────────────────────────── -->
                <article class="bg-neutral border border-border-neutral-secondary rounded-[16px] overflow-clip">
                  <header class="border-b border-border-neutral-secondary px-[16px] min-h-[69px] flex items-center">
                    <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                      Livraison / facturation
                    </p>
                  </header>
                  <div class="p-[16px]">
                    <div class="flex items-center gap-[16px] w-full">
                      <div class="size-[40px] shrink-0 rounded-full bg-neutral-secondary border border-border-neutral flex items-center justify-center">
                        <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                          {{ selected.recipient.initials }}
                        </span>
                      </div>
                      <div class="flex-1 min-w-0 flex flex-col gap-[2px]">
                        <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral truncate">
                          {{ selected.recipient.name }}
                        </p>
                        <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
                          {{ selected.recipient.bu }}
                        </p>
                      </div>
                      <div class="flex-1 min-w-0 flex flex-col font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral text-right">
                        <p class="truncate">{{ selected.recipient.address1 }}</p>
                        <p class="truncate">{{ selected.recipient.address2 }}</p>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </Transition>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>
