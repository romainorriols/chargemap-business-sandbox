<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ConnectionStatus, Vehicle } from '~/stores/vehicles'

// "Données" tab of the vehicle detail page: connection status and flows
// (Figma connexion-par-le-conducteur / -par-le-gestionnaire / cas-d-erreur / compatibilite).
const { vehicle } = defineProps<{ vehicle: Vehicle }>()
const emit = defineEmits<{ toast: [title: string, description: string]; changeModel: []; goTab: [tab: string] }>()

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

// Header subtitle + alert per state (texts from Figma)
const view = computed<{ subtitle: string; alert: { type: AlertType; title: string; description?: string } }>(() => {
  if (vehicle.compatibility === 'UNKNOWN') {
    return { subtitle: SUBTITLES.compatibility, alert: { type: 'neutral', title: 'Compatibilité inconnue', description: 'Nous vous invitons à renseigner le modèle de ce véhicule ci-dessous pour connaître sa compatibilité.' } }
  }
  if (vehicle.compatibility === 'NOT_COMPATIBLE') {
    return { subtitle: SUBTITLES.compatibility, alert: { type: 'neutral', title: 'Ce véhicule n’est pas compatible', description: 'Malheureusement, ce modèle ne permet pas de faire remonter automatiquement le kilométrage et les recharges.' } }
  }
  const name = driverFirstName.value
  switch (status.value) {
    case 'REQUESTED':
      return { subtitle: SUBTITLES.connect, alert: { type: 'brand', title: `Connexion demandée. ${name ?? 'Le conducteur'} a reçu une invitation pour connecter ce véhicule.` } }
    case 'IN_PROGRESS':
      return { subtitle: SUBTITLES.linked, alert: { type: 'brand', title: 'Liaison en cours de validation, cela peut prendre jusqu’à 30 min.' } }
    case 'CONNECTED':
      return { subtitle: SUBTITLES.linked, alert: { type: 'success', title: `Véhicule connecté. Données reçues pour la dernière fois le ${today}.` } }
    case 'ACTION_REQUIRED':
      return { subtitle: SUBTITLES.reconnect, alert: { type: 'warning', title: 'L’autorisation de partage a expiré', description: 'Choisissez ci-dessous qui reconnecte le véhicule.' } }
    case 'FAILED':
      return { subtitle: SUBTITLES.connect, alert: { type: 'danger', title: 'La connexion n’a pas abouti', description: 'Réessayez en choisissant ci-dessous qui connecte le véhicule. Si le problème persiste, contactez notre support.' } }
    case 'DISCONNECTED':
      return { subtitle: SUBTITLES.reconnect, alert: { type: 'warning', title: 'Ce véhicule a été déconnecté', description: `Il n’a transmis aucune donnée pendant plus de ${DISCONNECTED_AFTER_DAYS} jours. Reconnectez-le pour que les données remontent à nouveau.` } }
    default:
      return {
        subtitle: SUBTITLES.connect,
        alert: { type: 'neutral', title: name ? 'Véhicule non connecté. Choisissez qui le connecte : son conducteur ou vous.' : 'Véhicule non connecté. Aucun conducteur n’est rattaché : vous pouvez le connecter vous-même.' },
      }
  }
})

// ─── Connection options (not connected, invitation sent, error states) ───────
const option = ref<Option>(vehicle.driver ? 'invite' : 'self')
const alsoOthers = ref(false)
watch(() => vehicle.id, () => { option.value = vehicle.driver ? 'invite' : 'self' })

// "connecter" / "reconnecter" / "réessayer" wording depending on the state
const optionTitles = computed<Record<Option, string>>(() => {
  const name = driverFirstName.value
  if (status.value === 'FAILED') return { invite: `Inviter ${name} à réessayer la connexion`, self: 'Réessayer moi-même la connexion' }
  if (status.value === 'ACTION_REQUIRED' || status.value === 'DISCONNECTED') return { invite: `Inviter ${name} à reconnecter ce véhicule`, self: 'Reconnecter moi-même ce véhicule' }
  return { invite: `Inviter ${name} à connecter ce véhicule`, self: 'Connecter moi-même ce véhicule' }
})
const inviteSteps = computed<string[]>(() => [
  `${driverFirstName.value} reçoit **un lien** par e-mail et dans l’app Chargemap.`,
  'Il se connecte avec les **identifiants de son compte constructeur**.',
  '**Les données remontent** automatiquement. Vous suivez le statut ici.',
])
const SELF_STEPS = [
  'Cliquez sur **Connecter le véhicule** : une fenêtre de connexion sécurisée s’ouvre.',
  'Connectez-vous avec les **identifiants du compte constructeur** du véhicule.',
  '**Autorisez le partage**. Les données remontent ensuite automatiquement.',
]
// The "also the others" checkbox only makes sense for a first connection
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
  const others = showAlsoOthers.value && alsoOthers.value ? otherDriversToInvite.value : []
  vehiclesStore.sendInvitation([vehicle.id, ...others.map(v => v.id)])
  emit('toast', 'Invitation envoyée', others.length
    ? `${driverFirstName.value} et ${plural(others.length, 'autre conducteur')} ont reçu un lien de connexion.`
    : `${driverFirstName.value} a reçu un lien par e-mail et dans l’app Chargemap.`)
  alsoOthers.value = false
}
const resendInvitation = () => emit('toast', 'Invitation relancée', `${driverFirstName.value} a reçu un nouveau lien de connexion.`)

const connectSelf = () => {
  const others = showAlsoOthers.value && alsoOthers.value ? otherSameBrand.value : []
  vehiclesStore.connectSelf([vehicle.id, ...others.map(v => v.id)])
  alsoOthers.value = false
  emit('toast', 'Partage autorisé', others.length
    ? `${plural(others.length + 1, 'véhicule')} en cours de liaison, cela peut prendre jusqu’à 30 min.`
    : 'Liaison en cours de validation, cela peut prendre jusqu’à 30 min.')
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
          <ConnectionBadge :status="isCompatible ? status : vehicle.compatibility" size="md" />
        </VehicleCard>
      </div>
    </div>

    <!-- Waiting for the first event: who connected + disconnect, in its own card (Figma connexion-3-en-attente) -->
    <div v-if="isCompatible && status === 'IN_PROGRESS'" :class="[cardClass, 'flex items-center justify-between gap-[16px] px-[16px] py-[16px]']">
      <span :class="footerTextClass">Véhicule connecté le {{ vehicle.connectedAt }} par {{ connectedByLabel }}</span>
      <Button type="secondary" destructive size="sm" label="Déconnecter" @click="isDisconnectOpen = true" />
    </div>

    <!-- Unknown compatibility: fill in the model -->
    <div v-if="vehicle.compatibility === 'UNKNOWN'" :class="[cardClass, 'p-[16px]']">
      <VehicleCard :vehicle="vehicle">
        <Button type="tertiaryGray" size="sm" label="Renseigner" @click="emit('changeModel')" />
      </VehicleCard>
    </div>

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
      <template v-else-if="!isLinked">
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
                v-if="showAlsoOthers"
                v-model="alsoOthers"
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
          :steps="SELF_STEPS"
          @select="option = 'self'"
        >
          <template #footer>
            <VehicleCheckbox
              v-if="showAlsoOthers"
              v-model="alsoOthers"
              label="Connecter aussi les autres véhicules compatibles de ce constructeur"
            />
            <span v-else />
            <Button type="primary" size="sm" label="Connecter le véhicule" class="shrink-0" @click="connectSelf" />
          </template>
        </ConnectOptionCard>
      </template>
    </template>

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
