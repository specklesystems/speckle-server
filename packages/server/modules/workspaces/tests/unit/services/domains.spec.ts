import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { isUserWorkspaceDomainPolicyCompliantFactory } from '@/modules/workspaces/services/domains'
import { expectToThrow } from '@/test/assertionHelper'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('workspace domain services', () => {
  describe('isUserWorkspaceDomainPolicyCompliantFactory', () => {
    it('throws WorkspaceNotFoundError', async () => {
      const error = await expectToThrow(async () => {
        await isUserWorkspaceDomainPolicyCompliantFactory({
          getWorkspaceWithDomains: async () => null,
          findEmailsByUserId: async () => []
        })({
          workspaceId: cryptoRandomString({ length: 10 }),
          userId: cryptoRandomString({ length: 10 })
        })
      })
      expect(error.message).to.be.equal(new WorkspaceNotFoundError().message)
    })
    it('returns null if the workspace is not domain protected', async () => {
      const isCompliant = await isUserWorkspaceDomainPolicyCompliantFactory({
        getWorkspaceWithDomains: async () => ({
          defaultLogoIndex: 0,
          name: cryptoRandomString({ length: 10 }),
          logo: null,
          slug: cryptoRandomString({ length: 10 }),
          createdAt: new Date(),
          updatedAt: new Date(),
          description: '',
          discoverabilityEnabled: false,
          domainBasedMembershipProtectionEnabled: false,
          defaultProjectRole: 'stream:contributor',
          domains: [],
          id: cryptoRandomString({ length: 10 })
        }),
        findEmailsByUserId: async () => []
      })({
        workspaceId: cryptoRandomString({ length: 10 }),
        userId: cryptoRandomString({ length: 10 })
      })
      expect(isCompliant).to.be.null
    })
    it('returns validation result from compliance check', async () => {
      const domain = 'example.com'
      const isCompliant = await isUserWorkspaceDomainPolicyCompliantFactory({
        getWorkspaceWithDomains: async () => ({
          defaultLogoIndex: 0,
          name: cryptoRandomString({ length: 10 }),
          logo: null,
          slug: cryptoRandomString({ length: 10 }),
          createdAt: new Date(),
          updatedAt: new Date(),
          description: '',
          discoverabilityEnabled: false,
          domainBasedMembershipProtectionEnabled: true,
          defaultProjectRole: 'stream:contributor',
          domains: [
            {
              createdAt: new Date(),
              createdByUserId: cryptoRandomString({ length: 10 }),
              domain,
              id: cryptoRandomString({ length: 10 }),
              updatedAt: new Date(),
              verified: true,
              workspaceId: cryptoRandomString({ length: 10 })
            }
          ],
          id: cryptoRandomString({ length: 10 })
        }),
        findEmailsByUserId: async () => [
          {
            createdAt: new Date(),
            email: `foo@${domain}`,
            id: cryptoRandomString({ length: 10 }),
            primary: false,
            updatedAt: new Date(),
            userId: cryptoRandomString({ length: 10 }),
            verified: true
          }
        ]
      })({
        userId: cryptoRandomString({ length: 10 }),
        workspaceId: cryptoRandomString({ length: 10 })
      })
      expect(isCompliant).to.be.true
    })
  })
})
