import { Workspace, WorkspaceAcl } from '@/modules/workspaces/domain/types'

export const WorkspaceEvents = {
  Created: 'created',
  RoleDeleted: 'role-deleted',
  RoleUpdated: 'role-updated'
} as const

export type WorkspaceEvents = (typeof WorkspaceEvents)[keyof typeof WorkspaceEvents]

type WorkspaceCreatedPayload = Workspace
type WorkspaceRoleDeletedPayload = WorkspaceAcl
type WorkspaceRoleUpdatedPayload = WorkspaceAcl

export type WorkspaceEventsPayloads = {
  [WorkspaceEvents.Created]: WorkspaceCreatedPayload
  [WorkspaceEvents.RoleDeleted]: WorkspaceRoleDeletedPayload
  [WorkspaceEvents.RoleUpdated]: WorkspaceRoleUpdatedPayload
}
