import type { BillingInterval } from '@/modules/core/graph/generated/graphql'
import type { WorkspacePlan } from '@speckle/shared'

export const gatekeeperEventNamespace = 'gatekeeper' as const

const eventPrefix = `${gatekeeperEventNamespace}.` as const

export const GatekeeperEvents = {
  WorkspaceTrialExpired: `${eventPrefix}workspace-trial-expired`,
  WorkspacePlanCreated: `${eventPrefix}workspace-plan-created`,
  WorkspacePlanUpdated: `${eventPrefix}workspace-plan-updated`,
  WorkspaceSubscriptionUpdated: `${eventPrefix}workspace-subscription-updated`
} as const

export type SubscriptionState = {
  totalEditorSeats: number
  billingInterval: BillingInterval
}

export type GatekeeperEventPayloads = {
  [GatekeeperEvents.WorkspaceTrialExpired]: { workspaceId: string }
  [GatekeeperEvents.WorkspacePlanCreated]: {
    userId: string
    workspacePlan: WorkspacePlan
  }
  [GatekeeperEvents.WorkspacePlanUpdated]: {
    userId: string | null
    workspacePlan: WorkspacePlan
    previousWorkspacePlan: WorkspacePlan
  }
  [GatekeeperEvents.WorkspaceSubscriptionUpdated]: {
    userId: string | null
    workspacePlan: WorkspacePlan
    subscription: SubscriptionState
    previousWorkspacePlan: WorkspacePlan
    previousSubscription: SubscriptionState | null
  }
}
