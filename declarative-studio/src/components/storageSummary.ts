import type { Resource, WarehouseState } from '../model/types'

/** Short storage qualifier for list rows and resource headers. */
export function storageSummaryLabel(warehouse?: WarehouseState): string | null {
  if (!warehouse || warehouse.state === 'none') return null
  if (warehouse.state === 'attached') return 'Copy'
  return 'Moved'
}

export function storageSummaryForResource(resource: Resource): string | null {
  if (resource.kind !== 'table') return null
  return storageSummaryLabel(resource.data?.warehouse)
}
