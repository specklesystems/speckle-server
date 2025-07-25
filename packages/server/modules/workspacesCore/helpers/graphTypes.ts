import type { MutationsObjectGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import type { LimitedUserRecord } from '@/modules/core/helpers/types'
import type { WorkspaceSsoProviderRecord } from '@/modules/workspaces/domain/sso/types'
import type { WorkspaceTeamMember } from '@/modules/workspaces/domain/types'
import type {
  LimitedWorkspace,
  Workspace,
  WorkspaceJoinRequest
} from '@/modules/workspacesCore/domain/types'
import type { WorkspaceRoles } from '@speckle/shared'

export type WorkspaceGraphQLReturn = Workspace
export type WorkspaceJoinRequestGraphQLReturn = WorkspaceJoinRequest
export type LimitedWorkspaceJoinRequestGraphQLReturn = WorkspaceJoinRequest
export type WorkspaceBillingGraphQLReturn = { parent: Workspace }
export type WorkspaceSsoGraphQLReturn = WorkspaceSsoProviderRecord
export type WorkspaceMutationsGraphQLReturn = MutationsObjectGraphQLReturn
export type WorkspaceJoinRequestMutationsGraphQLReturn = MutationsObjectGraphQLReturn
export type WorkspaceInviteMutationsGraphQLReturn = MutationsObjectGraphQLReturn
export type WorkspaceProjectMutationsGraphQLReturn = MutationsObjectGraphQLReturn
export type ProjectRoleGraphQLReturn = {
  role: string
  projectId: string
}

export type PendingWorkspaceCollaboratorGraphQLReturn = {
  id: string
  inviteId: string
  workspaceId: string
  title: string
  role: WorkspaceRoles
  invitedById: string
  user: LimitedUserRecord | null
  updatedAt: Date
  email: string
  /**
   * The token that was specified when retrieving this collaborator, if any
   */
  token?: string
}

export type WorkspaceCollaboratorGraphQLReturn = WorkspaceTeamMember

export type LimitedWorkspaceGraphQLReturn = LimitedWorkspace
export type LimitedWorkspaceCollaboratorGraphQLReturn = WorkspaceTeamMember

export type WorkspacePermissionChecksGraphQLReturn = {
  workspaceId: string
}

export type ProjectMoveToWorkspaceDryRunGraphQLReturn = LimitedUserRecord[]
