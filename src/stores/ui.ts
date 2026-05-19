// Sandbox UI flags. The empty-state toggle replaces every page's seed
// data with an empty list so we can demo / screenshot empty states
// without juggling routes or feature flags. Persisted to localStorage
// like the nav version, so the choice survives reloads.
const EMPTY_STATE_KEY              = 'cm-sandbox-empty-state'
const MAX_WIDTH_KEY                = 'cm-sandbox-max-width-by-page'
const GROUP_LIST_VARIANT_KEY       = 'cm-sandbox-group-list-variant'
const NETWORK_PICKER_VARIANT_KEY   = 'cm-sandbox-network-picker-variant'
const ADD_BADGES_VARIANT_KEY       = 'cm-sandbox-add-badges-variant'

export type SandboxMaxWidth = 2192 | 1600 | 800

export const SANDBOX_MAX_WIDTH_OPTIONS: readonly SandboxMaxWidth[] = [2192, 1600, 800] as const

export type GroupListVariant = 'detailed' | 'compact'
export const GROUP_LIST_VARIANT_OPTIONS: readonly GroupListVariant[] = ['detailed', 'compact'] as const

export type NetworkPickerVariant = 'default' | 'super-partners'
export const NETWORK_PICKER_VARIANT_OPTIONS: readonly NetworkPickerVariant[] = ['default', 'super-partners'] as const

// "Ajouter des badges" entry from the group detail view either swaps the
// in-page table for the add-mode table (default) or pops a modal layered
// on top of the detail view (Figma 6131-33437).
export type AddBadgesVariant = 'swap' | 'modal'
export const ADD_BADGES_VARIANT_OPTIONS: readonly AddBadgesVariant[] = ['swap', 'modal'] as const

// Default max-width per page key. All defaults must be one of the
// SANDBOX_MAX_WIDTH_OPTIONS so the segmented control always has an
// active button when the user hasn't overridden the value yet.
// Pages can be identified by their route path; BU pages collapse to a
// single key per slug so all BUs share the same setting.
const PAGE_DEFAULTS: Record<string, SandboxMaxWidth> = {
  '/':                       1600,
  '/orders':                 1600,
  '/billing':                2192,
  '/users':                  2192,
  '/bus':                    2192,
  '/install-project':        2192,
  '/settings':               800,
  // BU detail family (one key per slug, shared across all BU IDs)
  '/bu/home':                2192,
  '/bu/settings':            800,
  '/bu/supervised-charges':  2192,
  '/bu/groups':              2192,
  '/bu/default':             2192,
}

/** Maps a runtime route path to a stable page key (collapses BU IDs). */
export function pageKeyForPath(path: string): string {
  if (path.startsWith('/bu/')) {
    const parts = path.split('/').filter(Boolean) // ['bu', '<id>', '<slug>?']
    const slug = parts[2] ?? 'home'
    const key = `/bu/${slug}`
    return key in PAGE_DEFAULTS ? key : '/bu/default'
  }
  return path
}

export const useUiStore = defineStore('ui', () => {
  let initialEmpty = false
  let initialMaxByPage: Partial<Record<string, SandboxMaxWidth>> = {}
  let initialGroupVariant: GroupListVariant = 'compact'
  let initialPickerVariant: NetworkPickerVariant = 'default'
  let initialAddBadgesVariant: AddBadgesVariant = 'swap'
  if (import.meta.client) {
    const storedEmpty = localStorage.getItem(EMPTY_STATE_KEY)
    if (storedEmpty !== null) initialEmpty = storedEmpty === 'true'
    const storedMax = localStorage.getItem(MAX_WIDTH_KEY)
    if (storedMax) {
      try {
        const parsed = JSON.parse(storedMax) as Record<string, number>
        for (const [k, v] of Object.entries(parsed)) {
          if (v === 2192 || v === 1600 || v === 800) initialMaxByPage[k] = v
        }
      } catch { /* ignore */ }
    }
    const storedGroupVariant = localStorage.getItem(GROUP_LIST_VARIANT_KEY)
    if (storedGroupVariant === 'detailed' || storedGroupVariant === 'compact') {
      initialGroupVariant = storedGroupVariant
    }
    const storedPickerVariant = localStorage.getItem(NETWORK_PICKER_VARIANT_KEY)
    if (storedPickerVariant === 'default' || storedPickerVariant === 'super-partners') {
      initialPickerVariant = storedPickerVariant
    }
    const storedAddBadgesVariant = localStorage.getItem(ADD_BADGES_VARIANT_KEY)
    if (storedAddBadgesVariant === 'swap' || storedAddBadgesVariant === 'modal') {
      initialAddBadgesVariant = storedAddBadgesVariant
    }
  }
  const showEmptyState         = ref(initialEmpty)
  const maxWidthByPage         = ref<Partial<Record<string, SandboxMaxWidth>>>(initialMaxByPage)
  const groupListVariant       = ref<GroupListVariant>(initialGroupVariant)
  const networkPickerVariant   = ref<NetworkPickerVariant>(initialPickerVariant)
  const addBadgesVariant       = ref<AddBadgesVariant>(initialAddBadgesVariant)

  /** Read the active max-width for a page key — user override or default. */
  function getMaxWidth(key: string): SandboxMaxWidth {
    return maxWidthByPage.value[key] ?? PAGE_DEFAULTS[key] ?? 1600
  }
  /** Override the max-width for a page key. */
  function setMaxWidth(key: string, value: SandboxMaxWidth) {
    maxWidthByPage.value[key] = value
  }

  if (import.meta.client) {
    watch(showEmptyState,        v => localStorage.setItem(EMPTY_STATE_KEY, String(v)))
    watch(maxWidthByPage,        v => localStorage.setItem(MAX_WIDTH_KEY, JSON.stringify(v)), { deep: true })
    watch(groupListVariant,      v => localStorage.setItem(GROUP_LIST_VARIANT_KEY, v))
    watch(networkPickerVariant,  v => localStorage.setItem(NETWORK_PICKER_VARIANT_KEY, v))
    watch(addBadgesVariant,      v => localStorage.setItem(ADD_BADGES_VARIANT_KEY, v))
  }

  return {
    showEmptyState, maxWidthByPage,
    groupListVariant,
    networkPickerVariant,
    addBadgesVariant,
    getMaxWidth, setMaxWidth,
  }
})
