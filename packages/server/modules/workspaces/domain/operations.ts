import {
  WorkspaceEvents,
  WorkspaceEventsPayloads
} from '@/modules/workspacesCore/domain/events'
import { Workspace, WorkspaceAcl } from '@/modules/workspaces/domain/types'
import { StreamRecord } from '@/modules/core/helpers/types'

/** Workspace */

type UpsertWorkspaceArgs = {
  workspace: Workspace
}

export type UpsertWorkspace = (args: UpsertWorkspaceArgs) => Promise<void>

type GetWorkspaceArgs = {
  workspaceId: string
}

export type GetWorkspace = (args: GetWorkspaceArgs) => Promise<Workspace | null>

/** Workspace Roles */

type DeleteWorkspaceRoleArgs = {
  workspaceId: string
  userId: string
}

export type DeleteWorkspaceRole = (
  args: DeleteWorkspaceRoleArgs
) => Promise<WorkspaceAcl | null>

type GetWorkspaceRolesArgs = {
  workspaceId: string
}

/** Get all roles in a given workspaces. */
export type GetWorkspaceRoles = (args: GetWorkspaceRolesArgs) => Promise<WorkspaceAcl[]>

type GetWorkspaceRoleForUserArgs = {
  userId: string
  workspaceId: string
}

/** Get role for given user in a specific workspace. */
export type GetWorkspaceRoleForUser = (
  args: GetWorkspaceRoleForUserArgs
) => Promise<WorkspaceAcl | null>

type GetWorkspaceRolesForUserArgs = {
  userId: string
}

type GetWorkspaceRolesForUserOptions = {
  /** If provided, limit results to roles in given workspaces. */
  workspaceIdFilter?: string[]
}

/** Get roles for given user across several (or all) workspaces. */
export type GetWorkspaceRolesForUser = (
  args: GetWorkspaceRolesForUserArgs,
  options?: GetWorkspaceRolesForUserOptions
) => Promise<WorkspaceAcl[]>

export type UpsertWorkspaceRole = (args: WorkspaceAcl) => Promise<void>

/** Workspace Projects */

type GetAllWorkspaceProjectsForUserArgs = {
  userId: string
  workspaceId: string
}

export type GetAllWorkspaceProjectsForUser = (
  args: GetAllWorkspaceProjectsForUserArgs
) => Promise<StreamRecord[]>

/** Blob */

export type StoreBlob = (args: string) => Promise<string>

/** Events */

export type EmitWorkspaceEvent = <TEvent extends WorkspaceEvents>(args: {
  event: TEvent
  payload: WorkspaceEventsPayloads[TEvent]
}) => Promise<unknown[]>
