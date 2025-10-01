import type { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import type {
  LimitedWorkspace,
  Workspace,
  WorkspaceAcl,
  WorkspaceDomain,
  WorkspaceJoinRequest,
  WorkspaceJoinRequestStatus,
  WorkspaceRegionAssignment,
  WorkspaceWithDomains,
  WorkspaceWithOptionalRole
} from '@/modules/workspacesCore/domain/types'
import type { EventBusPayloads } from '@/modules/shared/services/eventBus'
import type {
  MaybeNullOrUndefined,
  Nullable,
  NullableKeysToOptional,
  Optional,
  PartialNullable,
  StreamRoles,
  WorkspaceRoles
} from '@speckle/shared'
import type { WorkspaceCreationState } from '@/modules/workspaces/domain/types'
import type { WorkspaceTeam } from '@/modules/workspaces/domain/types'
import type { Stream } from '@/modules/core/domain/streams/types'
import type { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import type { ServerRegion } from '@/modules/multiregion/domain/types'
import type { SetOptional } from 'type-fest'
import type {
  WorkspaceSeat,
  WorkspaceSeatType
} from '@/modules/gatekeeper/domain/billing'
import type { UserRecord } from '@/modules/core/helpers/userHelper'

/** Workspace */

export type UpsertWorkspaceArgs = {
  workspace: Omit<
    SetOptional<
      NullableKeysToOptional<Workspace>,
      'domainBasedMembershipProtectionEnabled' | 'discoverabilityEnabled' | 'slug'
    >,
    'domains'
  >
}

export type UpsertWorkspace = (args: UpsertWorkspaceArgs) => Promise<void>
export type BulkUpsertWorkspaces = ({
  workspaces
}: {
  workspaces: Array<NullableKeysToOptional<Workspace>>
}) => Promise<void>

export type GetUserDiscoverableWorkspaces = (args: {
  domains: string[]
  userId: string
}) => Promise<LimitedWorkspace[]>

// adding optional role to each workspace
export type EligibleWorkspace = LimitedWorkspace & { role?: WorkspaceRoles }[]

export type GetUsersCurrentAndEligibleToBecomeAMemberWorkspaces = (args: {
  domains: string[]
  userId: string
}) => Promise<EligibleWorkspace[]>

export type GetWorkspace = (args: {
  workspaceId: string
  userId?: string
}) => Promise<WorkspaceWithOptionalRole | null>

export type GetWorkspaceBySlug = (args: {
  workspaceSlug: string
  userId?: string
}) => Promise<WorkspaceWithOptionalRole | null>

// Useful for dev purposes (e.g. CLI)
export type GetWorkspaceBySlugOrId = (args: {
  workspaceSlugOrId: string
}) => Promise<Workspace | null>

export type GetWorkspaces = (args: {
  workspaceIds?: string[]
  userId?: string
  search?: string
  completed?: boolean
}) => Promise<WorkspaceWithOptionalRole[]>

export type GetAllWorkspaces = (args: {
  limit: number
  cursor: Nullable<string>
}) => Promise<{
  items: Workspace[]
  cursor: Nullable<string>
}>

export type GetWorkspacesBySlug = (args: {
  workspaceIds: string[]
  userId?: string
}) => Promise<WorkspaceWithOptionalRole[]>

export type GetWorkspacesNonComplete = (args: {
  createdAtBefore: Date
}) => Promise<{ workspaceId: string }[]>

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

type CountWorkspacesArgs = {
  filter?: {
    search?: string
  }
}
export type QueryWorkspacesArgs = CountWorkspacesArgs & {
  limit: number
  cursor?: string
}
export type QueryWorkspaces = (
  args: QueryWorkspacesArgs
) => Promise<{ items: Workspace[]; cursor: string | null }>
export type CountWorkspaces = (args: CountWorkspacesArgs) => Promise<number>
export type GetProjectWorkspace = (args: {
  projectId: string
}) => Promise<Workspace | null>

/** Workspace Roles */

export type GetWorkspaceCollaboratorsBaseArgs = {
  workspaceId: string
  filter?: {
    /**
     * Optionally filter by workspace role(s)
     */
    roles?: WorkspaceRoles[]
    /**
     * Optionally filter by user name or email
     */
    search?: string
    seatType?: WorkspaceSeatType
    /**
     * Optionally filter by user id
     */
    excludeUserIds?: string[]
  }
  hasAccessToEmail?: boolean
}

export type GetWorkspaceCollaboratorsArgs = GetWorkspaceCollaboratorsBaseArgs & {
  limit: number
  cursor?: string
}

export type GetWorkspaceCollaborators = (
  args: GetWorkspaceCollaboratorsArgs
) => Promise<{ items: WorkspaceTeam; cursor: string | null }>

export type GetWorkspaceCollaboratorsTotalCount = (
  args: GetWorkspaceCollaboratorsBaseArgs
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

export type GetWorkspacesRolesForUsers = (
  reqs: Array<{
    userId: string
    workspaceId: string
  }>
) => Promise<{
  [workspaceId: string]:
    | {
        [userId: string]: WorkspaceAcl | undefined
      }
    | undefined
}>

/** Repository-level change to workspace acl record */
export type UpsertWorkspaceRole = (args: WorkspaceAcl) => Promise<void>

/** Service-level change with protection against invalid role changes */
export type AddOrUpdateWorkspaceRole = (
  args: Pick<WorkspaceAcl, 'userId' | 'workspaceId' | 'role'> & {
    /**
     * Only add or upgrade role, prevent downgrades
     */
    preventRoleDowngrade?: boolean
    /**
     * Whether to skip event emit
     */
    skipEvent?: boolean

    updatedByUserId: string
    /**
     * Optionally set Workspace seat type to ensure
     */
    seatType?: WorkspaceSeatType
  }
) => Promise<void>

export type GetWorkspaceRoleToDefaultProjectRoleMapping = (args: {
  workspaceId: string
}) => Promise<{
  allowed: {
    [workspaceRole in WorkspaceRoles]: StreamRoles[]
  }
  default: {
    [workspaceRole in WorkspaceRoles]: StreamRoles | null
  }
}>

export type GetWorkspaceSeatTypeToProjectRoleMapping = (args: {
  workspaceId: string
}) => Promise<{
  allowed: {
    [workspaceSeatType in WorkspaceSeatType]: StreamRoles[]
  }
  default: {
    [workspaceSeatType in WorkspaceSeatType]: StreamRoles
  }
}>

export type ValidateWorkspaceMemberProjectRole = (params: {
  workspaceId: string
  userId: string
  projectRole: StreamRoles
  /**
   * Instead of resolving actual workspace role/seatType, use this one. Useful when checking
   * if a planned workspace member will have valid access to a project
   */
  workspaceAccess?: {
    role?: WorkspaceRoles
    seatType?: WorkspaceSeatType
  }
}) => Promise<void>

/** Workspace Projects */

export type GetWorkspacesProjectsCounts = (params: {
  workspaceIds: string[]
}) => Promise<{
  [workspaceId: string]: number
}>

export type GetWorkspaceModelCount = (params: {
  workspaceId: string
}) => Promise<number>

export type GetPaginatedWorkspaceProjectsArgs = {
  workspaceId: string
  /**
   * If set, will take the user's workspace role into account when fetching projects.
   * E.g. guests will only see projects they have explicit access to.
   */
  userId?: string
  cursor?: MaybeNullOrUndefined<string>
  /**
   * Defaults to 25, if unset
   */
  limit?: MaybeNullOrUndefined<number>
  filter?: MaybeNullOrUndefined<
    Partial<{
      /**
       * Search for projects by name
       */
      search: MaybeNullOrUndefined<string>
      /**
       * Only get projects that the active user has an explicit role in
       */
      withProjectRoleOnly: MaybeNullOrUndefined<boolean>
    }>
  >
}

export type GetPaginatedWorkspaceProjectsItems = (
  params: GetPaginatedWorkspaceProjectsArgs
) => Promise<{
  items: Stream[]
  cursor: string | null
}>

export type GetPaginatedWorkspaceProjectsTotalCount = (
  params: Omit<GetPaginatedWorkspaceProjectsArgs, 'cursor' | 'limit'>
) => Promise<number>

export type GetPaginatedWorkspaceProjects = (
  params: GetPaginatedWorkspaceProjectsArgs
) => Promise<{
  cursor: string | null
  items: Stream[]
  totalCount: number
}>

/** Workspace Project Roles */

type GrantWorkspaceProjectRolesArgs = {
  projectId: string
  workspaceId: string
}

export type GrantWorkspaceProjectRoles = (
  args: GrantWorkspaceProjectRolesArgs
) => Promise<void>

type UpdateWorkspaceProjectRoleArgs = {
  role: {
    projectId: string
    userId: string
    // Undefined or null role means delete role
    role?: Nullable<string>
  }
  updater: {
    userId: string
    resourceAccessRules: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  }
}

export type UpdateWorkspaceProjectRole = (
  args: UpdateWorkspaceProjectRoleArgs
) => Promise<Stream | undefined>

/** Events */

export type EmitWorkspaceEvent = <
  TEvent extends WorkspaceEvents & keyof EventBusPayloads
>(args: {
  eventName: TEvent
  payload: EventBusPayloads[TEvent]
}) => Promise<void>

export type CountWorkspaceRoleWithOptionalProjectRole = (args: {
  workspaceId: string
  workspaceRole: WorkspaceRoles
  projectRole?: StreamRoles
  skipUserIds?: string[]
}) => Promise<number>

export type CountWorkspaceUsers = (args: {
  workspaceId: string
  filter?: Partial<{
    workspaceRole: WorkspaceRoles
  }>
}) => Promise<number>

export type GetUserWorkspacesWithRole = (args: {
  userId: string
}) => Promise<Array<Workspace & { role: WorkspaceRoles }>>

export type GetWorkspaceSeatCount = (args: {
  workspaceId: string
  type?: WorkspaceSeatType
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
  workspaceInput: PartialNullable<Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>>
}

export type UpdateWorkspace = ({
  workspaceId,
  workspaceInput
}: WorkspaceUpdateArgs) => Promise<Workspace>

/**
 * Workspace regions
 */

export type GetAvailableRegions = (params: {
  workspaceId: string
}) => Promise<ServerRegion[]>

export type AssignWorkspaceRegion = (params: {
  workspaceId: string
  regionKey: string
}) => Promise<void>

export type GetDefaultRegion = (params: {
  workspaceId: string
}) => Promise<Optional<ServerRegion>>

export type UpsertRegionAssignment = (params: {
  workspaceId: string
  regionKey: string
}) => Promise<WorkspaceRegionAssignment>

export type GetWorkspaceCreationState = (params: {
  workspaceId: string
}) => Promise<WorkspaceCreationState | null>

export type UpsertWorkspaceCreationState = (params: {
  workspaceCreationState: WorkspaceCreationState
}) => Promise<void>

export type UpdateWorkspaceJoinRequestStatus = (params: {
  workspaceId: string
  userId: string
  status: WorkspaceJoinRequestStatus
}) => Promise<number[]>

export type CreateWorkspaceJoinRequest = (params: {
  workspaceJoinRequest: Omit<WorkspaceJoinRequest, 'createdAt' | 'updatedAt' | 'email'>
}) => Promise<WorkspaceJoinRequest>

export type SendWorkspaceJoinRequestReceivedEmail = (params: {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  requester: { id: string; name: string; email: string }
}) => Promise<void>

export type SendWorkspaceJoinRequestApprovedEmail = (params: {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  requester: { id: string; name: string; email: string }
}) => Promise<void>

export type SendWorkspaceJoinRequestDeniedEmail = (params: {
  workspace: Pick<Workspace, 'id' | 'name' | 'slug'>
  requester: { id: string; name: string; email: string }
}) => Promise<void>

export type GetWorkspaceJoinRequest = (
  params: Pick<WorkspaceJoinRequest, 'userId' | 'workspaceId'> &
    Partial<Pick<WorkspaceJoinRequest, 'status'>>
) => Promise<WorkspaceJoinRequest | undefined>

export type ApproveWorkspaceJoinRequest = (
  params: Pick<WorkspaceJoinRequest, 'workspaceId' | 'userId'> & {
    approvedByUserId: string
  }
) => Promise<boolean>

export type DenyWorkspaceJoinRequest = (
  params: Pick<WorkspaceJoinRequest, 'workspaceId' | 'userId'>
) => Promise<boolean>

/**
 * Project regions
 */

/**
 * Updates project region and moves all regional data to target regional db
 */
export type MoveProjectToRegion = (params: {
  projectId: string
  regionKey: string
}) => Promise<void>

/**
 * Given a count of objects successfully copied to another region, confirm that these counts
 * match the current state of the source project in its original region.
 */
export type ValidateProjectRegionCopy = (params: {
  projectId: string
  copiedRowCount: {
    models: number
    versions: number
    objects: number
    automations: number
    comments: number
    webhooks: number
    savedViews: number
  }
}) => Promise<[boolean, Record<string, number>]>

export type CopyWorkspace = (params: { workspaceId: string }) => Promise<string>
export type CopyProjects = (params: { projectIds: string[] }) => Promise<string[]>
export type CopyProjectModels = (params: {
  projectIds: string[]
}) => Promise<Record<string, number>>
export type CopyProjectVersions = (params: {
  projectIds: string[]
}) => Promise<Record<string, number>>
export type CopyProjectObjects = (params: {
  projectIds: string[]
}) => Promise<Record<string, number>>
export type CopyProjectAutomations = (params: {
  projectIds: string[]
}) => Promise<Record<string, number>>

export type CountProjectModels = (params: { projectId: string }) => Promise<number>
export type CountProjectVersions = (params: { projectId: string }) => Promise<number>
export type CountProjectObjects = (params: { projectId: string }) => Promise<number>
export type CountProjectAutomations = (params: { projectId: string }) => Promise<number>
export type CountProjectComments = (params: { projectId: string }) => Promise<number>
export type CountProjectWebhooks = (params: { projectId: string }) => Promise<number>
export type CountProjectSavedViews = (params: { projectId: string }) => Promise<number>

export type AssignWorkspaceSeat = (
  params: Pick<WorkspaceSeat, 'userId' | 'workspaceId'> & {
    type: WorkspaceSeatType
    assignedByUserId: string
    skipEvent?: boolean
  }
) => Promise<WorkspaceSeat>

export type EnsureValidWorkspaceRoleSeat = (params: {
  workspaceId: string
  userId: string
  role: WorkspaceRoles
  updatedByUserId: string
  skipEvent?: boolean
}) => Promise<WorkspaceSeat>

export type CopyProjectComments = (params: {
  projectIds: string[]
}) => Promise<Record<string, number>>
export type CopyProjectWebhooks = (params: {
  projectIds: string[]
}) => Promise<Record<string, number>>
export type CopyProjectBlobs = (params: {
  projectIds: string[]
}) => Promise<Record<string, number>>
export type CopyProjectSavedViews = (params: {
  projectIds: string[]
}) => Promise<Record<string, number>>

export type SetUserActiveWorkspace = (args: {
  userId: string
  workspaceSlug: string | null
  /** Is the user in a "personal project" outside of a workspace? */
  isProjectsActive?: boolean
}) => Promise<void>

export type IntersectProjectCollaboratorsAndWorkspaceCollaborators = (params: {
  projectId: string
  workspaceId: string
}) => Promise<UserRecord[]>
