import type {
  GetWorkspacePlan,
  GetWorkspacePlanPriceId,
  GetWorkspacePlanProductId,
  GetWorkspaceSubscription,
  ReconcileSubscriptionData,
  SubscriptionDataInput,
  UpsertWorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import type { CountSeatsByTypeInWorkspace } from '@/modules/gatekeeper/domain/operations'
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
import type { PaidWorkspacePlans, WorkspacePlanBillingIntervals } from '@speckle/shared'
import { throwUncoveredError, WorkspacePlans } from '@speckle/shared'
import { cloneDeep } from 'lodash-es'

export const upgradeWorkspaceSubscriptionFactory =
  ({
    getWorkspacePlan,
    getWorkspacePlanProductId,
    getWorkspacePlanPriceId,
    getWorkspaceSubscription,
    reconcileSubscriptionData,
    updateWorkspaceSubscription,
    countSeatsByTypeInWorkspace
  }: {
    getWorkspacePlan: GetWorkspacePlan
    getWorkspacePlanProductId: GetWorkspacePlanProductId
    getWorkspacePlanPriceId: GetWorkspacePlanPriceId
    getWorkspaceSubscription: GetWorkspaceSubscription
    reconcileSubscriptionData: ReconcileSubscriptionData
    updateWorkspaceSubscription: UpsertWorkspaceSubscription
    countSeatsByTypeInWorkspace: CountSeatsByTypeInWorkspace
  }) =>
  async ({
    userId,
    workspaceId,
    targetPlan,
    billingInterval
  }: {
    userId: string
    workspaceId: string
    targetPlan: PaidWorkspacePlans
    billingInterval: WorkspacePlanBillingIntervals
  }) => {
    const workspacePlan = await getWorkspacePlan({
      workspaceId
    })
    if (!workspacePlan) throw new WorkspacePlanNotFoundError()

    switch (workspacePlan.name) {
      case WorkspacePlans.Unlimited:
      case WorkspacePlans.Academia:
      case WorkspacePlans.TeamUnlimitedInvoiced:
      case WorkspacePlans.ProUnlimitedInvoiced:
      case WorkspacePlans.Enterprise:
      case WorkspacePlans.Free: // Upgrade from free is handled through startCheckout since it is from free to paid
        throw new WorkspaceNotPaidPlanError()
      case WorkspacePlans.Team:
      case WorkspacePlans.TeamUnlimited:
      case WorkspacePlans.Pro:
      case WorkspacePlans.ProUnlimited:
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
    const currentBillingCycleEnd = calculateNewBillingCycleEnd({
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

    // set current plan seat count to 0
    mutateSubscriptionDataWithNewValidSeatNumbers({
      seatCount: 0,
      getWorkspacePlanProductId,
      subscriptionData,
      workspacePlan: workspacePlan.name
    })

    // set target plan and subscription
    const newProduct = {
      quantity: editorsCount,
      productId: getWorkspacePlanProductId({ workspacePlan: targetPlan }),
      priceId: getWorkspacePlanPriceId({
        workspacePlan: targetPlan,
        billingInterval,
        currency: workspaceSubscription.currency
      })
    }

    workspaceSubscription.updateIntent = {
      userId,
      planName: targetPlan,
      billingInterval,
      currentBillingCycleEnd,
      currency: workspaceSubscription.currency,
      updatedAt: new Date(),
      products: [newProduct]
    }
    await updateWorkspaceSubscription({ workspaceSubscription })

    subscriptionData.products.push(newProduct)
    await reconcileSubscriptionData({
      subscriptionData,
      prorationBehavior: 'always_invoice'
    })
  }
