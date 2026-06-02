<script setup lang="ts">
import Icon from './Icon.vue'

export type OrgaPackage = 'Classic' | 'Advanced' | 'Entreprise' | 'Legacy'

export interface Orga {
  id: string
  name: string
  package: OrgaPackage
  selfService?: boolean
  suspicious?: boolean
  businessUnitsCount: number
  managerName: string
  managerEmail: string
}

withDefaults(defineProps<{ orga: Orga; disabled?: boolean }>(), { disabled: false })
defineEmits<{ menu: [orgaId: string, event: MouseEvent]; click: [orgaId: string] }>()
</script>

<template>
  <!-- Figma 6548-10535 — Orga card.
       Header: building-library icon + name + package pill (+ optional
       Self service / Suspecte flags) + kebab. Border-b separates the
       header from the 3 info rows (BU count, manager, email). -->
  <article
    data-orga-card="true"
    class="bg-neutral border border-border-neutral-secondary rounded-[8px] overflow-clip flex flex-col transition-colors duration-200 ease-out motion-reduce:transition-none hover:border-border-neutral"
  >
    <!-- Header -->
    <div class="border-b border-border-neutral-secondary flex items-center gap-[10px] p-[16px]">
      <div class="flex-1 min-w-0 flex flex-col gap-[8px] items-start">
        <div class="flex items-center gap-[8px]">
          <Icon name="building-library" variant="outline" :size="24" :class="['shrink-0', disabled ? 'text-icon-neutral-disabled' : 'text-icon-neutral-primary']" />
          <p :class="['font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] whitespace-nowrap', disabled ? 'text-text-neutral-disabled' : 'text-text-neutral']">
            {{ orga.name }}
          </p>
        </div>
        <div :class="['flex items-center gap-[8px]', disabled && 'opacity-60']">
          <!-- Package badge — colour-coded per subscription tier. Classic
               uses a fully rounded pill with a neutral stroke; the other
               tiers use rounded-[8px] with the brand-accent stroke
               (Figma 6548-10535). -->
          <span
            v-if="orga.package === 'Classic'"
            class="inline-flex items-center justify-center px-[8px] py-[2px] rounded-[16px] border border-[#e4e4e7] bg-[#f0fbff] font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-[#0080c5] whitespace-nowrap"
          >
            Classic
          </span>
          <span
            v-else-if="orga.package === 'Advanced'"
            class="inline-flex items-center justify-center px-[8px] py-[2px] rounded-[8px] border border-[#c3b4fd] bg-[#f6f5ff] font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-[#7c3bed] whitespace-nowrap"
          >
            Advanced
          </span>
          <span
            v-else-if="orga.package === 'Entreprise'"
            class="inline-flex items-center justify-center px-[8px] py-[2px] rounded-[8px] border border-[#c3b4fd] bg-[#f0f6ff] font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-[#1e3b8a] whitespace-nowrap"
          >
            Entreprise
          </span>
          <span
            v-else
            class="inline-flex items-center justify-center px-[8px] py-[2px] rounded-[8px] border border-[#c3b4fd] bg-[#f0f3ff] font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-[#5048e5] whitespace-nowrap"
          >
            Legacy
          </span>

          <span
            v-if="orga.selfService"
            class="inline-flex items-center justify-center px-[8px] py-[2px] rounded-[8px] bg-[#fafafa] font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-[#48566a] whitespace-nowrap"
          >
            Self service
          </span>
          <span
            v-if="orga.suspicious"
            class="inline-flex items-center justify-center px-[8px] py-[2px] rounded-[8px] bg-[#fff6eb] font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-[#e9590c] whitespace-nowrap"
          >
            Suspecte
          </span>
        </div>
      </div>
      <button
        type="button"
        class="shrink-0 flex items-center justify-center size-[44px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-colors duration-150 ease-out motion-reduce:transition-none outline-none focus-visible:shadow-ring-gray"
        :aria-label="`Actions sur ${orga.name}`"
        @click.stop="(e) => $emit('menu', orga.id, e)"
      >
        <Icon name="ellipsis-vertical" variant="outline" :size="20" />
      </button>
    </div>

    <!-- Info rows -->
    <div class="p-[16px] flex flex-col gap-[16px]">
      <div class="flex items-center gap-[8px]">
        <Icon name="building-office" variant="outline" :size="16" :class="['shrink-0', disabled ? 'text-icon-neutral-disabled' : 'text-icon-neutral-secondary']" />
        <p :class="['flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] truncate', disabled ? 'text-text-neutral-disabled' : 'text-text-neutral-secondary']">
          <span class="tabular-nums">{{ orga.businessUnitsCount }}</span> Business {{ orga.businessUnitsCount <= 1 ? 'unit' : 'units' }}
        </p>
      </div>
      <div class="flex items-center gap-[8px]">
        <Icon name="user-circle" variant="outline" :size="16" :class="['shrink-0', disabled ? 'text-icon-neutral-disabled' : 'text-icon-neutral-secondary']" />
        <p :class="['flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] truncate', disabled ? 'text-text-neutral-disabled' : 'text-text-neutral-secondary']">
          {{ orga.managerName }}
        </p>
      </div>
      <div class="flex items-center gap-[8px]">
        <Icon name="envelope" variant="outline" :size="16" :class="['shrink-0', disabled ? 'text-icon-neutral-disabled' : 'text-icon-neutral-secondary']" />
        <p :class="['flex-1 min-w-0 font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] truncate', disabled ? 'text-text-neutral-disabled' : 'text-text-neutral-secondary']">
          {{ orga.managerEmail }}
        </p>
      </div>
    </div>
  </article>
</template>
