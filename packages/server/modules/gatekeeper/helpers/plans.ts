import {
  PaidWorkspacePlansNew,
  PaidWorkspacePlansOld,
  WorkspacePlans
} from '@speckle/shared'

export const isNewPaidPlanType = (plan: WorkspacePlans): boolean => {
  return (Object.values(PaidWorkspacePlansNew) as string[]).includes(plan)
}

export const isNewPlanType = (plan: WorkspacePlans): boolean => {
  return isNewPaidPlanType(plan) || plan === WorkspacePlans.Free
}

export const isOldPaidPlanType = (plan: WorkspacePlans): boolean => {
  return (Object.values(PaidWorkspacePlansOld) as string[]).includes(plan)
}
