import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { LimitedUserRecord, StreamRecord } from '@/modules/core/helpers/types'
import {
  Workspace,
  WorkspaceAcl,
  WorkspaceWithOptionalRole
} from '@/modules/workspacesCore/domain/types'
import { EventBusPayloads } from '@/modules/shared/services/eventBus'
import { WorkspaceRoles } from '@speckle/shared'
import { UserWithRole } from '@/modules/core/repositories/users'

/** Workspace */

type UpsertWorkspaceArgs = {
  workspace: Workspace
}

export type UpsertWorkspace = (args: UpsertWorkspaceArgs) => Promise<void>

export type GetWorkspace = (args: {
  workspaceId: string
  userId?: string
}) => Promise<WorkspaceWithOptionalRole | null>

export type GetWorkspaces = (args: {
  workspaceIds: string[]
  userId?: string
}) => Promise<WorkspaceWithOptionalRole[]>

/** Workspace Roles */

type GetWorkspaceCollaboratorsArgs = {
  workspaceId: string
  filter?: {
    /**
     * Optionally filter by workspace role
     */
    role?: string
    /**
     * Optionally filter by user name or email
     */
    search?: string
  }
}

export type GetWorkspaceCollaborators = (
  args: GetWorkspaceCollaboratorsArgs
) => Promise<Array<UserWithRole<LimitedUserRecord> & { workspaceRole: WorkspaceRoles }>>

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

/** Workspace Project Roles */

type GrantWorkspaceProjectRolesArgs = {
  projectId: string
  workspaceId: string
}

export type GrantWorkspaceProjectRoles = (
  args: GrantWorkspaceProjectRolesArgs
) => Promise<void>

/** Events */

export type EmitWorkspaceEvent = <TEvent extends WorkspaceEvents>(args: {
  eventName: TEvent
  payload: EventBusPayloads[TEvent]
}) => Promise<unknown[]>
