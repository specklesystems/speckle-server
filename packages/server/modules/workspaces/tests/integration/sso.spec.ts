import {
  deleteSsoProviderFactory,
  getUserSsoSessionFactory,
  getWorkspaceSsoProviderFactory,
  getWorkspaceSsoProviderRecordFactory,
  listUserSsoSessionsFactory,
  listWorkspaceSsoMembershipsFactory,
  upsertUserSsoSessionFactory
} from '@/modules/workspaces/repositories/sso'
import {
  assignToWorkspace,
  BasicTestWorkspace,
  createTestOidcProvider,
  createTestSsoSession,
  createTestWorkspace,
  createTestWorkspaces
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUser, createTestUsers } from '@/test/authHelper'
import { Roles, wait } from '@speckle/shared'
import db from '@/db/knex'
import { getDecryptor } from '@/modules/workspaces/helpers/sso'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'
import { UserSsoSessionRecord } from '@/modules/workspaces/domain/sso/types'
import { truncateTables } from '@/test/hooks'
import { isValidSsoSession } from '@/modules/workspaces/domain/sso/logic'

const deleteSsoProvider = deleteSsoProviderFactory({ db })
const listUserSsoSessions = listUserSsoSessionsFactory({ db })
const listWorkspaceSsoMemberships = listWorkspaceSsoMembershipsFactory({ db })
const upsertUserSsoSession = upsertUserSsoSessionFactory({ db })
const getUserSsoSession = getUserSsoSessionFactory({ db })
const getWorkspaceSsoProviderRecord = getWorkspaceSsoProviderRecordFactory({ db })

describe('Workspace SSO repositories', () => {
  const serverAdminUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-sso-speckle@example.org',
    role: Roles.Server.Admin
  }

  const testWorkspace: BasicTestWorkspace = {
    id: '',
    ownerId: '',
    name: 'My Test Workspace',
    slug: 'test-workspace'
  }

  before(async () => {
    await createTestUser(serverAdminUser)
    await createTestWorkspace(testWorkspace, serverAdminUser)
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
      const providerId = await createTestOidcProvider(workspace.id)
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
    const testWorkspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      name: 'Test Workspace',
      slug: 'upsert-session-test-workspace'
    }

    let providerId: string = ''

    before(async () => {
      await createTestWorkspace(testWorkspace, serverAdminUser)
      providerId = await createTestOidcProvider(testWorkspace.id)
    })

    it('creates a session if none exists', async () => {
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

  describe('listWorkspaceSsoMembershipsFactory returns a function, that', async () => {
    const ssoUser: BasicTestUser = {
      id: '',
      email: 'sso-speckle@example.org',
      name: 'SSO Speckle',
      role: Roles.Server.Admin
    }

    const ssoWorkspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      name: 'Workspace With SSO',
      slug: 'yes-sso'
    }

    const nonSsoWorkspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      name: 'Workspace Without SSO',
      slug: 'no-sso-very-sad'
    }

    before(async () => {
      await createTestUser(ssoUser)

      await createTestWorkspace(ssoWorkspace, ssoUser)
      await createTestOidcProvider(ssoWorkspace.id)

      await createTestWorkspace(nonSsoWorkspace, serverAdminUser)
    })

    it('lists correct workspaces for the given user', async () => {
      const workspaces = await listWorkspaceSsoMemberships({
        userId: ssoUser.id
      })

      // Includes workspaces with SSO
      expect(workspaces.length).to.equal(1)
      expect(workspaces.some((workspace) => workspace.id === ssoWorkspace.id)).to.be
        .true

      // Omits workspaces without SSO
      expect(workspaces.some((workspace) => workspace.id === nonSsoWorkspace.id)).to.be
        .false
    })

    it('returns an empty array if the user is not part of any workspaces', async () => {
      const testServerUser: BasicTestUser = {
        id: '',
        name: 'Jane Speckle',
        email: 'jane-sso-speckle@example.org'
      }

      await createTestUser(testServerUser)

      const workspaces = await listWorkspaceSsoMemberships({
        userId: testServerUser.id
      })

      expect(workspaces.length).to.equal(0)
    })

    it('returns an empty array if the user does not exist', async () => {
      const workspaces = await listWorkspaceSsoMemberships({
        userId: cryptoRandomString({ length: 9 })
      })
      expect(workspaces.length).to.equal(0)
    })
  })

  describe('listUserSsoSessionsFactory returns a function, that', async () => {
    const testUserA: BasicTestUser = {
      id: '',
      name: 'John Speckle',
      email: `${cryptoRandomString({ length: 9 })}@example.org`
    }

    const testWorkspaceA: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      name: 'Test Workspace A',
      slug: 'list-sessions-workspace-a'
    }

    const testWorkspaceB: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      name: 'Test Workspace B',
      slug: 'list-sessions-workspace-b'
    }

    const testWorkspaceC: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      name: 'Test Workspace C',
      slug: 'list-sessions-workspace-c'
    }

    before(async () => {
      await createTestUsers([testUserA])
      await createTestWorkspaces([
        [testWorkspaceA, testUserA],
        [testWorkspaceB, testUserA],
        [testWorkspaceC, testUserA]
      ])

      await createTestOidcProvider(testWorkspaceA.id)
      await createTestOidcProvider(testWorkspaceB.id)
      await createTestOidcProvider(testWorkspaceC.id)
    })

    afterEach(async () => {
      await truncateTables(['user_sso_sessions'])
    })

    it('returns an empty array if there are no sessions', async () => {
      const sessions = await listUserSsoSessions({ userId: testUserA.id })
      expect(sessions.length).to.equal(0)
    })

    it('returns all sessions for the given user', async () => {
      await createTestSsoSession(testUserA.id, testWorkspaceA.id)
      await createTestSsoSession(testUserA.id, testWorkspaceB.id)
      await createTestSsoSession(testUserA.id, testWorkspaceC.id)

      const sessions = await listUserSsoSessions({ userId: testUserA.id })
      expect(sessions.length).to.equal(3)
    })

    it('includes sessions that are expired but have not yet been deleted', async () => {
      await createTestSsoSession(testUserA.id, testWorkspaceA.id)
      await createTestSsoSession(testUserA.id, testWorkspaceB.id)
      await createTestSsoSession(testUserA.id, testWorkspaceC.id, new Date())

      await wait(150)

      const sessions = await listUserSsoSessions({ userId: testUserA.id })
      expect(sessions.length).to.equal(3)
      expect(sessions.filter((session) => isValidSsoSession(session)).length).to.equal(
        2
      )
    })
  })

  describe('getUserSsoSessionFactory returns a function, that', async () => {
    const testUser: BasicTestUser = {
      id: '',
      name: 'John Speckle',
      email: `${cryptoRandomString({ length: 9 })}@example.org`
    }

    const testWorkspaceWithSsoA: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      name: 'Workspace With SSO A',
      slug: 'workspace-with-sso-a'
    }

    const testWorkspaceWithSsoB: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      name: 'Workspace With SSO B',
      slug: 'workspace-with-sso-b'
    }

    const testWorkspaceWithoutSso: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      name: 'Workspace Without SSO',
      slug: 'workspace-without-sso'
    }

    before(async () => {
      await createTestUser(testUser)

      await createTestWorkspace(testWorkspaceWithSsoA, testUser)
      await createTestOidcProvider(testWorkspaceWithSsoA.id)

      await createTestWorkspace(testWorkspaceWithSsoB, testUser)
      await createTestOidcProvider(testWorkspaceWithSsoB.id)

      await createTestWorkspace(testWorkspaceWithoutSso, testUser)
    })

    it('returns the session for the specified user and workspace', async () => {
      await createTestSsoSession(testUser.id, testWorkspaceWithSsoA.id)
      const session = await getUserSsoSession({
        userId: testUser.id,
        workspaceId: testWorkspaceWithSsoA.id
      })
      expect(session).to.not.be.undefined
      expect(session?.workspaceId).to.equal(testWorkspaceWithSsoA.id)
    })

    it('returns the session if it has expired but has not yet been deleted', async () => {
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() - 1)
      await createTestSsoSession(testUser.id, testWorkspaceWithSsoB.id, validUntil)
      const session = await getUserSsoSession({
        userId: testUser.id,
        workspaceId: testWorkspaceWithSsoB.id
      })
      expect(session).to.not.be.undefined
    })

    it('returns null if the session does not exist', async () => {
      const session = await getUserSsoSession({
        userId: testUser.id,
        workspaceId: testWorkspaceWithoutSso.id
      })
      expect(session).to.be.null
    })

    it('returns null if the workspace does not exist', async () => {
      const session = await getUserSsoSession({
        userId: testUser.id,
        workspaceId: cryptoRandomString({ length: 9 })
      })
      expect(session).to.be.null
    })

    it('returns null if the user does not exist', async () => {
      const session = await getUserSsoSession({
        userId: cryptoRandomString({ length: 9 }),
        workspaceId: testWorkspaceWithSsoA.id
      })
      expect(session).to.be.null
    })
  })

  describe('deleteSsoProviderFactory returns a function, that', async () => {
    const testWorkspaceAdmin: BasicTestUser = {
      id: '',
      name: 'John Speckle',
      email: `${cryptoRandomString({ length: 9 })}@example.org`
    }

    const testWorkspaceMember: BasicTestUser = {
      id: '',
      name: 'Jane Speckle',
      email: `${cryptoRandomString({ length: 9 })}@example.org`
    }

    const testWorkspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      name: 'Test SSO Workspace',
      slug: 'test-delete-sso-workspace'
    }

    before(async () => {
      await createTestUsers([testWorkspaceAdmin, testWorkspaceMember])
      await createTestWorkspace(testWorkspace, testWorkspaceAdmin)
      await assignToWorkspace(testWorkspace, testWorkspaceMember)
    })

    beforeEach(async () => {
      await createTestOidcProvider(testWorkspace.id)
      await Promise.all([
        createTestSsoSession(testWorkspaceAdmin.id, testWorkspace.id),
        createTestSsoSession(testWorkspaceMember.id, testWorkspace.id)
      ])
    })

    afterEach(async () => {
      truncateTables(['user_sso_sessions'])
    })

    describe('when deleting an sso provider that exists', async () => {
      beforeEach(async () => {
        await deleteSsoProvider({ workspaceId: testWorkspace.id })
      })

      it('deletes SSO encrypted provider data for specified workspace', async () => {
        const provider = await getWorkspaceSsoProviderFactory({
          db,
          decrypt: getDecryptor()
        })({ workspaceId: testWorkspace.id })
        expect(provider).to.be.null
      })

      it('deletes all SSO sessions for provider for specified workspace', async () => {
        const adminSession = await getUserSsoSession({
          userId: testWorkspaceAdmin.id,
          workspaceId: testWorkspace.id
        })
        const memberSession = await getUserSsoSession({
          userId: testWorkspaceMember.id,
          workspaceId: testWorkspace.id
        })

        expect(adminSession).to.be.null
        expect(memberSession).to.be.null
      })

      it('deletes workspace SSO provider record for specified workspaces', async () => {
        const providerRecord = await getWorkspaceSsoProviderRecord({
          workspaceId: testWorkspace.id
        })
        expect(providerRecord).to.be.null
      })
    })

    describe('when deleting an sso provider that does not exist', async () => {
      it('should noop', async () => {
        await deleteSsoProvider({ workspaceId: cryptoRandomString({ length: 9 }) })
      })
    })
  })
})
