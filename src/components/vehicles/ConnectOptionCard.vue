<script setup lang="ts">
// One of the two connection choices (invite the driver / connect myself), Figma
// connexion-1-*: radio header; when selected, numbered steps + footer slot (checkbox, CTA).
// Steps use **…** to mark the emphasized words.
const { title, selected, steps } = defineProps<{ title: string; selected: boolean; steps: string[] }>()
const emit = defineEmits<{ select: [] }>()

const segments = (step: string) => step.split('**').map((text, i) => ({ text, bold: i % 2 === 1 }))
</script>

<template>
  <div class="w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-hidden">
    <button
      type="button"
      role="radio"
      :aria-checked="selected"
      class="flex items-center justify-between gap-[16px] w-full p-[16px] min-h-[76px] text-left outline-none focus-visible:shadow-ring-brand"
      @click="emit('select')"
    >
      <span class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">{{ title }}</span>
      <span
        :class="[
          'flex items-center justify-center shrink-0 size-[20px] rounded-full transition-colors duration-150',
          selected ? 'bg-brand' : 'border border-border-neutral',
        ]"
      >
        <span
          :class="[
            'size-[8px] rounded-full bg-white transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
            selected ? 'scale-100' : 'scale-0',
          ]"
        />
      </span>
    </button>

    <!-- Expand/collapse: grid-template-rows trick (same as the sidebar groups) + content fade -->
    <div
      :class="[
        'grid transition-[grid-template-rows] duration-[280ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
        selected ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      ]"
      :inert="!selected"
    >
      <div
        :class="[
          'min-h-0 overflow-hidden transition-[opacity,transform] duration-[220ms] ease-out motion-reduce:transition-none',
          selected ? 'opacity-100 translate-y-0 delay-[60ms]' : 'opacity-0 -translate-y-[4px]',
        ]"
      >
        <ol class="mx-[16px] mb-[16px] flex flex-col gap-[16px] p-[16px] rounded-[8px] bg-neutral-secondary">
          <li
            v-for="(step, i) in steps"
            :key="i"
            class="flex gap-[8px] font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary"
          >
            <span class="font-medium text-text-neutral">{{ i + 1 }}.</span>
            <span>
              <template v-for="(seg, si) in segments(step)" :key="si">
                <span v-if="seg.bold" class="font-medium text-text-neutral">{{ seg.text }}</span>
                <template v-else>{{ seg.text }}</template>
              </template>
            </span>
          </li>
        </ol>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px] px-[16px] py-[16px] border-t border-border-neutral-secondary">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </div>
</template>
