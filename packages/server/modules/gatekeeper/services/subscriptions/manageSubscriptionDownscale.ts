import {
  GetSubscriptionData,
  GetWorkspacePlan,
  GetWorkspacePlanProductId,
  GetWorkspaceSubscriptions,
  ReconcileSubscriptionData,
  UpsertWorkspaceSubscription,
  WorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import { CountSeatsByTypeInWorkspace } from '@/modules/gatekeeper/domain/operations'
import {
  WorkspacePlanMismatchError,
  WorkspacePlanNotFoundError
} from '@/modules/gatekeeper/errors/billing'
import { calculateNewBillingCycleEnd } from '@/modules/gatekeeper/services/subscriptions/calculateNewBillingCycleEnd'
import { mutateSubscriptionDataWithNewValidSeatNumbers } from '@/modules/gatekeeper/services/subscriptions/mutateSubscriptionDataWithNewValidSeatNumbers'
import { NotImplementedError } from '@/modules/shared/errors'
import { CountWorkspaceRoleWithOptionalProjectRole } from '@/modules/workspaces/domain/operations'
import { Logger } from '@/observability/logging'
import { throwUncoveredError } from '@speckle/shared'
import { cloneDeep, isEqual } from 'lodash'

type DownscaleWorkspaceSubscription = (args: {
  workspaceSubscription: WorkspaceSubscription
}) => Promise<boolean>

export const downscaleWorkspaceSubscriptionFactoryOld =
  ({
    getWorkspacePlan,
    countWorkspaceRole,
    getWorkspacePlanProductId,
    reconcileSubscriptionData
  }: {
    getWorkspacePlan: GetWorkspacePlan
    countWorkspaceRole: CountWorkspaceRoleWithOptionalProjectRole
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
      case 'proUnlimitedInvoiced':
      case 'teamUnlimitedInvoiced':
        // Cause seat types matter, a future issue
        throw new NotImplementedError()
      case 'starter':
      case 'plus':
      case 'business':
        break
      case 'unlimited':
      case 'academia':
      case 'starterInvoiced':
      case 'plusInvoiced':
      case 'businessInvoiced':
      case 'free':
        throw new WorkspacePlanMismatchError()
      default:
        throwUncoveredError(workspacePlan)
    }

    if (workspacePlan.status === 'canceled') return false

    // TODO: Guests will be able to have a paid seat
    const [guestCount, memberCount, adminCount] = await Promise.all([
      countWorkspaceRole({ workspaceId, workspaceRole: 'workspace:guest' }),
      countWorkspaceRole({ workspaceId, workspaceRole: 'workspace:member' }),
      countWorkspaceRole({ workspaceId, workspaceRole: 'workspace:admin' })
    ])

    const subscriptionData = cloneDeep(workspaceSubscription.subscriptionData)

    mutateSubscriptionDataWithNewValidSeatNumbers({
      seatCount: guestCount,
      workspacePlan: 'guest',
      getWorkspacePlanProductId,
      subscriptionData
    })
    mutateSubscriptionDataWithNewValidSeatNumbers({
      seatCount: memberCount + adminCount,
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

export const downscaleWorkspaceSubscriptionFactoryNew =
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
      case 'starter':
      case 'plus':
      case 'business':
      case 'unlimited':
      case 'academia':
      case 'starterInvoiced':
      case 'plusInvoiced':
      case 'businessInvoiced':
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
      type: 'editor'
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

export const manageSubscriptionDownscaleFactoryOld =
  ({
    getWorkspaceSubscriptions,
    downscaleWorkspaceSubscription,
    updateWorkspaceSubscription
  }: {
    getWorkspaceSubscriptions: GetWorkspaceSubscriptions
    downscaleWorkspaceSubscription: DownscaleWorkspaceSubscription
    updateWorkspaceSubscription: UpsertWorkspaceSubscription
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
      const newBillingCycleEnd = calculateNewBillingCycleEnd({ workspaceSubscription })
      const updatedWorkspaceSubscription = {
        ...workspaceSubscription,
        currentBillingCycleEnd: newBillingCycleEnd
      }
      await updateWorkspaceSubscription({
        workspaceSubscription: updatedWorkspaceSubscription
      })
      log.info({ updatedWorkspaceSubscription }, 'Updated workspace billing cycle end')
    }
  }

export const manageSubscriptionDownscaleFactoryNew =
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
        //TODO:
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
