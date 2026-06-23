import type { Goal } from './types'

export const goals: Goal[] = [
  {
    id: 'gmv',
    label: 'Hit $2M GMV by Q4',
    target: '$2.0M',
    current: '$1.42M run-rate',
    status: 'ahead',
    sparkline: [62, 65, 68, 71, 74, 76, 78, 80, 82, 84, 86, 88],
    progress: 88,
  },
  {
    id: 'onboarding',
    label: 'Seller onboarding < 48h',
    target: 'p95 < 48h',
    current: 'p95 = 51h',
    status: 'at-risk',
    sparkline: [42, 44, 45, 46, 48, 49, 50, 51, 51, 52, 51, 51],
    progress: 62,
  },
  {
    id: 'home-garden',
    label: 'Balance Home & Garden supply',
    target: '1.0 listings/buyer',
    current: '0.6 listings/buyer',
    status: 'at-risk',
    sparkline: [0.9, 0.88, 0.85, 0.82, 0.78, 0.74, 0.7, 0.66, 0.64, 0.62, 0.61, 0.6],
    progress: 45,
  },
  {
    id: 'disputes',
    label: 'Dispute rate < 2%',
    target: '< 2%',
    current: '1.4%',
    status: 'on-track',
    sparkline: [1.8, 1.7, 1.6, 1.55, 1.5, 1.48, 1.45, 1.42, 1.4, 1.38, 1.4, 1.4],
    progress: 72,
  },
]

export function getGoal(id: string): Goal | undefined {
  return goals.find((g) => g.id === id)
}
