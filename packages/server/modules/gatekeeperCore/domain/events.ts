import { WorkspacePlan } from '@speckle/shared'

export const gatekeeperEventNamespace = 'gatekeeper' as const

const eventPrefix = `${gatekeeperEventNamespace}.` as const

export const GatekeeperEvents = {
  WorkspaceTrialExpired: `${eventPrefix}workspace-trial-expired`,
  WorkspacePlanUpdated: `${eventPrefix}workspace-plan-updated`,
  WorkspaceSubscriptionUpdated: `${eventPrefix}workspace-subscription-updated`
} as const

type SubscriptionStats = {
  totalEditorSeats: number
  billingInterval: string
}

export type GatekeeperEventPayloads = {
  [GatekeeperEvents.WorkspaceTrialExpired]: { workspaceId: string }
  [GatekeeperEvents.WorkspacePlanUpdated]: {
    workspacePlan: WorkspacePlan
    subscription: SubscriptionStats
    previousWorkspacePlan?: WorkspacePlan
    previousSubscription?: SubscriptionStats
  }
  [GatekeeperEvents.WorkspaceSubscriptionUpdated]: {
    workspacePlan: WorkspacePlan
    subscription: SubscriptionStats
    previousWorkspacePlan: WorkspacePlan
    previousSubscription: SubscriptionStats
  }
}
