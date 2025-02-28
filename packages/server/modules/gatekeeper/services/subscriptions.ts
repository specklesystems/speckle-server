import type { Logger } from '@/observability/logging'
import {
  GetWorkspacePlan,
  GetWorkspacePlanPriceId,
  GetWorkspacePlanProductId,
  GetWorkspaceSubscription,
  GetWorkspaceSubscriptionBySubscriptionId,
  GetWorkspaceSubscriptions,
  ReconcileSubscriptionData,
  SubscriptionData,
  SubscriptionDataInput,
  UpsertPaidWorkspacePlan,
  UpsertWorkspaceSubscription,
  WorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import {
  WorkspaceNotPaidPlanError,
  WorkspacePlanUpgradeError,
  WorkspacePlanMismatchError,
  WorkspacePlanNotFoundError,
  WorkspaceSubscriptionNotFoundError
} from '@/modules/gatekeeper/errors/billing'
import { isNewPlanType, isOldPaidPlanType } from '@/modules/gatekeeper/helpers/plans'
import { WorkspacePricingProducts } from '@/modules/gatekeeperCore/domain/billing'
import { LogicError, NotImplementedError } from '@/modules/shared/errors'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { CountWorkspaceRoleWithOptionalProjectRole } from '@/modules/workspaces/domain/operations'
import {
  PaidWorkspacePlans,
  PaidWorkspacePlanStatuses,
  throwUncoveredError,
  WorkspacePlanBillingIntervals,
  WorkspaceRoles,
  xor
} from '@speckle/shared'
import { cloneDeep, isEqual, sum } from 'lodash'

const { FF_WORKSPACES_NEW_PLANS_ENABLED } = getFeatureFlags()

export const handleSubscriptionUpdateFactory =
  ({
    upsertPaidWorkspacePlan,
    getWorkspacePlan,
    getWorkspaceSubscriptionBySubscriptionId,
    upsertWorkspaceSubscription
  }: {
    getWorkspacePlan: GetWorkspacePlan
    upsertPaidWorkspacePlan: UpsertPaidWorkspacePlan
    getWorkspaceSubscriptionBySubscriptionId: GetWorkspaceSubscriptionBySubscriptionId
    upsertWorkspaceSubscription: UpsertWorkspaceSubscription
  }) =>
  async ({ subscriptionData }: { subscriptionData: SubscriptionData }) => {
    // we're only handling marking the sub scheduled for cancelation right now
    const subscription = await getWorkspaceSubscriptionBySubscriptionId({
      subscriptionId: subscriptionData.subscriptionId
    })
    if (!subscription) throw new WorkspaceSubscriptionNotFoundError()

    const workspacePlan = await getWorkspacePlan({
      workspaceId: subscription.workspaceId
    })
    if (!workspacePlan) throw new WorkspacePlanNotFoundError()

    let status: PaidWorkspacePlanStatuses | undefined = undefined

    if (
      subscriptionData.status === 'active' &&
      subscriptionData.cancelAt &&
      subscriptionData.cancelAt > new Date()
    ) {
      status = 'cancelationScheduled'
    } else if (
      subscriptionData.status === 'active' &&
      subscriptionData.cancelAt === null
    ) {
      status = 'valid'
    } else if (subscriptionData.status === 'past_due') {
      status = 'paymentFailed'
    } else if (subscriptionData.status === 'canceled') {
      status = 'canceled'
    }

    if (status) {
      switch (workspacePlan.name) {
        case 'starter':
        case 'plus':
        case 'business':
        case 'team':
        case 'pro':
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

      await upsertPaidWorkspacePlan({
        workspacePlan: { ...workspacePlan, status }
      })
      // if there is a status in the sub, we recognize, we need to update our state
      await upsertWorkspaceSubscription({
        workspaceSubscription: {
          ...subscription,
          updatedAt: new Date(),
          subscriptionData
        }
      })
    }
  }

export const addWorkspaceSubscriptionSeatIfNeededFactory =
  ({
    getWorkspacePlan,
    getWorkspaceSubscription,
    countWorkspaceRole,
    getWorkspacePlanProductId,
    getWorkspacePlanPriceId,
    reconcileSubscriptionData
  }: {
    getWorkspacePlan: GetWorkspacePlan
    getWorkspaceSubscription: GetWorkspaceSubscription
    countWorkspaceRole: CountWorkspaceRoleWithOptionalProjectRole
    getWorkspacePlanProductId: GetWorkspacePlanProductId
    getWorkspacePlanPriceId: GetWorkspacePlanPriceId
    reconcileSubscriptionData: ReconcileSubscriptionData
  }) =>
  async ({ workspaceId, role }: { workspaceId: string; role: WorkspaceRoles }) => {
    const workspacePlan = await getWorkspacePlan({ workspaceId })
    // if (!workspacePlan) throw new WorkspacePlanNotFoundError()
    if (!workspacePlan) return
    const workspaceSubscription = await getWorkspaceSubscription({ workspaceId })
    if (!workspaceSubscription) return
    // if (!workspaceSubscription) throw new WorkspaceSubscriptionNotFoundError()

    switch (workspacePlan.name) {
      case 'team':
      case 'pro':
        // Cause seat types matter, a future issue. ProductId should change based on seat type
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

    if (workspacePlan.status === 'canceled') return

    let productId: string
    let priceId: string
    let roleCount: number
    switch (role) {
      case 'workspace:guest':
        roleCount = await countWorkspaceRole({ workspaceId, workspaceRole: role })
        productId = getWorkspacePlanProductId({ workspacePlan: 'guest' })
        priceId = getWorkspacePlanPriceId({
          workspacePlan: 'guest',
          billingInterval: workspaceSubscription.billingInterval
        })
        break
      case 'workspace:admin':
      case 'workspace:member':
        roleCount = sum(
          await Promise.all([
            countWorkspaceRole({ workspaceId, workspaceRole: 'workspace:admin' }),
            countWorkspaceRole({ workspaceId, workspaceRole: 'workspace:member' })
          ])
        )
        productId = getWorkspacePlanProductId({ workspacePlan: workspacePlan.name })
        priceId = getWorkspacePlanPriceId({
          workspacePlan: workspacePlan.name,
          billingInterval: workspaceSubscription.billingInterval
        })
        break
      default:
        throwUncoveredError(role)
    }

    const subscriptionData: SubscriptionDataInput = cloneDeep(
      workspaceSubscription.subscriptionData
    )

    const currentPlanProduct = subscriptionData.products.find(
      (product) => product.productId === productId
    )
    if (!currentPlanProduct) {
      subscriptionData.products.push({ productId, priceId, quantity: roleCount })
    } else {
      // if there is enough seats, we do not have to do anything
      if (currentPlanProduct.quantity >= roleCount) return
      currentPlanProduct.quantity = roleCount
    }
    await reconcileSubscriptionData({ subscriptionData, applyProrotation: true })
  }

const mutateSubscriptionDataWithNewValidSeatNumbers = ({
  seatCount,
  workspacePlan,
  getWorkspacePlanProductId,
  subscriptionData
}: {
  seatCount: number
  workspacePlan: WorkspacePricingProducts
  getWorkspacePlanProductId: GetWorkspacePlanProductId
  subscriptionData: SubscriptionDataInput
}): void => {
  const productId = getWorkspacePlanProductId({ workspacePlan })
  const product = subscriptionData.products.find(
    (product) => product.productId === productId
  )
  if (seatCount < 0) throw new LogicError('Invalid seat count, cannot be negative')

  if (seatCount === 0 && product === undefined) return
  if (seatCount === 0 && product !== undefined) {
    const prodIndex = subscriptionData.products.indexOf(product)
    subscriptionData.products.splice(prodIndex, 1)
  } else if (product !== undefined && product.quantity >= seatCount) {
    product.quantity = seatCount
  } else {
    throw new LogicError('Invalid subscription state')
  }
}

const calculateNewBillingCycleEnd = ({
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

type DownscaleWorkspaceSubscription = (args: {
  workspaceSubscription: WorkspaceSubscription
}) => Promise<boolean>

export const downscaleWorkspaceSubscriptionFactory =
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
      case 'pro':
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
      await reconcileSubscriptionData({ subscriptionData, applyProrotation: false })
      return true
    }
    return false
  }

export const manageSubscriptionDownscaleFactory =
  ({
    logger,
    getWorkspaceSubscriptions,
    downscaleWorkspaceSubscription,
    updateWorkspaceSubscription
  }: {
    getWorkspaceSubscriptions: GetWorkspaceSubscriptions
    downscaleWorkspaceSubscription: DownscaleWorkspaceSubscription
    updateWorkspaceSubscription: UpsertWorkspaceSubscription
    logger: Logger
  }) =>
  async () => {
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

export const upgradeWorkspaceSubscriptionFactory =
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

    if (
      !FF_WORKSPACES_NEW_PLANS_ENABLED &&
      (isNewPlanType(workspacePlan.name) || isNewPlanType(targetPlan))
    ) {
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

    await reconcileSubscriptionData({ subscriptionData, applyProrotation: true })
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
