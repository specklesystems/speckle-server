import { WorkspaceSeat } from '@/modules/gatekeeper/domain/billing'
import { WorkspaceFeatureName } from '@/modules/gatekeeper/domain/workspacePricing'
import {
  PlanStatuses,
  WorkspacePlan,
  WorkspacePlans
} from '@/modules/gatekeeperCore/domain/billing'
import { Workspace } from '@/modules/workspacesCore/domain/types'

export type CanWorkspaceAccessFeature = (args: {
  workspaceId: string
  workspaceFeature: WorkspaceFeatureName
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
  status: PlanStatuses
}) => Promise<Workspace[]>
export type GetWorkspacePlanByProjectId = ({
  projectId
}: {
  projectId: string
}) => Promise<WorkspacePlan | null>

export type CreateWorkspaceSeat = (
  args: Pick<WorkspaceSeat, 'workspaceId' | 'userId' | 'type'>
) => Promise<WorkspaceSeat>
