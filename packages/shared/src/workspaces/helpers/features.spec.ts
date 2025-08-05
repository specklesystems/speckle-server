import { describe, expect, it } from 'vitest'
import {
  workspacePlanHasAccessToFeature,
  WorkspacePlanFeatures,
  WorkspacePlanConfigs
} from './features.js'
import { WorkspacePlans } from './plans.js'

describe('workspacePlanHasAccessToFeature', () => {
  describe('Comprehensive feature coverage', () => {
    const allPlans = Object.values(WorkspacePlans) as WorkspacePlans[]
    const allFeatures = Object.values(WorkspacePlanFeatures) as WorkspacePlanFeatures[]

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
