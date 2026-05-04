<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import Banner from '../components/ui/Banner.vue'
import HorizontalTabs from '../components/ui/HorizontalTabs.vue'
import Icon from '../components/ui/Icon.vue'
import Input from '../components/ui/Input.vue'
import Dropdown from '../components/ui/Dropdown.vue'
import Toast from '../components/ui/Toast.vue'
import { isNavV2, V1_PAGE_HEADING } from '../state/nav'
import { bus, selectedBuId } from '../state/bus'

const tabs = [
  { id: 'general', label: 'Général' },
  { id: 'facturation', label: 'Facturation' },
  { id: 'moyen-de-paiement', label: 'Moyen de paiement' },
  { id: 'licences', label: 'Licences' },
  { id: 'tokens-api', label: 'Tokens API' },
]
const activeTab = ref<string>('moyen-de-paiement')

const currentBu = computed(() => bus.find(b => b.id === selectedBuId.value) ?? null)
const pageTitle = computed(() => `${currentBu.value?.name ?? 'Paramètres'} BU`)

// ── Moyen de paiement tab ─────────────────────────────────────────────────
const moyenPaiementOptions = [
  { value: 'prelevement' as const, label: 'Prélèvement' },
  { value: 'carte'       as const, label: 'Carte bancaire' },
  { value: 'virement'    as const, label: 'Virement bancaire' },
]
type MoyenPaiement = (typeof moyenPaiementOptions)[number]['value']
const moyenPaiement = ref<MoyenPaiement>('virement')
const moyenPaiementTitle = computed(
  () => moyenPaiementOptions.find(o => o.value === moyenPaiement.value)?.label ?? '',
)
const moyenPaiementDescription = computed(() => {
  switch (moyenPaiement.value) {
    case 'virement':
      return 'Renseignez ces informations pour obtenir un IBAN dédié. Vous pourrez ensuite effectuer le virement depuis votre banque'
    case 'carte':
      return 'Renseigner les informations de votre carte bancaire'
    case 'prelevement':
      return 'Pour utiliser la méthode par prélèvement, vous devez enregistrer votre moyen de prélèvement avec le service sécurisé GoCardless.'
    default:
      return ''
  }
})
const moyenPaiementCtaLabel = computed(() => {
  switch (moyenPaiement.value) {
    case 'virement':
      return 'Recevoir un IBAN dédié'
    case 'prelevement':
      return 'Mettre en place le prélèvement'
    default:
      return 'Valider'
  }
})

// Hard-coded prélèvement bank details — only displayed in the saved-state view.
const prelevementInfo = {
  banque: 'Crédit Agricole',
  codePays: 'FR',
}

const contactFacturation = ref('')
const langueCommunication = ref('FR')
// Carte bancaire form state — used when moyenPaiement === 'carte'.
const numeroCarte = ref('')
const dateExpiration = ref('')
const codeSecurite = ref('')
const langueItems = [
  { value: 'FR', label: 'Français' },
  { value: 'EN', label: 'English' },
  { value: 'DE', label: 'Deutsch' },
  { value: 'IT', label: 'Italiano' },
  { value: 'ES', label: 'Español' },
]

// Banner persists until the user has saved a payment method at least once.
const hasPaymentMethod = ref(false)
const isContactValid = computed(() => contactFacturation.value.trim().length > 0)
const selectedLangueLabel = computed(
  () => langueItems.find(l => l.value === langueCommunication.value)?.label ?? '',
)

// Hard-coded Chargemap banking details — only displayed in the saved-state view.
const ibanInfo = {
  titulaire: 'Chargemap SAS',
  iban: 'FR43 2977 5367 2839 8513 4243 5827',
  bic: 'CCBPFRPPMTZ',
}

// Inline error on the email input — flagged when the user clicks Valider
// without having filled the field, cleared as soon as they start typing.
const showContactError = ref(false)
watch(contactFacturation, () => {
  if (showContactError.value) showContactError.value = false
})

// ── Carte bancaire field validation ─────────────────────────────────────
// Each field has a "showXError" flag that flips on invalid Valider and
// resets as soon as the user types. Format checks strip whitespace so the
// user can paste "1234 1234 1234 1234" or "11 / 27" without rejection.
const numeroCarteDigits = computed(() => numeroCarte.value.replace(/\s/g, ''))
const isNumeroCarteValid = computed(() => /^\d{16}$/.test(numeroCarteDigits.value))
const dateExpirationCleaned = computed(() => dateExpiration.value.replace(/\s/g, ''))
const isDateExpirationValid = computed(() => {
  const m = /^(\d{2})\/(\d{2})$/.exec(dateExpirationCleaned.value)
  if (!m) return false
  const month = Number(m[1])
  return month >= 1 && month <= 12
})
const isCodeSecuriteValid = computed(() => /^\d{3,4}$/.test(codeSecurite.value.trim()))

const showNumeroCarteError = ref(false)
const showDateExpirationError = ref(false)
const showCodeSecuriteError = ref(false)

watch(numeroCarte, () => {
  if (showNumeroCarteError.value) showNumeroCarteError.value = false
})
watch(dateExpiration, () => {
  if (showDateExpirationError.value) showDateExpirationError.value = false
})

// MM/AA input mask — strip non-digits, cap at 4 digits, auto-insert "/" after MM.
watch(dateExpiration, val => {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  const formatted = digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`
  if (formatted !== val) dateExpiration.value = formatted
})
watch(codeSecurite, () => {
  if (showCodeSecuriteError.value) showCodeSecuriteError.value = false
})

const numeroCarteHint = computed(() => {
  if (!showNumeroCarteError.value) return ''
  return numeroCarte.value.trim()
    ? 'Numéro de carte invalide'
    : 'Veuillez renseigner un numéro de carte'
})
const dateExpirationHint = computed(() => {
  if (!showDateExpirationError.value) return ''
  return dateExpiration.value.trim()
    ? 'Format invalide (MM / AA)'
    : 'Veuillez renseigner une date'
})
const codeSecuriteHint = computed(() => {
  if (!showCodeSecuriteError.value) return ''
  return codeSecurite.value.trim()
    ? 'Code invalide'
    : 'Veuillez renseigner le code'
})

const onValiderMoyen = () => {
  if (moyenPaiement.value === 'virement') {
    if (!isContactValid.value) {
      showContactError.value = true
      return
    }
    hasPaymentMethod.value = true
    showSuccessToast('IBAN généré', '')
    return
  }
  if (moyenPaiement.value === 'carte') {
    let valid = true
    if (!isNumeroCarteValid.value) {
      showNumeroCarteError.value = true
      valid = false
    }
    if (!isDateExpirationValid.value) {
      showDateExpirationError.value = true
      valid = false
    }
    if (!isCodeSecuriteValid.value) {
      showCodeSecuriteError.value = true
      valid = false
    }
    if (!valid) return
    hasPaymentMethod.value = true
    showSuccessToast('Carte bancaire enregistrée', '')
    return
  }
  if (moyenPaiement.value === 'prelevement') {
    // No fields to validate — would redirect to GoCardless in real life.
    hasPaymentMethod.value = true
    showSuccessToast('Prélèvement activé', '')
    return
  }
}

// Saved state — variant-specific copy & display.
const savedStatusLabel = computed(() => {
  switch (moyenPaiement.value) {
    case 'virement':
      return 'Virement bancaire activé'
    case 'carte':
      return 'Paiement par carte bancaire activé'
    case 'prelevement':
      return 'Prélèvement activé'
    default:
      return 'Moyen de paiement activé'
  }
})
const displayCardLast4 = computed(() => {
  const digits = numeroCarte.value.replace(/\s/g, '')
  return digits.slice(-4) || '••••'
})
const displayCardExpiration = computed(() => {
  // Accepts "MM/YY" or "MM / YY" → outputs "MM/YY". Falls back to raw input.
  const cleaned = dateExpiration.value.replace(/\s/g, '')
  const m = /^(\d{1,2})\/(\d{2})$/.exec(cleaned)
  if (m) return `${m[1].padStart(2, '0')}/${m[2]}`
  return cleaned || '——'
})

// Edit-in-place for the Informations card. Snapshot on enter so Annuler can revert.
const editingInfo = ref(false)
let infoSnapshot = { contact: '', langue: '' }
const onModifierMoyen = () => {
  // Virement uses in-place editing (snapshot + Annuler/Enregistrer in the status card).
  // Carte falls back to the regular form (values are preserved on the refs).
  if (moyenPaiement.value === 'virement') {
    infoSnapshot = { contact: contactFacturation.value, langue: langueCommunication.value }
    editingInfo.value = true
    return
  }
  hasPaymentMethod.value = false
}
const onAnnulerInfo = () => {
  contactFacturation.value = infoSnapshot.contact
  langueCommunication.value = infoSnapshot.langue
  editingInfo.value = false
}
const onEnregistrerInfo = () => {
  const changed =
    contactFacturation.value !== infoSnapshot.contact ||
    langueCommunication.value !== infoSnapshot.langue
  if (changed) showSuccessToast('Informations mises à jour', '')
  editingInfo.value = false
}
// Trash icon in the status card — kills the saved payment method and rolls back to the form.
const onSupprimerMoyen = () => {
  hasPaymentMethod.value = false
  editingInfo.value = false
  showSuccessToast('Moyen de paiement supprimé', '')
}

// ── Toast (one at a time, auto-dismiss after 3.5s) ────────────────────────
const toast = reactive<{ visible: boolean; title: string; description: string }>({
  visible: false,
  title: '',
  description: '',
})
let toastTimer: ReturnType<typeof setTimeout> | null = null
const showSuccessToast = (title: string, description: string) => {
  if (toastTimer) clearTimeout(toastTimer)
  toast.title = title
  toast.description = description
  toast.visible = true
  toastTimer = setTimeout(() => {
    toast.visible = false
  }, 3500)
}
</script>

<template>
  <div class="min-h-full h-full flex flex-col items-center gap-[40px] px-[32px] pt-[32px] pb-0 overflow-y-auto">

    <!-- Empty-state banner: appears only on the moyen-de-paiement tab while no method is saved -->
    <Transition
      enter-active-class="transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      enter-from-class="opacity-0 -translate-y-[6px]"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-[4px]"
    >
      <Banner
        v-if="!hasPaymentMethod"
        class="max-w-[800px]"
        type="warning"
        text="Renseigner un moyen de paiement pour commander des badges et licences"
        action-label="Renseigner"
        icon-left="pencil"
        icon-right=""
        icon-variant="solid"
      />
    </Transition>

    <!-- Page header -->
    <div class="w-full max-w-[800px] flex items-center gap-[16px] anim-fade-up" style="animation-delay: 0ms">
      <h1 :class="isNavV2 ? 'font-heading font-semibold text-[32px] leading-[1.5] tracking-[-0.96px] text-text-neutral' : V1_PAGE_HEADING">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Horizontal tabs — underline variant with sliding indicator (matches SupervisedCharges). -->
    <div
      class="w-full max-w-[800px] border-b border-border-neutral-secondary anim-fade-up"
      style="animation-delay: 40ms"
    >
      <HorizontalTabs :tabs="tabs" v-model="activeTab" variant="underline" />
    </div>

    <!-- Tab content — matches the charges-row animation in SupervisedCharges.
         No anim-fade-up here: it'd be a CSS keyframe on opacity/transform that overrides the Transition. -->
    <Transition mode="out-in" name="tab-content">
      <div
        :key="activeTab"
        class="w-full max-w-[800px] flex flex-col gap-[16px]"
      >
        <!-- Moyen de paiement tab -->
        <template v-if="activeTab === 'moyen-de-paiement'">

          <!-- Stack of standalone cards (no outer wrapper) — gap-[12px] between siblings.
               The radio selector only shows in form state; saved state replaces it with the status card. -->
          <div
            class="w-full flex flex-col gap-[12px] anim-fade-up"
            style="animation-delay: 120ms"
          >

            <!-- Form ↔ Saved view cross-fade. -->
            <Transition
              mode="out-in"
              enter-active-class="transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              enter-from-class="opacity-0 translate-y-[6px]"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-[4px]"
            >
              <!-- ──────────── FORM STATE: radio selector + editable form + Valider CTA ──────────── -->
              <div v-if="!hasPaymentMethod" key="form" class="flex flex-col gap-[12px] w-full">
                <!-- Payment method selector — only visible while no method is saved. -->
                <section
                  class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] drop-shadow-sm p-[24px] flex items-start justify-between"
                >
                  <button
                    v-for="opt in moyenPaiementOptions"
                    :key="opt.value"
                    type="button"
                    class="group flex items-center gap-[8px] outline-none rounded-[6px] focus-visible:shadow-ring-brand"
                    @click="moyenPaiement = opt.value"
                  >
                    <div
                      :class="[
                        'flex items-center justify-center shrink-0 size-[16px] rounded-full transition-colors duration-150',
                        moyenPaiement === opt.value
                          ? 'bg-brand'
                          : 'border border-border-neutral',
                      ]"
                    >
                      <div
                        v-if="moyenPaiement === opt.value"
                        class="size-[6px] rounded-full bg-white"
                      />
                    </div>
                    <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                      {{ opt.label }}
                    </span>
                  </button>
                </section>

                <section
                  :class="[
                    'w-full bg-neutral border border-border-neutral-secondary drop-shadow-sm flex flex-col gap-[24px]',
                    moyenPaiement === 'virement'
                      ? 'rounded-[16px] p-[24px]'
                      : 'rounded-[8px] p-[16px]',
                  ]"
                >
                  <Transition
                    mode="out-in"
                    enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                    enter-from-class="opacity-0 translate-y-[4px]"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 -translate-y-[2px]"
                  >
                    <div :key="moyenPaiement" class="flex flex-col gap-[4px] w-full leading-[1.5]">
                      <p
                        :class="[
                          'font-sans font-medium text-text-neutral',
                          moyenPaiement === 'virement'
                            ? 'text-[18px] tracking-[-0.54px]'
                            : 'text-[16px] tracking-[-0.48px]',
                        ]"
                      >
                        {{ moyenPaiementTitle }}
                      </p>
                      <p
                        v-if="moyenPaiementDescription"
                        class="font-sans font-normal text-[14px] tracking-[-0.42px] text-text-neutral-secondary"
                      >
                        {{ moyenPaiementDescription }}
                      </p>
                    </div>
                  </Transition>

                  <!-- Separator only for variants with form fields below (Prélèvement has none). -->
                  <div
                    v-if="moyenPaiement !== 'prelevement'"
                    class="h-px w-full bg-border-neutral-secondary"
                  />

                  <!-- Form fields cross-fade when switching between moyen variants.
                       Prélèvement has no fields — the GoCardless redirect happens through the CTA only. -->
                  <Transition
                    v-if="moyenPaiement !== 'prelevement'"
                    mode="out-in"
                    enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                    enter-from-class="opacity-0 translate-y-[4px]"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 -translate-y-[2px]"
                  >
                    <!-- Virement bancaire fields -->
                    <div
                      v-if="moyenPaiement === 'virement'"
                      :key="'virement-fields'"
                      class="flex gap-[16px] w-full"
                    >
                      <div class="flex-1 min-w-0">
                        <Input
                          v-model="contactFacturation"
                          size="md"
                          label="Email contact de facturation"
                          placeholder="johndoe@email.com"
                          :destructive="showContactError"
                          :hint="showContactError ? 'Veuillez renseigner un email' : ''"
                        />
                      </div>
                      <div class="flex-1 min-w-0">
                        <Dropdown
                          v-model="langueCommunication"
                          :items="langueItems"
                          size="md"
                          label="Langue des communications de facturation"
                          :show-hint="false"
                          :searchable="false"
                          placeholder="Sélectionner une langue"
                        />
                      </div>
                    </div>

                    <!-- Carte bancaire fields -->
                    <div
                      v-else-if="moyenPaiement === 'carte'"
                      :key="'carte-fields'"
                      class="flex flex-col gap-[16px] w-full"
                    >
                      <Input
                        v-model="numeroCarte"
                        size="md"
                        label="Numéro de carte"
                        placeholder="1234 1234 1234 1234"
                        :destructive="showNumeroCarteError"
                        :hint="numeroCarteHint"
                      />
                      <div class="flex gap-[16px] w-full">
                        <div class="flex-1 min-w-0">
                          <Input
                            v-model="dateExpiration"
                            size="md"
                            label="Date d’expiration"
                            placeholder="MM / AA"
                            :destructive="showDateExpirationError"
                            :hint="dateExpirationHint"
                          />
                        </div>
                        <div class="flex-1 min-w-0">
                          <Input
                            v-model="codeSecurite"
                            size="md"
                            label="Code de sécurité"
                            placeholder="CVC"
                            :destructive="showCodeSecuriteError"
                            :hint="codeSecuriteHint"
                          />
                        </div>
                      </div>
                    </div>

                  </Transition>

                  <!-- CTA — always inside the form card, md size (same for all variants). -->
                  <button
                    type="button"
                    class="w-full flex items-center justify-center gap-[8px] min-h-[44px] px-[16px] py-[8px] rounded-[8px] bg-brand text-white font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] outline-none transition-[background-color,transform] duration-200 ease-out hover:bg-brand-hover focus-visible:shadow-ring-brand active:scale-[0.97]"
                    @click="onValiderMoyen"
                  >
                    {{ moyenPaiementCtaLabel }}
                  </button>
                </section>
              </div>

              <!-- ──────────── SAVED STATE: Status + Informations + IBAN cards (Télécharger inside IBAN) ──────────── -->
              <div v-else key="saved" class="flex flex-col gap-[12px] w-full">
                <!-- Status card — replaces the radio card while a payment method is active.
                     Right side morphs between [Modifier les infos + Trash] (saved) and
                     [Annuler + Enregistrer] (editing). -->
                <section
                  :class="[
                    'relative w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[24px] flex items-center gap-[8px]',
                    editingInfo ? 'z-20' : 'z-10',
                  ]"
                >
                  <div class="flex-1 min-w-0 flex items-center gap-[8px]">
                    <Icon name="check-circle" variant="outline" :size="20" class="shrink-0 text-text-neutral" />
                    <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral whitespace-nowrap">
                      {{ savedStatusLabel }}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label="Supprimer le moyen de paiement"
                    class="shrink-0 inline-flex items-center justify-center p-[8px] rounded-[8px] bg-neutral border border-border-neutral text-text-neutral-secondary outline-none transition-[background-color,transform,color] duration-200 ease-out hover:bg-neutral-secondary hover:text-text-danger focus-visible:shadow-ring-gray active:scale-[0.97]"
                    @click="onSupprimerMoyen"
                  >
                    <Icon name="trash" variant="outline" :size="20" />
                  </button>
                </section>

                <!-- ━━━━━━━━━━━━━━━━━━━━ VIREMENT VARIANT ━━━━━━━━━━━━━━━━━━━━ -->
                <template v-if="moyenPaiement === 'virement'">
                <!-- Informations card — view rows ↔ edit form, no internal header. -->
                <section
                  class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] drop-shadow-sm p-[24px] flex flex-col gap-[24px]"
                >
                  <Transition
                    mode="out-in"
                    enter-active-class="transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                    enter-from-class="opacity-0 translate-y-[6px]"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 -translate-y-[4px]"
                  >
                    <!-- View mode -->
                    <div v-if="!editingInfo" key="view" class="flex flex-col gap-[24px] w-full">
                      <div class="flex items-center gap-[16px] w-full font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
                        <p class="shrink-0 text-text-neutral-secondary whitespace-nowrap">Contact de facturation</p>
                        <p class="flex-1 min-w-0 text-text-neutral text-right truncate">{{ contactFacturation }}</p>
                      </div>

                      <div class="h-px w-full bg-border-neutral-secondary" />

                      <div class="flex items-center gap-[16px] w-full font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
                        <p class="shrink-0 text-text-neutral-secondary whitespace-nowrap">Langue de communication</p>
                        <p class="flex-1 min-w-0 text-text-neutral text-right truncate">{{ selectedLangueLabel }}</p>
                      </div>
                    </div>

                    <!-- Edit mode -->
                    <div v-else key="edit" class="flex gap-[12px] w-full">
                      <div class="flex-1 min-w-0">
                        <Input
                          v-model="contactFacturation"
                          size="md"
                          label="Email contact de facturation"
                          placeholder="johndoe@email.com"
                        />
                      </div>
                      <div class="flex-1 min-w-0">
                        <Dropdown
                          v-model="langueCommunication"
                          :items="langueItems"
                          size="md"
                          label="Langue des communications de facturation"
                          :show-hint="false"
                          :searchable="false"
                          placeholder="Sélectionner une langue"
                        />
                      </div>
                    </div>
                  </Transition>
                </section>

                <!-- IBAN card — title 18px semibold, Télécharger button now lives inside. -->
                <section
                  class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] drop-shadow-sm p-[24px] flex flex-col gap-[24px]"
                >
                  <div class="flex flex-col w-full leading-[1.5]">
                    <p class="font-sans font-medium text-[18px] tracking-[-0.54px] text-text-neutral">
                      Votre IBAN dédié
                    </p>
                    <p class="font-sans font-normal text-[14px] tracking-[-0.42px] text-text-neutral-secondary">
                      Utiliser les coordonnées si dessous pour effectué un virement à Chargemap
                    </p>
                  </div>

                  <div class="h-px w-full bg-border-neutral-secondary" />

                  <!-- IBAN info containers — Titulaire (full width) then IBAN + BIC (50/50) — gap-[16px]. -->
                  <div class="flex flex-col gap-[16px] w-full">
                    <div class="w-full bg-neutral-secondary rounded-[16px] p-[16px] flex flex-col gap-[8px]">
                      <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                        Titulaire du compte
                      </p>
                      <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
                        {{ ibanInfo.titulaire }}
                      </p>
                    </div>
                    <div class="flex items-start gap-[16px] w-full">
                      <div class="flex-1 min-w-0 bg-neutral-secondary rounded-[16px] p-[16px] flex flex-col gap-[8px]">
                        <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                          IBAN
                        </p>
                        <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                          {{ ibanInfo.iban }}
                        </p>
                      </div>
                      <div class="flex-1 min-w-0 bg-neutral-secondary rounded-[16px] p-[16px] flex flex-col gap-[8px]">
                        <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                          BIC
                        </p>
                        <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                          {{ ibanInfo.bic }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Télécharger le RIB CTA — now inside the IBAN card -->
                  <button
                    type="button"
                    class="w-full flex items-center justify-center gap-[8px] min-h-[44px] px-[16px] py-[8px] rounded-[8px] bg-neutral border border-border-neutral font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary outline-none transition-[background-color,transform] duration-200 ease-out hover:bg-neutral-secondary focus-visible:shadow-ring-gray active:scale-[0.97]"
                  >
                    <Icon name="arrow-down-tray" variant="outline" :size="20" class="shrink-0" />
                    Télécharger le RIB
                  </button>
                </section>
                </template>

                <!-- ━━━━━━━━━━━━━━━━━━━━ PRÉLÈVEMENT VARIANT ━━━━━━━━━━━━━━━━━━━━ -->
                <template v-else-if="moyenPaiement === 'prelevement'">
                <section
                  class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[24px] flex flex-col gap-[24px] overflow-clip"
                >
                  <div class="flex items-center gap-[16px] w-full font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
                    <p class="shrink-0 text-text-neutral-secondary whitespace-nowrap">Banque</p>
                    <p class="flex-1 min-w-0 text-text-neutral text-right truncate">{{ prelevementInfo.banque }}</p>
                  </div>

                  <div class="h-px w-full bg-border-neutral-secondary" />

                  <div class="flex items-center gap-[16px] w-full font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
                    <p class="shrink-0 text-text-neutral-secondary whitespace-nowrap">Code pays</p>
                    <p class="flex-1 min-w-0 text-text-neutral text-right truncate">{{ prelevementInfo.codePays }}</p>
                  </div>
                </section>
                </template>

                <!-- ━━━━━━━━━━━━━━━━━━━━ CARTE VARIANT ━━━━━━━━━━━━━━━━━━━━ -->
                <template v-else-if="moyenPaiement === 'carte'">
                <section
                  class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[16px] flex flex-col gap-[24px] overflow-clip"
                >
                  <!-- Numéro de carte row — label left + masked number + brand logo right -->
                  <div class="flex items-center justify-between w-full">
                    <p class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary whitespace-nowrap">
                      Numéro de carte
                    </p>
                    <div class="flex items-center gap-[8px]">
                      <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                        •••• •••• •••• {{ displayCardLast4 }}
                      </p>
                      <!-- Mastercard mark — two overlapping circles in a bordered tile -->
                      <div class="shrink-0 w-[34px] h-[24px] bg-neutral border border-border-neutral-secondary rounded-[4px] flex items-center justify-center">
                        <div class="relative size-[16px]">
                          <div class="absolute left-0 top-[3px] size-[10px] rounded-full bg-[#eb001b]" />
                          <div class="absolute right-0 top-[3px] size-[10px] rounded-full bg-[#f79e1b] mix-blend-multiply" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="h-px w-full bg-border-neutral-secondary" />

                  <!-- Date d'expiration row -->
                  <div class="flex items-center gap-[16px] w-full font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
                    <p class="shrink-0 text-text-neutral-secondary whitespace-nowrap">Date d’expiration</p>
                    <p class="flex-1 min-w-0 text-text-neutral text-right truncate">{{ displayCardExpiration }}</p>
                  </div>
                </section>
                </template>
              </div>
            </Transition>
          </div>
        </template>

        <!-- Other tabs: empty placeholder -->
        <template v-else>
          <div
            class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] flex flex-col items-center justify-center gap-[8px] min-h-[200px] text-center"
          >
            <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
              {{ tabs.find(t => t.id === activeTab)?.label }}
            </p>
            <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
              À venir.
            </p>
          </div>
        </template>

        <!-- Footer spacer -->
        <div class="h-[60px] shrink-0 w-full" />
      </div>
    </Transition>

    <!-- Toast overlay (top-right, floats above the scroll area) -->
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

<style scoped>
/* Tab swap — matches .charges-row in SupervisedCharges so transitions feel consistent across BU pages. */
.tab-content-enter-active,
.tab-content-leave-active {
  transition:
    opacity 200ms ease,
    transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tab-content-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.tab-content-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
@media (prefers-reduced-motion: reduce) {
  .tab-content-enter-active,
  .tab-content-leave-active {
    transition: none;
  }
}
</style>
