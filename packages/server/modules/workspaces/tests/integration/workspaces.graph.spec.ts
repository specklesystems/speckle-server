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
  GetWorkspaceTeamDocument,
  UpdateWorkspaceDocument,
  UpdateWorkspaceRoleDocument,
  ActiveUserLeaveWorkspaceDocument
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
import knex from '@/db/knex'

describe('Workspaces GQL CRUD', () => {
  let apollo: TestApolloServer

  const testAdminUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-speckle@example.org',
    role: Roles.Server.Admin
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
      context: createTestContext({
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
      name: 'Workspace A'
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
          await wait(50)
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

      it('should respect role filters', async () => {
        const res = await largeWorkspaceApollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: largeWorkspace.id,
          filter: {
            role: 'workspace:member'
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.team.items.length).to.equal(2)
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
        const resC = await largeWorkspaceApollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: largeWorkspace.id,
          cursor: resB.data?.workspace.team.cursor
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
        expect(resB.data?.workspace.team.cursor).to.exist

        expect(resC).to.not.haveGraphQLErrors()
        expect(resC.data?.workspace.team.items.length).to.equal(0)
        expect(resC.data?.workspace.team.cursor).to.not.exist
      })
    })

    describe('query activeUser.workspaces', () => {
      it('should return all workspaces for a user', async () => {
        const res = await apollo.execute(GetActiveUserWorkspacesDocument, {})
        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.activeUser?.workspaces?.items?.length).to.equal(1)
      })
    })
  })

  describe('management operations', () => {
    describe('mutation workspaceMutations.create', () => {
      it('should create a workspace', async () => {
        const workspaceName = cryptoRandomString({ length: 6 })

        const createRes = await apollo.execute(CreateWorkspaceDocument, {
          input: { name: workspaceName }
        })
        const getRes = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: createRes.data!.workspaceMutations.create.id
        })

        expect(createRes).to.not.haveGraphQLErrors()
        expect(getRes).to.not.haveGraphQLErrors()
        expect(getRes.data?.workspace).to.exist
        expect(getRes.data?.workspace?.name).to.equal(workspaceName)
      })
    })

    describe('mutation workspaceMutations.delete', () => {
      const workspace: BasicTestWorkspace = {
        id: '',
        ownerId: '',
        name: 'My Test Workspace'
      }

      const workspaceProject: BasicTestStream = {
        id: '',
        ownerId: '',
        name: 'My Test Project',
        isPublic: false
      }

      before(async () => {
        await createTestWorkspace(workspace, testAdminUser)

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
        const memberApollo: TestApolloServer = (apollo = await testApolloServer({
          context: createTestContext({
            auth: true,
            userId: testAdminUser.id,
            token: '',
            role: testAdminUser.role,
            scopes: AllScopes
          })
        }))

        const res = await memberApollo.execute(DeleteWorkspaceDocument, {
          workspaceId: workspace.id
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
    })
    describe('mutation activeUserMutations.userWorkspaceMutations', () => {
      describe('leave', () => {
        it('allows the active user to leave a workspace', async () => {
          const name = cryptoRandomString({ length: 6 })
          const workspaceCreateResult = await apollo.execute(CreateWorkspaceDocument, {
            input: { name }
          })

          const id = workspaceCreateResult.data?.workspaceMutations.create.id
          if (!id) throw new Error('This should have succeeded')

          await apollo.execute(UpdateWorkspaceRoleDocument, {
            input: {
              userId: testMemberUser.id,
              workspaceId: id,
              role: Roles.Workspace.Admin
            }
          })

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
            input: { name }
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
  })
})
