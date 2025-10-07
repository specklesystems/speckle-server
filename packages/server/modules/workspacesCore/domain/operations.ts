import type {
  WorkspaceAcl,
  WorkspaceSeat,
  WorkspaceSeatType
} from '@/modules/workspacesCore/domain/types'
import type { WorkspaceRoles } from '@speckle/shared'

export type GetWorkspaceRolesAndSeats = (params: {
  workspaceId: string
  userIds?: string[]
}) => Promise<{
  [userId: string]: {
    role: WorkspaceAcl
    seat: WorkspaceSeat
    userId: string
  }
}>

export type GetWorkspaceRoleAndSeat = (params: {
  workspaceId: string
  userId: string
}) => Promise<
  | {
      role: WorkspaceAcl
      seat: WorkspaceSeat
      userId: string
    }
  | undefined
>

export type GetUserWorkspaceCountFactory = (params: {
  userId: string
}) => Promise<number>

export type CountWorkspaceUsers = (args: {
  workspaceId: string
  filter?: Partial<{
    role: WorkspaceRoles
    seatType: WorkspaceSeatType
  }>
}) => Promise<number>

export type GetUserWorkspaceSeatsFactory = (params: {
  userId: string
}) => Promise<WorkspaceSeat[]>

export type GetTotalWorkspaceCountFactory = () => Promise<number>
