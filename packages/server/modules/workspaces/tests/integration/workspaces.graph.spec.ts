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
import { AllScopes, Roles } from '@speckle/shared'
import {
  CreateWorkspaceDocument,
  GetActiveUserWorkspacesDocument,
  GetWorkspaceDocument,
  UpdateWorkspaceDocument
} from '@/test/graphql/generated/graphql'
import { Workspace } from '@/modules/workspacesCore/domain/types'

describe('workspaces module gql operations', () => {
  let apollo: TestApolloServer

  const testUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-speckle@example.org',
    role: Roles.Server.Admin
  }

  before(async () => {
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
    const workspaceIds: string[] = []

    before(async () => {
      const workspaces: Pick<Workspace, 'name'>[] = [
        { name: 'Workspace A' },
        { name: 'Workspace B' }
      ]

      const results = await Promise.all(
        workspaces.map((workspace) =>
          apollo.execute(CreateWorkspaceDocument, { input: workspace })
        )
      )

      for (const result of results) {
        workspaceIds.push(result.data!.workspaceMutations.create.id)
      }
    })

    describe('query workspace', () => {
      it('should return a workspace that exists', async () => {
        const res = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspaceIds[0]
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

    describe('query activeUser.workspaces', () => {
      it('should return all workspaces for a user', async () => {
        const res = await apollo.execute(GetActiveUserWorkspacesDocument, {})

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.activeUser?.workspaces?.items?.length).to.above(1)
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
      it('should update a workspace', async () => {
        const createRes = await apollo.execute(CreateWorkspaceDocument, {
          input: { name: cryptoRandomString({ length: 6 }) }
        })

        const workspaceName = cryptoRandomString({ length: 6 })

        await apollo.execute(UpdateWorkspaceDocument, {
          input: {
            id: createRes.data!.workspaceMutations.create.id,
            name: workspaceName
          }
        })

        const getRes = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: createRes.data!.workspaceMutations.create.id
        })

        expect(createRes).to.not.haveGraphQLErrors()
        expect(getRes).to.not.haveGraphQLErrors()
        expect(getRes.data?.workspace.name).to.equal(workspaceName)
      })
    })
  })
})
