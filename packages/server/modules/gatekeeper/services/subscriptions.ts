import { Logger } from '@/logging/logging'
import {
  GetWorkspacePlan,
  GetWorkspacePlanPrice,
  GetWorkspacePlanProductId,
  GetWorkspaceSubscription,
  GetWorkspaceSubscriptionBySubscriptionId,
  GetWorkspaceSubscriptions,
  PaidWorkspacePlanStatuses,
  ReconcileSubscriptionData,
  SubscriptionData,
  SubscriptionDataInput,
  UpsertPaidWorkspacePlan,
  UpsertWorkspaceSubscription,
  WorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import { WorkspacePricingPlans } from '@/modules/gatekeeper/domain/workspacePricing'
import {
  WorkspacePlanMismatchError,
  WorkspacePlanNotFoundError,
  WorkspaceSubscriptionNotFoundError
} from '@/modules/gatekeeper/errors/billing'
import { CountWorkspaceRoleWithOptionalProjectRole } from '@/modules/workspaces/domain/operations'
import { throwUncoveredError, WorkspaceRoles } from '@speckle/shared'
import { cloneDeep, isEqual, sum } from 'lodash'

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
          break
        case 'unlimited':
        case 'academia':
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
    getWorkspacePlanPrice,
    reconcileSubscriptionData
  }: {
    getWorkspacePlan: GetWorkspacePlan
    getWorkspaceSubscription: GetWorkspaceSubscription
    countWorkspaceRole: CountWorkspaceRoleWithOptionalProjectRole
    getWorkspacePlanProductId: GetWorkspacePlanProductId
    getWorkspacePlanPrice: GetWorkspacePlanPrice
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
      case 'starter':
      case 'plus':
      case 'business':
        break
      case 'unlimited':
      case 'academia':
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
        priceId = getWorkspacePlanPrice({
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
        priceId = getWorkspacePlanPrice({
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
  workspacePlan: WorkspacePricingPlans
  getWorkspacePlanProductId: GetWorkspacePlanProductId
  subscriptionData: SubscriptionData
}): void => {
  const productId = getWorkspacePlanProductId({ workspacePlan })
  const product = subscriptionData.products.find(
    (product) => product.productId === productId
  )
  if (seatCount < 0) throw new Error('Invalid seat count, cannot be negative')

  if (seatCount === 0 && product === undefined) return
  if (seatCount === 0 && product !== undefined) {
    const prodIndex = subscriptionData.products.indexOf(product)
    subscriptionData.products.splice(prodIndex, 1)
  } else if (product !== undefined && product.quantity >= seatCount) {
    product.quantity = seatCount
  } else {
    throw new Error('Invalid subscription state')
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
      case 'starter':
      case 'plus':
      case 'business':
        break
      case 'unlimited':
      case 'academia':
        throw new WorkspacePlanMismatchError()
      default:
        throwUncoveredError(workspacePlan)
    }

    if (workspacePlan.status === 'canceled') return false

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
