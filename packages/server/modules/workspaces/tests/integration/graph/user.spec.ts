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
import { expect } from 'chai'
import {
  CreateWorkspaceDocument,
  GetActiveUserWorkspacesDocument
} from '@/test/graphql/generated/graphql'

describe('User type queries', () => {
  let apollo: TestApolloServer

  const testUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'user-type-user@example.org',
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

  describe('workspaces', () => {
    before(async () => {
      await Promise.all(
        ['Workspace A', 'Workspace B'].map((name) =>
          apollo.execute(CreateWorkspaceDocument, { input: { name } })
        )
      )
    })

    it('should return all workspaces for a user', async () => {
      const { data } = await apollo.execute(GetActiveUserWorkspacesDocument, {})
      expect(data?.activeUser?.workspaces?.items?.length).to.equal(2)
    })
  })
})
