import { GetWorkspacePlan } from '@/modules/gatekeeper/domain/billing'
import {
  CanWorkspaceAccessFeature,
  WorkspaceFeatureAccessFunction
} from '@/modules/gatekeeper/domain/operations'
import { workspacePlanFeatures } from '@/modules/gatekeeper/domain/workspacePricing'
import { throwUncoveredError } from '@speckle/shared'

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
      case 'trial':
      case 'paymentFailed':
      case 'cancelationScheduled':
        break
      case 'expired':
      case 'canceled':
        return false
      default:
        throwUncoveredError(workspacePlan)
    }
    return workspacePlanFeatures[workspacePlan.name][workspaceFeature]
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
