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
import { Roles } from '@speckle/shared'
import {
  CreateProjectInviteDocument,
  CreateWorkspaceDocument,
  DeleteWorkspaceDocument,
  GetActiveUserWorkspacesDocument,
  GetWorkspaceDocument,
  GetWorkspaceTeamDocument,
  UpdateWorkspaceDocument,
  UpdateWorkspaceRoleDocument,
  ActiveUserLeaveWorkspaceDocument,
  GetWorkspaceWithBillingDocument,
  CreateObjectDocument,
  CreateProjectVersionDocument,
  GetWorkspaceWithProjectsDocument,
  CreateProjectDocument
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
import knex, { db } from '@/db/knex'
import {
  createRandomPassword,
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { getBranchesByStreamId } from '@/modules/core/services/branches'
import { grantStreamPermissions } from '@/modules/core/repositories/streams'
import { getWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
import { WorkspaceEarlyAdopterDiscount } from '@/modules/workspaces/domain/constants'

const createProjectWithVersions =
  ({ apollo }: { apollo: TestApolloServer }) =>
  async ({
    workspaceId,
    versionsCount
  }: {
    workspaceId?: string
    versionsCount: number
  }) => {
    const resProject1 = await apollo.execute(CreateProjectDocument, {
      input: {
        name: createRandomPassword(),
        workspaceId
      }
    })
    expect(resProject1).to.not.haveGraphQLErrors()
    const project1Id = resProject1.data!.projectMutations.create.id

    const {
      items: [model1]
    } = await getBranchesByStreamId({
      streamId: project1Id,
      limit: 1,
      cursor: null
    })
    expect(model1).to.exist

    const resObj1 = await apollo.execute(CreateObjectDocument, {
      input: {
        streamId: project1Id,
        objects: [{ some: 'obj' }]
      }
    })
    expect(resObj1).to.not.haveGraphQLErrors()

    await Promise.all(
      new Array(versionsCount).fill(0).map(async () => {
        const res = await apollo.execute(CreateProjectVersionDocument, {
          input: {
            projectId: project1Id,
            modelId: model1.id,
            objectId: resObj1.data!.objectCreate[0]
          }
        })
        expect(res).to.not.haveGraphQLErrors()
      })
    )
  }
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
      it('should return workspace members', async () => {
        const res = await apollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: workspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.team.length).to.equal(2)
      })

      it('should respect search filters', async () => {
        const res = await apollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: workspace.id,
          filter: {
            search: 'jimmy'
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.team.length).to.equal(1)
      })

      it('should respect role filters', async () => {
        const res = await apollo.execute(GetWorkspaceTeamDocument, {
          workspaceId: workspace.id,
          filter: {
            role: 'workspace:member'
          }
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.team.length).to.equal(1)
      })
    })

    describe('query workspace.billing', () => {
      it('should return workspace version limits', async () => {
        await createProjectWithVersions({ apollo })({
          workspaceId: workspace.id,
          versionsCount: 3
        })
        await createProjectWithVersions({ apollo })({
          workspaceId: workspace.id,
          versionsCount: 2
        })

        const res = await apollo.execute(GetWorkspaceWithBillingDocument, {
          workspaceId: workspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.billing.versionsCount).to.deep.equal({
          current: 5,
          max: 500
        })
      })
      it('should return workspace cost', async () => {
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
        const guestWithWritePermission = {
          id: createRandomString(),
          name: createRandomPassword(),
          email: createRandomEmail()
        }
        const viewer = {
          id: createRandomString(),
          name: createRandomPassword(),
          email: createRandomEmail()
        }
        const viewer2 = {
          id: createRandomString(),
          name: createRandomPassword(),
          email: createRandomEmail()
        }

        await Promise.all([
          createTestUser(member),
          createTestUser(guestWithWritePermission),
          createTestUser(viewer),
          createTestUser(viewer2)
        ])

        await Promise.all([
          assignToWorkspace(workspace, member, Roles.Workspace.Member),
          assignToWorkspace(workspace, guestWithWritePermission, Roles.Workspace.Guest),
          assignToWorkspace(workspace, viewer, Roles.Workspace.Guest),
          assignToWorkspace(workspace, viewer2, Roles.Workspace.Guest)
        ])

        const resProject1 = await apollo.execute(CreateProjectDocument, {
          input: {
            name: createRandomPassword(),
            workspaceId
          }
        })
        expect(resProject1).to.not.haveGraphQLErrors()
        const project1Id = resProject1.data!.projectMutations.create.id

        await Promise.all([
          grantStreamPermissions({
            streamId: project1Id,
            userId: guestWithWritePermission.id,
            role: Roles.Stream.Contributor
          }),
          grantStreamPermissions({
            streamId: project1Id,
            userId: viewer.id,
            role: Roles.Stream.Reviewer
          }),
          grantStreamPermissions({
            streamId: project1Id,
            userId: viewer2.id,
            role: Roles.Stream.Reviewer
          })
        ])

        const res = await apollo.execute(GetWorkspaceWithBillingDocument, {
          workspaceId
        })

        expect(res).to.not.haveGraphQLErrors()
        const { subTotal, currency, items, total, discount } =
          res.data!.workspace.billing.cost
        expect(subTotal).to.equal(70 + 50 + 10)
        expect(currency).to.equal('GBP')
        expect(items).to.deep.equal([
          {
            name: 'workspace admin',
            count: 1,
            cost: 70
          },
          {
            name: 'workspace member',
            count: 1,
            cost: 50
          },
          {
            name: 'read/write guest',
            count: 1,
            cost: 10
          },
          {
            name: 'read only guest',
            count: 2,
            cost: 0
          }
        ])
        expect(discount).to.deep.equal(WorkspaceEarlyAdopterDiscount)
        expect(total).to.equal(65)
      })
    })

    describe('query activeUser.workspaces', () => {
      it('should return all workspaces for a user', async () => {
        const res = await apollo.execute(GetActiveUserWorkspacesDocument, {})
        expect(res).to.not.haveGraphQLErrors()
        // TODO: this test depends on the previous tests
        expect(res.data?.activeUser?.workspaces?.items?.length).to.equal(2)
      })
    })

    describe('query workspace.projects', () => {
      it('should return all projects for a user in the workspace', async () => {
        const workspace = {
          id: '',
          name: 'test ws',
          ownerId: ''
        }
        await createTestWorkspace(workspace, testMemberUser)
        const user = {
          id: createRandomPassword(),
          email: createRandomEmail(),
          name: createRandomPassword()
        }

        const resProject1 = await apollo.execute(CreateProjectDocument, {
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
    describe('mutation activeUserMutations.userWorkspaceMutations', () => {
      describe('leave', () => {
        it('allows the active user to leave a workspace', async () => {
          const name = cryptoRandomString({ length: 6 })
          const workspaceCreateResult = await apollo.execute(CreateWorkspaceDocument, {
            input: { name }
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
