import type { WorkspacePlans } from '@speckle/shared'
import { PaidWorkspacePlans } from '@speckle/shared'

// Check if the plan matches PaidWorkspacePlans
export const isPaidPlan = (plan?: WorkspacePlans): boolean =>
  plan ? (Object.values(PaidWorkspacePlans) as string[]).includes(plan) : false
