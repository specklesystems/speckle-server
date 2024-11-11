import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { WorkspaceRoles } from '@speckle/shared'

export const workspaceEventNamespace = 'workspace' as const

const workspaceEventPrefix = `${workspaceEventNamespace}.` as const

export const WorkspaceEvents = {
  Authorized: `${workspaceEventPrefix}authorized`,
  Created: `${workspaceEventPrefix}created`,
  Updated: `${workspaceEventPrefix}updated`,
  RoleDeleted: `${workspaceEventPrefix}role-deleted`,
  RoleUpdated: `${workspaceEventPrefix}role-updated`,
  JoinedFromDiscovery: `${workspaceEventPrefix}joined-from-discovery`
} as const

export type WorkspaceEvents = (typeof WorkspaceEvents)[keyof typeof WorkspaceEvents]

type WorkspaceAuthorizedPayload = {
  userId: string | null
  workspaceId: string
}
type WorkspaceCreatedPayload = Workspace & {
  createdByUserId: string
}
type WorkspaceUpdatedPayload = Workspace
type WorkspaceRoleDeletedPayload = Pick<WorkspaceAcl, 'userId' | 'workspaceId' | 'role'>
type WorkspaceRoleUpdatedPayload = Pick<
  WorkspaceAcl,
  'userId' | 'workspaceId' | 'role'
> & { flags?: { skipProjectRoleUpdatesFor: string[] } }
type WorkspaceJoinedFromDiscoveryPayload = {
  userId: string
  workspaceId: string
  role: WorkspaceRoles
}

export type WorkspaceEventsPayloads = {
  [WorkspaceEvents.Authorized]: WorkspaceAuthorizedPayload
  [WorkspaceEvents.Created]: WorkspaceCreatedPayload
  [WorkspaceEvents.Updated]: WorkspaceUpdatedPayload
  [WorkspaceEvents.RoleDeleted]: WorkspaceRoleDeletedPayload
  [WorkspaceEvents.RoleUpdated]: WorkspaceRoleUpdatedPayload
  [WorkspaceEvents.JoinedFromDiscovery]: WorkspaceJoinedFromDiscoveryPayload
}
