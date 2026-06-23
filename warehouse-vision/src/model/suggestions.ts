import type { Suggestion } from './types'

export const suggestions: Suggestion[] = [
  {
    id: 'recruit-hg-sellers',
    goalId: 'home-garden',
    action: 'Recruit 12 Home & Garden sellers',
    evidence: [
      { text: 'Search demand up 18%', queryId: 'search_demand_trend' },
      { text: 'Listings per buyer down to 0.6', queryId: 'category_supply_demand_ratio' },
      { text: 'Repeat buyers abandoning after 2 searches', queryId: 'search_to_purchase_funnel' },
    ],
    queryIds: [
      'search_demand_trend',
      'category_supply_demand_ratio',
      'search_to_purchase_funnel',
      'gmv_vs_target_daily',
    ],
    confidence: 'high',
  },
  {
    id: 'fix-onboarding-verification',
    goalId: 'onboarding',
    action: 'Prioritize verification queue (3 sellers past 48h)',
    evidence: [
      { text: 'p95 onboarding time at 51h (target 48h)', queryId: 'seller_onboarding_funnel' },
      {
        text: '3 fast-track sellers flagged with elevated risk',
        queryId: 'fraud_flag_correlation',
      },
    ],
    queryIds: ['seller_onboarding_funnel', 'fraud_flag_correlation'],
    confidence: 'high',
  },
  {
    id: 'eu-shipping-sla',
    goalId: 'gmv',
    action: 'Review EU shipping SLA (conversion down 31%)',
    evidence: [
      { text: 'EU checkout conversion fell to 2.9%', queryId: 'eu_conversion' },
      { text: 'Carrier delays up 40% in DE/FR corridors', queryId: 'eu_conversion' },
    ],
    queryIds: ['eu_conversion', 'gmv_vs_target_daily'],
    confidence: 'medium',
  },
]

export function getSuggestionForGoal(goalId: string): Suggestion | undefined {
  return suggestions.find((s) => s.goalId === goalId)
}
