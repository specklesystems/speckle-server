import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import {
  BasicTestUser,
  buildBasicTestUser,
  createAuthTokenForUser,
  createTestUser,
  createTestUsers,
  login
} from '@/test/authHelper'
import { Roles, wait, WorkspaceRoles } from '@speckle/shared'
import {
  CreateProjectInviteDocument,
  CreateWorkspaceDocument,
  DeleteWorkspaceDocument,
  GetActiveUserWorkspacesDocument,
  GetWorkspaceDocument,
  GetWorkspaceBySlugDocument,
  GetWorkspaceTeamDocument,
  UpdateWorkspaceDocument,
  UpdateWorkspaceRoleDocument,
  ActiveUserLeaveWorkspaceDocument,
  GetWorkspaceWithProjectsDocument,
  AddWorkspaceDomainDocument,
  DeleteWorkspaceDomainDocument,
  CreateWorkspaceProjectDocument,
  DismissWorkspaceDocument,
  GetActiveUserDiscoverableWorkspacesDocument,
  GetWorkspaceWithMembersByRoleDocument,
  UpdateEmbedOptionsDocument,
  WorkspaceEmbedOptionsDocument,
  ProjectEmbedOptionsDocument
} from '@/test/graphql/generated/graphql'
import { beforeEachContext, truncateTables } from '@/test/hooks'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import {
  assignToWorkspace,
  BasicTestWorkspace,
  buildBasicTestWorkspace,
  createTestWorkspace,
  createWorkspaceInviteDirectly
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestCommit, createTestCommit } from '@/test/speckle-helpers/commitHelper'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { shuffle } from 'lodash'
import knex, { db } from '@/db/knex'
import {
  createRandomPassword,
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { getWorkspaceRoleForUserFactory } from '@/modules/workspaces/repositories/workspaces'
import { grantStreamPermissionsFactory } from '@/modules/core/repositories/streams'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { getUserFactory } from '@/modules/core/repositories/users'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { sendEmail } from '@/modules/emails/services/sending'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { itEach } from '@/test/assertionHelper'
import { assignWorkspaceSeatFactory } from '@/modules/workspaces/services/workspaceSeat'
import { createWorkspaceSeatFactory } from '@/modules/gatekeeper/repositories/workspaceSeat'
import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import { Workspaces } from '@/modules/workspaces/helpers/db'

const grantStreamPermissions = grantStreamPermissionsFactory({ db })
const validateAndCreateUserEmail = validateAndCreateUserEmailFactory({
  createUserEmail: createUserEmailFactory({ db }),
  ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
  findEmail: findEmailFactory({ db }),
  updateEmailInvites: finalizeInvitedServerRegistrationFactory({
    deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
    updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
  }),
  requestNewEmailVerification: requestNewEmailVerificationFactory({
    findEmail: findEmailFactory({ db }),
    getUser: getUserFactory({ db }),
    getServerInfo: getServerInfoFactory({ db }),
    deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
    sendEmail,
    renderEmail
  })
})

describe('Workspaces GQL CRUD', () => {
  let apollo: TestApolloServer

  const testAdminUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-speckle@example.org',
    role: Roles.Server.Admin,
    verified: true
  }

  const testMemberUser: BasicTestUser = {
    id: '',
    name: 'Alice speckle',
    email: 'alice-speckle@example.org',
    role: Roles.Server.User
  }

  before(async () => {
    await beforeEachContext()
    await createTestUsers([testAdminUser, testMemberUser])
    const token = await createAuthTokenForUser(testAdminUser.id, AllScopes)
    apollo = await testApolloServer({
      context: await createTestContext({
        auth: true,
        userId: testAdminUser.id,
        token,
        role: testAdminUser.role,
        scopes: AllScopes
      })
    })
  })

  describe('retrieval operations', () => {
    let apollo: TestApolloServer

    const workspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      name: 'Workspace A',
      slug: cryptoRandomString({ length: 10 })
    }

    const testMemberUser: BasicTestUser = {
      id: '',
      name: 'Jimmy Speckle',
      email: 'jimmy-speckle@example.org'
    }

    const testMemberUser2: BasicTestUser = {
      id: '',
      name: 'Some Dude',
      email: 'some-dude@example.org'
    }

    before(async () => {
      await createTestUsers([testMemberUser, testMemberUser2])
      await createTestWorkspace(workspace, testMemberUser)
      await assignToWorkspace(workspace, testMemberUser2, Roles.Workspace.Member)

      apollo = await testApolloServer({
        authUserId: testMemberUser.id
      })
    })

    describe('query workspace by slug', () => {
      it('should return a workspace that exists', async () => {
        const res = await apollo.execute(GetWorkspaceBySlugDocument, {
          workspaceSlug: workspace.slug
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspaceBySlug.id).to.equal(workspace.id)
      })

      it('throw a not found error if the workspace does not exist', async () => {
        const res = await apollo.execute(GetWorkspaceBySlugDocument, {
          workspaceSlug: cryptoRandomString({ length: 6 })
        })
        expect(res).to.haveGraphQLErrors('not found')
      })
    })

    describe('query workspace', () => {
      it('should return a workspace that exists', async () => {
        const res = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace).to.exist
      })

      it('throw a not found error if the workspace does not exist', async () => {
        const res = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: cryptoRandomString({ length: 6 })
        })
        expect(res).to.haveGraphQLErrors('not found')
      })
    })

    describe('query workspace.team', () => {
      let largeWorkspaceApollo: TestApolloServer

      const largeWorkspace: BasicTestWorkspace = {
        id: '',
        ownerId: '',
        name: 'My Large Workspace',
        slug: cryptoRandomString({ length: 10 }),
        description: 'A workspace with many users and roles to test pagination.'
      }

      const largeWorkspaceAdmin: BasicTestUser = {
        id: '',
        name: 'John A Speckle',
        email: 'large-workspace-user-a@example.org'
      }

      before(async () => {
        await createTestUser(largeWorkspaceAdmin)
        await createTestWorkspace(largeWorkspace, largeWorkspaceAdmin)

        largeWorkspaceApollo = await testApolloServer({
          authUserId: largeWorkspaceAdmin.id
        })

        const workspaceMembers: [BasicTestUser, WorkspaceRoles][] = [
          [
            {
              id: '',
              name: 'John B Speckle',
              email: 'large-workspace-user-b@example.org'
            },
            'workspace:admin'
          ],
          [
            {
              id: '',
              name: 'John C Speckle',
              email: 'large-workspace-user-c@example.org'
            },
            'workspace:member'
          ],
          [
            {
              id: '',
              name: 'John D Speckle',
              email: 'large-workspace-user-d@example.org'
            },
            'workspace:member'
          ],
          [
            {
              id: '',
              name: 'John F Speckle',
              email: 'large-workspace-user-f-1@example.org'
            },
            'workspace:guest'
          ],
          [
            {
              id: '',
              name: 'John F Speckle',
              email: 'large-workspace-user-f-2@example.org'
            },
            'workspace:guest'
          ]
        ]

        for (const [user, role] of workspaceMembers) {
          await createTestUser(user)
          await assignToWorkspace(largeWorkspace, user, role)
          // Overly-careful guarantee that `createdAt` values are different
          await wait(1)
        }

        for (const [user, role] of shuffle(workspaceMembers)) {
          // Simulate future changes to user roles
          await assignToWorkspace(largeWorkspace, user, role)
          await wait(1)
        }
      })

      it('should return workspace members', async () => {
        const res = await largeWorkspaceApollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: largeWorkspace.id,
          limit: 25
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.team.items.length).to.equal(6)
      })

      it('should return workspace members in the correct order', async () => {
        const res = await largeWorkspaceApollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: largeWorkspace.id
        })

        const memberNames = res.data?.workspace.team.items.map((user) => user.user.name)
        const expectedMemberNames = [
          'John F Speckle',
          'John F Speckle',
          'John D Speckle',
          'John C Speckle',
          'John B Speckle',
          'John A Speckle'
        ]

        expect(res).to.not.haveGraphQLErrors()
        expect(memberNames).to.deep.equal(expectedMemberNames)
      })

      it('should respect search filters', async () => {
        const res = await largeWorkspaceApollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: largeWorkspace.id,
          filter: {
            search: 'John C'
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.team.items.length).to.equal(1)
        expect(res.data?.workspace.team.items[0].user.name).to.equal('John C Speckle')
      })

      it('should respect role filters with one value', async () => {
        const res = await largeWorkspaceApollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: largeWorkspace.id,
          filter: {
            roles: ['workspace:member']
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.team.items.length).to.equal(2)
      })

      it('should respect role filters with multiple values', async () => {
        const res = await largeWorkspaceApollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: largeWorkspace.id,
          filter: {
            roles: ['workspace:admin', 'workspace:member']
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.team.items.length).to.equal(4)
      })

      it('should respect search limits', async () => {
        const res = await largeWorkspaceApollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: largeWorkspace.id,
          limit: 1
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.team.items.length).to.equal(1)
        expect(res.data?.workspace.team.cursor).to.exist
      })

      it('should respect seatType filter', async () => {
        const admin = await createTestUser({
          id: createRandomString(),
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        const workspace = {
          id: createRandomString(),
          ownerId: admin.id,
          name: createRandomString(),
          slug: cryptoRandomString({ length: 10 })
        }
        await createTestWorkspace(workspace, admin)
        const otherWorkspace = {
          id: createRandomString(),
          ownerId: admin.id,
          name: createRandomString(),
          slug: cryptoRandomString({ length: 10 })
        }
        await createTestWorkspace(otherWorkspace, admin)

        const session = await login(admin)

        const memberEditor = {
          id: createRandomString(),
          name: createRandomString(),
          email: createRandomEmail()
        }
        await createTestUser(memberEditor)
        await assignToWorkspace(workspace, memberEditor, 'workspace:member')
        await assignWorkspaceSeatFactory({
          createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
          getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db }),
          eventEmit: async () => {}
        })({
          workspaceId: workspace.id,
          userId: memberEditor.id,
          type: WorkspaceSeatType.Editor,
          assignedByUserId: admin.id
        })
        // Assign the same user editor to another workspace
        await assignToWorkspace(otherWorkspace, memberEditor, 'workspace:member')
        await assignWorkspaceSeatFactory({
          createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
          getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db }),
          eventEmit: async () => {}
        })({
          workspaceId: otherWorkspace.id,
          userId: memberEditor.id,
          type: WorkspaceSeatType.Editor,
          assignedByUserId: admin.id
        })

        const memberViewer = {
          id: createRandomString(),
          name: createRandomString(),
          email: createRandomEmail()
        }
        await createTestUser(memberViewer)
        await assignToWorkspace(workspace, memberViewer, 'workspace:member')
        await assignWorkspaceSeatFactory({
          createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
          getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db }),
          eventEmit: async () => {}
        })({
          workspaceId: workspace.id,
          userId: memberViewer.id,
          type: WorkspaceSeatType.Viewer,
          assignedByUserId: admin.id
        })

        const res = await session.execute(GetWorkspaceTeamDocument, {
          workspaceId: workspace.id,
          filter: {
            seatType: WorkspaceSeatType.Editor
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.team.items.length).to.equal(2)
        expect(res.data?.workspace.team.items.length).to.equal(2)
        const team = res.data?.workspace.team.items
        expect(team?.[1].user.name).to.eq(admin.name)
        expect(team?.[0].user.name).to.eq(memberEditor.name)
      })

      it('should respect team pagination', async () => {
        const resA = await largeWorkspaceApollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: largeWorkspace.id,
          limit: 2
        })
        const resB = await largeWorkspaceApollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: largeWorkspace.id,
          limit: 10,
          cursor: resA.data?.workspace.team.cursor
        })

        expect(resA).to.not.haveGraphQLErrors()
        expect(resA.data?.workspace.team.items.length).to.equal(2)
        expect(
          resA.data?.workspace.team.items.every(
            (user) => user.role === 'workspace:admin'
          )
        )
        expect(resA.data?.workspace.team.cursor).to.exist

        expect(resB).to.not.haveGraphQLErrors()
        expect(resB.data?.workspace.team.items.length).to.equal(4)
        expect(resB.data?.workspace.team.cursor).to.be.null
      })

      it('should return correct total count', async () => {
        const res = await largeWorkspaceApollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: largeWorkspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.team.totalCount).to.equal(6)
      })

      it('should return correct total count while paginating', async () => {
        const res = await largeWorkspaceApollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: largeWorkspace.id,
          limit: 1
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.team.totalCount).to.equal(6)
      })

      it('should return workspace team projectRoles', async () => {
        // create workspace w/ infinite limits (otherwise test fails)
        const workspace: BasicTestWorkspace = {
          name: createRandomString(),
          id: '',
          ownerId: '',
          slug: ''
        }
        await createTestWorkspace(workspace, testMemberUser, {
          addPlan: {
            name: 'teamUnlimited',
            status: 'valid'
          }
        })
        const workspaceId = workspace.id

        const member = {
          id: createRandomString(),
          name: createRandomPassword(),
          email: createRandomEmail()
        }
        const guest = {
          id: createRandomString(),
          name: createRandomPassword(),
          email: createRandomEmail()
        }

        await Promise.all([createTestUser(member), createTestUser(guest)])

        await Promise.all([
          assignToWorkspace(workspace, member, Roles.Workspace.Member),
          assignToWorkspace(workspace, guest, Roles.Workspace.Guest)
        ])

        const resProject1 = await apollo.execute(CreateWorkspaceProjectDocument, {
          input: {
            name: createRandomPassword(),
            workspaceId
          }
        })
        expect(resProject1).to.not.haveGraphQLErrors()
        const project1Id = resProject1.data!.workspaceMutations.projects.create.id
        const project1Name = resProject1.data!.workspaceMutations.projects.create.name

        const resProject2 = await apollo.execute(CreateWorkspaceProjectDocument, {
          input: {
            name: createRandomPassword(),
            workspaceId
          }
        })
        expect(resProject2).to.not.haveGraphQLErrors()
        const project2Id = resProject2.data!.workspaceMutations.projects.create.id
        const project2Name = resProject2.data!.workspaceMutations.projects.create.name

        await Promise.all([
          grantStreamPermissions({
            streamId: project1Id,
            userId: member.id,
            role: Roles.Stream.Contributor
          }),
          grantStreamPermissions({
            streamId: project1Id,
            userId: guest.id,
            role: Roles.Stream.Reviewer
          }),
          grantStreamPermissions({
            streamId: project2Id,
            userId: guest.id,
            role: Roles.Stream.Contributor
          })
        ])

        const res = await apollo.execute(GetWorkspaceTeamDocument, {
          workspaceId
        })

        expect(res).to.not.haveGraphQLErrors()
        const items = res.data?.workspace!.team?.items ?? []
        expect(items).to.have.length(3)

        const adminRoles = items.find(
          (item) => item.role === Roles.Workspace.Admin
        )?.projectRoles
        expect(adminRoles).to.have.deep.members([
          {
            role: Roles.Stream.Owner,
            project: {
              id: project1Id,
              name: project1Name
            }
          },
          {
            role: Roles.Stream.Owner,
            project: {
              id: project2Id,
              name: project2Name
            }
          }
        ])
        const memberRoles = items.find(
          (item) => item.role === Roles.Workspace.Member
        )?.projectRoles
        expect(memberRoles).to.have.deep.members([
          {
            role: Roles.Stream.Contributor,
            project: {
              id: project1Id,
              name: project1Name
            }
          }
        ])
        const guestRoles = items.find(
          (item) => item.role === Roles.Workspace.Guest
        )?.projectRoles
        expect(guestRoles).to.have.deep.members([
          {
            role: Roles.Stream.Reviewer,
            project: {
              id: project1Id,
              name: project1Name
            }
          },
          {
            role: Roles.Stream.Contributor,
            project: {
              id: project2Id,
              name: project2Name
            }
          }
        ])
      })
    })

    describe('LimitedWorkspace.team', () => {
      it('should return a limited workspace team', async () => {
        const email = createRandomEmail()
        const domain = email.split('@')[1]
        const user = await createTestUser({
          id: createRandomString(),
          name: createRandomString(),
          email,
          role: Roles.Server.Admin,
          verified: true
        })
        const session = await login(user)

        const workspaceAdmin = await createTestUser({
          id: createRandomString(),
          name: 'John Speckle',
          email: createRandomEmail(),
          role: Roles.Server.Admin,
          verified: true,
          avatar: 'data:image/png;base64,foobar'
        })

        await createTestWorkspace(
          {
            id: createRandomString(),
            ownerId: workspaceAdmin.id,
            name: 'Workspace A',
            slug: cryptoRandomString({ length: 10 }),
            discoverabilityEnabled: true
          },
          workspaceAdmin,
          {
            domain
          }
        )
        await createTestWorkspace(
          {
            id: createRandomString(),
            ownerId: workspaceAdmin.id,
            name: 'Workspace B',
            slug: cryptoRandomString({ length: 10 }),
            discoverabilityEnabled: true
          },
          workspaceAdmin,
          {
            domain
          }
        )
        // Workspace without domain should not be returned
        await createTestWorkspace(
          {
            id: createRandomString(),
            ownerId: workspaceAdmin.id,
            name: 'Workspace C',
            slug: cryptoRandomString({ length: 10 })
          },
          workspaceAdmin
        )

        const res = await session.execute(
          GetActiveUserDiscoverableWorkspacesDocument,
          {}
        )
        expect(res).to.not.haveGraphQLErrors()

        expect(res.data?.activeUser?.discoverableWorkspaces).to.have.length(2)
        const discoverableWorkspaces = res.data?.activeUser?.discoverableWorkspaces
        expect(discoverableWorkspaces?.[0].team?.items).to.have.length(1)
        expect(discoverableWorkspaces?.[0].team?.items[0]?.user?.avatar).to.eq(
          workspaceAdmin.avatar
        )
        expect(discoverableWorkspaces?.[1].team?.items).to.have.length(1)
        expect(discoverableWorkspaces?.[1].team?.items[0]?.user?.avatar).to.eq(
          workspaceAdmin.avatar
        )
      })
    })

    describe('query activeUser.workspaces', () => {
      const testUser = buildBasicTestUser({ role: Roles.Server.Admin })

      before(async () => {
        await truncateTables([Workspaces.name])

        await createTestUser(testUser)

        await createTestWorkspace(buildBasicTestWorkspace(), testUser)
        await createTestWorkspace(
          buildBasicTestWorkspace({
            name: 'A loooooooooong name'
          }),
          testUser
        )
        await createTestWorkspace(buildBasicTestWorkspace(), testUser, {
          addCreationState: { completed: false, state: {} }
        })
      })

      it('should return all workspaces for a user', async () => {
        const testApollo: TestApolloServer = await testApolloServer({
          context: await createTestContext({
            auth: true,
            userId: testUser.id,
            token: '',
            role: testUser.role,
            scopes: AllScopes
          })
        })

        const res = await testApollo.execute(GetActiveUserWorkspacesDocument, {})
        expect(res).to.not.haveGraphQLErrors()

        expect(res.data?.activeUser?.workspaces?.items?.length).to.equal(3)
      })

      it('omits non complete workspaces on request', async () => {
        const testApollo: TestApolloServer = await testApolloServer({
          context: await createTestContext({
            auth: true,
            userId: testUser.id,
            token: '',
            role: testUser.role,
            scopes: AllScopes
          })
        })

        const res = await testApollo.execute(GetActiveUserWorkspacesDocument, {
          filter: {
            completed: true
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.activeUser?.workspaces?.items?.length).to.equal(2)
      })

      it('filters by name workspaces on request', async () => {
        const testApollo: TestApolloServer = await testApolloServer({
          context: await createTestContext({
            auth: true,
            userId: testUser.id,
            token: '',
            role: testUser.role,
            scopes: AllScopes
          })
        })

        const res = await testApollo.execute(GetActiveUserWorkspacesDocument, {
          filter: {
            search: 'loooooooooong'
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.activeUser?.workspaces?.items?.length).to.equal(1)
      })
    })

    describe('query workspace.projects', () => {
      it('should return all projects for a user in the workspace', async () => {
        const workspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(workspace, testMemberUser)
        const user = {
          id: createRandomPassword(),
          email: createRandomEmail(),
          name: createRandomPassword()
        }

        const resProject1 = await apollo.execute(CreateWorkspaceProjectDocument, {
          input: {
            name: createRandomPassword(),
            workspaceId: workspace.id
          }
        })
        expect(resProject1).to.not.haveGraphQLErrors()

        const res = await apollo.execute(GetWorkspaceWithProjectsDocument, {
          workspaceId: workspace.id
        })
        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace?.projects.items?.length).to.equal(1)
        expect(res.data?.workspace?.projects.totalCount).to.equal(1)

        // Test Guest user
        await createTestUser(user)
        const sessionGuest = await testApolloServer({
          authUserId: user.id
        })
        await assignToWorkspace(workspace, user, Roles.Workspace.Guest)
        const res2 = await sessionGuest.execute(GetWorkspaceWithProjectsDocument, {
          workspaceId: workspace.id
        })
        expect(res2).to.not.haveGraphQLErrors()
        expect(res2.data?.workspace?.projects.items?.length).to.equal(0)
        expect(res2.data?.workspace?.projects.totalCount).to.equal(0)
      })
    })

    describe('workspace.membersByRole', () => {
      it('should return admins and members and guests in the workspace', async () => {
        const user = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.Admin,
          verified: true
        })
        const workspace = {
          id: createRandomString(),
          name: createRandomString(),
          slug: cryptoRandomString({ length: 10 }),
          ownerId: user.id
        }
        await createTestWorkspace(workspace, user, {
          addPlan: { name: 'pro', status: 'valid' }
        })
        const guest1 = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        await assignToWorkspace(
          workspace,
          guest1,
          Roles.Workspace.Guest,
          WorkspaceSeatType.Viewer
        )
        const guest2 = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        await assignToWorkspace(
          workspace,
          guest2,
          Roles.Workspace.Guest,
          WorkspaceSeatType.Viewer
        )

        const member1 = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        await assignToWorkspace(
          workspace,
          member1,
          Roles.Workspace.Member,
          WorkspaceSeatType.Editor
        )
        const member2 = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        await assignToWorkspace(
          workspace,
          member2,
          Roles.Workspace.Member,
          WorkspaceSeatType.Editor
        )
        const member3 = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        await assignToWorkspace(
          workspace,
          member3,
          Roles.Workspace.Member,
          WorkspaceSeatType.Editor
        )

        const session = await login(user)

        const res = await session.execute(GetWorkspaceWithMembersByRoleDocument, {
          workspaceId: workspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        const roles = res.data?.workspace.teamByRole
        expect(roles?.guests?.totalCount).to.eq(2)
        expect(roles?.members?.totalCount).to.eq(3)
        expect(roles?.admins?.totalCount).to.eq(1)
      })
    })
  })

  describe('management operations', () => {
    describe('mutation workspaceMutations.create', () => {
      it('should create a workspace', async () => {
        const workspaceName = cryptoRandomString({ length: 6 })
        const workspaceSlug = cryptoRandomString({ length: 10 })

        const createRes = await apollo.execute(CreateWorkspaceDocument, {
          input: { name: workspaceName, slug: workspaceSlug }
        })
        const getRes = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: createRes.data!.workspaceMutations.create.id
        })

        expect(createRes).to.not.haveGraphQLErrors()
        expect(getRes).to.not.haveGraphQLErrors()
        expect(getRes.data?.workspace).to.exist
        expect(getRes.data?.workspace?.name).to.equal(workspaceName)
        expect(getRes.data?.workspace?.slug).to.equal(workspaceSlug)
      })

      describe('when attempting to enable domain discoverability', () => {
        const guyWithNoVerifiedEmails: BasicTestUser = {
          id: '',
          name: 'Guy with no verified emails',
          email: 'guy-with-no-verified-emails@bozo1.org',
          verified: false
        }

        const guyWithMultipleVerifiedEmails: BasicTestUser = {
          id: '',
          name: 'Guy with multiple verified emails',
          email: 'guy-with-multiple-verified-emails@bozo2.org',
          verified: true
        }

        const guyWithOneVerifiedEmail: BasicTestUser = {
          id: '',
          name: 'Guy with one verified email',
          email: 'guy-with-one-verified-email@bozo3.org',
          verified: true
        }

        const guyWithOneBlockedVerifiedEmail: BasicTestUser = {
          id: '',
          name: 'Guy with one blocked verified email',
          email: 'guy-with-one-blocked-verified-email@gmail.com',
          verified: true,
          allowPersonalEmail: true
        }

        const getDomain = (user: BasicTestUser) => user.email.split('@')[1]

        before(async () => {
          await createTestUsers([
            guyWithNoVerifiedEmails,
            guyWithMultipleVerifiedEmails,
            guyWithOneVerifiedEmail,
            guyWithOneBlockedVerifiedEmail
          ])

          await Promise.all([
            validateAndCreateUserEmail({
              userEmail: {
                userId: guyWithMultipleVerifiedEmails.id,
                email: 'guy-with-multiple-verified-emails@bozo22.org',
                verified: true
              }
            }),
            validateAndCreateUserEmail({
              userEmail: {
                userId: guyWithMultipleVerifiedEmails.id,
                email: 'guy-with-multiple-verified-emails@bozo23.org',
                verified: true
              }
            })
          ])
        })

        itEach(
          [guyWithOneVerifiedEmail, guyWithMultipleVerifiedEmails],
          (user) => `${user.name} can create with enabled domain discoverability`,
          async (user) => {
            const apollo = await testApolloServer({
              authUserId: user.id
            })
            const createRes = await apollo.execute(CreateWorkspaceDocument, {
              input: {
                name: `${user.name} Domain Discoverability Workspace`,
                slug: cryptoRandomString({ length: 10 }),
                enableDomainDiscoverabilityForDomain: getDomain(user)
              }
            })

            expect(createRes).to.not.haveGraphQLErrors()
            expect(createRes.data?.workspaceMutations.create.id).to.be.ok
            expect(createRes.data!.workspaceMutations.create.discoverabilityEnabled).to
              .be.true
          }
        )

        itEach(
          [guyWithNoVerifiedEmails, guyWithOneBlockedVerifiedEmail],
          (user) => `${user.name} can not create with enabled domain discoverability`,
          async (user) => {
            const apollo = await testApolloServer({
              authUserId: user.id
            })
            const createRes = await apollo.execute(CreateWorkspaceDocument, {
              input: {
                name: `${user.name} Domain Discoverability Workspace`,
                slug: cryptoRandomString({ length: 10 }),
                enableDomainDiscoverabilityForDomain: getDomain(user)
              }
            })

            expect(createRes).to.haveGraphQLErrors()
            expect(createRes.data?.workspaceMutations.create).to.not.be.ok
          }
        )
      })
    })

    describe('mutation workspaceMutations.delete', () => {
      const workspace: BasicTestWorkspace = {
        id: '',
        ownerId: '',
        slug: cryptoRandomString({ length: 10 }),
        name: 'My Test Workspace'
      }

      const workspaceProject: BasicTestStream = {
        id: '',
        ownerId: '',
        name: 'My Test Project',
        isPublic: false
      }

      before(async () => {
        await createTestWorkspace(workspace, testAdminUser, { addPlan: false })

        workspaceProject.workspaceId = workspace.id

        await createWorkspaceInviteDirectly(
          {
            workspaceId: workspace.id,
            input: {
              userId: testMemberUser.id
            }
          },
          testAdminUser.id
        )

        await createTestStream(workspaceProject, testAdminUser)

        await apollo.execute(CreateProjectInviteDocument, {
          projectId: workspaceProject.id,
          input: { userId: testMemberUser.id }
        })

        const testVersion: BasicTestCommit = {
          id: cryptoRandomString({ length: 10 }),
          streamId: workspaceProject.id,
          objectId: '',
          authorId: '',
          branchId: ''
        }

        await createTestCommit(testVersion, {
          owner: testAdminUser,
          stream: workspaceProject
        })
      })

      it('should fail to delete a paid workspace', async () => {
        const paidWorkspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }

        await createTestWorkspace(paidWorkspace, testAdminUser, { addPlan: true })
        const deleteRes = await apollo.execute(DeleteWorkspaceDocument, {
          workspaceId: paidWorkspace.id
        })

        expect(deleteRes).to.haveGraphQLErrors('Workspace has an active paid plan')
      })

      it('should delete the workspace', async () => {
        const deleteRes = await apollo.execute(DeleteWorkspaceDocument, {
          workspaceId: workspace.id
        })
        const getRes = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(deleteRes).to.not.haveGraphQLErrors()
        expect(getRes).to.haveGraphQLErrors({ code: WorkspaceNotFoundError.code })
      })

      it('should throw if non-workspace-admin triggers delete', async () => {
        const nonPaidWorkspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(nonPaidWorkspace, testAdminUser, { addPlan: false })
        const memberApollo: TestApolloServer = await testApolloServer({
          context: await createTestContext({
            auth: true,
            userId: testMemberUser.id,
            token: '',
            role: testMemberUser.role,
            scopes: AllScopes
          })
        })

        const res = await memberApollo.execute(DeleteWorkspaceDocument, {
          workspaceId: nonPaidWorkspace.id
        })

        expect(res).to.haveGraphQLErrors('not authorized')
      })

      it('should delete all workspace projects', async () => {
        const projects = await knex('streams').where({ workspaceId: workspace.id })
        expect(projects.length).to.equal(0)
      })

      it('should delete pending workspace and project invites', async () => {
        const invites = await knex('server_invites').where({
          inviterId: testAdminUser.id
        })
        expect(invites.length).to.equal(0)
      })

      it('should delete all workspace project commits', async () => {
        const versions = await knex('stream_commits').where({
          streamId: workspaceProject.id
        })
        expect(versions.length).to.equal(0)
      })
    })

    describe('mutation workspaceMutations.update', () => {
      const workspace: BasicTestWorkspace = {
        id: '',
        slug: '',
        ownerId: '',
        name: cryptoRandomString({ length: 6 }),
        description: cryptoRandomString({ length: 12 })
      }

      beforeEach(async () => {
        // we want a new workspace for each test
        workspace.id = ''
        workspace.slug = ''

        await createTestWorkspace(workspace, testAdminUser)
      })

      it('should update a workspace', async () => {
        const workspaceName = cryptoRandomString({ length: 6 })

        const updateRes = await apollo.execute(UpdateWorkspaceDocument, {
          input: {
            id: workspace.id,
            name: workspaceName
          }
        })

        const { data } = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(updateRes).to.not.haveGraphQLErrors()
        expect(data?.workspace.name).to.equal(workspaceName)
      })

      it('should not allow workspace name to be empty', async () => {
        const updateRes = await apollo.execute(UpdateWorkspaceDocument, {
          input: {
            id: workspace.id,
            name: ''
          }
        })

        const { data } = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(updateRes).to.not.haveGraphQLErrors()
        expect(data?.workspace.name).to.equal(workspace.name)
      })

      it('should allow workspace description to be empty', async () => {
        const updateRes = await apollo.execute(UpdateWorkspaceDocument, {
          input: {
            id: workspace.id,
            description: ''
          }
        })

        const { data } = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(updateRes).to.not.haveGraphQLErrors()
        expect(data?.workspace.description).to.equal('')
      })

      it('should limit workspace descriptions to 512 characters', async () => {
        const updateRes = await apollo.execute(UpdateWorkspaceDocument, {
          input: {
            id: workspace.id,
            description: 'especkle'.repeat(512)
          }
        })

        expect(updateRes).to.haveGraphQLErrors('too long')
      })
    })

    describe('mutation workspaceMutations.dismiss', () => {
      it('should return an error if workspace does not exists', async () => {
        const res = await apollo.execute(DismissWorkspaceDocument, {
          input: {
            workspaceId: cryptoRandomString({ length: 6 })
          }
        })
        expect(res).to.haveGraphQLErrors(WorkspaceNotFoundError.defaultMessage)
      })
      it('should dismiss a workspace', async () => {
        const workspace: BasicTestWorkspace = {
          id: '',
          slug: '',
          ownerId: '',
          name: cryptoRandomString({ length: 6 }),
          description: cryptoRandomString({ length: 12 })
        }
        await createTestWorkspace(workspace, testAdminUser)

        const dismissRes = await apollo.execute(DismissWorkspaceDocument, {
          input: {
            workspaceId: workspace.id
          }
        })

        expect(dismissRes).to.not.haveGraphQLErrors()
        expect(dismissRes?.data?.workspaceMutations.dismiss).to.equal(true)
      })
    })

    describe('mutation activeUserMutations.userWorkspaceMutations', () => {
      describe('leave', () => {
        it('allows the active user to leave a workspace', async () => {
          const name = cryptoRandomString({ length: 6 })
          const workspaceCreateResult = await apollo.execute(CreateWorkspaceDocument, {
            input: { name, slug: cryptoRandomString({ length: 10 }) }
          })
          expect(workspaceCreateResult).to.not.haveGraphQLErrors()

          const id = workspaceCreateResult.data?.workspaceMutations.create.id
          if (!id) throw new Error('This should have succeeded')

          const updateWorkspaceRole = await apollo.execute(
            UpdateWorkspaceRoleDocument,
            {
              input: {
                userId: testMemberUser.id,
                workspaceId: id,
                role: Roles.Workspace.Admin
              }
            }
          )
          expect(updateWorkspaceRole).to.not.haveGraphQLErrors()

          let userWorkspaces = await apollo.execute(GetActiveUserWorkspacesDocument, {})

          expect(
            userWorkspaces.data?.activeUser?.workspaces.items
              .map((i) => i.name)
              .includes(name)
          ).to.be.true

          const leaveResult = await apollo.execute(ActiveUserLeaveWorkspaceDocument, {
            id
          })

          expect(leaveResult.errors).to.be.undefined

          userWorkspaces = await apollo.execute(GetActiveUserWorkspacesDocument, {})
          expect(
            userWorkspaces.data?.activeUser?.workspaces.items
              .map((i) => i.name)
              .includes(name)
          ).to.be.false
        })
        it('stops the last workspace admin from leaving the workspace', async () => {
          const name = cryptoRandomString({ length: 6 })
          const workspaceCreateResult = await apollo.execute(CreateWorkspaceDocument, {
            input: { name, slug: cryptoRandomString({ length: 10 }) }
          })

          const id = workspaceCreateResult.data?.workspaceMutations.create.id
          if (!id) throw new Error('This should have succeeded')

          const leaveResult = await apollo.execute(ActiveUserLeaveWorkspaceDocument, {
            id
          })

          expect(leaveResult.errors?.length).to.be.greaterThanOrEqual(1)

          const userWorkspaces = await apollo.execute(
            GetActiveUserWorkspacesDocument,
            {}
          )
          expect(
            userWorkspaces.data?.activeUser?.workspaces.items
              .map((i) => i.name)
              .includes(name)
          ).to.be.true
        })
      })
    })

    describe('mutation workspaceMutations.deleteDomain', () => {
      it('should disable discoverability and domain protection when deleting last domain', async () => {
        const workspaceName = cryptoRandomString({ length: 6 })

        const createRes = await apollo.execute(CreateWorkspaceDocument, {
          input: { name: workspaceName, slug: cryptoRandomString({ length: 10 }) }
        })
        expect(createRes).to.not.haveGraphQLErrors()
        const workspaceId = createRes.data!.workspaceMutations.create.id

        const addDomainRes = await apollo.execute(AddWorkspaceDomainDocument, {
          input: {
            workspaceId,
            domain: 'example.org'
          }
        })
        expect(addDomainRes).to.not.haveGraphQLErrors()
        // Enable domain protection and discoverability
        const getRes = await apollo.execute(UpdateWorkspaceDocument, {
          input: {
            id: workspaceId,
            domainBasedMembershipProtectionEnabled: true,
            discoverabilityEnabled: true
          }
        })
        expect(getRes).to.not.haveGraphQLErrors()

        const deleteDomainRes = await apollo.execute(DeleteWorkspaceDomainDocument, {
          input: {
            workspaceId,
            id: addDomainRes.data!.workspaceMutations.addDomain.domains?.[0]?.id ?? ''
          }
        })
        expect(deleteDomainRes).to.not.haveGraphQLErrors()

        expect(
          deleteDomainRes.data?.workspaceMutations.deleteDomain.discoverabilityEnabled
        ).to.false
        expect(
          deleteDomainRes.data?.workspaceMutations.deleteDomain
            .domainBasedMembershipProtectionEnabled
        ).to.false
      })
    })

    describe('mutation workspaceMutations.updateEmbedOptions', () => {
      const workspace: BasicTestWorkspace = {
        id: '',
        ownerId: '',
        slug: cryptoRandomString({ length: 10 }),
        name: 'My Test Workspace'
      }

      const workspaceProject: BasicTestStream = {
        id: '',
        ownerId: '',
        name: 'My Test Project',
        isPublic: false
      }

      before(async () => {
        await createTestWorkspace(workspace, testAdminUser, { addPlan: false })
        workspaceProject.workspaceId = workspace.id
        await createTestStream(workspaceProject, testAdminUser)
      })

      beforeEach(async () => {
        await apollo.execute(UpdateEmbedOptionsDocument, {
          input: {
            workspaceId: workspace.id,
            hideSpeckleBranding: false
          }
        })
      })

      it('should update options at workspace level', async () => {
        const resA = await apollo.execute(UpdateEmbedOptionsDocument, {
          input: {
            workspaceId: workspace.id,
            hideSpeckleBranding: true
          }
        })

        expect(resA).to.not.haveGraphQLErrors()

        const resB = await apollo.execute(WorkspaceEmbedOptionsDocument, {
          workspaceId: workspace.id
        })

        expect(resB).to.not.haveGraphQLErrors()
        expect(resB?.data?.workspace.embedOptions.hideSpeckleBranding).to.equal(true)
      })

      it('should update options at workspace project level', async () => {
        const resA = await apollo.execute(UpdateEmbedOptionsDocument, {
          input: {
            workspaceId: workspace.id,
            hideSpeckleBranding: true
          }
        })

        expect(resA).to.not.haveGraphQLErrors()

        const resB = await apollo.execute(ProjectEmbedOptionsDocument, {
          projectId: workspaceProject.id
        })

        expect(resB).to.not.haveGraphQLErrors()
        expect(resB.data?.project.embedOptions.hideSpeckleBranding).to.equal(true)
      })
    })
  })
})
