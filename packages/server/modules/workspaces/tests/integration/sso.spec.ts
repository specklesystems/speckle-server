import {
  associateSsoProviderWithWorkspaceFactory,
  getWorkspaceSsoProviderFactory,
  upsertUserSsoSessionFactory
} from '@/modules/workspaces/repositories/sso'
import {
  BasicTestWorkspace,
  createTestOidcProvider,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import { Roles, wait } from '@speckle/shared'
import db from '@/db/knex'
import { getDecryptor } from '@/modules/workspaces/helpers/sso'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'
import { UserSsoSessionRecord } from '@/modules/workspaces/domain/sso/types'

const associateSsoProviderWithWorkspace = associateSsoProviderWithWorkspaceFactory({
  db
})
const upsertUserSsoSession = upsertUserSsoSessionFactory({ db })

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
      const providerId = await createTestOidcProvider()
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

  describe('upsertUserSsoSessionFactory returns a function, that', () => {
    it('creates a session if none exists', async () => {
      const providerId = await createTestOidcProvider()

      const userSsoSession: UserSsoSessionRecord = {
        userId: serverAdminUser.id,
        providerId,
        createdAt: new Date(),
        validUntil: new Date()
      }

      await upsertUserSsoSession({ userSsoSession })

      // TODO: Use future repo function
      const sessions = await db<UserSsoSessionRecord>('user_sso_sessions').where({
        providerId,
        userId: serverAdminUser.id
      })

      expect(sessions[0].providerId).to.equal(providerId)
    })

    it('updates an existing session, if one exists', async () => {
      const providerId = await createTestOidcProvider()
      const initialValidUntil = new Date()

      const userSsoSession: UserSsoSessionRecord = {
        userId: serverAdminUser.id,
        providerId,
        createdAt: new Date(),
        validUntil: initialValidUntil
      }
      await upsertUserSsoSession({ userSsoSession })
      await wait(50)
      await upsertUserSsoSession({
        userSsoSession: {
          ...userSsoSession,
          validUntil: new Date()
        }
      })

      // TODO: Use future repo function
      const sessions = await db<UserSsoSessionRecord>('user_sso_sessions').where({
        providerId,
        userId: serverAdminUser.id
      })

      expect(sessions.length).to.equal(1)
      expect(sessions[0].validUntil.getTime()).to.not.equal(initialValidUntil.getTime())
    })
  })
})
