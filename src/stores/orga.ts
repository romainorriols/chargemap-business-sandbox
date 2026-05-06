// Organisation-level info — bound from the Settings page (Informations card)
// and read by the Sidebar header so edits flow back to the nav immediately.
export const useOrgaStore = defineStore('orga', () => {
  const raisonSociale = ref('Brakson')
  const adresse = ref('7 Allée Ceres')
  const codePostal = ref('67000')
  const ville = ref('Strasbourg')
  const pays = ref('FR')
  return { raisonSociale, adresse, codePostal, ville, pays }
})
