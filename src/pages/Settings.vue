<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import Icon from '../components/ui/Icon.vue'
import Input from '../components/ui/Input.vue'
import Dropdown from '../components/ui/Dropdown.vue'
import Toast from '../components/ui/Toast.vue'
import Alert from '../components/ui/Alert.vue'
import Toggle from '../components/ui/Toggle.vue'
import HorizontalTabs from '../components/ui/HorizontalTabs.vue'
import { orga } from '../state/orga'
import { isNavV2, V1_PAGE_HEADING } from '../state/nav'
import briefcaseHero from '../assets/illustrations/upsell-briefcase-hero.png'
import classicHighlight from '../assets/illustrations/classic-highlight.png'

const tabs = [
  { id: 'informations', label: 'Informations' },
  { id: 'package', label: 'Package' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'panel-admin', label: 'Panel Admin' },
  { id: 'tokens-api', label: 'Tokens API' },
]
const activeTab = ref('informations')
// Page heading is tab-specific (Figma uses "Votre package" on the package tab).
const pageTitle = computed(() => {
  if (activeTab.value === 'package') return 'Votre package'
  return tabs.find(t => t.id === activeTab.value)?.label ?? 'Paramètres'
})

// ── Data (single source of truth — view + edit read/write the same fields) ──
const admin = reactive({
  name: 'Maxime Colas-Boudot',
  email: 'accounting@brakson.com',
})

const adminItems = [
  { value: 'maxime', label: 'Maxime Colas-Boudot', email: 'accounting@brakson.com' },
  { value: 'romain', label: 'Romain Orriols',      email: 'romain.orriols@brakson.com' },
  { value: 'marie',  label: 'Marie Dubois',        email: 'marie.dubois@brakson.com' },
]
const adminSelected = ref('maxime')

const flag = (cc: string) =>
  `https://hatscripts.github.io/circle-flags/flags/${cc.toLowerCase()}.svg`

const paysItems = [
  { value: 'FR', label: 'France',             flagUrl: flag('FR') },
  { value: 'BE', label: 'Belgique',           flagUrl: flag('BE') },
  { value: 'CH', label: 'Suisse',             flagUrl: flag('CH') },
  { value: 'LU', label: 'Luxembourg',         flagUrl: flag('LU') },
  { value: 'DE', label: 'Allemagne',          flagUrl: flag('DE') },
  { value: 'IT', label: 'Italie',             flagUrl: flag('IT') },
  { value: 'ES', label: 'Espagne',            flagUrl: flag('ES') },
  { value: 'PT', label: 'Portugal',           flagUrl: flag('PT') },
  { value: 'NL', label: 'Pays-Bas',           flagUrl: flag('NL') },
  { value: 'GB', label: 'Royaume-Uni',        flagUrl: flag('GB') },
  { value: 'IE', label: 'Irlande',            flagUrl: flag('IE') },
  { value: 'AT', label: 'Autriche',           flagUrl: flag('AT') },
  { value: 'PL', label: 'Pologne',            flagUrl: flag('PL') },
  { value: 'CZ', label: 'République tchèque', flagUrl: flag('CZ') },
  { value: 'DK', label: 'Danemark',           flagUrl: flag('DK') },
  { value: 'SE', label: 'Suède',              flagUrl: flag('SE') },
  { value: 'NO', label: 'Norvège',            flagUrl: flag('NO') },
  { value: 'FI', label: 'Finlande',           flagUrl: flag('FI') },
]
const selectedPays = computed(() => paysItems.find(p => p.value === orga.pays))

// ── Per-card edit state ───────────────────────────────────────────────────
// Each card snapshots its values on enter and compares on save — if anything
// changed, we flash a success toast. The dropdown-backed admin selection is
// resolved to name/email here so the view mode always shows the saved values.
const editing = reactive<Record<'admin' | 'orga', boolean>>({
  admin: false,
  orga: false,
})

type OrgaSnapshot = typeof orga
let adminSnapshot = adminSelected.value
let orgaSnapshot: OrgaSnapshot = { ...orga }

// Toast state — one at a time, auto-dismiss after 3.5s.
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

const onToggleAdmin = () => {
  if (!editing.admin) {
    adminSnapshot = adminSelected.value
    editing.admin = true
    return
  }
  // Save: resolve dropdown → name/email, detect change, toast.
  const picked = adminItems.find(i => i.value === adminSelected.value)
  if (picked) {
    admin.name = picked.label
    admin.email = picked.email
  }
  if (adminSelected.value !== adminSnapshot) {
    showSuccessToast('Informations mis à jours', '')
  }
  editing.admin = false
}

const onToggleOrga = () => {
  if (!editing.orga) {
    orgaSnapshot = { ...orga }
    editing.orga = true
    return
  }
  const changed =
    orga.raisonSociale !== orgaSnapshot.raisonSociale ||
    orga.adresse !== orgaSnapshot.adresse ||
    orga.codePostal !== orgaSnapshot.codePostal ||
    orga.ville !== orgaSnapshot.ville ||
    orga.pays !== orgaSnapshot.pays
  if (changed) {
    showSuccessToast('Informations mis à jours', '')
  }
  editing.orga = false
}

// ── Package tab ───────────────────────────────────────────────────────────
// Figma defines Fonctionnalités content for "Itinérance" and "Autres" only;
// Domicile/Entreprise surface the empty-state panel until designed.
type FeatureCategory = 'itinerance' | 'domicile' | 'entreprise' | 'autres'
type TarifCategory = 'itinerance' | 'domicile' | 'entreprise'

const featureCategory = ref<FeatureCategory>('itinerance')
const tarifCategory = ref<TarifCategory>('itinerance')

const featureTabs: { id: FeatureCategory; label: string }[] = [
  { id: 'itinerance', label: 'Itinérance' },
  { id: 'domicile',   label: 'Domicile' },
  { id: 'entreprise', label: 'Entreprise' },
  { id: 'autres',     label: 'Autres' },
]
const tarifTabs: { id: TarifCategory; label: string }[] = [
  { id: 'itinerance', label: 'Itinérance' },
  { id: 'domicile',   label: 'Domicile' },
  { id: 'entreprise', label: 'Entreprise' },
]

type FeatureItem = { label: string; included: boolean }
const featureColumns: Record<FeatureCategory, [FeatureItem[], FeatureItem[]]> = {
  itinerance: [
    [
      { label: 'Recharge en itinérance',              included: true  },
      { label: 'Recharge sur le réseau Tesla',        included: true  },
      { label: 'L’app Chargemap pour vos conducteurs',included: true  },
      { label: 'Alertes de dépassement de budget',    included: false },
    ],
    [
      { label: 'Blocage de badges',                   included: false },
      { label: 'Export des données de recharge',      included: false },
      { label: 'Relevé kilométrique',                 included: false },
    ],
  ],
  domicile: [
    [
      { label: 'Recharge au domicile du conducteur',           included: true  },
      { label: 'Connectivité 4G',                              included: true  },
      { label: 'Suppression des publicités dans l’app Chargemap', included: true  },
      { label: 'Remboursement auto du conducteur',             included: false },
    ],
    [
      { label: 'Export des données de recharge',               included: false },
    ],
  ],
  entreprise: [
    [
      { label: 'Recharges site d’entreprise',           included: true  },
      { label: 'Refacturation des recharges',           included: true  },
      { label: 'Alerte de fin de charge',               included: true  },
      { label: 'Option incitation anti voiture ventouse', included: true  },
    ],
    [
      { label: 'Export des données de recharge',        included: false },
    ],
  ],
  autres: [
    [
      { label: '1 utilisateur',                       included: true  },
      { label: '1 Business unit',                     included: true  },
      { label: 'Gestion de plusieurs utilisateurs et BU', included: false },
      { label: 'Accompagnement dédié',                included: false },
    ],
    [
      { label: 'Péages et parkings en France',        included: false },
      { label: 'Connexions API',                      included: false },
      { label: 'Affectation des coûts à la commande', included: false },
      { label: 'Numéro de commande',                  included: false },
    ],
  ],
}
const activeFeatureColumns = computed(() => featureColumns[featureCategory.value])
const hasFeatureContent = computed(
  () => activeFeatureColumns.value[0].length + activeFeatureColumns.value[1].length > 0,
)

type TarifRow = { label: string; value: string }
const tarifRows: Record<TarifCategory, TarifRow[]> = {
  itinerance: [
    { label: 'Licences d’itinérance',       value: '1,00 € / an par licences' },
    { label: 'Badge (livraison France)',    value: '0.00 € / unité' },
    { label: 'Badge (livraison hors France)', value: '00,00 € / unité' },
  ],
  domicile:   [],
  entreprise: [],
}
const activeTarifRows = computed(() => tarifRows[tarifCategory.value])

const renewRows = [
  { label: 'Date du prochain renouvellement',   value: '01/12/2026' },
  { label: 'Délai de paiement',                 value: '60 jours' },
  { label: 'Montant du prochain renouvellement', value: '102,00 €' },
]

// ── Configuration tab ─────────────────────────────────────────────────────
const remboursementEnabled = ref(true)
watch(remboursementEnabled, value => {
  showSuccessToast(
    value ? 'Remboursement automatique activé' : 'Remboursement automatique désactivé',
    '',
  )
})

// ── Tokens API tab ────────────────────────────────────────────────────────
// Figma 4832-17747 — last 4 chars visible, the rest masked. Mask is 17 bullets
// + 3 literal spaces + the tail, matching the Figma string exactly.
const orgaId = '2047'
async function copyOrgaId() {
  try {
    await navigator.clipboard.writeText(orgaId)
  } catch {
    // Older browsers / insecure contexts — silently skip, the toast still
    // confirms intent from the user's perspective.
  }
  showSuccessToast('ID copié', `${orgaId} a été copié dans le presse-papiers.`)
}
type Token = { id: string; tail: string; scope: string; date: string; comment?: string }
const tokens = ref<Token[]>([
  { id: 't1', tail: '6fa8', scope: 'Toutes les BU',   date: '29/08/2024' },
  { id: 't2', tail: '6fa8', scope: '1 Business unit', date: '29/08/2024' },
  { id: 't3', tail: '6fa8', scope: '1 Business unit', date: '29/08/2024' },
])
const tokenMask = '•'.repeat(17)

// — New token modal —
// "all" yields "Toutes les BU", a single BU yields "1 Business unit"
// (matches existing Figma rows). Comment is optional metadata only.
const buItems = [
  { value: 'all',       label: 'Toutes les BU' },
  { value: 'chargemap', label: 'Chargemap' },
  { value: 'brakson',   label: 'Brakson' },
  { value: 'mobilite',  label: 'Mobilité Pro' },
]
const newTokenOpen = ref(false)
const newTokenBu = ref<string>('all')
const newTokenComment = ref('')
const newTokenJustCreatedId = ref<string | null>(null)

const openNewToken = () => {
  newTokenBu.value = 'all'
  newTokenComment.value = ''
  newTokenOpen.value = true
}
const closeNewToken = () => {
  newTokenOpen.value = false
}

const randomTail = () => {
  const chars = '0123456789abcdef'
  let s = ''
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}
const formatToday = () => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

const createToken = () => {
  const scope = newTokenBu.value === 'all' ? 'Toutes les BU' : '1 Business unit'
  const id = `t${Date.now()}`
  const created: Token = {
    id,
    tail: randomTail(),
    scope,
    date: formatToday(),
    comment: newTokenComment.value.trim() || undefined,
  }
  tokens.value = [created, ...tokens.value]
  newTokenJustCreatedId.value = id
  setTimeout(() => {
    if (newTokenJustCreatedId.value === id) newTokenJustCreatedId.value = null
  }, 1800)
  closeNewToken()
  showSuccessToast('Nouveau token API créé', '')
}

// ESC closes the modal globally so the user never needs to chase the X.
watch(newTokenOpen, isOpen => {
  if (typeof window === 'undefined') return
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeNewToken()
  }
  if (isOpen) {
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    ;(window as unknown as { __tokenModalEsc?: typeof handler }).__tokenModalEsc = handler
  } else {
    const prev = (window as unknown as { __tokenModalEsc?: typeof handler }).__tokenModalEsc
    if (prev) window.removeEventListener('keydown', prev)
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <div class="min-h-full h-full flex flex-col items-center gap-[40px] px-[32px] pt-[32px] pb-0 overflow-y-auto">

    <!-- Page header -->
    <div class="w-full max-w-[800px] flex items-center gap-[16px] anim-fade-up" style="animation-delay: 0ms">
      <h1 :class="isNavV2 ? 'font-heading font-semibold text-[32px] leading-[1.5] tracking-[-0.96px] text-text-neutral' : V1_PAGE_HEADING">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Horizontal tabs -->
    <div
      class="w-full max-w-[800px] flex items-end gap-[12px] h-[36px] border-b border-border-neutral-secondary anim-fade-up"
      style="animation-delay: 40ms"
      role="tablist"
    >
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        role="tab"
        :aria-selected="activeTab === t.id"
        :class="[
          'relative pb-[8px] px-[4px] font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray rounded-[4px]',
          activeTab === t.id
            ? 'text-text-brand-medium'
            : 'text-text-neutral-secondary hover:text-text-neutral',
        ]"
        @click="activeTab = t.id"
      >
        {{ t.label }}
        <span
          v-if="activeTab === t.id"
          class="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-brand"
        />
      </button>
    </div>

    <!-- Tab content — canonical tab-fade animation (see main.css). -->
    <Transition mode="out-in" name="tab-fade">
      <div
        :key="activeTab"
        class="w-full max-w-[800px] flex flex-col gap-[16px]"
      >
        <!-- Informations tab -->
        <template v-if="activeTab === 'informations'">

          <!-- ──────────── Administrateur card ──────────── -->
          <section
            :class="[
              'relative w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] flex flex-col gap-[16px] anim-fade-up',
              editing.admin ? 'z-20' : 'z-10',
            ]"
            style="animation-delay: 120ms"
          >
            <!-- Header (stable across modes — only the action button morphs) -->
            <div class="flex items-center gap-[12px] w-full">
              <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#6467f2]">
                <Icon name="user" variant="solid" :size="24" class="text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
                  Administrateur
                </p>
              </div>
              <button
                type="button"
                :class="[
                  'shrink-0 rounded-[8px] px-[12px] py-[8px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] outline-none focus-visible:shadow-ring-brand active:scale-[0.97]',
                  'transition-[background-color,border-color,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]',
                  editing.admin
                    ? 'bg-brand border border-brand text-white hover:bg-brand-hover'
                    : 'bg-neutral border border-border-neutral text-text-neutral-secondary hover:bg-neutral-secondary',
                ]"
                @click="onToggleAdmin"
              >
                <Transition
                  mode="out-in"
                  enter-active-class="transition-opacity duration-[140ms] ease-out motion-reduce:transition-none"
                  enter-from-class="opacity-0"
                  enter-to-class="opacity-100"
                  leave-active-class="transition-opacity duration-[100ms] ease-out motion-reduce:transition-none"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <span :key="editing.admin ? 'save' : 'edit'" class="inline-block">
                    {{ editing.admin ? 'Enregistrer' : 'Modifier' }}
                  </span>
                </Transition>
              </button>
            </div>

            <!-- Body — view ↔ edit cross-fade -->
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
              <div v-if="!editing.admin" key="view" class="flex flex-col gap-[16px] w-full">
                <div class="h-px w-full bg-border-neutral-secondary" />
                <div class="flex items-center justify-between h-[37px] py-[8px] w-full font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
                  <p class="flex-1 min-w-0 font-normal text-text-neutral-secondary">Administrateur</p>
                  <p class="flex-1 min-w-0 font-medium text-text-neutral text-right truncate">{{ admin.name }}</p>
                </div>
                <div class="h-px w-full bg-border-neutral-secondary" />
                <div class="flex items-center justify-between h-[37px] py-[8px] w-full font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
                  <p class="flex-1 min-w-0 font-normal text-text-neutral-secondary">Email</p>
                  <p class="flex-1 min-w-0 font-medium text-text-neutral text-right truncate">{{ admin.email }}</p>
                </div>
              </div>

              <!-- Edit mode — full-width labeled dropdown -->
              <div v-else key="edit" class="flex flex-col gap-[16px] w-full">
                <Dropdown
                  v-model="adminSelected"
                  :items="adminItems"
                  label="Administrateur"
                  :show-hint="false"
                  :searchable="false"
                  placeholder="Sélectionner un administrateur"
                />
              </div>
            </Transition>
          </section>

          <!-- ──────────── Organisation card ──────────── -->
          <section
            :class="[
              'relative w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] flex flex-col gap-[16px] anim-fade-up',
              editing.orga ? 'z-20' : 'z-10',
            ]"
            style="animation-delay: 180ms"
          >
            <!-- Header -->
            <div class="flex items-center gap-[12px] w-full">
              <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#6467f2]">
                <Icon name="building-library" variant="solid" :size="24" class="text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
                  Organisation
                </p>
              </div>
              <button
                type="button"
                :class="[
                  'shrink-0 rounded-[8px] px-[12px] py-[8px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] outline-none focus-visible:shadow-ring-brand active:scale-[0.97]',
                  'transition-[background-color,border-color,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]',
                  editing.orga
                    ? 'bg-brand border border-brand text-white hover:bg-brand-hover'
                    : 'bg-neutral border border-border-neutral text-text-neutral-secondary hover:bg-neutral-secondary',
                ]"
                @click="onToggleOrga"
              >
                <Transition
                  mode="out-in"
                  enter-active-class="transition-opacity duration-[140ms] ease-out motion-reduce:transition-none"
                  enter-from-class="opacity-0"
                  enter-to-class="opacity-100"
                  leave-active-class="transition-opacity duration-[100ms] ease-out motion-reduce:transition-none"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <span :key="editing.orga ? 'save' : 'edit'" class="inline-block">
                    {{ editing.orga ? 'Enregistrer' : 'Modifier' }}
                  </span>
                </Transition>
              </button>
            </div>

            <!-- Body — view ↔ edit cross-fade -->
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
              <div v-if="!editing.orga" key="view" class="flex flex-col gap-[16px] w-full">
                <div class="h-px w-full bg-border-neutral-secondary" />
                <div class="flex items-center justify-between h-[37px] py-[8px] w-full font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
                  <p class="flex-1 min-w-0 font-normal text-text-neutral-secondary">Raison sociale</p>
                  <p class="flex-1 min-w-0 font-medium text-text-neutral text-right truncate">{{ orga.raisonSociale }}</p>
                </div>
                <div class="h-px w-full bg-border-neutral-secondary" />
                <div class="flex items-start justify-between min-h-[58px] py-[8px] w-full font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
                  <p class="flex-1 min-w-0 font-normal text-text-neutral-secondary">Adresse</p>
                  <div class="flex-1 min-w-0 font-medium text-text-neutral text-right">
                    <p>{{ orga.adresse }}</p>
                    <p>{{ orga.codePostal }} {{ orga.ville }}, {{ selectedPays?.label ?? '' }}</p>
                  </div>
                </div>
              </div>

              <!-- Edit mode -->
              <div v-else key="edit" class="flex flex-col gap-[16px] w-full">
                <Input
                  v-model="orga.raisonSociale"
                  label="Raison sociale"
                  placeholder="Brakson"
                />
                <Input
                  v-model="orga.adresse"
                  label="Adresse"
                  placeholder="7 Allée Ceres"
                />
                <div class="flex gap-[16px] w-full">
                  <div class="flex-1 min-w-0">
                    <Input
                      v-model="orga.codePostal"
                      label="Code postal"
                      placeholder="67000"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <Input
                      v-model="orga.ville"
                      label="Ville"
                      placeholder="Strasbourg"
                    />
                  </div>
                </div>
                <Dropdown
                  v-model="orga.pays"
                  :items="paysItems"
                  input-type="country"
                  menu-type="country"
                  label="Pays"
                  :show-hint="false"
                  :searchable="true"
                  search-placeholder="Rechercher un pays"
                  placeholder="Sélectionner un pays"
                >
                  <template v-if="selectedPays" #flag>
                    <img
                      :src="selectedPays.flagUrl"
                      :alt="selectedPays.label"
                      class="shrink-0 w-5 h-5 rounded-full object-cover"
                    />
                  </template>
                </Dropdown>
              </div>
            </Transition>
          </section>

          <!-- ──────────── Renouvellement ──────────── -->
          <section
            class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm overflow-clip anim-fade-up"
            style="animation-delay: 240ms"
          >
            <div class="flex flex-col gap-[16px] p-[24px] w-full">
              <div class="flex items-center w-full">
                <div class="flex items-center gap-[8px] w-[310.5px]">
                  <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#6467f2]">
                    <Icon name="clock" variant="solid" :size="24" class="text-white" />
                  </div>
                  <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral whitespace-nowrap">
                    Renouvellement
                  </p>
                </div>
              </div>

              <template v-for="row in renewRows" :key="row.label">
                <div class="h-px w-full bg-border-neutral-secondary" />
                <div class="flex items-center justify-between h-[37px] py-[8px] w-full">
                  <p class="flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                    {{ row.label }}
                  </p>
                  <p class="flex-1 min-w-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral text-right">
                    {{ row.value }}
                  </p>
                </div>
              </template>
            </div>

            <div class="flex items-center justify-center px-[24px] py-[12px] h-[61px] w-full border-t border-border-neutral-secondary">
              <button
                type="button"
                class="flex items-center justify-center gap-[8px] p-0 rounded-[8px] outline-none focus-visible:shadow-ring-brand font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-[#1e40af] whitespace-nowrap"
              >
                Voir le détail
              </button>
            </div>
          </section>
        </template>

        <!-- Package tab -->
        <template v-else-if="activeTab === 'package'">

          <!-- Figma container 4832:14966 — feature/upsell/tarifs share a 16px gap. -->
          <div class="flex flex-col gap-[16px] w-full">

          <!-- ──────────── Fonctionnalités Classic ──────────── -->
          <section
            class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm overflow-clip anim-fade-up"
            style="animation-delay: 120ms"
          >
            <div class="flex flex-col gap-[16px] p-[24px]">
              <!-- Header -->
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-[8px] w-[310.5px]">
                  <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#22bcff]">
                    <Icon name="briefcase" variant="solid" :size="24" class="text-white" />
                  </div>
                  <div class="flex items-center gap-[4px]">
                    <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral whitespace-nowrap">
                      Fonctionnalités
                    </p>
                    <span class="relative inline-flex items-center">
                      <img
                        :src="classicHighlight"
                        alt=""
                        aria-hidden="true"
                        class="pointer-events-none absolute left-0 right-0 top-[1px] bottom-[3px]"
                      />
                      <span class="relative font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-[#22bcff] whitespace-nowrap">
                        Classic
                      </span>
                    </span>
                  </div>
                </div>

                <HorizontalTabs
                  v-model="featureCategory"
                  :tabs="featureTabs"
                />
              </div>

              <div class="h-px w-full bg-border-neutral-secondary" />

              <!-- Body: two-column checklist, cross-fade on tab change -->
              <Transition
                mode="out-in"
                enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                enter-from-class="opacity-0 translate-y-[4px]"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-[2px]"
              >
                <div :key="featureCategory">
                  <div v-if="hasFeatureContent" class="flex gap-[12px] w-full">
                    <div
                      v-for="(col, ci) in activeFeatureColumns"
                      :key="ci"
                      class="flex-1 min-w-0 flex flex-col gap-[24px]"
                    >
                      <div
                        v-for="item in col"
                        :key="item.label"
                        class="flex items-center gap-[8px] w-full"
                      >
                        <Icon
                          :name="item.included ? 'check-circle' : 'x-circle'"
                          variant="solid"
                          :size="24"
                          :class="item.included ? 'text-[#22bcff] shrink-0' : 'text-[#cbd5e1] shrink-0'"
                        />
                        <p
                          :class="[
                            'font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] whitespace-nowrap',
                            item.included ? 'text-text-neutral' : 'text-text-neutral-secondary',
                          ]"
                        >
                          {{ item.label }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    v-else
                    class="flex items-center justify-center min-h-[120px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary"
                  >
                    Contenu à venir.
                  </div>
                </div>
              </Transition>
            </div>
          </section>

          <!-- ──────────── Upsell: Propulsez votre flotte ──────────── -->
          <section
            class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[24px] flex items-center justify-center gap-[32px] overflow-clip anim-fade-up"
            style="animation-delay: 180ms"
          >
            <img
              :src="briefcaseHero"
              alt=""
              class="shrink-0 w-[150px] h-[118px] object-cover pointer-events-none"
            />
            <div class="flex-1 min-w-0 flex flex-col gap-[8px] items-start">
              <p class="font-sans font-semibold text-[24px] leading-[1.5] tracking-[-0.72px] text-text-neutral whitespace-nowrap">
                Propulsez votre flotte !
              </p>
              <p class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary w-full">
                Grâce aux packages Chargemap Business, ayez toutes les clés en main pour gérer votre flotte
              </p>
              <button
                type="button"
                class="p-0 rounded-[8px] outline-none focus-visible:shadow-ring-brand font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-[#1e40af] whitespace-nowrap"
              >
                Découvrir les offres
              </button>
            </div>
          </section>

          <!-- ──────────── Tarifs Classic ──────────── -->
          <section
            class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm overflow-clip anim-fade-up"
            style="animation-delay: 240ms"
          >
            <div class="flex flex-col gap-[16px] p-[24px]">
              <!-- Header -->
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-[8px] w-[310.5px]">
                  <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#22bcff]">
                    <Icon name="money-coins" variant="solid" :size="24" class="text-white" />
                  </div>
                  <div class="flex items-center gap-[4px]">
                    <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral whitespace-nowrap">
                      Tarifs
                    </p>
                    <span class="relative inline-flex items-center">
                      <img
                        :src="classicHighlight"
                        alt=""
                        aria-hidden="true"
                        class="pointer-events-none absolute left-0 right-0 top-[1px] bottom-[3px]"
                      />
                      <span class="relative font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-[#22bcff] whitespace-nowrap">
                        Classic
                      </span>
                    </span>
                  </div>
                </div>

                <HorizontalTabs
                  v-model="tarifCategory"
                  :tabs="tarifTabs"
                />
              </div>

              <!-- Rows -->
              <Transition
                mode="out-in"
                enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                enter-from-class="opacity-0 translate-y-[4px]"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-[2px]"
              >
                <div :key="tarifCategory" class="flex flex-col gap-[16px]">
                  <template v-if="activeTarifRows.length">
                    <template v-for="row in activeTarifRows" :key="row.label">
                      <div class="h-px w-full bg-border-neutral-secondary" />
                      <div class="flex items-center justify-between h-[37px] py-[8px] w-full">
                        <p class="flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                          {{ row.label }}
                        </p>
                        <p class="flex-1 min-w-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral text-right">
                          {{ row.value }}
                        </p>
                      </div>
                    </template>
                  </template>
                  <div
                    v-else
                    class="flex items-center justify-center min-h-[120px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary"
                  >
                    Contenu à venir.
                  </div>
                </div>
              </Transition>
            </div>
          </section>

          </div>
        </template>

        <!-- Configuration tab -->
        <template v-else-if="activeTab === 'configuration'">
          <section
            class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[24px] flex flex-col gap-[16px] overflow-clip anim-fade-up"
            style="animation-delay: 120ms"
          >
            <!-- Header -->
            <div class="flex items-center gap-[12px] w-full">
              <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#6467f2]">
                <Icon name="credit-card" variant="solid" :size="24" class="text-white" />
              </div>
              <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral whitespace-nowrap">
                Remboursement automatique des conducteurs
              </p>
            </div>

            <div class="h-px w-full bg-border-neutral-secondary" />

            <!-- Body: toggle row + alert -->
            <div class="flex flex-col gap-[4px] w-full">
              <div class="flex items-center justify-between h-[53px] py-[8px] w-full">
                <p class="flex-1 min-w-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
                  Activé
                </p>
                <Toggle
                  v-model="remboursementEnabled"
                  size="md"
                  aria-label="Remboursement automatique"
                />
              </div>

              <Alert
                type="brand"
                :title="remboursementEnabled
                  ? 'Remboursement automatique'
                  : 'Activation du remboursement automatique'"
                :description="remboursementEnabled
                  ? 'En désactivant cette option, les recharges de vos collaborateurs ne seront plus automatiquement remboursées. Uniquement les notes de frais seront générées.'
                  : 'Lorsqu’elle est activée, cette option génère un « appel de fond » et permet de remboursement automatique de vos collaborateurs sur leurs recharges à domicile.'"
                :primary-action-label="''"
                :secondary-action-label="''"
                :dismissable="false"
              />
            </div>
          </section>
        </template>

        <!-- Tokens API tab -->
        <template v-else-if="activeTab === 'tokens-api'">

          <!-- ──────────── Token card ──────────── -->
          <section
            class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm overflow-clip anim-fade-up"
            style="animation-delay: 120ms"
          >
            <div class="flex flex-col gap-[16px] p-[24px] w-full">
              <!-- Header -->
              <div class="flex items-center gap-[12px] w-full">
                <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#6467f2]">
                  <Icon name="key" variant="solid" :size="24" class="text-white" />
                </div>
                <p class="flex-1 min-w-0 font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
                  Tokens API
                </p>
                <button
                  type="button"
                  class="shrink-0 inline-flex items-center gap-[4px] rounded-[8px] border border-border-neutral bg-neutral px-[12px] py-[8px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary outline-none transition-[background-color,border-color] duration-200 ease-out hover:bg-neutral-secondary focus-visible:shadow-ring-brand active:scale-[0.97]"
                  @click="openNewToken"
                >
                  <Icon name="plus" variant="solid" :size="20" />
                  Nouveau token
                </button>
              </div>

              <div class="h-px w-full bg-border-neutral-secondary" />

              <div class="flex items-center justify-between h-[37px] py-[8px] w-full font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
                <p class="font-normal text-text-neutral-secondary">ID de l’organisation</p>
                <div class="flex items-center gap-[4px]">
                  <p class="font-medium text-text-neutral">{{ orgaId }}</p>
                  <button
                    type="button"
                    class="flex items-center justify-center p-[8px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-tertiary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray"
                    aria-label="Copier l’ID de l’organisation"
                    @click="copyOrgaId"
                  >
                    <Icon name="square-2-stack" variant="outline" :size="20" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- ──────────── Tokens table ──────────── -->
          <!-- Figma 4832-16972 — 4 columns flex-1/flex-1/flex-1/w-112; cell padding
               px-16/py-12, min-h-64, bottom border per row. -->
          <section
            class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm overflow-clip anim-fade-up"
            style="animation-delay: 180ms"
          >
            <!-- Header row -->
            <div class="flex items-center w-full bg-neutral-tertiary">
              <div class="flex-1 min-w-0 px-[16px] py-[12px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Token</div>
              <div class="flex-1 min-w-0 px-[16px] py-[12px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Scope</div>
              <div class="flex-1 min-w-0 px-[16px] py-[12px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Date de création</div>
              <div class="w-[112px] shrink-0 px-[16px] py-[12px] font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Actions</div>
            </div>

            <!-- Body rows -->
            <div
              v-for="(token, ti) in tokens"
              :key="token.id"
              :class="[
                'flex items-center w-full min-h-[64px] transition-colors duration-[800ms] ease-out',
                ti < tokens.length - 1 ? 'border-b border-[#f1f5f9]' : '',
                newTokenJustCreatedId === token.id ? 'bg-brand-surface' : '',
              ]"
            >
              <div class="flex-1 min-w-0 px-[16px] py-[12px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                {{ tokenMask }}&nbsp;&nbsp;&nbsp;{{ token.tail }}
              </div>
              <div class="flex-1 min-w-0 px-[16px] py-[12px] flex items-center">
                <span class="inline-flex items-center justify-center px-[10px] py-[2px] rounded-full bg-[#fafafa] border border-[#e4e4e7] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary whitespace-nowrap">
                  {{ token.scope }}
                </span>
              </div>
              <div class="flex-1 min-w-0 px-[16px] py-[12px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
                {{ token.date }}
              </div>
              <div class="w-[112px] shrink-0 px-[16px] py-[12px] flex items-center gap-[8px]">
                <button
                  type="button"
                  aria-label="Voir les commentaires"
                  class="inline-flex items-center justify-center p-[8px] rounded-[8px] outline-none text-text-neutral-secondary transition-[background-color,color] duration-150 ease-out hover:bg-neutral-secondary hover:text-text-neutral focus-visible:shadow-ring-gray"
                >
                  <Icon name="chat-bubble-bottom-center-text" variant="outline" :size="20" />
                </button>
                <button
                  type="button"
                  aria-label="Supprimer le token"
                  class="inline-flex items-center justify-center p-[8px] rounded-[8px] outline-none text-text-neutral-secondary transition-[background-color,color] duration-150 ease-out hover:bg-neutral-secondary hover:text-text-neutral focus-visible:shadow-ring-gray"
                >
                  <Icon name="trash" variant="outline" :size="20" />
                </button>
              </div>
            </div>
          </section>
        </template>

        <!-- Other tabs: empty placeholder -->
        <template v-else>
          <div
            class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] flex flex-col items-center justify-center gap-[8px] min-h-[200px] text-center"
          >
            <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
              {{ pageTitle }}
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

    <!-- New-token modal (backdrop + centered card, ESC + click-outside to close) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-[200ms] ease-out motion-reduce:transition-none"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-[160ms] ease-in motion-reduce:transition-none"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="newTokenOpen"
          class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
          aria-hidden="true"
          @click="closeNewToken"
        />
      </Transition>

      <Transition
        enter-active-class="transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
        enter-from-class="opacity-0 translate-y-[8px] scale-[0.97]"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.4,0,1,1)] motion-reduce:transition-none"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-[6px] scale-[0.98]"
      >
        <div
          v-if="newTokenOpen"
          class="fixed inset-0 z-[70] flex items-center justify-center p-[16px] pointer-events-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-token-title"
        >
          <div
            class="pointer-events-auto w-full max-w-[480px] bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-[0_20px_50px_-12px_rgba(15,23,41,0.18),0_8px_20px_-8px_rgba(15,23,41,0.12)] flex flex-col"
            @click.stop
          >
            <!-- Header (banded, matches footer) — vertical stack: icon, title, desc -->
            <div class="relative flex flex-col gap-[12px] px-[24px] py-[20px] w-full border-b border-border-neutral-secondary">
              <div class="flex items-center justify-center shrink-0 size-[40px] rounded-[12px] bg-[#6467f2]">
                <Icon name="key" variant="solid" :size="24" class="text-white" />
              </div>
              <div class="flex flex-col gap-[2px] pr-[32px]">
                <p
                  id="new-token-title"
                  class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral"
                >
                  Nouveau token API
                </p>
                <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Choisissez la portée du token et ajoutez un commentaire pour le retrouver facilement.
                </p>
              </div>
              <button
                type="button"
                aria-label="Fermer"
                class="absolute top-[16px] right-[16px] flex items-center justify-center p-[8px] rounded-[8px] outline-none text-text-neutral-secondary transition-[background-color,color,transform] duration-150 ease-out hover:bg-neutral-secondary hover:text-text-neutral focus-visible:shadow-ring-gray active:scale-[0.95]"
                @click="closeNewToken"
              >
                <Icon name="x-mark" variant="solid" :size="20" />
              </button>
            </div>

            <!-- Body -->
            <div class="flex flex-col gap-[16px] px-[24px] py-[16px] w-full">
              <Dropdown
                v-model="newTokenBu"
                :items="buItems"
                label="Business Unit"
                placeholder="Sélectionner une BU"
                :show-hint="false"
                :searchable="false"
              />

              <div class="flex flex-col gap-[4px] w-full">
                <div class="flex items-baseline gap-[6px]">
                  <label
                    for="new-token-comment"
                    class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral"
                  >
                    Commentaire
                  </label>
                  <span class="font-sans font-normal text-[12px] leading-[1.5] tracking-[-0.36px] text-text-neutral-secondary">
                    Optionnel
                  </span>
                </div>
                <textarea
                  id="new-token-comment"
                  v-model="newTokenComment"
                  rows="3"
                  placeholder="Ex. Intégration Workshop, Webhook flotte…"
                  class="w-full resize-none rounded-md border border-border-neutral-secondary bg-neutral px-[12px] py-[10px] font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral placeholder:text-text-neutral-secondary shadow-sm outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-brand focus:shadow-ring-brand"
                  maxlength="160"
                />
                <p class="font-sans font-normal text-[12px] leading-[1.5] tracking-[-0.36px] text-text-neutral-secondary text-right">
                  {{ newTokenComment.length }} / 160
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-[8px] px-[24px] py-[16px] border-t border-border-neutral-secondary">
              <button
                type="button"
                class="rounded-[8px] border border-border-neutral bg-neutral px-[14px] py-[8px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary outline-none transition-[background-color,border-color] duration-200 ease-out hover:bg-neutral-secondary focus-visible:shadow-ring-brand active:scale-[0.97]"
                @click="closeNewToken"
              >
                Annuler
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-[6px] rounded-[8px] bg-brand px-[14px] py-[8px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-white outline-none transition-[background-color,transform] duration-200 ease-out hover:bg-brand-hover focus-visible:shadow-ring-brand active:scale-[0.97]"
                @click="createToken"
              >
                <Icon name="plus" variant="solid" :size="18" />
                Créer le token
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
