import { WorkspacePlan } from '@speckle/shared'

export const gatekeeperEventNamespace = 'gatekeeper' as const

const eventPrefix = `${gatekeeperEventNamespace}.` as const

export const GatekeeperEvents = {
  WorkspaceTrialExpired: `${eventPrefix}workspace-trial-expired`,
  WorkspacePlanUpdated: `${eventPrefix}workspace-plan-updated`,
  WorkspaceSubscriptionUpdated: `${eventPrefix}workspace-subscription-updated`,
  WorkspaceSeatUpdated: `${eventPrefix}workspace-seat-updated`
} as const

export type GatekeeperEventPayloads = {
  [GatekeeperEvents.WorkspaceTrialExpired]: { workspaceId: string }
  [GatekeeperEvents.WorkspacePlanUpdated]: {
    workspacePlan: Pick<WorkspacePlan, 'name' | 'status' | 'workspaceId'> & {
      previousPlanName: WorkspacePlan['name'] | undefined
    }
  }
  [GatekeeperEvents.WorkspaceSubscriptionUpdated]: Pick<
    WorkspacePlan,
    'workspaceId' | 'status'
  >
}
