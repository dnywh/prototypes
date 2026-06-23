import type { WarehouseStats } from './types'

import { liveQueryCount } from './queries'

export const warehouseStats: WarehouseStats = {
  queryCount: liveQueryCount,
  rowCount: '847M',
  p95LatencyMs: 120,
}
