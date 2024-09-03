import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { StreamRecord } from '@/modules/core/helpers/types'
import {
  Workspace,
  WorkspaceAcl,
  WorkspaceDomain,
  WorkspaceWithDomains,
  WorkspaceWithOptionalRole
} from '@/modules/workspacesCore/domain/types'
import { EventBusPayloads } from '@/modules/shared/services/eventBus'
import { StreamRoles, WorkspaceRoles } from '@speckle/shared'
import { WorkspaceRoleToDefaultProjectRoleMapping } from '@/modules/workspaces/domain/types'
import { WorkspaceTeam } from '@/modules/workspaces/domain/types'

/** Workspace */

type UpsertWorkspaceArgs = {
  workspace: Omit<Workspace, 'domains'>
}

export type UpsertWorkspace = (args: UpsertWorkspaceArgs) => Promise<void>

export type GetUserDiscoverableWorkspaces = (args: {
  domains: string[]
  userId: string
}) => Promise<
  Pick<Workspace, 'id' | 'name' | 'description' | 'logo' | 'defaultLogoIndex'>[]
>

export type GetWorkspace = (args: {
  workspaceId: string
  userId?: string
}) => Promise<WorkspaceWithOptionalRole | null>

export type GetWorkspaces = (args: {
  workspaceIds: string[]
  userId?: string
}) => Promise<WorkspaceWithOptionalRole[]>

export type StoreWorkspaceDomain = (args: {
  workspaceDomain: WorkspaceDomain
}) => Promise<void>

export type GetWorkspaceDomains = (args: {
  workspaceIds: string[]
}) => Promise<WorkspaceDomain[]>

type DeleteWorkspaceArgs = {
  workspaceId: string
}

export type CountDomainsByWorkspaceId = (args: {
  workspaceId: string
}) => Promise<number>

export type DeleteWorkspaceDomain = (args: { id: string }) => Promise<void>

export type GetWorkspaceWithDomains = (args: {
  id: string
}) => Promise<WorkspaceWithDomains | null>

export type DeleteWorkspace = (args: DeleteWorkspaceArgs) => Promise<void>

/** Workspace Roles */

export type GetWorkspaceCollaboratorsArgs = {
  workspaceId: string
  limit: number
  cursor?: string
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
) => Promise<WorkspaceTeam>

type GetWorkspaceCollaboratorsTotalCountArgs = {
  workspaceId: string
}

export type GetWorkspaceCollaboratorsTotalCount = (
  args: GetWorkspaceCollaboratorsTotalCountArgs
) => Promise<number>

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

export type GetWorkspaceRoleToDefaultProjectRoleMapping = (args: {
  workspaceId: string
}) => Promise<WorkspaceRoleToDefaultProjectRoleMapping>

/** Workspace Projects */

type QueryAllWorkspaceProjectsArgs = {
  workspaceId: string
}

export type QueryAllWorkspaceProjects = (
  args: QueryAllWorkspaceProjectsArgs
) => AsyncGenerator<StreamRecord[], void, unknown>

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

export type CountProjectsVersionsByWorkspaceId = (args: {
  workspaceId: string
}) => Promise<number>

export type CountWorkspaceRoleWithOptionalProjectRole = (args: {
  workspaceId: string
  workspaceRole: WorkspaceRoles
  projectRole?: StreamRoles
  skipUserIds?: string[]
}) => Promise<number>

export type GetUserIdsWithRoleInWorkspace = (
  args: {
    workspaceId: string
    workspaceRole: WorkspaceRoles
  },
  options?: { limit?: number }
) => Promise<string[]>

type WorkspaceUpdateArgs = {
  workspaceId: string
  workspaceInput: {
    name?: string | null
    description?: string | null
    logo?: string | null
    defaultLogoIndex?: number | null
    discoverabilityEnabled?: boolean | null
    domainBasedMembershipProtectionEnabled?: boolean | null
  }
}

export type UpdateWorkspace = ({
  workspaceId,
  workspaceInput
}: WorkspaceUpdateArgs) => Promise<Workspace>
