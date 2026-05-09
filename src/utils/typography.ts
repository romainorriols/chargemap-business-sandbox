import { computed, type ComputedRef } from 'vue'
import { useNavStore } from '~/stores/nav'

// Page-header typography (Figma 5233:60245). Used inline as :class binding
// on each page's <h1>. V1 uses Inter at 24px medium; V2 uses Plus Jakarta
// Sans at 32px semibold. The active variant is picked by navStore.isNavV2.
export const V1_PAGE_HEADING =
  'font-sans font-medium text-[24px] leading-[1.5] tracking-[-0.72px] text-text-neutral'

export const V2_PAGE_HEADING =
  'font-heading font-semibold text-[32px] leading-[1.2] tracking-[-0.96px] text-text-neutral'

// Pages bind their <h1> to the result of this composable so the heading
// auto-switches between V1 and V2 typography when the nav toggles. Beats
// duplicating a 3-line ternary in every page.
export function usePageHeadingClass(): ComputedRef<string> {
  const navStore = useNavStore()
  return computed(() => (navStore.isNavV2 ? V2_PAGE_HEADING : V1_PAGE_HEADING))
}
