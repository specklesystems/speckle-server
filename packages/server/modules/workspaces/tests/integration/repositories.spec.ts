import {
  deleteWorkspaceRoleFactory,
  getWorkspaceRoleForUserFactory,
  getWorkspaceFactory,
  upsertWorkspaceFactory,
  upsertWorkspaceRoleFactory,
  getWorkspaceRolesFactory,
  getWorkspaceRolesForUserFactory,
  deleteWorkspaceFactory,
  getUserDiscoverableWorkspacesFactory,
  getUserEligibleWorkspacesFactory,
  getWorkspaceWithDomainsFactory,
  countWorkspaceRoleWithOptionalProjectRoleFactory,
  getWorkspaceCollaboratorsFactory,
  getWorkspaceBySlugFactory,
  getWorkspacesFactory,
  storeWorkspaceDomainFactory
} from '@/modules/workspaces/repositories/workspaces'
import db from '@/db/knex'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'
import type { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { expectToThrow } from '@/test/assertionHelper'
import type { BasicTestUser } from '@/test/authHelper'
import { buildBasicTestUser, createTestUser, createTestUsers } from '@/test/authHelper'
import type { BasicTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  assignToWorkspace,
  buildBasicTestWorkspace,
  createTestWorkspace,
  createTestWorkspaces
} from '@/modules/workspaces/tests/helpers/creation'
import {
  createUserEmailFactory,
  updateUserEmailFactory
} from '@/modules/core/repositories/userEmails'
import { Roles } from '@speckle/shared'
import {
  createRandomEmail,
  createRandomPassword,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { truncateTables } from '@/test/hooks'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import {
  grantStreamPermissionsFactory,
  upsertProjectRoleFactory
} from '@/modules/core/repositories/streams'
import { omit } from 'lodash-es'
import { createAndStoreTestWorkspaceFactory } from '@/test/speckle-helpers/workspaces'
import { WorkspaceJoinRequests } from '@/modules/workspacesCore/helpers/db'
import { insertInviteAndDeleteOldFactory } from '@/modules/serverinvites/repositories/serverInvites'
import type { UpsertWorkspace } from '@/modules/workspaces/domain/operations'
import { asMultiregionalOperation, replicateFactory } from '@/modules/shared/command'
import { getAllRegisteredDbs } from '@/modules/multiregion/utils/dbSelector'
import { logger } from '@/observability/logging'

const getWorkspace = getWorkspaceFactory({ db })
const getWorkspaces = getWorkspacesFactory({ db })
const getWorkspaceBySlug = getWorkspaceBySlugFactory({ db })
const getWorkspaceCollaborators = getWorkspaceCollaboratorsFactory({ db })
const deleteWorkspace = async (args: { workspaceId: string }) =>
  asMultiregionalOperation(
    ({ allDbs }) => replicateFactory(allDbs, deleteWorkspaceFactory)(args),
    {
      logger,
      name: 'delete workspace spec',
      dbs: await getAllRegisteredDbs()
    }
  )

const deleteWorkspaceRole = deleteWorkspaceRoleFactory({ db })
const getWorkspaceRoles = getWorkspaceRolesFactory({ db })
const getWorkspaceRoleForUser = getWorkspaceRoleForUserFactory({ db })
const getWorkspaceRolesForUser = getWorkspaceRolesForUserFactory({ db })
const upsertWorkspaceRole = upsertWorkspaceRoleFactory({ db })
const storeWorkspaceDomain = storeWorkspaceDomainFactory({ db })
const createUserEmail = createUserEmailFactory({ db })
const updateUserEmail = updateUserEmailFactory({ db })
const getUserDiscoverableWorkspaces = getUserDiscoverableWorkspacesFactory({ db })
const getUserEligibleWorkspaces = getUserEligibleWorkspacesFactory({ db })
const upsertProjectRole = upsertProjectRoleFactory({ db })
const grantStreamPermissions = grantStreamPermissionsFactory({ db })
const upsertWorkspace: UpsertWorkspace = async (...args) =>
  asMultiregionalOperation(
    ({ allDbs }) => replicateFactory(allDbs, upsertWorkspaceFactory)(...args),
    {
      logger,
      name: 'delete workspace spec',
      dbs: await getAllRegisteredDbs()
    }
  )

const insertInviteAndDeleteOld = insertInviteAndDeleteOldFactory({ db })

const createAndStoreTestWorkspace = createAndStoreTestWorkspaceFactory({
  upsertWorkspace
})

const createAndStoreTestUser = async (): Promise<BasicTestUser> => {
  const testId = cryptoRandomString({ length: 6 })

  const userRecord: BasicTestUser = {
    name: `test-user-${testId}`,
    email: `test-user-${testId}@example.org`,
    password: '',
    id: '',
    role: 'server:user'
  }

  await createTestUser(userRecord)

  return userRecord
}

describe('Workspace repositories', () => {
  describe('getWorkspaceFactory creates a function, that', () => {
    const testUserA = buildBasicTestUser()
    const workspaceA1 = buildBasicTestWorkspace({ name: 'My House Workspace' })
    const workspaceA2 = buildBasicTestWorkspace({ name: 'My Garage Workspace' })

    before(async () => {
      const testUserB = buildBasicTestUser()
      await createTestUsers([testUserA, testUserB])

      const workspaceB = buildBasicTestWorkspace()
      await createTestWorkspace(workspaceB, testUserB)

      await createTestWorkspace(workspaceA1, testUserA, {
        addCreationState: { completed: true, state: {} }
      })
      await createTestWorkspace(workspaceA2, testUserA)
    })

    it('returns null if the workspace is not found', async () => {
      const workspace = await getWorkspace({
        workspaceId: cryptoRandomString({ length: 10 })
      })
      expect(workspace).to.be.null
    })
    // not testing get here, we're going to use that for testing upsert

    describe('getWorkspaces filters', () => {
      it('is able to select them by name', async () => {
        const workspaces = await getWorkspaces({
          userId: testUserA.id,
          workspaceIds: [workspaceA1.id],
          search: 'house'
        })

        expect(workspaces).to.have.lengthOf(1)
        expect(workspaces[0].id).to.eq(workspaceA1.id)
      })

      it('is able to filter them out by name', async () => {
        const workspaces = await getWorkspaces({
          userId: testUserA.id,
          workspaceIds: [workspaceA1.id],
          search: 'park'
        })

        expect(workspaces).to.have.lengthOf(0)
      })

      it('is able to filer them by completed status', async () => {
        const workspaces = await getWorkspaces({
          userId: testUserA.id,
          workspaceIds: [workspaceA1.id],
          completed: true
        })

        expect(workspaces).to.have.lengthOf(1)
        expect(workspaces[0].id).to.eq(workspaceA1.id)
      })

      it('is able to filer them out by completed status', async () => {
        const workspaces = await getWorkspaces({
          userId: testUserA.id,
          workspaceIds: [workspaceA1.id],
          completed: false
        })

        expect(workspaces).to.have.lengthOf(0)
      })

      it('does not filter when there is no workspace_completed entry as safety mechanism', async () => {
        const workspaces = await getWorkspaces({
          userId: testUserA.id,
          workspaceIds: [workspaceA2.id],
          completed: false
        })

        expect(workspaces).to.have.lengthOf(1)
        expect(workspaces[0].id).to.eq(workspaceA2.id)
      })
    })
  })

  describe('getWorkspaceBySlugFactory creates a function, that', () => {
    it('returns null if the workspace is not found', async () => {
      const workspace = await getWorkspaceBySlug({
        workspaceSlug: cryptoRandomString({ length: 10 })
      })
      expect(workspace).to.be.null
    })
    it('returns the workspace', async () => {
      const testUserA: BasicTestUser = {
        id: '',
        name: 'John A Speckle',
        email: 'john@example.speckle',
        role: Roles.Server.Admin
      }
      const testWorkspace: BasicTestWorkspace = {
        id: '',
        ownerId: '',
        slug: cryptoRandomString({ length: 10 }),
        name: 'Test Workspace'
      }

      await createTestUsers([testUserA])
      await createTestWorkspace(testWorkspace, testUserA)

      const workspace = await getWorkspaceBySlug({
        workspaceSlug: testWorkspace.slug
      })
      expect(workspace?.id).to.be.equal(testWorkspace.id)
    })
  })

  describe('getWorkspaceCollaboratorsFactory creates a function, that', () => {
    const testUserA: BasicTestUser = {
      id: '',
      name: 'John A Speckle',
      email: 'john-a-speckle-collaborators@example.org',
      role: Roles.Server.Admin
    }

    const testUserB: BasicTestUser = {
      id: '',
      name: 'John B Speckle',
      email: 'john-b-speckle-collaborators@example.org'
    }

    const testUserC: BasicTestUser = {
      id: '',
      name: 'John C Speckle',
      email: 'john-c-speckle-collaborators@example.org'
    }

    before(async () => {
      await createTestUsers([testUserA, testUserB, testUserC])
    })

    describe('when one workspace exists', () => {
      const testWorkspace: BasicTestWorkspace = {
        id: '',
        ownerId: '',
        slug: cryptoRandomString({ length: 10 }),
        name: 'Test Workspace'
      }

      beforeEach(async () => {
        await createTestWorkspace(testWorkspace, testUserA)
        await assignToWorkspace(testWorkspace, testUserB, Roles.Workspace.Member)
      })

      afterEach(async () => {
        await truncateTables(['workspaces'])
      })

      it('returns all workspace members', async () => {
        const { items: team } = await getWorkspaceCollaborators({
          workspaceId: testWorkspace.id,
          limit: 50
        })
        expect(team.length).to.equal(2)
      })
    })

    describe('when multiple workspaces exist', () => {
      const testWorkspaces: BasicTestWorkspace[] = [
        {
          id: '',
          ownerId: '',
          name: 'Test Workspace A',
          slug: cryptoRandomString({ length: 10 })
        },
        {
          id: '',
          ownerId: '',
          name: 'Test Workspace B',
          slug: cryptoRandomString({ length: 10 })
        },
        {
          id: '',
          ownerId: '',
          name: 'Test Workspace C',
          slug: cryptoRandomString({ length: 10 })
        }
      ]

      beforeEach(async () => {
        for (const workspace of testWorkspaces) {
          await createTestWorkspace(workspace, testUserA)
          await assignToWorkspace(workspace, testUserB, Roles.Workspace.Member)

          if (workspace.name === 'Test Workspace C') {
            return
          }

          await assignToWorkspace(workspace, testUserC, Roles.Workspace.Member)
        }
      })

      afterEach(async () => {
        await truncateTables(['workspaces'])
      })

      it('limits search results to specified workspace', async () => {
        const { items: result } = await getWorkspaceCollaborators({
          workspaceId: testWorkspaces[2].id,
          limit: 50,
          filter: { search: 'John' }
        })
        expect(result.length).to.equal(2)
        expect(result.map((user) => user.id)).to.have.members([
          testUserA.id,
          testUserB.id
        ])
      })
    })
  })

  describe('upsertWorkspaceFactory creates a function, that', () => {
    it('upserts the workspace', async () => {
      const testWorkspace = await createAndStoreTestWorkspace()
      const storedWorkspace = await getWorkspace({ workspaceId: testWorkspace.id })
      expect(storedWorkspace).to.deep.equal(testWorkspace)

      const modifiedTestWorkspace: Omit<Workspace, 'domains'> = {
        ...testWorkspace,
        description: 'now im adding a description to the workspace'
      }

      await upsertWorkspace({ workspace: modifiedTestWorkspace })

      const modifiedStoredWorkspace = await getWorkspace({
        workspaceId: testWorkspace.id
      })

      expect(modifiedStoredWorkspace).to.deep.equal(modifiedTestWorkspace)
    })
    it('updates only relevant workspace fields', async () => {
      const testWorkspace = await createAndStoreTestWorkspace()
      const storedWorkspace = await getWorkspace({ workspaceId: testWorkspace.id })
      expect(storedWorkspace).to.deep.equal(testWorkspace)

      const updateData = {
        slug: cryptoRandomString({ length: 10 }),
        name: cryptoRandomString({ length: 20 }),
        createdAt: new Date()
      }

      await upsertWorkspace({
        workspace: {
          ...testWorkspace,
          ...updateData
        }
      })

      const modifiedStoredWorkspace = await getWorkspace({
        workspaceId: testWorkspace.id
      })

      expect(modifiedStoredWorkspace).to.deep.equal({
        ...testWorkspace,
        ...omit(updateData, ['createdAt'])
      })
    })
  })

  describe('deleteWorkspaceFactory creates a function, that', () => {
    const user: BasicTestUser = {
      id: '',
      name: 'John Speckle',
      email: 'function-deleter@example.org'
    }

    const workspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      slug: cryptoRandomString({ length: 10 }),
      name: 'Incredibly Forgettable'
    }

    before(async () => {
      await createTestUser(user)
      await createTestWorkspace(workspace, user)
    })

    it('deletes specified workspace', async () => {
      await deleteWorkspace({ workspaceId: workspace.id })
      const workspaceData = await getWorkspace({ workspaceId: workspace.id })
      expect(workspaceData).to.not.exist
    })
  })

  describe('deleteWorkspaceRoleFactory creates a function, that', () => {
    it('deletes specified workspace role', async () => {
      const { id: userId } = await createAndStoreTestUser()
      const { id: workspaceId } = await createAndStoreTestWorkspace()

      await upsertWorkspaceRole({
        userId,
        workspaceId,
        role: 'workspace:member',
        createdAt: new Date()
      })
      await deleteWorkspaceRole({ userId, workspaceId })

      const role = await getWorkspaceRoleForUser({ userId, workspaceId })

      expect(role).to.be.null
    })
    it('returns deleted workspace role', async () => {
      const { id: userId } = await createAndStoreTestUser()
      const { id: workspaceId } = await createAndStoreTestWorkspace()

      const createdRole: WorkspaceAcl = {
        userId,
        workspaceId,
        role: 'workspace:member',
        createdAt: new Date()
      }
      await upsertWorkspaceRole(createdRole)
      const deletedRole = await deleteWorkspaceRole({ userId, workspaceId })

      expect(deletedRole).to.deep.equal(createdRole)
    })
    it('return null if role does not exist', async () => {
      const deletedRole = await deleteWorkspaceRole({ userId: '', workspaceId: '' })

      expect(deletedRole).to.be.null
    })
  })

  describe('getWorkspaceRolesFactory creates a function, that', () => {
    it('returns all roles in a given workspace', async () => {
      const { id: workspaceId } = await createAndStoreTestWorkspace()

      const { id: userIdA } = await createAndStoreTestUser()
      const { id: userIdB } = await createAndStoreTestUser()

      await upsertWorkspaceRole({
        workspaceId,
        userId: userIdA,
        role: 'workspace:admin',
        createdAt: new Date()
      })
      await upsertWorkspaceRole({
        workspaceId,
        userId: userIdB,
        role: 'workspace:admin',
        createdAt: new Date()
      })

      const workspaceRoles = await getWorkspaceRoles({ workspaceId })

      expect(workspaceRoles.length).to.equal(2)
      expect(workspaceRoles.some(({ userId }) => userId === userIdA)).to.be.true
      expect(workspaceRoles.some(({ userId }) => userId === userIdB)).to.be.true
    })
  })

  describe('getWorkspaceRoleForUserFactory creates a function, that', () => {
    it('returns the current role for a given user in a given workspace', async () => {
      const { id: userId } = await createAndStoreTestUser()
      const { id: workspaceId } = await createAndStoreTestWorkspace()

      await upsertWorkspaceRole({
        workspaceId,
        userId,
        role: 'workspace:admin',
        createdAt: new Date()
      })

      const workspaceRole = await getWorkspaceRoleForUser({ userId, workspaceId })

      expect(workspaceRole).to.not.be.null
      expect(workspaceRole?.userId).to.equal(userId)
    })
    it('returns `null` if the given user does not have a role in the given workspace', async () => {
      const workspaceRole = await getWorkspaceRoleForUser({
        userId: 'invalid-user-id',
        workspaceId: 'invalid-workspace-id'
      })

      expect(workspaceRole).to.be.null
    })
  })

  describe('getWorkspaceRolesForUserFactory creates a function, that', () => {
    it('returns the current role for a given user across all workspaces', async () => {
      const { id: userId } = await createAndStoreTestUser()

      const { id: workspaceIdA } = await createAndStoreTestWorkspace()
      const { id: workspaceIdB } = await createAndStoreTestWorkspace()

      await upsertWorkspaceRole({
        workspaceId: workspaceIdA,
        userId,
        role: 'workspace:admin',
        createdAt: new Date()
      })
      await upsertWorkspaceRole({
        workspaceId: workspaceIdB,
        userId,
        role: 'workspace:admin',
        createdAt: new Date()
      })

      const workspaceRoles = await getWorkspaceRolesForUser({ userId })

      expect(workspaceRoles.length).to.equal(2)
      expect(workspaceRoles.some(({ workspaceId }) => workspaceId === workspaceIdA)).to
        .be.true
      expect(workspaceRoles.some(({ workspaceId }) => workspaceId === workspaceIdB)).to
        .be.true
    })
    it('returns the current role for workspaces specified by the workspace id filter, if provided', async () => {
      const { id: userId } = await createAndStoreTestUser()

      const { id: workspaceIdA } = await createAndStoreTestWorkspace()
      const { id: workspaceIdB } = await createAndStoreTestWorkspace()

      await upsertWorkspaceRole({
        workspaceId: workspaceIdA,
        userId,
        role: 'workspace:admin',
        createdAt: new Date()
      })
      await upsertWorkspaceRole({
        workspaceId: workspaceIdB,
        userId,
        role: 'workspace:admin',
        createdAt: new Date()
      })

      const workspaceRoles = await getWorkspaceRolesForUser(
        { userId },
        { workspaceIdFilter: [workspaceIdA] }
      )

      expect(workspaceRoles.length).to.equal(1)
      expect(workspaceRoles[0].workspaceId).to.equal(workspaceIdA)
    })
  })

  describe('upsertWorkspaceRoleFactory creates a function, that', () => {
    it('throws if an unknown role is provided', async () => {
      const role: WorkspaceAcl = {
        // @ts-expect-error type asserts valid values for `role`
        role: 'fake-role',
        userId: '',
        workspaceId: ''
      }

      await expectToThrow(() => upsertWorkspaceRole(role))
    })
  })

  describe('getDiscoverableWorkspacesForUserFactory creates a function, that', () => {
    afterEach(async () => {
      await truncateTables(['workspaces'])
    })

    it('should return only one workspace where multiple emails match', async () => {
      const user = await createAndStoreTestUser()
      await updateUserEmail({
        query: {
          email: user.email
        },
        update: {
          verified: true
        }
      })
      await createUserEmail({
        userEmail: {
          email: 'john-speckle@speckle.systems',
          userId: user.id
        }
      })
      await updateUserEmail({
        query: {
          email: 'john-speckle@speckle.systems'
        },
        update: {
          verified: true
        }
      })

      const workspace = await createAndStoreTestWorkspace({
        discoverabilityEnabled: true
      })
      await storeWorkspaceDomain({
        workspaceDomain: {
          id: cryptoRandomString({ length: 6 }),
          domain: 'example.org',
          workspaceId: workspace.id,
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: user.id
        }
      })
      await storeWorkspaceDomain({
        workspaceDomain: {
          id: cryptoRandomString({ length: 6 }),
          domain: 'speckle.systems',
          workspaceId: workspace.id,
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: user.id
        }
      })

      const workspaces = await getUserDiscoverableWorkspaces({
        domains: ['example.org', 'speckle.systems'],
        userId: user.id
      })

      expect(workspaces.length).to.equal(1)
    })

    it('should not return matches if the user email is not verified', async () => {
      const user = await createAndStoreTestUser()
      const workspace = await createAndStoreTestWorkspace({
        discoverabilityEnabled: true
      })
      await storeWorkspaceDomain({
        workspaceDomain: {
          id: cryptoRandomString({ length: 6 }),
          domain: 'example.org',
          workspaceId: workspace.id,
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: user.id
        }
      })

      const workspaces = await getUserDiscoverableWorkspaces({
        domains: [],
        userId: user.id
      })

      expect(workspaces.length).to.equal(0)
    })

    it('should not return workspaces if the workspace email is not verified', async () => {
      const user = await createAndStoreTestUser()
      await updateUserEmail({
        query: {
          email: user.email
        },
        update: {
          verified: true
        }
      })

      const workspace = await createAndStoreTestWorkspace({
        discoverabilityEnabled: true
      })
      await storeWorkspaceDomain({
        workspaceDomain: {
          id: cryptoRandomString({ length: 6 }),
          domain: 'example.org',
          workspaceId: workspace.id,
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: user.id
        }
      })

      const workspaces = await getUserDiscoverableWorkspaces({
        domains: ['example.org'],
        userId: user.id
      })

      expect(workspaces.length).to.equal(0)
    })

    it('should return multiple workspaces matching the user email', async () => {
      const user = await createAndStoreTestUser()
      await updateUserEmail({
        query: {
          email: user.email
        },
        update: {
          verified: true
        }
      })
      await createUserEmail({
        userEmail: {
          email: 'john-speckle@speckle.systems',
          userId: user.id
        }
      })
      await updateUserEmail({
        query: {
          email: 'john-speckle@speckle.systems'
        },
        update: {
          verified: true
        }
      })

      const workspaceA = await createAndStoreTestWorkspace({
        discoverabilityEnabled: true
      })
      await storeWorkspaceDomain({
        workspaceDomain: {
          id: cryptoRandomString({ length: 6 }),
          domain: 'example.org',
          workspaceId: workspaceA.id,
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: user.id
        }
      })
      const workspaceB = await createAndStoreTestWorkspace({
        discoverabilityEnabled: true
      })
      await storeWorkspaceDomain({
        workspaceDomain: {
          id: cryptoRandomString({ length: 6 }),
          domain: 'example.org',
          workspaceId: workspaceB.id,
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: user.id
        }
      })

      const workspaces = await getUserDiscoverableWorkspaces({
        domains: ['example.org'],
        userId: user.id
      })

      expect(workspaces.length).to.equal(2)
    })

    it('should not return workspaces the user is already a member of', async () => {
      const user = await createAndStoreTestUser()
      await updateUserEmail({
        query: {
          email: user.email
        },
        update: {
          verified: true
        }
      })

      const workspace = await createAndStoreTestWorkspace({
        discoverabilityEnabled: true
      })
      await storeWorkspaceDomain({
        workspaceDomain: {
          id: cryptoRandomString({ length: 6 }),
          domain: 'example.org',
          workspaceId: workspace.id,
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: user.id
        }
      })
      await upsertWorkspaceRole({
        userId: user.id,
        workspaceId: workspace.id,
        role: Roles.Workspace.Member,
        createdAt: new Date()
      })

      const workspaces = await getUserDiscoverableWorkspaces({
        domains: ['example.org'],
        userId: user.id
      })

      expect(workspaces.length).to.equal(0)
    })

    it('should not return workspaces that are not discoverable', async () => {
      const user = await createAndStoreTestUser()
      await updateUserEmail({
        query: {
          email: user.email
        },
        update: {
          verified: true
        }
      })

      const workspace = await createAndStoreTestWorkspace()
      await storeWorkspaceDomain({
        workspaceDomain: {
          id: cryptoRandomString({ length: 6 }),
          domain: 'example.org',
          workspaceId: workspace.id,
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: user.id
        }
      })

      const workspaces = await getUserDiscoverableWorkspaces({
        domains: ['example.org'],
        userId: user.id
      })

      expect(workspaces.length).to.equal(0)
    })

    it('should return discoverable workspaces that already have members', async () => {
      const user = await createAndStoreTestUser()
      await updateUserEmail({
        query: {
          email: user.email
        },
        update: {
          verified: true
        }
      })

      const problemChild = await createAndStoreTestUser()
      await updateUserEmail({
        query: {
          email: problemChild.email
        },
        update: {
          verified: true
        }
      })

      const workspace = await createAndStoreTestWorkspace({
        discoverabilityEnabled: true
      })
      await storeWorkspaceDomain({
        workspaceDomain: {
          id: cryptoRandomString({ length: 6 }),
          domain: 'example.org',
          workspaceId: workspace.id,
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: user.id
        }
      })
      await upsertWorkspaceRole({
        userId: user.id,
        workspaceId: workspace.id,
        role: Roles.Workspace.Member,
        createdAt: new Date()
      })

      const workspaces = await getUserDiscoverableWorkspaces({
        domains: ['example.org'],
        userId: problemChild.id
      })

      expect(workspaces.length).to.equal(1)
    })

    it('should not return discoverable workspaces with existing requests for the user', async () => {
      const user = await createAndStoreTestUser()
      await updateUserEmail({
        query: {
          email: user.email
        },
        update: {
          verified: true
        }
      })
      const otherUser = await createAndStoreTestUser()
      await updateUserEmail({
        query: {
          email: otherUser.email
        },
        update: {
          verified: true
        }
      })

      const workspace = await createAndStoreTestWorkspace({
        discoverabilityEnabled: true
      })
      await storeWorkspaceDomain({
        workspaceDomain: {
          id: cryptoRandomString({ length: 6 }),
          domain: 'example.org',
          workspaceId: workspace.id,
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: user.id
        }
      })
      // existing request for other user
      await db(WorkspaceJoinRequests.name).insert({
        workspaceId: workspace.id,
        userId: otherUser.id,
        createdAt: new Date(),
        status: 'pending'
      })
      const workspaceWithExistingRequest = await createAndStoreTestWorkspace({
        discoverabilityEnabled: true
      })
      await storeWorkspaceDomain({
        workspaceDomain: {
          id: cryptoRandomString({ length: 6 }),
          domain: 'example.org',
          workspaceId: workspaceWithExistingRequest.id,
          verified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: user.id
        }
      })
      await db(WorkspaceJoinRequests.name).insert({
        workspaceId: workspaceWithExistingRequest.id,
        userId: user.id,
        createdAt: new Date(),
        status: 'pending'
      })

      const workspaces = await getUserDiscoverableWorkspaces({
        domains: ['example.org'],
        userId: user.id
      })

      expect(workspaces.length).to.equal(1)
      expect(workspaces[0].id).to.equal(workspace.id)

      const otherUserWorkspaces = await getUserDiscoverableWorkspaces({
        domains: ['example.org'],
        userId: otherUser.id
      })

      expect(otherUserWorkspaces.length).to.equal(1)
      expect(otherUserWorkspaces[0].id).to.equal(workspaceWithExistingRequest.id)
    })

    it('should return workspaces in order of team size', async () => {
      const userA: BasicTestUser = {
        id: '',
        name: 'John Speckle',
        email: createRandomEmail(),
        verified: true
      }
      const userB: BasicTestUser = {
        id: '',
        name: 'John Speckle 2',
        email: createRandomEmail(),
        verified: true
      }
      const userC: BasicTestUser = {
        id: '',
        name: 'John Speckle 2 2',
        email: createRandomEmail(),
        verified: true
      }
      const userD: BasicTestUser = {
        id: '',
        name: 'No Workspace User',
        email: createRandomEmail(),
        verified: true
      }

      const workspaceA: BasicTestWorkspace = {
        id: '',
        ownerId: '',
        name: 'Small Workspace',
        slug: cryptoRandomString({ length: 9 }),
        discoverabilityEnabled: true
      }
      const workspaceB: BasicTestWorkspace = {
        id: '',
        ownerId: '',
        name: 'Medium Workspace',
        slug: cryptoRandomString({ length: 9 }),
        discoverabilityEnabled: true
      }
      const workspaceC: BasicTestWorkspace = {
        id: '',
        ownerId: '',
        name: 'Large Workspace',
        slug: cryptoRandomString({ length: 9 }),
        discoverabilityEnabled: true
      }

      await createTestUsers([userA, userB, userC])
      await createTestWorkspaces([
        [workspaceA, userA, { domain: 'example.org' }],
        [workspaceB, userB, { domain: 'example.org' }],
        [workspaceC, userC, { domain: 'example.org' }]
      ])

      await Promise.all([
        assignToWorkspace(workspaceB, userA),
        assignToWorkspace(workspaceC, userA),
        assignToWorkspace(workspaceC, userB)
      ])

      const workspaces = await getUserDiscoverableWorkspaces({
        domains: ['example.org'],
        userId: userD.id
      })

      expect(workspaces.length).to.equal(3)
      expect(workspaces[0].id).to.equal(workspaceC.id)
      expect(workspaces[1].id).to.equal(workspaceB.id)
      expect(workspaces[2].id).to.equal(workspaceA.id)
    })
  })

  describe('getWorkspaceDomainsFactory creates a function, that', () => {
    it('returns a workspace with domains', async () => {
      const user = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomPassword()
      }
      await createTestUser(user)
      const workspace = {
        id: createRandomPassword(),
        name: 'my workspace',
        slug: cryptoRandomString({ length: 10 }),
        ownerId: user.id
      }
      await createTestWorkspace(workspace, user)

      await storeWorkspaceDomainFactory({ db })({
        workspaceDomain: {
          id: createRandomPassword(),
          domain: 'example.org',
          verified: true,
          workspaceId: workspace.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: user.id
        }
      })
      const workspaceWithDomains = await getWorkspaceWithDomainsFactory({ db })({
        id: workspace.id
      })
      expect(workspaceWithDomains?.domains.length).to.eq(1)
    })
  })

  describe('countWorkspaceRoleWithOptionalProjectRoleFactory returns a function, that', () => {
    it('counts workspace roles by userId', async () => {
      const admin = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(admin)
      const workspace = {
        id: createRandomPassword(),
        name: 'my workspace',
        slug: cryptoRandomString({ length: 10 }),
        ownerId: admin.id
      }
      await createTestWorkspace(workspace, admin)

      // just another workspace, for testing if workspaceId filter works
      const workspace2 = {
        id: createRandomPassword(),
        name: 'my workspace',
        slug: cryptoRandomString({ length: 10 }),
        ownerId: admin.id
      }
      await createTestWorkspace(workspace2, admin)

      const admin2 = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(admin2)
      await assignToWorkspace(workspace, admin2, Roles.Workspace.Admin)

      const member = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(member)
      await assignToWorkspace(workspace, member, Roles.Workspace.Member)
      let count = await countWorkspaceRoleWithOptionalProjectRoleFactory({ db })({
        workspaceId: workspace.id,
        workspaceRole: Roles.Workspace.Admin
      })
      expect(count).to.equal(2)

      count = await countWorkspaceRoleWithOptionalProjectRoleFactory({ db })({
        workspaceId: workspace.id,
        workspaceRole: Roles.Workspace.Member
      })
      expect(count).to.equal(1)
    })
    it('counts workspace roles with a project role filter', async () => {
      const admin = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(admin)
      const workspace = {
        id: createRandomPassword(),
        name: 'my workspace',
        slug: cryptoRandomString({ length: 10 }),
        ownerId: admin.id
      }

      await createTestWorkspace(workspace, admin)

      const member = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(member)
      await assignToWorkspace(workspace, member, Roles.Workspace.Member)

      const member2 = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(member2)
      await assignToWorkspace(workspace, member2, Roles.Workspace.Member)

      const project1 = {
        id: createRandomString(),
        name: 'test stream',
        isPublic: true,
        ownerId: admin.id,
        workspaceId: workspace.id
      }
      const project2 = {
        id: createRandomString(),
        name: 'test stream 2',
        isPublic: true,
        ownerId: member.id,
        workspaceId: workspace.id
      }

      const project3 = {
        id: createRandomString(),
        name: 'test stream 3',
        isPublic: true,
        ownerId: member.id,
        workspaceId: workspace.id
      }
      await createTestStream(project1, admin)
      await createTestStream(project2, member)
      await createTestStream(project3, member2)

      let count = await countWorkspaceRoleWithOptionalProjectRoleFactory({ db })({
        workspaceId: workspace.id,
        workspaceRole: Roles.Workspace.Admin,
        projectRole: Roles.Stream.Owner
      })
      expect(count).to.equal(1)

      count = await countWorkspaceRoleWithOptionalProjectRoleFactory({ db })({
        workspaceId: workspace.id,
        workspaceRole: Roles.Workspace.Member,
        projectRole: Roles.Stream.Owner
      })
      expect(count).to.equal(2)
    })
    it('does not count project roles, that are not in the workspace', async () => {
      const admin = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(admin)
      const workspace = {
        id: createRandomPassword(),
        name: 'my workspace',
        slug: cryptoRandomString({ length: 10 }),
        ownerId: admin.id
      }
      await createTestWorkspace(workspace, admin)

      const guest = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(guest)
      await assignToWorkspace(workspace, guest, Roles.Workspace.Guest)

      const guest2 = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(guest2)
      await assignToWorkspace(workspace, guest2, Roles.Workspace.Guest)

      // only project 1 is in the workspace
      const project1 = {
        id: createRandomString(),
        name: 'test stream',
        isPublic: true,
        ownerId: admin.id,
        workspaceId: workspace.id
      }
      // this is not in the workspace, roles here should not count
      const project2 = {
        id: createRandomString(),
        name: 'test stream 2',
        isPublic: true,
        ownerId: guest.id
      }

      await createTestStream(project1, admin)
      await createTestStream(project2, guest)

      // adding project roles to guests
      await upsertProjectRole({
        role: Roles.Stream.Contributor,
        projectId: project1.id,
        userId: guest.id
      })

      await upsertProjectRole({
        role: Roles.Stream.Reviewer,
        projectId: project1.id,
        userId: guest2.id
      })

      // adding contributor to guest 2 on project 2
      await upsertProjectRole({
        role: Roles.Stream.Contributor,
        projectId: project2.id,
        userId: guest2.id
      })

      const count = await countWorkspaceRoleWithOptionalProjectRoleFactory({ db })({
        workspaceId: workspace.id,
        workspaceRole: Roles.Workspace.Guest,
        projectRole: Roles.Stream.Contributor
      })
      // checking that the non workspace project doesn't leak into the counts
      expect(count).to.equal(1)
    })
    it('does not count roles from other workspaces when filtering by project role too', async () => {
      const admin = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(admin)
      const workspace1 = {
        id: createRandomPassword(),
        name: 'my workspace',
        slug: cryptoRandomString({ length: 10 }),
        ownerId: admin.id
      }
      await createTestWorkspace(workspace1, admin)

      const workspace2 = {
        id: createRandomPassword(),
        name: 'my workspace 2',
        slug: cryptoRandomString({ length: 10 }),
        ownerId: admin.id
      }
      await createTestWorkspace(workspace2, admin)

      const member = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(member)
      await assignToWorkspace(workspace1, member, Roles.Workspace.Member)
      // member becomes a guest in the other workspace and it leaks back into the first
      await assignToWorkspace(workspace2, member, Roles.Workspace.Guest)

      const project1 = {
        id: createRandomString(),
        name: 'test stream',
        isPublic: true,
        ownerId: admin.id,
        workspaceId: workspace1.id
      }
      // this is not in the workspace, roles here should not count
      const project2 = {
        id: createRandomString(),
        name: 'test stream 2',
        isPublic: true,
        ownerId: admin.id,
        workspaceId: workspace2.id
      }

      await createTestStream(project1, admin)
      await createTestStream(project2, admin)

      await grantStreamPermissions({
        role: Roles.Stream.Contributor,
        streamId: project2.id,
        userId: member.id
      })

      let count = await countWorkspaceRoleWithOptionalProjectRoleFactory({ db })({
        workspaceId: workspace1.id,
        workspaceRole: Roles.Workspace.Guest,
        projectRole: Roles.Stream.Contributor
      })

      expect(count).to.equal(0)

      count = await countWorkspaceRoleWithOptionalProjectRoleFactory({ db })({
        workspaceId: workspace2.id,
        workspaceRole: Roles.Workspace.Guest,
        projectRole: Roles.Stream.Contributor
      })

      expect(count).to.equal(1)
    })
  })

  describe('getUserEligibleWorkspacesFactory creates a function, that', () => {
    it('returns workspaces where user is a member', async () => {
      const testUser1 = buildBasicTestUser()
      await createTestUsers([testUser1])

      const workspace1 = buildBasicTestWorkspace({
        name: 'Workspace 1',
        description: 'User is member'
      })
      await createTestWorkspace(workspace1, testUser1)

      const workspaces = await getUserEligibleWorkspaces({
        userId: testUser1.id,
        domains: []
      })

      const workspaceIds = workspaces.map((w) => w.id)
      expect(workspaceIds).deep.equalInAnyOrder([workspace1.id])
    })

    it('returns workspaces where user has an invite', async () => {
      const testUser1 = buildBasicTestUser()
      const testUser2 = buildBasicTestUser()
      await createTestUsers([testUser1, testUser2])

      const workspace1 = buildBasicTestWorkspace({
        name: 'Workspace 1',
        description: 'User is member'
      })

      await createTestWorkspace(workspace1, testUser1)

      await insertInviteAndDeleteOld({
        id: createRandomString(),
        inviterId: testUser1.id,
        message: '',
        target: `@${testUser2.id}`,
        token: createRandomString(),
        resource: {
          role: 'workspace:member',
          primary: true,
          resourceId: workspace1.id,
          resourceType: 'workspace',
          secondaryResourceRoles: {}
        }
      })

      const workspaces = await getUserEligibleWorkspaces({
        userId: testUser2.id,
        domains: []
      })

      const workspaceIds = workspaces.map((w) => w.id)
      expect(workspaceIds).deep.equalInAnyOrder([workspace1.id])
    })

    it('returns empty if user not eligible', async () => {
      const testUser1 = buildBasicTestUser()
      const testUser2 = buildBasicTestUser()
      await createTestUsers([testUser1, testUser2])

      const workspace1 = buildBasicTestWorkspace({
        name: 'Workspace 1',
        description: 'User is member'
      })

      await createTestWorkspace(workspace1, testUser1)

      const workspaces = await getUserEligibleWorkspaces({
        userId: testUser2.id,
        domains: []
      })

      const workspaceIds = workspaces.map((w) => w.id)
      expect(workspaceIds).to.have.length(0)
    })

    it('returns discoverable workspaces with matching verified domains', async () => {
      const domain = `${createRandomString()}.com`
      const testUser1 = buildBasicTestUser({
        email: `${createRandomString()}@${domain}`,
        verified: true
      })
      const testUser2 = buildBasicTestUser({
        email: `${createRandomString()}@${domain}`,
        verified: true
      })
      await createTestUsers([testUser1, testUser2])
      const workspace1 = buildBasicTestWorkspace({
        name: 'Workspace 1',
        description: 'User is member',
        discoverabilityEnabled: true
      })
      const workspace2 = buildBasicTestWorkspace({
        name: 'Workspace 2',
        description: 'User is member'
      })
      await createTestWorkspace(workspace1, testUser1, { domain })
      await createTestWorkspace(workspace2, testUser2)

      const workspaces = await getUserEligibleWorkspaces({
        userId: testUser2.id,
        domains: [domain]
      })

      const workspaceIds = workspaces.map((w) => w.id)
      expect(workspaceIds).deep.equalInAnyOrder([workspace1.id, workspace2.id])
    })

    it('does not return discoverable workspaces with matching unverified domains', async () => {
      const domain = `${createRandomString()}.com`
      const testUser1 = buildBasicTestUser({
        email: `${createRandomString()}@${domain}`,
        verified: true
      })
      const testUser2 = buildBasicTestUser({
        email: `${createRandomString()}@${domain}`,
        verified: false
      })
      await createTestUsers([testUser1, testUser2])
      const workspace1 = buildBasicTestWorkspace({
        name: 'Workspace 2',
        description: 'User is member',
        discoverabilityEnabled: false
      })
      await createTestWorkspace(workspace1, testUser1, { domain })

      const workspaces = await getUserEligibleWorkspaces({
        userId: testUser2.id,
        domains: [domain]
      })

      const workspaceIds = workspaces.map((w) => w.id)
      expect(workspaceIds).deep.equalInAnyOrder([])
    })

    it('does not return non discoverable workspaces with matching verified domains', async () => {
      const domain = `${createRandomString()}.com`
      const testUser1 = buildBasicTestUser({
        email: `${createRandomString()}@${domain}`,
        verified: true
      })
      const testUser2 = buildBasicTestUser({
        email: `${createRandomString()}@${domain}`,
        verified: true
      })
      await createTestUsers([testUser1, testUser2])
      const workspace1 = buildBasicTestWorkspace({
        name: 'Workspace 2',
        description: 'User is member',
        discoverabilityEnabled: false
      })
      await createTestWorkspace(workspace1, testUser1, { domain })

      const workspaces = await getUserEligibleWorkspaces({
        userId: testUser2.id,
        domains: [domain]
      })

      const workspaceIds = workspaces.map((w) => w.id)
      expect(workspaceIds).deep.equalInAnyOrder([])
    })

    it('does not return workspaces without matching domains when not member/invited', async () => {
      const domain1 = `${createRandomString()}.com`
      const testUser1 = buildBasicTestUser({
        email: `${createRandomString()}@${domain1}`,
        verified: true
      })
      const domain2 = `${createRandomString()}.com`
      const testUser2 = buildBasicTestUser({
        email: `${createRandomString()}@${domain2}.com`,
        verified: true
      })
      await createTestUsers([testUser1, testUser2])
      const workspace1 = buildBasicTestWorkspace({
        name: 'Workspace 2',
        description: 'User is member',
        discoverabilityEnabled: true
      })
      await createTestWorkspace(workspace1, testUser1, { domain: domain1 })

      const workspaces = await getUserEligibleWorkspaces({
        userId: testUser2.id,
        domains: [domain2]
      })

      const workspaceIds = workspaces.map((w) => w.id)
      expect(workspaceIds).deep.equalInAnyOrder([])
    })

    it('returns unique workspaces when user has multiple access paths', async () => {
      const domain1 = `${createRandomString()}.com`
      const testUser1 = buildBasicTestUser({
        email: `${createRandomString()}@${domain1}`,
        verified: true
      })
      await createTestUsers([testUser1])

      const workspace1 = buildBasicTestWorkspace({
        name: 'Workspace 2',
        description: 'User is member',
        discoverabilityEnabled: true
      })
      await createTestWorkspace(workspace1, testUser1, { domain: domain1 })

      const workspaces = await getUserEligibleWorkspaces({
        userId: testUser1.id,
        domains: ['example.com']
      })

      const workspaceIds = workspaces.map((w) => w.id)
      expect(workspaceIds).deep.equalInAnyOrder([workspace1.id])
    })
  })
})
