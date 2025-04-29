import {
  PaidWorkspacePlansOld,
  PaidWorkspacePlansNew,
  WorkspacePlanBillingIntervals
} from '@speckle/shared'

/**
 * This includes the pricing plans (Stripe products) a customer can sub to
//  */
export type WorkspacePricingProducts =
  | PaidWorkspacePlansNew
  | PaidWorkspacePlansOld
  | 'guest'

// type WorkspacePlanProductsMetadata<PriceData = string> = Record<
//   WorkspacePricingProducts,
//   Record<WorkspacePlanBillingIntervals, PriceData> & {
//     productId: string
//   }
// >

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

// export type WorkspacePlanProductAndPriceIds = WorkspacePlanProductsMetadata<string>
// export type WorkspacePlanProductPrices = WorkspacePlanProductsMetadata<{
//   amount: number
//   currency: string
// }>
