import { reactive } from 'vue'

// Shared organisation state — the sidebar header and the Settings page both
// bind to this so edits made in Settings flow back to the sidebar immediately.
export const orga = reactive({
  raisonSociale: 'Brakson',
  adresse: '7 Allée Ceres',
  codePostal: '67000',
  ville: 'Strasbourg',
  pays: 'FR',
})
