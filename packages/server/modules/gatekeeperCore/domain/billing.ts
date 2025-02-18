import { z } from 'zod'

// team
export const trialWorkspacePlans = z.literal('starter')

export type TrialWorkspacePlans = z.infer<typeof trialWorkspacePlans>

export const paidWorkspacePlans = z.union([
  trialWorkspacePlans,
  // pro
  z.literal('plus'),
  z.literal('business')
])

// new plan stuff below

export const paidWorkspacePlansNew = z.union([z.literal('kezdo'), z.literal('uzleti')])
export type PaidWorkspacePlansNew = z.infer<typeof paidWorkspacePlansNew>

export type PaidWorkspacePlans = z.infer<typeof paidWorkspacePlans>

// these are not publicly exposed for general use on billing enabled servers
export const unpaidWorkspacePlans = z.union([
  z.literal('free'),
  z.literal('unlimited'),
  z.literal('academia'),
  z.literal('starterInvoiced'),
  z.literal('plusInvoiced'),
  z.literal('businessInvoiced')
])

export type UnpaidWorkspacePlans = z.infer<typeof unpaidWorkspacePlans>

export const workspacePlans = z.union([paidWorkspacePlans, unpaidWorkspacePlans])

// this includes the plans your workspace can be on
export type WorkspacePlans = z.infer<typeof workspacePlans>

// this includes the pricing plans a customer can sub to
export type WorkspacePricingPlans = PaidWorkspacePlans | 'guest'

export const workspacePlanBillingIntervals = z.union([
  z.literal('monthly'),
  z.literal('yearly')
])
export type WorkspacePlanBillingIntervals = z.infer<
  typeof workspacePlanBillingIntervals
>

export type UnpaidWorkspacePlanStatuses = 'valid'

export type PaidWorkspacePlanStatuses =
  | UnpaidWorkspacePlanStatuses
  // | 'paymentNeeded' // unsure if this is needed
  | 'paymentFailed'
  | 'cancelationScheduled'
  | 'canceled'

export type TrialWorkspacePlanStatuses = 'trial' | 'expired'

export type PlanStatuses =
  | PaidWorkspacePlanStatuses
  | TrialWorkspacePlanStatuses
  | UnpaidWorkspacePlanStatuses

type BaseWorkspacePlan = {
  workspaceId: string
  createdAt: Date
}

export type PaidWorkspacePlan = BaseWorkspacePlan & {
  name: PaidWorkspacePlans
  status: PaidWorkspacePlanStatuses
}

export type TrialWorkspacePlan = BaseWorkspacePlan & {
  name: TrialWorkspacePlans
  status: TrialWorkspacePlanStatuses
}

export type UnpaidWorkspacePlan = BaseWorkspacePlan & {
  name: UnpaidWorkspacePlans
  status: UnpaidWorkspacePlanStatuses
}
export type WorkspacePlan = PaidWorkspacePlan | TrialWorkspacePlan | UnpaidWorkspacePlan
