export const gatekeeperEventNamespace = 'gatekeeper' as const

const eventPrefix = `${gatekeeperEventNamespace}.` as const

export const GatekeeperEvents = {
  WorkspaceTrialExpired: `${eventPrefix}workspace-trial-expired`
} as const

export type GatekeeperEventPayloads = {
  [GatekeeperEvents.WorkspaceTrialExpired]: { workspaceId: string }
}
