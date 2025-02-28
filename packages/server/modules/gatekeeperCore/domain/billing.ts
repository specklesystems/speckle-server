import {
  PaidWorkspacePlans,
  PaidWorkspacePlanStatuses,
  TrialEnabledPaidWorkspacePlans,
  TrialWorkspacePlanStatuses,
  UnpaidWorkspacePlans,
  UnpaidWorkspacePlanStatuses,
  WorkspacePlanBillingIntervals
} from '@speckle/shared'
import { OverrideProperties } from 'type-fest'

export const WorkspaceGuestProduct = <const>'guest'
export type WorkspaceGuestProduct = typeof WorkspaceGuestProduct

/**
 * This includes the pricing plans (Stripe products) a customer can sub to
 */
export type WorkspacePricingProducts = PaidWorkspacePlans | WorkspaceGuestProduct

type BaseWorkspacePlan = {
  workspaceId: string
  createdAt: Date
}

export type PaidWorkspacePlan = BaseWorkspacePlan & {
  name: PaidWorkspacePlans
  status: PaidWorkspacePlanStatuses
}

export type TrialWorkspacePlan = BaseWorkspacePlan & {
  name: TrialEnabledPaidWorkspacePlans
  status: TrialWorkspacePlanStatuses
}

export type UnpaidWorkspacePlan = BaseWorkspacePlan & {
  name: UnpaidWorkspacePlans
  status: UnpaidWorkspacePlanStatuses
}
export type WorkspacePlan = PaidWorkspacePlan | TrialWorkspacePlan | UnpaidWorkspacePlan

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

export type WorkspacePlanProductAndPriceIds = WorkspacePlanProductsMetadata<string>
export type WorkspacePlanProductPrices = WorkspacePlanProductsMetadata<{
  amount: number
  currency: string
}>
