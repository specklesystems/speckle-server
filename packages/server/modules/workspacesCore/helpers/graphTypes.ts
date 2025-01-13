import { MutationsObjectGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import { LimitedUserRecord, UserRecord } from '@/modules/core/helpers/types'
import { WorkspaceSsoProviderRecord } from '@/modules/workspaces/domain/sso/types'
import { WorkspaceTeamMember } from '@/modules/workspaces/domain/types'
import {
  Workspace,
  WorkspaceJoinRequest,
  WorkspaceJoinRequestStatus
} from '@/modules/workspacesCore/domain/types'
import { WorkspaceRoles } from '@speckle/shared'

export type WorkspaceGraphQLReturn = Workspace
export type WorkspaceJoinRequestGraphQLReturn = WorkspaceJoinRequest & {
  user: UserRecord
  workspace: Workspace
}
export type WorkspaceJoinRequestStatusGraphQLReturn = WorkspaceJoinRequestStatus
export type WorkspaceBillingGraphQLReturn = { parent: Workspace }
export type WorkspaceSsoGraphQLReturn = WorkspaceSsoProviderRecord
export type WorkspaceMutationsGraphQLReturn = MutationsObjectGraphQLReturn
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
