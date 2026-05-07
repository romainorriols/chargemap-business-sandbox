<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
type OrderStatus = 'en-cours' | 'traitee' | 'en-attente'

interface Order {
  id: string
  number: string
  orga: string
  bu: string
  date: string
  badges: number
  amountHt: number
  status: OrderStatus
}

// Seeded dataset — mirrors the Figma mock (node 4997-69446): most orders are "En cours"
// and "Traitée", with a single "Paiement en attente" to surface the orange state.
const orders = ref<Order[]>([
  { id: 'o1',  number: '20260417-00169850', orga: 'Brakson', bu: 'Chargemap',    date: '11/04/2026', badges: 3, amountHt: 4.92,  status: 'en-cours'   },
  { id: 'o2',  number: '20260416-00169849', orga: 'Brakson', bu: 'Chargemap',    date: '10/04/2026', badges: 2, amountHt: 9.84,  status: 'en-cours'   },
  { id: 'o3',  number: '20260415-00169848', orga: 'Brakson', bu: 'Saabre',       date: '09/04/2026', badges: 5, amountHt: 24.60, status: 'en-cours'   },
  { id: 'o4',  number: '20260414-00169847', orga: 'Brakson', bu: 'Chargemap',    date: '08/04/2026', badges: 1, amountHt: 4.92,  status: 'en-cours'   },
  { id: 'o5',  number: '20260410-00169846', orga: 'Brakson', bu: 'Brakson',      date: '04/04/2026', badges: 4, amountHt: 19.68, status: 'en-attente' },
  { id: 'o6',  number: '20260409-00169845', orga: 'Brakson', bu: 'Chargemap',    date: '03/04/2026', badges: 3, amountHt: 14.76, status: 'traitee'    },
  { id: 'o7',  number: '20260405-00169844', orga: 'Brakson', bu: 'Mister EV',    date: '30/03/2026', badges: 2, amountHt: 9.84,  status: 'traitee'    },
  { id: 'o8',  number: '20260402-00169843', orga: 'Brakson', bu: 'Chargemap',    date: '27/03/2026', badges: 6, amountHt: 29.52, status: 'traitee'    },
  { id: 'o9',  number: '20260330-00169842', orga: 'Brakson', bu: 'Brakson',      date: '24/03/2026', badges: 1, amountHt: 4.92,  status: 'traitee'    },
  { id: 'o10', number: '20260328-00169841', orga: 'Brakson', bu: 'Chargemap',    date: '22/03/2026', badges: 3, amountHt: 14.76, status: 'traitee'    },
])

interface StatusConfig {
  label: string
  bg: string
  border: string
  text: string
}

// Pill tokens reused from Billing.vue so semantics read the same across the app.
const statusConfig = (s: OrderStatus): StatusConfig => {
  switch (s) {
    case 'en-cours':
      return { label: 'En cours',           bg: 'bg-[#fafafa]', border: 'border-[#e4e4e7]', text: 'text-[#48566a]' }
    case 'traitee':
      return { label: 'Traitée',            bg: 'bg-[#f2fdf9]', border: 'border-[#bdfae3]', text: 'text-[#18b97e]' }
    case 'en-attente':
      return { label: 'Paiement en attente', bg: 'bg-[#fff6eb]', border: 'border-[#fed6a9]', text: 'text-[#e9590c]' }
  }
}

const fmtAmount = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// KPI sums are derived from the current order set so filtering (future) will
// automatically keep the cards honest. For now the values match the Figma mock.
const kpiBadges = computed(() =>
  orders.value.filter(o => o.status === 'en-cours').reduce((sum, o) => sum + o.badges, 0),
)
const kpiEnCours = computed(() => orders.value.filter(o => o.status === 'en-cours').length)
const kpiEnAttente = computed(() => orders.value.filter(o => o.status === 'en-attente').length)

// Search across numéro / orga / BU — keystrokes filter the table live.
const search = ref('')
const statusFilter = ref<string>('')
// Empty-string "Tous" clears the model so the trigger falls back to the
// "États: Tous" placeholder once the user selects it again.
const statusItems = [
  { value: '',           label: 'Tous' },
  { value: 'en-cours',   label: 'En cours' },
  { value: 'traitee',    label: 'Traitées' },
  { value: 'en-attente', label: 'Paiement en attente' },
]

const filteredOrders = computed(() => {
  const q = search.value.trim().toLowerCase()
  return orders.value.filter(o => {
    const matchesSearch = !q
      || o.number.toLowerCase().includes(q)
      || o.orga.toLowerCase().includes(q)
      || o.bu.toLowerCase().includes(q)
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

// Simulated loading — the sandbox has no real fetch, so we fake ~600ms on mount
// to exercise the skeleton states. Switch to a real promise when wiring an API.
const isLoading = ref(true)
onMounted(() => {
  setTimeout(() => { isLoading.value = false }, 600)
})
const skeletonRows = Array.from({ length: 8 }, (_, i) => i)
</script>

<template>
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]">
    <div class="mx-auto w-full max-w-[2560px] flex flex-col gap-[32px]">

      <!-- Page header -->
      <h1
        :class="['anim-fade-up', V1_PAGE_HEADING]"
        style="animation-delay: 0ms"
      >
        Commandes
      </h1>

      <!-- KPI card — single container, 3 sections separated by vertical dividers.
           Icon box 37×37, rounded-12, white glyph on purple / orange backgrounds. -->
      <section
        class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm anim-fade-up"
        style="animation-delay: 40ms"
      >
        <div class="flex items-stretch w-full">
          <div class="flex-1 min-w-0 px-[24px] py-[24px] flex flex-col gap-[12px]">
            <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#6467f2]">
              <Icon name="truck" variant="solid" :size="24" class="text-white" />
            </div>
            <div class="flex flex-col">
              <Skeleton v-if="isLoading" width="48px" height="28px" class="my-[4px]" />
              <p v-else class="font-heading font-semibold text-[24px] leading-[1.5] tracking-[-0.72px] text-text-neutral">
                {{ kpiBadges }}
              </p>
              <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Badges en cours de livraison
              </p>
            </div>
          </div>
          <div class="w-px bg-border-neutral-secondary my-[24px]" />
          <div class="flex-1 min-w-0 px-[24px] py-[24px] flex flex-col gap-[12px]">
            <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#6467f2]">
              <Icon name="clock" variant="solid" :size="24" class="text-white" />
            </div>
            <div class="flex flex-col">
              <Skeleton v-if="isLoading" width="40px" height="28px" class="my-[4px]" />
              <p v-else class="font-heading font-semibold text-[24px] leading-[1.5] tracking-[-0.72px] text-text-neutral">
                {{ kpiEnCours }}
              </p>
              <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Commandes en cours
              </p>
            </div>
          </div>
          <div class="w-px bg-border-neutral-secondary my-[24px]" />
          <div class="flex-1 min-w-0 px-[24px] py-[24px] flex flex-col gap-[12px]">
            <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#f97415]">
              <Icon name="credit-card" variant="solid" :size="24" class="text-white" />
            </div>
            <div class="flex flex-col">
              <Skeleton v-if="isLoading" width="32px" height="28px" class="my-[4px]" />
              <p v-else class="font-heading font-semibold text-[24px] leading-[1.5] tracking-[-0.72px] text-text-neutral">
                {{ kpiEnAttente }}
              </p>
              <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Paiement en attente
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Toolbar — Figma 4832-35736: search + dropdown with 8px outer gap.
           Stacks full-width below sm. relative + z-20 so the Dropdown's
           absolutely-positioned menu paints above the table that follows. -->
      <div
        class="relative z-20 w-full flex flex-col sm:flex-row sm:items-center gap-[8px] flex-wrap anim-fade-up"
        style="animation-delay: 80ms"
      >
        <div class="w-full sm:w-[311px]">
          <Input
            v-model="search"
            type="leadingIcon"
            icon="magnifying-glass"
            placeholder="Recherche"
          />
        </div>
        <div class="w-full sm:w-[250px]">
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
      </div>

      <!-- Orders table — pulled up so gap to the toolbar is 16px (parent gap is 40px). -->
      <section
        class="w-full -mt-[24px] bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm overflow-clip anim-fade-up"
        style="animation-delay: 120ms"
      >
      <!-- Header row -->
      <div class="flex items-center w-full bg-neutral-tertiary">
        <div class="flex-[1.3] min-w-0 px-[16px] py-[12px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
          Numéro
        </div>
        <div class="flex-[1.3] min-w-0 px-[16px] py-[12px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
          Organisation / BU
        </div>
        <div class="flex-[1] min-w-0 px-[16px] py-[12px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
          Date
        </div>
        <div class="flex-[1] min-w-0 px-[16px] py-[12px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
          Nombre de badges
        </div>
        <div class="flex-[1] min-w-0 px-[16px] py-[12px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
          Montant HT
        </div>
        <div class="w-[180px] shrink-0 px-[16px] py-[12px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
          État
        </div>
      </div>

      <!-- Skeleton rows while loading -->
      <div v-if="isLoading" class="flex flex-col">
        <div
          v-for="(row, ri) in skeletonRows"
          :key="`sk-${row}`"
          :class="[
            'flex items-center w-full min-h-[64px]',
            ri < skeletonRows.length - 1 ? 'border-b border-[#f1f5f9]' : '',
          ]"
        >
          <div class="flex-[1.3] min-w-0 px-[16px] py-[12px]">
            <Skeleton width="160px" height="14px" />
          </div>
          <div class="flex-[1.3] min-w-0 px-[16px] py-[12px] flex flex-col gap-[6px]">
            <Skeleton width="80px" height="14px" />
            <Skeleton width="110px" height="14px" />
          </div>
          <div class="flex-[1] min-w-0 px-[16px] py-[12px]">
            <Skeleton width="90px" height="14px" />
          </div>
          <div class="flex-[1] min-w-0 px-[16px] py-[12px]">
            <Skeleton width="24px" height="14px" />
          </div>
          <div class="flex-[1] min-w-0 px-[16px] py-[12px]">
            <Skeleton width="70px" height="14px" />
          </div>
          <div class="w-[180px] shrink-0 px-[16px] py-[12px]">
            <Skeleton width="96px" height="22px" rounded="9999px" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!filteredOrders.length"
        class="flex items-center justify-center min-h-[200px] px-[16px] py-[24px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary"
      >
        Aucune commande ne correspond à ces critères.
      </div>

      <!-- Body rows -->
      <TransitionGroup
        v-else
        name="orders-row"
        tag="div"
        class="flex flex-col"
        move-class="transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
      >
        <div
          v-for="(order, oi) in paginated"
          :key="order.id"
          :class="[
            'flex items-center w-full min-h-[64px] transition-colors duration-150 ease-out hover:bg-neutral-secondary',
            oi < paginated.length - 1 ? 'border-b border-[#f1f5f9]' : '',
          ]"
        >
          <div class="flex-[1.3] min-w-0 px-[16px] py-[12px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
            {{ order.number }}
          </div>
          <div class="flex-[1.3] min-w-0 px-[16px] py-[12px] flex flex-col font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
            <a href="#" class="font-normal text-[#1e40af] hover:underline truncate">{{ order.orga }}</a>
            <a href="#" class="font-normal text-[#1e40af] hover:underline truncate">{{ order.bu }}</a>
          </div>
          <div class="flex-[1] min-w-0 px-[16px] py-[12px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
            {{ order.date }}
          </div>
          <div class="flex-[1] min-w-0 px-[16px] py-[12px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums">
            {{ order.badges }}
          </div>
          <div class="flex-[1] min-w-0 px-[16px] py-[12px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums whitespace-nowrap">
            {{ fmtAmount(order.amountHt) }} €
          </div>
          <div class="w-[180px] shrink-0 px-[16px] py-[12px]">
            <span
              :class="[
                'inline-flex items-center justify-center px-[10px] py-[2px] rounded-full border font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] whitespace-nowrap',
                statusConfig(order.status).bg,
                statusConfig(order.status).border,
                statusConfig(order.status).text,
              ]"
            >
              {{ statusConfig(order.status).label }}
            </span>
          </div>
        </div>
      </TransitionGroup>

      <!-- Footer inside the card -->
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

    </div>
  </div>
</template>

<style scoped>
.orders-row-enter-active,
.orders-row-leave-active {
  transition: opacity 200ms ease, transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
}
.orders-row-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.orders-row-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.orders-row-leave-active {
  position: relative;
}
</style>
