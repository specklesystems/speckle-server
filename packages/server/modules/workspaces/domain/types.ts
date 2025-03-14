export { WorkspaceInviteResourceTarget } from '@/modules/workspacesCore/domain/types'
import { LimitedUserRecord, UserWithRole } from '@/modules/core/helpers/types'
import { WorkspaceInviteResourceType } from '@/modules/workspacesCore/domain/constants'
import { WorkspaceRoles } from '@speckle/shared'

declare module '@/modules/serverinvites/domain/types' {
  interface InviteResourceTargetTypeMap {
    workspace: 'workspace'
  }
}

declare module '@/modules/serverinvites/helpers/core' {
  interface ResourceTargetTypeRoleTypeMap {
    [WorkspaceInviteResourceType]: WorkspaceRoles
  }
}

export type WorkspaceTeamMember = UserWithRole<LimitedUserRecord> & {
  workspaceRole: WorkspaceRoles
  workspaceId: string
}

export type WorkspaceTeam = WorkspaceTeamMember[]

export type WorkspaceCreationState = {
  workspaceId: string
  completed: boolean
  state: Record<string, unknown>
}
