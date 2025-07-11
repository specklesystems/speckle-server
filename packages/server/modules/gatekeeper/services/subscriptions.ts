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
import { cloneDeep, isEqual, omit } from 'lodash-es'
import { CountSeatsByTypeInWorkspace } from '@/modules/gatekeeper/domain/operations'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { GatekeeperEvents } from '@/modules/gatekeeperCore/domain/events'
import { Logger } from '@/observability/logging'

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
  async ({
    subscriptionData,
    logger
  }: {
    subscriptionData: SubscriptionData
    logger: Logger
  }) => {
    // we're only handling marking the sub scheduled for cancellation right now
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

    if (!status) {
      logger.info({ workspaceId: subscription.workspaceId }, 'Nothing to update')
      return
    }

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

    const updateIntent = subscription.updateIntent
    let planName
    let billingInterval
    let currentBillingCycleEnd
    let currency
    let updatedAt
    let userId

    if (updateIntent) {
      // this is the branch where a user intents to upgrade his subscription
      // if stripe comes back with a status, and we have a update intent in the subscription
      // we're assuming that the target that the user wants to upgrade was written in the update intent
      userId = updateIntent.userId
      planName = updateIntent.planName
      updatedAt = updateIntent.updatedAt
      currency = updateIntent.currency
      billingInterval = updateIntent.billingInterval
      currentBillingCycleEnd = updateIntent.currentBillingCycleEnd

      const productsAreEquivalent = (
        a: Array<{ priceId: string; quantity: number }>,
        b: Array<{ priceId: string; quantity: number }>
      ) =>
        a.every((item) => {
          return !!b.find(
            (bi) => bi.priceId === item.priceId && bi.quantity === item.quantity
          )
        })

      if (!productsAreEquivalent(updateIntent.products, subscriptionData.products)) {
        logger.error(
          {
            event: subscriptionData.products,
            target: updateIntent.products,
            workspaceId: subscription.workspaceId,
            targetPlanName: planName,
            planName: workspacePlan.name
          },
          'Fatal: Stripe product ID mismatch with subscription update intent'
        )
      }
    } else {
      userId = null
      planName = workspacePlan.name
      billingInterval = subscription.billingInterval
      currentBillingCycleEnd = subscription.currentBillingCycleEnd
      currency = subscription.currency
      updatedAt = new Date()

      // Stripe can have many cases were we receive an event
      // - subscription cancellation schedules
      // - subscription cancellations
      // - payment failures
      // - duplicated events
      // - manual changes in the dashboard
      // - ...
      // at the moment, we are assuming this new status and update the status as given by stripe
      // take into account that manual subscription updates in stripe dashboard can lead into
      // errors, as changing quantity in the products may work, but changing product ids wont update
      // the workspace plan and will result in errors
    }

    const newWorkspacePlan = {
      ...workspacePlan,
      status,
      name: planName,
      updatedAt
    }

    const newSubscription = {
      ...subscription,
      currency,
      currentBillingCycleEnd,
      billingInterval,
      updateIntent: null,
      updatedAt,
      subscriptionData
    }

    await upsertPaidWorkspacePlan({
      workspacePlan: newWorkspacePlan
    })
    await upsertWorkspaceSubscription({
      workspaceSubscription: newSubscription
    })

    const payload = {
      userId,
      workspacePlan: newWorkspacePlan,
      previousWorkspacePlan: workspacePlan,
      subscription: getSubscriptionState(newSubscription),
      previousSubscription: getSubscriptionState(subscription)
    }

    const planHasChanged = !isEqual(
      omit(payload.workspacePlan, ['updatedAt', 'createdAt']),
      omit(payload.previousWorkspacePlan, ['updatedAt', 'createdAt'])
    )

    if (planHasChanged) {
      await emitEvent({
        eventName: GatekeeperEvents.WorkspacePlanUpdated,
        payload: {
          userId,
          workspacePlan: payload.workspacePlan,
          previousWorkspacePlan: payload.previousWorkspacePlan
        }
      })
    }

    const susbcriptionHasChanged = !isEqual(
      payload.subscription,
      payload.previousSubscription
    )

    if (planHasChanged || susbcriptionHasChanged) {
      await emitEvent({
        eventName: GatekeeperEvents.WorkspaceSubscriptionUpdated,
        payload
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
    countSeatsByTypeInWorkspace,
    upsertWorkspaceSubscription
  }: {
    getWorkspacePlan: GetWorkspacePlan
    getWorkspaceSubscription: GetWorkspaceSubscription
    getWorkspacePlanProductId: GetWorkspacePlanProductId
    getWorkspacePlanPriceId: GetWorkspacePlanPriceId
    reconcileSubscriptionData: ReconcileSubscriptionData
    countSeatsByTypeInWorkspace: CountSeatsByTypeInWorkspace
    upsertWorkspaceSubscription: UpsertWorkspaceSubscription
  }) =>
  async ({
    updatedByUserId,
    workspaceId,
    seatType
  }: {
    updatedByUserId: string
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
    await upsertWorkspaceSubscription({
      workspaceSubscription: {
        ...workspaceSubscription,
        updateIntent: {
          userId: updatedByUserId,
          products: subscriptionData.products,
          planName: workspacePlan.name,
          currentBillingCycleEnd: workspaceSubscription.currentBillingCycleEnd,
          currency: workspaceSubscription.currency,
          billingInterval: workspaceSubscription.billingInterval,
          updatedAt: new Date()
        }
      }
    })
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
