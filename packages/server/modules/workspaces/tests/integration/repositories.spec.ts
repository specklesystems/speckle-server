import {
  deleteWorkspaceRoleFactory,
  getWorkspaceRoleForUserFactory,
  getWorkspaceFactory,
  upsertWorkspaceFactory,
  upsertWorkspaceRoleFactory,
  getWorkspaceRolesFactory,
  getWorkspaceRolesForUserFactory,
  deleteWorkspaceFactory,
  storeWorkspaceDomainFactory,
  getUserDiscoverableWorkspacesFactory,
  getWorkspaceWithDomainsFactory,
  getWorkspaceRolesCountFactory
} from '@/modules/workspaces/repositories/workspaces'
import db from '@/db/knex'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'
import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { expectToThrow } from '@/test/assertionHelper'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  BasicTestWorkspace,
  assignToWorkspace,
  createTestWorkspace
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
import { grantStreamPermissions } from '@/modules/core/repositories/streams'

const getWorkspace = getWorkspaceFactory({ db })
const upsertWorkspace = upsertWorkspaceFactory({ db })
const deleteWorkspace = deleteWorkspaceFactory({ db })
const deleteWorkspaceRole = deleteWorkspaceRoleFactory({ db })
const getWorkspaceRoles = getWorkspaceRolesFactory({ db })
const getWorkspaceRoleForUser = getWorkspaceRoleForUserFactory({ db })
const getWorkspaceRolesForUser = getWorkspaceRolesForUserFactory({ db })
const upsertWorkspaceRole = upsertWorkspaceRoleFactory({ db })
const storeWorkspaceDomain = storeWorkspaceDomainFactory({ db })
const createUserEmail = createUserEmailFactory({ db })
const updateUserEmail = updateUserEmailFactory({ db })
const getUserDiscoverableWorkspaces = getUserDiscoverableWorkspacesFactory({ db })

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

const createAndStoreTestWorkspace = async (
  workspaceOverrides: Partial<Workspace> = {}
) => {
  const workspace: Omit<Workspace, 'domains'> = {
    id: cryptoRandomString({ length: 10 }),
    name: cryptoRandomString({ length: 10 }),
    createdAt: new Date(),
    updatedAt: new Date(),
    description: null,
    logo: null,
    domainBasedMembershipProtectionEnabled: false,
    discoverabilityEnabled: false,
    defaultLogoIndex: 0,
    ...workspaceOverrides
  }

  await upsertWorkspace({ workspace })

  return workspace
}

describe('Workspace repositories', () => {
  describe('getWorkspaceFactory creates a function, that', () => {
    it('returns null if the workspace is not found', async () => {
      const workspace = await getWorkspace({
        workspaceId: cryptoRandomString({ length: 10 })
      })
      expect(workspace).to.be.null
    })
    // not testing get here, we're going to use that for testing upsert
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

      await upsertWorkspace({
        workspace: {
          ...testWorkspace,
          id: cryptoRandomString({ length: 13 }),
          createdAt: new Date()
        }
      })

      const modifiedStoredWorkspace = await getWorkspace({
        workspaceId: testWorkspace.id
      })

      expect(modifiedStoredWorkspace).to.deep.equal(testWorkspace)
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

      await upsertWorkspaceRole({ userId, workspaceId, role: 'workspace:member' })
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
        role: 'workspace:member'
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
        role: 'workspace:admin'
      })
      await upsertWorkspaceRole({
        workspaceId,
        userId: userIdB,
        role: 'workspace:admin'
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

      await upsertWorkspaceRole({ workspaceId, userId, role: 'workspace:admin' })

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
        role: 'workspace:admin'
      })
      await upsertWorkspaceRole({
        workspaceId: workspaceIdB,
        userId,
        role: 'workspace:admin'
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
        role: 'workspace:admin'
      })
      await upsertWorkspaceRole({
        workspaceId: workspaceIdB,
        userId,
        role: 'workspace:admin'
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
        role: Roles.Workspace.Member
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
        role: Roles.Workspace.Member
      })

      const workspaces = await getUserDiscoverableWorkspaces({
        domains: ['example.org'],
        userId: problemChild.id
      })

      expect(workspaces.length).to.equal(1)
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

  describe('getWorkspaceRolesCountFactory creates a function, that', () => {
    it('returns counts when only one admin is present', async () => {
      const admin = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(admin)
      const workspace = {
        id: createRandomPassword(),
        name: 'my workspace',
        ownerId: admin.id
      }
      await createTestWorkspace(workspace, admin)

      const result = await getWorkspaceRolesCountFactory({ db })({
        workspaceId: workspace.id
      })
      expect(result).to.deep.equal({
        admins: 1,
        members: 0,
        guests: 0,
        viewers: 0
      })
    })

    it('returns counts when there are no guests', async () => {
      const admin = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(admin)
      const workspace = {
        id: createRandomPassword(),
        name: 'my workspace',
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

      const result = await getWorkspaceRolesCountFactory({ db })({
        workspaceId: workspace.id
      })
      expect(result).to.deep.equal({
        admins: 1,
        members: 1,
        guests: 0,
        viewers: 0
      })
    })

    it('returns counts when there are guests but no project', async () => {
      const admin = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(admin)
      const workspace = {
        id: createRandomPassword(),
        name: 'my workspace',
        ownerId: admin.id
      }
      await createTestWorkspace(workspace, admin)

      const member1 = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      const member2 = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      const member3 = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }

      const guest1 = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      const guest2 = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }

      await Promise.all([
        createTestUser(member1),
        createTestUser(member2),
        createTestUser(member3),
        createTestUser(guest1),
        createTestUser(guest2)
      ])
      await Promise.all([
        assignToWorkspace(workspace, member1, Roles.Workspace.Member),
        assignToWorkspace(workspace, member2, Roles.Workspace.Member),
        assignToWorkspace(workspace, member3, Roles.Workspace.Member),
        assignToWorkspace(workspace, guest1, Roles.Workspace.Guest),
        assignToWorkspace(workspace, guest2, Roles.Workspace.Guest)
      ])

      const result = await getWorkspaceRolesCountFactory({ db })({
        workspaceId: workspace.id
      })
      expect(result).to.deep.equal({
        admins: 1,
        members: 3,
        guests: 0,
        viewers: 2 // Guests assigned no to project are considered viewers
      })
    })

    it('returns roles counts', async () => {
      const admin = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      await createTestUser(admin)
      const workspace = {
        id: createRandomPassword(),
        name: 'my workspace',
        ownerId: admin.id
      }
      await createTestWorkspace(workspace, admin)

      const member1 = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      const member2 = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      const member3 = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }

      const guestWriterAllProjects = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      const guestWriterOneProject = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }

      const viewerNoProjects = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      const viewerAllProjects = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }
      const viewerOneProject = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }

      const admin2 = {
        id: createRandomPassword(),
        name: createRandomPassword(),
        email: createRandomEmail()
      }

      await Promise.all([
        createTestUser(admin2),
        createTestUser(member1),
        createTestUser(member2),
        createTestUser(member3),
        createTestUser(guestWriterAllProjects),
        createTestUser(guestWriterOneProject),
        createTestUser(viewerOneProject),
        createTestUser(viewerAllProjects),
        createTestUser(viewerNoProjects)
      ])
      await Promise.all([
        assignToWorkspace(workspace, admin2, Roles.Workspace.Admin),
        assignToWorkspace(workspace, member1, Roles.Workspace.Member),
        assignToWorkspace(workspace, member2, Roles.Workspace.Member),
        assignToWorkspace(workspace, member3, Roles.Workspace.Member),
        assignToWorkspace(workspace, guestWriterAllProjects, Roles.Workspace.Guest),
        assignToWorkspace(workspace, guestWriterOneProject, Roles.Workspace.Guest),
        assignToWorkspace(workspace, viewerOneProject, Roles.Workspace.Guest),
        assignToWorkspace(workspace, viewerAllProjects, Roles.Workspace.Guest),
        assignToWorkspace(workspace, viewerNoProjects, Roles.Workspace.Guest)
      ])

      const project1 = {
        id: createRandomString(),
        name: 'test stream',
        isPublic: true,
        ownerId: admin.id
      }
      const project2 = {
        id: createRandomString(),
        name: 'test stream 2',
        isPublic: true,
        ownerId: admin2.id
      }

      await Promise.all([
        createTestStream(project1, admin),
        createTestStream(project2, admin)
      ])

      await Promise.all([
        grantStreamPermissions({
          streamId: project2.id,
          role: Roles.Stream.Contributor,
          userId: member1.id
        }), // should not be considered differently
        grantStreamPermissions({
          streamId: project1.id,
          role: Roles.Stream.Contributor,
          userId: guestWriterAllProjects.id
        }),
        grantStreamPermissions({
          streamId: project2.id,
          role: Roles.Stream.Contributor,
          userId: guestWriterAllProjects.id
        }),
        grantStreamPermissions({
          streamId: project1.id,
          role: Roles.Stream.Contributor,
          userId: guestWriterOneProject.id
        }),
        grantStreamPermissions({
          streamId: project2.id,
          role: Roles.Stream.Reviewer,
          userId: guestWriterOneProject.id
        }),
        grantStreamPermissions({
          streamId: project1.id,
          role: Roles.Stream.Reviewer,
          userId: viewerAllProjects.id
        }),
        grantStreamPermissions({
          streamId: project2.id,
          role: Roles.Stream.Reviewer,
          userId: viewerAllProjects.id
        }),
        grantStreamPermissions({
          streamId: project1.id,
          role: Roles.Stream.Reviewer,
          userId: viewerOneProject.id
        })
      ])

      const result = await getWorkspaceRolesCountFactory({ db })({
        workspaceId: workspace.id
      })
      expect(result).to.deep.equal({
        admins: 2,
        members: 3,
        guests: 2,
        viewers: 3 // Guests assigned no to project are considered viewers
      })
    })
  })
})
