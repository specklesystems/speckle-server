import {
  CheckoutSession,
  GetCheckoutSession,
  GetWorkspacePlan,
  SaveCheckoutSession,
  UpdateCheckoutSessionStatus,
  UpsertWorkspacePlan,
  SaveWorkspaceSubscription,
  WorkspaceSubscription,
  WorkspacePlan,
  UpsertPaidWorkspacePlan,
  DeleteCheckoutSession,
  GetWorkspaceCheckoutSession
} from '@/modules/gatekeeper/domain/billing'
import { CheckoutSessionNotFoundError } from '@/modules/gatekeeper/errors/billing'

export const getWorkspacePlanFactory =
  (): GetWorkspacePlan =>
  ({ workspaceId }) => {
    const maybePlan = workspacePlans.find((plan) => plan.workspaceId === workspaceId)
    return new Promise((resolve) => {
      resolve(maybePlan || null)
    })
  }

const workspacePlans: WorkspacePlan[] = []

const upsertWorkspacePlanFactory =
  (): UpsertWorkspacePlan =>
  ({ workspacePlan }) => {
    const maybePlan = workspacePlans.find(
      (plan) => plan.workspaceId === workspacePlan.workspaceId
    )
    if (maybePlan) {
      maybePlan.name = workspacePlan.name
      maybePlan.status = workspacePlan.status
    } else {
      workspacePlans.push(workspacePlan)
    }
    return new Promise((resolve) => {
      resolve()
    })
  }

// this is a typed rebrand of the generic workspace plan upsert
// this way TS guards the payment plan type validity
export const upsertPaidWorkspacePlanFactory = (): UpsertPaidWorkspacePlan =>
  upsertWorkspacePlanFactory()

const checkoutSessions: CheckoutSession[] = []

export const saveCheckoutSessionFactory =
  (): SaveCheckoutSession =>
  ({ checkoutSession }) => {
    checkoutSessions.push(checkoutSession)
    return new Promise((resolve) => {
      resolve()
    })
  }

export const deleteCheckoutSessionFactory = (): DeleteCheckoutSession => () => {
  return new Promise((resolve) => {
    resolve()
  })
}

export const getCheckoutSessionFactory =
  (): GetCheckoutSession =>
  ({ sessionId }) => {
    return new Promise((resolve) => {
      resolve(checkoutSessions.find((session) => session.id === sessionId) || null)
    })
  }

export const getWorkspaceCheckoutSessionFactory =
  (): GetWorkspaceCheckoutSession =>
  ({ workspaceId }) => {
    return new Promise((resolve) => {
      resolve(
        checkoutSessions.find((session) => session.workspaceId === workspaceId) || null
      )
    })
  }

export const updateCheckoutSessionStatusFactory =
  (): UpdateCheckoutSessionStatus =>
  ({ sessionId, paymentStatus }) => {
    const session = checkoutSessions.find((session) => session.id === sessionId)
    if (!session) throw new CheckoutSessionNotFoundError()
    session.paymentStatus = paymentStatus
    return new Promise((resolve) => {
      resolve()
    })
  }

const workspaceSubscriptions: WorkspaceSubscription[] = []

export const saveWorkspaceSubscriptionFactory =
  (): SaveWorkspaceSubscription =>
  ({ workspaceSubscription }) => {
    workspaceSubscriptions.push(workspaceSubscription)
    return new Promise((resolve) => {
      resolve()
    })
  }
