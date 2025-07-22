import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import {
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  CreateEmbedTokenDocument,
  GetActiveUserDocument,
  GetProjectDocument,
  GetWorkspaceDocument
} from '@/modules/core/graph/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { Roles, Scopes } from '@speckle/shared'
import { expect } from 'chai'

describe('Embed tokens', () => {
  const adminUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: createRandomEmail(),
    password: createRandomPassword()
  }

  const workspace: BasicTestWorkspace = {
    id: '',
    ownerId: '',
    name: 'My Workspace',
    slug: ''
  }

  const projectA: BasicTestStream = {
    id: '',
    ownerId: '',
    name: 'My Project'
  }
  const projectB: BasicTestStream = {
    id: '',
    ownerId: '',
    name: 'My Project 2'
  }

  let apollo: TestApolloServer

  before(async () => {
    await createTestUser(adminUser)

    await createTestWorkspace(workspace, adminUser)

    projectA.workspaceId = workspace.id
    projectB.workspaceId = workspace.id

    await createTestStream(projectA, adminUser)
    await createTestStream(projectB, adminUser)

    const adminApollo = await testApolloServer({
      context: await createTestContext({
        auth: true,
        userId: adminUser.id,
        role: Roles.Server.Admin,
        scopes: AllScopes,
        token: 'abc'
      })
    })

    const res = await adminApollo.execute(CreateEmbedTokenDocument, {
      token: {
        projectId: projectA.id,
        resourceIdString: 'foo123'
      }
    })
    const token = res.data!.projectMutations.createEmbedToken.token

    apollo = await testApolloServer({
      context: await createTestContext({
        auth: true,
        userId: adminUser.id,
        role: Roles.Server.Admin,
        scopes: [Scopes.Streams.Read],
        resourceAccessRules: [
          { id: projectA.id, type: TokenResourceIdentifierType.Project }
        ],
        token
      })
    })
  })

  it('can read associated project data', async () => {
    const res = await apollo.execute(GetProjectDocument, { id: projectA.id })
    expect(res).to.not.haveGraphQLErrors()
    expect(res.data?.project.name).to.equal(projectA.name)
  })

  it('cannot read other project data, even if the source user has access', async () => {
    const res = await apollo.execute(GetProjectDocument, { id: projectB.id })
    expect(res).to.haveGraphQLErrors()
  })

  it('cannot access source user profile', async () => {
    const res = await apollo.execute(GetActiveUserDocument, {})
    expect(res).to.haveGraphQLErrors()
  })

  it('cannot access workspace data', async () => {
    const res = await apollo.execute(GetWorkspaceDocument, {
      workspaceId: workspace.id
    })
    expect(res).to.haveGraphQLErrors()
  })
})
