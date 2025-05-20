export { WorkspaceInviteResourceTarget } from '@/modules/workspacesCore/domain/types'
import { LimitedUserRecord, UserWithRole } from '@/modules/core/helpers/types'
import { WorkspaceRoles } from '@speckle/shared'

export type WorkspaceTeamMember = UserWithRole<LimitedUserRecord> & {
  workspaceRole: WorkspaceRoles
  workspaceRoleCreatedAt: Date
  workspaceId: string
}

export type WorkspaceTeam = WorkspaceTeamMember[]

export type WorkspaceCreationState = {
  workspaceId: string
  completed: boolean
  state: Record<string, unknown>
}
