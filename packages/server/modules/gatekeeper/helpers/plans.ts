import { PaidWorkspacePlans, WorkspacePlans } from '@speckle/shared'

export const isPaidPlanType = (plan: WorkspacePlans): boolean => {
  return (Object.values(PaidWorkspacePlans) as string[]).includes(plan)
}
