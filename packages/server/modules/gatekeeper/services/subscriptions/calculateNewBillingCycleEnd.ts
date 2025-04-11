import { WorkspaceSubscription } from '@/modules/gatekeeper/domain/billing'
import { throwUncoveredError } from '@speckle/shared'

export const calculateNewBillingCycleEnd = ({
  workspaceSubscription
}: {
  workspaceSubscription: WorkspaceSubscription
}): Date => {
  const newBillingCycleEnd = new Date(workspaceSubscription.currentBillingCycleEnd)
  switch (workspaceSubscription.billingInterval) {
    case 'monthly':
      newBillingCycleEnd.setMonth(newBillingCycleEnd.getMonth() + 1)
      break
    case 'yearly':
      newBillingCycleEnd.setFullYear(newBillingCycleEnd.getFullYear() + 1)
      break
    default:
      throwUncoveredError(workspaceSubscription.billingInterval)
  }
  return newBillingCycleEnd
}
