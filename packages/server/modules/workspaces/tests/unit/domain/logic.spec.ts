import { UserEmail } from '@/modules/core/domain/userEmails/types'
import {
  anyEmailCompliantWithWorkspaceDomains,
  isWorkspaceRole,
  userEmailsCompliantWithWorkspaceDomains
} from '@/modules/workspaces/domain/logic'
import {
  getDefaultSsoSessionExpirationDate,
  isValidSsoSession
} from '@/modules/workspaces/domain/sso/logic'
import { WorkspaceDomainsInvalidState } from '@/modules/workspaces/errors/workspace'
import { WorkspaceDomain } from '@/modules/workspacesCore/domain/types'
import { expectToThrow } from '@/test/assertionHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { merge } from 'lodash'

const createTestEmail = (
  emailInput?: Partial<UserEmail & { domain: string }>
): UserEmail => {
  const domain = emailInput?.domain ?? 'example.com'
  const defaultEmail = {
    createdAt: new Date(),
    email: `${cryptoRandomString({ length: 10 })}@${domain}`,
    id: cryptoRandomString({ length: 10 }),
    primary: true,
    updatedAt: new Date(),
    userId: cryptoRandomString({ length: 10 }),
    verified: false
  }
  return merge(defaultEmail, emailInput ?? {})
}

const createTestDomain = (domainInput?: Partial<WorkspaceDomain>): WorkspaceDomain => {
  const defaultDomain: WorkspaceDomain = {
    createdAt: new Date(),
    domain: cryptoRandomString({ length: 10 }),
    id: cryptoRandomString({ length: 10 }),
    workspaceId: cryptoRandomString({ length: 10 }),
    updatedAt: new Date(),
    createdByUserId: cryptoRandomString({ length: 10 }),
    verified: false
  }
  return merge(defaultDomain, domainInput ?? {})
}

describe('workspace domain logic', () => {
  describe('anyEmailCompliantWithWorkspaceDomains', () => {
    it('returns true for compliant emails', () => {
      const domain = 'example.com'
      const userEmails: UserEmail[] = [createTestEmail({ domain, verified: true })]
      const workspaceDomains: WorkspaceDomain[] = [
        createTestDomain({ domain, verified: true })
      ]

      const isCompliant = userEmailsCompliantWithWorkspaceDomains({
        userEmails,
        workspaceDomains
      })
      expect(isCompliant).to.be.true
    })
    it('filters non verified emails', () => {
      const domain = 'example.com'
      const userEmails: UserEmail[] = [createTestEmail({ domain, verified: false })]
      const workspaceDomains: WorkspaceDomain[] = [
        createTestDomain({ domain, verified: true })
      ]

      const isCompliant = userEmailsCompliantWithWorkspaceDomains({
        userEmails,
        workspaceDomains
      })

      expect(isCompliant).to.be.false
    })
  })
  describe('anyEmailCompliantWithWorkspaceDomains', () => {
    it('throws WorkspaceDomainInvalidState for no verified workspace domains', async () => {
      const error = await expectToThrow(() => {
        anyEmailCompliantWithWorkspaceDomains({
          emails: [],
          workspaceDomains: [createTestDomain({ verified: false })]
        })
      })
      expect(error.message).to.be.equal(new WorkspaceDomainsInvalidState().message)
    })
    it('returns false if emails is empty', () => {
      const isCompliant = anyEmailCompliantWithWorkspaceDomains({
        emails: [],
        workspaceDomains: [createTestDomain({ verified: true })]
      })
      expect(isCompliant).to.be.false
    })
    it('returns false, if no emails match domain', () => {
      const isCompliant = anyEmailCompliantWithWorkspaceDomains({
        emails: ['foo@hotmail.com', 'bar@google.com'],
        workspaceDomains: [createTestDomain({ verified: true, domain: 'example.com' })]
      })
      expect(isCompliant).to.be.false
    })
    it('returns true if at least one email matches the domain', () => {
      const domain = 'example.com'

      const isCompliant = anyEmailCompliantWithWorkspaceDomains({
        emails: [`foo@${domain}`, 'bar@google.com'],
        workspaceDomains: [createTestDomain({ verified: true, domain })]
      })
      expect(isCompliant).to.be.true
    })
  })
  describe('isWorkspaceRole', () => {
    it('returns false for non-role values', () => {
      expect(isWorkspaceRole('not-a-role')).to.equal(false)
    })
    it('returns false for non-workspace roles', () => {
      expect(isWorkspaceRole(Roles.Server.Admin)).to.equal(false)
    })
    it('returns true for workspace roles', () => {
      expect(isWorkspaceRole(Roles.Workspace.Admin)).to.equal(true)
    })
  })
  describe('isValidSsoSession', () => {
    it('returns true for sessions that have not yet expired', () => {
      expect(
        isValidSsoSession({
          userId: '',
          providerId: '',
          createdAt: new Date(),
          validUntil: getDefaultSsoSessionExpirationDate()
        })
      ).to.be.true
    })
    it('returns false for sessions that have expired', () => {
      expect(
        isValidSsoSession({
          userId: '',
          providerId: '',
          createdAt: new Date(),
          validUntil: new Date()
        })
      ).to.be.false
    })
  })
})
