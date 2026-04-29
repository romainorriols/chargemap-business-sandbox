import { ref, watch } from 'vue'

// Sidebar/nav version: V2 (white, default) vs V1 (blue). Shared so pages can
// adapt their typography to the active nav (e.g. V1 page H1s are 24px Inter
// Medium, while V2 uses font-heading semibold at 28-32px).
const NAV_VERSION_KEY = 'cm-sandbox-nav-version'
const stored = localStorage.getItem(NAV_VERSION_KEY)
export const isNavV2 = ref<boolean>(stored === null ? true : stored === 'true')
watch(isNavV2, v => localStorage.setItem(NAV_VERSION_KEY, String(v)))

// V1 page-header typography (Figma 5233:60245). Pages drop down to this shape
// when the user switches the sidebar to V1. Used inline as :class binding:
//   :class="isNavV2 ? '<page-specific V2 heading>' : V1_PAGE_HEADING"
export const V1_PAGE_HEADING =
  'font-sans font-medium text-[24px] leading-[1.5] tracking-[-0.72px] text-text-neutral'
