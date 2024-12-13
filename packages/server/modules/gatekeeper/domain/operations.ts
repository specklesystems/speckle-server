import { PlanStatuses, WorkspacePlan } from '@/modules/gatekeeper/domain/billing'
import {
  WorkspaceFeatureName,
  WorkspacePlans
} from '@/modules/gatekeeper/domain/workspacePricing'
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
