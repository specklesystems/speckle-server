import { WorkspaceSeat } from '@/modules/gatekeeper/domain/billing'
import { WorkspacePlan } from '@/modules/gatekeeperCore/domain/billing'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import {
  Optional,
  WorkspacePlanFeatures,
  WorkspacePlans,
  WorkspacePlanStatuses
} from '@speckle/shared'

export type CanWorkspaceAccessFeature = (args: {
  workspaceId: string
  workspaceFeature: WorkspacePlanFeatures
}) => Promise<boolean>

export type WorkspaceFeatureAccessFunction = (args: {
  workspaceId: string
}) => Promise<boolean>

export type ChangeExpiredTrialWorkspacePlanStatuses = (args: {
  numberOfDays: number
}) => Promise<WorkspacePlan[]>

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
  args: Pick<WorkspaceSeat, 'workspaceId' | 'userId' | 'type'>
) => Promise<void>

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
