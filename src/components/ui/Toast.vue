<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'

type ToastType =
  | 'brand'
  | 'danger'
  | 'warning'
  | 'success'
  | 'neutral'
  | 'icon'
  | 'avatar'
  | 'image'
  | 'textOnly'

interface Props {
  modelValue?: boolean
  type?: ToastType
  title?: string
  description?: string
  icon?: string
  avatarInitials?: string
  imageSrc?: string
  imageAlt?: string
  primaryActionLabel?: string
  secondaryActionLabel?: string
  dismissable?: boolean
  leadingTextOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: true,
  type: 'brand',
  title: '',
  description: '',
  icon: 'envelope',
  avatarInitials: '',
  imageSrc: '',
  imageAlt: '',
  primaryActionLabel: '',
  secondaryActionLabel: '',
  dismissable: true,
  leadingTextOnly: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  dismiss: []
  'primary-action': []
  'secondary-action': []
}>()

const onClose = () => {
  emit('update:modelValue', false)
  emit('dismiss')
}

// Semantic ring icons: solid inner glyph + 2px halo ring (from Figma 4718-12170).
// eslint-disable-next-line @typescript-eslint/naming-convention
const SEMANTIC_PATHS = {
  info: 'M15 8.125C15 4.32804 11.922 1.25 8.125 1.25C4.32804 1.25 1.25 4.32804 1.25 8.125C1.25 11.922 4.32804 15 8.125 15C11.922 15 15 11.922 15 8.125ZM7.34456 6.88314C8.24602 6.51239 9.21336 7.28829 9.04704 8.2487L9.02669 8.34473L8.43587 10.708L8.47087 10.6909C8.77954 10.5368 9.15476 10.6622 9.30908 10.9709C9.4632 11.2795 9.33776 11.6548 9.02913 11.8091L8.99495 11.8262C8.0398 12.3037 6.96443 11.4413 7.22331 10.4053L7.81413 8.04199L7.77913 8.05908C7.47046 8.2132 7.09523 8.08776 6.94092 7.77913C6.7868 7.47046 6.91224 7.09523 7.22087 6.94092L7.25505 6.92383L7.34456 6.88314ZM8.13151 4.375C8.47657 4.37514 8.75651 4.65491 8.75651 5V5.00651C8.75637 5.35148 8.47648 5.63137 8.13151 5.63151H8.125C7.77991 5.63151 7.50014 5.35157 7.5 5.00651V5C7.5 4.65482 7.77982 4.375 8.125 4.375H8.13151ZM16.25 8.125C16.25 12.6123 12.6123 16.25 8.125 16.25C3.63769 16.25 0 12.6123 0 8.125C0 3.63769 3.63769 0 8.125 0C12.6123 0 16.25 3.63769 16.25 8.125Z',
  exclamation: 'M15 8.125C15 4.32804 11.922 1.25 8.125 1.25C4.32804 1.25 1.25 4.32804 1.25 8.125C1.25 11.922 4.32804 15 8.125 15C11.922 15 15 11.922 15 8.125ZM8.13151 10.625C8.47657 10.6251 8.75651 10.9049 8.75651 11.25V11.2565C8.75637 11.6015 8.47648 11.8814 8.13151 11.8815H8.125C7.77991 11.8815 7.50014 11.6016 7.5 11.2565V11.25C7.5 10.9048 7.77982 10.625 8.125 10.625H8.13151ZM7.5 8.75V5.625C7.5 5.27982 7.77982 5 8.125 5C8.47018 5 8.75 5.27982 8.75 5.625V8.75C8.75 9.09518 8.47018 9.375 8.125 9.375C7.77982 9.375 7.5 9.09518 7.5 8.75ZM16.25 8.125C16.25 12.6123 12.6123 16.25 8.125 16.25C3.63769 16.25 0 12.6123 0 8.125C0 3.63769 3.63769 0 8.125 0C12.6123 0 16.25 3.63769 16.25 8.125Z',
  check: 'M15 8.125C15 4.32804 11.922 1.25 8.125 1.25C4.32804 1.25 1.25 4.32804 1.25 8.125C1.25 11.922 4.32804 15 8.125 15C11.922 15 15 11.922 15 8.125ZM10.1164 5.88704C10.3169 5.60624 10.7071 5.54094 10.988 5.74137C11.2688 5.94195 11.3341 6.33209 11.1336 6.61296L8.00863 10.988C7.90184 11.1375 7.73436 11.2324 7.55127 11.2476C7.36826 11.2626 7.18796 11.1967 7.05811 11.0669L5.18311 9.19189L5.13997 9.14469C4.93972 8.89921 4.95427 8.53694 5.18311 8.30811C5.41194 8.07927 5.77421 8.06472 6.01969 8.26497L6.06689 8.30811L7.42025 9.66146L10.1164 5.88704ZM16.25 8.125C16.25 12.6123 12.6123 16.25 8.125 16.25C3.63769 16.25 0 12.6123 0 8.125C0 3.63769 3.63769 0 8.125 0C12.6123 0 16.25 3.63769 16.25 8.125Z',
} as const

interface SemanticConfig {
  path: string
  innerColor: string
  haloColor: string
}

const semanticConfig = computed<SemanticConfig | null>(() => {
  switch (props.type) {
    case 'brand':   return { path: SEMANTIC_PATHS.info,        innerColor: '#2463EB', haloColor: '#DCEBFE' }
    case 'danger':  return { path: SEMANTIC_PATHS.exclamation, innerColor: '#BA1C1C', haloColor: '#FEE1E1' }
    case 'warning': return { path: SEMANTIC_PATHS.exclamation, innerColor: '#C03F0C', haloColor: '#FFEDD6' }
    case 'success': return { path: SEMANTIC_PATHS.check,       innerColor: '#158037', haloColor: '#DCFCE0' }
    case 'neutral': return { path: SEMANTIC_PATHS.info,        innerColor: '#48566A', haloColor: '#F1F5F9' }
    default: return null
  }
})

const isSemantic = computed(() =>
  ['brand', 'danger', 'warning', 'success', 'neutral'].includes(props.type),
)

const showActions = computed(
  () => !props.leadingTextOnly && (!!props.primaryActionLabel || !!props.secondaryActionLabel),
)

// Single-line layout: title only (no description, no actions) OR explicit
// `leadingTextOnly`. Top-aligning a 26px icon next to a 21px line of text
// reads as misaligned (icon appears too high) — center instead.
const isSingleLine = computed(
  () => props.leadingTextOnly || (!props.description && !showActions.value),
)

const isImage = computed(() => props.type === 'image')
</script>

<template>
  <!--
    Emil-style enter/leave:
    – Enter (260ms ease-out-expo): drops from -12px above with a tiny scale-up.
    – Leave (180ms ease-in): lifts up -8px with subtle shrink + opacity.
  -->
  <Transition
    enter-active-class="transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none will-change-[opacity,transform]"
    enter-from-class="opacity-0 -translate-y-[12px] scale-[0.96]"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.4,0,1,1)] motion-reduce:transition-none will-change-[opacity,transform]"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 -translate-y-[8px] scale-[0.97]"
  >
    <div
      v-if="modelValue"
      role="status"
      aria-live="polite"
      :class="[
        'bg-neutral border border-border-neutral rounded-[12px] p-[16px] gap-[12px] w-[400px]',
        'shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)]',
        isImage
          ? 'flex flex-col items-start'
          : isSingleLine
            ? 'flex items-center'
            : 'flex items-start',
      ]"
    >
      <template v-if="!isImage">
        <svg
          v-if="isSemantic && semanticConfig"
          width="26"
          height="26"
          viewBox="0 0 26 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="shrink-0"
          aria-hidden="true"
        >
          <g transform="translate(4.875 4.875)">
            <path :d="semanticConfig.path" :fill="semanticConfig.innerColor" />
          </g>
          <circle cx="13" cy="13" r="12" :stroke="semanticConfig.haloColor" stroke-width="2" />
        </svg>

        <div
          v-else-if="type === 'icon'"
          class="shrink-0 flex items-center justify-center size-[24px] text-icon-neutral-primary"
        >
          <Icon :name="icon" variant="outline" :size="24" />
        </div>

        <div
          v-else-if="type === 'avatar'"
          class="shrink-0 flex items-center justify-center size-[40px] rounded-full bg-neutral-secondary border border-border-neutral overflow-hidden"
        >
          <span
            v-if="avatarInitials"
            class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary"
          >
            {{ avatarInitials }}
          </span>
          <Icon v-else name="user" variant="outline" :size="20" class="text-icon-neutral-secondary" />
        </div>

        <div
          :class="[
            'flex-1 min-w-0 flex flex-col',
            isSingleLine ? 'gap-0' : 'gap-[12px]',
          ]"
        >
          <div :class="['flex flex-col w-full', isSingleLine ? 'gap-0' : 'gap-[4px]']">
            <p class="font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
              {{ title }}
            </p>
            <p
              v-if="!leadingTextOnly && description"
              class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary"
            >
              {{ description }}
            </p>
          </div>

          <div v-if="showActions" class="flex items-start gap-[12px]">
            <button
              v-if="secondaryActionLabel"
              type="button"
              class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary hover:text-text-neutral transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray rounded-[4px]"
              @click="$emit('secondary-action')"
            >
              {{ secondaryActionLabel }}
            </button>
            <button
              v-if="primaryActionLabel"
              type="button"
              class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-[#2563eb] hover:text-text-brand-deep transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray rounded-[4px]"
              @click="$emit('primary-action')"
            >
              {{ primaryActionLabel }}
            </button>
          </div>
        </div>

        <button
          v-if="dismissable"
          type="button"
          aria-label="Fermer"
          class="shrink-0 -m-[8px] flex items-center justify-center p-[8px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray motion-reduce:transition-none"
          @click="onClose"
        >
          <Icon name="x-mark" variant="solid" :size="20" />
        </button>
      </template>

      <template v-else>
        <div class="flex items-start gap-[12px] w-full">
          <div class="flex-1 min-w-0 flex flex-col gap-[4px]">
            <p class="font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">
              {{ title }}
            </p>
            <p
              v-if="!leadingTextOnly && description"
              class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary"
            >
              {{ description }}
            </p>
          </div>
          <button
            v-if="dismissable"
            type="button"
            aria-label="Fermer"
            class="shrink-0 -m-[8px] flex items-center justify-center p-[8px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-secondary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray motion-reduce:transition-none"
            @click="onClose"
          >
            <Icon name="x-mark" variant="solid" :size="20" />
          </button>
        </div>

        <div v-if="imageSrc" class="w-full h-[161px] rounded-[6px] overflow-hidden bg-neutral-secondary">
          <img :src="imageSrc" :alt="imageAlt" class="w-full h-full object-cover" />
        </div>

        <div v-if="showActions" class="flex items-start gap-[12px]">
          <button
            v-if="secondaryActionLabel"
            type="button"
            class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary hover:text-text-neutral transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray rounded-[4px]"
            @click="$emit('secondary-action')"
          >
            {{ secondaryActionLabel }}
          </button>
          <button
            v-if="primaryActionLabel"
            type="button"
            class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-[#2563eb] hover:text-text-brand-deep transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray rounded-[4px]"
            @click="$emit('primary-action')"
          >
            {{ primaryActionLabel }}
          </button>
        </div>
      </template>
    </div>
  </Transition>
</template>
