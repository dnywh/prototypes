import type { LiveQuery } from './types'

export const queries: LiveQuery[] = [
  {
    id: 'gmv_vs_target_daily',
    label: 'GMV vs target (daily)',
    goalId: 'gmv',
    timeWindow: 'Last 90 days',
    tables: ['orders'],
    sql: `SELECT date_trunc('day', created_at) AS day,
       sum(amount_cents) / 100.0 AS gmv,
       166666.67 AS daily_target
FROM orders
WHERE status = 'completed'
GROUP BY 1
ORDER BY 1;`,
    latencyMs: 94,
    rowCount: '847M',
    sparkline: [120, 128, 135, 142, 148, 155, 162, 168, 175, 182, 188, 195],
    insight: 'Cumulative GMV is 4% ahead of linear target pace.',
    sentiment: 'positive',
  },
  {
    id: 'seller_onboarding_funnel',
    label: 'Seller onboarding funnel',
    goalId: 'onboarding',
    timeWindow: 'Last 30 days',
    tables: ['sellers'],
    sql: `SELECT stage,
       percentile_cont(0.95) WITHIN GROUP (ORDER BY hours) AS p95_hours
FROM seller_onboarding_events
GROUP BY stage;`,
    latencyMs: 112,
    rowCount: '12.4M',
    sparkline: [38, 40, 42, 44, 45, 47, 48, 49, 50, 51, 51, 51],
    insight: 'p95 time-to-first-sale crept above 48h. Verification step is the bottleneck.',
    sentiment: 'warning',
  },
  {
    id: 'category_supply_demand_ratio',
    label: 'Listings per active buyer by category',
    goalId: 'home-garden',
    timeWindow: 'Last 12 weeks',
    tables: ['listings', 'search_events'],
    sql: `SELECT category,
       count(DISTINCT listings.id)::float / nullif(count(DISTINCT buyers.id), 0) AS ratio
FROM listings
JOIN search_events ON search_events.category = listings.category
GROUP BY category
HAVING category = 'Home & Garden';`,
    latencyMs: 87,
    rowCount: '234M',
    sparkline: [0.9, 0.88, 0.85, 0.82, 0.78, 0.74, 0.7, 0.66, 0.64, 0.62, 0.61, 0.6],
    insight: 'Home & Garden ratio fell to 0.6. Undersupplied vs 1.0 target.',
    sentiment: 'warning',
  },
  {
    id: 'search_to_purchase_funnel',
    label: 'Search-to-purchase funnel',
    goalId: 'home-garden',
    timeWindow: 'Last 7 days',
    tables: ['search_events'],
    sql: `SELECT buyer_id,
       count(*) FILTER (WHERE event = 'search') AS searches,
       count(*) FILTER (WHERE event = 'purchase') AS purchases
FROM search_events
WHERE category = 'Home & Garden'
GROUP BY buyer_id
HAVING count(*) FILTER (WHERE event = 'search') >= 2
   AND count(*) FILTER (WHERE event = 'purchase') = 0;`,
    latencyMs: 103,
    rowCount: '89M',
    sparkline: [120, 135, 148, 162, 178, 195, 210, 228, 245, 260, 275, 290],
    insight: 'Repeat buyers abandoning after 2+ searches without purchase. Up 22% WoW.',
    sentiment: 'danger',
  },
  {
    id: 'search_demand_trend',
    label: 'Search demand trend (H&G)',
    goalId: 'home-garden',
    timeWindow: 'Last 12 weeks',
    tables: ['search_events'],
    sql: `SELECT date_trunc('week', created_at) AS week,
       count(*) AS searches
FROM search_events
WHERE category = 'Home & Garden'
GROUP BY 1
ORDER BY 1;`,
    latencyMs: 76,
    rowCount: '89M',
    sparkline: [100, 105, 108, 112, 115, 118, 122, 128, 132, 138, 142, 118],
    insight: 'Search demand up 18% over the last 4 weeks.',
    sentiment: 'positive',
  },
  {
    id: 'dispute_rate_rolling_7d',
    label: 'Dispute rate (7-day rolling)',
    goalId: 'disputes',
    timeWindow: 'Last 30 days',
    tables: ['orders'],
    sql: `SELECT date_trunc('day', created_at) AS day,
       count(*) FILTER (WHERE status = 'disputed')::float
         / nullif(count(*), 0) * 100 AS dispute_pct
FROM orders
GROUP BY 1
ORDER BY 1;`,
    latencyMs: 98,
    rowCount: '847M',
    sparkline: [1.8, 1.7, 1.6, 1.55, 1.5, 1.48, 1.45, 1.42, 1.4, 1.38, 1.4, 1.4],
    insight: 'Dispute rate stable at 1.4%. Well under 2% target.',
    sentiment: 'positive',
  },
  {
    id: 'fraud_flag_correlation',
    label: 'Fast-track sellers with elevated risk',
    goalId: 'onboarding',
    timeWindow: 'Last 14 days',
    tables: ['sellers', 'fraud'],
    sql: `SELECT s.id, s.created_at, f.risk_score
FROM sellers s
JOIN fraud_signals f ON f.seller_id = s.id
WHERE s.onboarding_hours < 24
  AND f.risk_score > 0.7;`,
    latencyMs: 145,
    rowCount: '3.2M',
    sparkline: [2, 3, 2, 4, 3, 5, 4, 3, 4, 5, 3, 4],
    insight: '3 sellers completed onboarding in < 24h with elevated fraud scores.',
    sentiment: 'warning',
  },
  {
    id: 'eu_conversion',
    label: 'EU checkout conversion',
    goalId: 'gmv',
    timeWindow: 'Last 12 weeks',
    tables: ['search_events', 'shipping'],
    sql: `SELECT date_trunc('week', created_at) AS week,
       count(*) FILTER (WHERE event = 'checkout_complete')::float
         / nullif(count(*) FILTER (WHERE event = 'checkout_start'), 0) AS conversion
FROM search_events
WHERE region = 'EU'
GROUP BY 1;`,
    latencyMs: 118,
    rowCount: '156M',
    sparkline: [4.2, 4.1, 3.9, 3.8, 3.6, 3.5, 3.4, 3.3, 3.2, 3.1, 3.0, 2.9],
    insight: 'EU checkout conversion down 31% over 12 weeks. Shipping SLA is the driver.',
    sentiment: 'warning',
  },
]

export const liveQueryCount = queries.length

export function getQueriesForGoal(goalId: string): LiveQuery[] {
  return queries.filter((q) => q.goalId === goalId)
}

export function getQuery(id: string): LiveQuery | undefined {
  return queries.find((q) => q.id === id)
}

export function getSourceIdsForQueries(queryIds: string[]): string[] {
  const ids = new Set<string>()
  for (const queryId of queryIds) {
    const query = getQuery(queryId)
    query?.tables.forEach((tableId) => ids.add(tableId))
  }
  return [...ids]
}

export const allQueryIds = queries.map((q) => q.id)
