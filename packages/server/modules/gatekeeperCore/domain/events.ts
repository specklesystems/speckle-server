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
}

export type GatekeeperEventPayloads = {
  [GatekeeperEvents.WorkspaceTrialExpired]: { workspaceId: string }
  [GatekeeperEvents.WorkspacePlanUpdated]: {
    workspacePlan: Pick<WorkspacePlan, 'name' | 'status' | 'workspaceId'>
    previousPlan?: Pick<WorkspacePlan, 'name'>
  }
  [GatekeeperEvents.WorkspaceSubscriptionUpdated]: {
    workspacePlan: WorkspacePlan
    subscription: SubscriptionStats
    previousSubscription: SubscriptionStats
  }
}
