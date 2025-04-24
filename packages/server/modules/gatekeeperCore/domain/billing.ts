import { PaidWorkspacePlansNew, WorkspacePlanBillingIntervals } from '@speckle/shared'

export type WorkspacePricingProducts = PaidWorkspacePlansNew

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
  Record<PaidWorkspacePlansNew, IntervalPrices>
>

export type Currency = (typeof Currency)[keyof typeof Currency]
