import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'

export const workspaceEventNamespace = 'workspace' as const

const workspaceEventPrefix = `${workspaceEventNamespace}.` as const

export const WorkspaceEvents = {
  Created: `${workspaceEventPrefix}created`,
  Updated: `${workspaceEventPrefix}updated`,
  RoleDeleted: `${workspaceEventPrefix}role-deleted`,
  RoleUpdated: `${workspaceEventPrefix}role-updated`
} as const

export type WorkspaceEvents = (typeof WorkspaceEvents)[keyof typeof WorkspaceEvents]

type WorkspaceCreatedPayload = Workspace & {
  createdByUserId: string
}
type WorkspaceUpdatedPayload = Workspace
type WorkspaceRoleDeletedPayload = Pick<WorkspaceAcl, 'userId' | 'workspaceId' | 'role'>
type WorkspaceRoleUpdatedPayload = Pick<WorkspaceAcl, 'userId' | 'workspaceId' | 'role'>

export type WorkspaceEventsPayloads = {
  [WorkspaceEvents.Created]: WorkspaceCreatedPayload
  [WorkspaceEvents.Updated]: WorkspaceUpdatedPayload
  [WorkspaceEvents.RoleDeleted]: WorkspaceRoleDeletedPayload
  [WorkspaceEvents.RoleUpdated]: WorkspaceRoleUpdatedPayload
}
