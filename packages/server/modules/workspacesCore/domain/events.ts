import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { WorkspaceRoles } from '@speckle/shared'

export const workspaceEventNamespace = 'workspace' as const

const eventPrefix = `${workspaceEventNamespace}.` as const

export const WorkspaceEvents = {
  Authorized: `${eventPrefix}authorized`,
  Created: `${eventPrefix}created`,
  Updated: `${eventPrefix}updated`,
  Deleted: `${eventPrefix}deleted`,
  RoleDeleted: `${eventPrefix}role-deleted`,
  RoleUpdated: `${eventPrefix}role-updated`,
  JoinedFromDiscovery: `${eventPrefix}joined-from-discovery`
} as const

export type WorkspaceEvents = (typeof WorkspaceEvents)[keyof typeof WorkspaceEvents]

type WorkspaceAuthorizedPayload = {
  userId: string | null
  workspaceId: string
}
type WorkspaceCreatedPayload = {
  workspace: Workspace
  createdByUserId: string
}
type WorkspaceUpdatedPayload = { workspace: Workspace }
type WorkspaceRoleDeletedPayload = {
  acl: Pick<WorkspaceAcl, 'userId' | 'workspaceId' | 'role'>
}
type WorkspaceRoleUpdatedPayload = {
  acl: Pick<WorkspaceAcl, 'userId' | 'workspaceId' | 'role'>
  seatType: WorkspaceSeatType
  flags?: { skipProjectRoleUpdatesFor: string[] }
}
type WorkspaceJoinedFromDiscoveryPayload = {
  userId: string
  workspaceId: string
  role: WorkspaceRoles
}

export type WorkspaceEventsPayloads = {
  [WorkspaceEvents.Authorized]: WorkspaceAuthorizedPayload
  [WorkspaceEvents.Created]: WorkspaceCreatedPayload
  [WorkspaceEvents.Updated]: WorkspaceUpdatedPayload
  [WorkspaceEvents.Deleted]: { workspaceId: string }
  [WorkspaceEvents.RoleDeleted]: WorkspaceRoleDeletedPayload
  [WorkspaceEvents.RoleUpdated]: WorkspaceRoleUpdatedPayload
  [WorkspaceEvents.JoinedFromDiscovery]: WorkspaceJoinedFromDiscoveryPayload
}
