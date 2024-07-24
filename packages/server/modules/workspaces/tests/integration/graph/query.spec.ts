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
  GetWorkspaceDocument
} from '@/test/graphql/generated/graphql'

describe('Root Query type', () => {
  let apollo: TestApolloServer

  const testUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'root-query-type-user@example.org',
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

  describe('workspace', () => {
    let workspaceId = ''

    before(async () => {
      const { data } = await apollo.execute(CreateWorkspaceDocument, {
        input: {
          name: 'Test Workspace '
        }
      })

      workspaceId = data?.workspaceMutations.create.id ?? ''
    })

    it('should return a workspace that exists', async () => {
      const { data } = await apollo.execute(GetWorkspaceDocument, { workspaceId })
      expect(data?.workspace).to.exist
    })

    it('throw a not found error if the workspace does not exist', async () => {
      const res = await apollo.execute(GetWorkspaceDocument, {
        workspaceId: cryptoRandomString({ length: 6 })
      })
      expect(res).to.haveGraphQLErrors('not found')
    })
  })
})
