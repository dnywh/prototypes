import type { DataSource } from './types'

export const sources: DataSource[] = [
  {
    id: 'orders',
    label: 'orders',
    type: 'postgres',
    connection: 'in-warehouse',
    detail: 'public.orders · 847M rows',
  },
  {
    id: 'listings',
    label: 'listings',
    type: 'postgres',
    connection: 'in-warehouse',
    detail: 'public.listings · 12.1M rows',
  },
  {
    id: 'sellers',
    label: 'sellers',
    type: 'postgres',
    connection: 'in-warehouse',
    detail: 'public.sellers · 284k rows',
  },
  {
    id: 'search_events',
    label: 'search_events',
    type: 'postgres',
    connection: 'in-warehouse',
    detail: 'public.search_events · 89M rows',
  },
  {
    id: 'stripe',
    label: 'Stripe Connect',
    type: 'fdw',
    connection: 'attached',
    detail: 'payouts, fees, chargebacks',
  },
  {
    id: 'shipping',
    label: 'Shipping API',
    type: 'external',
    connection: 'external-feed',
    detail: 'delivery SLA, carrier delays',
  },
  {
    id: 'fraud',
    label: 'Fraud signals',
    type: 'external',
    connection: 'external-feed',
    detail: 'risk scores on new sellers',
  },
]

export const connectionLabel: Record<DataSource['connection'], string> = {
  'in-warehouse': 'In Warehouse',
  attached: 'Attached',
  'external-feed': 'External feed',
}

export function getSource(id: string): DataSource | undefined {
  return sources.find((s) => s.id === id)
}
