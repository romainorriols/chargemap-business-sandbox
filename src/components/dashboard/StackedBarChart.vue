<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

export interface StackedSeries {
  name: string
  data: number[]
  color: string
}

interface Props {
  categories: string[]
  series: StackedSeries[]
  /** Suffix shown in tooltips, e.g. "€" or "kWh". */
  unit?: string
  /** Chart height in px. Defaults to 172 (Figma: 156 bars + 16 labels). */
  height?: number
}
const props = withDefaults(defineProps<Props>(), {
  unit: '€',
  height: 172,
})

const apexSeries = computed(() =>
  props.series.map(s => ({ name: s.name, data: s.data })),
)
const colors = computed(() => props.series.map(s => s.color))

const chartOptions = computed(() => ({
  chart: {
    type: 'bar' as const,
    stacked: true,
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'Inter, sans-serif',
    animations: {
      enabled: true,
      easing: 'easeinout' as const,
      speed: 280,
      animateGradually: { enabled: false, delay: 0 },
      dynamicAnimation: { enabled: true, speed: 280 },
    },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '65%',
      borderRadius: 2,
      borderRadiusApplication: 'end' as const,
      borderRadiusWhenStacked: 'last' as const,
    },
  },
  dataLabels: { enabled: false },
  stroke: { show: false },
  grid: {
    show: true,
    borderColor: 'var(--border-neutral-tertiary, #f0f3f7)',
    strokeDashArray: 0,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
  },
  xaxis: {
    categories: props.categories,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: {
        colors: '#64748b',
        fontSize: '10px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
      },
    },
  },
  yaxis: { show: false },
  legend: { show: false },
  colors: colors.value,
  tooltip: {
    shared: true,
    intersect: false,
    theme: 'light',
    style: { fontSize: '12px', fontFamily: 'Inter, sans-serif' },
    y: {
      formatter: (val: number) => `${val.toLocaleString('fr-FR')} ${props.unit}`,
    },
  },
  states: {
    hover: { filter: { type: 'lighten', value: 0.08 } },
    active: { filter: { type: 'none' } },
    normal: { filter: { type: 'none' } },
  },
}))
</script>

<template>
  <VueApexCharts
    type="bar"
    :height="height"
    :options="chartOptions"
    :series="apexSeries"
  />
</template>
