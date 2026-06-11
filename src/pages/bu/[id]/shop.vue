<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { DropdownItem } from '~/components/ui/DropdownMenu.vue'
import mastercardLogo from '@/assets/illustrations/checkout/mastercard.png'
import visaLogo from '@/assets/illustrations/checkout/visa.png'

const headingClass = usePageHeadingClass()

const busStore = useBusStore()

// ─── Cart (seed) ────────────────────────────────────────────────────────────
// `qty` is the number of vehicles a pack is assigned to — it doesn't multiply
// the pack price, so the total stays the sum of the listed pack prices
// (45,99 + 78,99 = 124,98 €), matching the Figma.
const cart = reactive([
  { id: 'itinerance', name: 'Pack itinérance', price: '45,99 €', qty: '2' },
  { id: 'recharge', name: "Pack recharge sur site d'entreprise", price: '78,99 €', qty: '2' },
])

const qtyItems: DropdownItem[] = Array.from({ length: 9 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

const selectedMethod = ref<'prelevement' | 'cb'>('prelevement')

const toast = reactive<{ visible: boolean; title: string; description: string }>({
  visible: false,
  title: '',
  description: '',
})
let toastTimer: ReturnType<typeof setTimeout> | null = null

const currentBu = computed(() => busStore.bus.find(b => b.id === busStore.selectedBuId) ?? null)
const deliveryName = computed<string>(() => currentBu.value?.name ?? 'Fleet 2000')

const parsePrice = (p: string): number => Number(p.replace(/[^\d,]/g, '').replace(',', '.'))
const formatPrice = (n: number): string =>
  `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const totalHT = computed<string>(() =>
  formatPrice(cart.reduce((sum, line) => sum + parsePrice(line.price), 0)),
)

const methodLabel = computed<string>(() =>
  selectedMethod.value === 'prelevement' ? 'prélévement' : 'carte bancaire',
)

// Prélèvement: the SEPA mandate on file.
const prelevementDetails: { label: string; value: string }[] = [
  { label: 'Délai de paiement', value: '15 jours' },
  { label: 'Banque', value: 'Crédit Agricole' },
  { label: 'Code pays', value: 'FR' },
]

// Carte bancaire: the saved cards, one selectable as the active method.
const cards = reactive([
  { id: 'mastercard', label: 'Mastercard ** 1234', expires: 'Expire le 06/12', logo: mastercardLogo },
  { id: 'visa', label: 'Visa ** 1234', expires: 'Expire le 06/12', logo: visaLogo },
])
const selectedCardId = ref('mastercard')

const showSuccessToast = (title: string, description: string): void => {
  if (toastTimer) clearTimeout(toastTimer)
  toast.title = title
  toast.description = description
  toast.visible = true
  toastTimer = setTimeout(() => {
    toast.visible = false
  }, 3500)
}

const removeLine = (id: string): void => {
  const i = cart.findIndex(line => line.id === id)
  if (i !== -1) cart.splice(i, 1)
}

const placeOrder = (): void =>
  showSuccessToast('Commande confirmée', 'Votre commande a bien été enregistrée.')

const goBack = (): void => {
  navigateTo(busStore.selectedBuId ? `/bu/${busStore.selectedBuId}/home` : '/')
}
</script>

<template>
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]">
    <div class="mx-auto w-full max-w-[1080px] flex flex-col gap-[32px]">

      <!-- Page header -->
      <header
        class="anim-fade-up flex w-full items-center gap-[12px]"
        style="animation-delay: 0ms"
      >
        <!-- Illustration (Figma 8955:2511 — Business charging card, right hand) -->
        <div class="relative h-[88px] w-[96px] shrink-0 overflow-hidden rounded-[24px]">
          <div class="absolute inset-[4.71%_8.33%]">
            <img src="~/assets/illustrations/checkout/background.svg" alt="" class="absolute inset-0 block size-full max-w-none" />
          </div>
          <div class="absolute inset-[41.22%_-1.13%_6.64%_52.15%]">
            <img src="~/assets/illustrations/checkout/vector62.svg" alt="" class="absolute inset-0 block size-full max-w-none" />
          </div>
          <div class="absolute inset-[17.03%_26.33%_36.59%_13.67%]">
            <img src="~/assets/illustrations/checkout/card.svg" alt="" class="absolute inset-0 block size-full max-w-none" />
            <div class="absolute inset-[18.78%_25.3%_16.47%_27.71%]">
              <img src="~/assets/illustrations/checkout/circle.svg" alt="" class="absolute inset-0 block size-full max-w-none" />
            </div>
            <div class="absolute inset-[33.64%_36.09%_31.15%_38.46%]">
              <div class="absolute inset-[0.98%_-0.06%_0.96%_0]">
                <img src="~/assets/illustrations/checkout/logo.svg" alt="" class="absolute inset-0 block size-full max-w-none" />
              </div>
            </div>
          </div>
          <div class="absolute inset-[53.26%_26.33%_36.59%_58.33%]">
            <img src="~/assets/illustrations/checkout/vector75.svg" alt="" class="absolute inset-0 block size-full max-w-none" />
          </div>
          <div class="absolute inset-[38.09%_6.77%_5.41%_40.98%] flex items-center justify-center">
            <div class="h-[35.17px] w-[36.36px] flex-none -scale-x-100 rotate-[35.86deg]">
              <img src="~/assets/illustrations/checkout/thumb.svg" alt="" class="block size-full max-w-none" />
            </div>
          </div>
        </div>

        <div class="flex flex-col items-start justify-center">
          <button
            type="button"
            class="-m-[4px] inline-flex items-center gap-[8px] rounded-[4px] p-[4px] text-text-neutral-secondary outline-none transition-[color,background-color] duration-150 ease-out hover:text-text-neutral focus-visible:shadow-ring-gray motion-reduce:transition-none"
            @click="goBack"
          >
            <Icon name="arrow-left" variant="outline" :size="16" />
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">Retour</span>
          </button>
          <p :class="headingClass">Finalisation de ma commande</p>
        </div>
      </header>

      <!-- Two-column content -->
      <div class="flex items-start gap-[24px]">

        <!-- Left column -->
        <div class="flex flex-1 min-w-0 flex-col gap-[24px]">

          <!-- Votre panier -->
          <section
            class="anim-fade-up w-full bg-neutral border border-border-neutral-secondary rounded-[8px] shadow-sm p-[24px] flex flex-col gap-[16px]"
            style="animation-delay: 60ms"
          >
            <div class="flex items-center gap-[12px]">
              <div class="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] border border-border-neutral-secondary bg-neutral-secondary shadow-sm">
                <Icon name="shopping-bag" variant="solid" :size="16" class="text-icon-neutral-primary" />
              </div>
              <p class="flex-1 min-w-0 font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">Votre panier</p>
            </div>
            <div class="h-px w-full bg-border-neutral-tertiary" />

            <div class="flex flex-col gap-[16px]">
              <template v-for="(line, i) in cart" :key="line.id">
                <div v-if="i > 0" class="h-px w-full bg-border-neutral-tertiary" />
                <div class="flex items-center gap-[24px]">
                  <div class="flex flex-1 min-w-0 flex-col gap-[2px]">
                    <p class="font-sans text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">{{ line.name }}</p>
                    <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">{{ line.price }}</p>
                  </div>
                  <div class="w-[80px] shrink-0">
                    <Dropdown
                      v-model="line.qty"
                      :items="qtyItems"
                      size="sm"
                      :show-label="false"
                      :show-hint="false"
                      :searchable="false"
                      teleport
                    />
                  </div>
                  <Button
                    type="tertiaryGray"
                    size="md"
                    icon-only
                    icon-left="trash"
                    aria-label="Retirer du panier"
                    @click="removeLine(line.id)"
                  />
                </div>
              </template>
            </div>
          </section>

          <!-- Moyen de paiement -->
          <section
            class="anim-fade-up w-full bg-neutral border border-border-neutral-secondary rounded-[8px] shadow-sm p-[24px] flex flex-col gap-[16px]"
            style="animation-delay: 100ms"
          >
            <div class="flex items-center gap-[12px]">
              <div class="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] border border-border-neutral-secondary bg-neutral-secondary shadow-sm">
                <Icon name="credit-card" variant="solid" :size="16" class="text-icon-neutral-primary" />
              </div>
              <p class="flex-1 min-w-0 font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">Moyen de paiement</p>
            </div>
            <div class="h-px w-full bg-border-neutral-tertiary" />

            <div class="flex flex-col gap-[24px]">
              <div class="flex flex-col gap-[16px]">
                <Alert
                  type="brand"
                  leading-text-only
                  :dismissable="false"
                  title="Delais de paiement 2x plus rapide avec la carte bancaire."
                />

                <div class="flex items-stretch gap-[14px]">
                  <button
                    type="button"
                    :class="[
                      'flex flex-1 min-w-0 flex-col gap-[12px] rounded-[12px] bg-neutral p-[16px] text-left outline-none transition-[border-color,box-shadow,transform] duration-200 ease-out focus-visible:shadow-ring-brand active:scale-[0.99] motion-reduce:transition-none',
                      selectedMethod === 'prelevement'
                        ? 'border-2 border-brand'
                        : 'border border-border-neutral-secondary hover:border-border-neutral',
                    ]"
                    @click="selectedMethod = 'prelevement'"
                  >
                    <div class="flex w-full items-center">
                      <Icon name="building-library" variant="outline" :size="24" class="text-icon-neutral-primary" />
                    </div>
                    <p class="font-sans font-medium text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">Prélévement</p>
                  </button>

                  <button
                    type="button"
                    :class="[
                      'flex flex-1 min-w-0 flex-col gap-[12px] rounded-[12px] bg-neutral p-[16px] text-left outline-none transition-[border-color,box-shadow,transform] duration-200 ease-out focus-visible:shadow-ring-brand active:scale-[0.99] motion-reduce:transition-none',
                      selectedMethod === 'cb'
                        ? 'border-2 border-brand'
                        : 'border border-border-neutral-secondary hover:border-border-neutral',
                    ]"
                    @click="selectedMethod = 'cb'"
                  >
                    <div class="flex w-full items-center">
                      <Icon name="credit-card" variant="outline" :size="24" class="text-icon-neutral-primary" />
                    </div>
                    <p class="font-sans font-medium text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">Carte bancaire</p>
                  </button>
                </div>
              </div>

              <div class="flex flex-col gap-[16px]">
                <p class="font-sans font-medium text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">Paiement par {{ methodLabel }}</p>

                <!-- Prélèvement: the SEPA mandate -->
                <div v-if="selectedMethod === 'prelevement'" class="flex flex-col gap-[16px]">
                  <template v-for="(detail, i) in prelevementDetails" :key="detail.label">
                    <div v-if="i > 0" class="h-px w-full bg-border-neutral-tertiary" />
                    <div class="flex items-center gap-[16px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
                      <p class="whitespace-nowrap text-text-neutral-secondary">{{ detail.label }}</p>
                      <p class="flex-1 min-w-0 text-right text-text-neutral">{{ detail.value }}</p>
                    </div>
                  </template>
                </div>

                <!-- Carte bancaire: the saved cards -->
                <div v-else class="flex flex-col gap-[16px]">
                  <div
                    v-for="card in cards"
                    :key="card.id"
                    role="radio"
                    :aria-checked="selectedCardId === card.id"
                    tabindex="0"
                    :class="[
                      'flex flex-col gap-[8px] rounded-[16px] bg-neutral p-[16px] cursor-pointer outline-none transition-[border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none',
                      selectedCardId === card.id
                        ? 'border border-brand shadow-ring-brand'
                        : 'border border-border-neutral-secondary hover:border-border-neutral focus-visible:shadow-ring-brand',
                    ]"
                    @click="selectedCardId = card.id"
                    @keydown.enter="selectedCardId = card.id"
                    @keydown.space.prevent="selectedCardId = card.id"
                  >
                    <div class="flex items-center justify-between gap-[16px]">
                      <div class="flex flex-1 min-w-0 items-center gap-[8px]">
                        <img :src="card.logo" alt="" class="block h-[24px] w-[34px] shrink-0 rounded-[4px]" />
                        <p class="flex-1 min-w-0 truncate font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">{{ card.label }}</p>
                      </div>
                      <span
                        v-if="selectedCardId === card.id"
                        class="flex size-[20px] shrink-0 items-center justify-center rounded-full bg-brand"
                      >
                        <span class="size-[7px] rounded-full bg-white" />
                      </span>
                      <span v-else class="size-[20px] shrink-0 rounded-full border border-border-neutral bg-neutral" />
                    </div>

                    <div class="flex items-center justify-between gap-[16px]">
                      <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">{{ card.expires }}</p>
                      <div class="flex shrink-0 items-center gap-[12px]">
                        <button
                          type="button"
                          class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-brand-medium outline-none rounded-[4px] transition-opacity duration-150 ease-out hover:opacity-80 focus-visible:shadow-ring-brand"
                          @click.stop
                        >Editer</button>
                        <button
                          type="button"
                          class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary outline-none rounded-[4px] transition-opacity duration-150 ease-out hover:opacity-80 focus-visible:shadow-ring-gray"
                          @click.stop
                        >Supprimer</button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="flex h-[100px] w-full items-center justify-center gap-[12px] rounded-[16px] border border-dashed border-border-neutral-secondary bg-neutral outline-none transition-[border-color,background-color] duration-150 ease-out hover:border-border-neutral hover:bg-neutral-secondary focus-visible:shadow-ring-gray motion-reduce:transition-none"
                  >
                    <Icon name="plus" variant="outline" :size="24" class="text-icon-neutral-secondary" />
                    <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">Nouvelle carte</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Numéro de commande -->
          <section
            class="anim-fade-up w-full bg-neutral border border-border-neutral-secondary rounded-[8px] shadow-sm p-[24px] flex flex-col gap-[16px]"
            style="animation-delay: 140ms"
          >
            <div class="flex items-center gap-[12px]">
              <div class="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] border border-border-neutral-secondary bg-neutral-secondary shadow-sm">
                <Icon name="receipt-tax" variant="solid" :size="16" class="text-icon-neutral-primary" />
              </div>
              <p class="flex-1 min-w-0 font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">Numéro de commande</p>
              <Icon name="information-circle" variant="outline" :size="20" class="shrink-0 text-icon-neutral-secondary" />
            </div>
            <div class="h-px w-full bg-border-neutral-tertiary" />

            <div class="flex items-center justify-between">
              <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">01234</p>
              <Button type="tertiaryGray" size="md" icon-only icon-left="pencil" aria-label="Modifier le numéro de commande" />
            </div>
          </section>

          <!-- Assignation des coûts -->
          <section
            class="anim-fade-up w-full bg-neutral border border-border-neutral-secondary rounded-[8px] shadow-sm p-[24px] flex flex-col gap-[16px]"
            style="animation-delay: 180ms"
          >
            <div class="flex items-center gap-[12px]">
              <div class="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] border border-border-neutral-secondary bg-neutral-secondary shadow-sm">
                <Icon name="document-currency-euro" variant="solid" :size="16" class="text-icon-neutral-primary" />
              </div>
              <p class="flex-1 min-w-0 font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">Assignation des coûts</p>
              <Icon name="information-circle" variant="outline" :size="20" class="shrink-0 text-icon-neutral-secondary" />
            </div>
            <div class="h-px w-full bg-border-neutral-tertiary" />

            <div class="flex items-center justify-between gap-[16px]">
              <div class="flex min-w-0 flex-col gap-[2px]">
                <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">Pack itinérance</p>
                <p class="font-sans text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Assigné à 2 véhicules</p>
              </div>
              <div class="flex shrink-0 items-center gap-[8px]">
                <Button type="tertiaryGray" size="md" icon-only icon-left="pencil" aria-label="Modifier l'assignation" />
                <Button type="tertiaryGray" size="md" icon-only icon-left="trash" aria-label="Retirer l'assignation" />
              </div>
            </div>

            <div class="h-px w-full bg-border-neutral-tertiary" />

            <div class="flex items-center justify-between gap-[16px]">
              <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">Pack recharge sur site d'entreprise</p>
              <Button type="secondary" size="sm" icon-left="plus" label="Ajouter" class="shrink-0" />
            </div>
          </section>
        </div>

        <!-- Right column -->
        <div class="flex w-[420px] shrink-0 flex-col gap-[24px]">

          <!-- Adresse de livraison -->
          <section
            class="anim-fade-up w-full bg-neutral border border-border-neutral-secondary rounded-[8px] shadow-sm p-[24px] flex flex-col gap-[16px]"
            style="animation-delay: 80ms"
          >
            <div class="flex items-center gap-[12px]">
              <div class="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] border border-border-neutral-secondary bg-neutral-secondary shadow-sm">
                <Icon name="map-pin" variant="solid" :size="16" class="text-icon-neutral-primary" />
              </div>
              <p class="flex-1 min-w-0 font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">Adresse de livraison</p>
            </div>
            <div class="h-px w-full bg-border-neutral-tertiary" />

            <div class="flex items-center justify-between gap-[16px]">
              <div class="flex min-w-0 flex-col gap-[4px]">
                <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">{{ deliveryName }}</p>
                <p class="font-sans text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">12 rue des Lilas, 75008, Paris France</p>
              </div>
              <Button type="tertiaryGray" size="md" icon-only icon-left="pencil" aria-label="Modifier l'adresse de livraison" class="shrink-0" />
            </div>
          </section>

          <!-- Récapitulatif -->
          <section class="anim-fade-up w-full bg-neutral border border-border-neutral-secondary rounded-[8px] shadow-sm overflow-hidden flex flex-col" style="animation-delay: 120ms">
            <div class="flex flex-col gap-[16px] p-[24px]">
              <div class="flex items-center gap-[12px]">
                <div class="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] border border-border-neutral-secondary bg-neutral-secondary shadow-sm">
                  <Icon name="shopping-bag" variant="solid" :size="16" class="text-icon-neutral-primary" />
                </div>
                <p class="flex-1 min-w-0 font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">Récapitulatif</p>
              </div>
              <div class="h-px w-full bg-border-neutral-tertiary" />

              <div class="flex items-center gap-[16px]">
                <p class="flex-1 font-sans text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">Prix total HT</p>
                <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral text-right">{{ totalHT }}</p>
              </div>

              <Button type="primary" size="md" label="Commander" class="w-full" @click="placeOrder" />
            </div>

            <div class="flex items-start gap-[8px] bg-neutral-tertiary p-[16px]">
              <Icon name="information-circle" variant="outline" :size="16" class="mt-[2px] shrink-0 text-icon-neutral-secondary" />
              <p class="font-sans text-[12px] leading-[1.5] tracking-[-0.36px] text-text-neutral-secondary">
                156,78 € / an au prochain renouvellement (le 16/01/2027).
                <button type="button" class="text-text-brand-deep underline decoration-dotted underline-offset-2 outline-none focus-visible:shadow-ring-gray rounded-[2px]">En savoir plus</button>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="pointer-events-none fixed top-[24px] right-[24px] z-50">
      <div class="pointer-events-auto">
        <Toast
          v-model="toast.visible"
          type="success"
          :title="toast.title"
          :description="toast.description"
          :primary-action-label="''"
          :secondary-action-label="''"
        />
      </div>
    </div>
  </div>
</template>
