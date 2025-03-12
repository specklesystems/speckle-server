import {
  GetWorkspacePlan,
  GetWorkspacePlanPriceId,
  GetWorkspacePlanProductId,
  GetWorkspaceSubscription,
  ReconcileSubscriptionData,
  SubscriptionDataInput,
  UpsertPaidWorkspacePlan,
  UpsertWorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import { CountSeatsByTypeInWorkspace } from '@/modules/gatekeeper/domain/operations'
import {
  InvalidWorkspacePlanUpgradeError,
  WorkspaceNotPaidPlanError,
  WorkspacePlanMismatchError,
  WorkspacePlanNotFoundError,
  WorkspacePlanUpgradeError,
  WorkspaceSubscriptionNotFoundError
} from '@/modules/gatekeeper/errors/billing'
import { isNewPlanType, isOldPaidPlanType } from '@/modules/gatekeeper/helpers/plans'
import { calculateNewBillingCycleEnd } from '@/modules/gatekeeper/services/subscriptions/calculateNewBillingCycleEnd'
import { mutateSubscriptionDataWithNewValidSeatNumbers } from '@/modules/gatekeeper/services/subscriptions/mutateSubscriptionDataWithNewValidSeatNumbers'
import { isUpgradeWorkspacePlanValid } from '@/modules/gatekeeper/services/upgrades'
import { NotImplementedError } from '@/modules/shared/errors'
import { CountWorkspaceRoleWithOptionalProjectRole } from '@/modules/workspaces/domain/operations'
import {
  PaidWorkspacePlans,
  PaidWorkspacePlansNew,
  throwUncoveredError,
  WorkspacePlanBillingIntervals,
  xor
} from '@speckle/shared'
import { cloneDeep } from 'lodash'

export const upgradeWorkspaceSubscriptionFactoryOld =
  ({
    getWorkspacePlan,
    getWorkspacePlanProductId,
    getWorkspacePlanPriceId,
    getWorkspaceSubscription,
    reconcileSubscriptionData,
    updateWorkspaceSubscription,
    countWorkspaceRole,
    upsertWorkspacePlan
  }: {
    getWorkspacePlan: GetWorkspacePlan
    getWorkspacePlanProductId: GetWorkspacePlanProductId
    getWorkspacePlanPriceId: GetWorkspacePlanPriceId
    getWorkspaceSubscription: GetWorkspaceSubscription
    reconcileSubscriptionData: ReconcileSubscriptionData
    updateWorkspaceSubscription: UpsertWorkspaceSubscription
    countWorkspaceRole: CountWorkspaceRoleWithOptionalProjectRole
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
    const workspacePlan = await getWorkspacePlan({ workspaceId })

    if (!workspacePlan) throw new WorkspacePlanNotFoundError()
    switch (workspacePlan.name) {
      case 'unlimited':
      case 'academia':
      case 'starterInvoiced':
      case 'plusInvoiced':
      case 'businessInvoiced':
      case 'free': // TODO: Don't we want to allow upgrades from free to paid?
        throw new WorkspaceNotPaidPlanError()
      case 'starter':
      case 'plus':
      case 'business':
      case 'team':
      case 'pro':
        break
      default:
        throwUncoveredError(workspacePlan)
    }

    switch (workspacePlan.status) {
      case 'canceled':
      case 'cancelationScheduled':
      case 'paymentFailed':
      case 'trial':
      case 'expired':
        throw new WorkspaceNotPaidPlanError()
      case 'valid':
        break
      default:
        throwUncoveredError(workspacePlan)
    }

    const workspaceSubscription = await getWorkspaceSubscription({ workspaceId })
    if (!workspaceSubscription) throw new WorkspaceSubscriptionNotFoundError()

    const planOrder: Record<PaidWorkspacePlans, number> = {
      // old
      business: 3,
      plus: 2,
      starter: 1,
      // new
      team: 1,
      pro: 2
    }

    if (isNewPlanType(workspacePlan.name) || isNewPlanType(targetPlan)) {
      throw new NotImplementedError()
    }

    const planCheckers = [isNewPlanType, isOldPaidPlanType]
    for (const isSpecificPlanType of planCheckers) {
      const oldPlanFitsSchema = isSpecificPlanType(workspacePlan.name)
      const newPlanFitsSchema = isSpecificPlanType(targetPlan)
      if (xor(oldPlanFitsSchema, newPlanFitsSchema)) {
        throw new WorkspacePlanUpgradeError(
          'Attempting to switch between incompatible plan types'
        )
      }
    }

    if (isNewPlanType(targetPlan) || isNewPlanType(workspacePlan.name)) {
      // Needs custom logic below for seats
      throw new NotImplementedError()
    }

    if (
      planOrder[workspacePlan.name] === planOrder[targetPlan] &&
      workspaceSubscription.billingInterval === billingInterval
    )
      throw new WorkspacePlanUpgradeError("Can't upgrade to the same plan")

    if (planOrder[workspacePlan.name] > planOrder[targetPlan])
      throw new WorkspacePlanUpgradeError("Can't upgrade to a less expensive plan")

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

    const subscriptionData: SubscriptionDataInput = cloneDeep(
      workspaceSubscription.subscriptionData
    )

    const product = subscriptionData.products.find(
      (p) =>
        p.productId === getWorkspacePlanProductId({ workspacePlan: workspacePlan.name })
    )
    if (!product) throw new WorkspacePlanMismatchError()

    const [guestCount, memberCount, adminCount] = await Promise.all([
      countWorkspaceRole({ workspaceId, workspaceRole: 'workspace:guest' }),
      countWorkspaceRole({ workspaceId, workspaceRole: 'workspace:member' }),
      countWorkspaceRole({ workspaceId, workspaceRole: 'workspace:admin' })
    ])

    workspaceSubscription.updatedAt = new Date()
    if (workspaceSubscription.billingInterval !== billingInterval) {
      workspaceSubscription.billingInterval = billingInterval
      workspaceSubscription.currentBillingCycleEnd = calculateNewBillingCycleEnd({
        workspaceSubscription
      })
      const guestProduct = subscriptionData.products.find(
        (p) => p.productId === getWorkspacePlanProductId({ workspacePlan: 'guest' })
      )
      if (guestProduct) {
        mutateSubscriptionDataWithNewValidSeatNumbers({
          seatCount: 0,
          getWorkspacePlanProductId,
          subscriptionData,
          workspacePlan: 'guest'
        })

        subscriptionData.products.push({
          quantity: guestCount,
          productId: getWorkspacePlanProductId({ workspacePlan: 'guest' }),
          priceId: getWorkspacePlanPriceId({
            workspacePlan: 'guest',
            billingInterval
          }),
          subscriptionItemId: undefined
        })
      }
    }

    // set current plan seat count to 0
    mutateSubscriptionDataWithNewValidSeatNumbers({
      seatCount: 0,
      getWorkspacePlanProductId,
      subscriptionData,
      workspacePlan: workspacePlan.name
    })

    // set target plan seat count to current seat count
    subscriptionData.products.push({
      quantity: memberCount + adminCount,
      productId: getWorkspacePlanProductId({ workspacePlan: targetPlan }),
      priceId: getWorkspacePlanPriceId({
        workspacePlan: targetPlan,
        billingInterval
      }),
      subscriptionItemId: undefined
    })

    await reconcileSubscriptionData({
      subscriptionData,
      prorationBehavior: isNewPlanType(targetPlan)
        ? 'always_invoice'
        : 'create_prorations'
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

export const upgradeWorkspaceSubscriptionFactoryNew =
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
    if (!isNewPlanType(workspacePlan.name) || !isNewPlanType(targetPlan)) {
      throw new NotImplementedError()
    }

    switch (workspacePlan.name) {
      case 'unlimited':
      case 'academia':
      case 'free': // Upgrade from free is handled through startCheckout since it is from free to paid
        throw new WorkspaceNotPaidPlanError()
      case 'team':
      case 'pro':
        break
      default:
        throwUncoveredError(workspacePlan as never)
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

    const planOrder: Record<PaidWorkspacePlansNew, number> = {
      team: 1,
      pro: 2
    }
    if (
      !isUpgradeWorkspacePlanValid({ current: workspacePlan.name, upgrade: targetPlan })
    ) {
      if (
        planOrder[workspacePlan.name] > planOrder[targetPlan as PaidWorkspacePlansNew]
      ) {
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
      type: 'editor'
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
        billingInterval
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
