<script setup lang="ts">
const headingClass = usePageHeadingClass()
import { ref, computed } from 'vue'
// ─── Colors lifted from Figma variables ────────────────────────
const COLOR_CYAN_400       = '#20d3ee'
const COLOR_INDIGO_400     = '#828df8'
const COLOR_BLUE_900       = '#1e3b8a'
const COLOR_LIGHT_BLUE_400 = '#22bcff'

const months = ['Jan', 'Fevr', 'Mars', 'Avr', 'Mai', 'Juin']

// ─── Single source of truth (fleet + station stats) ────────────
const fleet = {
  conducteurs: 12,
  vehicules:   10,
  badges:      21,
  boitiers:    5,
}

const supervisionStats = {
  pointsSite:       21,
  pointsDomicile:   3,
  tauxOccupation:   27.62,
  tauxFiabilite:    85.46,
  tempsSquatte:     18.18,
}

// ─── Chart mock data (€ HT per month, last month = "30 derniers jours") ───
const rechargeSeries = [
  { name: 'Itinérance', data: [320.50, 445.80, 385.40, 410.25, 295.60, 360.15], color: COLOR_CYAN_400   },
  { name: 'Entreprise', data: [245.30, 310.55, 275.80, 295.45, 220.70, 255.40], color: COLOR_INDIGO_400 },
  { name: 'Domicile',   data: [185.20, 220.65, 195.30, 215.80, 175.50, 185.25], color: COLOR_BLUE_900   },
]

const peageSeries = [
  { name: 'Parking', data: [245.30, 275.80, 310.50, 260.45, 225.70, 280.60], color: COLOR_INDIGO_400 },
  { name: 'Péage',   data: [165.20, 195.40, 220.80, 175.50, 155.30, 180.25], color: COLOR_BLUE_900   },
]

// ─── Energy conversion (€/kWh per business line) ──────────────
// Itinérance: public fast charging ~0.55 €/kWh
// Entreprise: work AC charging ~0.22 €/kWh
// Domicile:   home charging ~0.18 €/kWh
const RATES: Record<string, number> = {
  'Itinérance': 0.55,
  'Entreprise': 0.22,
  'Domicile':   0.18,
}

// kWh series derived from € amounts
const rechargeEnergySeries = rechargeSeries.map(s => ({
  ...s,
  data: s.data.map(v => v / (RATES[s.name] ?? 1)),
}))

// Supervision chart reuses recharge data displayed as grouped bars
const supervisionSeries = rechargeSeries.map(s => ({ ...s })).reverse().map((s, i) => ({
  ...s,
  color: [COLOR_BLUE_900, COLOR_INDIGO_400, COLOR_CYAN_400][i],
}))
const supervisionEnergySeries = rechargeEnergySeries.map(s => ({ ...s })).reverse().map((s, i) => ({
  ...s,
  color: [COLOR_BLUE_900, COLOR_INDIGO_400, COLOR_CYAN_400][i],
}))

// ─── Helpers ──────────────────────────────────────────────────
type Series = { name: string; data: number[]; color: string }
const sumAll = (series: Series[]) =>
  series.reduce((acc, s) => acc + s.data.reduce((a, b) => a + b, 0), 0)
const lastOf = (series: Series[], name: string) =>
  series.find(s => s.name === name)?.data.slice(-1)[0] ?? 0

const fmtInt = (n: number) =>
  Math.round(n).toLocaleString('fr-FR').replace(/\u202f/g, ' ')
const fmtEuro = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
const fmtKwh = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ─── Derived aggregates ───────────────────────────────────────
const rechargeTotal = computed(() => sumAll(rechargeSeries))
const rechargeEnergyTotal = computed(() => sumAll(rechargeEnergySeries))
const rechargeLast30j = computed(() => ({
  itinerance: lastOf(rechargeSeries, 'Itinérance'),
  entreprise: lastOf(rechargeSeries, 'Entreprise'),
  domicile:   lastOf(rechargeSeries, 'Domicile'),
}))

const peageTotal = computed(() => sumAll(peageSeries))
const peageLast30j = computed(() => ({
  parking: lastOf(peageSeries, 'Parking'),
  peage:   lastOf(peageSeries, 'Péage'),
}))

// RSE (coherent with derived energy total)
const rseKwh           = computed(() => rechargeEnergyTotal.value)
const rseCO2Kg         = computed(() => rseKwh.value)
const rseLitresEssence = computed(() => rseKwh.value / 9)

// ─── Horizontal-tabs state ─────────────────────────────────────
const chargeTabs = [
  { id: 'amount', label: 'Montant des recharges' },
  { id: 'energy', label: 'Energie' },
]
const chargeTab = ref('amount')
const supervisionTab = ref('amount')

// ─── Chart-card display props per active tab ──────────────────
const rechargeCard = computed(() =>
  chargeTab.value === 'energy'
    ? {
        title:    'Énergie',
        subtitle: 'Énergie consommée sur les 6 derniers mois',
        value:    fmtKwh(rechargeEnergyTotal.value),
        unit:     'kWh',
        series:   rechargeEnergySeries,
        tooltipUnit: 'kWh',
      }
    : {
        title:    'Montant des recharges',
        subtitle: 'Total HT sur les 6 derniers mois',
        value:    fmtInt(rechargeTotal.value),
        unit:     'Eur',
        series:   rechargeSeries,
        tooltipUnit: '€',
      },
)

const supervisionCard = computed(() =>
  supervisionTab.value === 'energy'
    ? {
        title:    'Énergie',
        subtitle: 'Énergie consommée sur les 6 derniers mois',
        value:    fmtKwh(rechargeEnergyTotal.value),
        unit:     'kWh',
        series:   supervisionEnergySeries,
        tooltipUnit: 'kWh',
      }
    : {
        title:    'Montant des recharges',
        subtitle: 'Total HT sur les 6 derniers mois',
        value:    fmtInt(rechargeTotal.value),
        unit:     'Eur',
        series:   supervisionSeries,
        tooltipUnit: '€',
      },
)
</script>

<template>
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]">
    <div class="mx-auto w-full max-w-[2192px] flex flex-col gap-[32px]">

      <!-- Page header -->
      <div class="h-[48px] flex items-center anim-fade-up" style="animation-delay: 0ms">
        <h1 :class="headingClass">
          Tableau de bord de Brakson
        </h1>
      </div>

      <!-- ═══════════════  INFORMATIONS  ═══════════════ -->
      <section class="flex flex-col gap-[16px]">
        <h2
          class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral anim-fade-up"
          style="animation-delay: 50ms"
        >
          informations
        </h2>

        <!-- 4-column info row -->
        <StatRowCard :height="179" class="anim-fade-up" style="animation-delay: 100ms">
          <StatCell icon="user-group"       :value="String(fleet.conducteurs)" label="Conducteurs"        link="Voir mes conducteurs" />
          <StatCell icon="car"              :value="String(fleet.vehicules)"   label="Véhicules"          link="Voir mes véhicules" />
          <StatCell icon="chargemap-icon"   :value="String(fleet.badges)"      label="Badges"             link="Voir mes badges" />
          <StatCell icon="toll-badge"       :value="String(fleet.boitiers)"    label="Boîtier Téléprage"  link="Voir mes boîtiers" />
        </StatRowCard>

        <!-- Montant des recharges + side KPIs -->
        <div class="flex gap-[24px] items-start anim-fade-up" style="animation-delay: 150ms">
          <ChartCard
            :title="rechargeCard.title"
            :subtitle="rechargeCard.subtitle"
            :value="rechargeCard.value"
            :unit="rechargeCard.unit"
          >
            <template #tabs>
              <DashboardTabs v-model="chargeTab" :tabs="chargeTabs" />
            </template>
            <StackedBarChart :categories="months" :series="rechargeCard.series" :unit="rechargeCard.tooltipUnit" />
          </ChartCard>

          <div class="w-[254px] shrink-0 flex flex-col justify-between self-stretch">
            <SideKpiCard label="Itinérance - 30 derniers jours" :value="fmtEuro(rechargeLast30j.itinerance)" :color="COLOR_LIGHT_BLUE_400" :height="105" />
            <SideKpiCard label="Entreprise - 30 derniers jours" :value="fmtEuro(rechargeLast30j.entreprise)" :color="COLOR_INDIGO_400"      :height="105" />
            <SideKpiCard label="Domicile - 30 derniers jours"   :value="fmtEuro(rechargeLast30j.domicile)"   :color="COLOR_BLUE_900"        :height="105" />
          </div>
        </div>

        <!-- Données RSE -->
        <StatRowCard :height="150" class="anim-fade-up" style="animation-delay: 200ms">
          <StatCell title-only value="Données RSE" label="Estimé depuis le 01/01/2026" />
          <StatCell icon="bolt-very-fast"   :value="`${fmtInt(rseKwh)} kWh`" label="consommés" />
          <StatCell icon="carbon-dioxide"   :value="`${fmtInt(rseCO2Kg)} kg`"  label="CO2 économisé" />
          <StatCell icon="drop"             :value="`${fmtInt(rseLitresEssence)} L`"     label="essence épargnée" />
        </StatRowCard>

        <!-- Péage et parking + side KPIs -->
        <div class="flex gap-[24px] items-start anim-fade-up" style="animation-delay: 250ms">
          <ChartCard
            title="Péage et parking"
            subtitle="Total HT sur les 6 derniers mois"
            :value="fmtInt(peageTotal)"
            unit="Eur"
          >
            <StackedBarChart :categories="months" :series="peageSeries" unit="€" />
          </ChartCard>

          <div class="w-[254px] shrink-0 flex flex-col justify-between self-stretch">
            <SideKpiCard label="Parking - 30 derniers jours"  :value="fmtEuro(peageLast30j.parking)"     :color="COLOR_INDIGO_400"     :height="105" />
            <SideKpiCard label="Péage - 30 derniers jours"    :value="fmtEuro(peageLast30j.peage)"       :color="COLOR_BLUE_900"       :height="105" />
            <SideKpiCard label="Domicile - 30 derniers jours" :value="fmtEuro(rechargeLast30j.domicile)" :color="COLOR_LIGHT_BLUE_400" :height="105" />
          </div>
        </div>
      </section>

      <!-- ═══════════════  VOS BORNES SUPERVISÉES  ═══════════════ -->
      <section class="flex flex-col gap-[16px]">
        <h2
          class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral anim-fade-up"
          style="animation-delay: 300ms"
        >
          Vos bornes supervisées
        </h2>

        <!-- 5-column info row -->
        <StatRowCard :height="150" class="anim-fade-up" style="animation-delay: 350ms">
          <StatCell icon="building-office-2" :value="String(supervisionStats.pointsSite)"     label="Points de charge sur site" />
          <StatCell icon="home-modern"       :value="String(supervisionStats.pointsDomicile)" label="Point de charge domcile" />
          <StatCell icon="map-pin"           :value="`${supervisionStats.tauxOccupation.toLocaleString('fr-FR')} %`" label="Taux d’occupation" />
          <StatCell icon="check-badge"       accent="turquoise" :value="`${supervisionStats.tauxFiabilite.toLocaleString('fr-FR')} %`" label="Taux de fiabilité" />
          <StatCell icon="clock"             accent="orange"    :value="`${supervisionStats.tempsSquatte.toLocaleString('fr-FR')} %`" label="Temps squatté" />
        </StatRowCard>

        <!-- Grouped bar chart + side KPIs -->
        <div class="flex gap-[24px] items-start anim-fade-up" style="animation-delay: 400ms">
          <ChartCard
            :title="supervisionCard.title"
            :subtitle="supervisionCard.subtitle"
            :value="supervisionCard.value"
            :unit="supervisionCard.unit"
          >
            <template #tabs>
              <DashboardTabs v-model="supervisionTab" :tabs="chargeTabs" />
            </template>
            <GroupedBarChart :categories="months" :series="supervisionCard.series" :unit="supervisionCard.tooltipUnit" />
          </ChartCard>

          <div class="w-[254px] shrink-0 flex flex-col justify-between self-stretch">
            <SideKpiCard label="Itinérance - 30 derniers jours" :value="fmtEuro(rechargeLast30j.itinerance)" :color="COLOR_LIGHT_BLUE_400" :height="105" />
            <SideKpiCard label="Entreprise - 30 derniers jours" :value="fmtEuro(rechargeLast30j.entreprise)" :color="COLOR_INDIGO_400"      :height="105" />
            <SideKpiCard label="Domicile - 30 derniers jours"   :value="fmtEuro(rechargeLast30j.domicile)"   :color="COLOR_BLUE_900"        :height="105" />
          </div>
        </div>
      </section>

      <!-- Footer spacer -->
      <div class="h-[60px]" />
    </div>
  </div>
</template>
