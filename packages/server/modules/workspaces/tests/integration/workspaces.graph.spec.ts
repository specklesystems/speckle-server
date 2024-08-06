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
  createTestUser
} from '@/test/authHelper'
import { Roles } from '@speckle/shared'
import {
  CreateWorkspaceDocument,
  GetActiveUserWorkspacesDocument,
  GetWorkspaceDocument,
  GetWorkspaceTeamDocument,
  UpdateWorkspaceDocument,
  UpdateWorkspaceRoleDocument
} from '@/test/graphql/generated/graphql'
import { beforeEachContext } from '@/test/hooks'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import {
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'

describe('Workspaces GQL CRUD', () => {
  let apollo: TestApolloServer

  const testUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-speckle@example.org',
    role: Roles.Server.Admin
  }

  before(async () => {
    await beforeEachContext()
    await createTestUser(testUser)
    const token = await createAuthTokenForUser(testUser.id, AllScopes)
    apollo = await testApolloServer({
      context: createTestContext({
        auth: true,
        userId: testUser.id,
        token,
        role: testUser.role,
        scopes: AllScopes
      })
    })
  })

  describe('retrieval operations', () => {
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

    before(async () => {
      await createTestWorkspace(workspace, testUser)
      await createTestUser(testMemberUser)

      await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testMemberUser.id,
          workspaceId: workspace.id,
          role: Roles.Workspace.Member
        }
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

    describe('mutation workspaceMutations.update', () => {
      const workspace: BasicTestWorkspace = {
        id: '',
        ownerId: '',
        name: cryptoRandomString({ length: 6 }),
        description: cryptoRandomString({ length: 12 })
      }

      beforeEach(async () => {
        await createTestWorkspace(workspace, testUser)
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
  })
})
