import { InviteResourceTarget } from '@/modules/serverinvites/domain/types'
import { WorkspaceInviteResourceType } from '@/modules/workspaces/domain/constants'
import { WorkspaceRoles } from '@speckle/shared'

declare module '@/modules/serverinvites/domain/types' {
  interface InviteResourceTargetTypeMap {
    workspace: 'workspace'
  }
}

export type WorkspaceInviteResourceTarget = InviteResourceTarget<
  typeof WorkspaceInviteResourceType,
  WorkspaceRoles
>
