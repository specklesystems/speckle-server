import { WorkspacePlan } from '@/modules/gatekeeper/domain/billing'
import { canWorkspaceAccessFeatureFactory } from '@/modules/gatekeeper/services/featureAuthorization'
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
        ['starter', 'expired', 'oidcSso', false],
        ['starter', 'valid', 'oidcSso', false],
        ['starter', 'valid', 'workspaceDataRegionSpecificity', false],
        ['plus', 'valid', 'workspaceDataRegionSpecificity', false],
        ['plus', 'canceled', 'oidcSso', false],
        ['plus', 'valid', 'oidcSso', true],
        ['business', 'valid', 'workspaceDataRegionSpecificity', true]
      ] as const
    ).forEach(([plan, status, workspaceFeature, expectedResult]) => {
      it(`returns ${expectedResult} for ${plan} @ ${status} for ${workspaceFeature}`, async () => {
        const workspaceId = cryptoRandomString({ length: 10 })
        const canWorkspaceAccessFeature = canWorkspaceAccessFeatureFactory({
          getWorkspacePlan: async () =>
            ({
              name: plan,
              status,
              workspaceId
            } as WorkspacePlan)
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
