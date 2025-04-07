import { createTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUsers
} from '@/test/authHelper'
import {
  ActiveUserProjectsDocument,
  CreateProjectDocument,
  CreateWorkspaceProjectDocument,
  GetWorkspaceDocument
} from '@/test/graphql/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { Roles, AllScopes } from '@/modules/core/helpers/mainConstants'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { beforeEach } from 'mocha'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

describe('Projects GraphQL @core', () => {
  let apollo: TestApolloServer

  const testAdminUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-speckle@example.org',
    role: Roles.Server.Admin,
    verified: true
  }

  beforeEach(async () => {
    await beforeEachContext()
    await createTestUsers([testAdminUser])
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

  describe('query user.projects', () => {
    ;(FF_WORKSPACES_MODULE_ENABLED ? it : it.skip)(
      'should return projects not in a workspace',
      async () => {
        const workspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(workspace, testAdminUser)

        const getWorkspaceRes = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(getWorkspaceRes).to.not.haveGraphQLErrors()
        const workspaceId = getWorkspaceRes.data!.workspace.id

        const createProjectInWorkspaceRes = await apollo.execute(
          CreateWorkspaceProjectDocument,
          { input: { name: 'project', workspaceId } }
        )
        expect(createProjectInWorkspaceRes).to.not.haveGraphQLErrors()

        const createProjectNonInWorkspaceRes = await apollo.execute(
          CreateProjectDocument,
          { input: { name: 'project' } }
        )
        expect(createProjectNonInWorkspaceRes).to.not.haveGraphQLErrors()
        const projectNonInWorkspace =
          createProjectNonInWorkspaceRes.data!.projectMutations.create

        const userProjectsRes = await apollo.execute(ActiveUserProjectsDocument, {
          filter: { personalOnly: true }
        })
        expect(userProjectsRes).to.not.haveGraphQLErrors()

        const projects = userProjectsRes.data!.activeUser!.projects.items

        expect(projects).to.have.length(1)
        expect(projects[0].id).to.eq(projectNonInWorkspace.id)
      }
    )
    ;(FF_WORKSPACES_MODULE_ENABLED ? it : it.skip)(
      'should return projects in workspace',
      async () => {
        const workspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(workspace, testAdminUser)

        const getWorkspaceRes = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(getWorkspaceRes).to.not.haveGraphQLErrors()
        const workspaceId = getWorkspaceRes.data!.workspace.id

        const createProjectInWorkspaceRes = await apollo.execute(
          CreateWorkspaceProjectDocument,
          { input: { name: 'project', workspaceId } }
        )
        expect(createProjectInWorkspaceRes).to.not.haveGraphQLErrors()
        const projectInWorkspace =
          createProjectInWorkspaceRes.data!.workspaceMutations.projects.create

        const createProjectNonInWorkspaceRes = await apollo.execute(
          CreateProjectDocument,
          { input: { name: 'project' } }
        )
        expect(createProjectNonInWorkspaceRes).to.not.haveGraphQLErrors()

        const userProjectsRes = await apollo.execute(ActiveUserProjectsDocument, {
          filter: { workspaceId }
        })
        expect(userProjectsRes).to.not.haveGraphQLErrors()

        const projects = userProjectsRes.data!.activeUser!.projects.items

        expect(projects).to.have.length(1)
        expect(projects[0].id).to.eq(projectInWorkspace.id)
      }
    )
    ;(FF_WORKSPACES_MODULE_ENABLED ? it : it.skip)(
      'should return all user projects',
      async () => {
        const workspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(workspace, testAdminUser)

        const getWorkspaceRes = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(getWorkspaceRes).to.not.haveGraphQLErrors()
        const workspaceId = getWorkspaceRes.data!.workspace.id

        const createProjectInWorkspaceRes = await apollo.execute(
          CreateWorkspaceProjectDocument,
          { input: { name: 'project', workspaceId } }
        )
        expect(createProjectInWorkspaceRes).to.not.haveGraphQLErrors()

        const createProjectNonInWorkspaceRes = await apollo.execute(
          CreateProjectDocument,
          { input: { name: 'project' } }
        )
        expect(createProjectNonInWorkspaceRes).to.not.haveGraphQLErrors()

        const userProjectsRes = await apollo.execute(ActiveUserProjectsDocument, {
          filter: {}
        })
        expect(userProjectsRes).to.not.haveGraphQLErrors()

        const projects = userProjectsRes.data!.activeUser!.projects.items

        expect(projects).to.have.length(2)
      }
    )
  })
})
