import {
  CheckoutSession,
  CreateCheckoutSession,
  CreateCheckoutSessionOld,
  DeleteCheckoutSession,
  GetWorkspaceCheckoutSession,
  GetWorkspacePlan,
  SaveCheckoutSession
} from '@/modules/gatekeeper/domain/billing'
import { CountSeatsByTypeInWorkspace } from '@/modules/gatekeeper/domain/operations'
import {
  InvalidWorkspacePlanUpgradeError,
  WorkspaceAlreadyPaidError,
  WorkspaceCheckoutSessionInProgressError
} from '@/modules/gatekeeper/errors/billing'
import { isUpgradeWorkspacePlanValid } from '@/modules/gatekeeper/services/upgrades'
import { NotFoundError } from '@/modules/shared/errors'
import { CountWorkspaceRoleWithOptionalProjectRole } from '@/modules/workspaces/domain/operations'
import {
  PaidWorkspacePlans,
  Roles,
  throwUncoveredError,
  WorkspacePlanBillingIntervals
} from '@speckle/shared'

export const startCheckoutSessionFactoryOld =
  ({
    getWorkspaceCheckoutSession,
    deleteCheckoutSession,
    getWorkspacePlan,
    countRole,
    createCheckoutSession,
    saveCheckoutSession
  }: {
    getWorkspaceCheckoutSession: GetWorkspaceCheckoutSession
    deleteCheckoutSession: DeleteCheckoutSession
    getWorkspacePlan: GetWorkspacePlan
    countRole: CountWorkspaceRoleWithOptionalProjectRole
    createCheckoutSession: CreateCheckoutSessionOld
    saveCheckoutSession: SaveCheckoutSession
  }) =>
  async ({
    workspaceId,
    workspaceSlug,
    workspacePlan,
    billingInterval,
    isCreateFlow
  }: {
    workspaceId: string
    workspaceSlug: string
    workspacePlan: PaidWorkspacePlans
    billingInterval: WorkspacePlanBillingIntervals
    isCreateFlow: boolean
  }): Promise<CheckoutSession> => {
    // get workspace plan, if we're already on a paid plan, do not allow checkout
    // paid plans should use a subscription modification
    const existingWorkspacePlan = await getWorkspacePlan({ workspaceId })

    if (existingWorkspacePlan) {
      // it will technically not be possible to not have
      // maybe we can just ignore the plan not existing, cause we're putting it on a plan post checkout
      switch (existingWorkspacePlan.status) {
        // valid and paymentFailed, but not canceled status is not something we need a checkout for
        // we already have their credit card info
        case 'valid':
        case 'paymentFailed':
        case 'cancelationScheduled':
          throw new WorkspaceAlreadyPaidError()
        case 'canceled':
          const existingCheckoutSession = await getWorkspaceCheckoutSession({
            workspaceId
          })
          if (existingCheckoutSession)
            await deleteCheckoutSession({
              checkoutSessionId: existingCheckoutSession?.id
            })
          break

        // maybe, we can reactivate canceled plans via the sub in stripe, but this is fine too
        // it will create a new customer and a new sub though, the reactivation would use the existing customer
        case 'trial':
        case 'expired':
          // lets go ahead and pay
          break
        default:
          throwUncoveredError(existingWorkspacePlan)
      }
    }

    // if there is already a checkout session for the workspace, stop, someone else is maybe trying to pay for the workspace
    const workspaceCheckoutSession = await getWorkspaceCheckoutSession({
      workspaceId
    })
    if (workspaceCheckoutSession) {
      if (workspaceCheckoutSession.paymentStatus === 'paid')
        // this is should not be possible, but its better to be checking it here, than double charging the customer
        throw new WorkspaceAlreadyPaidError()
      if (
        new Date().getTime() - workspaceCheckoutSession.createdAt.getTime() >
        1000
        // 10 * 60 * 1000
      ) {
        await deleteCheckoutSession({
          checkoutSessionId: workspaceCheckoutSession.id
        })
      } else {
        throw new WorkspaceCheckoutSessionInProgressError()
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
      seatCount: adminCount + memberCount,
      isCreateFlow
    })

    await saveCheckoutSession({ checkoutSession })
    return checkoutSession
  }

export const startCheckoutSessionFactoryNew =
  ({
    getWorkspaceCheckoutSession,
    deleteCheckoutSession,
    getWorkspacePlan,
    countSeatsByTypeInWorkspace,
    createCheckoutSession,
    saveCheckoutSession
  }: {
    getWorkspaceCheckoutSession: GetWorkspaceCheckoutSession
    deleteCheckoutSession: DeleteCheckoutSession
    getWorkspacePlan: GetWorkspacePlan
    countSeatsByTypeInWorkspace: CountSeatsByTypeInWorkspace
    createCheckoutSession: CreateCheckoutSession
    saveCheckoutSession: SaveCheckoutSession
  }) =>
  async ({
    workspaceId,
    workspaceSlug,
    workspacePlan,
    billingInterval,
    isCreateFlow
  }: {
    workspaceId: string
    workspaceSlug: string
    workspacePlan: PaidWorkspacePlans
    billingInterval: WorkspacePlanBillingIntervals
    isCreateFlow: boolean
  }): Promise<CheckoutSession> => {
    const existingWorkspacePlan = await getWorkspacePlan({ workspaceId })

    if (!existingWorkspacePlan) {
      // New plans are enabled so we assume a plan is always present (the free plan)
      throw new NotFoundError('Workspace does not have a plan', {
        info: { workspaceId }
      })
    }

    const upgradeValid = isUpgradeWorkspacePlanValid({
      current: existingWorkspacePlan.name,
      upgrade: workspacePlan
    })
    if (!upgradeValid) {
      throw new InvalidWorkspacePlanUpgradeError(null, {
        info: {
          workspaceId,
          currentPlan: existingWorkspacePlan.name,
          upgradePlan: workspacePlan
        }
      })
    }

    // it will technically not be possible to not have
    // maybe we can just ignore the plan not existing, cause we're putting it on a plan post checkout
    switch (existingWorkspacePlan.status) {
      // valid and paymentFailed, but not canceled status is not something we need a checkout for
      // we already have their credit card info
      case 'valid':
      case 'paymentFailed':
      case 'cancelationScheduled':
        if (existingWorkspacePlan.name === 'free') {
          break
        }
        throw new WorkspaceAlreadyPaidError()
      case 'canceled':
        const existingCheckoutSession = await getWorkspaceCheckoutSession({
          workspaceId
        })
        if (existingCheckoutSession)
          await deleteCheckoutSession({
            checkoutSessionId: existingCheckoutSession?.id
          })
        break

      // maybe, we can reactivate canceled plans via the sub in stripe, but this is fine too
      // it will create a new customer and a new sub though, the reactivation would use the existing customer
      case 'trial':
      case 'expired':
        // lets go ahead and pay
        break
      default:
        throwUncoveredError(existingWorkspacePlan)
    }

    // if there is already a checkout session for the workspace, stop, someone else is maybe trying to pay for the workspace
    const workspaceCheckoutSession = await getWorkspaceCheckoutSession({
      workspaceId
    })
    if (workspaceCheckoutSession) {
      if (workspaceCheckoutSession.paymentStatus === 'paid')
        // this is should not be possible, but its better to be checking it here, than double charging the customer
        throw new WorkspaceAlreadyPaidError()
      if (
        new Date().getTime() - workspaceCheckoutSession.createdAt.getTime() >
        1000
        // 10 * 60 * 1000
      ) {
        await deleteCheckoutSession({
          checkoutSessionId: workspaceCheckoutSession.id
        })
      } else {
        throw new WorkspaceCheckoutSessionInProgressError()
      }
    }

    const editorsCount = await countSeatsByTypeInWorkspace({
      workspaceId,
      type: 'editor'
    })
    if (!editorsCount) {
      throw new InvalidWorkspacePlanUpgradeError('Workspace has no seats')
    }

    const checkoutSession = await createCheckoutSession({
      workspaceId,
      workspaceSlug,
      billingInterval,
      workspacePlan,
      editorsCount,
      isCreateFlow
    })

    await saveCheckoutSession({ checkoutSession })
    return checkoutSession
  }
