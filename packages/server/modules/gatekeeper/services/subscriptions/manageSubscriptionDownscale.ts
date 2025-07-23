import type {
  GetSubscriptionData,
  GetWorkspacePlan,
  GetWorkspacePlanProductId,
  GetWorkspaceSubscriptions,
  ReconcileSubscriptionData,
  UpsertWorkspaceSubscription,
  WorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import type { CountSeatsByTypeInWorkspace } from '@/modules/gatekeeper/domain/operations'
import {
  WorkspacePlanMismatchError,
  WorkspacePlanNotFoundError
} from '@/modules/gatekeeper/errors/billing'
import { mutateSubscriptionDataWithNewValidSeatNumbers } from '@/modules/gatekeeper/services/subscriptions/mutateSubscriptionDataWithNewValidSeatNumbers'
import type { Logger } from '@/observability/logging'
import { throwUncoveredError, WorkspacePlans } from '@speckle/shared'
import { cloneDeep, isEqual } from 'lodash-es'

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
      case WorkspacePlans.Team:
      case WorkspacePlans.TeamUnlimited:
      case WorkspacePlans.Pro:
      case WorkspacePlans.ProUnlimited:
        break
      case WorkspacePlans.Free:
      case WorkspacePlans.Academia:
      case WorkspacePlans.ProUnlimitedInvoiced:
      case WorkspacePlans.TeamUnlimitedInvoiced:
      case WorkspacePlans.Enterprise:
      case WorkspacePlans.Unlimited:
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

    if (isEqual(subscriptionData, workspaceSubscription.subscriptionData)) {
      return false
    }

    await reconcileSubscriptionData({ subscriptionData, prorationBehavior: 'none' })
    // we do not need to emit a subscription event as stripe will emit an update
    return true
  }

export const manageSubscriptionDownscaleFactory =
  ({
    getWorkspaceSubscriptions,
    downscaleWorkspaceSubscription,
    updateWorkspaceSubscription,
    getStripeSubscriptionData
  }: {
    getWorkspaceSubscriptions: GetWorkspaceSubscriptions
    downscaleWorkspaceSubscription: DownscaleWorkspaceSubscription
    updateWorkspaceSubscription: UpsertWorkspaceSubscription
    getStripeSubscriptionData: GetSubscriptionData
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
        log.error(
          {
            err,
            workspaceId: workspaceSubscription.workspaceId
          },
          'Failed to downscale workspace subscription'
        )
      }
      const subscriptionData = await getStripeSubscriptionData(
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
