import { canWorkspaceAccessFeatureFactory } from '@/modules/gatekeeper/services/featureAuthorization'
import { PaidWorkspacePlans, WorkspacePlanFeatures } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('featureAuthorization @gatekeeper', () => {
  describe('canWorkspaceAccessFeatureFactory creates a function, that', () => {
    it('throws an error if workspace is not on a workspacePlan', async () => {
      const canWorkspaceAccessFeature = canWorkspaceAccessFeatureFactory({
        getWorkspacePlan: async () => null
      })
      const canAccess = await canWorkspaceAccessFeature({
        workspaceId: cryptoRandomString({ length: 10 }),
        workspaceFeature: 'domainBasedSecurityPolicies'
      })

      expect(canAccess).to.be.false
    })
    ;(
      [
        [PaidWorkspacePlans.Team, 'canceled', WorkspacePlanFeatures.SSO, false],
        [PaidWorkspacePlans.Team, 'valid', WorkspacePlanFeatures.SSO, false],
        [
          PaidWorkspacePlans.Team,
          'valid',
          WorkspacePlanFeatures.CustomDataRegion,
          false
        ],
        [PaidWorkspacePlans.Pro, 'canceled', WorkspacePlanFeatures.SSO, false],
        [PaidWorkspacePlans.Pro, 'valid', WorkspacePlanFeatures.SSO, true],
        [PaidWorkspacePlans.Pro, 'valid', WorkspacePlanFeatures.CustomDataRegion, true]
      ] as const
    ).forEach(([plan, status, workspaceFeature, expectedResult]) => {
      it(`returns ${expectedResult} for ${plan} @ ${status} for ${workspaceFeature}`, async () => {
        const workspaceId = cryptoRandomString({ length: 10 })
        const canWorkspaceAccessFeature = canWorkspaceAccessFeatureFactory({
          getWorkspacePlan: async () => ({
            name: plan,
            status,
            workspaceId,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        })
        const result = await canWorkspaceAccessFeature({
          workspaceId,
          workspaceFeature
        })
        expect(result).to.equal(expectedResult)
      })
    })
  })
})
