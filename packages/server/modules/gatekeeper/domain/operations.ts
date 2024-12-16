import { WorkspacePlan } from '@/modules/gatekeeper/domain/billing'
import { WorkspaceFeatureName } from '@/modules/gatekeeper/domain/workspacePricing'

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

export type GetWorkspacePlanByProjectId = ({
  projectId
}: {
  projectId: string
}) => Promise<WorkspacePlan | null>
