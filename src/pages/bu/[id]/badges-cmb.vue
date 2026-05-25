<script setup lang="ts">
const headingClass = usePageHeadingClass()
const uiStore = useUiStore()
import { computed, reactive, ref } from 'vue'

interface RuleCard {
  id: string
  title: string
  description: string
  icon: string
  iconVariant: 'outline' | 'solid'
  origin: 'inherited' | 'custom'
  active: boolean
}

const tabs = [
  { id: 'list', label: 'Liste des badges' },
  { id: 'rules', label: 'Règles de recharge' },
  { id: 'tesla', label: 'Associations Tesla' },
]
const activeTab = ref<string>('rules')

// Mirrors the group-level rules grid (groups.vue:908). At the badge-type
// level each rule carries an extra "origin" pill — Hérité de la BU when
// the rule falls back to the BU defaults, Personnalisé when it has been
// overridden here. The Figma seeds five cards with a representative mix.
const rules: RuleCard[] = reactive([
  {
    id: 'budget',
    title: 'Budget et alertes',
    description: "Fixer un budget mensuel de recharge ainsi que des alertes en cas de dépassement d'un certain seuil",
    icon: 'money-coins',
    iconVariant: 'outline',
    origin: 'custom',
    active: true,
  },
  {
    id: 'autorisations',
    title: 'Autorisations quotidiennes',
    description: 'Maîtrisez les jours et les plages horaires pendant lesquels vous souhaitez autoriser ou interdire les recharges',
    icon: 'calendar-days',
    iconVariant: 'outline',
    origin: 'inherited',
    active: true,
  },
  {
    id: 'vacance',
    title: 'Blocage vacance',
    description: 'Activez le blocage vacances si vous souhaitez désactiver la recharge de vos conducteurs pendant une période donnée',
    icon: 'airport-alt',
    iconVariant: 'outline',
    origin: 'custom',
    active: false,
  },
  {
    id: 'pays',
    title: 'Gérer les pays autorisés',
    description: 'Définissez pays par pays ceux dans lesquels la recharge est autorisée ou interdite',
    icon: 'flag',
    iconVariant: 'outline',
    origin: 'inherited',
    active: false,
  },
  {
    id: 'reseau',
    title: 'Gérer les réseaux autorisés',
    description: 'Définissez réseau par réseau ceux sur lesquels la recharge est autorisée ou interdite',
    icon: 'globe-alt',
    iconVariant: 'outline',
    origin: 'inherited',
    active: true,
  },
])

// ── Budget drawer (Figma 6302-17796 inherited / 6302-18217 personnalisé) ─
// Two visual modes share the same drawer shell: read-only (inherited
// from the BU) vs editable (custom override). Personnaliser / Suivre
// les règles de la BU flip the mode inside the drawer; the rule's
// `origin` and active state are only committed on Enregistrer.
const budgetDrawerOpen = ref(false)
const alerteTypeItems = [
  { value: 'percentage', label: 'Pourcentage du budget de recharge' },
  { value: 'monthly',    label: 'Seuil d’alerte mensuel' },
]

// Mock BU defaults — surfaced in the read-only view and reapplied
// when the user clicks "Suivre les règles de la BU".
const budgetBuDefaults = {
  active: true,
  amount: '230.00',
  alertActive: true,
  alertType: 'percentage' as 'percentage' | 'monthly',
  alertAmount: '80',
}

const budgetForm = reactive<{
  draftOrigin: 'inherited' | 'custom'
  active: boolean
  amount: string
  alertActive: boolean
  alertType: 'percentage' | 'monthly'
  alertAmount: string
}>({
  draftOrigin: 'inherited',
  ...budgetBuDefaults,
})

let budgetSnapshot = { ...budgetForm }

const budgetReadOnlyAlertLabel = computed(() => {
  return budgetForm.alertType === 'percentage'
    ? 'Si le budget dépasse'
    : 'Seuil d’alerte mensuel'
})
const budgetReadOnlyAlertValue = computed(() => {
  const suffix = budgetForm.alertType === 'percentage' ? '%' : ' Eur'
  return `${budgetForm.alertAmount}${suffix}`
})
const alerteSuffix = computed(() => (budgetForm.alertType === 'percentage' ? '%' : 'Eur'))
const isAlerteAmountDisabled = computed(() => {
  if (budgetForm.alertType !== 'percentage') return false
  return !budgetForm.active
})

const budgetDirty = computed(() => {
  return budgetForm.draftOrigin !== budgetSnapshot.draftOrigin
    || budgetForm.active !== budgetSnapshot.active
    || budgetForm.amount !== budgetSnapshot.amount
    || budgetForm.alertActive !== budgetSnapshot.alertActive
    || budgetForm.alertType !== budgetSnapshot.alertType
    || budgetForm.alertAmount !== budgetSnapshot.alertAmount
})

function openBudgetDrawer() {
  const rule = rules.find(r => r.id === 'budget')
  if (!rule) return
  budgetForm.draftOrigin = rule.origin
  budgetForm.active = rule.active
  // Mock: amount/alert values aren't stored per-rule in this sandbox,
  // we always seed from BU defaults so the demo is consistent.
  budgetForm.amount = budgetBuDefaults.amount
  budgetForm.alertActive = budgetBuDefaults.alertActive
  budgetForm.alertType = budgetBuDefaults.alertType
  budgetForm.alertAmount = budgetBuDefaults.alertAmount
  budgetSnapshot = { ...budgetForm }
  budgetDrawerOpen.value = true
}

function closeBudgetDrawer() {
  Object.assign(budgetForm, budgetSnapshot)
  budgetDrawerOpen.value = false
}

function personalizeBudget() {
  budgetForm.draftOrigin = 'custom'
}

function inheritBudget() {
  budgetForm.draftOrigin = 'inherited'
  // Snap the editable values back to the BU defaults so the read-only
  // view matches what the BU rule would surface.
  budgetForm.active = budgetBuDefaults.active
  budgetForm.amount = budgetBuDefaults.amount
  budgetForm.alertActive = budgetBuDefaults.alertActive
  budgetForm.alertType = budgetBuDefaults.alertType
  budgetForm.alertAmount = budgetBuDefaults.alertAmount
}

function saveBudget() {
  const rule = rules.find(r => r.id === 'budget')
  if (!rule) return
  rule.origin = budgetForm.draftOrigin
  rule.active = budgetForm.active
  budgetDrawerOpen.value = false
  showSuccessToast('Règle de recharge mise à jour', '')
}

// ── Autorisations drawer (Figma 6302-19134 inherited) ───────────────────
// Same dual-mode shell as the Budget drawer: read-only when the rule is
// inherited from the BU, editable when personnalisé. Day cards collapse
// to a day-name + status string in read-only mode (Autorisé toute la
// journée / Bloqué toute la journée / Autorisé de HH:MM à HH:MM).
const autorisationsDrawerOpen = ref(false)

interface DayRule {
  id: string
  label: string
  active: boolean
  customHours: boolean
  start: string
  end: string
}

const autorisationsBuDefaults = {
  active: true,
  days: [
    { id: 'lundi',    label: 'Lundi',    active: true,  customHours: false, start: '',      end: ''      },
    { id: 'mardi',    label: 'Mardi',    active: false, customHours: false, start: '',      end: ''      },
    { id: 'mercredi', label: 'Mercredi', active: true,  customHours: true,  start: '09:00', end: '12:30' },
    { id: 'jeudi',    label: 'Jeudi',    active: true,  customHours: false, start: '',      end: ''      },
    { id: 'vendredi', label: 'Vendredi', active: true,  customHours: false, start: '',      end: ''      },
    { id: 'samedi',   label: 'Samedi',   active: true,  customHours: false, start: '',      end: ''      },
    { id: 'dimanche', label: 'Dimanche', active: false, customHours: false, start: '',      end: ''      },
  ] as DayRule[],
}

const autorisationsForm = reactive<{
  draftOrigin: 'inherited' | 'custom'
  active: boolean
  days: DayRule[]
}>({
  draftOrigin: 'inherited',
  active: autorisationsBuDefaults.active,
  days: cloneDays(autorisationsBuDefaults.days),
})

function cloneDays(src: DayRule[]): DayRule[] {
  return src.map(d => ({ ...d }))
}

let autorisationsSnapshot = {
  draftOrigin: autorisationsForm.draftOrigin,
  active: autorisationsForm.active,
  days: cloneDays(autorisationsForm.days),
}

function dayStatusLabel(day: DayRule): string {
  if (!day.active) return 'Bloqué toute la journée'
  if (!day.customHours) return 'Autorisé toute la journée'
  return `Autorisé de ${day.start || '00:00'} à ${day.end || '00:00'}`
}

const autorisationsDirty = computed(() => {
  if (autorisationsForm.draftOrigin !== autorisationsSnapshot.draftOrigin) return true
  if (autorisationsForm.active !== autorisationsSnapshot.active) return true
  if (autorisationsForm.days.length !== autorisationsSnapshot.days.length) return true
  for (let i = 0; i < autorisationsForm.days.length; i++) {
    const a = autorisationsForm.days[i]
    const b = autorisationsSnapshot.days[i]
    if (a.active !== b.active || a.customHours !== b.customHours
      || a.start !== b.start || a.end !== b.end) return true
  }
  return false
})

// HH:MM input mask helpers — strip non-digits, insert the colon
// once 3+ digits are in, then clamp on blur (hours 0–23, minutes 0–59).
function maskTimeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}
function clampTime(value: string): string {
  if (!value) return ''
  const m = value.match(/^(\d{1,2}):?(\d{0,2})$/)
  if (!m) return ''
  const h = Math.min(Math.max(parseInt(m[1] || '0', 10), 0), 23)
  const min = Math.min(Math.max(parseInt(m[2] || '0', 10), 0), 59)
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}
function onDayTimeInput(day: DayRule, key: 'start' | 'end', e: Event) {
  day[key] = maskTimeInput((e.target as HTMLInputElement).value)
}
function onDayTimeBlur(day: DayRule, key: 'start' | 'end') {
  day[key] = clampTime(day[key])
}

function openAutorisationsDrawer() {
  const rule = rules.find(r => r.id === 'autorisations')
  if (!rule) return
  autorisationsForm.draftOrigin = rule.origin
  autorisationsForm.active = autorisationsBuDefaults.active
  autorisationsForm.days = cloneDays(autorisationsBuDefaults.days)
  autorisationsSnapshot = {
    draftOrigin: autorisationsForm.draftOrigin,
    active: autorisationsForm.active,
    days: cloneDays(autorisationsForm.days),
  }
  autorisationsDrawerOpen.value = true
}

function closeAutorisationsDrawer() {
  autorisationsForm.draftOrigin = autorisationsSnapshot.draftOrigin
  autorisationsForm.active = autorisationsSnapshot.active
  autorisationsForm.days = cloneDays(autorisationsSnapshot.days)
  autorisationsDrawerOpen.value = false
}

function personalizeAutorisations() {
  autorisationsForm.draftOrigin = 'custom'
}

function inheritAutorisations() {
  autorisationsForm.draftOrigin = 'inherited'
  autorisationsForm.active = autorisationsBuDefaults.active
  autorisationsForm.days = cloneDays(autorisationsBuDefaults.days)
}

function saveAutorisations() {
  const rule = rules.find(r => r.id === 'autorisations')
  if (!rule) return
  rule.origin = autorisationsForm.draftOrigin
  rule.active = autorisationsForm.active
  autorisationsDrawerOpen.value = false
  showSuccessToast('Règle de recharge mise à jour', '')
}

function onRuleClick(rule: RuleCard) {
  if (rule.id === 'budget') openBudgetDrawer()
  else if (rule.id === 'autorisations') openAutorisationsDrawer()
}

// ── Toast (one at a time, auto-dismiss after 3.5s) ────────────────────────
const toast = reactive<{ visible: boolean; title: string; description: string }>({
  visible: false,
  title: '',
  description: '',
})
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showSuccessToast(title: string, description: string) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.title = title
  toast.description = description
  toast.visible = true
  toastTimer = setTimeout(() => { toast.visible = false }, 3500)
}
</script>

<template>
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]">
  <div
    class="mx-auto w-full flex flex-col gap-[32px]"
    :style="{ maxWidth: uiStore.getMaxWidth('/bu/badges-cmb') + 'px' }"
  >
    <!-- Page header -->
    <div class="flex items-center justify-between h-[48px] anim-fade-up" style="animation-delay: 0ms">
      <h1 :class="headingClass">
        Chargemap Business
      </h1>
      <Button
        type="primary"
        size="md"
        label="Commander des badges"
      />
    </div>

    <!-- Tabs -->
    <div class="anim-fade-up" style="animation-delay: 40ms">
      <HorizontalTabs
        v-model="activeTab"
        :tabs="tabs"
        variant="underline"
      />
    </div>

    <!-- Tab content -->
    <Transition
      mode="out-in"
      enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      enter-from-class="opacity-0 translate-y-[6px]"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-[opacity,transform] duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-[4px]"
    >
      <!-- ── Tab: Règles de recharge (Figma 6234-36234) ─────────────── -->
      <div v-if="activeTab === 'rules'" key="rules" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
        <button
          v-for="(rule, i) in rules"
          :key="rule.id"
          type="button"
          :style="{ animationDelay: `${40 + i * 30}ms` }"
          :class="[
            'text-left flex flex-col gap-[16px] p-[16px] rounded-[16px] overflow-clip anim-fade-up border outline-none cursor-pointer',
            'transition-[background-color,border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none',
            'shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]',
            'bg-neutral border-border-neutral-secondary hover:bg-neutral-hover focus-visible:shadow-ring-brand focus-visible:border-border-brand',
          ]"
          @click="onRuleClick(rule)"
        >
          <div class="flex items-center justify-between gap-[8px] w-full">
            <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-neutral-secondary border border-border-neutral-tertiary">
              <Icon :name="rule.icon" :variant="rule.iconVariant" :size="24" class="text-icon-neutral-secondary" />
            </div>
            <div class="shrink-0 flex items-center gap-[8px]">
              <span class="inline-flex items-center justify-center px-[10px] py-[2px] rounded-[16px] border border-[#e4e4e7] bg-[#fafafa] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-[#48566a] whitespace-nowrap">
                {{ rule.origin === 'inherited' ? 'Hérité de la BU' : 'Personnalisé' }}
              </span>
              <span
                :class="[
                  'inline-flex items-center justify-center px-[10px] py-[2px] rounded-[16px] border font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] whitespace-nowrap',
                  rule.active
                    ? 'bg-[#f2fdf9] border-[#bdfae3] text-[#18b97e]'
                    : 'bg-[#fafafa] border-[#e4e4e7] text-[#48566a]',
                ]"
              >
                {{ rule.active ? 'Activé' : 'Désactivé' }}
              </span>
            </div>
          </div>
          <div class="flex flex-col gap-[4px] w-full">
            <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
              {{ rule.title }}
            </p>
            <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
              {{ rule.description }}
            </p>
          </div>
        </button>
      </div>

      <!-- Placeholder for the other two tabs -->
      <div
        v-else
        key="placeholder"
        class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] flex flex-col items-center justify-center gap-[8px] min-h-[200px] text-center"
      >
        <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
          {{ tabs.find(t => t.id === activeTab)?.label }}
        </p>
        <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
          À venir.
        </p>
      </div>
    </Transition>

    <div class="h-[60px]" />

    <!-- ── Budget drawer (Figma 6302-17796 inherited / 6302-18217 custom) ── -->
    <Transition
      enter-active-class="transition-opacity duration-[200ms] ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-[160ms] ease-out motion-reduce:transition-none"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="budgetDrawerOpen"
        class="fixed inset-0 z-[39] bg-black/40"
        aria-hidden="true"
        @click="closeBudgetDrawer"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-[320ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="budgetDrawerOpen"
        class="fixed right-[8px] top-[8px] bottom-[8px] z-40 w-[424px] max-w-[calc(100%-16px)] bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] flex flex-col overflow-clip"
        role="dialog"
        aria-modal="true"
        aria-label="Configuration du budget"
      >
        <!-- Header -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[68px] border-b border-border-neutral-tertiary shrink-0">
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Configuration
          </p>
          <button
            type="button"
            class="shrink-0 flex items-center justify-center size-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
            aria-label="Fermer"
            @click="closeBudgetDrawer"
          >
            <Icon name="x-mark" variant="outline" :size="20" />
          </button>
        </div>

        <!-- Body — info banner + Budget section + Alerte section. -->
        <div class="flex-1 min-h-0 overflow-y-auto px-[16px] py-[16px] flex flex-col gap-[32px]">
          <!-- Inheritance banner — flips between "Règle héritée de la BU"
               (Personnaliser action) and "Règle personnalisée"
               (Suivre les règles de la BU action). -->
          <Alert
            type="brand"
            :dismissable="false"
            :title="budgetForm.draftOrigin === 'inherited' ? 'Règle héritée de la BU' : 'Règle personnalisée'"
            :description="budgetForm.draftOrigin === 'inherited'
              ? 'Personnalisez-la pour définir le fonctionnement de ce badge.'
              : 'Cette règle est propre à ce badge, elle ne suivra plus les modifications de la règle BU.'"
            :primary-action-label="''"
            :secondary-action-label="budgetForm.draftOrigin === 'inherited' ? 'Personnaliser' : 'Suivre les règles de la BU'"
            @secondary-action="budgetForm.draftOrigin === 'inherited' ? personalizeBudget() : inheritBudget()"
          />

          <!-- Cross-fade between read-only (inherited) and editable
               (custom) views. Same card structure either way; toggles
               and inputs morph into label/value rows when read-only. -->
          <Transition
            mode="out-in"
            enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            enter-from-class="opacity-0 translate-y-[6px]"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-[opacity,transform] duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-[4px]"
          >
            <!-- ─────────── READ-ONLY (inherited) ─────────── -->
            <div v-if="budgetForm.draftOrigin === 'inherited'" key="ro" class="flex flex-col gap-[32px]">
              <!-- Budget section (read-only) -->
              <div class="flex flex-col gap-[12px]">
                <section class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex flex-col gap-[16px]">
                  <div class="flex flex-col gap-[4px]">
                    <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                      Budget
                    </p>
                    <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                      Définissez un budget mensuel de recharge. Une fois le plafond atteint, les conducteurs peuvent prendre le relais avec leur carte bancaire.
                    </p>
                  </div>

                  <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />

                  <div class="flex items-center justify-between gap-[16px]">
                    <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                      État
                    </span>
                    <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                      {{ budgetForm.active ? 'Activé' : 'Désactivé' }}
                    </span>
                  </div>
                </section>

                <section
                  v-if="budgetForm.active"
                  class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex items-center justify-between gap-[16px]"
                >
                  <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                    Budget mensuel
                  </span>
                  <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                    {{ budgetForm.amount }} Eur
                  </span>
                </section>
              </div>

              <!-- Alerte section (read-only) -->
              <div class="flex flex-col gap-[12px]">
                <section class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex flex-col gap-[16px]">
                  <div class="flex flex-col gap-[4px]">
                    <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                      Alerte
                    </p>
                    <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                      Soyez alerté par e-mail dès qu'un conducteur dépasse un seuil de budget défini.
                    </p>
                  </div>

                  <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />

                  <div class="flex items-center justify-between gap-[16px]">
                    <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                      État
                    </span>
                    <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                      {{ budgetForm.alertActive ? 'Activé' : 'Désactivé' }}
                    </span>
                  </div>
                </section>

                <section
                  v-if="budgetForm.alertActive"
                  class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex items-center justify-between gap-[16px]"
                >
                  <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                    {{ budgetReadOnlyAlertLabel }}
                  </span>
                  <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                    {{ budgetReadOnlyAlertValue }}
                  </span>
                </section>
              </div>
            </div>

            <!-- ─────────── EDITABLE (custom) ─────────── -->
            <div v-else key="edit" class="flex flex-col gap-[32px]">
              <!-- Budget section (editable) -->
              <div class="flex flex-col gap-[12px]">
                <section class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex flex-col gap-[16px]">
                  <div class="flex flex-col gap-[4px]">
                    <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                      Budget
                    </p>
                    <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                      Définissez un budget mensuel de recharge. Une fois le plafond atteint, les conducteurs peuvent prendre le relais avec leur carte bancaire.
                    </p>
                  </div>

                  <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />

                  <div class="flex items-center justify-between gap-[16px]">
                    <span
                      :class="[
                        'font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] transition-colors duration-150 ease-out motion-reduce:transition-none',
                        budgetForm.active ? 'text-text-neutral' : 'text-text-neutral-secondary',
                      ]"
                    >
                      {{ budgetForm.active ? 'Activé' : 'Désactivé' }}
                    </span>
                    <Toggle
                      v-model="budgetForm.active"
                      size="md"
                      aria-label="Activer le budget de recharge"
                    />
                  </div>
                </section>

                <Transition
                  enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                  enter-from-class="opacity-0 -translate-y-[4px]"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 -translate-y-[4px]"
                >
                  <section
                    v-if="budgetForm.active"
                    class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex items-center justify-between gap-[16px]"
                  >
                    <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                      Budget mensuel
                    </span>
                    <div class="shrink-0 w-[150px]">
                      <Input
                        v-model="budgetForm.amount"
                        type="trailingText"
                        :addon-trailing-text="'Eur'"
                        :show-currency-icon="false"
                        :trailing-separator="false"
                        placeholder="0,00"
                      />
                    </div>
                  </section>
                </Transition>
              </div>

              <!-- Alerte section (editable) -->
              <div class="flex flex-col gap-[12px]">
                <section class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex flex-col gap-[16px]">
                  <div class="flex flex-col gap-[4px]">
                    <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                      Alerte
                    </p>
                    <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                      Soyez alerté par e-mail dès qu'un conducteur dépasse un seuil de budget défini.
                    </p>
                  </div>

                  <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />

                  <div class="flex items-center justify-between gap-[16px]">
                    <span
                      :class="[
                        'font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] transition-colors duration-150 ease-out motion-reduce:transition-none',
                        budgetForm.alertActive ? 'text-text-neutral' : 'text-text-neutral-secondary',
                      ]"
                    >
                      {{ budgetForm.alertActive ? 'Activé' : 'Désactivé' }}
                    </span>
                    <Toggle
                      v-model="budgetForm.alertActive"
                      size="md"
                      aria-label="Activer le seuil d'alerte"
                    />
                  </div>
                </section>

                <Transition
                  enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                  enter-from-class="opacity-0 -translate-y-[4px]"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                  leave-from-class="opacity-100 translate-y-0"
                  leave-to-class="opacity-0 -translate-y-[4px]"
                >
                  <section
                    v-if="budgetForm.alertActive"
                    class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex flex-col gap-[16px]"
                  >
                    <Dropdown
                      v-model="budgetForm.alertType"
                      :items="alerteTypeItems"
                      :searchable="false"
                      :show-label="false"
                      :show-hint="false"
                      :teleport="true"
                    />
                    <Input
                      v-model="budgetForm.alertAmount"
                      type="trailingText"
                      :addon-trailing-text="alerteSuffix"
                      :show-currency-icon="false"
                      :trailing-separator="false"
                      :disabled="isAlerteAmountDisabled"
                      placeholder="0"
                    />
                  </section>
                </Transition>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[69px] border-t border-border-neutral-tertiary shrink-0">
          <Button type="secondary" size="md" label="Annuler" @click="closeBudgetDrawer" />
          <Button type="primary" size="md" label="Enregistrer" :disabled="!budgetDirty" @click="saveBudget" />
        </div>
      </aside>
    </Transition>

    <!-- ── Autorisations drawer (Figma 6302-19134 inherited / custom) ── -->
    <Transition
      enter-active-class="transition-opacity duration-[200ms] ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-[160ms] ease-out motion-reduce:transition-none"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="autorisationsDrawerOpen"
        class="fixed inset-0 z-[39] bg-black/40"
        aria-hidden="true"
        @click="closeAutorisationsDrawer"
      />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-[320ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="autorisationsDrawerOpen"
        class="fixed right-[8px] top-[8px] bottom-[8px] z-40 w-[424px] max-w-[calc(100%-16px)] bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] flex flex-col overflow-clip"
        role="dialog"
        aria-modal="true"
        aria-label="Configuration des autorisations quotidiennes"
      >
        <!-- Header -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[68px] border-b border-border-neutral-tertiary shrink-0">
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Configuration
          </p>
          <button
            type="button"
            class="shrink-0 flex items-center justify-center size-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
            aria-label="Fermer"
            @click="closeAutorisationsDrawer"
          >
            <Icon name="x-mark" variant="outline" :size="20" />
          </button>
        </div>

        <!-- Body — info banner + header card + day cards. -->
        <div class="flex-1 min-h-0 overflow-y-auto px-[16px] py-[16px] flex flex-col gap-[16px]">
          <Alert
            type="brand"
            :dismissable="false"
            :title="autorisationsForm.draftOrigin === 'inherited' ? 'Règle héritée de la BU' : 'Règle personnalisée'"
            :description="autorisationsForm.draftOrigin === 'inherited'
              ? 'Personnalisez-la pour définir le fonctionnement de ce badge.'
              : 'Cette règle est propre à ce badge, elle ne suivra plus les modifications de la règle BU.'"
            :primary-action-label="''"
            :secondary-action-label="autorisationsForm.draftOrigin === 'inherited' ? 'Personnaliser' : 'Suivre les règles de la BU'"
            @secondary-action="autorisationsForm.draftOrigin === 'inherited' ? personalizeAutorisations() : inheritAutorisations()"
          />

          <Transition
            mode="out-in"
            enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            enter-from-class="opacity-0 translate-y-[6px]"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-[opacity,transform] duration-[120ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-[4px]"
          >
            <!-- ─────────── READ-ONLY (inherited) ─────────── -->
            <div v-if="autorisationsForm.draftOrigin === 'inherited'" key="ro" class="flex flex-col gap-[16px]">
              <!-- Header card (read-only) -->
              <section class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex flex-col gap-[16px]">
                <div class="flex flex-col gap-[4px]">
                  <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                    Autorisations quotidiennes
                  </p>
                  <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                    Maîtrisez les jours et les plages horaires pendant lesquels vous souhaitez autoriser ou interdire les recharges
                  </p>
                </div>
                <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />
                <div class="flex items-center justify-between gap-[16px]">
                  <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">
                    État
                  </span>
                  <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                    {{ autorisationsForm.active ? 'Activé' : 'Désactivé' }}
                  </span>
                </div>
              </section>

              <!-- Day cards (read-only) — visible when the master toggle is on -->
              <template v-if="autorisationsForm.active">
                <article
                  v-for="day in autorisationsForm.days"
                  :key="day.id"
                  class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm overflow-clip"
                >
                  <div class="px-[16px] py-[12px]">
                    <p class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                      {{ day.label }}
                    </p>
                  </div>
                  <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />
                  <div class="px-[16px] py-[12px]">
                    <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                      {{ dayStatusLabel(day) }}
                    </p>
                  </div>
                </article>
              </template>
            </div>

            <!-- ─────────── EDITABLE (custom) ─────────── -->
            <div v-else key="edit" class="flex flex-col gap-[16px]">
              <section class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[16px] flex flex-col gap-[16px]">
                <div class="flex flex-col gap-[4px]">
                  <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
                    Autorisations quotidiennes
                  </p>
                  <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                    Maîtrisez les jours et les plages horaires pendant lesquels vous souhaitez autoriser ou interdire les recharges
                  </p>
                </div>
                <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />
                <div class="flex items-center justify-between gap-[16px]">
                  <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                    Activé
                  </span>
                  <Toggle
                    v-model="autorisationsForm.active"
                    size="md"
                    aria-label="Activer les autorisations quotidiennes"
                  />
                </div>
              </section>

              <Transition
                enter-active-class="transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                enter-from-class="opacity-0 -translate-y-[4px]"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-[4px]"
              >
                <div v-if="autorisationsForm.active" class="flex flex-col gap-[16px]">
                  <article
                    v-for="day in autorisationsForm.days"
                    :key="day.id"
                    class="bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm overflow-clip"
                  >
                    <div class="flex items-center justify-between px-[16px] py-[12px]">
                      <p class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                        {{ day.label }}
                      </p>
                      <Toggle
                        v-model="day.active"
                        size="sm"
                        :aria-label="`Activer ${day.label}`"
                      />
                    </div>
                    <div class="h-px bg-border-neutral-tertiary" aria-hidden="true" />
                    <div class="flex items-center justify-between gap-[8px] px-[16px] py-[12px]">
                      <template v-if="!day.customHours">
                        <p class="flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                          {{ day.active ? 'Autorisé toute la journée' : 'Bloqué toute la journée' }}
                        </p>
                        <Button
                          type="secondary"
                          size="sm"
                          label="Modifier"
                          :disabled="!day.active"
                          class="w-[77px]"
                          @click="day.customHours = true"
                        />
                      </template>
                      <template v-else>
                        <div class="flex-1 min-w-0 flex items-center gap-[8px]">
                          <div class="flex-1 min-w-0 flex items-center gap-[8px] px-[12px] py-[8px] rounded-[8px] border border-border-neutral-secondary bg-neutral shadow-sm transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none focus-within:border-brand focus-within:shadow-ring-brand">
                            <Icon name="clock" variant="outline" :size="18" class="shrink-0 text-icon-neutral-secondary" />
                            <input
                              :value="day.start"
                              inputmode="numeric"
                              placeholder="00:00"
                              maxlength="5"
                              :aria-label="`Heure de début ${day.label}`"
                              class="flex-1 min-w-0 outline-none bg-transparent font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary placeholder:text-text-neutral-secondary"
                              @input="onDayTimeInput(day, 'start', $event)"
                              @blur="onDayTimeBlur(day, 'start')"
                            >
                          </div>
                          <span class="shrink-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">à</span>
                          <div class="flex-1 min-w-0 flex items-center gap-[8px] px-[12px] py-[8px] rounded-[8px] border border-border-neutral-secondary bg-neutral shadow-sm transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none focus-within:border-brand focus-within:shadow-ring-brand">
                            <Icon name="clock" variant="outline" :size="18" class="shrink-0 text-icon-neutral-secondary" />
                            <input
                              :value="day.end"
                              inputmode="numeric"
                              placeholder="00:00"
                              maxlength="5"
                              :aria-label="`Heure de fin ${day.label}`"
                              class="flex-1 min-w-0 outline-none bg-transparent font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary placeholder:text-text-neutral-secondary"
                              @input="onDayTimeInput(day, 'end', $event)"
                              @blur="onDayTimeBlur(day, 'end')"
                            >
                          </div>
                        </div>
                        <Button
                          type="secondary"
                          size="sm"
                          label="Supprimer"
                          @click="day.customHours = false"
                        />
                      </template>
                    </div>
                  </article>
                </div>
              </Transition>
            </div>
          </Transition>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-[16px] px-[16px] h-[69px] border-t border-border-neutral-tertiary shrink-0">
          <Button type="secondary" size="md" label="Annuler" @click="closeAutorisationsDrawer" />
          <Button type="primary" size="md" label="Enregistrer" :disabled="!autorisationsDirty" @click="saveAutorisations" />
        </div>
      </aside>
    </Transition>

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
  </div>
</template>
