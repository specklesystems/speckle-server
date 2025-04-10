import { PaidWorkspacePlans, WorkspacePlanBillingIntervals } from '@speckle/shared'

/**
 * This includes the pricing plans (Stripe products) a customer can sub to
 */
export type WorkspacePricingProducts = PaidWorkspacePlans | 'guest'

type WorkspacePlanProductsMetadata<PriceData = string> = Record<
  WorkspacePricingProducts,
  Record<WorkspacePlanBillingIntervals, PriceData> & {
    productId: string
  }
>

export type WorkspacePlanProductAndPriceIds = WorkspacePlanProductsMetadata<string>
export type WorkspacePlanProductPrices = WorkspacePlanProductsMetadata<{
  amount: number
  currency: string
}>
