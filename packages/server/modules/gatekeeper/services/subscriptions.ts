import {
  GetWorkspacePlan,
  GetWorkspacePlanPriceId,
  GetWorkspacePlanProductId,
  GetWorkspaceSubscription,
  GetWorkspaceSubscriptionBySubscriptionId,
  ReconcileSubscriptionData,
  SubscriptionData,
  SubscriptionDataInput,
  UpsertPaidWorkspacePlan,
  UpsertWorkspaceSubscription,
  WorkspaceSeatType
} from '@/modules/gatekeeper/domain/billing'
import {
  WorkspacePlanMismatchError,
  WorkspacePlanNotFoundError,
  WorkspaceSubscriptionNotFoundError
} from '@/modules/gatekeeper/errors/billing'
import { isNewPlanType } from '@/modules/gatekeeper/helpers/plans'
import { NotImplementedError } from '@/modules/shared/errors'
import { CountWorkspaceRoleWithOptionalProjectRole } from '@/modules/workspaces/domain/operations'
import {
  PaidWorkspacePlanStatuses,
  throwUncoveredError,
  WorkspaceRoles
} from '@speckle/shared'
import { cloneDeep, sum } from 'lodash'
import { CountSeatsByTypeInWorkspace } from '@/modules/gatekeeper/domain/operations'
import { WorkspacePlan } from '@/modules/gatekeeperCore/domain/billing'

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

export const addWorkspaceSubscriptionSeatIfNeededFactoryNew =
  ({
    getWorkspacePlan,
    getWorkspaceSubscription,
    getWorkspacePlanProductId,
    getWorkspacePlanPriceId,
    reconcileSubscriptionData,
    countSeatsByTypeInWorkspace
  }: {
    getWorkspacePlan: GetWorkspacePlan
    getWorkspaceSubscription: GetWorkspaceSubscription
    getWorkspacePlanProductId: GetWorkspacePlanProductId
    getWorkspacePlanPriceId: GetWorkspacePlanPriceId
    reconcileSubscriptionData: ReconcileSubscriptionData
    countSeatsByTypeInWorkspace: CountSeatsByTypeInWorkspace
  }) =>
  async ({
    workspaceId,
    seatType
  }: {
    workspaceId: string
    seatType: WorkspaceSeatType
  }) => {
    const workspacePlan = await getWorkspacePlan({ workspaceId })
    // if (!workspacePlan) throw new WorkspacePlanNotFoundError()
    if (!workspacePlan) return
    const workspaceSubscription = await getWorkspaceSubscription({ workspaceId })
    if (!workspaceSubscription) return
    // if (!workspaceSubscription) throw new WorkspaceSubscriptionNotFoundError()
    const isNewPlan = isNewPlanType(workspacePlan.name)
    if (!isNewPlan) {
      // old plans not supported
      return
    }

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

    // New logic, only based on seat types
    const productAmount = await countSeatsByTypeInWorkspace({
      workspaceId,
      type: seatType
    })
    const productId = getWorkspacePlanProductId({ workspacePlan: workspacePlan.name })
    const priceId = getWorkspacePlanPriceId({
      workspacePlan: workspacePlan.name,
      billingInterval: workspaceSubscription.billingInterval
    })

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
      prorationBehavior: 'always_invoice'
    })
  }

export const addWorkspaceSubscriptionSeatIfNeededFactoryOld =
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
    const isNewPlan = isNewPlanType(workspacePlan.name)
    if (isNewPlan) {
      // new plans not supported
      return
    }

    switch (workspacePlan.name) {
      case 'team':
      case 'pro':
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
    let productAmount: number

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
      prorationBehavior: 'create_prorations'
    })
  }

export const getTotalSeatsCountByPlanFactory =
  ({
    getWorkspacePlanProductId
  }: {
    getWorkspacePlanProductId: GetWorkspacePlanProductId
  }) =>
  ({
    workspacePlan,
    subscriptionData
  }: {
    workspacePlan: Pick<WorkspacePlan, 'name'>
    subscriptionData: Pick<SubscriptionData, 'products'>
  }) => {
    if (workspacePlan.name === 'free') {
      return 3 // Max editors seats in the free plan
    }
    const productId = getWorkspacePlanProductId({
      workspacePlan: workspacePlan.name as 'pro' | 'team'
    })
    const product = subscriptionData.products.find(
      (product) => product.productId === productId
    )
    return product?.quantity ?? 0
  }
