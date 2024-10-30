import { WorkspacePlan } from '@/modules/gatekeeper/domain/billing'
import { WorkspacePlanNotFoundError } from '@/modules/gatekeeper/errors/billing'
import { canWorkspaceAccessFeatureFactory } from '@/modules/gatekeeper/services/featureAuthorization'
import { expectToThrow } from '@/test/assertionHelper'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('featureAuthorization @gatekeeper', () => {
  describe('canWorkspaceAccessFeatureFactory creates a function, that', () => {
    it('throws an error if workspace is not on a workspacePlan', async () => {
      const canWorkspaceAccessFeature = canWorkspaceAccessFeatureFactory({
        getWorkspacePlan: async () => null
      })
      const err = await expectToThrow(
        async () =>
          await canWorkspaceAccessFeature({
            workspaceId: cryptoRandomString({ length: 10 }),
            workspaceFeature: 'domainBasedSecurityPolicies'
          })
      )
      expect(err.message).to.be.equal(new WorkspacePlanNotFoundError().message)
    })
    ;(
      [
        ['team', 'expired', 'oidcSso', false],
        ['team', 'valid', 'oidcSso', false],
        ['team', 'valid', 'workspaceDataRegionSpecificity', false],
        ['pro', 'valid', 'workspaceDataRegionSpecificity', false],
        ['pro', 'canceled', 'oidcSso', false],
        ['pro', 'valid', 'oidcSso', true],
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
