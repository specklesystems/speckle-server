import { InviteResourceTarget } from '@/modules/serverinvites/domain/types'
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

export type WorkspaceInviteResourceTarget = InviteResourceTarget<
  typeof WorkspaceInviteResourceType,
  WorkspaceRoles
>

export type WorkspaceRoleToDefaultProjectRoleMapping = {
  [key in WorkspaceRoles]: StreamRoles | null
}
