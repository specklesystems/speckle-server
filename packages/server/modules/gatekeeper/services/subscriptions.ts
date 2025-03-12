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
  WorkspaceSeatType,
  WorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import {
  WorkspacePlanMismatchError,
  WorkspacePlanNotFoundError,
  WorkspaceSubscriptionNotFoundError
} from '@/modules/gatekeeper/errors/billing'
import { isNewPaidPlanType } from '@/modules/gatekeeper/helpers/plans'
import { NotImplementedError } from '@/modules/shared/errors'
import { CountWorkspaceRoleWithOptionalProjectRole } from '@/modules/workspaces/domain/operations'
import {
  PaidWorkspacePlanStatuses,
  throwUncoveredError,
  WorkspaceRoles
} from '@speckle/shared'
import { cloneDeep, isEqual, sum } from 'lodash'
import { mutateSubscriptionDataWithNewValidSeatNumbers } from '@/modules/gatekeeper/services/subscriptions/mutateSubscriptionDataWithNewValidSeatNumbers'
import { calculateNewBillingCycleEnd } from '@/modules/gatekeeper/services/subscriptions/calculateNewBillingCycleEnd'
import { CountSeatsByTypeInWorkspace } from '@/modules/gatekeeper/domain/operations'

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
    reconcileSubscriptionData,
    countSeatsByTypeInWorkspace
  }: {
    getWorkspacePlan: GetWorkspacePlan
    getWorkspaceSubscription: GetWorkspaceSubscription
    countWorkspaceRole: CountWorkspaceRoleWithOptionalProjectRole
    getWorkspacePlanProductId: GetWorkspacePlanProductId
    getWorkspacePlanPriceId: GetWorkspacePlanPriceId
    reconcileSubscriptionData: ReconcileSubscriptionData
    countSeatsByTypeInWorkspace: CountSeatsByTypeInWorkspace
  }) =>
  async ({
    workspaceId,
    role,
    seatType
  }: {
    workspaceId: string
    role: WorkspaceRoles
    seatType: WorkspaceSeatType
  }) => {
    const workspacePlan = await getWorkspacePlan({ workspaceId })
    // if (!workspacePlan) throw new WorkspacePlanNotFoundError()
    if (!workspacePlan) return
    const workspaceSubscription = await getWorkspaceSubscription({ workspaceId })
    if (!workspaceSubscription) return
    // if (!workspaceSubscription) throw new WorkspaceSubscriptionNotFoundError()
    const isNewPaidPlan = isNewPaidPlanType(workspacePlan.name)

    switch (workspacePlan.name) {
      case 'team':
      case 'pro':
        // If viewer seat type, we don't need to do anything
        if (seatType === WorkspaceSeatType.Viewer) return
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
    let productAmount: number

    if (isNewPaidPlan) {
      // New logic, only based on seat types
      productAmount = await countSeatsByTypeInWorkspace({ workspaceId, type: seatType })
      productId = getWorkspacePlanProductId({ workspacePlan: workspacePlan.name })
      priceId = getWorkspacePlanPriceId({
        workspacePlan: workspacePlan.name,
        billingInterval: workspaceSubscription.billingInterval
      })
    } else {
      // Old logic for old plans - based on roles
      switch (role) {
        case 'workspace:guest':
          productAmount = await countWorkspaceRole({ workspaceId, workspaceRole: role })
          productId = getWorkspacePlanProductId({ workspacePlan: 'guest' })
          priceId = getWorkspacePlanPriceId({
            workspacePlan: 'guest',
            billingInterval: workspaceSubscription.billingInterval
          })
          break
        case 'workspace:admin':
        case 'workspace:member':
          productAmount = sum(
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
    }

    const subscriptionData: SubscriptionDataInput = cloneDeep(
      workspaceSubscription.subscriptionData
    )

    const currentPlanProduct = subscriptionData.products.find(
      (product) => product.productId === productId
    )
    if (!currentPlanProduct) {
      subscriptionData.products.push({ productId, priceId, quantity: productAmount })
    } else {
      // if there is enough seats, we do not have to do anything
      if (currentPlanProduct.quantity >= productAmount) return
      currentPlanProduct.quantity = productAmount
    }
    await reconcileSubscriptionData({
      subscriptionData,
      prorationBehavior: isNewPaidPlan ? 'always_invoice' : 'create_prorations'
    })
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
      await reconcileSubscriptionData({ subscriptionData, prorationBehavior: 'none' })
      return true
    }
    return false
  }

export const manageSubscriptionDownscaleFactory =
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
