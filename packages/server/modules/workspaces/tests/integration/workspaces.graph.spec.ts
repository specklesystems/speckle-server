import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUser,
  createTestUsers
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
  CreateWorkspaceProjectDocument
} from '@/test/graphql/generated/graphql'
import { beforeEachContext } from '@/test/hooks'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import {
  assignToWorkspace,
  BasicTestWorkspace,
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
import { getWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
import { grantStreamPermissionsFactory } from '@/modules/core/repositories/streams'

const grantStreamPermissions = grantStreamPermissionsFactory({ db })

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
        const createRes = await apollo.execute(CreateWorkspaceDocument, {
          input: { name: createRandomString() }
        })
        expect(createRes).to.not.haveGraphQLErrors()
        const workspaceId = createRes.data!.workspaceMutations.create.id
        const workspace = (await getWorkspaceFactory({ db })({
          workspaceId
        })) as unknown as BasicTestWorkspace

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
          },
          {
            role: Roles.Stream.Contributor,
            project: {
              id: project2Id,
              name: project2Name
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

    describe('query activeUser.workspaces', () => {
      it('should return all workspaces for a user', async () => {
        const testUser: BasicTestUser = {
          id: '',
          name: 'John Speckle',
          email: 'foobar@example.org',
          role: Roles.Server.Admin,
          verified: true
        }

        await createTestUser(testUser)
        const testApollo: TestApolloServer = await testApolloServer({
          context: await createTestContext({
            auth: true,
            userId: testUser.id,
            token: '',
            role: testUser.role,
            scopes: AllScopes
          })
        })

        const workspace1: BasicTestWorkspace = {
          id: '',
          ownerId: '',
          name: 'Workspace A',
          slug: cryptoRandomString({ length: 10 })
        }

        const workspace2: BasicTestWorkspace = {
          id: '',
          ownerId: '',
          name: 'Workspace A',
          slug: cryptoRandomString({ length: 10 })
        }

        const workspace3: BasicTestWorkspace = {
          id: '',
          ownerId: '',
          name: 'Workspace A',
          slug: cryptoRandomString({ length: 10 })
        }

        await createTestWorkspace(workspace1, testUser)
        await createTestWorkspace(workspace2, testUser)
        await createTestWorkspace(workspace3, testUser)

        const res = await testApollo.execute(GetActiveUserWorkspacesDocument, {})
        expect(res).to.not.haveGraphQLErrors()
        // TODO: this test depends on the previous tests
        expect(res.data?.activeUser?.workspaces?.items?.length).to.equal(3)
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
          authorId: ''
        }

        createTestCommit(testVersion, {
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
        expect(getRes).to.haveGraphQLErrors('Workspace not found')
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
      const workspace = {
        id: '',
        ownerId: '',
        name: cryptoRandomString({ length: 6 }),
        description: cryptoRandomString({ length: 12 })
      }

      beforeEach(async () => {
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

      it('should require default project role to be a valid role', async () => {
        const resA = await apollo.execute(UpdateWorkspaceDocument, {
          input: {
            id: workspace.id,
            defaultProjectRole: 'stream:contributor'
          }
        })
        const resB = await apollo.execute(UpdateWorkspaceDocument, {
          input: {
            id: workspace.id,
            defaultProjectRole: 'stream:reviewer'
          }
        })
        const resC = await apollo.execute(UpdateWorkspaceDocument, {
          input: {
            id: workspace.id,
            defaultProjectRole: 'stream:collaborator'
          }
        })

        expect(resA).to.not.haveGraphQLErrors()
        expect(resB).to.not.haveGraphQLErrors()
        expect(resC).to.haveGraphQLErrors('Provided default project role is invalid')
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
  })
})
