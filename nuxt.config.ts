// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],

  // Scan all components without path-based prefix so `<Icon />`,
  // `<HorizontalTabs />`, etc. resolve regardless of their nested folder.
  // Subdirectory names are folded — collisions must be renamed (we did so
  // for `components/dashboard/DashboardTabs.vue`).
  components: [{ path: '~/components', pathPrefix: false }],

  // Sandbox = SPA only (no SSR). State persists in localStorage which is
  // safe to read at module scope when ssr: false.
  ssr: false,

  // Match the project layout — sources stay under src/.
  srcDir: 'src/',

  // Tailwind module wires up tailwindcss + autoprefixer + the @tailwind
  // directives. Point cssPath at our existing tokens-aware stylesheet so
  // we keep the @import './tokens.css' chain and the page-fade keyframes.
  tailwindcss: {
    cssPath: '~/assets/main.css',
  },

  // Mirror the original index.html metadata.
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Chargemap Business — Sandbox',
      meta: [
        { charset: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      ],
      link: [{ rel: 'icon', type: 'image/png', href: '/favicon.png' }],
    },
  },

  compatibilityDate: '2026-05-06',
  devtools: { enabled: true },
  typescript: { strict: true },
})
