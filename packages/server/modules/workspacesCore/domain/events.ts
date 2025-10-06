import type { WorkspaceSeat } from '@/modules/gatekeeper/domain/billing'
import type { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import type { Nullable } from '@speckle/shared'

export const workspaceEventNamespace = 'workspace' as const

const eventPrefix = `${workspaceEventNamespace}.` as const

export const WorkspaceEvents = {
  Authorizing: `${eventPrefix}authorizing`,
  Created: `${eventPrefix}created`,
  Updated: `${eventPrefix}updated`,
  Deleted: `${eventPrefix}deleted`,
  RoleDeleted: `${eventPrefix}role-deleted`,
  RoleUpdated: `${eventPrefix}role-updated`,
  SeatUpdated: `${eventPrefix}seat-updated`,
  SeatDeleted: `${eventPrefix}seat-deleted`
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
  updatedByUserId: string
}
type WorkspaceRoleUpdatedPayload = {
  acl: Pick<WorkspaceAcl, 'userId' | 'workspaceId' | 'role'>
  updatedByUserId: string
  flags?: { skipProjectRoleUpdatesFor: string[] }
}
type WorkspaceSeatUpdatedPayload = {
  seat: WorkspaceSeat
  previousSeat?: WorkspaceSeat
  updatedByUserId: string
}

type WorkspaceSeatDeletedPayload = {
  previousSeat: WorkspaceSeat
  updatedByUserId: string
}

export type WorkspaceEventsPayloads = {
  [WorkspaceEvents.Authorizing]: WorkspaceAuthorizedPayload
  [WorkspaceEvents.Created]: WorkspaceCreatedPayload
  [WorkspaceEvents.Updated]: WorkspaceUpdatedPayload
  [WorkspaceEvents.Deleted]: { userId: Nullable<string>; workspaceId: string }
  [WorkspaceEvents.RoleDeleted]: WorkspaceRoleDeletedPayload
  [WorkspaceEvents.RoleUpdated]: WorkspaceRoleUpdatedPayload
  [WorkspaceEvents.SeatUpdated]: WorkspaceSeatUpdatedPayload
  [WorkspaceEvents.SeatDeleted]: WorkspaceSeatDeletedPayload
}
