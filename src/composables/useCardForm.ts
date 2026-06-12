import { computed, reactive } from 'vue'

// Shared carte-bancaire form logic: input masks, format regexes and per-field
// errors. Used by every card form (boutique checkout + BU settings) so they all
// validate identically — 16-digit number, MM/AA not in the past, 3-4 digit CVC.
// Each call returns its own independent state.
export const useCardForm = () => {
  const form = reactive({ number: '', expiry: '', cvc: '' })
  const errors = reactive({ number: '', expiry: '', cvc: '' })

  const isNumberValid = computed<boolean>(() => /^\d{16}$/.test(form.number.replace(/\s/g, '')))
  const isExpiryValid = computed<boolean>(() => {
    const m = form.expiry.match(/^(\d{2})\/(\d{2})$/)
    if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) return false
    const now = new Date()
    return (2000 + Number(m[2])) * 12 + (Number(m[1]) - 1) >= now.getFullYear() * 12 + now.getMonth()
  })
  const isCvcValid = computed<boolean>(() => /^\d{3,4}$/.test(form.cvc))
  const isValid = computed<boolean>(() => isNumberValid.value && isExpiryValid.value && isCvcValid.value)

  // Ready-to-store representation of a valid card.
  const maskedNumber = computed<string>(() => `•••• •••• •••• ${form.number.replace(/\s/g, '').slice(-4)}`)
  const brand = computed<'visa' | 'mastercard'>(() => (form.number.replace(/\s/g, '').startsWith('4') ? 'visa' : 'mastercard'))

  // Masks — keep only digits, group them per the printed format, and clear that
  // field's error as soon as the user edits it again.
  const onNumberInput = (value: string): void => {
    form.number = value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})(?=.)/g, '$1 ')
    errors.number = ''
  }
  const onExpiryInput = (value: string): void => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    form.expiry = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
    errors.expiry = ''
  }
  const onCvcInput = (value: string): void => {
    form.cvc = value.replace(/\D/g, '').slice(0, 4)
    errors.cvc = ''
  }

  // Surface a field's error once the user has filled it and left it (on blur).
  // An empty field shows no error — it just keeps the submit button disabled.
  const validateNumber = (): void => {
    errors.number = !form.number || isNumberValid.value ? '' : 'Numéro de carte invalide'
  }
  const validateExpiry = (): void => {
    if (!form.expiry) {
      errors.expiry = ''
      return
    }
    const m = form.expiry.match(/^(\d{2})\/(\d{2})$/)
    errors.expiry = !m || Number(m[1]) < 1 || Number(m[1]) > 12
      ? "Date d'expiration invalide"
      : isExpiryValid.value ? '' : "Date d'expiration dépassée"
  }
  const validateCvc = (): void => {
    errors.cvc = !form.cvc || isCvcValid.value ? '' : 'Code de sécurité invalide'
  }

  const reset = (): void => {
    form.number = ''
    form.expiry = ''
    form.cvc = ''
    errors.number = ''
    errors.expiry = ''
    errors.cvc = ''
  }

  // Returned as a reactive object so nested computeds unwrap in templates too
  // (`card.isValid` reads as a boolean, no `.value` needed anywhere).
  return reactive({
    form,
    errors,
    isNumberValid,
    isExpiryValid,
    isCvcValid,
    isValid,
    maskedNumber,
    brand,
    onNumberInput,
    onExpiryInput,
    onCvcInput,
    validateNumber,
    validateExpiry,
    validateCvc,
    reset,
  })
}
