import {
  GetWorkspacePlan,
  GetWorkspacePlanPriceId,
  GetWorkspacePlanProductId,
  GetWorkspaceSubscription,
  ReconcileSubscriptionData,
  SubscriptionDataInput,
  UpsertPaidWorkspacePlan,
  UpsertWorkspaceSubscription,
  WorkspaceSeatType
} from '@/modules/gatekeeper/domain/billing'
import { CountSeatsByTypeInWorkspace } from '@/modules/gatekeeper/domain/operations'
import {
  InvalidWorkspacePlanUpgradeError,
  UnsupportedWorkspacePlanError,
  WorkspaceNotPaidPlanError,
  WorkspacePlanMismatchError,
  WorkspacePlanNotFoundError,
  WorkspacePlanUpgradeError,
  WorkspaceSubscriptionNotFoundError
} from '@/modules/gatekeeper/errors/billing'
import { isPaidPlanType } from '@/modules/gatekeeper/helpers/plans'
import { calculateNewBillingCycleEnd } from '@/modules/gatekeeper/services/subscriptions/calculateNewBillingCycleEnd'
import { mutateSubscriptionDataWithNewValidSeatNumbers } from '@/modules/gatekeeper/services/subscriptions/mutateSubscriptionDataWithNewValidSeatNumbers'
import { isUpgradeWorkspacePlanValid } from '@/modules/gatekeeper/services/upgrades'
import {
  PaidWorkspacePlans,
  throwUncoveredError,
  WorkspacePlanBillingIntervals
} from '@speckle/shared'
import { cloneDeep } from 'lodash'

export const upgradeWorkspaceSubscriptionFactory =
  ({
    getWorkspacePlan,
    getWorkspacePlanProductId,
    getWorkspacePlanPriceId,
    getWorkspaceSubscription,
    reconcileSubscriptionData,
    updateWorkspaceSubscription,
    countSeatsByTypeInWorkspace,
    upsertWorkspacePlan
  }: {
    getWorkspacePlan: GetWorkspacePlan
    getWorkspacePlanProductId: GetWorkspacePlanProductId
    getWorkspacePlanPriceId: GetWorkspacePlanPriceId
    getWorkspaceSubscription: GetWorkspaceSubscription
    reconcileSubscriptionData: ReconcileSubscriptionData
    updateWorkspaceSubscription: UpsertWorkspaceSubscription
    countSeatsByTypeInWorkspace: CountSeatsByTypeInWorkspace
    upsertWorkspacePlan: UpsertPaidWorkspacePlan
  }) =>
  async ({
    workspaceId,
    targetPlan,
    billingInterval
  }: {
    workspaceId: string
    targetPlan: PaidWorkspacePlans
    billingInterval: WorkspacePlanBillingIntervals
  }) => {
    const workspacePlan = await getWorkspacePlan({
      workspaceId
    })
    if (!workspacePlan) throw new WorkspacePlanNotFoundError()

    switch (workspacePlan.name) {
      case 'unlimited':
      case 'academia':
      case 'teamUnlimitedInvoiced':
      case 'proUnlimitedInvoiced':
      case 'free': // Upgrade from free is handled through startCheckout since it is from free to paid
        throw new WorkspaceNotPaidPlanError()
      case 'team':
      case 'teamUnlimited':
      case 'pro':
      case 'proUnlimited':
        break
      default:
        throwUncoveredError(workspacePlan)
    }

    if (!isPaidPlanType(targetPlan)) {
      throw new UnsupportedWorkspacePlanError(null, {
        info: { currentPlan: workspacePlan.name, targetPlan }
      })
    }

    switch (workspacePlan.status) {
      case 'canceled':
      case 'cancelationScheduled':
      case 'paymentFailed':
        throw new WorkspaceNotPaidPlanError()
      case 'valid':
        break
      default:
        throwUncoveredError(workspacePlan)
    }

    const workspaceSubscription = await getWorkspaceSubscription({ workspaceId })
    if (!workspaceSubscription) throw new WorkspaceSubscriptionNotFoundError()

    if (
      workspacePlan.name === targetPlan &&
      workspaceSubscription.billingInterval === billingInterval
    )
      throw new WorkspacePlanUpgradeError("Can't upgrade to the same plan")

    const planOrder: Record<PaidWorkspacePlans, number> = {
      team: 1,
      teamUnlimited: 2,
      pro: 3,
      proUnlimited: 4
    }
    if (
      !isUpgradeWorkspacePlanValid({ current: workspacePlan.name, upgrade: targetPlan })
    ) {
      if (planOrder[workspacePlan.name] > planOrder[targetPlan]) {
        throw new WorkspacePlanUpgradeError("Can't upgrade to a less expensive plan")
      }
      throw new InvalidWorkspacePlanUpgradeError(null, {
        info: { current: workspacePlan.name, upgrade: targetPlan, workspaceId }
      })
    }

    switch (billingInterval) {
      case 'monthly':
        if (workspaceSubscription.billingInterval === 'yearly')
          throw new WorkspacePlanUpgradeError(
            "Can't upgrade from yearly to monthly billing cycle"
          )
      case 'yearly':
        break
      default:
        throwUncoveredError(billingInterval)
    }
    // must update the billing interval to the new one
    workspaceSubscription.billingInterval = billingInterval
    workspaceSubscription.currentBillingCycleEnd = calculateNewBillingCycleEnd({
      workspaceSubscription
    })

    const subscriptionData: SubscriptionDataInput = cloneDeep(
      workspaceSubscription.subscriptionData
    )

    const product = subscriptionData.products.find(
      (p) =>
        p.productId === getWorkspacePlanProductId({ workspacePlan: workspacePlan.name })
    )
    if (!product) throw new WorkspacePlanMismatchError()

    const editorsCount = await countSeatsByTypeInWorkspace({
      workspaceId,
      type: WorkspaceSeatType.Editor
    })

    workspaceSubscription.updatedAt = new Date()

    // set current plan seat count to 0
    mutateSubscriptionDataWithNewValidSeatNumbers({
      seatCount: 0,
      getWorkspacePlanProductId,
      subscriptionData,
      workspacePlan: workspacePlan.name
    })

    // set target plan seat count to current seat count
    subscriptionData.products.push({
      quantity: editorsCount,
      productId: getWorkspacePlanProductId({ workspacePlan: targetPlan }),
      priceId: getWorkspacePlanPriceId({
        workspacePlan: targetPlan,
        billingInterval,
        currency: workspaceSubscription.currency
      }),
      subscriptionItemId: undefined
    })

    await reconcileSubscriptionData({
      subscriptionData,
      prorationBehavior: 'always_invoice'
    })
    await upsertWorkspacePlan({
      workspacePlan: {
        status: workspacePlan.status,
        workspaceId,
        name: targetPlan,
        createdAt: new Date()
      }
    })
    await updateWorkspaceSubscription({ workspaceSubscription })
  }
