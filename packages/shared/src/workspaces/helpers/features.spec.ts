import { describe, expect, it } from 'vitest'
import {
  workspacePlanHasAccessToFeature,
  WorkspacePlanFeatures,
  WorkspacePlanConfigs,
  isWorkspaceFeatureFlagOn,
  WorkspaceFeatureFlags
} from './features.js'
import { WorkspacePlans } from './plans.js'

describe('workspace features', () => {
  describe('workspacePlanHasAccessToFeature', () => {
    describe('Comprehensive feature coverage', () => {
      const allPlans = Object.values(WorkspacePlans) as WorkspacePlans[]
      const allFeatures = Object.values(
        WorkspacePlanFeatures
      ) as WorkspacePlanFeatures[]

      describe.each(allPlans)('should work for %s plan', (plan) => {
        it.each(allFeatures)('%s feature combination', (feature) => {
          const expectedResult = WorkspacePlanConfigs({ featureFlags: undefined })[
            plan
          ].features.includes(feature)
          const actualResult = workspacePlanHasAccessToFeature({
            plan,
            feature,
            featureFlags: undefined
          })
          expect(
            actualResult,
            `Plan ${plan} feature ${feature} access should be ${expectedResult}`
          ).toBe(expectedResult)
        })
      })
    })
  })
  describe('isWorkspaceFeatureFlagOn', () => {
    it('returns false if no flags are on', () => {
      const workspaceFeatureFlags = WorkspaceFeatureFlags.none
      const feature = WorkspaceFeatureFlags.dashboards
      const result = isWorkspaceFeatureFlagOn({ workspaceFeatureFlags, feature })
      expect(result).toBe(false)
    })

    it('returns false if the currently tested flag is off', () => {
      const workspaceFeatureFlags = WorkspaceFeatureFlags.accIntegration
      const feature = WorkspaceFeatureFlags.dashboards
      const result = isWorkspaceFeatureFlagOn({ workspaceFeatureFlags, feature })
      expect(result).toBe(false)
    })

    it('returns true if the currently tested flag is on', () => {
      const workspaceFeatureFlags = WorkspaceFeatureFlags.dashboards
      const feature = WorkspaceFeatureFlags.dashboards
      const result = isWorkspaceFeatureFlagOn({ workspaceFeatureFlags, feature })
      expect(result).toBe(true)
    })

    it('returns true if the currently tested flag is on in a combo flag', () => {
      const workspaceFeatureFlags =
        WorkspaceFeatureFlags.dashboards | WorkspaceFeatureFlags.accIntegration
      let result = isWorkspaceFeatureFlagOn({
        workspaceFeatureFlags,
        feature: WorkspaceFeatureFlags.dashboards
      })
      expect(result).toBe(true)

      result = isWorkspaceFeatureFlagOn({
        workspaceFeatureFlags,
        feature: WorkspaceFeatureFlags.accIntegration
      })
      expect(result).toBe(true)
    })
    it('feature flag can be turned on and off', () => {
      let workspaceFeatureFlags = WorkspaceFeatureFlags.none
      let result = isWorkspaceFeatureFlagOn({
        workspaceFeatureFlags,
        feature: WorkspaceFeatureFlags.dashboards
      })
      expect(result).toBe(false)

      workspaceFeatureFlags |= WorkspaceFeatureFlags.dashboards

      result = isWorkspaceFeatureFlagOn({
        workspaceFeatureFlags,
        feature: WorkspaceFeatureFlags.dashboards
      })
      expect(result).toBe(true)

      workspaceFeatureFlags ^= WorkspaceFeatureFlags.dashboards

      result = isWorkspaceFeatureFlagOn({
        workspaceFeatureFlags,
        feature: WorkspaceFeatureFlags.dashboards
      })
      expect(result).toBe(false)
    })
  })
})
