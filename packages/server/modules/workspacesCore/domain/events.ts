import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'

export const workspaceEventNamespace = 'workspace' as const

const workspaceEventPrefix = `${workspaceEventNamespace}.` as const

export const WorkspaceEvents = {
  Created: `${workspaceEventPrefix}created`,
  RoleDeleted: `${workspaceEventPrefix}role-deleted`,
  RoleUpdated: `${workspaceEventPrefix}role-updated`
} as const

export type WorkspaceEvents = (typeof WorkspaceEvents)[keyof typeof WorkspaceEvents]

type WorkspaceCreatedPayload = Workspace & {
  createdByUserId: string
}
type WorkspaceRoleDeletedPayload = WorkspaceAcl
type WorkspaceRoleUpdatedPayload = WorkspaceAcl

export type WorkspaceEventsPayloads = {
  [WorkspaceEvents.Created]: WorkspaceCreatedPayload
  [WorkspaceEvents.RoleDeleted]: WorkspaceRoleDeletedPayload
  [WorkspaceEvents.RoleUpdated]: WorkspaceRoleUpdatedPayload
}
