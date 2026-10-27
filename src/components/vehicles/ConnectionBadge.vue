<script setup lang="ts">
import { computed } from 'vue'
import type { Compatibility, ConnectionStatus } from '~/stores/vehicles'

// Status pill shared by the vehicles listing and the vehicle detail page.
// Colors follow the validated status matrix (Figma "listing-3-matrice-des-statuts"):
// gray = neutral, turquoise = connected/compatible, orange = action needed, rose = failure.
const { status, size = 'sm' } = defineProps<{
  status: ConnectionStatus | Compatibility
  size?: 'sm' | 'md'
}>()

type Tone = 'gray' | 'turquoise' | 'orange' | 'rose'

const CONFIG: Record<ConnectionStatus | Compatibility, { label: string; icon: string; tone: Tone }> = {
  NOT_CONNECTED: { label: 'Non connecté', icon: 'link-slash', tone: 'gray' },
  REQUESTED: { label: 'Invitation envoyée', icon: 'envelope', tone: 'gray' },
  IN_PROGRESS: { label: 'En attente', icon: 'clock', tone: 'gray' },
  CONNECTED: { label: 'Connecté', icon: 'link', tone: 'turquoise' },
  ACTION_REQUIRED: { label: 'Action requise', icon: 'exclamation-triangle', tone: 'orange' },
  FAILED: { label: 'Échec de connexion', icon: 'x-circle', tone: 'rose' },
  DISCONNECTED: { label: 'Déconnecté', icon: 'signal-slash', tone: 'gray' },
  COMPATIBLE: { label: 'Compatible', icon: 'check-circle', tone: 'turquoise' },
  NOT_COMPATIBLE: { label: 'Non compatible', icon: 'no-symbol', tone: 'gray' },
  UNKNOWN: { label: 'Compatibilité inconnue', icon: 'question-mark-circle', tone: 'gray' },
}

const TONE_CLASSES: Record<Tone, string> = {
  gray: 'bg-[#fafafa] border-[#e4e4e7] text-[#48566a]',
  turquoise: 'bg-[#f2fdf9] border-[#bdfae3] text-[#18b97e]',
  orange: 'bg-[#fff6eb] border-[#fed6a9] text-[#e9590c]',
  rose: 'bg-[#fff1f2] border-[#fecdd3] text-[#e11d48]',
}

const config = computed(() => CONFIG[status])
const sizeClasses = computed<string>(() =>
  size === 'md'
    ? 'gap-[6px] px-[10px] py-[2px] text-[14px] tracking-[-0.42px]'
    : 'gap-[4px] px-[8px] py-[2px] text-[12px] tracking-[-0.36px]',
)
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full border font-sans font-medium leading-[1.5] whitespace-nowrap',
      sizeClasses,
      TONE_CLASSES[config.tone],
    ]"
  >
    <Icon :name="config.icon" :size="size === 'md' ? 16 : 14" />
    {{ config.label }}
  </span>
</template>
