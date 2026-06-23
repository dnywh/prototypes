import type { Standup } from './types'

import { liveQueryCount } from './queries'

export const standup: Standup = {
  date: 'Monday, Jun 22',
  paragraphs: [
    [
      { text: "You're " },
      { text: 'ahead', tone: 'positive' },
      { text: ' on GMV. ' },
      {
        text: 'Cumulative revenue is 4% above linear target pace',
        citation: { ref: 1, queryId: 'gmv_vs_target_daily' },
      },
      { text: '.' },
    ],
    [
      { text: 'Home & Garden supply is ' },
      { text: 'thinning', tone: 'warning' },
      { text: ': listings per buyer ' },
      {
        text: 'dropped',
        tone: 'warning',
        citation: { ref: 2, queryId: 'category_supply_demand_ratio' },
      },
      { text: ' to 0.6, and repeat buyers are ' },
      {
        text: 'abandoning',
        tone: 'danger',
        citation: { ref: 3, queryId: 'search_to_purchase_funnel' },
      },
      { text: ' after two searches.' },
    ],
    [
      { text: 'Three sellers are ' },
      {
        text: 'stuck',
        tone: 'warning',
        citation: { ref: 4, queryId: 'seller_onboarding_funnel' },
      },
      { text: ' in onboarding past 48 hours. Disputes remain ' },
      {
        text: 'stable',
        tone: 'positive',
        citation: { ref: 5, queryId: 'dispute_rate_rolling_7d' },
      },
      { text: ' at 1.4%.' },
    ],
  ],
  meta: {
    confidence: 'high',
    queryCount: liveQueryCount,
  },
}
