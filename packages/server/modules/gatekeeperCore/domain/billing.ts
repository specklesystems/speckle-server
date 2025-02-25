import { z } from 'zod'

const trialWorkspacePlans = z.literal('starter')

type TrialWorkspacePlans = z.infer<typeof trialWorkspacePlans>

export const paidWorkspacePlansOldSchema = z.union([
  trialWorkspacePlans,
  // pro
  z.literal('plus'),
  z.literal('business')
])
export const paidWorkspacePlansNewSchema = z.union([
  z.literal('team'),
  z.literal('pro')
])
const paidWorkspacePlansSchema = z.union([
  paidWorkspacePlansOldSchema,
  paidWorkspacePlansNewSchema
])

export type PaidWorkspacePlans = z.infer<typeof paidWorkspacePlansSchema>

const unpaidWorkspacePlans = z.union([
  z.literal('free'),
  z.literal('unlimited'),
  z.literal('academia'),
  z.literal('starterInvoiced'),
  z.literal('plusInvoiced'),
  z.literal('businessInvoiced')
])

export type UnpaidWorkspacePlans = z.infer<typeof unpaidWorkspacePlans>

const workspacePlansSchema = z.union([paidWorkspacePlansSchema, unpaidWorkspacePlans])

// this includes the plans your workspace can be on
export type WorkspacePlans = z.infer<typeof workspacePlansSchema>

// this includes the pricing plans (Stripe products) a customer can sub to
export type WorkspacePricingPlans = PaidWorkspacePlans | 'guest'

const workspacePlanBillingIntervalsSchema = z.union([
  z.literal('monthly'),
  z.literal('yearly')
])
export type WorkspacePlanBillingIntervals = z.infer<
  typeof workspacePlanBillingIntervalsSchema
>

type UnpaidWorkspacePlanStatuses = 'valid'

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
