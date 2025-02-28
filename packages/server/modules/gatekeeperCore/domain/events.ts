import { WorkspacePlan } from '@/modules/gatekeeperCore/domain/billing'

export const gatekeeperEventNamespace = 'gatekeeper' as const

const eventPrefix = `${gatekeeperEventNamespace}.` as const

export const GatekeeperEvents = {
  WorkspaceTrialExpired: `${eventPrefix}workspace-trial-expired`,
  WorkspacePlanUpdated: `${eventPrefix}workspace-plan-updated`
} as const

export type GatekeeperEventPayloads = {
  [GatekeeperEvents.WorkspaceTrialExpired]: { workspaceId: string }
  [GatekeeperEvents.WorkspacePlanUpdated]: {
    workspacePlan: Pick<WorkspacePlan, 'name' | 'status' | 'workspaceId'>
  }
}
