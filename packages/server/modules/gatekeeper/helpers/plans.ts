import type { WorkspacePlans } from '@speckle/shared'
import { PaidWorkspacePlans } from '@speckle/shared'

export const isPaidPlanType = (plan: WorkspacePlans): boolean => {
  return (Object.values(PaidWorkspacePlans) as string[]).includes(plan)
}
