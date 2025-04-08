import { throwUncoveredError } from '../../core/helpers/error.js'
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
  TeamUnlimited: 'teamUnlimited',
  Pro: 'pro',
  ProUnlimited: 'proUnlimited'
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
  StarterInvoiced: 'starterInvoiced',
  PlusInvoiced: 'plusInvoiced',
  BusinessInvoiced: 'businessInvoiced',
  // New
  TeamUnlimitedInvoiced: 'teamUnlimitedInvoiced',
  ProUnlimitedInvoiced: 'proUnlimitedInvoiced',
  Unlimited: 'unlimited',
  Academia: 'academia',
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
  if (!plan) return false
  switch (plan) {
    case 'starter':
    case 'starterInvoiced':
    case 'plus':
    case 'plusInvoiced':
    case 'business':
    case 'businessInvoiced':
      return false
    case 'team':
    case 'teamUnlimited':
    case 'teamUnlimitedInvoiced':
    case 'pro':
    case 'proUnlimited':
    case 'proUnlimitedInvoiced':
    case 'unlimited':
    case 'academia':
    case 'free':
      return true
    default:
      throwUncoveredError(plan)
  }
}

export const doesPlanIncludeThePaidUnlimitedProjectsAddon = (
  plan: WorkspacePlans
): boolean => {
  switch (plan) {
    case 'teamUnlimited':
    case 'proUnlimited':
      return true
    case 'free':
    case 'team':
    case 'pro':
    case 'starter':
    case 'plus':
    case 'business':
    case 'starterInvoiced':
    case 'plusInvoiced':
    case 'businessInvoiced':
    case 'teamUnlimitedInvoiced':
    case 'proUnlimitedInvoiced':
    case 'unlimited':
    case 'academia':
      return false

    default:
      throwUncoveredError(plan)
  }
}

export const isSelfServerAvailablePlan = (plan: WorkspacePlans): boolean => {
  switch (plan) {
    case 'free':
    case 'team':
    case 'teamUnlimited':
    case 'pro':
    case 'proUnlimited':
      return true
    case 'starter':
    case 'plus':
    case 'business':
    case 'starterInvoiced':
    case 'plusInvoiced':
    case 'businessInvoiced':
    case 'teamUnlimitedInvoiced':
    case 'proUnlimitedInvoiced':
    case 'unlimited':
    case 'academia':
      return false

    default:
      throwUncoveredError(plan)
  }
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

export const isWorkspacePlanStatusReadOnly = (status: WorkspacePlan['status']) => {
  switch (status) {
    case 'cancelationScheduled':
    case 'valid':
    case 'trial':
    case 'paymentFailed':
      return false
    case 'expired':
    case 'canceled':
      return true
    default:
      throwUncoveredError(status)
  }
}
