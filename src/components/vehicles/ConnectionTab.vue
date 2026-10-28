<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ConnectionStatus, Vehicle, VehicleEdit } from '~/stores/vehicles'
import { COMPATIBLE_FROM_YEAR } from '~/stores/vehicles'
import type { DropdownItem } from '~/components/ui/DropdownMenu.vue'
import type { MatchGroup } from '~/components/vehicles/VehicleMatchModal.vue'
import type { ConnectResult } from '~/components/vehicles/VehicleConnectResultModal.vue'

// "Données" tab of the vehicle detail page: connection status and flows
// (Figma connexion-par-le-conducteur / -par-le-gestionnaire / cas-d-erreur / compatibilite).
// draft: the vehicle with the page's unsaved edits, shown in the details form
const { vehicle, draft } = defineProps<{ vehicle: Vehicle; draft: Vehicle }>()
const emit = defineEmits<{ toast: [title: string, description: string]; edit: [patch: Partial<VehicleEdit>]; changeModel: []; removeModel: []; goTab: [tab: string] }>()

const vehiclesStore = useVehiclesStore()

type AlertType = 'brand' | 'neutral' | 'danger' | 'warning' | 'success'
type Option = 'invite' | 'self'

const DISCONNECTED_AFTER_DAYS = 30
const SUBTITLES = {
  connect: 'Connectez ce véhicule pour que le kilométrage et les recharges remontent automatiquement.',
  reconnect: 'Reconnectez ce véhicule pour que le kilométrage et les recharges remontent à nouveau automatiquement.',
  linked: 'Le kilométrage et les recharges remontent automatiquement.',
  compatibility: 'Le kilométrage et les recharges peuvent remonter automatiquement si le véhicule est compatible.',
}

const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const driverFirstName = computed<string | null>(() => vehicle.driver?.split(' ')[0] ?? null)
const isCompatible = computed<boolean>(() => vehicle.compatibility === 'COMPATIBLE')
const status = computed<ConnectionStatus>(() => vehicle.connectionStatus)
const isLinked = computed<boolean>(() => status.value === 'IN_PROGRESS' || status.value === 'CONNECTED')
// Action required on a driver's vehicle: the driver is re-invited, nothing for the manager to choose
const waitsForDriver = computed<boolean>(() => status.value === 'ACTION_REQUIRED' && !!vehicle.driver)

// ─── "À associer": pick this vehicle's VIN among the ones left on its account ─
const pendingGroup = computed(() => vehiclesStore.pendingMatches.find(g => g.candidateIds.includes(vehicle.id)) ?? null)
const vinItems = computed<DropdownItem[]>(() => (pendingGroup.value?.vins ?? []).map(v => ({ value: v, label: v })))
const vinToMatch = ref('')
watch(() => vehicle.id, () => { vinToMatch.value = '' })
const matchThisVehicle = () => {
  const linkedIds = vehiclesStore.resolveMatches([{ vehicleId: vehicle.id, vin: vinToMatch.value }])
  vinToMatch.value = ''
  const others = linkedIds.length - 1
  emit('toast', 'Véhicule associé', others
    ? `Le dernier véhicule du groupe a aussi été associé. ${linkedIds.length} véhicules en attente de leurs premières données.`
    : 'Le véhicule est en attente de ses premières données.')
}

// Header subtitle + alert per state (texts from Figma)
const view = computed<{ subtitle: string; alert: { type: AlertType; title: string; description?: string } }>(() => {
  if (vehicle.compatibility === 'UNKNOWN') {
    return { subtitle: SUBTITLES.compatibility, alert: { type: 'neutral', title: 'Compatibilité inconnue', description: 'Nous vous invitons à renseigner le modèle de ce véhicule ci-dessous pour connaître sa compatibilité.' } }
  }
  // Compatible model, but too old (e.g. year read from the manufacturer account)
  const fromYear = COMPATIBLE_FROM_YEAR[`${vehicle.brand} ${vehicle.model}`]
  if (vehicle.compatibility === 'NOT_COMPATIBLE' && fromYear) {
    return { subtitle: SUBTITLES.compatibility, alert: { type: 'neutral', title: 'Ce véhicule n’est pas compatible', description: `Il date de ${vehicle.year} : la ${vehicle.model} n’est compatible avec la connexion en direct qu’à partir de ${fromYear}.` } }
  }
  if (vehicle.compatibility === 'NOT_COMPATIBLE') {
    // The model itself can't be connected (vs. a compatible model that is too old, above)
    return { subtitle: SUBTITLES.compatibility, alert: { type: 'neutral', title: 'Ce modèle n’est pas compatible', description: 'La connexion en direct n’est pas disponible pour ce modèle : le kilométrage et les recharges ne peuvent pas remonter automatiquement.' } }
  }
  const name = driverFirstName.value
  switch (status.value) {
    case 'REQUESTED':
      return { subtitle: SUBTITLES.connect, alert: { type: 'brand', title: `Connexion demandée. ${name ?? 'Le conducteur'} a reçu une invitation pour connecter ce véhicule.` } }
    case 'IN_PROGRESS':
      return { subtitle: SUBTITLES.linked, alert: { type: 'brand', title: 'En attente de la réception des premières données.' } }
    case 'CONNECTED':
      return { subtitle: SUBTITLES.linked, alert: { type: 'success', title: `Véhicule connecté. Données reçues pour la dernière fois le ${today}.` } }
    case 'ACTION_REQUIRED':
      // With a driver, he is invited automatically to reconnect (Figma erreur-1-action-requise)
      return waitsForDriver.value
        ? { subtitle: SUBTITLES.reconnect, alert: { type: 'warning', title: `Action requise par ${name}`, description: 'La connexion avec ce véhicule a été suspendue : nous avons invité le conducteur à établir une nouvelle connexion.' } }
        : { subtitle: SUBTITLES.reconnect, alert: { type: 'warning', title: 'L’autorisation de partage a expiré', description: 'Reconnectez le véhicule ci-dessous.' } }
    case 'FAILED':
      return { subtitle: SUBTITLES.connect, alert: { type: 'danger', title: 'La connexion n’a pas abouti', description: 'Réessayez en choisissant ci-dessous qui connecte le véhicule. Si le problème persiste, contactez notre support.' } }
    case 'DISCONNECTED':
      return { subtitle: SUBTITLES.reconnect, alert: { type: 'warning', title: 'Ce véhicule a été déconnecté', description: `Il n’a transmis aucune donnée pendant plus de ${DISCONNECTED_AFTER_DAYS} jours. Reconnectez-le pour que les données remontent à nouveau.` } }
    case 'TO_MATCH':
      return { subtitle: SUBTITLES.connect, alert: { type: 'warning', title: 'Véhicule à associer', description: `Il a été trouvé sur le compte ${vehicle.brand}, avec d’autres du même modèle et de la même année : choisissez son VIN pour terminer la connexion.` } }
    default:
      // Not connected yet: without the year, compatibility can't be guaranteed (not blocking)
      return vehicle.year
        ? { subtitle: SUBTITLES.connect, alert: { type: 'brand', title: 'Le modèle et l’année de ce véhicule sont compatibles avec la connexion en direct', description: 'Activez-la dès maintenant.' } }
        : { subtitle: SUBTITLES.connect, alert: { type: 'neutral', title: 'L’année de ce véhicule n’est pas renseignée', description: `Nous ne pouvons pas garantir sa compatibilité : elle sera vérifiée lors de la connexion, où vous pourrez aussi choisir vos autres véhicules ${vehicle.brand}.` } }
  }
})

// ─── Connection options (not connected, invitation sent, error states) ───────
const option = ref<Option>(vehicle.driver ? 'invite' : 'self')
// "Also the other drivers" checkbox: inviting stays opt-in
const alsoInvite = ref(false)
watch(() => vehicle.id, () => { option.value = vehicle.driver ? 'invite' : 'self' })

// Options framed by who holds the manufacturer account (Figma connexion-1-*):
// a single title each, then 2 steps once selected.
// "connecter" / "reconnecter" / "réessayer" depends on the state.
const optionTitles = computed<Record<Option, string>>(() => {
  const name = driverFirstName.value
  if (status.value === 'FAILED') return { invite: `Inviter ${name} à réessayer la connexion`, self: 'Je réessaie moi-même avec le compte constructeur' }
  if (status.value === 'ACTION_REQUIRED' || status.value === 'DISCONNECTED') return { invite: `Inviter ${name} à reconnecter ce véhicule`, self: 'Je reconnecte moi-même avec le compte constructeur' }
  return { invite: `Inviter ${name} à connecter ce véhicule`, self: 'Je connecte moi-même avec le compte constructeur' }
})
const inviteSteps = computed<string[]>(() => [
  `${driverFirstName.value} reçoit **un lien** par e-mail et dans l’app Chargemap.`,
  'Il se connecte à **son compte constructeur**. Les données remontent ensuite automatiquement.',
])
const selfSteps = computed<string[]>(() => [
  'Connectez-vous au **compte constructeur** dans la fenêtre sécurisée.',
  `**Choisissez les véhicules ${vehicle.brand}** du compte à partager et autorisez le partage.`,
])
// Bringing the other vehicles along (invite checkbox, vehicles picked in the
// manufacturer window) only applies to a first connection
const showAlsoOthers = computed<boolean>(() => status.value === 'NOT_CONNECTED' || status.value === 'REQUESTED')

// Other vehicles the checkbox applies to
const otherDriversToInvite = computed<Vehicle[]>(() =>
  vehiclesStore.vehicles.filter(v => v.id !== vehicle.id && v.compatibility === 'COMPATIBLE' && v.connectionStatus === 'NOT_CONNECTED' && v.driver),
)
const otherSameBrand = computed<Vehicle[]>(() =>
  vehiclesStore.vehicles.filter(v => v.id !== vehicle.id && v.brand === vehicle.brand && v.compatibility === 'COMPATIBLE' && v.connectionStatus === 'NOT_CONNECTED'),
)
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

const sendInvitation = () => {
  const others = showAlsoOthers.value && alsoInvite.value ? otherDriversToInvite.value : []
  const ids = [vehicle.id, ...others.map(v => v.id)]
  vehiclesStore.sendInvitation(ids)
  alsoInvite.value = false
  if (!others.length) return emit('toast', 'Invitation envoyée', `${driverFirstName.value} a reçu un lien par e-mail et dans l’app Chargemap.`)
  // Several drivers invited: same recap modal as a multi-vehicle connection
  connectResult.value = { kind: 'invite', vehicles: ids.map(id => vehiclesStore.byId(id)).filter((v): v is Vehicle => !!v), autoCount: 0, manualCount: 0, remainingCount: 0 }
  isResultOpen.value = true
}
const resendInvitation = () => emit('toast', 'Invitation relancée', `${driverFirstName.value} a reçu un nouveau lien de connexion.`)

// Several vehicles linked at once: recap modal instead of a toast
const isResultOpen = ref(false)
const connectResult = ref<ConnectResult>({ kind: 'connect', vehicles: [], autoCount: 0, manualCount: 0, remainingCount: 0 })

// Selected vehicles whose year (read from the account) isn't compatible: not linked
const incompatible = ref<Vehicle[]>([])

// Linked vehicles get the VIN returned by the manufacturer account
const finishSelfConnection = (ids: string[], manualCount = 0, remainingCount = 0) => {
  const linked = ids.filter(id => !incompatible.value.some(v => v.id === id))
  linked.forEach((id) => {
    const v = vehiclesStore.byId(id)
    if (v && !v.vin) vehiclesStore.updateInfo(id, { vin: fakeVin(v) })
  })
  vehiclesStore.connectSelf(linked)
  if (linked.length === 1 && !incompatible.value.length) return emit('toast', 'Partage autorisé', 'Le véhicule est en attente de ses premières données.')
  if (!linked.length && incompatible.value.length === 1) {
    return emit('toast', 'Véhicule non compatible', `D’après le compte constructeur, il date de ${vehicle.year} : ce modèle n’est pas compatible avec la connexion en direct.`)
  }
  connectResult.value = {
    kind: 'connect',
    vehicles: linked.map(id => vehiclesStore.byId(id)).filter((v): v is Vehicle => !!v),
    incompatible: incompatible.value,
    autoCount: linked.length - manualCount,
    manualCount,
    remainingCount,
  }
  isResultOpen.value = true
}

// ─── Matching the manufacturer account's vehicles (VIN) with the fleet ───────
// Prototype: the account returns one VIN per selected vehicle. Business can only
// match a VIN on its own when the vehicle is the only one of its model + year
// without a VIN; otherwise the manager resolves it in the match modal.
// Plausible Renault-like VIN (17 chars), unrelated to the plate so the demo isn't guessable
const fakeVin = (v: Vehicle) => `VF1RFB00${String(Number(v.id.slice(2)) * 7919 + 104729).padStart(9, '0')}`
const isMatchOpen = ref(false)
const autoMatched = ref<Vehicle[]>([])
const matchGroups = ref<MatchGroup[]>([])

const connectSelf = () => {
  // Prototype: in the manufacturer window (Smartcar), the manager ticked every compatible
  // vehicle of the brand, so they all come back with this one
  const selected = showAlsoOthers.value ? otherSameBrand.value : []
  // Back from the account: the year of each vehicle is known, some may turn out not compatible
  const incompatibleIds = vehiclesStore.applyAccountYears([vehicle.id, ...selected.map(v => v.id)])
  incompatible.value = incompatibleIds.map(id => vehiclesStore.byId(id)).filter((v): v is Vehicle => !!v)
  const others = selected.filter(v => !incompatibleIds.includes(v.id))
  const byModelYear = new Map<string, Vehicle[]>()
  others.filter(v => !v.vin).forEach(v => {
    const key = `${v.model}|${v.year}`
    byModelYear.set(key, [...(byModelYear.get(key) ?? []), v])
  })
  const ambiguous = [...byModelYear.values()].filter(list => list.length > 1)
  if (!ambiguous.length) return finishSelfConnection([vehicle.id, ...others.map(v => v.id)])

  const ambiguousIds = ambiguous.flat().map(v => v.id)
  autoMatched.value = others.filter(v => !ambiguousIds.includes(v.id))
  matchGroups.value = ambiguous.map(list => ({
    label: `${list[0].brand} ${list[0].model}${list[0].year ? ` · ${list[0].year}` : ''}`,
    vins: list.map(fakeVin),
    candidates: list,
  }))
  isMatchOpen.value = true
}
const confirmMatch = (matches: { vehicleId: string; vin: string }[]) => {
  matches.forEach(m => vehiclesStore.updateInfo(m.vehicleId, { vin: m.vin }))
  isMatchOpen.value = false
  finishSelfConnection([vehicle.id, ...autoMatched.value.map(v => v.id), ...matches.map(m => m.vehicleId)], matches.length)
}
// The rest of the account is linked; unmatched vehicles wait in "À associer"
// (listing banner, vehicle page) with the VINs returned by the account
const matchLater = () => {
  isMatchOpen.value = false
  const remaining = matchGroups.value.reduce((n, g) => n + g.vins.length, 0)
  vehiclesStore.addPendingMatches(matchGroups.value.map((g, i) => ({
    id: `pm-${Date.now()}-${i}`,
    brand: g.candidates[0].brand ?? '',
    label: g.label,
    vins: g.vins,
    candidateIds: g.candidates.map(c => c.id),
  })))
  finishSelfConnection([vehicle.id, ...autoMatched.value.map(v => v.id)], 0, remaining)
}

// ─── Disconnection ───────────────────────────────────────────────────────────
const isDisconnectOpen = ref(false)
const connectedByLabel = computed<string>(() => (vehicle.connectedBy === 'vous' ? 'vous' : vehicle.connectedBy ?? ''))
const confirmDisconnect = () => {
  vehiclesStore.disconnect(vehicle.id)
  isDisconnectOpen.value = false
  emit('toast', 'Véhicule déconnecté', 'Les données ne remonteront plus. L’historique est conservé.')
}

const cardClass = 'w-full bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm'
const footerTextClass = 'font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary'
const DATA_ROWS = [
  { tab: 'kilometrage', title: 'Kilométrage', subtitle: 'Relevé automatiquement par le véhicule' },
  { tab: 'recharges', title: 'Recharges', subtitle: 'Relevées automatiquement par le véhicule' },
]
</script>

<template>
  <section class="flex flex-col gap-[16px]">
    <div class="flex flex-col gap-[2px]">
      <h2 class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">Connexion du véhicule</h2>
      <p class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral-secondary">{{ view.subtitle }}</p>
    </div>

    <!-- Status card -->
    <div :class="cardClass">
      <div class="p-[16px] flex flex-col gap-[16px]">
        <Alert
          :key="`${vehicle.compatibility}-${status}`"
          :type="view.alert.type"
          :title="view.alert.title"
          :description="view.alert.description ?? ''"
          :leading-text-only="!view.alert.description"
          :dismissable="false"
          primary-action-label=""
          secondary-action-label=""
        />

        <div v-if="vehicle.compatibility === 'UNKNOWN'" class="flex items-center justify-between gap-[16px]">
          <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Statut</span>
          <ConnectionBadge status="UNKNOWN" />
        </div>
        <VehicleCard v-else :vehicle="vehicle">
          <!-- À associer: pick the VIN right in the card (same layout as the match popup) -->
          <div v-if="status === 'TO_MATCH'" class="flex items-center gap-[12px]">
            <div class="w-[220px]">
              <Dropdown
                v-model="vinToMatch"
                :items="vinItems"
                size="sm"
                :show-label="false"
                :show-hint="false"
                :searchable="false"
                placeholder="VIN"
              />
            </div>
            <Button type="primary" size="sm" label="Associer" :disabled="!vinToMatch" @click="matchThisVehicle" />
          </div>
          <ConnectionBadge v-else :status="isCompatible ? status : vehicle.compatibility" size="md" />
        </VehicleCard>
      </div>
    </div>

    <!-- Waiting for the first event: who connected + disconnect, in its own card (Figma connexion-3-en-attente) -->
    <div v-if="isCompatible && status === 'IN_PROGRESS'" :class="[cardClass, 'flex items-center justify-between gap-[16px] px-[16px] py-[16px]']">
      <span :class="footerTextClass">Véhicule connecté le {{ vehicle.connectedAt }} par {{ connectedByLabel }}</span>
      <Button type="secondary" destructive size="sm" label="Déconnecter" @click="isDisconnectOpen = true" />
    </div>

    <!-- Unknown compatibility (no model, or missing year): complete the vehicle details right here (Figma compatibilite-1-inconnue) -->
    <VehicleInfoForm
      v-if="vehicle.compatibility === 'UNKNOWN'"
      :vehicle="draft"
      @edit="(p) => emit('edit', p)"
      @change-model="emit('changeModel')"
      @remove-model="emit('removeModel')"
    />

    <template v-else-if="isCompatible">
      <!-- Connected: shared data + disconnect -->
      <div v-if="status === 'CONNECTED'" :class="[cardClass, 'overflow-hidden']">
        <button
          v-for="row in DATA_ROWS"
          :key="row.tab"
          type="button"
          class="flex items-center justify-between gap-[16px] w-full px-[16px] py-[12px] border-b border-border-neutral-secondary text-left outline-none transition-colors duration-150 ease-out hover:bg-neutral-secondary focus-visible:bg-neutral-secondary"
          @click="emit('goTab', row.tab)"
        >
          <span class="flex flex-col">
            <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral">{{ row.title }}</span>
            <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">{{ row.subtitle }}</span>
          </span>
          <Icon name="chevron-right" :size="20" class="shrink-0 text-icon-neutral-secondary" />
        </button>
        <div class="flex items-center justify-between gap-[16px] px-[16px] py-[16px]">
          <span :class="footerTextClass">Véhicule connecté le {{ vehicle.connectedAt }} par {{ connectedByLabel }}</span>
          <Button type="secondary" destructive size="sm" label="Déconnecter" @click="isDisconnectOpen = true" />
        </div>
      </div>

      <!-- Not linked: invite the driver or connect myself -->
      <!-- À associer: handled in the vehicle card above -->
      <template v-else-if="status === 'TO_MATCH'" />

      <template v-else-if="!isLinked && !waitsForDriver">
        <ConnectOptionCard
          v-if="vehicle.driver"
          :title="optionTitles.invite"
          :selected="option === 'invite'"
          :steps="inviteSteps"
          @select="option = 'invite'"
        >
          <template #footer>
            <template v-if="status === 'REQUESTED'">
              <span class="font-sans font-normal text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">Demande de connexion envoyée</span>
              <Button type="secondary" size="sm" label="Relancer l’invitation" @click="resendInvitation" />
            </template>
            <template v-else>
              <VehicleCheckbox
                v-if="showAlsoOthers && otherDriversToInvite.length"
                v-model="alsoInvite"
                label="Inviter aussi les conducteurs des autres véhicules compatibles"
              />
              <span v-else />
              <Button type="primary" size="sm" label="Envoyer l’invitation" class="shrink-0" @click="sendInvitation" />
            </template>
          </template>
        </ConnectOptionCard>

        <ConnectOptionCard
          :title="optionTitles.self"
          :selected="option === 'self'"
          :steps="selfSteps"
          :single="!vehicle.driver"
          @select="option = 'self'"
        >
          <template #footer>
            <span />
            <Button type="primary" size="sm" label="Connecter le véhicule" class="shrink-0" @click="connectSelf" />
          </template>
        </ConnectOptionCard>
      </template>
    </template>

    <!-- Account vehicles that couldn't be matched to the fleet automatically -->
    <VehicleMatchModal
      :open="isMatchOpen"
      :groups="matchGroups"
      @close="isMatchOpen = false"
      @later="matchLater"
      @confirm="confirmMatch"
    />

    <!-- Recap after linking several vehicles of the account -->
    <VehicleConnectResultModal
      :open="isResultOpen"
      :brand="vehicle.brand ?? ''"
      :result="connectResult"
      @close="isResultOpen = false"
    />

    <!-- Disconnection confirmation (Figma connexion-5-confirmation-de-deconnexion) -->
    <VehicleModal
      :open="isDisconnectOpen"
      title="Déconnecter le véhicule ?"
      :subtitle="`${vehicle.brand} ${vehicle.model} · connecté par ${connectedByLabel}`"
      @close="isDisconnectOpen = false"
    >
      <div class="flex flex-col gap-[32px]">
        <div class="flex flex-col gap-[4px]">
          <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">Les données ne remonteront plus</p>
          <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Les données transmises ne seront plus mises à jour automatiquement.</p>
        </div>
        <div class="flex flex-col gap-[4px]">
          <p class="font-sans font-medium text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">L’historique est conservé</p>
          <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">Les données reçues restent visibles. Reconnexion possible à tout moment.</p>
        </div>
      </div>
      <template #footer>
        <Button type="secondary" size="sm" label="Annuler" @click="isDisconnectOpen = false" />
        <Button type="destructive" size="sm" label="Déconnecter" @click="confirmDisconnect" />
      </template>
    </VehicleModal>
  </section>
</template>
