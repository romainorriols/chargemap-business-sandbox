<script setup lang="ts">
import { computed } from 'vue'
type AlertType = 'brand' | 'neutral' | 'danger' | 'warning' | 'success'

interface Props {
  /** Visibility — drives the enter/leave transition. Defaults to true so the alert renders without v-model. */
  modelValue?: boolean
  type?: AlertType
  title?: string
  description?: string
  primaryActionLabel?: string
  secondaryActionLabel?: string
  /** Show the close (X) button. */
  dismissable?: boolean
  /** Compact single-line variant: hide description + actions, vertically center the title. */
  leadingTextOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: true,
  type: 'brand',
  title: 'We’ve just released a new feature',
  description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid pariatur, ipsum dolor.',
  primaryActionLabel: 'View more',
  secondaryActionLabel: 'Dismiss',
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

// Composed 26×26 ring icons — solid inner glyph centered inside a 2px halo ring.
// Same path data as Toast's semantic icons (Figma 4718-12170).
// eslint-disable-next-line @typescript-eslint/naming-convention
const SEMANTIC_PATHS = {
  info: 'M15 8.125C15 4.32804 11.922 1.25 8.125 1.25C4.32804 1.25 1.25 4.32804 1.25 8.125C1.25 11.922 4.32804 15 8.125 15C11.922 15 15 11.922 15 8.125ZM7.34456 6.88314C8.24602 6.51239 9.21336 7.28829 9.04704 8.2487L9.02669 8.34473L8.43587 10.708L8.47087 10.6909C8.77954 10.5368 9.15476 10.6622 9.30908 10.9709C9.4632 11.2795 9.33776 11.6548 9.02913 11.8091L8.99495 11.8262C8.0398 12.3037 6.96443 11.4413 7.22331 10.4053L7.81413 8.04199L7.77913 8.05908C7.47046 8.2132 7.09523 8.08776 6.94092 7.77913C6.7868 7.47046 6.91224 7.09523 7.22087 6.94092L7.25505 6.92383L7.34456 6.88314ZM8.13151 4.375C8.47657 4.37514 8.75651 4.65491 8.75651 5V5.00651C8.75637 5.35148 8.47648 5.63137 8.13151 5.63151H8.125C7.77991 5.63151 7.50014 5.35157 7.5 5.00651V5C7.5 4.65482 7.77982 4.375 8.125 4.375H8.13151ZM16.25 8.125C16.25 12.6123 12.6123 16.25 8.125 16.25C3.63769 16.25 0 12.6123 0 8.125C0 3.63769 3.63769 0 8.125 0C12.6123 0 16.25 3.63769 16.25 8.125Z',
  exclamation: 'M15 8.125C15 4.32804 11.922 1.25 8.125 1.25C4.32804 1.25 1.25 4.32804 1.25 8.125C1.25 11.922 4.32804 15 8.125 15C11.922 15 15 11.922 15 8.125ZM8.13151 10.625C8.47657 10.6251 8.75651 10.9049 8.75651 11.25V11.2565C8.75637 11.6015 8.47648 11.8814 8.13151 11.8815H8.125C7.77991 11.8815 7.50014 11.6016 7.5 11.2565V11.25C7.5 10.9048 7.77982 10.625 8.125 10.625H8.13151ZM7.5 8.75V5.625C7.5 5.27982 7.77982 5 8.125 5C8.47018 5 8.75 5.27982 8.75 5.625V8.75C8.75 9.09518 8.47018 9.375 8.125 9.375C7.77982 9.375 7.5 9.09518 7.5 8.75ZM16.25 8.125C16.25 12.6123 12.6123 16.25 8.125 16.25C3.63769 16.25 0 12.6123 0 8.125C0 3.63769 3.63769 0 8.125 0C12.6123 0 16.25 3.63769 16.25 8.125Z',
  check: 'M15 8.125C15 4.32804 11.922 1.25 8.125 1.25C4.32804 1.25 1.25 4.32804 1.25 8.125C1.25 11.922 4.32804 15 8.125 15C11.922 15 15 11.922 15 8.125ZM10.1164 5.88704C10.3169 5.60624 10.7071 5.54094 10.988 5.74137C11.2688 5.94195 11.3341 6.33209 11.1336 6.61296L8.00863 10.988C7.90184 11.1375 7.73436 11.2324 7.55127 11.2476C7.36826 11.2626 7.18796 11.1967 7.05811 11.0669L5.18311 9.19189L5.13997 9.14469C4.93972 8.89921 4.95427 8.53694 5.18311 8.30811C5.41194 8.07927 5.77421 8.06472 6.01969 8.26497L6.06689 8.30811L7.42025 9.66146L10.1164 5.88704ZM16.25 8.125C16.25 12.6123 12.6123 16.25 8.125 16.25C3.63769 16.25 0 12.6123 0 8.125C0 3.63769 3.63769 0 8.125 0C12.6123 0 16.25 3.63769 16.25 8.125Z',
} as const

interface TypeConfig {
  iconPath: string
  innerColor: string
  haloColor: string
  bgVar: string
  borderVar: string
  textVar: string
}

// Pull semantic colors from CSS variables so the brand swap (theme-partners)
// flows through automatically. We use `var(...)` arbitraries because not every
// "lighter border" token is exposed in tailwind.config.js — referencing the
// CSS var keeps the design system as the single source of truth.
const typeConfig = computed<TypeConfig>(() => {
  switch (props.type) {
    case 'danger':
      return {
        iconPath: SEMANTIC_PATHS.exclamation,
        innerColor: 'var(--icon-danger)',
        haloColor: 'var(--border-danger-lighter)',
        bgVar: 'var(--bg-danger-surface)',
        borderVar: 'var(--border-danger-lighter)',
        textVar: 'var(--text-danger-deep)',
      }
    case 'warning':
      return {
        iconPath: SEMANTIC_PATHS.exclamation,
        innerColor: 'var(--icon-warning)',
        haloColor: 'var(--border-warning-lighter)',
        bgVar: 'var(--bg-warning-surface)',
        borderVar: 'var(--border-warning-lighter)',
        textVar: 'var(--text-warning-deep)',
      }
    case 'success':
      return {
        iconPath: SEMANTIC_PATHS.check,
        innerColor: 'var(--icon-success)',
        haloColor: 'var(--border-success-lighter)',
        bgVar: 'var(--bg-success-surface)',
        borderVar: 'var(--border-success-lighter)',
        textVar: 'var(--text-success-deep)',
      }
    case 'neutral':
      return {
        iconPath: SEMANTIC_PATHS.info,
        innerColor: 'var(--icon-neutral-secondary)',
        haloColor: 'var(--bg-neutral-tertiary)',
        bgVar: 'var(--bg-neutral-secondary)',
        borderVar: 'var(--border-neutral-secondary)',
        textVar: 'var(--text-neutral)',
      }
    case 'brand':
    default:
      return {
        iconPath: SEMANTIC_PATHS.info,
        innerColor: 'var(--icon-brand)',
        haloColor: 'var(--border-brand-lighter)',
        bgVar: 'var(--bg-brand-surface)',
        borderVar: 'var(--border-brand-medium)',
        textVar: 'var(--text-brand-deep)',
      }
  }
})

const showActions = computed(
  () => !props.leadingTextOnly && (!!props.primaryActionLabel || !!props.secondaryActionLabel),
)
</script>

<template>
  <Transition
    enter-active-class="transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none will-change-[opacity,transform]"
    enter-from-class="opacity-0 -translate-y-[8px] scale-[0.97]"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.4,0,1,1)] motion-reduce:transition-none will-change-[opacity,transform]"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 -translate-y-[6px] scale-[0.98]"
  >
    <div
      v-if="modelValue"
      role="alert"
      :class="[
        'w-full p-[16px] gap-[12px] rounded-[8px] border border-solid shadow-sm',
        leadingTextOnly ? 'flex items-center' : 'flex items-start',
      ]"
      :style="{
        backgroundColor: typeConfig.bgVar,
        borderColor: typeConfig.borderVar,
        color: typeConfig.textVar,
      }"
    >
      <!-- Composed 26×26 SVG: solid inner glyph centered + 2px halo ring. -->
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="shrink-0"
        aria-hidden="true"
      >
        <g transform="translate(4.875 4.875)">
          <path :d="typeConfig.iconPath" :fill="typeConfig.innerColor" />
        </g>
        <circle cx="13" cy="13" r="12" :stroke="typeConfig.haloColor" stroke-width="2" />
      </svg>

      <!-- Content -->
      <div
        :class="[
          'flex-1 min-w-0 flex flex-col',
          leadingTextOnly ? 'gap-0' : 'gap-[12px]',
        ]"
      >
        <div :class="['flex flex-col w-full', leadingTextOnly ? 'gap-0' : 'gap-[4px]']">
          <p class="font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px]">
            {{ title }}
          </p>
          <p
            v-if="!leadingTextOnly && description"
            class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px]"
          >
            {{ description }}
          </p>
        </div>

        <div v-if="showActions" class="flex items-start gap-[12px]">
          <button
            v-if="secondaryActionLabel"
            type="button"
            class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] outline-none focus-visible:shadow-ring-gray rounded-[4px] transition-opacity duration-150 ease-out hover:opacity-80"
            @click="$emit('secondary-action')"
          >
            {{ secondaryActionLabel }}
          </button>
          <button
            v-if="primaryActionLabel"
            type="button"
            class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] outline-none focus-visible:shadow-ring-gray rounded-[4px] transition-opacity duration-150 ease-out hover:opacity-80"
            @click="$emit('primary-action')"
          >
            {{ primaryActionLabel }}
          </button>
        </div>
      </div>

      <!-- Close X -->
      <button
        v-if="dismissable"
        type="button"
        aria-label="Fermer"
        class="shrink-0 -m-[8px] flex items-center justify-center p-[8px] rounded-[8px] outline-none focus-visible:shadow-ring-gray transition-[background-color,transform] duration-150 ease-out active:scale-[0.95] motion-reduce:transition-none hover:bg-black/5"
        @click="onClose"
      >
        <Icon name="x-mark" variant="solid" :size="20" />
      </button>
    </div>
  </Transition>
</template>
