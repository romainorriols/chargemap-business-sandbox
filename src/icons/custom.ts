// Custom Chargemap icons not present in @heroicons/vue
// Each icon exports `outline` and/or `solid` as raw SVG inner content (paths/shapes)

export type IconVariant = 'outline' | 'solid'

interface IconPaths {
  outline?: string
  solid?: string
}

export const customIcons: Record<string, IconPaths> = {

  // ── EV Charging ──────────────────────────────────────────────────────────

  'wallbox': {
    outline: `
      <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" stroke-width="1.5"/>
      <rect x="8" y="5" width="8" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="12" cy="17" r="1.25" stroke="currentColor" stroke-width="1.5"/>
      <path d="M10 14.5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    solid: `
      <rect x="5" y="2" width="14" height="20" rx="2" fill="currentColor"/>
      <rect x="8" y="5" width="8" height="6" rx="1" fill="white"/>
      <circle cx="12" cy="17" r="1.25" fill="white"/>
      <path d="M10 14.5h4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>`,
  },

  'charging-station': {
    outline: `
      <path d="M4 21V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M2 21h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M16 10h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" stroke="currentColor" stroke-width="1.5"/>
      <path d="M10 9.5 8.5 13H10l-1.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    solid: `
      <path fill-rule="evenodd" clip-rule="evenodd" d="M4 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13H4V8Z" fill="currentColor"/>
      <path d="M2 21h16M16 10h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M10 9.5 8.5 13H10l-1.5 3.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },

  'plugged-car': {
    outline: `
      <path d="M2 14h1M21 14h1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M17 14H7l1.5-4h7L17 14Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="8" cy="17" r="1.5" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="16" cy="17" r="1.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M9.5 17H14.5M3 14h4M17 14h4v-2l-1-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M19 8v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M17 6h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    solid: `
      <path d="M8.5 10 7 14h10l-1.5-4H8.5Z" fill="currentColor"/>
      <path d="M2 14h5L5.5 10.5A2 2 0 0 1 7.4 9h9.2a2 2 0 0 1 1.9 1.4L20 14h2v-1l-1-1h-1V9h1V7h-5v2h1v3H4a2 2 0 0 0-2 2Z" fill="currentColor"/>
      <circle cx="8" cy="17" r="1.5" fill="currentColor"/>
      <circle cx="16" cy="17" r="1.5" fill="currentColor"/>`,
  },

  'autocharge': {
    outline: `
      <path d="M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3Z" stroke="currentColor" stroke-width="1.5"/>
      <path d="M9 12.5 11 9l2 3.5h-1.5L13 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    solid: `
      <path fill-rule="evenodd" clip-rule="evenodd" d="M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3Z" fill="currentColor"/>
      <path d="M9 12.5 11 9l2 3.5h-1.5L13 15" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },

  'plug-n-charge': {
    outline: `
      <path d="M9 3h6M10 3v4l-2 2v4h8V9l-2-2V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 13v2M8 17h8a1 1 0 0 1 1 1v1H7v-1a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M11 7h2M11 9h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    solid: `
      <path d="M10 3v4l-2 2v4h8V9l-2-2V3h-4Z" fill="currentColor"/>
      <rect x="9" y="3" width="6" height="1.5" rx="0.75" fill="currentColor"/>
      <path d="M12 13v2M8 17h8a1 1 0 0 1 1 1v1H7v-1a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  },

  'electric-outlet': {
    outline: `
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/>
      <path d="M11 10.5v3M13 10.5v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    solid: `
      <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
      <path d="M11 10.5v3M13 10.5v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  },

  'charge-status-charging': {
    outline: `
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
      <path d="M13.5 8 10 13h3l-2.5 5 5-7h-3l1-3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
    solid: `
      <circle cx="12" cy="12" r="10" fill="currentColor"/>
      <path d="M13.5 8 10 13h3l-2.5 5 5-7h-3l1-3Z" fill="white"/>`,
  },

  'charge-status-occupied': {
    outline: `
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
      <path d="M9 12h6M12 9v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    solid: `
      <circle cx="12" cy="12" r="10" fill="currentColor"/>
      <path d="M9 12h6M12 9v3" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
  },

  'charge-status-plugged-cable': {
    outline: `
      <path d="M8 5v4M11 5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M7 9h5a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-1a1 1 0 0 1 1-1h1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M9.5 15v5M9.5 20h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M17 5l-2 5h2l-2 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    solid: `
      <path d="M8 5v4M11 5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M7 9h5a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-1a1 1 0 0 1 1-1h1Z" fill="currentColor"/>
      <path d="M9.5 15v5M9.5 20h5M17 5l-2 5h2l-2 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },

  'bolt-fast': {
    outline: `
      <path d="M14 3 8 13h5l-3 8 9-11h-5l2-7H14Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    solid: `
      <path d="M14 3 8 13h5l-3 8 9-11h-5l2-7H14Z" fill="currentColor"/>`,
  },

  'charging-badge-pass': {
    outline: `
      <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/>
      <path d="M3 10h18" stroke="currentColor" stroke-width="1.5"/>
      <path d="M7 14h4M7 16.5h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M15.5 12.5l-1 3h1.5l-1 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    solid: `
      <rect x="3" y="6" width="18" height="13" rx="2" fill="currentColor"/>
      <path d="M3 10h18" stroke="white" stroke-width="1.5"/>
      <path d="M7 14h4M7 16.5h2" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M15.5 12.5l-1 3h1.5l-1 2.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },

  // ── Location ──────────────────────────────────────────────────────────────

  'parking': {
    outline: `
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5"/>
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    solid: `
      <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor"/>
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  },

  'gas-station': {
    outline: `
      <path d="M4 21V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M2 21h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M16 10h2a2 2 0 0 1 2 2v3a1 1 0 0 0 1 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M7 11h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    solid: `
      <path fill-rule="evenodd" clip-rule="evenodd" d="M4 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13H4V8Z" fill="currentColor"/>
      <path d="M2 21h14M16 10h2a2 2 0 0 1 2 2v3a1 1 0 0 0 1 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M7 11h6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>`,
  },

  'pin': {
    outline: `
      <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Z" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" stroke-width="1.5"/>`,
    solid: `
      <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Z" fill="currentColor"/>
      <circle cx="12" cy="9" r="2.5" fill="white"/>`,
  },

  'route': {
    outline: `
      <circle cx="5" cy="6" r="2" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="19" cy="18" r="2" stroke="currentColor" stroke-width="1.5"/>
      <path d="M5 8v3a2 2 0 0 0 2 2h10a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    solid: `
      <circle cx="5" cy="6" r="2.5" fill="currentColor"/>
      <circle cx="19" cy="18" r="2.5" fill="currentColor"/>
      <path d="M5 8v3a2 2 0 0 0 2 2h10a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  },

  'lodging': {
    outline: `
      <path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M3 21h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="9" y="12" width="6" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/>
      <rect x="7" y="7" width="3" height="3" rx="0.5" stroke="currentColor" stroke-width="1.5"/>
      <rect x="14" y="7" width="3" height="3" rx="0.5" stroke="currentColor" stroke-width="1.5"/>`,
    solid: `
      <path fill-rule="evenodd" clip-rule="evenodd" d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16H3V5Z" fill="currentColor"/>
      <rect x="9" y="12" width="6" height="9" rx="1" fill="white"/>
      <rect x="7" y="7" width="3" height="3" rx="0.5" fill="white"/>
      <rect x="14" y="7" width="3" height="3" rx="0.5" fill="white"/>`,
  },

  'restaurant': {
    outline: `
      <path d="M9 3v7a4 4 0 0 1-8 0V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M5 3v18M5 10v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M19 3v18M19 3a5 5 0 0 0-5 5v4h10V8a5 5 0 0 0-5-5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    solid: `
      <path d="M3 3v7a4 4 0 0 0 4 4v7H5V3H3ZM7 14v7H9V14a4 4 0 0 0 4-4V3H9v7a2 2 0 0 1-2 4Z" fill="currentColor"/>
      <path d="M19 3a5 5 0 0 0-5 5v4h10V8a5 5 0 0 0-5-5Z" fill="currentColor"/>
      <rect x="14" y="12" width="10" height="9" rx="0.5" fill="currentColor"/>`,
  },

  'train-station': {
    outline: `
      <rect x="4" y="3" width="16" height="13" rx="3" stroke="currentColor" stroke-width="1.5"/>
      <path d="M4 10h16" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="8.5" cy="14.5" r="1" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="15.5" cy="14.5" r="1" stroke="currentColor" stroke-width="1.5"/>
      <path d="M7 19l2-3M17 19l-2-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M5 19h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    solid: `
      <rect x="4" y="3" width="16" height="13" rx="3" fill="currentColor"/>
      <path d="M4 10h16" stroke="white" stroke-width="1.5"/>
      <circle cx="8.5" cy="14.5" r="1.25" fill="white"/>
      <circle cx="15.5" cy="14.5" r="1.25" fill="white"/>
      <path d="M7 19l2-3M17 19l-2-3M5 19h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  },

  // ── Logos ─────────────────────────────────────────────────────────────────

  'logo-google': {
    outline: `
      <path d="M22 12.24c0-.72-.06-1.25-.19-1.8H12v3.24h5.72a4.8 4.8 0 0 1-2.11 3.17v2.6h3.41C20.95 17.66 22 15.14 22 12.24Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M12 22c2.88 0 5.3-.94 7.03-2.55l-3.41-2.61a6.12 6.12 0 0 1-9.19-3.19H2.9v2.7A10 10 0 0 0 12 22Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M6.43 13.65a6.06 6.06 0 0 1 0-3.3V7.65H2.9a10 10 0 0 0 0 8.7l3.53-2.7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M12 5.95a5.47 5.47 0 0 1 3.84 1.48l2.85-2.8A9.7 9.7 0 0 0 12 2 10 10 0 0 0 2.9 7.65l3.53 2.7A6.06 6.06 0 0 1 12 5.95Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
    solid: `
      <path d="M22 12.24c0-.72-.06-1.25-.19-1.8H12v3.24h5.72a4.8 4.8 0 0 1-2.11 3.17v2.6h3.41C20.95 17.66 22 15.14 22 12.24Z" fill="currentColor"/>
      <path d="M12 22c2.88 0 5.3-.94 7.03-2.55l-3.41-2.61a6.12 6.12 0 0 1-9.19-3.19H2.9v2.7A10 10 0 0 0 12 22Z" fill="currentColor"/>
      <path d="M6.43 13.65a6.06 6.06 0 0 1 0-3.3V7.65H2.9a10 10 0 0 0 0 8.7l3.53-2.7Z" fill="currentColor"/>
      <path d="M12 5.95a5.47 5.47 0 0 1 3.84 1.48l2.85-2.8A9.7 9.7 0 0 0 12 2 10 10 0 0 0 2.9 7.65l3.53 2.7A6.06 6.06 0 0 1 12 5.95Z" fill="currentColor"/>`,
  },

  'logo-apple': {
    outline: `
      <path d="M16.36 6.5A4.6 4.6 0 0 0 20 4.39a4.6 4.6 0 0 0-3.04 1.61A4.3 4.3 0 0 0 15.9 9c1.24.04 2.5-.63 2.5-1.24-.01-.42-.88-.99-2.04-1.26Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M20 17.12c-.7 1.08-1.43 2.16-2.58 2.18-1.13.02-1.5-.67-2.79-.67-1.3 0-1.71.65-2.79.69-1.11.04-1.96-1.14-2.67-2.2C7.53 14.7 6.87 11.25 8.1 9.02c.61-1.1 1.71-1.8 2.9-1.82 1.14-.02 2.22.76 2.91.76.7 0 2-.94 3.37-.8.57.02 2.18.23 3.21 1.73-.08.05-1.92 1.12-1.9 3.34.02 2.65 2.32 3.53 2.35 3.54-.03.07-.37 1.25-1.94 2.35Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
    solid: `
      <path d="M16.36 6.5A4.6 4.6 0 0 0 20 4.39a4.6 4.6 0 0 0-3.04 1.61A4.3 4.3 0 0 0 15.9 9c1.24.04 2.5-.63 2.5-1.24-.01-.42-.88-.99-2.04-1.26Z" fill="currentColor"/>
      <path d="M20 17.12c-.7 1.08-1.43 2.16-2.58 2.18-1.13.02-1.5-.67-2.79-.67-1.3 0-1.71.65-2.79.69-1.11.04-1.96-1.14-2.67-2.2C7.53 14.7 6.87 11.25 8.1 9.02c.61-1.1 1.71-1.8 2.9-1.82 1.14-.02 2.22.76 2.91.76.7 0 2-.94 3.37-.8.57.02 2.18.23 3.21 1.73-.08.05-1.92 1.12-1.9 3.34.02 2.65 2.32 3.53 2.35 3.54-.03.07-.37 1.25-1.94 2.35Z" fill="currentColor"/>`,
  },

  'logo-facebook': {
    outline: `
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
    solid: `
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2Z" fill="currentColor"/>`,
  },

  'logo-instagram': {
    outline: `
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>`,
    solid: `
      <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor"/>
      <circle cx="12" cy="12" r="4" stroke="white" stroke-width="2"/>
      <circle cx="17.5" cy="6.5" r="1.25" fill="white"/>`,
  },

  'logo-linkedin': {
    outline: `
      <rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" stroke-width="1.5"/>
      <path d="M8 11v6M8 8v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M12 17v-3a2 2 0 0 1 4 0v3M12 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    solid: `
      <rect x="2" y="2" width="20" height="20" rx="3" fill="currentColor"/>
      <path d="M8 11v6M8 8v.5M12 17v-3a2 2 0 0 1 4 0v3M12 11v6" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
  },

  'logo-x': {
    outline: `
      <path d="M4 4l7 7M4 20l16-16M13 13l7 7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>`,
    solid: `
      <path d="M4 4l7 7M4 20l16-16M13 13l7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  },

  'logo-youtube': {
    outline: `
      <path d="M22 7.4S21.76 5.67 21 4.9c-.77-.8-1.63-.81-2.03-.86C16.24 3.88 12 3.88 12 3.88s-4.24 0-6.97.16c-.4.05-1.26.06-2.03.86C2.24 5.67 2 7.4 2 7.4S1.76 9.4 1.76 11.4v1.86c0 2 .24 3.98.24 3.98s.24 1.73 1 2.5c.77.8 1.78.77 2.23.85C6.76 20.73 12 20.76 12 20.76s4.24 0 6.97-.19c.4-.05 1.26-.06 2.03-.86.76-.77 1-2.5 1-2.5s.24-1.98.24-3.98V11.4c0-2-.24-3.98-.24-3.98Z" stroke="currentColor" stroke-width="1.5"/>
      <path d="M10 15V9l6 3-6 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
    solid: `
      <path d="M22 7.4S21.76 5.67 21 4.9c-.77-.8-1.63-.81-2.03-.86C16.24 3.88 12 3.88 12 3.88s-4.24 0-6.97.16c-.4.05-1.26.06-2.03.86C2.24 5.67 2 7.4 2 7.4S1.76 9.4 1.76 11.4v1.86c0 2 .24 3.98.24 3.98s.24 1.73 1 2.5c.77.8 1.78.77 2.23.85C6.76 20.73 12 20.76 12 20.76s4.24 0 6.97-.19c.4-.05 1.26-.06 2.03-.86.76-.77 1-2.5 1-2.5s.24-1.98.24-3.98V11.4c0-2-.24-3.98-.24-3.98Z" fill="currentColor"/>
      <path d="M10 15V9l6 3-6 3Z" fill="white"/>`,
  },

  // ── Business & Utility ────────────────────────────────────────────────────

  'piggy-bank': {
    outline: `
      <path d="M19.43 9.5A8 8 0 1 0 8.29 18.76L8 21h8l-.3-2.24A8 8 0 0 0 19.43 9.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M21 9.5h-1.57M12 8v1M9.5 12h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    solid: `
      <path d="M19.43 9.5A8 8 0 1 0 8.29 18.76L8 21h8l-.3-2.24A8 8 0 0 0 19.43 9.5Z" fill="currentColor"/>
      <path d="M21 9.5h-1.57M12 8v1M9.5 12h5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>`,
  },

  'speed': {
    outline: `
      <path d="M12 4a9 9 0 1 0 9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M20 4l-8 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="12" cy="13" r="1.5" fill="currentColor"/>`,
    solid: `
      <path d="M12 4a9 9 0 1 0 9 9H12V4Z" fill="currentColor"/>
      <path d="M12 4v9l8-9" fill="currentColor"/>
      <circle cx="12" cy="13" r="1.5" fill="white"/>`,
  },

  'megaphone': {
    outline: `
      <path d="M3 10v4h3l6 5V5L6 10H3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M19 8.5a5 5 0 0 1 0 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M6 14l1.5 5H9l-1-5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
    solid: `
      <path d="M3 10v4h3l6 5V5L6 10H3Z" fill="currentColor"/>
      <path d="M19 8.5a5 5 0 0 1 0 7M6 14l1.5 5H9l-1-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },

  'star-half': {
    outline: `
      <path d="M12 2v15.27L6.18 20.5l1.36-6.54L2.5 9.76l6.61-.56L12 3.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M12 2l2.89 7.2 6.61.56-5.04 4.2 1.36 6.54L12 17.27" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
    solid: `
      <path d="M12 2v15.27L6.18 20.5l1.36-6.54L2.5 9.76l6.61-.56L12 3.5" fill="currentColor"/>
      <path d="M12 2l2.89 7.2 6.61.56-5.04 4.2 1.36 6.54L12 17.27" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>`,
  },

  'carbon-dioxide': {
    outline: `
      <path d="M6.5 10A3.5 3.5 0 0 0 3 13.5V15a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-.5a3.5 3.5 0 0 0-5.5-2.88" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M12 10V6M10 6a2 2 0 0 1 4 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
    solid: `
      <path d="M6.5 10A3.5 3.5 0 0 0 3 13.5V15a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-.5a3.5 3.5 0 0 0-5.5-2.88L16 10H8l.5 2.12A3.49 3.49 0 0 0 6.5 10Z" fill="currentColor"/>
      <path d="M12 10V6M10 6a2 2 0 0 1 4 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>`,
  },
}

// Helper — all custom icon names
export const customIconNames = Object.keys(customIcons)
