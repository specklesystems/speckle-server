import {
  associateSsoProviderWithWorkspaceFactory,
  getWorkspaceSsoProviderFactory,
  storeSsoProviderRecordFactory
} from '@/modules/workspaces/repositories/sso'
import {
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import { Roles } from '@speckle/shared'
import db from '@/db/knex'
import { getDecryptor, getEncryptor } from '@/modules/workspaces/helpers/sso'
import cryptoRandomString from 'crypto-random-string'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { expect } from 'chai'

const associateSsoProviderWithWorkspace = associateSsoProviderWithWorkspaceFactory({
  db
})

describe('Workspace SSO repositories', () => {
  const serverAdminUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-sso-speckle@example.org',
    role: Roles.Server.Admin
  }

  before(async () => {
    await createTestUser(serverAdminUser)
  })

  describe('getWorkspaceSsoProviderFactory returns a function, that', () => {
    const workspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      slug: `test-workspace-${cryptoRandomString({ length: 6 })}`,
      name: 'Test Workspace'
    }

    it('fetches and decrypts oidc provider information for the given workspace', async () => {
      await createTestWorkspace(workspace, serverAdminUser)
      const providerId = cryptoRandomString({ length: 6 })
      await storeSsoProviderRecordFactory({ db, encrypt: getEncryptor() })({
        providerRecord: {
          id: providerId,
          createdAt: new Date(),
          updatedAt: new Date(),
          providerType: 'oidc',
          provider: {
            providerName: 'Test Provider',
            clientId: 'test-provider',
            clientSecret: cryptoRandomString({ length: 12 }),
            issuerUrl: new URL('', getFrontendOrigin()).toString()
          }
        }
      })
      await associateSsoProviderWithWorkspace({ workspaceId: workspace.id, providerId })
      const provider = await getWorkspaceSsoProviderFactory({
        db,
        decrypt: getDecryptor()
      })({ workspaceId: workspace.id })

      expect(provider).to.not.be.undefined
      expect(provider?.id).to.equal(providerId)
      expect(typeof provider?.provider).to.not.equal('string')
    })
    it('returns null if the provider does not exist', async () => {
      const provider = await getWorkspaceSsoProviderFactory({
        db,
        decrypt: getDecryptor()
      })({ workspaceId: cryptoRandomString({ length: 6 }) })
      expect(provider).to.be.null
    })
  })
})
