// Sidebar/nav version: V2 (white, default) vs V1 (blue). Shared so pages can
// adapt their typography to the active nav (e.g. V1 page H1s use V1_PAGE_HEADING
// while V2 uses font-heading semibold at 28-32px).
// Vehicles prototype branch: the sandbox toggle is gone, so the nav is pinned to
// V1 (blue, as in the Figma screens) for every visitor.
export const useNavStore = defineStore('nav', () => {
  const isNavV2 = ref(false)
  return { isNavV2 }
})
