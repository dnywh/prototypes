import type { PaletteAnswer } from './types'

export const paletteAnswers: PaletteAnswer[] = [
  {
    id: 'eu-conversion',
    triggers: ['eu', 'conversion', 'europe'],
    question: 'Why is EU conversion down?',
    answer:
      'EU checkout conversion dropped from 4.2% to 2.9% over 12 weeks. The primary driver is shipping SLA: carrier delays in DE/FR corridors increased 40%, and abandoned carts correlate strongly with estimated delivery over 7 days.',
    evidence: [
      { text: 'EU conversion down 31% over 12 weeks', queryId: 'eu_conversion' },
      { text: 'Abandoned carts correlate with delivery over 7 days', queryId: 'eu_conversion' },
      { text: 'DE/FR carrier delays up 40%', queryId: 'eu_conversion' },
    ],
    confidence: 'high',
    queryIds: ['eu_conversion'],
  },
  {
    id: 'home-garden',
    triggers: ['home', 'garden', 'supply', 'undersupplied'],
    question: 'Why is Home & Garden undersupplied?',
    answer:
      "Search demand grew 18% while active listings per buyer fell to 0.6. Sellers in adjacent categories haven't migrated, and 290 repeat buyers searched 2+ times without purchasing this week.",
    evidence: [
      { text: 'Search demand up 18%', queryId: 'search_demand_trend' },
      { text: 'Listings per buyer at 0.6 (target 1.0)', queryId: 'category_supply_demand_ratio' },
      {
        text: '290 repeat buyers abandoned after 2 searches',
        queryId: 'search_to_purchase_funnel',
      },
    ],
    confidence: 'high',
    queryIds: ['search_demand_trend', 'category_supply_demand_ratio', 'search_to_purchase_funnel'],
  },
  {
    id: 'onboarding',
    triggers: ['onboarding', 'seller', '48'],
    question: "What's blocking seller onboarding?",
    answer:
      'Identity verification is the bottleneck. p95 time-to-first-sale is 51h. Three sellers completed onboarding in under 24h but were flagged with elevated fraud scores, suggesting the fast-track path needs review.',
    evidence: [
      { text: 'p95 onboarding at 51h', queryId: 'seller_onboarding_funnel' },
      { text: '3 fast-track sellers with risk score > 0.7', queryId: 'fraud_flag_correlation' },
    ],
    confidence: 'high',
    queryIds: ['seller_onboarding_funnel', 'fraud_flag_correlation'],
  },
]

export function findPaletteAnswer(query: string): PaletteAnswer | undefined {
  const lower = query.toLowerCase()
  return paletteAnswers.find((a) => a.triggers.some((t) => lower.includes(t)))
}
