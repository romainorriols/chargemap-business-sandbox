# CLAUDE.md

Chargemap Business Sandbox — front-only UI prototype.

**Stack:** Nuxt 3 (SPA, `ssr: false`), Pinia, Tailwind v3 via `@nuxtjs/tailwindcss`, TypeScript, Vue 3 `<script setup>`. Sources under `src/`. No backend, no real API — seed data lives at the top of each page.

## Skills

Project-scoped skills live under `.claude/skills/`. They auto-trigger when their description matches the user's intent.

- [chargemap-figma-implement](.claude/skills/chargemap-figma-implement/SKILL.md) — translate a Figma node into code following the project's component conventions.
- [emil-design-eng](.claude/skills/emil-design-eng/SKILL.md) — Emil Kowalski's playbook on UI polish, animation decisions, micro-interactions.
- [impeccable](.claude/skills/impeccable/SKILL.md) — design vocabulary + 23 commands (`shape`, `craft`, `audit`, `polish`, …) and anti-pattern detection. Pinned via `skills-lock.json`. Companion CLI runs via `npx impeccable detect src/` (no devDep). First use on a fresh checkout: run `/impeccable teach` to generate `PRODUCT.md` — the skill won't do design work without it.

---

# Project conventions

## Always reach for the component lib first

Before writing inline markup for tabs, buttons, dropdowns, inputs, alerts, banners, sidebars, toasts, etc. — **check `src/components/ui/` (auto-imported in Nuxt) and pick the existing component**. The same components live in the `Storybook B2B` repo (read-only source of truth) and are mirrored here.

Concretely:
- Need page tabs with the brand underline? → `<HorizontalTabs variant="underline" v-model="activeTab" :tabs="tabs" />` (not a hand-rolled flex+absolute span).
- Pill/segmented tabs? → same component, default `variant="pill"`.
- Need a button? → `<Button type="…" size="…" />`. Don't roll a custom `<button class="px-... py-... bg-...">` unless the lib genuinely doesn't cover the case.
- Need a dropdown / input / banner / alert / toast? → check the lib first.

Why: animations (sliding indicators, focus rings), keyboard handling, ARIA, and design-token consistency are baked into the lib components. Inline markup misses them and drifts visually over time.

If the lib component is missing a variant the design needs, **extend the component** (add a prop) rather than hand-rolling a one-off. Mirror the change in the Storybook B2B source so both stay in sync.

---

# Behavioral guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
