export { WorkspaceInviteResourceTarget } from '@/modules/workspacesCore/domain/types'
import { LimitedUserRecord, UserWithRole } from '@/modules/core/helpers/types'
import { WorkspaceInviteResourceType } from '@/modules/workspaces/domain/constants'
import { StreamRoles, WorkspaceRoles } from '@speckle/shared'

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

export type WorkspaceRoleToDefaultProjectRoleMapping = {
  [key in WorkspaceRoles]: StreamRoles | null
}
