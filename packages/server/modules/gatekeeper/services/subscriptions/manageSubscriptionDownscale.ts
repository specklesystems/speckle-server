import {
  GetSubscriptionData,
  GetWorkspacePlan,
  GetWorkspacePlanProductId,
  GetWorkspaceSubscriptions,
  ReconcileSubscriptionData,
  UpsertWorkspaceSubscription,
  WorkspaceSeatType,
  WorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import { CountSeatsByTypeInWorkspace } from '@/modules/gatekeeper/domain/operations'
import {
  WorkspacePlanMismatchError,
  WorkspacePlanNotFoundError
} from '@/modules/gatekeeper/errors/billing'
import { mutateSubscriptionDataWithNewValidSeatNumbers } from '@/modules/gatekeeper/services/subscriptions/mutateSubscriptionDataWithNewValidSeatNumbers'
import { Logger } from '@/observability/logging'
import { throwUncoveredError } from '@speckle/shared'
import { cloneDeep, isEqual } from 'lodash'

type DownscaleWorkspaceSubscription = (args: {
  workspaceSubscription: WorkspaceSubscription
}) => Promise<boolean>

export const downscaleWorkspaceSubscriptionFactory =
  ({
    getWorkspacePlan,
    countSeatsByTypeInWorkspace,
    getWorkspacePlanProductId,
    reconcileSubscriptionData
  }: {
    getWorkspacePlan: GetWorkspacePlan
    countSeatsByTypeInWorkspace: CountSeatsByTypeInWorkspace
    getWorkspacePlanProductId: GetWorkspacePlanProductId
    reconcileSubscriptionData: ReconcileSubscriptionData
  }): DownscaleWorkspaceSubscription =>
  async ({ workspaceSubscription }) => {
    const workspaceId = workspaceSubscription.workspaceId

    const workspacePlan = await getWorkspacePlan({ workspaceId })
    if (!workspacePlan) throw new WorkspacePlanNotFoundError()

    switch (workspacePlan.name) {
      case 'team':
      case 'teamUnlimited':
      case 'pro':
      case 'proUnlimited':
        break
      case 'unlimited':
      case 'academia':
      case 'proUnlimitedInvoiced':
      case 'teamUnlimitedInvoiced':
      case 'free':
        throw new WorkspacePlanMismatchError()
      default:
        throwUncoveredError(workspacePlan)
    }

    if (workspacePlan.status === 'canceled') return false

    const editorsCount = await countSeatsByTypeInWorkspace({
      workspaceId,
      type: WorkspaceSeatType.Editor
    })

    const subscriptionData = cloneDeep(workspaceSubscription.subscriptionData)

    mutateSubscriptionDataWithNewValidSeatNumbers({
      seatCount: editorsCount,
      workspacePlan: workspacePlan.name,
      getWorkspacePlanProductId,
      subscriptionData
    })

    if (!isEqual(subscriptionData, workspaceSubscription.subscriptionData)) {
      await reconcileSubscriptionData({ subscriptionData, prorationBehavior: 'none' })
      return true
    }
    return false
  }

export const manageSubscriptionDownscaleFactory =
  ({
    getWorkspaceSubscriptions,
    downscaleWorkspaceSubscription,
    updateWorkspaceSubscription,
    getSubscriptionData
  }: {
    getWorkspaceSubscriptions: GetWorkspaceSubscriptions
    downscaleWorkspaceSubscription: DownscaleWorkspaceSubscription
    updateWorkspaceSubscription: UpsertWorkspaceSubscription
    getSubscriptionData: GetSubscriptionData
  }) =>
  async (context: { logger: Logger }) => {
    const { logger } = context
    const subscriptions = await getWorkspaceSubscriptions()
    for (const workspaceSubscription of subscriptions) {
      const log = logger.child({ workspaceId: workspaceSubscription.workspaceId })
      try {
        const subDownscaled = await downscaleWorkspaceSubscription({
          workspaceSubscription
        })
        if (subDownscaled) {
          log.info(
            'Downscaled workspace subscription to match the current workspace team'
          )
        } else {
          log.info('Did not need to downscale the workspace subscription')
        }
      } catch (err) {
        log.error({ err }, 'Failed to downscale workspace subscription')
      }
      const subscriptionData = await getSubscriptionData(
        workspaceSubscription.subscriptionData
      )
      const updatedWorkspaceSubscription = {
        ...workspaceSubscription,
        currentBillingCycleEnd: subscriptionData.currentPeriodEnd
      }
      await updateWorkspaceSubscription({
        workspaceSubscription: updatedWorkspaceSubscription
      })
      log.info({ updatedWorkspaceSubscription }, 'Updated workspace billing cycle end')
    }
  }
