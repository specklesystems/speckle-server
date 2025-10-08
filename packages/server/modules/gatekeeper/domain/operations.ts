import type { WorkspaceSeat } from '@/modules/gatekeeper/domain/billing'
import type {
  Workspace,
  WorkspaceSeatType
} from '@/modules/workspacesCore/domain/types'
import type {
  Optional,
  WorkspacePlan,
  WorkspaceFeatures,
  WorkspacePlans,
  WorkspacePlanStatuses,
  WorkspaceRoles
} from '@speckle/shared'

export type CanWorkspaceAccessFeature = (args: {
  workspaceId: string
  workspaceFeature: WorkspaceFeatures
}) => Promise<boolean>

export type WorkspaceFeatureAccessFunction = (args: {
  workspaceId: string
}) => Promise<boolean>

export type GetWorkspacesByPlanDaysTillExpiry = (args: {
  daysTillExpiry: number
  planValidFor: number
  plan: WorkspacePlans
  status: WorkspacePlanStatuses
}) => Promise<Workspace[]>
export type GetWorkspacePlanByProjectId = ({
  projectId
}: {
  projectId: string
}) => Promise<WorkspacePlan | null>

export type CreateWorkspaceSeat = (
  args: Pick<WorkspaceSeat, 'workspaceId' | 'userId' | 'type'>,
  options?: Partial<{
    skipIfExists: boolean
  }>
) => Promise<WorkspaceSeat>

export type DeleteWorkspaceSeat = (
  args: Pick<WorkspaceSeat, 'workspaceId' | 'userId'>
) => Promise<void>

export type CountSeatsByTypeInWorkspace = (
  params: Pick<WorkspaceSeat, 'workspaceId' | 'type'>
) => Promise<number>

export type GetWorkspaceUserSeats = (params: {
  workspaceId: string
  userIds: string[]
}) => Promise<{
  [userId: string]: WorkspaceSeat
}>

export type GetWorkspaceUserSeat = (params: {
  workspaceId: string
  userId: string
}) => Promise<Optional<WorkspaceSeat>>

export type GetWorkspaceDefaultSeatType = (params: {
  workspaceId: string
  workspaceRole: WorkspaceRoles
}) => Promise<WorkspaceSeatType>

export type GetWorkspacesUsersSeats = (params: {
  requests: Array<{
    userId: string
    workspaceId: string
  }>
}) => Promise<{
  [workspaceId: string]: {
    [userId: string]: WorkspaceSeat
  }
}>

export type GetProjectsUsersSeats = (params: {
  requests: Array<{
    userId: string
    projectId: string
  }>
}) => Promise<{
  [projectId: string]: {
    [userId: string]: WorkspaceSeat
  }
}>
