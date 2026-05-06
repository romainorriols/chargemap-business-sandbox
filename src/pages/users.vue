<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
const navStore = useNavStore()

interface UserRole {
  bu: string
  role: string
}
interface User {
  id: string
  name: string
  email: string
  roles: UserRole[]
}

// 7 entries so the 3-up grid wraps onto a third row with a single card
// (matches the Figma mock 4878-1348). Names/emails are a plausible French mix.
// Roles are per-BU so the detail view (Figma 5007-74753) has a realistic spread.
const users: User[] = [
  { id: 'u-1', name: 'Camille Laurent', email: 'camille.laurent@email.com', roles: [
    { bu: 'Brakson',   role: 'Gestionnaire de flotte' },
    { bu: 'Chargemap', role: 'Admin de BU' },
  ]},
  { id: 'u-2', name: 'Nicolas Mercier', email: 'n.mercier@email.com', roles: [
    { bu: 'Chargemap', role: 'Admin de BU' },
  ]},
  { id: 'u-3', name: 'Léa Dubois', email: 'lea.dubois@email.com', roles: [
    { bu: 'Brakson', role: 'Gestionnaire de flotte' },
    { bu: 'Saabre',  role: 'Gestionnaire de flotte' },
  ]},
  { id: 'u-4', name: 'Antoine Robert', email: 'a.robert@email.com', roles: [
    { bu: 'Mister EV', role: 'Superviseur de réseau' },
  ]},
  { id: 'u-5', name: 'Sophie Moreau', email: 'sophie.moreau@email.com', roles: [
    { bu: 'Chargemap',  role: 'Admin de BU' },
    { bu: 'Cleanrider', role: 'Admin de BU' },
  ]},
  { id: 'u-6', name: 'Julien Bernard', email: 'julien.b@email.com', roles: [
    { bu: 'Responsible Ads', role: 'Superviseur de réseau' },
  ]},
  { id: 'u-7', name: 'Émilie Faure', email: 'emilie.faure@email.com', roles: [
    { bu: 'Marketing', role: 'Gestionnaire de flotte' },
  ]},
]

const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return users
  return users.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  )
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

// Card-level ellipsis menu — one open at a time, close on outside click.
const openMenuId = ref<string | null>(null)
function toggleMenu(id: string, e: MouseEvent) {
  e.stopPropagation()
  openMenuId.value = openMenuId.value === id ? null : id
}
function closeMenus() { openMenuId.value = null }

// Detail view — selectedId drives listing ↔ detail swap. null = listing.
const selectedId = ref<string | null>(null)
const selectedUser = computed(() => users.find(u => u.id === selectedId.value) ?? null)
function openUser(id: string) {
  selectedId.value = id
  openMenuId.value = null
}
function backToList() {
  selectedId.value = null
  editing.coord = false
  editing.roles = false
}

// ── Edit mode (Figma 5007-75156) ─────────────────────────────────────────
// Mirrors the per-card pattern in Settings > Informations: snapshot on enter,
// diff-and-toast on save, view ↔ edit cross-fade.
const editing = reactive<Record<'coord' | 'roles', boolean>>({
  coord: false,
  roles: false,
})

// Editable form state — populated from the selected user when entering edit
// mode and synced back to the user on save. Name is split into prénom/nom
// because the listing stores a single full name.
const coordForm = reactive({
  email: '',
  prenom: '',
  nom: '',
  telephone: '',
})
type RoleRow = { id: number; bu: string; role: string }
let nextRoleRowId = 0
const newRoleRow = (init: Partial<RoleRow> = {}): RoleRow => ({ id: ++nextRoleRowId, bu: '', role: '', ...init })
const rolesForm = ref<RoleRow[]>([])

// BUs mirror the BusinessUnits.vue list so detail/edit stays consistent.
const buItems = [
  { value: 'Brakson',         label: 'Brakson' },
  { value: 'Saabre',          label: 'Saabre' },
  { value: 'Chargemap',       label: 'Chargemap' },
  { value: 'Mister EV',       label: 'Mister EV' },
  { value: 'Cleanrider',      label: 'Cleanrider' },
  { value: 'Responsible Ads', label: 'Responsible Ads' },
  { value: 'Marketing',       label: 'Marketing' },
]
const roleItems = [
  { value: 'Admin de BU',            label: 'Admin de BU' },
  { value: 'Gestionnaire de flotte', label: 'Gestionnaire de flotte' },
  { value: 'Superviseur de réseau',  label: 'Superviseur de réseau' },
]

function splitName(full: string): { prenom: string; nom: string } {
  const trimmed = full.trim()
  const idx = trimmed.indexOf(' ')
  if (idx === -1) return { prenom: trimmed, nom: '' }
  return { prenom: trimmed.slice(0, idx), nom: trimmed.slice(idx + 1) }
}

let coordSnapshot = { email: '', prenom: '', nom: '', telephone: '' }
let rolesSnapshot: RoleRow[] = []

// Toast — same shape as Settings.vue; one at a time, auto-dismiss after 3.5s.
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

const onToggleCoord = () => {
  if (!selectedUser.value) return
  if (!editing.coord) {
    const { prenom, nom } = splitName(selectedUser.value.name)
    coordForm.email = selectedUser.value.email
    coordForm.prenom = prenom
    coordForm.nom = nom
    coordForm.telephone = ''
    coordSnapshot = { ...coordForm }
    editing.coord = true
    return
  }
  // Save: reassemble name, write back, diff and toast.
  const fullName = `${coordForm.prenom.trim()} ${coordForm.nom.trim()}`.trim()
  selectedUser.value.name = fullName
  selectedUser.value.email = coordForm.email
  const changed =
    coordForm.email !== coordSnapshot.email ||
    coordForm.prenom !== coordSnapshot.prenom ||
    coordForm.nom !== coordSnapshot.nom ||
    coordForm.telephone !== coordSnapshot.telephone
  if (changed) showSuccessToast('Informations mis à jours', '')
  editing.coord = false
}

const onToggleRoles = () => {
  if (!selectedUser.value) return
  if (!editing.roles) {
    rolesForm.value = selectedUser.value.roles.map(r => newRoleRow(r))
    rolesSnapshot = rolesForm.value.map(r => ({ ...r }))
    editing.roles = true
    return
  }
  // Save: drop empty rows (no BU and no role), strip the form-only id, write
  // back, diff and toast.
  const cleaned = rolesForm.value.filter(r => r.bu && r.role)
  selectedUser.value.roles = cleaned.map(({ bu, role }) => ({ bu, role }))
  const changed =
    cleaned.length !== rolesSnapshot.length ||
    cleaned.some((r, i) => r.bu !== rolesSnapshot[i]?.bu || r.role !== rolesSnapshot[i]?.role)
  if (changed) showSuccessToast('Informations mis à jours', '')
  editing.roles = false
}

function removeRoleRow(i: number) {
  rolesForm.value.splice(i, 1)
}

// Auto-append a trailing empty row whenever the last row is filled, so the
// user can keep adding without a "+" button (matches the Figma — the empty
// "Choisir une BU / Choisir un rôle" row is always present at the end).
watch(rolesForm, (rows) => {
  if (!editing.roles) return
  if (rows.length === 0 || (rows[rows.length - 1].bu && rows[rows.length - 1].role)) {
    rows.push(newRoleRow())
  }
}, { deep: true })
</script>

<template>
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]" @click="closeMenus">
    <!-- Listing view -->
    <div v-if="!selectedUser" class="mx-auto w-full max-w-[1500px] flex flex-col gap-[32px]">

      <!-- Page header -->
      <div class="flex items-center justify-between h-[48px] anim-fade-up" style="animation-delay: 0ms">
        <h1 :class="navStore.isNavV2 ? 'font-heading font-semibold text-[32px] leading-[1.5] tracking-[-0.96px] text-text-neutral' : V1_PAGE_HEADING">
          Utilisateurs
        </h1>
        <Button
          type="primary"
          size="md"
          icon-left="plus"
          label="Nouvel utilisateur"
        />
      </div>

      <!-- Content -->
      <div class="flex flex-col gap-[24px]">
        <!-- Search -->
        <div class="w-[350px] max-w-full anim-fade-up" style="animation-delay: 50ms">
          <Input
            v-model="search"
            type="leadingIcon"
            icon="magnifying-glass"
            placeholder="Recherche"
          />
        </div>

        <!-- Users grid -->
        <div
          v-if="paginated.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]"
        >
          <article
            v-for="(u, i) in paginated"
            :key="u.id"
            role="button"
            tabindex="0"
            :style="{ animationDelay: `${100 + i * 40}ms` }"
            :class="[
              'relative user-card anim-fade-up cursor-pointer',
              'bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm',
              'p-[24px] flex flex-col gap-[16px]',
              'transition-[transform,box-shadow,border-color] duration-200 ease-out',
              'hover:border-border-neutral hover:shadow-md hover:-translate-y-[2px]',
              'outline-none focus-visible:shadow-ring-gray',
              openMenuId === u.id ? 'z-30' : 'z-0',
            ]"
            @click="openUser(u.id)"
            @keydown.enter="openUser(u.id)"
            @keydown.space.prevent="openUser(u.id)"
          >
            <!-- Header: icon (left) + ellipsis menu (top-right) + name -->
            <div class="flex flex-col gap-[8px]">
              <div class="flex items-start justify-between w-full">
                <div class="flex items-center justify-center w-[37px] h-[37px] rounded-[12px] bg-[#6467f2]">
                  <Icon name="user" variant="solid" :size="24" class="text-white" />
                </div>
                <div class="relative">
                  <button
                    type="button"
                    :class="[
                      '-mt-[4px] -mr-[8px] flex items-center justify-center w-[32px] h-[32px] rounded-[8px] transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray',
                      openMenuId === u.id
                        ? 'bg-neutral-tertiary text-icon-neutral-primary'
                        : 'text-icon-neutral-secondary hover:bg-neutral-tertiary hover:text-icon-neutral-primary',
                    ]"
                    aria-label="Plus d'actions"
                    :aria-expanded="openMenuId === u.id"
                    aria-haspopup="menu"
                    @click="toggleMenu(u.id, $event)"
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
                      v-if="openMenuId === u.id"
                      class="absolute top-[calc(100%+4px)] right-0 z-20 origin-top-right bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg py-[12px] flex flex-col gap-[4px] min-w-[180px]"
                      role="menu"
                      @click.stop
                    >
                      <div class="px-[4px] py-[2px]">
                        <button
                          type="button"
                          role="menuitem"
                          class="w-full flex items-center gap-[8px] p-[12px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                          @click="openUser(u.id)"
                        >
                          <Icon name="pencil-square" variant="outline" :size="20" class="shrink-0 text-icon-neutral-secondary" />
                          <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral whitespace-nowrap">
                            Modifier
                          </span>
                        </button>
                      </div>
                      <div class="px-[4px] py-[2px]">
                        <button
                          type="button"
                          role="menuitem"
                          class="w-full flex items-center gap-[8px] p-[12px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                          @click="closeMenus"
                        >
                          <Icon name="trash" variant="outline" :size="20" class="shrink-0 text-icon-danger" />
                          <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-danger-medium whitespace-nowrap">
                            Supprimer
                          </span>
                        </button>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
              <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
                {{ u.name }}
              </p>
            </div>

            <!-- Separator -->
            <div class="h-px w-full shrink-0 bg-border-neutral-tertiary" />

            <!-- Email row: label left, value right. -->
            <div class="flex items-center justify-between w-full font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <p class="font-normal text-text-neutral-secondary">Email</p>
              <p class="font-medium text-text-neutral truncate ml-[8px]">{{ u.email }}</p>
            </div>
          </article>
        </div>

        <!-- Empty state (search with no results) -->
        <div
          v-else
          class="anim-fade-up bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[48px] flex flex-col items-center justify-center gap-[8px] text-center"
          style="animation-delay: 100ms"
        >
          <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
            Aucun résultat
          </p>
          <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
            Essayez une autre recherche.
          </p>
        </div>

        <!-- Footer: range + pagination -->
        <div class="flex items-center justify-between pt-[8px] anim-fade-up" style="animation-delay: 200ms">
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

    <!-- Detail view (Figma 5007-74753) — swap in when a user is selected.
         Matches the Settings layout (max-w-800, two stacked info cards). -->
    <div v-else class="mx-auto w-full max-w-[800px] flex flex-col gap-[32px]">

      <!-- Page header: back button + user name -->
      <div class="flex items-start gap-[16px] anim-fade-up" style="animation-delay: 0ms">
        <div class="flex flex-col items-start justify-center">
          <button
            type="button"
            class="flex items-center gap-[8px] px-[4px] py-[4px] rounded-[4px] text-text-neutral-secondary hover:text-text-neutral transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
            @click="backToList"
          >
            <Icon name="arrow-left" variant="outline" :size="16" />
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]">
              Retour
            </span>
          </button>
          <h1 :class="['whitespace-nowrap', navStore.isNavV2 ? 'font-heading font-semibold text-[32px] leading-[1.5] tracking-[-0.96px] text-text-neutral' : V1_PAGE_HEADING]">
            {{ selectedUser.name }}
          </h1>
        </div>
      </div>

      <!-- Coordonnées card -->
      <section
        :class="[
          'relative w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] flex flex-col gap-[16px] anim-fade-up',
          editing.coord ? 'z-20' : 'z-10',
        ]"
        style="animation-delay: 40ms"
      >
        <div class="flex items-center gap-[12px] w-full">
          <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#6467f2]">
            <Icon name="identification" variant="solid" :size="24" class="text-white" />
          </div>
          <p class="flex-1 min-w-0 font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Coordonnées
          </p>
          <button
            type="button"
            :class="[
              'shrink-0 rounded-[8px] px-[12px] py-[8px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] outline-none focus-visible:shadow-ring-brand active:scale-[0.97]',
              'transition-[background-color,border-color,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]',
              editing.coord
                ? 'bg-brand border border-brand text-white hover:bg-brand-hover'
                : 'bg-neutral border border-border-neutral text-text-neutral-secondary hover:bg-neutral-secondary',
            ]"
            @click="onToggleCoord"
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
              <span :key="editing.coord ? 'save' : 'edit'" class="inline-block">
                {{ editing.coord ? 'Enregistrer' : 'Modifier' }}
              </span>
            </Transition>
          </button>
        </div>

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
          <div v-if="!editing.coord" key="view" class="flex flex-col gap-[16px] w-full">
            <div class="h-px w-full bg-border-neutral-tertiary" />
            <div class="flex items-center justify-between py-[8px] font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <p class="font-normal text-text-neutral-secondary">Nom</p>
              <p class="font-medium text-text-neutral text-right truncate ml-[8px]">{{ selectedUser.name }}</p>
            </div>
            <div class="h-px w-full bg-border-neutral-tertiary" />
            <div class="flex items-center justify-between py-[8px] font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
              <p class="font-normal text-text-neutral-secondary">Email</p>
              <p class="font-medium text-text-neutral text-right truncate ml-[8px]">{{ selectedUser.email }}</p>
            </div>
          </div>

          <!-- Edit mode -->
          <div v-else key="edit" class="flex flex-col gap-[16px] w-full">
            <Input
              v-model="coordForm.email"
              label="Email"
              placeholder="email@exemple.com"
            />
            <div class="flex gap-[16px] w-full">
              <div class="flex-1 min-w-0">
                <Input
                  v-model="coordForm.prenom"
                  label="Prénom"
                  placeholder="Prénom"
                />
              </div>
              <div class="flex-1 min-w-0">
                <Input
                  v-model="coordForm.nom"
                  label="Nom"
                  placeholder="Nom"
                />
              </div>
            </div>
            <Input
              v-model="coordForm.telephone"
              label="Téléphone"
              placeholder=""
              :optionnel="true"
            />
          </div>
        </Transition>
      </section>

      <!-- Rôles card -->
      <section
        :class="[
          'relative w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] flex flex-col gap-[16px] anim-fade-up',
          editing.roles ? 'z-20' : 'z-10',
        ]"
        style="animation-delay: 80ms"
      >
        <div class="flex items-center gap-[12px] w-full">
          <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#6467f2]">
            <Icon name="star" variant="solid" :size="24" class="text-white" />
          </div>
          <p class="flex-1 min-w-0 font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">
            Rôles
          </p>
          <button
            type="button"
            :class="[
              'shrink-0 rounded-[8px] px-[12px] py-[8px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] outline-none focus-visible:shadow-ring-brand active:scale-[0.97]',
              'transition-[background-color,border-color,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]',
              editing.roles
                ? 'bg-brand border border-brand text-white hover:bg-brand-hover'
                : 'bg-neutral border border-border-neutral text-text-neutral-secondary hover:bg-neutral-secondary',
            ]"
            @click="onToggleRoles"
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
              <span :key="editing.roles ? 'save' : 'edit'" class="inline-block">
                {{ editing.roles ? 'Enregistrer' : 'Modifier' }}
              </span>
            </Transition>
          </button>
        </div>

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
          <div v-if="!editing.roles" key="view" class="flex flex-col gap-[16px] w-full">
            <template v-for="r in selectedUser.roles" :key="r.bu">
              <div class="h-px w-full bg-border-neutral-tertiary" />
              <div class="flex items-center justify-between py-[8px] font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
                <p class="font-normal text-text-neutral-secondary">{{ r.bu }}</p>
                <p class="font-medium text-text-neutral text-right truncate ml-[8px]">{{ r.role }}</p>
              </div>
            </template>
          </div>

          <!-- Edit mode — one row per role + a trailing empty row -->
          <div v-else key="edit" class="flex flex-col gap-[16px] w-full">
            <div
              v-for="(row, i) in rolesForm"
              :key="row.id"
              class="flex items-center gap-[16px] w-full"
            >
              <div class="flex-1 min-w-0">
                <Dropdown
                  v-model="row.bu"
                  :items="buItems"
                  :show-label="false"
                  :show-hint="false"
                  :searchable="false"
                  placeholder="Choisir une BU"
                />
              </div>
              <div class="flex-1 min-w-0">
                <Dropdown
                  v-model="row.role"
                  :items="roleItems"
                  :show-label="false"
                  :show-hint="false"
                  :searchable="false"
                  placeholder="Choisir un rôle"
                />
              </div>
              <button
                v-if="row.bu || row.role"
                type="button"
                class="shrink-0 flex items-center justify-center size-[40px] rounded-[8px] border border-border-neutral text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray"
                aria-label="Supprimer le rôle"
                @click="removeRoleRow(i)"
              >
                <Icon name="trash" variant="outline" :size="18" />
              </button>
              <div v-else class="shrink-0 size-[40px]" aria-hidden="true" />
            </div>
          </div>
        </Transition>
      </section>

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
