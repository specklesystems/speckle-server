import {
  getSubscriptionState,
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
import {
  PaidWorkspacePlans,
  PaidWorkspacePlanStatuses,
  throwUncoveredError,
  WorkspacePlans
} from '@speckle/shared'
import { cloneDeep } from 'lodash'
import { CountSeatsByTypeInWorkspace } from '@/modules/gatekeeper/domain/operations'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { GatekeeperEvents } from '@/modules/gatekeeperCore/domain/events'

export const handleSubscriptionUpdateFactory =
  ({
    upsertPaidWorkspacePlan,
    getWorkspacePlan,
    getWorkspaceSubscriptionBySubscriptionId,
    upsertWorkspaceSubscription,
    emitEvent
  }: {
    getWorkspacePlan: GetWorkspacePlan
    upsertPaidWorkspacePlan: UpsertPaidWorkspacePlan
    getWorkspaceSubscriptionBySubscriptionId: GetWorkspaceSubscriptionBySubscriptionId
    upsertWorkspaceSubscription: UpsertWorkspaceSubscription
    emitEvent: EventBusEmit
  }) =>
  async ({ subscriptionData }: { subscriptionData: SubscriptionData }) => {
    // we're only handling marking the sub scheduled for cancelation right now
    const subscription = await getWorkspaceSubscriptionBySubscriptionId({
      subscriptionId: subscriptionData.subscriptionId
    })
    if (!subscription) {
      if (subscriptionData.status === 'incomplete') {
        // the checkout was not completed, so not finding a matching workspace subscription is expected
        return
      }
      throw new WorkspaceSubscriptionNotFoundError()
    }

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
        case WorkspacePlans.Team:
        case WorkspacePlans.TeamUnlimited:
        case WorkspacePlans.Pro:
        case WorkspacePlans.ProUnlimited:
          break
        case WorkspacePlans.Unlimited:
        case WorkspacePlans.Academia:
        case WorkspacePlans.ProUnlimitedInvoiced:
        case WorkspacePlans.TeamUnlimitedInvoiced:
        case WorkspacePlans.Free:
        case WorkspacePlans.Enterprise:
          throw new WorkspacePlanMismatchError()
        default:
          throwUncoveredError(workspacePlan)
      }

      const newWorkspacePlan = { ...workspacePlan, status }
      await upsertPaidWorkspacePlan({
        workspacePlan: newWorkspacePlan
      })
      // if there is a status in the sub, we recognize, we need to update our state
      const newWorkspaceSubscription = {
        ...subscription,
        updatedAt: new Date(),
        subscriptionData
      }
      await upsertWorkspaceSubscription({
        workspaceSubscription: newWorkspaceSubscription
      })

      await emitEvent({
        eventName: GatekeeperEvents.WorkspaceSubscriptionUpdated,
        payload: {
          workspacePlan: newWorkspacePlan,
          previousWorkspacePlan: workspacePlan,
          subscription: getSubscriptionState(newWorkspaceSubscription),
          previousSubscription: getSubscriptionState(subscription)
        }
      })
    }
  }

export const addWorkspaceSubscriptionSeatIfNeededFactory =
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

    switch (workspacePlan.name) {
      case WorkspacePlans.Team:
      case WorkspacePlans.TeamUnlimited:
      case WorkspacePlans.Pro:
      case WorkspacePlans.ProUnlimited:
        // If viewer seat type, we don't need to do anything
        if (seatType === WorkspaceSeatType.Viewer) {
          return
        } else {
          break
        }
      case WorkspacePlans.Unlimited:
      case WorkspacePlans.Academia:
      case WorkspacePlans.ProUnlimitedInvoiced:
      case WorkspacePlans.TeamUnlimitedInvoiced:
      case WorkspacePlans.Free:
      case WorkspacePlans.Enterprise:
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
      billingInterval: workspaceSubscription.billingInterval,
      currency: workspaceSubscription.currency
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
    workspacePlan: PaidWorkspacePlans
    subscriptionData: Pick<SubscriptionData, 'products'>
  }) => {
    const productId = getWorkspacePlanProductId({
      workspacePlan
    })
    const product = subscriptionData.products.find(
      (product) => product.productId === productId
    )
    return product?.quantity ?? 0
  }
