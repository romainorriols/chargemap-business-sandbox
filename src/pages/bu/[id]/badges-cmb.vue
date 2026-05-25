<script setup lang="ts">
const headingClass = usePageHeadingClass()
const uiStore = useUiStore()
import { ref, reactive } from 'vue'

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

const selectedRuleId = ref<string | null>(null)
function onRuleClick(rule: RuleCard) {
  selectedRuleId.value = selectedRuleId.value === rule.id ? null : rule.id
}
</script>

<template>
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
          :aria-pressed="selectedRuleId === rule.id"
          :style="{ animationDelay: `${40 + i * 30}ms` }"
          :class="[
            'text-left flex flex-col gap-[16px] p-[16px] rounded-[16px] overflow-clip anim-fade-up border outline-none cursor-pointer',
            'transition-[background-color,border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none',
            'shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]',
            selectedRuleId === rule.id
              ? 'bg-neutral-secondary border-border-brand shadow-ring-brand'
              : 'bg-neutral border-border-neutral-secondary hover:bg-neutral-hover focus-visible:shadow-ring-brand focus-visible:border-border-brand',
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
  </div>
</template>
