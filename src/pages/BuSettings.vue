<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
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

const contactFacturation = ref('')
const langueCommunication = ref('FR')
const langueItems = [
  { value: 'FR', label: 'Français' },
  { value: 'EN', label: 'English' },
  { value: 'DE', label: 'Deutsch' },
  { value: 'IT', label: 'Italiano' },
  { value: 'ES', label: 'Español' },
]

// Banner persists until the user has saved a payment method at least once.
const hasPaymentMethod = ref(false)
const onValiderMoyen = () => {
  hasPaymentMethod.value = true
  showSuccessToast('Moyen de paiement enregistré', '')
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
      <div
        v-if="activeTab === 'moyen-de-paiement' && !hasPaymentMethod"
        class="w-full max-w-[800px] flex items-center justify-center gap-[12px] px-[16px] py-[10px] rounded-[8px] bg-[#fef3c7] border border-[#fde68a]"
      >
        <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
          Renseigner un moyen de paiement pour commander des badges et licences
        </p>
        <button
          type="button"
          class="flex items-center gap-[4px] outline-none rounded-[4px] focus-visible:shadow-ring-brand transition-opacity duration-150 hover:opacity-80 active:scale-[0.97]"
        >
          <Icon name="pencil-square" variant="outline" :size="18" class="text-[#1e40af]" />
          <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-[#1e40af]">
            Renseigner
          </span>
        </button>
      </div>
    </Transition>

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

    <!-- Tab content -->
    <Transition
      mode="out-in"
      enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      enter-from-class="opacity-0 translate-y-[4px]"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-[2px]"
    >
      <div
        :key="activeTab"
        class="w-full max-w-[800px] flex flex-col gap-[16px] anim-fade-up"
        style="animation-delay: 80ms"
      >
        <!-- Moyen de paiement tab -->
        <template v-if="activeTab === 'moyen-de-paiement'">

          <!-- ──────────── Card 1: payment method selector ──────────── -->
          <section
            class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm px-[24px] py-[16px] anim-fade-up"
            style="animation-delay: 120ms"
          >
            <div class="flex items-center justify-between w-full">
              <button
                v-for="opt in moyenPaiementOptions"
                :key="opt.value"
                type="button"
                class="group flex items-center gap-[8px] outline-none rounded-[6px] focus-visible:shadow-ring-brand"
                @click="moyenPaiement = opt.value"
              >
                <div
                  :class="[
                    'flex items-center justify-center shrink-0 size-[16px] rounded-full border transition-colors duration-150',
                    moyenPaiement === opt.value
                      ? 'border-brand'
                      : 'border-border-neutral group-hover:border-text-neutral-secondary',
                  ]"
                >
                  <div
                    v-if="moyenPaiement === opt.value"
                    class="size-[8px] rounded-full bg-brand"
                  />
                </div>
                <span
                  :class="[
                    'font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] transition-colors duration-150',
                    moyenPaiement === opt.value
                      ? 'text-text-neutral'
                      : 'text-text-neutral-secondary group-hover:text-text-neutral',
                  ]"
                >
                  {{ opt.label }}
                </span>
              </button>
            </div>
          </section>

          <!-- ──────────── Card 2: form for the selected method ──────────── -->
          <section
            class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] flex flex-col gap-[24px] anim-fade-up"
            style="animation-delay: 180ms"
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
              <div :key="moyenPaiement" class="flex flex-col gap-[4px] w-full">
                <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                  {{ moyenPaiementTitle }}
                </p>
                <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                  Renseigner la langue dans laquelle vous souhaitez recevoir les informations de facturation, ainsi que le contact de facturation.
                </p>
              </div>
            </Transition>

            <div class="flex gap-[16px] w-full">
              <div class="flex-1 min-w-0">
                <Input
                  v-model="contactFacturation"
                  label="Contact de facturation"
                  placeholder="johndoe@email.com"
                />
              </div>
              <div class="flex-1 min-w-0">
                <Dropdown
                  v-model="langueCommunication"
                  :items="langueItems"
                  label="Langue de communication"
                  :show-hint="false"
                  :searchable="false"
                  placeholder="Sélectionner une langue"
                />
              </div>
            </div>

            <button
              type="button"
              class="w-full flex items-center justify-center px-[16px] py-[10px] rounded-[8px] bg-brand text-white font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] outline-none transition-[background-color,transform] duration-200 ease-out hover:bg-brand-hover focus-visible:shadow-ring-brand active:scale-[0.97]"
              @click="onValiderMoyen"
            >
              Valider
            </button>
          </section>
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
