export interface SecondaryCard {
  number: string // masked, e.g. "•••• •••• •••• 1234"
  expiry: string // "MM/AA"
  brand: 'visa' | 'mastercard'
}

const STORAGE_KEY = 'cm-sandbox-secondary-card'

// The card added at checkout becomes the BU's secondary payment method. Shared so
// the checkout (shop.vue) and the BU settings "Moyen de paiement" tab stay in
// sync, and persisted so the link survives a reload.
export const usePaymentStore = defineStore('payment', () => {
  let initial: SecondaryCard | null = null
  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        initial = JSON.parse(stored) as SecondaryCard
      }
      catch {
        initial = null
      }
    }
  }
  const secondaryCard = ref<SecondaryCard | null>(initial)

  if (import.meta.client) {
    watch(
      secondaryCard,
      (v) => {
        if (v) localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
        else localStorage.removeItem(STORAGE_KEY)
      },
      { deep: true },
    )
  }

  const setSecondaryCard = (card: SecondaryCard): void => {
    secondaryCard.value = card
  }
  const clearSecondaryCard = (): void => {
    secondaryCard.value = null
  }

  return { secondaryCard, setSecondaryCard, clearSecondaryCard }
})
