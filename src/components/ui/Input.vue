<script setup lang="ts">
import { computed, useAttrs } from 'vue'
type InputSize = 'sm' | 'md'
type InputType = 'default' | 'leadingIcon' | 'leadingText' | 'leadingDropdown' | 'trailingText' | 'trailingButton' | 'payment'

interface Props {
  modelValue?: string
  size?: InputSize
  type?: InputType
  label?: string
  placeholder?: string
  hint?: string
  optionnel?: boolean
  destructive?: boolean
  disabled?: boolean
  helpIcon?: boolean
  addonLeadingText?: string
  addonTrailingText?: string
  addonButtonLabel?: string
  icon?: string
  /** trailingText only: show the hardcoded currency-euro leading icon. */
  showCurrencyIcon?: boolean
  /** trailingText only: render the vertical divider before the trailing addon. */
  trailingSeparator?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  size: 'md',
  type: 'default',
  label: '',
  placeholder: '',
  hint: '',
  optionnel: false,
  destructive: false,
  disabled: false,
  helpIcon: false,
  addonLeadingText: '',
  addonTrailingText: 'kWh',
  addonButtonLabel: 'Copy',
  icon: '',
  showCurrencyIcon: true,
  trailingSeparator: true,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()

const isSplitLayout = computed(() =>
  ['leadingText', 'leadingDropdown', 'trailingText', 'trailingButton'].includes(props.type)
)

const wrapperClasses = computed(() => [
  'flex items-center w-full rounded-md border bg-neutral shadow-sm transition-all duration-150 overflow-hidden',
  !isSplitLayout.value
    ? props.size === 'md' ? 'h-11 px-3 gap-2' : 'px-3 py-2 gap-2'
    : props.size === 'md' ? 'h-11' : '',
  props.disabled
    ? 'bg-neutral-disabled border-neutral-disabled cursor-not-allowed'
    : props.destructive
      ? 'border-danger focus-within:border-danger focus-within:shadow-ring-danger'
      : 'border-border-neutral-secondary focus-within:border-brand focus-within:shadow-ring-brand',
])

const inputClasses = computed(() => [
  'flex-1 min-w-0 bg-transparent border-none outline-none font-sans leading-[1.5]',
  props.size === 'md' ? 'text-base tracking-[-0.03em]' : 'text-sm tracking-[-0.03em]',
  props.disabled
    ? 'text-text-neutral-disabled cursor-not-allowed'
    : 'text-text-neutral placeholder:text-text-neutral-secondary',
])

const hintClasses = computed(() => [
  'text-sm leading-[1.5] tracking-[-0.03em] font-sans',
  props.destructive ? 'text-text-danger-medium' : 'text-text-neutral-secondary',
])

const addonTextSize = computed(() => props.size === 'md' ? 'text-base' : 'text-sm')
</script>

<template>
  <div class="flex flex-col gap-1 w-full">

    <!-- Label row -->
    <div v-if="label" class="flex items-center gap-[6px]">
      <label class="flex-1 text-sm font-medium leading-[1.5] tracking-[-0.03em] text-text-neutral font-sans">
        {{ label }}
      </label>
      <span v-if="optionnel" class="text-xs leading-[1.5] tracking-[-0.03em] text-text-secondary font-sans">
        Optionnel
      </span>
    </div>

    <!-- Input wrapper -->
    <div :class="wrapperClasses">

      <!-- ── DEFAULT / LEADING ICON / PAYMENT ─────────────────────────────── -->
      <template v-if="['default', 'leadingIcon', 'payment'].includes(type)">

        <!-- Leading icon -->
        <Icon
          v-if="type === 'leadingIcon'"
          :name="icon || 'envelope'"
          :size="size === 'md' ? 20 : 18"
          class="shrink-0 text-icon-neutral-secondary"
        />

        <!-- Payment card badge -->
        <div v-else-if="type === 'payment'" class="border border-border-neutral-secondary h-6 rounded w-[34px] shrink-0 bg-white flex items-center justify-center overflow-hidden p-[4px]">
          <svg preserveAspectRatio="none" width="100%" height="100%" overflow="visible" viewBox="0 0 22.358 13.4" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11.179 11.7995C9.99493 12.7975 8.45902 13.4 6.78069 13.4C3.03582 13.4 0 10.4003 0 6.7C0 2.99969 3.03582 0 6.78069 0C8.45902 0 9.99493 0.602498 11.179 1.60054C12.363 0.602498 13.8989 0 15.5773 0C19.3221 0 22.358 2.99969 22.358 6.7C22.358 10.4003 19.3221 13.4 15.5773 13.4C13.8989 13.4 12.363 12.7975 11.179 11.7995Z" fill="#ED0006"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11.179 11.7995C12.6369 10.5706 13.5614 8.74195 13.5614 6.7C13.5614 4.65804 12.6369 2.82944 11.179 1.60054C12.363 0.602497 13.8989 0 15.5773 0C19.3221 0 22.3579 2.99969 22.3579 6.7C22.3579 10.4003 19.3221 13.4 15.5773 13.4C13.8989 13.4 12.363 12.7975 11.179 11.7995Z" fill="#F9A000"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11.179 11.7994C12.6369 10.5705 13.5614 8.74193 13.5614 6.69999C13.5614 4.65805 12.6369 2.82945 11.179 1.60055C9.72107 2.82945 8.79662 4.65805 8.79662 6.69999C8.79662 8.74193 9.72107 10.5705 11.179 11.7994Z" fill="#FF5E00"/>
          </svg>
        </div>

        <!-- Input -->
        <input
          v-bind="attrs"
          :value="modelValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :class="inputClasses"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />

        <!-- Help icon -->
        <button v-if="helpIcon" type="button" class="shrink-0 flex items-center justify-center text-text-neutral-secondary hover:text-text-neutral transition-colors" tabindex="-1">
          <Icon name="question-mark-circle" :size="14" />
        </button>
      </template>

      <!-- ── LEADING DROPDOWN ───────────────────────────────────────────────── -->
      <template v-else-if="type === 'leadingDropdown'">
        <div class="flex items-center gap-0.5 px-3 shrink-0 self-stretch">
          <span :class="['font-sans leading-[1.5] tracking-[-0.03em] text-text-neutral whitespace-nowrap', addonTextSize]">
            {{ addonLeadingText || 'FR' }}
          </span>
          <Icon name="chevron-down" :size="18" class="shrink-0 text-icon-neutral-secondary" />
        </div>
        <div class="flex flex-1 gap-2 items-center min-w-0 overflow-hidden pr-3" :class="size === 'sm' ? 'py-2' : ''">
          <input
            v-bind="attrs"
            :value="modelValue"
            :placeholder="placeholder"
            :disabled="disabled"
            :class="inputClasses"
            @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          />
          <button v-if="helpIcon" type="button" class="shrink-0 flex items-center justify-center text-text-neutral-secondary hover:text-text-neutral transition-colors" tabindex="-1">
            <Icon name="question-mark-circle" :size="14" />
          </button>
        </div>
      </template>

      <!-- ── LEADING TEXT ───────────────────────────────────────────────────── -->
      <template v-else-if="type === 'leadingText'">
        <div class="flex items-center px-3 shrink-0 self-stretch">
          <span :class="['font-sans leading-[1.5] tracking-[-0.03em] text-text-neutral-secondary whitespace-nowrap', addonTextSize]">
            {{ addonLeadingText || 'https://' }}
          </span>
        </div>
        <div class="flex flex-1 gap-2 items-center min-w-0 overflow-hidden px-3 h-full border-l border-border-neutral" :class="size === 'sm' ? 'py-2' : ''">
          <input
            v-bind="attrs"
            :value="modelValue"
            :placeholder="placeholder"
            :disabled="disabled"
            :class="inputClasses"
            @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          />
          <button v-if="helpIcon" type="button" class="shrink-0 flex items-center justify-center text-text-neutral-secondary hover:text-text-neutral transition-colors" tabindex="-1">
            <Icon name="question-mark-circle" :size="14" />
          </button>
        </div>
      </template>

      <!-- ── TRAILING TEXT ──────────────────────────────────────────────────── -->
      <template v-else-if="type === 'trailingText'">
        <div class="flex flex-1 gap-2 items-center min-w-0 overflow-hidden pl-3" :class="size === 'sm' ? 'py-2' : ''">
          <Icon v-if="showCurrencyIcon" name="currency-euro" :size="size === 'md' ? 20 : 18" class="shrink-0 text-icon-neutral-secondary" />
          <input
            v-bind="attrs"
            :value="modelValue"
            :placeholder="placeholder"
            :disabled="disabled"
            :class="inputClasses"
            @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          />
          <button v-if="helpIcon" type="button" class="shrink-0 flex items-center justify-center text-text-neutral-secondary hover:text-text-neutral transition-colors" tabindex="-1">
            <Icon name="question-mark-circle" :size="14" />
          </button>
        </div>
        <div
          :class="[
            'flex items-center px-3 shrink-0 self-stretch',
            trailingSeparator ? 'border-l border-border-neutral-secondary' : '',
          ]"
        >
          <span :class="['font-sans leading-[1.5] tracking-[-0.03em] text-text-neutral whitespace-nowrap', addonTextSize]">
            {{ addonTrailingText }}
          </span>
        </div>
      </template>

      <!-- ── TRAILING BUTTON ───────────────────────────────────────────────── -->
      <template v-else-if="type === 'trailingButton'">
        <div class="flex flex-1 gap-2 items-center min-w-0 overflow-hidden px-3 h-full border-r border-border-neutral relative z-[1] bg-neutral" :class="size === 'sm' ? 'py-2' : ''">
          <input
            v-bind="attrs"
            :value="modelValue"
            :placeholder="placeholder"
            :disabled="disabled"
            :class="inputClasses"
            @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          />
          <button v-if="helpIcon" type="button" class="shrink-0 flex items-center justify-center text-text-neutral-secondary hover:text-text-neutral transition-colors" tabindex="-1">
            <Icon name="question-mark-circle" :size="14" />
          </button>
        </div>
        <button
          type="button"
          class="flex items-center justify-center px-3 shrink-0 self-stretch bg-neutral hover:bg-neutral-secondary transition-colors"
          :class="['font-medium font-sans leading-[1.5] tracking-[-0.03em] text-text-neutral-secondary', addonTextSize]"
          :disabled="disabled"
        >
          {{ addonButtonLabel }}
        </button>
      </template>

    </div>

    <!-- Hint / error message -->
    <p v-if="hint" :class="hintClasses">{{ hint }}</p>

  </div>
</template>
