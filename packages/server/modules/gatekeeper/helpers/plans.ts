import { PaidWorkspacePlansNew, WorkspacePlans } from '@speckle/shared'

export const isPaidPlanType = (plan: WorkspacePlans): boolean => {
  return (Object.values(PaidWorkspacePlansNew) as string[]).includes(plan)
}
