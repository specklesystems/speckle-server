import type {
  CheckoutSession,
  CreateCheckoutSession,
  Currency,
  DeleteCheckoutSession,
  GetWorkspaceCheckoutSession,
  GetWorkspacePlan,
  SaveCheckoutSession
} from '@/modules/gatekeeper/domain/billing'
import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import type { CountSeatsByTypeInWorkspace } from '@/modules/gatekeeper/domain/operations'
import {
  InvalidWorkspacePlanUpgradeError,
  WorkspaceAlreadyPaidError,
  WorkspaceCheckoutSessionInProgressError
} from '@/modules/gatekeeper/errors/billing'
import { isUpgradeWorkspacePlanValid } from '@/modules/gatekeeper/services/upgrades'
import { NotFoundError } from '@/modules/shared/errors'
import type { PaidWorkspacePlans, WorkspacePlanBillingIntervals } from '@speckle/shared'
import { throwUncoveredError, TIME_MS } from '@speckle/shared'

export const startCheckoutSessionFactory =
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
    userId,
    workspaceSlug,
    workspacePlan,
    billingInterval,
    isCreateFlow,
    currency
  }: {
    workspaceId: string
    userId: string
    workspaceSlug: string
    workspacePlan: PaidWorkspacePlans
    billingInterval: WorkspacePlanBillingIntervals
    isCreateFlow: boolean
    currency: Currency
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
        1 * TIME_MS.second
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
      type: WorkspaceSeatType.Editor
    })
    if (!editorsCount) {
      throw new InvalidWorkspacePlanUpgradeError('Workspace has no seats')
    }

    const checkoutSession = await createCheckoutSession({
      workspaceId,
      userId,
      workspaceSlug,
      billingInterval,
      workspacePlan,
      editorsCount,
      isCreateFlow,
      currency
    })

    await saveCheckoutSession({ checkoutSession })
    return checkoutSession
  }
