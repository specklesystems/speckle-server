import { LimitedUserRecord, UserWithRole } from '@/modules/core/helpers/types'
import { InviteResourceTarget } from '@/modules/serverinvites/domain/types'
import { WorkspaceInviteResourceType } from '@/modules/workspaces/domain/constants'
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

export type WorkspaceInviteResourceTarget = InviteResourceTarget<
  typeof WorkspaceInviteResourceType,
  WorkspaceRoles
>

export type WorkspaceTeamMember = UserWithRole<LimitedUserRecord> & {
  workspaceRole: WorkspaceRoles
}

export type WorkspaceTeam = WorkspaceTeamMember[]
