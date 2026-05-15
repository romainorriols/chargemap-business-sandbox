// Sandbox UI flags. The empty-state toggle replaces every page's seed
// data with an empty list so we can demo / screenshot empty states
// without juggling routes or feature flags. Persisted to localStorage
// like the nav version, so the choice survives reloads.
const EMPTY_STATE_KEY          = 'cm-sandbox-empty-state'
const MAX_WIDTH_KEY            = 'cm-sandbox-max-width-by-page'
const NETWORK_PICKER_MODE_KEY  = 'cm-sandbox-network-picker-mode'
const NETWORK_LOGO_MODE_KEY    = 'cm-sandbox-network-logo-mode'
const GROUP_LIST_VARIANT_KEY   = 'cm-sandbox-group-list-variant'

export type SandboxMaxWidth = 2192 | 1600 | 800

export const SANDBOX_MAX_WIDTH_OPTIONS: readonly SandboxMaxWidth[] = [2192, 1600, 800] as const

export type NetworkPickerMode = 'panel' | 'modal' | 'drawer' | 'wide'
export const NETWORK_PICKER_MODE_OPTIONS: readonly NetworkPickerMode[] = ['panel', 'modal', 'drawer', 'wide'] as const

export type NetworkLogoMode = 'real' | 'generic'
export const NETWORK_LOGO_MODE_OPTIONS: readonly NetworkLogoMode[] = ['real', 'generic'] as const

export type GroupListVariant = 'detailed' | 'compact'
export const GROUP_LIST_VARIANT_OPTIONS: readonly GroupListVariant[] = ['detailed', 'compact'] as const

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
  let initialPickerMode: NetworkPickerMode = 'panel'
  let initialLogoMode: NetworkLogoMode = 'real'
  let initialGroupVariant: GroupListVariant = 'detailed'
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
    const storedPickerMode = localStorage.getItem(NETWORK_PICKER_MODE_KEY)
    if (
      storedPickerMode === 'panel'  ||
      storedPickerMode === 'modal'  ||
      storedPickerMode === 'drawer' ||
      storedPickerMode === 'wide'
    ) {
      initialPickerMode = storedPickerMode
    }
    const storedLogoMode = localStorage.getItem(NETWORK_LOGO_MODE_KEY)
    if (storedLogoMode === 'real' || storedLogoMode === 'generic') {
      initialLogoMode = storedLogoMode
    }
    const storedGroupVariant = localStorage.getItem(GROUP_LIST_VARIANT_KEY)
    if (storedGroupVariant === 'detailed' || storedGroupVariant === 'compact') {
      initialGroupVariant = storedGroupVariant
    }
  }
  const showEmptyState     = ref(initialEmpty)
  const maxWidthByPage     = ref<Partial<Record<string, SandboxMaxWidth>>>(initialMaxByPage)
  const networkPickerMode  = ref<NetworkPickerMode>(initialPickerMode)
  const networkLogoMode    = ref<NetworkLogoMode>(initialLogoMode)
  const groupListVariant   = ref<GroupListVariant>(initialGroupVariant)

  /** Read the active max-width for a page key — user override or default. */
  function getMaxWidth(key: string): SandboxMaxWidth {
    return maxWidthByPage.value[key] ?? PAGE_DEFAULTS[key] ?? 1600
  }
  /** Override the max-width for a page key. */
  function setMaxWidth(key: string, value: SandboxMaxWidth) {
    maxWidthByPage.value[key] = value
  }

  if (import.meta.client) {
    watch(showEmptyState,    v => localStorage.setItem(EMPTY_STATE_KEY, String(v)))
    watch(maxWidthByPage,    v => localStorage.setItem(MAX_WIDTH_KEY, JSON.stringify(v)), { deep: true })
    watch(networkPickerMode, v => localStorage.setItem(NETWORK_PICKER_MODE_KEY, v))
    watch(networkLogoMode,   v => localStorage.setItem(NETWORK_LOGO_MODE_KEY, v))
    watch(groupListVariant,  v => localStorage.setItem(GROUP_LIST_VARIANT_KEY, v))
  }

  return {
    showEmptyState, maxWidthByPage,
    networkPickerMode, networkLogoMode,
    groupListVariant,
    getMaxWidth, setMaxWidth,
  }
})
