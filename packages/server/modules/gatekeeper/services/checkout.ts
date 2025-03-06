import {
  GetCheckoutSession,
  UpdateCheckoutSessionStatus,
  UpsertWorkspaceSubscription,
  UpsertPaidWorkspacePlan,
  GetSubscriptionData
} from '@/modules/gatekeeper/domain/billing'
import {
  CheckoutSessionNotFoundError,
  WorkspaceAlreadyPaidError
} from '@/modules/gatekeeper/errors/billing'
import { throwUncoveredError } from '@speckle/shared'
import { EventBusEmit } from '@/modules/shared/services/eventBus'

export const completeCheckoutSessionFactory =
  ({
    getCheckoutSession,
    updateCheckoutSessionStatus,
    upsertWorkspaceSubscription,
    upsertPaidWorkspacePlan,
    getSubscriptionData,
    emitEvent
  }: {
    getCheckoutSession: GetCheckoutSession
    updateCheckoutSessionStatus: UpdateCheckoutSessionStatus
    upsertWorkspaceSubscription: UpsertWorkspaceSubscription
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
      workspaceId: checkoutSession.workspaceId,
      name: checkoutSession.workspacePlan,
      status: 'valid'
    } as const
    await upsertPaidWorkspacePlan({
      workspacePlan
    })
    const subscriptionData = await getSubscriptionData({
      subscriptionId
    })
    const currentBillingCycleEnd = new Date()
    switch (checkoutSession.billingInterval) {
      case 'monthly':
        currentBillingCycleEnd.setMonth(currentBillingCycleEnd.getMonth() + 1)
        break
      case 'yearly':
        currentBillingCycleEnd.setMonth(currentBillingCycleEnd.getMonth() + 12)
        break

      default:
        throwUncoveredError(checkoutSession.billingInterval)
    }

    const workspaceSubscription = {
      createdAt: new Date(),
      updatedAt: new Date(),
      currentBillingCycleEnd,
      workspaceId: checkoutSession.workspaceId,
      billingInterval: checkoutSession.billingInterval,
      subscriptionData
    }

    await upsertWorkspaceSubscription({
      workspaceSubscription
    })
    await emitEvent({
      eventName: 'gatekeeper.workspace-plan-updated',
      payload: {
        workspacePlan: {
          workspaceId: workspacePlan.workspaceId,
          status: workspacePlan.status,
          name: workspacePlan.name
        }
      }
    })
  }
