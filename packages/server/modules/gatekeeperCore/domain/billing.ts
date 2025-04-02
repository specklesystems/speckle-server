import {
  PaidWorkspacePlans,
  WorkspacePlanBillingIntervals,
  WorkspacePlans
} from '@speckle/shared'
import { OverrideProperties, SetOptional } from 'type-fest'

/**
 * This includes the pricing plans (Stripe products) a customer can sub to
 */
export type WorkspacePricingProducts = PaidWorkspacePlans | 'guest'

type WorkspacePlanProductsMetadata<PriceData = string> = OverrideProperties<
  Record<
    WorkspacePricingProducts,
    Record<WorkspacePlanBillingIntervals, PriceData> & {
      productId: string
    }
  >,
  {
    // Team has no yearly plan
    [PaidWorkspacePlans.Team]: {
      productId: string
      monthly: PriceData
    }
  }
>

export type WorkspacePlanProductAndPriceIds = SetOptional<
  WorkspacePlanProductsMetadata<string>,
  typeof WorkspacePlans.Team | typeof WorkspacePlans.Pro
>
export type WorkspacePlanProductPrices = SetOptional<
  WorkspacePlanProductsMetadata<{
    amount: number
    currency: string
  }>,
  typeof WorkspacePlans.Team | typeof WorkspacePlans.Pro
>
