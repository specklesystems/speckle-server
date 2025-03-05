import {
  PaidWorkspacePlans,
  PaidWorkspacePlanStatuses,
  TrialEnabledPaidWorkspacePlans,
  TrialWorkspacePlanStatuses,
  UnpaidWorkspacePlans,
  UnpaidWorkspacePlanStatuses
} from '@speckle/shared'

/**
 * This includes the pricing plans (Stripe products) a customer can sub to
 */
export type WorkspacePricingProducts = PaidWorkspacePlans | 'guest' | 'viewer'

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
