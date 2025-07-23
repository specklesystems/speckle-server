import type { PaidWorkspacePlans, WorkspacePlanBillingIntervals } from '@speckle/shared'

export type WorkspacePricingProducts = PaidWorkspacePlans

export const Currency = {
  usd: 'usd',
  gbp: 'gbp'
} as const

type IntervalPrices = Record<
  WorkspacePlanBillingIntervals,
  { amount: number; currency: string }
>

export type WorkspacePlanProductPrices = Record<
  Currency,
  Record<PaidWorkspacePlans, IntervalPrices>
>

export type Currency = (typeof Currency)[keyof typeof Currency]
