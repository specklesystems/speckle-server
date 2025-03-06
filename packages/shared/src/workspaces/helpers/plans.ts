import type { MaybeNullOrUndefined } from '../../core/helpers/utilityTypes.js'

/**
 * PLANS
 */

export const TrialEnabledPaidWorkspacePlans = <const>{
  Starter: 'starter'
}

export type TrialEnabledPaidWorkspacePlans =
  (typeof TrialEnabledPaidWorkspacePlans)[keyof typeof TrialEnabledPaidWorkspacePlans]

export const PaidWorkspacePlansOld = <const>{
  ...TrialEnabledPaidWorkspacePlans,
  Plus: 'plus',
  Business: 'business'
}

export type PaidWorkspacePlansOld =
  (typeof PaidWorkspacePlansOld)[keyof typeof PaidWorkspacePlansOld]

export const PaidWorkspacePlansNew = <const>{
  Team: 'team',
  Pro: 'pro'
}

export type PaidWorkspacePlansNew =
  (typeof PaidWorkspacePlansNew)[keyof typeof PaidWorkspacePlansNew]

export const PaidWorkspacePlans = <const>{
  ...PaidWorkspacePlansOld,
  ...PaidWorkspacePlansNew
}

export type PaidWorkspacePlans =
  (typeof PaidWorkspacePlans)[keyof typeof PaidWorkspacePlans]

export const UnpaidWorkspacePlans = <const>{
  // Old
  Unlimited: 'unlimited',
  Academia: 'academia',
  StarterInvoiced: 'starterInvoiced',
  PlusInvoiced: 'plusInvoiced',
  BusinessInvoiced: 'businessInvoiced',
  // New
  Free: 'free'
}

export type UnpaidWorkspacePlans =
  (typeof UnpaidWorkspacePlans)[keyof typeof UnpaidWorkspacePlans]

export const WorkspacePlans = <const>{
  ...PaidWorkspacePlans,
  ...UnpaidWorkspacePlans
}

export type WorkspacePlans = (typeof WorkspacePlans)[keyof typeof WorkspacePlans]

// TODO: Remove this post workspace migration
export const WorkspaceGuestSeatType = 'guest'
export type WorkspaceGuestSeatType = typeof WorkspaceGuestSeatType

// TODO: Remove this post workspace migration, only needed temporarily to differiante between old and new
export const isNewWorkspacePlan = (
  plan: MaybeNullOrUndefined<WorkspacePlans>
): boolean => {
  return (
    plan === PaidWorkspacePlansNew.Team ||
    plan === PaidWorkspacePlansNew.Pro ||
    plan === UnpaidWorkspacePlans.Free
  )
}

/**
 * BILLING INTERVALS
 */

export const WorkspacePlanBillingIntervals = <const>{
  Monthly: 'monthly',
  Yearly: 'yearly'
}

export type WorkspacePlanBillingIntervals =
  (typeof WorkspacePlanBillingIntervals)[keyof typeof WorkspacePlanBillingIntervals]

/**
 * PLAN STATUSES
 */

export const UnpaidWorkspacePlanStatuses = <const>{
  Valid: 'valid'
}

export type UnpaidWorkspacePlanStatuses =
  (typeof UnpaidWorkspacePlanStatuses)[keyof typeof UnpaidWorkspacePlanStatuses]

export const PaidWorkspacePlanStatuses = <const>{
  ...UnpaidWorkspacePlanStatuses,
  PaymentFailed: 'paymentFailed',
  CancelationScheduled: 'cancelationScheduled',
  Canceled: 'canceled'
}

export type PaidWorkspacePlanStatuses =
  (typeof PaidWorkspacePlanStatuses)[keyof typeof PaidWorkspacePlanStatuses]

export const TrialWorkspacePlanStatuses = <const>{
  Trial: 'trial',
  Expired: 'expired'
}

export type TrialWorkspacePlanStatuses =
  (typeof TrialWorkspacePlanStatuses)[keyof typeof TrialWorkspacePlanStatuses]

export const WorkspacePlanStatuses = <const>{
  ...PaidWorkspacePlanStatuses,
  ...TrialWorkspacePlanStatuses,
  ...UnpaidWorkspacePlanStatuses
}

export type WorkspacePlanStatuses =
  (typeof WorkspacePlanStatuses)[keyof typeof WorkspacePlanStatuses]
