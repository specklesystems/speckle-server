import { AllScopes } from '@/modules/core/helpers/mainConstants'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUser
} from '@/test/authHelper'
import {
  CreateWorkspaceDocument,
  CreateWorkspaceProjectDocument,
  GetWorkspaceProjectsDocument,
  Workspace
} from '@/test/graphql/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('Workspace project GQL CRUD', () => {
  let apollo: TestApolloServer
  let workspace: Omit<Workspace, 'projects' | 'team'>

  const testUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-speckle-workspace-project-admin@example.org',
    role: Roles.Server.Admin
  }

  const testNonWorkspaceMemberUser: BasicTestUser = {
    id: '',
    name: 'John Nobody',
    email: 'john-nobody@example.org',
    role: Roles.Server.User
  }

  before(async () => {
    await beforeEachContext()
    await Promise.all(
      [testUser, testNonWorkspaceMemberUser].map((user) => createTestUser(user))
    )
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

    const { data } = await apollo.execute(CreateWorkspaceDocument, {
      input: { name: 'My Test Workspace' }
    })

    if (!data) {
      throw new Error('Error during test setup!')
    }

    workspace = data.workspaceMutations.create
  })

  describe('when specifying a workspace id during project creation', () => {
    it('should create the project in that workspace', async () => {
      const projectName = cryptoRandomString({ length: 6 })

      const createRes = await apollo.execute(CreateWorkspaceProjectDocument, {
        input: {
          name: projectName,
          workspaceId: workspace.id
        }
      })

      const getRes = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: workspace.id
      })

      const workspaceProject = getRes.data?.workspace.projects.items.find(
        (project) => project.name === projectName
      )

      expect(createRes).to.not.haveGraphQLErrors()
      expect(getRes).to.not.haveGraphQLErrors()
      expect(workspaceProject).to.exist
    })
  })
})
