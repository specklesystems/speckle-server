import type {
  GetCheckoutSession,
  UpdateCheckoutSessionStatus,
  UpsertWorkspaceSubscription,
  UpsertPaidWorkspacePlan,
  GetSubscriptionData,
  GetWorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import { getSubscriptionState } from '@/modules/gatekeeper/domain/billing'
import {
  CheckoutSessionNotFoundError,
  WorkspaceAlreadyPaidError,
  WorkspacePlanNotFoundError
} from '@/modules/gatekeeper/errors/billing'
import { throwUncoveredError } from '@speckle/shared'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import type { GetWorkspacePlan } from '@speckle/shared/authz'
import { GatekeeperEvents } from '@/modules/gatekeeperCore/domain/events'

export const completeCheckoutSessionFactory =
  ({
    getCheckoutSession,
    updateCheckoutSessionStatus,
    upsertWorkspaceSubscription,
    upsertPaidWorkspacePlan,
    getWorkspacePlan,
    getWorkspaceSubscription,
    getSubscriptionData,
    emitEvent
  }: {
    getCheckoutSession: GetCheckoutSession
    updateCheckoutSessionStatus: UpdateCheckoutSessionStatus
    upsertWorkspaceSubscription: UpsertWorkspaceSubscription
    getWorkspacePlan: GetWorkspacePlan
    getWorkspaceSubscription: GetWorkspaceSubscription
    upsertPaidWorkspacePlan: UpsertPaidWorkspacePlan
    getSubscriptionData: GetSubscriptionData
    emitEvent: EventBusEmit
  }) =>
  /**
   * Complete a paid checkout session
   */
  async ({
    sessionId,
    subscriptionId
  }: {
    sessionId: string
    subscriptionId: string
  }): Promise<void> => {
    const checkoutSession = await getCheckoutSession({ sessionId })
    if (!checkoutSession) throw new CheckoutSessionNotFoundError()

    const previousWorkspacePlan = await getWorkspacePlan({
      workspaceId: checkoutSession.workspaceId
    })
    if (!previousWorkspacePlan) throw new WorkspacePlanNotFoundError()

    // on states like cancellations, there is a subscription
    const previousSubscription = await getWorkspaceSubscription({
      workspaceId: checkoutSession.workspaceId
    })

    switch (checkoutSession.paymentStatus) {
      case 'paid':
        // if the session is already paid, we do not need to provision anything
        throw new WorkspaceAlreadyPaidError()
      case 'unpaid':
        break
      default:
        throwUncoveredError(checkoutSession.paymentStatus)
    }
    // TODO: make sure, the subscription data price plan matches the checkout session workspacePlan

    await updateCheckoutSessionStatus({ sessionId, paymentStatus: 'paid' })

    // a plan determines the workspace feature set
    const workspacePlan = {
      createdAt: new Date(),
      updatedAt: new Date(),
      workspaceId: checkoutSession.workspaceId,
      name: checkoutSession.workspacePlan,
      status: 'valid',
      featureFlags: previousWorkspacePlan.featureFlags
    } as const
    await upsertPaidWorkspacePlan({
      workspacePlan
    })
    const subscriptionData = await getSubscriptionData({
      subscriptionId
    })
    const currentBillingCycleEnd = subscriptionData.currentPeriodEnd

    const workspaceSubscription = {
      createdAt: new Date(),
      updatedAt: new Date(),
      currentBillingCycleEnd,
      workspaceId: checkoutSession.workspaceId,
      billingInterval: checkoutSession.billingInterval,
      currency: checkoutSession.currency,
      updateIntent: null,
      subscriptionData
    }
    await upsertWorkspaceSubscription({
      workspaceSubscription
    })
    await emitEvent({
      eventName: GatekeeperEvents.WorkspacePlanUpdated,
      payload: {
        userId: checkoutSession.userId,
        workspacePlan,
        previousWorkspacePlan
      }
    })
    await emitEvent({
      eventName: GatekeeperEvents.WorkspaceSubscriptionUpdated,
      payload: {
        userId: checkoutSession.userId,
        workspacePlan,
        previousWorkspacePlan,
        subscription: getSubscriptionState(workspaceSubscription),
        previousSubscription: previousSubscription
          ? getSubscriptionState(previousSubscription)
          : null
      }
    })
  }
