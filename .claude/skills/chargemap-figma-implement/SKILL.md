---
name: chargemap-figma-implement
description: Translate Figma designs into Chargemap Business Sandbox screens (Vue 3 + Vite + Tailwind v3 + TypeScript). Use whenever the user shares a Figma URL/node and asks to implement, update, or extend a UI. Encodes the project's component conventions, tokens, animations, view↔edit pattern, listing↔detail pattern, skeleton loading, and toast feedback.
---

# Chargemap Business Sandbox — Figma → Code

The sandbox is a pure UI prototype: no router, no backend, no real state persistence. Pages live under [src/pages/](../../src/pages/) and reuse a small UI kit under [src/components/ui/](../../src/components/ui/). When the user shares a Figma URL the goal is **pixel-perfect 1:1 parity** with the project's existing patterns — not a fresh interpretation.

## Workflow (every task)

1. **Fetch the design first.** Call `mcp__figma__get_screenshot` with the node ID. Use the screenshot as the visual source of truth. Only call `mcp__figma__get_design_context` if the screenshot is ambiguous — its responses are often huge and get saved to a file.
2. **Find the closest existing pattern** in [src/pages/](../../src/pages/) and reuse it. The codebase has well-established recipes (see below). Don't invent a new pattern when one exists.
3. **Reuse UI components** from [src/components/ui/](../../src/components/ui/) — never re-style buttons, inputs, dropdowns inline.
4. **Implement with arbitrary Tailwind values** matching Figma exactly: `text-[14px] leading-[1.5] tracking-[-0.42px] p-[24px] rounded-[12px]`.
5. **Validate**: `npx vue-tsc --noEmit --skipLibCheck` must pass. For UI changes, boot dev (`npm run dev`) and confirm no runtime errors in the log.

## Stack rules

- Vue 3, `<script setup lang="ts">`, Composition API.
- Tailwind v3 with arbitrary values is the default — *never* hardcode a hex unless it's not in tokens (e.g. the icon-tile purple `#6467f2`).
- Single source of truth per page. View and edit modes read/write the same `reactive` object.
- No router: detail views swap inline via a `selectedId` ref + `v-if/v-else`.
- No backend: data is seed arrays at the top of the page file.

## Tokens you must use

Background / border / text / icon tokens live in [tailwind.config.js](../../tailwind.config.js). The ones used everywhere:

- **Surfaces**: `bg-neutral` (cards), `bg-neutral-secondary` (hover), `bg-neutral-tertiary` (skeletons, ellipsis-menu hover)
- **Borders**: `border-border-neutral` (buttons), `border-border-neutral-secondary` (cards), `border-border-neutral-tertiary` (separators in cards)
- **Text**: `text-text-neutral` (primary), `text-text-neutral-secondary` (labels), `text-text-brand-deep` (active pagination), `text-text-danger`
- **Icons**: `text-icon-neutral-primary`, `text-icon-neutral-secondary`, `text-icon-danger`
- **Brand**: `bg-brand` + `bg-brand-hover` (primary CTA), `bg-brand-surface` (active pagination chip)
- **Focus rings**: `focus-visible:shadow-ring-gray` (neutral), `focus-visible:shadow-ring-brand` (brand action)

Icon tile color used for section headers (Coordonnées, Rôles, Administrateur, Organisation, Token API): `bg-[#6467f2]` with white icon. This is intentional and not in the token set.

## Icons

Icons come from `figmaIcons` in [src/icons/figma.ts](../../src/icons/figma.ts) via `<Icon name="..." variant="outline|solid" :size="..." />`. Names match the heroicons set.

- "Copy to clipboard" glyph is **`square-2-stack`** (two overlapping squares), *not* `document-duplicate`. Confirmed against Figma.
- Section headers: `identification` (Coordonnées), `star` (Rôles), `user` (Administrateur), `building-library` (Organisation), `key` (Token API).
- Common UI: `arrow-left`, `chevron-left`, `chevron-right`, `magnifying-glass`, `plus`, `pencil-square`, `trash`, `ellipsis-vertical`.

## Typography

- Page title (h1): `font-heading font-semibold text-[32px] leading-[1.5] tracking-[-0.96px] text-text-neutral`
- Section title (card header): `font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral`
- Body labels & values: `font-sans text-[14px] leading-[1.5] tracking-[-0.42px]` — `font-normal text-text-neutral-secondary` for labels, `font-medium text-text-neutral` for values
- Button label: `font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px]`

## Cards

Standard info card:

```html
<section class="w-full bg-neutral border border-border-neutral-secondary rounded-[12px] shadow-sm p-[24px] flex flex-col gap-[16px]">
  <div class="flex items-center gap-[12px] w-full">
    <div class="flex items-center justify-center shrink-0 size-[37px] rounded-[12px] bg-[#6467f2]">
      <Icon name="..." variant="solid" :size="24" class="text-white" />
    </div>
    <p class="flex-1 min-w-0 font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral truncate">Title</p>
    <button>...</button>
  </div>
  <div class="h-px w-full bg-border-neutral-tertiary" />
  <!-- rows -->
</section>
```

Row pattern (label / value, separator above each row except the first inside the body):

```html
<div class="h-px w-full bg-border-neutral-tertiary" />
<div class="flex items-center justify-between py-[8px] font-sans text-[14px] leading-[1.5] tracking-[-0.42px]">
  <p class="font-normal text-text-neutral-secondary">Label</p>
  <p class="font-medium text-text-neutral text-right truncate ml-[8px]">Value</p>
</div>
```

## Animations

- Page entry: `anim-fade-up` with staggered `style="animation-delay: Xms"`. Header 0ms, search/filters 50ms, content 100ms, items 100+i*40ms, footer 200ms.
- Tab content uses `mode="out-in"` `<Transition>` plus a wrapping `anim-fade-up` with 80ms delay.
- Hover lift (cards): `transition-[transform,box-shadow,border-color] duration-200 ease-out hover:border-border-neutral hover:shadow-md hover:-translate-y-[2px]`
- Button press: `active:scale-[0.97]` (primary) or `active:scale-[0.95]` (icon-only)
- All transitions: `motion-reduce:transition-none` whenever the transition is on a non-trivial element.

## Reusable patterns

### View ↔ Edit pattern (Settings.vue is the canonical reference)

Used for any "Modifier" → "Enregistrer" card. Implemented in [Settings.vue:380-590](../../src/pages/Settings.vue#L380-L590) and [Users.vue](../../src/pages/Users.vue).

1. **State**: `const editing = reactive<Record<'card1' | 'card2', boolean>>({ card1: false, card2: false })`
2. **Snapshot on enter, diff on save, toast if changed**:
   ```ts
   let snapshot = { ...source }
   const onToggleX = () => {
     if (!editing.x) { snapshot = { ...source }; editing.x = true; return }
     // save logic
     const changed = source.field !== snapshot.field /* ... */
     if (changed) showSuccessToast('Informations mis à jours', '')
     editing.x = false
   }
   ```
3. **Button morph** — Modifier (neutral) → Enregistrer (brand). Wrap the inner span in a `<Transition mode="out-in">` keyed on `editing.x ? 'save' : 'edit'`:
   ```html
   <button
     :class="[
       'shrink-0 rounded-[8px] px-[12px] py-[8px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] outline-none focus-visible:shadow-ring-brand active:scale-[0.97]',
       'transition-[background-color,border-color,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]',
       editing.x
         ? 'bg-brand border border-brand text-white hover:bg-brand-hover'
         : 'bg-neutral border border-border-neutral text-text-neutral-secondary hover:bg-neutral-secondary',
     ]"
     @click="onToggleX"
   >
     <Transition mode="out-in" enter-active-class="..." ...>
       <span :key="editing.x ? 'save' : 'edit'" class="inline-block">
         {{ editing.x ? 'Enregistrer' : 'Modifier' }}
       </span>
     </Transition>
   </button>
   ```
4. **Body cross-fade** — view and edit share the same parent, swapped with `<Transition mode="out-in">`:
   ```
   enter-active-class="transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
   enter-from-class="opacity-0 translate-y-[6px]"
   enter-to-class="opacity-100 translate-y-0"
   leave-active-class="transition-[opacity,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
   leave-from-class="opacity-100 translate-y-0"
   leave-to-class="opacity-0 -translate-y-[4px]"
   ```
5. **Z-index** — when a card hosts a Dropdown popover in edit mode, bump it: `editing.x ? 'z-20' : 'z-10'` so the popover overlaps adjacent cards.
6. **Reset on navigation** — when leaving a detail view (`backToList`), set every `editing.x = false`.

### Listing ↔ Detail pattern (Users.vue)

No router. The list and detail templates live in the same component:

```ts
const selectedId = ref<string | null>(null)
const selectedUser = computed(() => items.find(i => i.id === selectedId.value) ?? null)
function open(id: string) { selectedId.value = id }
function back() { selectedId.value = null; /* reset edit flags */ }
```

```html
<div v-if="!selectedUser" class="...listing wrapper...">...</div>
<div v-else class="mx-auto w-full max-w-[800px] flex flex-col gap-[32px]">
  <div class="flex items-start gap-[16px] anim-fade-up">
    <div class="flex flex-col items-start justify-center">
      <button class="...back link..." @click="back">
        <Icon name="arrow-left" variant="outline" :size="16" />
        <span>Retour</span>
      </button>
      <h1 class="font-heading font-semibold text-[32px] ...">{{ selectedUser.name }}</h1>
    </div>
  </div>
  <!-- info cards -->
</div>
```

Cards in the listing are **clickable** with full keyboard support:

```html
<article
  role="button"
  tabindex="0"
  class="... cursor-pointer outline-none focus-visible:shadow-ring-gray ..."
  @click="open(u.id)"
  @keydown.enter="open(u.id)"
  @keydown.space.prevent="open(u.id)"
>
```

### Toast pattern

One toast at a time, auto-dismiss after 3.5s. Mount once per page with a fixed wrapper:

```ts
const toast = reactive<{ visible: boolean; title: string; description: string }>({
  visible: false, title: '', description: '',
})
let toastTimer: ReturnType<typeof setTimeout> | null = null
const showSuccessToast = (title: string, description: string) => {
  if (toastTimer) clearTimeout(toastTimer)
  toast.title = title; toast.description = description; toast.visible = true
  toastTimer = setTimeout(() => { toast.visible = false }, 3500)
}
```

```html
<div class="pointer-events-none fixed top-[24px] right-[24px] z-50">
  <div class="pointer-events-auto">
    <Toast v-model="toast.visible" type="success" :title="toast.title" :description="toast.description"
           :primary-action-label="''" :secondary-action-label="''" />
  </div>
</div>
```

Standard message after a successful edit: `showSuccessToast('Informations mis à jours', '')`.

### Skeleton loading

Use `<Skeleton>` from [src/components/ui/Skeleton.vue](../../src/components/ui/Skeleton.vue). Pattern:

```ts
const isLoading = ref(true)
onMounted(() => setTimeout(() => { isLoading.value = false }, 600))
const skeletonRows = Array.from({ length: 8 }, (_, i) => i)
```

In the template, the skeleton replaces the table body while keeping the header in place. Match the column proportions exactly (`flex-[1.3]` etc.) so there's no layout shift on swap. Footer/pagination only renders when not loading and there are results: `v-if="!isLoading && filteredX.length"`. The shimmer already respects `prefers-reduced-motion`.

### Ellipsis menu (per-card)

Single-open behavior, closes on outside click:

```ts
const openMenuId = ref<string | null>(null)
function toggleMenu(id: string, e: MouseEvent) {
  e.stopPropagation()
  openMenuId.value = openMenuId.value === id ? null : id
}
function closeMenus() { openMenuId.value = null }
```

The page wrapper gets `@click="closeMenus"`; the menu container gets `@click.stop`. Icon button toggles `bg-neutral-tertiary` when open. The popover uses `<Transition>` with `opacity + scale-[0.96] + translate-y-[4px]` enter/leave.

### Roles edit (rolling empty row)

When editing a list of rows the user can grow, append an empty trailing row automatically rather than showing a "+" button:

```ts
watch(rolesForm, (rows) => {
  if (!editing.roles) return
  if (rows.length === 0 || (rows[rows.length - 1].bu && rows[rows.length - 1].role)) {
    rows.push({ bu: '', role: '' })
  }
}, { deep: true })
```

The trash button is only rendered when the row has at least one filled value; otherwise render a `size-[40px]` placeholder so the layout stays aligned.

## Cross-page consistency

- **BU names** must match [BusinessUnits.vue](../../src/pages/BusinessUnits.vue) (currently: Brakson, Saabre, Chargemap, Mister EV, Cleanrider, Responsible Ads, Marketing). Detail pages and dropdowns reference these — never invent new BUs.
- **Roles** (Users.vue): Admin de BU, Gestionnaire de flotte, Superviseur de réseau.
- **Detail container width**: `max-w-[800px]` matches Settings and Users.
- **Page padding**: `min-h-full px-[32px] pt-[44px] pb-[32px]`.
- **Listing wrapper**: `mx-auto w-full max-w-[1500px] flex flex-col gap-[32px]`.

## Components in [src/components/ui/](../../src/components/ui/)

- `Button` — primary/secondary; `size`, `iconLeft`, `iconRight`, `label`
- `Input` — `type="leadingIcon"` for search; **`optionnel` prop** renders the "Optionnel" hint on the right of the label (used in edit forms)
- `Dropdown` — supports `inputType="country"` + `menuType="country"` + `#flag` slot for the country flag; pass `:show-label="false" :show-hint="false" :searchable="false"` for compact inline use (roles edit)
- `Toast` — `v-model` for visibility, `type="success"`, `title`/`description`/`primary-action-label`/`secondary-action-label`
- `Skeleton` — `width`, `height`, `rounded`, `circle` props
- `Icon` — see Icons section
- `HorizontalTabs`, `Toggle`, `Alert` — used in Settings

## Validation checklist (before declaring done)

- [ ] Type-check passes: `npx vue-tsc --noEmit --skipLibCheck`
- [ ] Dev server boots cleanly: `npm run dev` shows no errors in the first ~3s of log
- [ ] Visual parity: spacing, radius, color, typography match the screenshot
- [ ] Hover, focus-visible, active states present
- [ ] Edit mode (if applicable): button morphs, body cross-fades, snapshot/diff/toast wired
- [ ] Empty state and skeleton state both handled where the listing supports them
- [ ] No new BU/role values that aren't in the canonical lists

## Anti-patterns to avoid

- Don't add comments explaining what well-named code already says — only the *why* (a hidden constraint, a non-obvious decision).
- Don't introduce a router or a state library. The sandbox stays self-contained.
- Don't create skeleton/toast/edit helpers as new files — keep the recipe inline per page so each page reads end-to-end.
- Don't use `document-duplicate` for clipboard copy — use `square-2-stack`.
- Don't omit `motion-reduce:transition-none` on long transitions.
- Don't forget the z-index bump (`z-20`) on edit-mode cards that contain dropdowns.
