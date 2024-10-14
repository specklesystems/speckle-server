import {
  CheckoutSession,
  GetCheckoutSession,
  GetWorkspacePlan,
  SaveCheckoutSession,
  UpsertWorkspacePlan,
  WorkspacePlan
} from '@/modules/gatekeeper/domain/billing'

export const getWorkspacePlanFactory =
  (): GetWorkspacePlan =>
  ({ workspaceId }) => {
    const maybePlan = workspacePlans.find((plan) => plan.workspaceId === workspaceId)
    return new Promise((resolve) => {
      resolve(maybePlan || null)
    })
  }

const workspacePlans: WorkspacePlan[] = []

export const upsertWorkspacePlanFactory =
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

const checkoutSessions: CheckoutSession[] = []

export const saveCheckoutSessionFactory =
  (): SaveCheckoutSession =>
  ({ checkoutSession }) => {
    checkoutSessions.push(checkoutSession)
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
