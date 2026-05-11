<script setup lang="ts">
const headingClass = usePageHeadingClass()
import { ref, computed, reactive } from 'vue'
import type { HorizontalTab } from '../components/ui/HorizontalTabs.vue'
import buEmptyIllustration from '@/assets/illustrations/bu-empty.svg'

const busStore = useBusStore()
const uiStore = useUiStore()
const search = ref('')

// Scope filter: active vs deactivated. Swapping tabs resets pagination so
// the user doesn't land on an empty page when counts differ.
type Scope = 'actives' | 'disabled'
const scope = ref<Scope>('actives')
const activesCount = computed(() => busStore.bus.filter(b => b.active).length)
const disabledCount = computed(() => busStore.bus.filter(b => !b.active).length)
const scopeTabs = computed<HorizontalTab[]>(() => [
  { id: 'actives', label: 'Activées', count: activesCount.value },
  { id: 'disabled', label: 'Désactivées', count: disabledCount.value },
])
function setScope(next: Scope) {
  if (scope.value === next) return
  scope.value = next
  page.value = 1
  closeMenus()
}

const filtered = computed(() => {
  const scoped = busStore.bus.filter(b => (scope.value === 'actives' ? b.active : !b.active))
  const q = search.value.trim().toLowerCase()
  if (!q) return scoped
  return scoped.filter(b => b.name.toLowerCase().includes(q))
})

const page = ref(1)
const perPage = 9
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated = computed(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})
const rangeStart = computed(() => filtered.value.length === 0 ? 0 : (page.value - 1) * perPage + 1)
const rangeEnd = computed(() => Math.min(page.value * perPage, filtered.value.length))

function goto(n: number) {
  if (n < 1 || n > pageCount.value) return
  page.value = n
}

const fmtInt = (n: number) =>
  n.toLocaleString('fr-FR').replace(/\u202f/g, ' ')

const openMenuId = ref<string | null>(null)
function toggleMenu(id: string, e: MouseEvent) {
  e.stopPropagation()
  openMenuId.value = openMenuId.value === id ? null : id
}
function closeMenus() { openMenuId.value = null }

// ── Activation toggle ─────────────────────────────────────────────────────
// Flips `active` on the BU, closes the menu, and shows a feedback toast.
// Deactivated BUs stay in the same underlying array — the "Désactivées" tab
// is just a filter view, so switching tabs "finds" them again immediately.
function deactivateBu(bu: BusinessUnit) {
  bu.active = false
  closeMenus()
  showSuccessToast('Business unit désactivée', `${bu.name} n'est plus active.`)
}
function reactivateBu(bu: BusinessUnit) {
  bu.active = true
  closeMenus()
  showSuccessToast('Business unit réactivée', `${bu.name} est de nouveau active.`)
}

// ── Creation flow (Figma 5007-85647) ──────────────────────────────────────
// Inline swap from listing → form (no router). Form is fully optimistic:
// "Créer" pushes a new BU into the list with placeholder stats.
const creating = ref(false)
const form = reactive({
  name: '',
  email: '',
  prenom: '',
  nom: '',
  telephone: '',
  adminSelf: false,
  emailCopy: true,
})
function resetForm() {
  form.name = ''
  form.email = ''
  form.prenom = ''
  form.nom = ''
  form.telephone = ''
  form.adminSelf = false
  form.emailCopy = true
}
function openCreate() {
  resetForm()
  creating.value = true
}
function cancelCreate() {
  creating.value = false
}
const canSubmit = computed(() => form.name.trim().length > 0)
const submitting = ref(false)
function submitCreate() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  const name = form.name.trim()
  // Simulated server round-trip — surfaces the spinning-loader state on the
  // primary button before swapping back to the listing.
  setTimeout(() => {
    busStore.bus.push({
      id: `bu-${busStore.bus.length + 1}`,
      name,
      badges: 0,
      vehicules: 0,
      conducteurs: 0,
      active: true,
    })
    submitting.value = false
    creating.value = false
    scope.value = 'actives'
    showSuccessToast('Business unit créée', `${name} a été ajoutée.`)
  }, 900)
}

// Toast — same shape as Settings.vue / Users.vue.
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
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]">
    <div v-if="!creating" class="mx-auto w-full flex flex-col gap-[32px]" :style="{ maxWidth: uiStore.getMaxWidth('/bus') + 'px' }" @click="closeMenus">

      <!-- Page header -->
      <div class="flex items-center justify-between h-[48px] anim-fade-up" style="animation-delay: 0ms">
        <h1 :class="headingClass">
          Business units
        </h1>
        <Button
          type="primary"
          size="md"
          icon-left="plus"
          label="Nouvelle business unit"
          @click="openCreate"
        />
      </div>

      <!-- Content -->
      <div class="flex flex-col gap-[24px]">
        <!-- Search + scope tabs (Activées / Désactivées with counts) -->
        <div class="flex flex-wrap items-center justify-between gap-[16px] anim-fade-up" style="animation-delay: 50ms">
          <div class="w-[350px] max-w-full">
            <Input
              v-model="search"
              type="leadingIcon"
              icon="magnifying-glass"
              placeholder="Recherche"
            />
          </div>

          <!-- Horizontal tabs (Storybook B2B component): sliding pill animates between
               "Activées" and "Désactivées", counts rendered as muted suffixes. -->
          <HorizontalTabs
            :tabs="scopeTabs"
            :model-value="scope"
            @update:model-value="id => setScope(id as Scope)"
          />
        </div>

        <!-- BU grid -->
        <div
          v-if="paginated.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]"
        >
          <article
            v-for="(bu, i) in paginated"
            :key="bu.id"
            :style="{ animationDelay: `${100 + i * 40}ms` }"
            :class="[
              'relative bu-card anim-fade-up',
              'bg-neutral border rounded-[16px] shadow-sm',
              'p-[24px] flex flex-col gap-[16px] h-[214px]',
              'transition-[transform,box-shadow,border-color] duration-200 ease-out',
              bu.active
                ? 'border-border-neutral-secondary hover:border-border-neutral hover:shadow-md hover:-translate-y-[2px]'
                : 'border-border-neutral-tertiary hover:border-border-neutral-secondary hover:shadow-md hover:-translate-y-[2px]',
              openMenuId === bu.id ? 'z-30' : 'z-0',
            ]"
          >
            <!-- Header: icon (left) + ellipsis menu (top-right) -->
            <div class="flex flex-col gap-[8px]">
              <div class="flex items-start justify-between w-full">
                <div
                  :class="[
                    'flex items-center justify-center w-[37px] h-[37px] rounded-[12px] transition-colors duration-200 ease-out',
                    bu.active ? 'bg-[#6467f2]' : 'bg-neutral-disabled',
                  ]"
                >
                  <Icon
                    name="building-office-2"
                    variant="solid"
                    :size="24"
                    :class="bu.active ? 'text-white' : 'text-icon-neutral-disabled'"
                  />
                </div>
                <div class="relative">
                  <button
                    type="button"
                    :class="[
                      '-mt-[4px] -mr-[8px] flex items-center justify-center w-[32px] h-[32px] rounded-[8px] transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray',
                      openMenuId === bu.id
                        ? 'bg-neutral-tertiary text-icon-neutral-primary'
                        : 'text-icon-neutral-secondary hover:bg-neutral-tertiary hover:text-icon-neutral-primary',
                    ]"
                    aria-label="Plus d'actions"
                    :aria-expanded="openMenuId === bu.id"
                    aria-haspopup="menu"
                    @click="toggleMenu(bu.id, $event)"
                  >
                    <Icon name="ellipsis-vertical" variant="outline" :size="20" />
                  </button>

                  <Transition
                    enter-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                    enter-from-class="opacity-0 scale-[0.96] -translate-y-[4px]"
                    enter-to-class="opacity-100 scale-100 translate-y-0"
                    leave-active-class="transition-[opacity,transform] duration-[120ms] ease-out"
                    leave-from-class="opacity-100 scale-100 translate-y-0"
                    leave-to-class="opacity-0 scale-[0.96] -translate-y-[4px]"
                  >
                    <div
                      v-if="openMenuId === bu.id"
                      class="absolute top-[calc(100%+4px)] right-0 z-20 origin-top-right bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg py-[12px] flex flex-col gap-[4px] min-w-[200px]"
                      role="menu"
                      @click.stop
                    >
                      <div class="px-[4px] py-[2px]">
                        <button
                          type="button"
                          role="menuitem"
                          class="w-full flex items-center gap-[8px] p-[12px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                          @click="closeMenus"
                        >
                          <Icon name="launch-gps" variant="outline" :size="20" class="shrink-0 text-icon-neutral-secondary" />
                          <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral whitespace-nowrap">
                            Détails
                          </span>
                        </button>
                      </div>
                      <div class="px-[4px] py-[2px]">
                        <button
                          v-if="bu.active"
                          type="button"
                          role="menuitem"
                          class="w-full flex items-center gap-[8px] p-[12px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                          @click="deactivateBu(bu)"
                        >
                          <Icon name="no-symbol" variant="outline" :size="20" class="shrink-0 text-icon-danger" />
                          <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-danger-medium whitespace-nowrap">
                            Désactiver
                          </span>
                        </button>
                        <button
                          v-else
                          type="button"
                          role="menuitem"
                          class="w-full flex items-center gap-[8px] p-[12px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                          @click="reactivateBu(bu)"
                        >
                          <Icon name="arrow-path" variant="outline" :size="20" class="shrink-0 text-icon-neutral-secondary" />
                          <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral whitespace-nowrap">
                            Réactiver
                          </span>
                        </button>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
              <p
                :class="[
                  'font-sans font-semibold text-[24px] leading-[1.5] tracking-[-0.72px] truncate',
                  bu.active ? 'text-text-neutral' : 'text-text-neutral-disabled',
                ]"
              >
                {{ bu.name }}
              </p>
            </div>

            <!-- Separator -->
            <div class="h-px w-full shrink-0 bg-border-neutral-tertiary" />

            <!-- Stats: 3 columns, value on top, label below, vertical dividers.
                 Disabled state shares text-neutral-disabled across values AND labels (Figma 5073:39614). -->
            <div class="flex items-stretch gap-[8px] w-full">
              <div
                :class="[
                  'flex-1 min-w-0 flex flex-col gap-[8px]',
                  bu.active ? 'text-text-neutral' : 'text-text-neutral-disabled',
                ]"
              >
                <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] tabular-nums">
                  {{ fmtInt(bu.badges) }}
                </p>
                <p
                  :class="[
                    'font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px]',
                    bu.active ? 'text-text-neutral-secondary' : '',
                  ]"
                >
                  Badges
                </p>
              </div>
              <div class="w-px self-stretch bg-border-neutral-tertiary" />
              <div
                :class="[
                  'flex-1 min-w-0 flex flex-col gap-[8px]',
                  bu.active ? 'text-text-neutral' : 'text-text-neutral-disabled',
                ]"
              >
                <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] tabular-nums">
                  {{ fmtInt(bu.vehicules) }}
                </p>
                <p
                  :class="[
                    'font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px]',
                    bu.active ? 'text-text-neutral-secondary' : '',
                  ]"
                >
                  Véhicules
                </p>
              </div>
              <div class="w-px self-stretch bg-border-neutral-tertiary" />
              <div
                :class="[
                  'flex-1 min-w-0 flex flex-col gap-[8px]',
                  bu.active ? 'text-text-neutral' : 'text-text-neutral-disabled',
                ]"
              >
                <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] tabular-nums">
                  {{ fmtInt(bu.conducteurs) }}
                </p>
                <p
                  :class="[
                    'font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px]',
                    bu.active ? 'text-text-neutral-secondary' : '',
                  ]"
                >
                  Conducteurs
                </p>
              </div>
            </div>
          </article>
        </div>

        <!-- Empty state — three flavours: no match for search, no disabled BUs,
             or (edge) no active BUs at all. Illustration exported from Figma 5073:45199. -->
        <div
          v-else
          class="anim-fade-up bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm px-[24px] py-[48px] flex flex-col items-center justify-center gap-[16px] text-center"
          style="animation-delay: 100ms"
        >
          <img
            :src="buEmptyIllustration"
            alt=""
            class="size-[200px] select-none pointer-events-none"
            draggable="false"
          />
          <div class="flex flex-col items-center gap-[4px]">
            <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
              {{
                search
                  ? 'Aucun résultat'
                  : scope === 'disabled'
                    ? 'Aucune business unit désactivée'
                    : 'Aucune business unit active'
              }}
            </p>
            <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
              {{
                search
                  ? 'Essayez une autre recherche.'
                  : scope === 'disabled'
                    ? 'Les business units que vous avez désactivées apparaîtront ici.'
                    : 'Créez une nouvelle business unit pour commencer.'
              }}
            </p>
          </div>
        </div>

        <!-- Footer: range + pagination — hidden when there's nothing to paginate. -->
        <div
          v-if="paginated.length > 0"
          class="flex items-center justify-between pt-[8px] anim-fade-up"
          style="animation-delay: 200ms"
        >
          <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Afficher&nbsp;: <span class="font-medium text-text-neutral">{{ rangeStart }}</span> à
            <span class="font-medium text-text-neutral">{{ rangeEnd }}</span> sur
            <span class="font-medium text-text-neutral">{{ filtered.length }}</span> résultats
          </p>

          <div class="flex items-center gap-[8px]">
            <button
              type="button"
              class="flex items-center justify-center w-[36px] h-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-icon-neutral-secondary outline-none focus-visible:shadow-ring-gray"
              :disabled="page === 1"
              aria-label="Page précédente"
              @click="goto(page - 1)"
            >
              <Icon name="chevron-left" variant="solid" :size="18" />
            </button>

            <button
              v-for="n in pageCount"
              :key="n"
              type="button"
              :aria-current="page === n ? 'page' : undefined"
              :class="[
                'min-w-[36px] h-[36px] px-[10px] rounded-[8px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray',
                page === n
                  ? 'bg-brand-surface text-text-brand-deep'
                  : 'text-text-neutral-secondary hover:bg-neutral-secondary hover:text-text-neutral',
              ]"
              @click="goto(n)"
            >
              {{ n }}
            </button>

            <button
              type="button"
              class="flex items-center justify-center w-[36px] h-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-icon-neutral-secondary outline-none focus-visible:shadow-ring-gray"
              :disabled="page === pageCount"
              aria-label="Page suivante"
              @click="goto(page + 1)"
            >
              <Icon name="chevron-right" variant="solid" :size="18" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer spacer -->
      <div class="h-[60px]" />
    </div>

    <!-- Creation view (Figma 5007-85647) — inline swap from listing -->
    <div v-else class="mx-auto w-full max-w-[800px] flex flex-col gap-[32px]">

      <!-- Page header: back + title -->
      <div class="flex items-start gap-[16px] anim-fade-up" style="animation-delay: 0ms">
        <div class="flex flex-col items-start justify-center">
          <button
            type="button"
            class="flex items-center gap-[8px] px-[4px] py-[4px] rounded-[4px] text-text-neutral-secondary hover:text-text-neutral transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
            @click="cancelCreate"
          >
            <Icon name="arrow-left" variant="outline" :size="16" />
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
              Retour
            </span>
          </button>
          <h1 :class="['whitespace-nowrap', headingClass]">
            Nouvelle Business unit
          </h1>
        </div>
      </div>

      <!-- Business unit card -->
      <section
        class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] flex flex-col gap-[16px] anim-fade-up"
        style="animation-delay: 40ms"
      >
        <div class="flex items-center gap-[12px] w-full">
          <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#6467f2]">
            <Icon name="building-office-2" variant="solid" :size="24" class="text-white" />
          </div>
          <p class="flex-1 min-w-0 font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Business unit
          </p>
        </div>
        <Input
          v-model="form.name"
          label="Nom"
          placeholder=""
        />
      </section>

      <!-- Administrateur card -->
      <section
        class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] flex flex-col gap-[16px] anim-fade-up"
        style="animation-delay: 80ms"
      >
        <div class="flex items-center gap-[12px] w-full">
          <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#6467f2]">
            <Icon name="user" variant="solid" :size="24" class="text-white" />
          </div>
          <p class="flex-1 min-w-0 font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Administrateur
          </p>
        </div>
        <Input
          v-model="form.email"
          label="Email"
          placeholder="email@exemple.com"
        />
        <div class="flex gap-[16px] w-full">
          <div class="flex-1 min-w-0">
            <Input
              v-model="form.prenom"
              label="Prénom"
              placeholder="Prénom"
            />
          </div>
          <div class="flex-1 min-w-0">
            <Input
              v-model="form.nom"
              label="Nom"
              placeholder="Nom"
            />
          </div>
        </div>
        <Input
          v-model="form.telephone"
          label="Téléphone"
          placeholder=""
          :optionnel="true"
        />
      </section>

      <!-- Options card (toggles) -->
      <section
        class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] flex flex-col gap-[16px] anim-fade-up"
        style="animation-delay: 120ms"
      >
        <div class="flex items-center justify-between gap-[16px] py-[8px] w-full">
          <p class="flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
            Je suis Administrateur de cette Business unit
          </p>
          <Toggle
            v-model="form.adminSelf"
            aria-label="Je suis Administrateur de cette Business unit"
          />
        </div>
        <div class="h-px w-full bg-border-neutral-tertiary" />
        <div class="flex items-center justify-between gap-[16px] py-[8px] w-full">
          <p class="flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
            Je veux recevoir une copie des emails
          </p>
          <Toggle
            v-model="form.emailCopy"
            aria-label="Je veux recevoir une copie des emails"
          />
        </div>
      </section>

      <!-- Footer actions -->
      <div class="flex items-center gap-[16px] w-full anim-fade-up" style="animation-delay: 160ms">
        <div class="flex-1 min-w-0">
          <Button
            type="secondary"
            size="md"
            label="Annuler"
            :disabled="submitting"
            class="w-full"
            @click="cancelCreate"
          />
        </div>
        <div class="flex-1 min-w-0">
          <Button
            type="primary"
            size="md"
            label="Créer la business unit"
            :disabled="!canSubmit"
            :loading="submitting"
            class="w-full"
            @click="submitCreate"
          />
        </div>
      </div>

      <!-- Footer spacer -->
      <div class="h-[60px]" />
    </div>

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
