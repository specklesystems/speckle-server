import { MutationsObjectGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import { LimitedUserRecord } from '@/modules/core/helpers/types'
import { UserWithRole } from '@/modules/core/repositories/users'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { WorkspaceRoles } from '@speckle/shared'

export type WorkspaceGraphQLReturn = Workspace
export type WorkspaceMutationsGraphQLReturn = MutationsObjectGraphQLReturn
export type WorkspaceInviteMutationsGraphQLReturn = MutationsObjectGraphQLReturn

export type PendingWorkspaceCollaboratorGraphQLReturn = {
  id: string
  inviteId: string
  workspaceId: string
  title: string
  role: WorkspaceRoles
  invitedById: string
  user: LimitedUserRecord | null
  lastRemindedAt: Date
}

export type WorkspaceCollaboratorGraphQLReturn = UserWithRole<LimitedUserRecord> & {
  workspaceRole: WorkspaceRoles
}
