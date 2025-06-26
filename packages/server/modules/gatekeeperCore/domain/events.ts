import { WorkspacePlan } from '@speckle/shared'

export const gatekeeperEventNamespace = 'gatekeeper' as const

const eventPrefix = `${gatekeeperEventNamespace}.` as const

export const GatekeeperEvents = {
  WorkspaceTrialExpired: `${eventPrefix}workspace-trial-expired`,
  WorkspacePlanUpdated: `${eventPrefix}workspace-plan-updated`,
  WorkspaceSubscriptionUpdated: `${eventPrefix}workspace-subscription-updated`
} as const

export type SubscriptionState = {
  totalEditorSeats: number
  billingInterval: string
}

export type GatekeeperEventPayloads = {
  [GatekeeperEvents.WorkspaceTrialExpired]: { workspaceId: string }
  [GatekeeperEvents.WorkspacePlanUpdated]: {
    userId: string | null
    workspacePlan: WorkspacePlan
    previousWorkspacePlan: WorkspacePlan | null
  }
  [GatekeeperEvents.WorkspaceSubscriptionUpdated]: {
    userId: string | null
    workspacePlan: WorkspacePlan
    subscription: SubscriptionState
    previousWorkspacePlan: WorkspacePlan
    previousSubscription: SubscriptionState
  }
}
