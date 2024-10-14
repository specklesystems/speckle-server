import {
  CheckoutSession,
  CreateCheckoutSession,
  GetCheckoutSession,
  GetWorkspacePlan,
  SessionInput,
  SaveCheckoutSession
} from '@/modules/gatekeeper/domain/billing'
import {
  WorkspacePlanBillingIntervals,
  WorkspacePlans
} from '@/modules/gatekeeper/domain/workspacePricing'
import { WorkspaceAlreadyPaidError } from '@/modules/gatekeeper/errors/billing'
import { CountWorkspaceRoleWithOptionalProjectRole } from '@/modules/workspaces/domain/operations'
import { Roles, throwUncoveredError } from '@speckle/shared'

export const startCheckoutSessionFactory =
  ({
    getWorkspacePlan,
    countRole,
    createCheckoutSession,
    saveCheckoutSession
  }: {
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
    workspacePlan: WorkspacePlans
    billingInterval: WorkspacePlanBillingIntervals
  }): Promise<CheckoutSession> => {
    // get workspace plan, if we're already on a paid plan, do not allow checkout
    // paid plans should use a subscription modification
    const existingWorkspacePlan = await getWorkspacePlan({ workspaceId })
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
          throwUncoveredError(existingWorkspacePlan.status)
      }
    }
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
  ({ getCheckoutSession }: { getCheckoutSession: GetCheckoutSession }) =>
  async ({ session }: { session: SessionInput }): Promise<void> => {
    const checkoutSession = await getCheckoutSession({ sessionId: session.id })
    if (!checkoutSession && session.paymentStatus === 'paid')
      throw new Error('checkout session is not found this is a bo bo')
    // idk what to do here, if there is no checkout session, it prob fine, could be a replay etc
    // but the more schematically correct thing would be, to throw an error
    if (!checkoutSession) return

    // if statuses match, nothing to do
    if (session.paymentStatus === checkoutSession.paymentStatus) return

    // update checkout session, to have the input payment status
    // prob in this case, we should not be allowing a to move a paid checkout session to paid

    if (session.paymentStatus === 'paid') {
      // move workspace to the plan, and payment status valid
      // save the workspace subscription information in the DB
    }
  }
