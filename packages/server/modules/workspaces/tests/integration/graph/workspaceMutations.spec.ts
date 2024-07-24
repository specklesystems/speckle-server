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
  GetWorkspaceDocument,
  UpdateWorkspaceDocument
} from '@/test/graphql/generated/graphql'
import cryptoRandomString from 'crypto-random-string'

describe('WorkspaceMutations type mutations', () => {
  let apollo: TestApolloServer

  const testUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'workspace-mutations-type-user@example.org',
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

  describe('create', () => {
    it('should create a workspace', async () => {
      const workspaceName = cryptoRandomString({ length: 6 })

      const { data: createData } = await apollo.execute(CreateWorkspaceDocument, {
        input: { name: workspaceName }
      })
      const { data: getData } = await apollo.execute(GetWorkspaceDocument, {
        workspaceId: createData!.workspaceMutations.create.id
      })

      expect(getData?.workspace).to.exist
      expect(getData?.workspace?.name).to.equal(workspaceName)
    })
  })

  describe('update', () => {
    it('should update a workspace', async () => {
      const { data: createData } = await apollo.execute(CreateWorkspaceDocument, {
        input: { name: cryptoRandomString({ length: 6 }) }
      })

      const workspaceName = cryptoRandomString({ length: 6 })

      await apollo.execute(UpdateWorkspaceDocument, {
        input: {
          id: createData!.workspaceMutations.create.id,
          name: workspaceName
        }
      })

      const { data: getData } = await apollo.execute(GetWorkspaceDocument, {
        workspaceId: createData!.workspaceMutations.create.id
      })

      expect(getData?.workspace.name).to.equal(workspaceName)
    })
  })
})
