import { WorkspaceAcl, WorkspaceSeat } from '@/modules/workspacesCore/domain/types'
import { Nullable } from '@speckle/shared'

export type GetWorkspaceRolesAndSeats = (params: {
  workspaceId: string
  userIds?: string[]
}) => Promise<{
  [userId: string]: {
    role: WorkspaceAcl
    seat: Nullable<WorkspaceSeat>
    userId: string
  }
}>

export type GetWorkspaceRoleAndSeat = (params: {
  workspaceId: string
  userId: string
}) => Promise<
  | {
      role: WorkspaceAcl
      seat: Nullable<WorkspaceSeat>
      userId: string
    }
  | undefined
>
