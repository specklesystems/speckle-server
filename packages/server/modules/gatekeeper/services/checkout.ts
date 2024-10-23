import {
  CheckoutSession,
  CreateCheckoutSession,
  GetCheckoutSession,
  GetWorkspacePlan,
  SaveCheckoutSession,
  UpdateCheckoutSessionStatus,
  SaveWorkspaceSubscription,
  UpsertPaidWorkspacePlan,
  GetSubscriptionData,
  GetWorkspaceCheckoutSession
} from '@/modules/gatekeeper/domain/billing'
import {
  PaidWorkspacePlans,
  WorkspacePlanBillingIntervals
} from '@/modules/gatekeeper/domain/workspacePricing'
import {
  CheckoutSessionNotFoundError,
  WorkspaceAlreadyPaidError,
  WorkspaceCheckoutSessionInProgressError
} from '@/modules/gatekeeper/errors/billing'
import { CountWorkspaceRoleWithOptionalProjectRole } from '@/modules/workspaces/domain/operations'
import { Roles, throwUncoveredError } from '@speckle/shared'

export const startCheckoutSessionFactory =
  ({
    getWorkspaceCheckoutSession,
    getWorkspacePlan,
    countRole,
    createCheckoutSession,
    saveCheckoutSession
  }: {
    getWorkspaceCheckoutSession: GetWorkspaceCheckoutSession
    getWorkspacePlan: GetWorkspacePlan
    countRole: CountWorkspaceRoleWithOptionalProjectRole
    createCheckoutSession: CreateCheckoutSession
    saveCheckoutSession: SaveCheckoutSession
  }) =>
  async ({
    workspaceId,
    workspaceSlug,
    workspacePlan,
    billingInterval
  }: {
    workspaceId: string
    workspaceSlug: string
    workspacePlan: PaidWorkspacePlans
    billingInterval: WorkspacePlanBillingIntervals
  }): Promise<CheckoutSession> => {
    // get workspace plan, if we're already on a paid plan, do not allow checkout
    // paid plans should use a subscription modification
    const existingWorkspacePlan = await getWorkspacePlan({ workspaceId })
    // it will technically not be possible to not have
    if (existingWorkspacePlan) {
      // maybe we can just ignore the plan not existing, cause we're putting it on a plan post checkout
      switch (existingWorkspacePlan.status) {
        // valid and paymentFailed, but not cancelled status is not something we need a checkout for
        // we already have their credit card info
        case 'valid':
        case 'paymentFailed':
          throw new WorkspaceAlreadyPaidError()
        case 'cancelled':
        // maybe, we can reactivate cancelled plans via the sub in stripe, but this is fine too
        // it will create a new customer and a new sub though, the reactivation would use the existing customer
        case 'trial':
          // lets go ahead and pay
          break
        default:
          throwUncoveredError(existingWorkspacePlan)
      }
    }

    // if there is already a checkout session for the workspace, stop, someone else is maybe trying to pay for the workspace
    const workspaceCheckoutSession = await getWorkspaceCheckoutSession({ workspaceId })
    if (workspaceCheckoutSession) throw new WorkspaceCheckoutSessionInProgressError()

    const [adminCount, memberCount, guestCount] = await Promise.all([
      countRole({ workspaceId, workspaceRole: Roles.Workspace.Admin }),
      countRole({ workspaceId, workspaceRole: Roles.Workspace.Member }),
      countRole({ workspaceId, workspaceRole: Roles.Workspace.Guest })
    ])

    const checkoutSession = await createCheckoutSession({
      workspaceId,
      workspaceSlug,

      billingInterval,
      workspacePlan,
      guestCount,
      seatCount: adminCount + memberCount
    })

    await saveCheckoutSession({ checkoutSession })
    return checkoutSession
  }

export const completeCheckoutSessionFactory =
  ({
    getCheckoutSession,
    updateCheckoutSessionStatus,
    saveWorkspaceSubscription,
    upsertPaidWorkspacePlan,
    getSubscriptionData
  }: {
    getCheckoutSession: GetCheckoutSession
    updateCheckoutSessionStatus: UpdateCheckoutSessionStatus
    saveWorkspaceSubscription: SaveWorkspaceSubscription
    upsertPaidWorkspacePlan: UpsertPaidWorkspacePlan
    getSubscriptionData: GetSubscriptionData
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
    await upsertPaidWorkspacePlan({
      workspacePlan: {
        workspaceId: checkoutSession.workspaceId,
        name: checkoutSession.workspacePlan,
        status: 'valid'
      }
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

    await saveWorkspaceSubscription({
      workspaceSubscription
    })
  }
