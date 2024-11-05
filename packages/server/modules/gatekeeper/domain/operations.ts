import { WorkspaceFeatureName } from '@/modules/gatekeeper/domain/workspacePricing'

export type CanWorkspaceAccessFeature = (args: {
  workspaceId: string
  workspaceFeature: WorkspaceFeatureName
}) => Promise<boolean>

export type WorkspaceFeatureAccessFunction = (args: {
  workspaceId: string
}) => Promise<boolean>
