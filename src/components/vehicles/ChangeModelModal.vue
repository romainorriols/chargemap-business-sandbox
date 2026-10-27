<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CATALOG_BRANDS, VEHICLE_CATALOG, vehiclePhotoUrl } from '~/utils/vehicleCatalog'
import vehicleThumbnail from '~/assets/illustrations/vehicle-thumbnail.png'

// "Changer de véhicule" modal (Figma choix-modele-1/2/3): fixed height,
// 3 steps Constructeur → Modèle → Version, back link at the top of steps 2-3.
const { open } = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  close: []
  select: [model: { brand: string; model: string; version: string }]
}>()

const brand = ref<string | null>(null)
const model = ref<string | null>(null)
const search = ref('')

const step = computed<1 | 2 | 3>(() => (model.value ? 3 : brand.value ? 2 : 1))

const subtitle = computed<string>(() => {
  if (step.value === 3) return `Étape 3 sur 3 · Version ${brand.value} ${model.value}`
  if (step.value === 2) return `Étape 2 sur 3 · Modèle ${brand.value}`
  return 'Étape 1 sur 3 · Constructeur'
})

// Step 1 search matches brands and models ("Megane" → Renault Megane E-Tech)
const matchingBrands = computed<string[]>(() => {
  const q = search.value.trim().toLowerCase()
  return q ? CATALOG_BRANDS.filter(b => b.toLowerCase().includes(q)) : CATALOG_BRANDS
})
const matchingModels = computed<{ brand: string; model: string }[]>(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return []
  return CATALOG_BRANDS.flatMap(b =>
    Object.keys(VEHICLE_CATALOG[b])
      .filter(m => m.toLowerCase().includes(q))
      .map(m => ({ brand: b, model: m })),
  )
})

const models = computed<string[]>(() => (brand.value ? Object.keys(VEHICLE_CATALOG[brand.value]) : []))
const versions = computed<string[]>(() => (brand.value && model.value ? VEHICLE_CATALOG[brand.value][model.value] : []))
const modelPhoto = computed<string>(() => vehiclePhotoUrl(brand.value, model.value) ?? vehicleThumbnail)

const pickModel = (b: string, m: string) => {
  brand.value = b
  model.value = m
}
const back = () => {
  if (model.value) model.value = null
  else brand.value = null
}
const pickVersion = (version: string) => {
  if (brand.value && model.value) emit('select', { brand: brand.value, model: model.value, version })
}

// Always restart from step 1 when the modal opens again
watch(() => open, isOpen => {
  if (!isOpen) return
  brand.value = null
  model.value = null
  search.value = ''
})

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const rowClass = 'flex items-center gap-[16px] w-full min-h-[65px] px-[16px] py-[8px] border-b border-border-neutral-secondary text-left outline-none transition-colors duration-150 ease-out hover:bg-neutral-secondary focus-visible:bg-neutral-secondary'
const rowLabelClass = 'flex-1 min-w-0 truncate font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral'
</script>

<template>
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
        v-if="open"
        class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
        aria-hidden="true"
        @click="emit('close')"
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
        v-if="open"
        class="fixed inset-0 z-[70] flex items-center justify-center p-[16px] pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-model-title"
      >
        <div
          class="pointer-events-auto w-full max-w-[600px] h-[min(632px,100%)] bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-[0_20px_50px_-12px_rgba(15,23,41,0.18),0_8px_20px_-8px_rgba(15,23,41,0.12)] flex flex-col overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="relative shrink-0 flex flex-col gap-[2px] px-[24px] py-[16px] pr-[64px] border-b border-border-neutral-secondary">
            <p id="change-model-title" class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
              Changer de véhicule
            </p>
            <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
              {{ subtitle }}
            </p>
            <button
              type="button"
              aria-label="Fermer"
              class="absolute top-[16px] right-[16px] flex items-center justify-center p-[8px] rounded-[8px] outline-none text-text-neutral-secondary transition-[background-color,color,transform] duration-150 ease-out hover:bg-neutral-secondary hover:text-text-neutral focus-visible:shadow-ring-gray active:scale-[0.95]"
              @click="emit('close')"
            >
              <Icon name="x-mark" variant="solid" :size="20" />
            </button>
          </div>

          <!-- Body (scrolls inside the fixed-height card) -->
          <div class="flex-1 min-h-0 overflow-y-auto px-[16px] pt-[16px] pb-[16px]">
            <!-- Step 1 — brands (+ models matching the search) -->
            <template v-if="step === 1">
              <div class="mb-[8px]">
                <Input
                  v-model="search"
                  type="leadingIcon"
                  icon="magnifying-glass"
                  placeholder="Rechercher une marque ou un modèle"
                />
              </div>
              <button
                v-for="m in matchingModels"
                :key="`${m.brand}-${m.model}`"
                type="button"
                :class="rowClass"
                @click="pickModel(m.brand, m.model)"
              >
                <span :class="rowLabelClass">{{ m.brand }} {{ m.model }}</span>
                <Icon name="chevron-right" :size="20" class="shrink-0 text-icon-neutral-secondary" />
              </button>
              <button
                v-for="b in matchingBrands"
                :key="b"
                type="button"
                :class="rowClass"
                @click="brand = b"
              >
                <span :class="rowLabelClass">{{ b }}</span>
                <Icon name="chevron-right" :size="20" class="shrink-0 text-icon-neutral-secondary" />
              </button>
              <p
                v-if="!matchingBrands.length && !matchingModels.length"
                class="px-[16px] py-[24px] text-center font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary"
              >
                Aucune marque ni aucun modèle ne correspond à « {{ search }} ».
              </p>
            </template>

            <!-- Steps 2-3 — back link + models or versions -->
            <template v-else>
              <button
                type="button"
                class="flex items-center gap-[8px] px-[16px] py-[8px] mb-[8px] rounded-[8px] outline-none font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary transition-colors duration-150 ease-out hover:text-text-neutral focus-visible:shadow-ring-gray"
                @click="back"
              >
                <Icon name="chevron-left" :size="20" class="shrink-0" />
                {{ step === 3 ? `Modèles ${brand}` : 'Constructeurs' }}
              </button>

              <template v-if="step === 2">
                <button
                  v-for="m in models"
                  :key="m"
                  type="button"
                  :class="rowClass"
                  @click="model = m"
                >
                  <span :class="rowLabelClass">{{ m }}</span>
                  <Icon name="chevron-right" :size="20" class="shrink-0 text-icon-neutral-secondary" />
                </button>
              </template>

              <template v-else>
                <button
                  v-for="v in versions"
                  :key="v"
                  type="button"
                  :class="rowClass"
                  @click="pickVersion(v)"
                >
                  <img
                    :src="modelPhoto"
                    alt=""
                    class="size-[56px] shrink-0 rounded-[6px] border border-border-neutral-secondary bg-neutral object-contain"
                  >
                  <span :class="rowLabelClass">{{ v }}</span>
                  <Icon name="chevron-right" :size="20" class="shrink-0 text-icon-neutral-secondary" />
                </button>
              </template>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
