import { throwUncoveredError } from '../../core/helpers/error.js'

export const PaidWorkspacePlans = <const>{
  Team: 'team', // actually 'Starter'
  TeamUnlimited: 'teamUnlimited',
  Pro: 'pro', // actually 'Business'
  ProUnlimited: 'proUnlimited'
}

export type PaidWorkspacePlans =
  (typeof PaidWorkspacePlans)[keyof typeof PaidWorkspacePlans]

export const UnpaidWorkspacePlans = <const>{
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

export const doesPlanIncludeUnlimitedProjectsAddon = (
  plan: WorkspacePlans
): boolean => {
  switch (plan) {
    case 'teamUnlimited':
    case 'proUnlimited':
      return true
    case 'free':
    case 'team':
    case 'pro':
    case 'teamUnlimitedInvoiced':
    case 'proUnlimitedInvoiced':
    case 'unlimited':
    case 'academia':
      return false

    default:
      throwUncoveredError(plan)
  }
}

export const isSelfServeAvailablePlan = (plan: WorkspacePlans): boolean => {
  switch (plan) {
    case 'free':
    case 'team':
    case 'teamUnlimited':
    case 'pro':
    case 'proUnlimited':
      return true
    case 'teamUnlimitedInvoiced':
    case 'proUnlimitedInvoiced':
    case 'unlimited':
    case 'academia':
      return false

    default:
      throwUncoveredError(plan)
  }
}

export const isPaidPlan = (plan: WorkspacePlans): boolean => {
  switch (plan) {
    case 'team':
    case 'teamUnlimited':
    case 'pro':
    case 'proUnlimited':
      return true
    case 'free':
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

export const WorkspacePlanStatuses = <const>{
  ...PaidWorkspacePlanStatuses,
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

export type UnpaidWorkspacePlan = BaseWorkspacePlan & {
  name: UnpaidWorkspacePlans
  status: UnpaidWorkspacePlanStatuses
}
export type WorkspacePlan = PaidWorkspacePlan | UnpaidWorkspacePlan

export const isWorkspacePlanStatusReadOnly = (status: WorkspacePlan['status']) => {
  switch (status) {
    case 'cancelationScheduled':
    case 'valid':
    case 'paymentFailed':
      return false
    case 'canceled':
      return true
    default:
      throwUncoveredError(status)
  }
}
