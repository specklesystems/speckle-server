import {
  CheckoutSession,
  CreateCheckoutSession,
  GetWorkspacePlan,
  StoreCheckoutSession
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
    storeCheckoutSession
  }: {
    getWorkspacePlan: GetWorkspacePlan
    countRole: CountWorkspaceRoleWithOptionalProjectRole
    createCheckoutSession: CreateCheckoutSession
    storeCheckoutSession: StoreCheckoutSession
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

    await storeCheckoutSession({ checkoutSession })
    return checkoutSession
  }
