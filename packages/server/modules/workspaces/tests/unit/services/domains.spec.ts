import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { isUserWorkspaceDomainPolicyCompliantFactory } from '@/modules/workspaces/services/domains'
import type { Workspace } from '@/modules/workspacesCore/domain/types'
import { expectToThrow } from '@/test/assertionHelper'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('workspace domain services', () => {
  describe('isUserWorkspaceDomainPolicyCompliantFactory', () => {
    it('throws WorkspaceNotFoundError', async () => {
      const error = await expectToThrow(async () => {
        await isUserWorkspaceDomainPolicyCompliantFactory({
          getWorkspaceBySlug: async () => null,
          getWorkspaceDomains: async () => [],
          findEmailsByUserId: async () => []
        })({
          workspaceSlug: cryptoRandomString({ length: 10 }),
          userId: cryptoRandomString({ length: 10 })
        })
      })
      expect(error.message).to.be.equal(new WorkspaceNotFoundError().message)
    })
    it('returns null if the workspace is not domain protected', async () => {
      const isCompliant = await isUserWorkspaceDomainPolicyCompliantFactory({
        getWorkspaceBySlug: async () =>
          ({
            id: cryptoRandomString({ length: 10 }),
            domainBasedMembershipProtectionEnabled: false
          } as Workspace),
        getWorkspaceDomains: async () => [],
        findEmailsByUserId: async () => []
      })({
        workspaceSlug: cryptoRandomString({ length: 10 }),
        userId: cryptoRandomString({ length: 10 })
      })
      expect(isCompliant).to.be.null
    })
    it('returns validation result from compliance check', async () => {
      const domain = 'example.com'
      const isCompliant = await isUserWorkspaceDomainPolicyCompliantFactory({
        getWorkspaceBySlug: async () =>
          ({
            id: cryptoRandomString({ length: 10 }),
            domainBasedMembershipProtectionEnabled: true
          } as Workspace),
        getWorkspaceDomains: async () => [
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
        workspaceSlug: cryptoRandomString({ length: 10 })
      })
      expect(isCompliant).to.be.true
    })
  })
})
