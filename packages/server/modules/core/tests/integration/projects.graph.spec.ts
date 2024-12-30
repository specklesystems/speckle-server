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
import { AllScopes, Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { beforeEach } from 'mocha'

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
    it('should return projects with workspaceId=null', async () => {
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
        filter: { workspaceId: null }
      })
      expect(userProjectsRes).to.not.haveGraphQLErrors()

      const nonWorkspaceProjects = userProjectsRes.data!.activeUser!.projects.items

      expect(nonWorkspaceProjects).to.have.length(1)
      expect(nonWorkspaceProjects[0].id).to.eq(projectNonInWorkspace.id)
    })
    it('should return projects in workspace', async () => {
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

      const nonWorkspaceProjects = userProjectsRes.data!.activeUser!.projects.items

      expect(nonWorkspaceProjects).to.have.length(1)
      expect(nonWorkspaceProjects[0].id).to.eq(projectInWorkspace.id)
    })
    it('should return all user projects', async () => {
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

      const nonWorkspaceProjects = userProjectsRes.data!.activeUser!.projects.items

      expect(nonWorkspaceProjects).to.have.length(2)
    })
  })
})
