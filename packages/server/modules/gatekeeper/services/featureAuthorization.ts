import type { GetWorkspacePlan } from '@/modules/gatekeeper/domain/billing'
import type {
  CanWorkspaceAccessFeature,
  WorkspaceFeatureAccessFunction
} from '@/modules/gatekeeper/domain/operations'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { throwUncoveredError, workspacePlanHasAccessToFeature } from '@speckle/shared'

export const canWorkspaceAccessFeatureFactory =
  ({
    getWorkspacePlan
  }: {
    getWorkspacePlan: GetWorkspacePlan
  }): CanWorkspaceAccessFeature =>
  async ({ workspaceId, workspaceFeature }) => {
    const workspacePlan = await getWorkspacePlan({ workspaceId })
    if (!workspacePlan) return false
    switch (workspacePlan.status) {
      case 'valid':
      case 'paymentFailed':
      case 'cancelationScheduled':
        break
      case 'canceled':
        return false
      default:
        throwUncoveredError(workspacePlan)
    }

    return workspacePlanHasAccessToFeature({
      plan: workspacePlan.name,
      feature: workspaceFeature,
      featureFlags: getFeatureFlags()
    })
  }

export const canWorkspaceUseOidcSsoFactory =
  (deps: { getWorkspacePlan: GetWorkspacePlan }): WorkspaceFeatureAccessFunction =>
  async ({ workspaceId }) =>
    canWorkspaceAccessFeatureFactory(deps)({ workspaceId, workspaceFeature: 'oidcSso' })

export const canWorkspaceUseRegionsFactory =
  (deps: { getWorkspacePlan: GetWorkspacePlan }): WorkspaceFeatureAccessFunction =>
  async ({ workspaceId }) =>
    canWorkspaceAccessFeatureFactory(deps)({
      workspaceId,
      workspaceFeature: 'workspaceDataRegionSpecificity'
    })

export const canWorkspaceUseDomainBasedSecurityPolicies =
  (deps: { getWorkspacePlan: GetWorkspacePlan }): WorkspaceFeatureAccessFunction =>
  async ({ workspaceId }) =>
    canWorkspaceAccessFeatureFactory(deps)({
      workspaceId,
      workspaceFeature: 'domainBasedSecurityPolicies'
    })
