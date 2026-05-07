<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
type Status = 'paid' | 'processing' | 'toPay' | 'overdue' | 'refunded' | 'cancelled'

interface Invoice {
  id: string
  number: string
  amount: number
  bu: string
  organization: string
  date: string
  dueDate?: string
  status: Status
}

interface Demand extends Invoice {
  paymentMethod: string
}

interface Billing extends Invoice {
  kind: 'billing'
}

interface Note extends Invoice {
  kind: 'note'
  driver: string
  period: string
}

type Row = Invoice | Demand | Billing | Note

// Placeholder invoice data. All under Brakson org; BU varies across the group.
const invoices: Invoice[] = [
  { id: '1',  number: '20260508-08574216', amount: 21.50, bu: 'Brakson',         organization: 'Brakson', date: '2026-05-02', dueDate: '2026-11-10', status: 'toPay' },
  { id: '2',  number: '20260507-07245382', amount: 27.85, bu: 'Brakson',         organization: 'Brakson', date: '2026-05-01', dueDate: '2026-11-09', status: 'toPay' },
  { id: '3',  number: '20260506-06512948', amount: 29.20, bu: 'Brakson',         organization: 'Brakson', date: '2026-04-30', dueDate: '2026-11-08', status: 'toPay' },
  { id: '4',  number: '20260505-05281415', amount: 26.15, bu: 'Brakson',         organization: 'Brakson', date: '2026-04-29', dueDate: '2026-11-07', status: 'toPay' },
  { id: '5',  number: '20260504-04958271', amount: 21.90, bu: 'Brakson',         organization: 'Brakson', date: '2026-04-28', dueDate: '2026-11-06', status: 'toPay' },
  { id: '6',  number: '20260503-03412890', amount: 32.40, bu: 'Saabre',          organization: 'Brakson', date: '2026-04-27', dueDate: '2026-11-05', status: 'toPay' },
  { id: '7',  number: '20260502-02187365', amount: 18.75, bu: 'Saabre',          organization: 'Brakson', date: '2026-04-26',                         status: 'processing' },
  { id: '8',  number: '20260501-01985423', amount: 45.60, bu: 'Mister EV',       organization: 'Brakson', date: '2026-04-25',                         status: 'paid' },
  { id: '9',  number: '20260430-13765291', amount: 38.20, bu: 'Mister EV',       organization: 'Brakson', date: '2026-04-24',                         status: 'paid' },
  { id: '10', number: '20260429-12587341', amount: 22.30, bu: 'Cleanrider',      organization: 'Brakson', date: '2026-04-23', dueDate: '2026-05-23', status: 'overdue' },
  { id: '11', number: '20260428-11423058', amount: 19.85, bu: 'Cleanrider',      organization: 'Brakson', date: '2026-04-22',                         status: 'paid' },
  { id: '12', number: '20260427-10895217', amount: 41.75, bu: 'Responsible Ads', organization: 'Brakson', date: '2026-04-21',                         status: 'paid' },
  { id: '13', number: '20260426-09748512', amount: 27.10, bu: 'Responsible Ads', organization: 'Brakson', date: '2026-04-20',                         status: 'paid' },
  { id: '14', number: '20260425-08521379', amount: 33.95, bu: 'Marketing',       organization: 'Brakson', date: '2026-04-19',                         status: 'paid' },
  { id: '15', number: '20260424-07385612', amount: 24.50, bu: 'Chargemap',       organization: 'Brakson', date: '2026-04-18',                         status: 'paid' },
  { id: '16', number: '20260423-06214587', amount: 36.80, bu: 'Chargemap',       organization: 'Brakson', date: '2026-04-17',                         status: 'paid' },
  { id: '17', number: '20260422-05987423', amount: 28.40, bu: 'Brakson',         organization: 'Brakson', date: '2026-04-16',                         status: 'paid' },
  { id: '18', number: '20260421-04731869', amount: 42.15, bu: 'Saabre',          organization: 'Brakson', date: '2026-04-15',                         status: 'paid' },
  { id: '19', number: '20260420-03528714', amount: 19.65, bu: 'Mister EV',       organization: 'Brakson', date: '2026-04-14',                         status: 'paid' },
  { id: '20', number: '20260419-02417853', amount: 35.25, bu: 'Cleanrider',      organization: 'Brakson', date: '2026-04-13',                         status: 'paid' },
  { id: '21', number: '20260418-01293571', amount: 23.70, bu: 'Marketing',       organization: 'Brakson', date: '2026-04-12',                         status: 'paid' },
  { id: '22', number: '20260417-98732156', amount: 31.05, bu: 'Responsible Ads', organization: 'Brakson', date: '2026-04-11',                         status: 'paid' },
  { id: '23', number: '20260416-87654329', amount: 26.85, bu: 'Chargemap',       organization: 'Brakson', date: '2026-04-10',                         status: 'paid' },
  { id: '24', number: '20260415-76543218', amount: 40.20, bu: 'Brakson',         organization: 'Brakson', date: '2026-04-09',                         status: 'paid' },
  { id: '25', number: '20260414-65432107', amount: 17.40, bu: 'Saabre',          organization: 'Brakson', date: '2026-04-08',                         status: 'refunded' },
  { id: '26', number: '20260413-54320996', amount: 12.30, bu: 'Mister EV',       organization: 'Brakson', date: '2026-04-07',                         status: 'cancelled' },
]

// ── Tabs ───────────────────────────────────────────────────────────────
const tabs = [
  { id: 'factures', label: 'Factures' },
  { id: 'appels-fonds', label: 'Appels de fonds' },
  { id: 'notes-frais', label: 'Notes de frais' },
  { id: 'appels-facturation', label: 'Appels à facturation' },
]
const activeTab = ref('factures')
const pageTitle = computed(() => tabs.find(t => t.id === activeTab.value)?.label ?? 'Facturation')

// Dismissible info alerts — one per info-bearing tab so dismissing on one
// doesn't hide the other. Appels de fonds and Appels à facturation each
// surface a "Comment fonctionnent..." banner.
const alertDismissedFonds = ref(false)
const alertDismissedFacturation = ref(false)

// ── Appels de fonds data ───────────────────────────────────────────────
// Per Figma 5593-54767, demands surface 4 statuses: paid / processing /
// overdue / toPay (with dueDate inlined in the pill).
const demands: Demand[] = [
  { id: 'd1',  number: 'AF-20250823-7A9F2D3C9B12', amount: 8.75,  bu: 'Brakson',         organization: 'Brakson', date: '2026-05-22', dueDate: '2026-11-22', paymentMethod: 'Carte de crédit', status: 'toPay'      },
  { id: 'd2',  number: 'AF-20250905-C4E2B7F89D90', amount: 6.30,  bu: 'Brakson',         organization: 'Brakson', date: '2026-06-30', dueDate: '2026-12-30', paymentMethod: 'Carte de crédit', status: 'toPay'      },
  { id: 'd3',  number: 'AF-20250919-5B1A8E4C2D7F', amount: 7.10,  bu: 'Brakson',         organization: 'Brakson', date: '2026-07-15', dueDate: '2027-01-15', paymentMethod: 'Carte de crédit', status: 'toPay'      },
  { id: 'd4',  number: 'AF-20251001-9D3F6C7A1B0E', amount: 9.50,  bu: 'Brakson',         organization: 'Brakson', date: '2026-08-01', dueDate: '2027-02-01', paymentMethod: 'Carte de crédit', status: 'processing' },
  { id: 'd5',  number: 'AF-20251012-2F8E1A4B6C90', amount: 11.20, bu: 'Saabre',          organization: 'Brakson', date: '2026-08-12', dueDate: '2027-02-12', paymentMethod: 'Mandat SEPA',     status: 'processing' },
  { id: 'd6',  number: 'AF-20251023-3A7C5D2F1E08', amount: 4.85,  bu: 'Saabre',          organization: 'Brakson', date: '2026-08-23',                         paymentMethod: 'Mandat SEPA',     status: 'paid'       },
  { id: 'd7',  number: 'AF-20251104-6B9F8D4A2C71', amount: 13.40, bu: 'Mister EV',       organization: 'Brakson', date: '2026-09-04', dueDate: '2027-03-04', paymentMethod: 'Carte de crédit', status: 'toPay'      },
  { id: 'd8',  number: 'AF-20251115-8E1D7C5A9B23', amount: 5.95,  bu: 'Mister EV',       organization: 'Brakson', date: '2026-09-15',                         paymentMethod: 'Carte de crédit', status: 'paid'       },
  { id: 'd9',  number: 'AF-20251128-1A5B3D7F2E84', amount: 10.65, bu: 'Cleanrider',      organization: 'Brakson', date: '2026-09-28', dueDate: '2026-10-28', paymentMethod: 'Mandat SEPA',     status: 'overdue'    },
  { id: 'd10', number: 'AF-20251208-4C2E9F6A1D75', amount: 8.20,  bu: 'Cleanrider',      organization: 'Brakson', date: '2026-10-08',                         paymentMethod: 'Carte de crédit', status: 'paid'       },
  { id: 'd11', number: 'AF-20251220-9D6E3B7C8F41', amount: 7.45,  bu: 'Responsible Ads', organization: 'Brakson', date: '2026-10-20',                         paymentMethod: 'Mandat SEPA',     status: 'paid'       },
  { id: 'd12', number: 'AF-20260104-2B8F5A1E9C36', amount: 12.10, bu: 'Marketing',       organization: 'Brakson', date: '2026-11-04', dueDate: '2027-05-04', paymentMethod: 'Carte de crédit', status: 'toPay'      },
  { id: 'd13', number: 'AF-20260118-7E4A9C2D5B81', amount: 6.75,  bu: 'Chargemap',       organization: 'Brakson', date: '2026-11-18',                         paymentMethod: 'Virement',        status: 'paid'       },
  { id: 'd14', number: 'AF-20260201-3F1C8E6A4D29', amount: 9.30,  bu: 'Chargemap',       organization: 'Brakson', date: '2026-12-01', dueDate: '2027-06-01', paymentMethod: 'Mandat SEPA',     status: 'processing' },
  { id: 'd15', number: 'AF-20260215-5D9B2A7C1E48', amount: 14.25, bu: 'Brakson',         organization: 'Brakson', date: '2026-12-15', dueDate: '2027-06-15', paymentMethod: 'Carte de crédit', status: 'toPay'      },
  { id: 'd16', number: 'AF-20260301-1A2B3C4D5E6F', amount: 8.40,  bu: 'Saabre',          organization: 'Brakson', date: '2027-01-05',                         paymentMethod: 'Carte de crédit', status: 'paid'       },
  { id: 'd17', number: 'AF-20260315-9F8E7D6C5B4A', amount: 5.20,  bu: 'Mister EV',       organization: 'Brakson', date: '2027-01-12', dueDate: '2027-04-12', paymentMethod: 'Mandat SEPA',     status: 'overdue'    },
]

// ── Appels à facturation data ──────────────────────────────────────────
const billings: Billing[] = [
  { id: 'b1',  kind: 'billing', number: '36379629', amount: 4.92,  bu: 'Brakson',         organization: 'Brakson', date: '2026-04-11', status: 'toPay' },
  { id: 'b2',  kind: 'billing', number: '36379630', amount: 5.18,  bu: 'Brakson',         organization: 'Brakson', date: '2026-04-10', status: 'toPay' },
  { id: 'b3',  kind: 'billing', number: '36379631', amount: 6.45,  bu: 'Brakson',         organization: 'Brakson', date: '2026-04-09', status: 'toPay' },
  { id: 'b4',  kind: 'billing', number: '36379632', amount: 3.80,  bu: 'Saabre',          organization: 'Brakson', date: '2026-04-08', status: 'toPay' },
  { id: 'b5',  kind: 'billing', number: '36379633', amount: 7.25,  bu: 'Saabre',          organization: 'Brakson', date: '2026-04-07', status: 'toPay' },
  { id: 'b6',  kind: 'billing', number: '36379634', amount: 4.10,  bu: 'Mister EV',       organization: 'Brakson', date: '2026-04-06', status: 'toPay' },
  { id: 'b7',  kind: 'billing', number: '36379635', amount: 8.95,  bu: 'Mister EV',       organization: 'Brakson', date: '2026-04-05', status: 'toPay' },
  { id: 'b8',  kind: 'billing', number: '36379636', amount: 5.60,  bu: 'Cleanrider',      organization: 'Brakson', date: '2026-04-04', status: 'toPay' },
  { id: 'b9',  kind: 'billing', number: '36379637', amount: 6.70,  bu: 'Cleanrider',      organization: 'Brakson', date: '2026-04-03', status: 'processing' },
  { id: 'b10', kind: 'billing', number: '36379638', amount: 4.30,  bu: 'Responsible Ads', organization: 'Brakson', date: '2026-04-02', status: 'paid' },
  { id: 'b11', kind: 'billing', number: '36379639', amount: 9.15,  bu: 'Marketing',       organization: 'Brakson', date: '2026-04-01', status: 'paid' },
  { id: 'b12', kind: 'billing', number: '36379640', amount: 3.50,  bu: 'Chargemap',       organization: 'Brakson', date: '2026-03-31', status: 'paid' },
  { id: 'b13', kind: 'billing', number: '36379641', amount: 5.85,  bu: 'Chargemap',       organization: 'Brakson', date: '2026-03-30', status: 'paid' },
  { id: 'b14', kind: 'billing', number: '36379642', amount: 7.40,  bu: 'Brakson',         organization: 'Brakson', date: '2026-03-29', status: 'paid' },
  { id: 'b15', kind: 'billing', number: '36379643', amount: 4.60,  bu: 'Saabre',          organization: 'Brakson', date: '2026-03-28', status: 'paid' },
  { id: 'b16', kind: 'billing', number: '36379644', amount: 5.10,  bu: 'Mister EV',       organization: 'Brakson', date: '2026-03-27', status: 'processing' },
  { id: 'b17', kind: 'billing', number: '36379645', amount: 3.20,  bu: 'Cleanrider',      organization: 'Brakson', date: '2026-03-26', status: 'paid' },
]

// Per Figma 5593-66539, Notes de frais surface only 3 statuses:
// processing → "En cours", toPay → "En attente", refunded → "Remboursée".
const notes: Note[] = [
  { id: 'nf1',  kind: 'note', number: 'NDF-20260405-69D1D1CC2E9CC', amount: 12.45,  bu: 'Brakson',         organization: 'Brakson', date: '2026-04-11', dueDate: '2026-10-12', driver: 'John Doe',         period: '01/03/2026 - 31/03/2026', status: 'toPay'      },
  { id: 'nf2',  kind: 'note', number: 'NDF-20260404-58E2C1BB4F7B1', amount: 87.50,  bu: 'Brakson',         organization: 'Brakson', date: '2026-04-08',                         driver: 'Camille Laurent',  period: '15/02/2026 - 15/03/2026', status: 'processing' },
  { id: 'nf3',  kind: 'note', number: 'NDF-20260403-47F3D2AA5E8A2', amount: 23.80,  bu: 'Brakson',         organization: 'Brakson', date: '2026-04-05',                         driver: 'Nicolas Mercier',  period: '01/03/2026 - 31/03/2026', status: 'processing' },
  { id: 'nf4',  kind: 'note', number: 'NDF-20260402-36A4E3BB6F9B3', amount: 145.20, bu: 'Brakson',         organization: 'Brakson', date: '2026-03-28',                         driver: 'Léa Dubois',       period: '01/02/2026 - 28/02/2026', status: 'processing' },
  { id: 'nf5',  kind: 'note', number: 'NDF-20260401-25B5F4CC7A0C4', amount: 67.30,  bu: 'Saabre',          organization: 'Brakson', date: '2026-03-25',                         driver: 'Antoine Robert',   period: '01/03/2026 - 31/03/2026', status: 'processing' },
  { id: 'nf6',  kind: 'note', number: 'NDF-20260331-14C6A5DD8B1D5', amount: 31.95,  bu: 'Saabre',          organization: 'Brakson', date: '2026-04-02',                         driver: 'Sophie Moreau',    period: '15/03/2026 - 15/04/2026', status: 'processing' },
  { id: 'nf7',  kind: 'note', number: 'NDF-20260330-03D7B6EE9C2E6', amount: 92.15,  bu: 'Mister EV',       organization: 'Brakson', date: '2026-03-15',                         driver: 'Julien Bernard',   period: '01/02/2026 - 28/02/2026', status: 'refunded'   },
  { id: 'nf8',  kind: 'note', number: 'NDF-20260329-92E8C7FF0D3F7', amount: 18.60,  bu: 'Mister EV',       organization: 'Brakson', date: '2026-02-28',                         driver: 'Émilie Faure',     period: '01/02/2026 - 28/02/2026', status: 'refunded'   },
  { id: 'nf9',  kind: 'note', number: 'NDF-20260328-81F9D8AA1E408', amount: 124.40, bu: 'Cleanrider',      organization: 'Brakson', date: '2026-03-10',                         driver: 'Maxime Colas',     period: '15/01/2026 - 15/02/2026', status: 'refunded'   },
  { id: 'nf10', kind: 'note', number: 'NDF-20260327-70AAE9BB2F519', amount: 45.75,  bu: 'Cleanrider',      organization: 'Brakson', date: '2026-02-22',                         driver: 'Romain Orriols',   period: '01/01/2026 - 31/01/2026', status: 'refunded'   },
  { id: 'nf11', kind: 'note', number: 'NDF-20260326-69ABFAEC30620', amount: 78.20,  bu: 'Responsible Ads', organization: 'Brakson', date: '2026-03-18',                         driver: 'Marie Dubois',     period: '15/02/2026 - 15/03/2026', status: 'refunded'   },
  { id: 'nf12', kind: 'note', number: 'NDF-20260325-58BCFBFD41731', amount: 9.85,   bu: 'Marketing',       organization: 'Brakson', date: '2026-04-09', dueDate: '2026-10-25', driver: 'Pierre Martin',    period: '01/03/2026 - 31/03/2026', status: 'toPay'      },
  { id: 'nf13', kind: 'note', number: 'NDF-20260324-47CDFCFE52842', amount: 156.40, bu: 'Chargemap',       organization: 'Brakson', date: '2026-04-04', dueDate: '2026-10-24', driver: 'Antoine Lefevre',  period: '01/02/2026 - 28/02/2026', status: 'toPay'      },
  { id: 'nf14', kind: 'note', number: 'NDF-20260323-36DEFD0F63953', amount: 52.30,  bu: 'Saabre',          organization: 'Brakson', date: '2026-02-15',                         driver: 'Sarah Lemaire',    period: '01/01/2026 - 31/01/2026', status: 'refunded'   },
  { id: 'nf15', kind: 'note', number: 'NDF-20260322-25EFFE10A4A64', amount: 38.65,  bu: 'Mister EV',       organization: 'Brakson', date: '2026-03-20',                         driver: 'Lucas Petit',      period: '01/02/2026 - 28/02/2026', status: 'refunded'   },
]

const currentRows = computed<Row[]>(() => {
  if (activeTab.value === 'factures') return invoices
  if (activeTab.value === 'appels-fonds') return demands
  if (activeTab.value === 'appels-facturation') return billings
  if (activeTab.value === 'notes-frais') return notes
  return []
})

function isDemand(row: Row): row is Demand {
  return 'paymentMethod' in row
}
function isBilling(row: Row): row is Billing {
  return 'kind' in row && (row as Billing).kind === 'billing'
}
function isNote(row: Row): row is Note {
  return 'kind' in row && (row as Note).kind === 'note'
}

// ── Filters ────────────────────────────────────────────────────────────
const search = ref('')
const statusFilter = ref<string>('')
const dateFilter = ref<string>('')

// Empty-string value on "Tous" clears the model so the trigger falls back to
// the placeholder ("États: Tous") — same trick for the date "Toutes" option.
// Appels de fonds is restricted to 3 statuses per Figma 5593-54767;
// Notes de frais to 3 statuses per Figma 5593-66539.
const statusItems = computed(() => {
  if (activeTab.value === 'appels-fonds') {
    return [
      { value: '',           label: 'Tous' },
      { value: 'paid',       label: 'Réglée' },
      { value: 'processing', label: 'En cours' },
      { value: 'overdue',    label: 'En retard' },
      { value: 'toPay',      label: 'À payer' },
    ]
  }
  if (activeTab.value === 'notes-frais') {
    return [
      { value: '',           label: 'Tous' },
      { value: 'processing', label: 'En cours' },
      { value: 'toPay',      label: 'En attente' },
      { value: 'refunded',   label: 'Remboursée' },
    ]
  }
  if (activeTab.value === 'appels-facturation') {
    return [
      { value: '',           label: 'Tous' },
      { value: 'processing', label: 'Reçu' },
      { value: 'toPay',      label: 'En attente' },
      { value: 'paid',       label: 'Payé' },
    ]
  }
  return [
    { value: '',           label: 'Tous' },
    { value: 'toPay',      label: 'À payer' },
    { value: 'processing', label: 'En cours' },
    { value: 'paid',       label: 'Réglé' },
    { value: 'overdue',    label: 'En retard' },
    { value: 'refunded',   label: 'Remboursé' },
    { value: 'cancelled',  label: 'Annulé' },
  ]
})

const dateItems = [
  { value: '',       label: 'Toutes' },
  { value: '7d',     label: '7 derniers jours' },
  { value: '30d',    label: '30 derniers jours' },
  { value: '90d',    label: '3 derniers mois' },
  { value: 'custom', label: 'Personnalisé' },
]

// Anchor "today" to the most recent row date so the relative filters
// (7d / 30d / 90d) make sense regardless of the sandbox calendar.
const todayAnchor = computed(() => {
  const rows = currentRows.value
  if (rows.length === 0) return new Date()
  return new Date(rows.reduce((max, r) => (r.date > max ? r.date : max), rows[0].date))
})

function matchesDate(iso: string): boolean {
  if (!dateFilter.value || dateFilter.value === 'custom') return true
  const d = new Date(iso)
  const diffDays = (todayAnchor.value.getTime() - d.getTime()) / 86_400_000
  if (dateFilter.value === '7d')  return diffDays <= 7  && diffDays >= 0
  if (dateFilter.value === '30d') return diffDays <= 30 && diffDays >= 0
  if (dateFilter.value === '90d') return diffDays <= 90 && diffDays >= 0
  return true
}

// ── KPIs (computed from the active tab's data) ─────────────────────────
const kpiTotal = computed(() =>
  currentRows.value
    .filter(r => r.status === 'toPay' || r.status === 'overdue')
    .reduce((sum, r) => sum + r.amount, 0)
)
const kpiThisMonth = computed(() => {
  const anchor = todayAnchor.value
  const y = anchor.getFullYear()
  const m = anchor.getMonth()
  return currentRows.value
    .filter(r => {
      const d = new Date(r.date)
      return d.getFullYear() === y && d.getMonth() === m
    })
    .reduce((sum, r) => sum + r.amount, 0)
})
const kpiOverdue = computed(() =>
  currentRows.value
    .filter(r => r.status === 'overdue')
    .reduce((sum, r) => sum + r.amount, 0)
)

const filtered = computed<Row[]>(() => {
  const q = search.value.trim().toLowerCase()
  return currentRows.value.filter(row => {
    if (statusFilter.value && row.status !== statusFilter.value) return false
    if (!matchesDate(row.date)) return false
    if (!q) return true
    return (
      row.number.toLowerCase().includes(q) ||
      row.bu.toLowerCase().includes(q) ||
      row.organization.toLowerCase().includes(q)
    )
  })
})

// ── Pagination ─────────────────────────────────────────────────────────
const page = ref(1)
const perPage = 20
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated = computed(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})
const rangeStart = computed(() => filtered.value.length === 0 ? 0 : (page.value - 1) * perPage + 1)
const rangeEnd = computed(() => Math.min(page.value * perPage, filtered.value.length))

// ── Selection / export mode ────────────────────────────────────────────
// Factures tab: header "Exporter" button toggles exportMode; checkboxes
// only show in exportMode, and the floating bulk bar appears when at least
// one row is selected. Tab change resets both.
const exportMode = ref(false)
const selected = ref<Set<string>>(new Set())

watch([search, statusFilter, dateFilter, activeTab], () => {
  page.value = 1
  selected.value = new Set()
  exportMode.value = false
})

function goto(n: number) {
  if (n < 1 || n > pageCount.value) return
  page.value = n
}

function enterExportMode() {
  exportMode.value = true
  selected.value = new Set()
}
function exitExportMode() {
  exportMode.value = false
  selected.value = new Set()
}

const allSelected = computed(() =>
  filtered.value.length > 0 && filtered.value.every(inv => selected.value.has(inv.id))
)
const someSelected = computed(() =>
  filtered.value.some(inv => selected.value.has(inv.id)) && !allSelected.value
)

function toggleRow(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}
function toggleAll() {
  const next = new Set(selected.value)
  if (allSelected.value) {
    filtered.value.forEach(inv => next.delete(inv.id))
  } else {
    filtered.value.forEach(inv => next.add(inv.id))
  }
  selected.value = next
}

// ── Formatting ─────────────────────────────────────────────────────────
const fmtAmount = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/\u202f/g, ' ') + ' €'

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ── Status presentation ────────────────────────────────────────────────
interface StatusPill {
  label: string
  bg: string
  border: string
  text: string
}
function statusPill(inv: Row): StatusPill {
  // Per-status pill colors (Figma 5593-48647): same palette across row
  // types, only the label varies (gendered noun: facture/note → "Remboursée"
  // /"Annulée" ; appel de fonds/à facturation → "Remboursé"/"Annulé").
  // Appels à facturation (Figma 5594-3871): only 3 pills — Reçu / En attente
  // (both gray) / Payé (turquoise, masculine).
  if (isBilling(inv)) {
    switch (inv.status) {
      case 'paid':
        return { label: 'Payé',       bg: 'bg-[#f2fdf9]', border: 'border-[#bdfae3]', text: 'text-[#18b97e]' }
      case 'toPay':
        return { label: 'En attente', bg: 'bg-[#fafafa]', border: 'border-[#e4e4e7]', text: 'text-[#48566a]' }
      default:
        return { label: 'Reçu',       bg: 'bg-[#fafafa]', border: 'border-[#e4e4e7]', text: 'text-[#48566a]' }
    }
  }
  // Notes de frais (Figma 5593-66539): only 3 pills — En cours / En attente
  // (both gray) / Remboursée (turquoise).
  if (isNote(inv)) {
    switch (inv.status) {
      case 'toPay':
        return { label: 'En attente', bg: 'bg-[#fafafa]', border: 'border-[#e4e4e7]', text: 'text-[#48566a]' }
      case 'refunded':
        return { label: 'Remboursée', bg: 'bg-[#f2fdf9]', border: 'border-[#bdfae3]', text: 'text-[#18b97e]' }
      default:
        return { label: 'En cours',   bg: 'bg-[#fafafa]', border: 'border-[#e4e4e7]', text: 'text-[#48566a]' }
    }
  }
  // Demands (appels de fonds): Figma 5593-54767 — 4 pills: Réglée / En cours /
  // En retard / À payer avant DD/MM/YYYY (yellow, with the dueDate inlined).
  if (isDemand(inv)) {
    switch (inv.status) {
      case 'paid':
        return { label: 'Réglée',    bg: 'bg-[#f2fdf9]', border: 'border-[#bdfae3]', text: 'text-[#18b97e]' }
      case 'overdue':
        return { label: 'En retard', bg: 'bg-[#fff6eb]', border: 'border-[#fed6a9]', text: 'text-[#e9590c]' }
      case 'toPay':
        return {
          label: inv.dueDate ? `À payer avant ${fmtDate(inv.dueDate)}` : 'À payer',
          bg: 'bg-[#fefce7]', border: 'border-[#fef08b]', text: 'text-[#c88a04]',
        }
      default:
        return { label: 'En cours',  bg: 'bg-[#fafafa]', border: 'border-[#e4e4e7]', text: 'text-[#48566a]' }
    }
  }
  // Default branch — Invoice (factures, feminine).
  switch (inv.status) {
    case 'paid':
      return { label: 'Réglée',                      bg: 'bg-[#f2fdf9]', border: 'border-[#bdfae3]', text: 'text-[#18b97e]' }
    case 'processing':
      return { label: 'En cours',                    bg: 'bg-[#fafafa]', border: 'border-[#e4e4e7]', text: 'text-[#48566a]' }
    case 'toPay':
      return {
        label: inv.dueDate ? `À payer avant ${fmtDate(inv.dueDate)}` : 'À payer',
        bg: 'bg-[#fefce7]', border: 'border-[#fef08b]', text: 'text-[#c88a04]',
      }
    case 'overdue':
      return { label: 'En retard',                   bg: 'bg-[#fff6eb]', border: 'border-[#fed6a9]', text: 'text-[#e9590c]' }
    case 'refunded':
      return { label: 'Remboursée',                  bg: 'bg-[#f2fdf9]', border: 'border-[#bdfae3]', text: 'text-[#18b97e]' }
    case 'cancelled':
      return { label: 'Annulée',                     bg: 'bg-[#fafafa]', border: 'border-[#e4e4e7]', text: 'text-[#48566a]' }
  }
}

// ── Action hooks ───────────────────────────────────────────────────────
function onViewPdf(_inv: Row) {
  // Hook voir le PDF here
}
function onDownload(_inv: Row) {
  // Hook télécharger la facture here
}
function onDownloadFactureFormat(_inv: Row, _format: 'csv' | 'xlsx') {
  // Hook exporter la facture au format _format here
}
function onViewNotesFrais(_row: Row) {
  // Hook voir les notes de frais associées here
}
function onViewRecharges(_row: Row) {
  // Hook voir les recharges associées here
}
function onViewAppelDeFonds(_row: Row) {
  // Hook voir l'appel de fonds associé here
}
function onExportNoteCsv(_row: Row) {
  // Hook exporter la note de frais en CSV here
}
// Format buttons live inline on the bulk action bar; clicking one triggers
// the export hook and exits export mode.
type ExportFormat = 'csv' | 'xlsx' | 'pdf'
function onExportSelection(_format: ExportFormat) {
  // Hook exporter la sélection au format _format here
  exitExportMode()
}

// ── Row-level menu ─────────────────────────────────────────────────────
const openMenuId = ref<string | null>(null)
function toggleMenu(id: string, e: MouseEvent) {
  e.stopPropagation()
  openMenuId.value = openMenuId.value === id ? null : id
}
function closeMenus() {
  openMenuId.value = null
}

// ── Export de facture V2 toggle (Factures bandeau) ─────────────────────
// Click "Activer" flips the banner copy + CTA. Idempotent click toggles back.
const exportV2Active = ref(false)
function toggleExportV2() { exportV2Active.value = !exportV2Active.value }

// ── Loading state ──────────────────────────────────────────────────────
// Simulated fetch delay (~600ms) so the skeleton reads on mount. Swap this
// for a real promise when wiring the API.
const isLoading = ref(true)
onMounted(() => {
  setTimeout(() => { isLoading.value = false }, 600)
})
const skeletonRows = Array.from({ length: 8 }, (_, i) => i)
</script>

<template>
  <div class="min-h-full px-[32px] pt-[44px] pb-[32px]" @click="closeMenus">
    <div class="mx-auto w-full max-w-[2560px] flex flex-col gap-[40px]">

      <!-- Page header — title on the left, header CTA on the right.
           Factures tab: "Exporter" (primary) toggles export mode; once
           activated, it morphs into "Quitter l'export" (secondary). -->
      <div
        class="flex items-center gap-[16px] min-h-[44px] anim-fade-up"
        style="animation-delay: 0ms"
      >
        <h1 :class="['flex-1 min-w-0', V1_PAGE_HEADING]">
          {{ pageTitle }}
        </h1>
        <Transition
          mode="out-in"
          enter-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
          enter-from-class="opacity-0 -translate-y-[4px]"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-[opacity,transform] duration-[120ms] ease-out"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-[4px]"
        >
          <Button
            v-if="activeTab === 'factures' && exportMode"
            key="quit"
            type="secondary"
            size="md"
            label="Quitter l'export"
            @click="exitExportMode"
          />
          <Button
            v-else-if="activeTab === 'factures'"
            key="enter"
            type="secondary"
            size="md"
            label="Exporter"
            icon-left="arrow-down-tray"
            @click="enterExportMode"
          />
        </Transition>
      </div>

      <!-- Tabs -->
      <HorizontalTabs
        v-model="activeTab"
        :tabs="tabs"
        variant="underline"
        class="anim-fade-up"
        style="animation-delay: 40ms"
      />

      <!-- KPI card: 3 segments. Outer = card frame (initial fade-in only). Inner = content (cross-fades on tab change). -->
      <div
        v-if="activeTab !== 'factures' && activeTab !== 'appels-fonds' && activeTab !== 'notes-frais' && activeTab !== 'appels-facturation'"
        class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[24px] anim-fade-up"
        style="animation-delay: 80ms"
      >
        <!-- KPI cross-fade on tab change — canonical tab-fade. -->
        <Transition mode="out-in" name="tab-fade">
          <div :key="`kpi-${activeTab}`" class="flex items-center gap-[16px]">
            <div class="flex-1 min-w-0 flex flex-col gap-[8px]">
              <div class="flex items-center justify-center w-[37px] h-[37px] rounded-[12px] bg-[#6467f2]">
                <Icon name="credit-card" variant="solid" :size="24" class="text-white" />
              </div>
              <div class="flex flex-col leading-[1.5] w-full">
                <Skeleton v-if="isLoading" width="110px" height="28px" class="my-[4px]" />
                <p v-else class="font-sans font-semibold text-[24px] tracking-[-0.72px] text-text-neutral tabular-nums">
                  {{ fmtAmount(kpiTotal) }}
                </p>
                <p class="font-sans font-medium text-[14px] tracking-[-0.42px] text-text-neutral-secondary">
                  Total à payer
                </p>
              </div>
            </div>
            <div class="w-px self-stretch bg-border-neutral-tertiary" />
            <div class="flex-1 min-w-0 flex flex-col gap-[8px]">
              <div class="flex items-center justify-center w-[37px] h-[37px] rounded-[12px] bg-[#6467f2]">
                <Icon name="calendar-days" variant="solid" :size="24" class="text-white" />
              </div>
              <div class="flex flex-col leading-[1.5] w-full">
                <Skeleton v-if="isLoading" width="90px" height="28px" class="my-[4px]" />
                <p v-else class="font-sans font-semibold text-[24px] tracking-[-0.72px] text-text-neutral tabular-nums">
                  {{ fmtAmount(kpiThisMonth) }}
                </p>
                <p class="font-sans font-medium text-[14px] tracking-[-0.42px] text-text-neutral-secondary">
                  Ce mois ci
                </p>
              </div>
            </div>
            <div class="w-px self-stretch bg-border-neutral-tertiary" />
            <div class="flex-1 min-w-0 flex flex-col gap-[8px]">
              <div class="flex items-center justify-center w-[37px] h-[37px] rounded-[12px] bg-[#f97415]">
                <Icon name="clock" variant="solid" :size="24" class="text-white" />
              </div>
              <div class="flex flex-col leading-[1.5] w-full">
                <Skeleton v-if="isLoading" width="80px" height="28px" class="my-[4px]" />
                <p v-else class="font-sans font-semibold text-[24px] tracking-[-0.72px] text-text-neutral tabular-nums">
                  {{ fmtAmount(kpiOverdue) }}
                </p>
                <p class="font-sans font-medium text-[14px] tracking-[-0.42px] text-text-neutral-secondary">
                  En retard
                </p>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Table section -->
      <div class="flex flex-col gap-[16px] anim-fade-up" style="animation-delay: 120ms">

        <!-- Info alert (Appels de fonds only) -->
        <Transition
          enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
          enter-from-class="opacity-0 -translate-y-[6px]"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-[opacity,transform] duration-[160ms] ease-out"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-[6px]"
        >
          <div
            v-if="(activeTab === 'appels-fonds' && !alertDismissedFonds)
              || (activeTab === 'appels-facturation' && !alertDismissedFacturation)"
            class="bg-brand-surface border border-border-brand-medium rounded-[8px] shadow-sm p-[16px] flex items-start gap-[12px]"
            role="status"
          >
            <svg
              class="shrink-0"
              width="26"
              height="26"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M19.875 13C19.875 9.20304 16.797 6.125 13 6.125C9.20304 6.125 6.125 9.20304 6.125 13C6.125 16.797 9.20304 19.875 13 19.875C16.797 19.875 19.875 16.797 19.875 13ZM12.2196 11.7581C13.121 11.3874 14.0884 12.1633 13.922 13.1237L13.9017 13.2197L13.3109 15.583L13.3459 15.5659C13.6545 15.4118 14.0298 15.5372 14.1841 15.8459C14.3382 16.1545 14.2128 16.5298 13.9041 16.6841L13.87 16.7012C12.9148 17.1787 11.8394 16.3163 12.0983 15.2803L12.6891 12.917L12.6541 12.9341C12.3455 13.0882 11.9702 12.9628 11.8159 12.6541C11.6618 12.3455 11.7872 11.9702 12.0959 11.8159L12.13 11.7988L12.2196 11.7581ZM13.0065 9.25C13.3516 9.25014 13.6315 9.52991 13.6315 9.875V9.88151C13.6314 10.2265 13.3515 10.5064 13.0065 10.5065H13C12.6549 10.5065 12.3751 10.2266 12.375 9.88151V9.875C12.375 9.52982 12.6548 9.25 13 9.25H13.0065ZM21.125 13C21.125 17.4873 17.4873 21.125 13 21.125C8.51269 21.125 4.875 17.4873 4.875 13C4.875 8.51269 8.51269 4.875 13 4.875C17.4873 4.875 21.125 8.51269 21.125 13Z" fill="#2463EB" />
              <circle cx="13" cy="13" r="12" stroke="#DCEBFE" stroke-width="2" />
            </svg>
            <div class="flex-1 min-w-0 flex flex-col gap-[12px]">
              <div class="flex flex-col gap-[4px] text-text-brand-deep">
                <p class="font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px]">
                  {{ activeTab === 'appels-fonds'
                    ? 'Comment fonctionnent les appels de fonds ?'
                    : 'Comment fonctionnent les appels à facturation ?' }}
                </p>
                <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px]">
                  {{ activeTab === 'appels-fonds'
                    ? 'Les recharges à domicile sont automatiquement facturées à votre entreprise, puis vous êtes remboursé sans aucune démarche de votre part.'
                    : "Les recharges sur site d'entreprise sont automatiquement facturées à votre entreprise, puis vous êtes remboursé sans aucune démarche de votre part." }}
                </p>
              </div>
              <a
                href="#"
                class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-brand-deep underline-offset-2 hover:underline outline-none focus-visible:shadow-ring-gray rounded-[4px] self-start"
                @click.prevent
              >
                Voir la documentation
              </a>
            </div>
            <button
              type="button"
              class="shrink-0 flex items-center justify-center w-[36px] h-[36px] -mt-[8px] -mr-[8px] rounded-[8px] text-text-brand-deep hover:bg-black/5 transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
              aria-label="Fermer"
              @click="activeTab === 'appels-fonds' ? alertDismissedFonds = true : alertDismissedFacturation = true"
            >
              <Icon name="x-mark" variant="solid" :size="20" />
            </button>
          </div>
        </Transition>


        <!-- Filters toolbar — Figma 4832-35736: search + dropdown cluster with
             8px outer gap, 16px gap between dropdowns. Below xl: search takes
             its own full-width row, dropdowns split row 2 with flex-1 so
             everything stays visually balanced. Below sm: full vertical stack. -->
        <div class="flex flex-col xl:flex-row xl:items-center gap-[8px]">
          <div class="w-full xl:w-[311px]">
            <Input
              v-model="search"
              type="leadingIcon"
              icon="magnifying-glass"
              placeholder="Recherche"
            />
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center gap-[16px]">
            <div class="w-full sm:flex-1 xl:w-[250px] xl:flex-none">
              <Dropdown
                v-model="dateFilter"
                :items="dateItems"
                input-type="leadingIcon"
                icon="calendar"
                :searchable="false"
                placeholder="Date"
                :show-label="false"
                :show-hint="false"
              />
            </div>
            <div class="w-full sm:flex-1 xl:w-[250px] xl:flex-none">
              <Dropdown
                v-model="statusFilter"
                :items="statusItems"
                input-type="leadingIcon"
                icon="check-circle"
                :searchable="false"
                placeholder="États: Tous"
                :show-label="false"
                :show-hint="false"
              />
            </div>
          </div>
        </div>

        <!-- Export V2 banner — Factures tab only. Tooltip sits above the
             info icon. "Activer" toggles the bandeau into the active state
             (copy → "activé", CTA → "Désactiver"). -->
        <div
          v-if="activeTab === 'factures'"
          class="flex items-center gap-[16px] px-[16px] py-[16px] bg-neutral-tertiary rounded-[16px]"
        >
          <div class="flex flex-1 min-w-0 items-center gap-[8px]">
            <Icon name="arrow-down-tray" variant="solid" :size="18" class="text-icon-neutral-secondary shrink-0" />
            <p class="font-sans text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
              Export de facture V2 <span class="font-medium">{{ exportV2Active ? 'activé' : 'désactivé' }}</span>
            </p>
            <span
              tabindex="0"
              class="relative inline-flex shrink-0 outline-none rounded-[4px] focus-visible:shadow-ring-gray group/exptip"
              aria-describedby="tip-export-v2"
            >
              <Icon name="information-circle" variant="outline" :size="16" class="text-icon-neutral-secondary" />
              <span
                id="tip-export-v2"
                role="tooltip"
                class="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-30 w-max max-w-[320px] px-[12px] py-[8px] rounded-[8px] bg-text-neutral whitespace-normal flex flex-col gap-[4px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] opacity-0 -translate-y-[2px] transition-[opacity,transform] duration-150 ease-out group-hover/exptip:opacity-100 group-hover/exptip:translate-y-0 group-focus-visible/exptip:opacity-100 group-focus-visible/exptip:translate-y-0 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:size-0 after:border-l-[8px] after:border-r-[8px] after:border-t-[6px] after:border-l-transparent after:border-r-transparent after:border-t-text-neutral"
              >
                <span class="font-sans font-semibold text-[12px] leading-[1.5] tracking-[-0.36px] text-[#f1f5f9]">
                  Export de facture V2
                </span>
                <span class="font-sans font-normal text-[12px] leading-[1.5] tracking-[-0.36px] text-[#94a3b8]">
                  Permet d'exporter les rééditions, remboursements et factures à 0€.
                </span>
                <span class="font-sans font-normal text-[12px] leading-[1.5] tracking-[-0.36px] text-[#94a3b8]">
                  ⚠ <span class="font-medium">Attention</span> : les colonnes du fichier d'export changent, vos automatisations peuvent être affectées.
                </span>
              </span>
            </span>
          </div>
          <button
            type="button"
            class="shrink-0 font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-brand-deep hover:underline outline-none rounded-[4px] focus-visible:shadow-ring-brand transition-colors"
            @click="toggleExportV2"
          >
            {{ exportV2Active ? 'Désactiver' : 'Activer' }}
          </button>
        </div>

        <!-- Table / empty-state cross-fade on tab change — canonical tab-fade (see main.css). -->
        <Transition mode="out-in" name="tab-fade">
        <!-- Skeleton state — placeholder rows while data loads. Generic across
             tabs; the real table fades in once isLoading flips to false. -->
        <div
          v-if="isLoading"
          :key="`skeleton-${activeTab}`"
          class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-hidden"
        >
          <div class="flex items-stretch bg-neutral-tertiary">
            <div class="flex-1 min-w-0 px-[16px] py-[8px] min-h-[40px] flex items-center">
              <Skeleton width="60px" height="14px" />
            </div>
            <div class="w-[120px] shrink-0 px-[16px] py-[8px] min-h-[40px] flex items-center">
              <Skeleton width="70px" height="14px" />
            </div>
            <div class="flex-1 min-w-0 px-[16px] py-[8px] min-h-[40px] flex items-center">
              <Skeleton width="90px" height="14px" />
            </div>
            <div class="flex-1 min-w-0 px-[16px] py-[8px] min-h-[40px] flex items-center">
              <Skeleton width="50px" height="14px" />
            </div>
            <div class="w-[215px] shrink-0 px-[16px] py-[8px] min-h-[40px] flex items-center">
              <Skeleton width="60px" height="14px" />
            </div>
            <div class="w-[112px] shrink-0 px-[16px] py-[8px] min-h-[40px] flex items-center">
              <Skeleton width="60px" height="14px" />
            </div>
          </div>
          <div
            v-for="(row, ri) in skeletonRows"
            :key="`sk-${row}`"
            :class="[
              'flex items-stretch border-b border-border-neutral-tertiary',
              ri === skeletonRows.length - 1 ? 'border-b-0' : '',
            ]"
          >
            <div class="flex-1 min-w-0 flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <Skeleton width="180px" height="14px" />
            </div>
            <div class="w-[120px] shrink-0 flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <Skeleton width="70px" height="14px" />
            </div>
            <div class="flex-1 min-w-0 flex flex-col justify-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary gap-[6px]">
              <Skeleton width="80px" height="14px" />
              <Skeleton width="110px" height="14px" />
            </div>
            <div class="flex-1 min-w-0 flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <Skeleton width="90px" height="14px" />
            </div>
            <div class="w-[215px] shrink-0 flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <Skeleton width="110px" height="22px" rounded="9999px" />
            </div>
            <div class="w-[112px] shrink-0 flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary gap-[8px]">
              <Skeleton width="28px" height="28px" rounded="8px" />
              <Skeleton width="28px" height="28px" rounded="8px" />
            </div>
          </div>
        </div>

        <!-- Table — Factures -->
        <div
          v-else-if="activeTab === 'factures' && paginated.length > 0"
          :key="`tbl-factures-${activeTab}`"
          class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-hidden"
        >
          <div class="overflow-x-auto" style="transform: rotateX(180deg);">
          <div style="transform: rotateX(180deg);">
          <!-- Header row -->
          <div class="flex items-stretch bg-neutral-tertiary">
            <div
              v-if="exportMode"
              class="w-[48px] shrink-0 flex items-center justify-center px-[16px] py-[8px] min-h-[40px]"
            >
              <button
                type="button"
                role="checkbox"
                :aria-checked="allSelected ? 'true' : someSelected ? 'mixed' : 'false'"
                :class="[
                  'relative flex items-center justify-center w-[16px] h-[16px] rounded-[4px] border transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand',
                  allSelected || someSelected
                    ? 'bg-brand border-brand'
                    : 'bg-neutral border-border-neutral hover:border-border-neutral',
                ]"
                aria-label="Tout sélectionner"
                @click="toggleAll"
              >
                <Icon
                  v-if="allSelected"
                  name="check"
                  variant="solid"
                  :size="12"
                  class="text-white"
                />
                <span
                  v-else-if="someSelected"
                  class="w-[8px] h-[2px] rounded-[1px] bg-white"
                />
              </button>
            </div>
            <div class="flex-1 min-w-[169px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Numéro
            </div>
            <div class="flex-1 min-w-[100px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Net à payer
            </div>
            <div class="flex-1 min-w-[150px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Business unit
            </div>
            <div class="flex-1 min-w-[104px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Date
            </div>
            <div class="flex-1 min-w-[216px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              État
            </div>
            <div class="w-[112px] shrink-0 px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Actions
            </div>
          </div>

          <!-- Body rows -->
          <div
            v-for="(inv, i) in paginated"
            :key="inv.id"
            :style="{ animationDelay: `${150 + i * 20}ms` }"
            :class="[
              'group/row relative flex items-stretch anim-fade-up border-b border-border-neutral-tertiary last:border-b-0',
              openMenuId === inv.id ? 'z-30' : 'z-0',
            ]"
          >
            <!-- Checkbox cell -->
            <div
              v-if="exportMode"
              class="w-[48px] shrink-0 flex items-center justify-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary"
            >
              <button
                type="button"
                role="checkbox"
                :aria-checked="selected.has(inv.id)"
                :class="[
                  'flex items-center justify-center w-[16px] h-[16px] rounded-[4px] border transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-brand',
                  selected.has(inv.id)
                    ? 'bg-brand border-brand'
                    : 'bg-neutral border-border-neutral hover:border-border-neutral',
                ]"
                :aria-label="`Sélectionner la facture ${inv.number}`"
                @click.stop="toggleRow(inv.id)"
              >
                <Icon v-if="selected.has(inv.id)" name="check" variant="solid" :size="12" class="text-white" />
              </button>
            </div>

            <!-- Numéro -->
            <div class="flex-1 min-w-[169px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate tabular-nums">
                {{ inv.number }}
              </span>
            </div>

            <!-- Net à payer -->
            <div class="flex-1 min-w-[100px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate tabular-nums">
                {{ fmtAmount(inv.amount) }}
              </span>
            </div>

            <!-- Business unit -->
            <div class="flex-1 min-w-[150px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-brand-deep truncate">
                {{ inv.bu }}
              </span>
            </div>

            <!-- Date -->
            <div class="flex-1 min-w-[104px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums">
                {{ fmtDate(inv.date) }}
              </span>
            </div>

            <!-- État -->
            <div class="flex-1 min-w-[216px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span
                :class="[
                  'inline-flex items-center justify-center px-[10px] py-[2px] rounded-full border font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] whitespace-nowrap',
                  statusPill(inv).bg,
                  statusPill(inv).border,
                  statusPill(inv).text,
                ]"
              >
                {{ statusPill(inv).label }}
              </span>
            </div>

            <!-- Actions -->
            <div class="w-[112px] shrink-0 flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary gap-[4px] relative">
              <span class="relative inline-flex group/eye-tip">
                <button
                  type="button"
                  class="flex items-center justify-center w-[36px] h-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-tertiary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray"
                  aria-label="Voir la facture"
                  @click.stop="onViewPdf(inv)"
                >
                  <Icon name="eye" variant="outline" :size="20" />
                </button>
                <span
                  role="tooltip"
                  class="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-30 w-max px-[10px] py-[6px] rounded-[6px] bg-text-neutral whitespace-nowrap shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] opacity-0 -translate-y-[2px] transition-[opacity,transform] duration-150 ease-out group-hover/eye-tip:opacity-100 group-hover/eye-tip:translate-y-0 group-focus-visible/eye-tip:opacity-100 group-focus-visible/eye-tip:translate-y-0 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:size-0 after:border-l-[6px] after:border-r-[6px] after:border-t-[5px] after:border-l-transparent after:border-r-transparent after:border-t-text-neutral"
                >
                  <span class="font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-[#f1f5f9]">
                    Voir la facture
                  </span>
                </span>
              </span>
              <button
                type="button"
                :class="[
                  'flex items-center justify-center w-[36px] h-[36px] rounded-[8px] transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray',
                  openMenuId === inv.id
                    ? 'bg-neutral-tertiary text-icon-neutral-primary'
                    : 'text-icon-neutral-secondary hover:bg-neutral-tertiary hover:text-icon-neutral-primary',
                ]"
                aria-label="Plus d'actions"
                :aria-expanded="openMenuId === inv.id"
                aria-haspopup="menu"
                @click="toggleMenu(inv.id, $event)"
              >
                <Icon name="ellipsis-vertical" variant="outline" :size="20" />
              </button>

              <Transition
                enter-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                enter-from-class="opacity-0 scale-[0.96] -translate-y-[4px]"
                enter-to-class="opacity-100 scale-100 translate-y-0"
                leave-active-class="transition-[opacity,transform] duration-[120ms] ease-out"
                leave-from-class="opacity-100 scale-100 translate-y-0"
                leave-to-class="opacity-0 scale-[0.96] -translate-y-[4px]"
              >
                <div
                  v-if="openMenuId === inv.id"
                  class="absolute top-[calc(100%-8px)] right-[16px] z-20 origin-top-right bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg py-[8px] flex flex-col gap-[2px] min-w-[220px]"
                  role="menu"
                  @click.stop
                >
                  <div class="px-[4px] py-[2px] flex flex-col gap-[2px]">
                    <button
                      type="button"
                      role="menuitem"
                      class="w-full flex items-center p-[8px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                      @click="onDownloadFactureFormat(inv, 'csv'); closeMenus()"
                    >
                      <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                        Exporter en CSV
                      </span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      class="w-full flex items-center p-[8px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                      @click="onDownloadFactureFormat(inv, 'xlsx'); closeMenus()"
                    >
                      <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                        Exporter en XLSX
                      </span>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          </div>
          </div>

          <!-- Footer inside the card -->
          <TableFooter
            :page="page"
            :page-count="pageCount"
            :range-start="rangeStart"
            :range-end="rangeEnd"
            :total="filtered.length"
            @update:page="goto"
          />
        </div>

        <!-- Table — Appels de fonds -->
        <div
          v-else-if="activeTab === 'appels-fonds' && paginated.length > 0"
          :key="`tbl-appels-fonds-${activeTab}`"
          class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-hidden"
        >
          <div class="overflow-x-auto" style="transform: rotateX(180deg);">
          <div style="transform: rotateX(180deg);">
          <!-- Header row — column widths match Figma 4719-15530 (flex-1 + Figma min-widths). -->
          <div class="flex items-stretch bg-neutral-tertiary">
            <div class="flex-1 min-w-[235px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Numéro
            </div>
            <div class="flex-1 min-w-[100px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Net à payer
            </div>
            <div class="flex-1 min-w-[150px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
              Business unit
            </div>
            <div class="flex-1 min-w-[104px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Date
            </div>
            <div class="flex-1 min-w-[150px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
              Moyen de paiement
            </div>
            <div class="flex-1 min-w-[215px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              État
            </div>
            <div class="w-[112px] shrink-0 px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Actions
            </div>
          </div>

          <!-- Body rows -->
          <div
            v-for="(row, i) in paginated"
            :key="row.id"
            :style="{ animationDelay: `${150 + i * 20}ms` }"
            :class="[
              'group/row relative flex items-stretch anim-fade-up border-b border-border-neutral-tertiary last:border-b-0',
              openMenuId === row.id ? 'z-30' : 'z-0',
            ]"
          >
            <div class="flex-1 min-w-[235px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate tabular-nums">
                {{ row.number }}
              </span>
            </div>
            <div class="flex-1 min-w-[100px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate tabular-nums">
                {{ fmtAmount(row.amount) }}
              </span>
            </div>
            <div class="flex-1 min-w-[150px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-brand-deep truncate">
                {{ row.bu }}
              </span>
            </div>
            <div class="flex-1 min-w-[104px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums">
                {{ fmtDate(row.date) }}
              </span>
            </div>
            <div class="flex-1 min-w-[150px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                {{ isDemand(row) ? row.paymentMethod : '' }}
              </span>
            </div>
            <div class="flex-1 min-w-[215px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span
                :class="[
                  'inline-flex items-center justify-center px-[10px] py-[2px] rounded-full border font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] whitespace-nowrap',
                  statusPill(row).bg,
                  statusPill(row).border,
                  statusPill(row).text,
                ]"
              >
                {{ statusPill(row).label }}
              </span>
            </div>
            <div class="w-[112px] shrink-0 flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary gap-[4px] relative">
              <span class="relative inline-flex group/dl-tip">
                <button
                  type="button"
                  class="flex items-center justify-center w-[36px] h-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-tertiary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray"
                  aria-label="Télécharger l'archive"
                  @click.stop="onDownload(row)"
                >
                  <Icon name="arrow-down-tray" variant="outline" :size="20" />
                </button>
                <span
                  role="tooltip"
                  class="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-30 w-max px-[10px] py-[6px] rounded-[6px] bg-text-neutral whitespace-nowrap shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] opacity-0 -translate-y-[2px] transition-[opacity,transform] duration-150 ease-out group-hover/dl-tip:opacity-100 group-hover/dl-tip:translate-y-0 group-focus-visible/dl-tip:opacity-100 group-focus-visible/dl-tip:translate-y-0 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:size-0 after:border-l-[6px] after:border-r-[6px] after:border-t-[5px] after:border-l-transparent after:border-r-transparent after:border-t-text-neutral"
                >
                  <span class="font-sans font-medium text-[12px] leading-[1.5] tracking-[-0.36px] text-[#f1f5f9]">
                    Télécharger l'archive
                  </span>
                </span>
              </span>
              <button
                type="button"
                :class="[
                  'flex items-center justify-center w-[36px] h-[36px] rounded-[8px] transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray',
                  openMenuId === row.id
                    ? 'bg-neutral-tertiary text-icon-neutral-primary'
                    : 'text-icon-neutral-secondary hover:bg-neutral-tertiary hover:text-icon-neutral-primary',
                ]"
                aria-label="Plus d'actions"
                :aria-expanded="openMenuId === row.id"
                aria-haspopup="menu"
                @click="toggleMenu(row.id, $event)"
              >
                <Icon name="ellipsis-vertical" variant="outline" :size="20" />
              </button>

              <Transition
                enter-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                enter-from-class="opacity-0 scale-[0.96] -translate-y-[4px]"
                enter-to-class="opacity-100 scale-100 translate-y-0"
                leave-active-class="transition-[opacity,transform] duration-[120ms] ease-out"
                leave-from-class="opacity-100 scale-100 translate-y-0"
                leave-to-class="opacity-0 scale-[0.96] -translate-y-[4px]"
              >
                <div
                  v-if="openMenuId === row.id"
                  class="absolute top-[calc(100%-8px)] right-[16px] z-20 origin-top-right bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg py-[8px] flex flex-col gap-[2px] min-w-[240px]"
                  role="menu"
                  @click.stop
                >
                  <div class="px-[4px] py-[2px] flex flex-col gap-[2px]">
                    <button
                      type="button"
                      role="menuitem"
                      class="w-full flex items-center p-[8px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                      @click="onViewNotesFrais(row); closeMenus()"
                    >
                      <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                        Voir les notes de frais
                      </span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      class="w-full flex items-center p-[8px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                      @click="onViewRecharges(row); closeMenus()"
                    >
                      <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                        Voir les recharges
                      </span>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          </div>
          </div>

          <!-- Footer inside the card -->
          <TableFooter
            :page="page"
            :page-count="pageCount"
            :range-start="rangeStart"
            :range-end="rangeEnd"
            :total="filtered.length"
            @update:page="goto"
          />
        </div>

        <!-- Table — Notes de frais — Figma 4815-6419. Column widths flex-1 +
             Figma min-widths (Numéro/Conducteur 250, Net à payer 150, Date
             104, Période 192, État 216 ; Actions w-[112]). The Numéro cell
             stacks the number on top and the driver name in secondary. -->
        <div
          v-else-if="activeTab === 'notes-frais' && paginated.length > 0"
          :key="`tbl-notes-frais-${activeTab}`"
          class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-hidden"
        >
          <div class="overflow-x-auto" style="transform: rotateX(180deg);">
          <div style="transform: rotateX(180deg);">
          <!-- Header row -->
          <div class="flex items-stretch bg-neutral-tertiary">
            <div class="flex-1 min-w-[250px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Numéro / Conducteur
            </div>
            <div class="flex-1 min-w-[150px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Net à payer
            </div>
            <div class="flex-1 min-w-[104px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Date
            </div>
            <div class="flex-1 min-w-[192px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Période
            </div>
            <div class="flex-1 min-w-[150px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              État
            </div>
            <div class="w-[112px] shrink-0 px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Actions
            </div>
          </div>

          <!-- Body rows -->
          <div
            v-for="(row, i) in paginated"
            :key="row.id"
            :style="{ animationDelay: `${150 + i * 20}ms` }"
            :class="[
              'group/row relative flex items-stretch anim-fade-up border-b border-border-neutral-tertiary last:border-b-0',
              openMenuId === row.id ? 'z-30' : 'z-0',
            ]"
          >
            <!-- Numéro / Conducteur -->
            <div class="flex-1 min-w-[250px] flex flex-col justify-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary gap-0">
              <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate tabular-nums">
                {{ row.number }}
              </span>
              <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
                {{ isNote(row) ? row.driver : '' }}
              </span>
            </div>
            <!-- Net à payer -->
            <div class="flex-1 min-w-[150px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate tabular-nums">
                {{ fmtAmount(row.amount) }}
              </span>
            </div>
            <!-- Date -->
            <div class="flex-1 min-w-[104px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums">
                {{ fmtDate(row.date) }}
              </span>
            </div>
            <!-- Période -->
            <div class="flex-1 min-w-[192px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate">
                {{ isNote(row) ? row.period : '' }}
              </span>
            </div>
            <!-- État -->
            <div class="flex-1 min-w-[150px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span
                :class="[
                  'inline-flex items-center justify-center px-[10px] py-[2px] rounded-full border font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] whitespace-nowrap',
                  statusPill(row).bg,
                  statusPill(row).border,
                  statusPill(row).text,
                ]"
              >
                {{ statusPill(row).label }}
              </span>
            </div>
            <!-- Actions — only the kebab here per Figma 5531-7418. -->
            <div class="w-[112px] shrink-0 flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary gap-[4px] relative">
              <button
                type="button"
                :class="[
                  'flex items-center justify-center w-[36px] h-[36px] rounded-[8px] transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray',
                  openMenuId === row.id
                    ? 'bg-neutral-tertiary text-icon-neutral-primary'
                    : 'text-icon-neutral-secondary hover:bg-neutral-tertiary hover:text-icon-neutral-primary',
                ]"
                aria-label="Plus d'actions"
                :aria-expanded="openMenuId === row.id"
                aria-haspopup="menu"
                @click="toggleMenu(row.id, $event)"
              >
                <Icon name="ellipsis-vertical" variant="outline" :size="20" />
              </button>

              <Transition
                enter-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                enter-from-class="opacity-0 scale-[0.96] -translate-y-[4px]"
                enter-to-class="opacity-100 scale-100 translate-y-0"
                leave-active-class="transition-[opacity,transform] duration-[120ms] ease-out"
                leave-from-class="opacity-100 scale-100 translate-y-0"
                leave-to-class="opacity-0 scale-[0.96] -translate-y-[4px]"
              >
                <div
                  v-if="openMenuId === row.id"
                  class="absolute top-[calc(100%-8px)] right-[16px] z-20 origin-top-right bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg py-[8px] flex flex-col gap-[2px] min-w-[240px]"
                  role="menu"
                  @click.stop
                >
                  <div class="px-[4px] py-[2px] flex flex-col gap-[2px]">
                    <button
                      type="button"
                      role="menuitem"
                      class="w-full flex items-center p-[8px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                      @click="onViewRecharges(row); closeMenus()"
                    >
                      <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                        Voir les recharges
                      </span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      class="w-full flex items-center p-[8px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                      @click="onViewAppelDeFonds(row); closeMenus()"
                    >
                      <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                        Voir l'appel de fonds
                      </span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      class="w-full flex items-center p-[8px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                      @click="onExportNoteCsv(row); closeMenus()"
                    >
                      <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                        Exporter en CSV
                      </span>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          </div>
          </div>

          <!-- Footer inside the card -->
          <TableFooter
            :page="page"
            :page-count="pageCount"
            :range-start="rangeStart"
            :range-end="rangeEnd"
            :total="filtered.length"
            @update:page="goto"
          />
        </div>

        <!-- Table — Appels à facturation -->
        <div
          v-else-if="activeTab === 'appels-facturation' && paginated.length > 0"
          :key="`tbl-appels-facturation-${activeTab}`"
          class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm overflow-hidden"
        >
          <div class="overflow-x-auto" style="transform: rotateX(180deg);">
          <div style="transform: rotateX(180deg);">
          <!-- Header row — column widths match Figma 4815-8482 (flex-1 + Figma min-widths). -->
          <div class="flex items-stretch bg-neutral-tertiary">
            <div class="flex-1 min-w-[100px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Numéro
            </div>
            <div class="flex-1 min-w-[100px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Net à payer
            </div>
            <div class="flex-1 min-w-[150px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary truncate">
              Business unit
            </div>
            <div class="flex-1 min-w-[104px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Date
            </div>
            <div class="flex-1 min-w-[150px] px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              État
            </div>
            <div class="w-[112px] shrink-0 px-[16px] py-[8px] min-h-[40px] flex items-center font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary bg-neutral-tertiary">
              Actions
            </div>
          </div>

          <!-- Body rows -->
          <div
            v-for="(row, i) in paginated"
            :key="row.id"
            :style="{ animationDelay: `${150 + i * 20}ms` }"
            :class="[
              'group/row relative flex items-stretch anim-fade-up border-b border-border-neutral-tertiary last:border-b-0',
              openMenuId === row.id ? 'z-30' : 'z-0',
            ]"
          >
            <div class="flex-1 min-w-[100px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate tabular-nums">
                {{ row.number }}
              </span>
            </div>
            <div class="flex-1 min-w-[100px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-semibold text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral truncate tabular-nums">
                {{ fmtAmount(row.amount) }}
              </span>
            </div>
            <div class="flex-1 min-w-[150px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-brand-deep truncate">
                {{ row.bu }}
              </span>
            </div>
            <div class="flex-1 min-w-[104px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral tabular-nums">
                {{ fmtDate(row.date) }}
              </span>
            </div>
            <div class="flex-1 min-w-[150px] flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary">
              <span
                :class="[
                  'inline-flex items-center justify-center px-[10px] py-[2px] rounded-full border font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] whitespace-nowrap',
                  statusPill(row).bg,
                  statusPill(row).border,
                  statusPill(row).text,
                ]"
              >
                {{ statusPill(row).label }}
              </span>
            </div>
            <div class="w-[112px] shrink-0 flex items-center px-[16px] py-[12px] min-h-[64px] transition-colors duration-150 ease-out group-hover/row:bg-neutral-secondary gap-[4px] relative">
              <button
                type="button"
                class="flex items-center justify-center w-[36px] h-[36px] rounded-[8px] text-icon-neutral-secondary hover:bg-neutral-tertiary hover:text-icon-neutral-primary transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray"
                aria-label="Voir le PDF"
                @click.stop="onViewPdf(row)"
              >
                <Icon name="eye" variant="outline" :size="20" />
              </button>
              <button
                type="button"
                :class="[
                  'flex items-center justify-center w-[36px] h-[36px] rounded-[8px] transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.95] outline-none focus-visible:shadow-ring-gray',
                  openMenuId === row.id
                    ? 'bg-neutral-tertiary text-icon-neutral-primary'
                    : 'text-icon-neutral-secondary hover:bg-neutral-tertiary hover:text-icon-neutral-primary',
                ]"
                aria-label="Plus d'actions"
                :aria-expanded="openMenuId === row.id"
                aria-haspopup="menu"
                @click="toggleMenu(row.id, $event)"
              >
                <Icon name="ellipsis-vertical" variant="outline" :size="20" />
              </button>

              <Transition
                enter-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                enter-from-class="opacity-0 scale-[0.96] -translate-y-[4px]"
                enter-to-class="opacity-100 scale-100 translate-y-0"
                leave-active-class="transition-[opacity,transform] duration-[120ms] ease-out"
                leave-from-class="opacity-100 scale-100 translate-y-0"
                leave-to-class="opacity-0 scale-[0.96] -translate-y-[4px]"
              >
                <div
                  v-if="openMenuId === row.id"
                  class="absolute top-[calc(100%-8px)] right-[16px] z-20 origin-top-right bg-neutral border border-border-neutral-tertiary rounded-[8px] shadow-lg py-[8px] flex flex-col gap-[2px] min-w-[200px]"
                  role="menu"
                  @click.stop
                >
                  <div class="px-[4px] py-[2px]">
                    <button
                      type="button"
                      role="menuitem"
                      class="w-full flex items-center gap-[8px] p-[8px] rounded-[8px] text-left hover:bg-neutral-secondary transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
                      @click="onDownload(row); closeMenus()"
                    >
                      <Icon name="arrow-down-tray" variant="outline" :size="16" class="shrink-0 text-icon-neutral-secondary" />
                      <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral whitespace-nowrap">
                        Télécharger l'appel
                      </span>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          </div>
          </div>

          <!-- Footer inside the card -->
          <TableFooter
            :page="page"
            :page-count="pageCount"
            :range-start="rangeStart"
            :range-end="rangeEnd"
            :total="filtered.length"
            @update:page="goto"
          />
        </div>

        <!-- Empty / coming-soon state -->
        <div
          v-else
          :key="`empty-${activeTab}`"
          class="bg-neutral border border-border-neutral-secondary rounded-[16px] shadow-sm p-[48px] flex flex-col items-center justify-center gap-[16px] text-center"
        >
          <template v-if="activeTab === 'factures'">
            <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
              Aucune facture
            </p>
            <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
              Aucune facture ne correspond à vos filtres.
            </p>
          </template>
          <template v-else-if="activeTab === 'appels-fonds'">
            <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
              Aucun appel de fonds
            </p>
            <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
              Aucun appel de fonds ne correspond à vos filtres.
            </p>
          </template>
          <template v-else-if="activeTab === 'appels-facturation'">
            <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
              Aucun appel à facturation
            </p>
            <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
              Aucun appel à facturation ne correspond à vos filtres.
            </p>
          </template>
          <template v-else-if="activeTab === 'notes-frais'">
            <img
              src="@/assets/illustrations/notes-frais-empty.svg"
              alt=""
              width="200"
              height="200"
              class="block select-none pointer-events-none"
            />
            <div class="flex flex-col items-center gap-[4px]">
              <p class="font-sans font-semibold text-[16px] leading-[1.5] tracking-[-0.48px] text-text-neutral">
                Aucune note de frais
              </p>
              <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
                Aucune note de frais à afficher ici pour le moment
              </p>
            </div>
          </template>
          <template v-else>
            <p class="font-sans font-semibold text-[18px] leading-[1.5] tracking-[-0.54px] text-text-neutral">
              Bientôt disponible
            </p>
            <p class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-text-neutral-secondary">
              Cette section est en cours de préparation.
            </p>
          </template>
        </div>
        </Transition>
      </div>

      <div class="h-[60px]" />
    </div>

    <!-- Floating bulk action bar -->
    <Transition
      enter-active-class="transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
      enter-from-class="opacity-0 translate-y-[12px]"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-[12px]"
    >
      <div
        v-if="activeTab === 'factures' && exportMode && selected.size > 0"
        class="fixed bottom-[32px] left-1/2 -translate-x-1/2 z-40 w-[min(640px,calc(100vw-64px))] bg-[#020408] border border-[#344256] rounded-[8px] shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] flex items-center justify-between p-[16px]"
        role="status"
        @click.stop
      >
        <div class="flex items-center gap-[4px]">
          <span class="font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-[#f1f5f9] tabular-nums">
            {{ selected.size }}
          </span>
          <span class="font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-[#f1f5f9]">
            élément{{ selected.size > 1 ? 's' : '' }}
          </span>
          <button
            type="button"
            class="ml-[4px] flex items-center justify-center w-[22px] h-[22px] rounded-[4px] text-[#94a3b8] hover:bg-white/10 hover:text-[#f1f5f9] transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
            aria-label="Annuler la sélection"
            @click="exitExportMode"
          >
            <Icon name="x-mark" variant="solid" :size="18" />
          </button>
        </div>
        <!-- Inline format buttons. "Exporter en:" prefix hides under sm; on tiny
             viewports only the 3 format buttons remain. -->
        <div class="flex items-center gap-[8px] min-w-0">
          <span class="hidden sm:inline font-sans font-normal text-[14px] leading-[1.5] tracking-[-0.42px] text-[#f1f5f9] whitespace-nowrap">
            Exporter en :
          </span>
          <div class="flex items-center gap-[2px]">
            <button
              type="button"
              class="inline-flex items-center justify-center px-[10px] py-[6px] rounded-[6px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-[#f1f5f9] hover:bg-white/10 active:bg-white/15 transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
              @click="onExportSelection('csv')"
            >
              CSV
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center px-[10px] py-[6px] rounded-[6px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-[#f1f5f9] hover:bg-white/10 active:bg-white/15 transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
              @click="onExportSelection('xlsx')"
            >
              Excel
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center px-[10px] py-[6px] rounded-[6px] font-sans font-medium text-[14px] leading-[1.5] tracking-[-0.42px] text-[#f1f5f9] hover:bg-white/10 active:bg-white/15 transition-colors duration-150 ease-out outline-none focus-visible:shadow-ring-gray"
              @click="onExportSelection('pdf')"
            >
              PDF
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
