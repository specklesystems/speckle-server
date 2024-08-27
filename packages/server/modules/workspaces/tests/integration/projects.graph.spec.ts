import { AllScopes } from '@/modules/core/helpers/mainConstants'
import {
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUsers
} from '@/test/authHelper'
import {
  ActiveUserProjectsWorkspaceDocument,
  CreateWorkspaceProjectDocument,
  GetWorkspaceProjectsDocument
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

  const workspace: BasicTestWorkspace = {
    id: '',
    ownerId: '',
    name: 'My Test Workspace'
  }

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
    await createTestUsers([testUser, testNonWorkspaceMemberUser])
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

    await createTestWorkspace(workspace, testUser)

    const workspaceProjects = [
      { name: 'Workspace Project A', workspaceId: workspace.id },
      { name: 'Workspace Project B', workspaceId: workspace.id },
      { name: 'Workspace Project C', workspaceId: workspace.id }
    ]

    await Promise.all(
      workspaceProjects.map((input) =>
        apollo.execute(CreateWorkspaceProjectDocument, { input })
      )
    )
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

  describe('when querying workspace projects', () => {
    it('should return multiple projects', async () => {
      const res = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: workspace.id
      })

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.workspace.projects.items.length).to.be.greaterThanOrEqual(3)
    })

    it('should respect limits', async () => {
      const res = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: workspace.id,
        limit: 1
      })

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.workspace.projects.items.length).to.equal(1)
    })

    it('should respect pagination', async () => {
      const resA = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: workspace.id,
        limit: 10
      })

      const resB = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: workspace.id,
        limit: 10,
        cursor: resA.data?.workspace.projects.cursor
      })

      const projectA = resA.data?.workspace.projects.items[0]
      const projectB = resB.data?.workspace.projects.items[0]

      expect(resA).to.not.haveGraphQLErrors()
      expect(resB).to.not.haveGraphQLErrors()
      expect(projectA).to.exist
      expect(projectB).to.not.exist
      expect(projectA?.name).to.not.equal(projectB?.name)
    })

    it('should respect search filters', async () => {
      const res = await apollo.execute(GetWorkspaceProjectsDocument, {
        id: workspace.id,
        limit: 1,
        filter: {
          search: 'Workspace Project B'
        }
      })

      const project = res.data?.workspace.projects.items[0]

      expect(res).to.not.haveGraphQLErrors()
      expect(project).to.exist
      expect(project?.name).to.equal('Workspace Project B')
    })

    it('should return workspace info on project types', async () => {
      const res = await apollo.execute(ActiveUserProjectsWorkspaceDocument, {})

      const projects = res.data?.activeUser?.projects.items

      expect(res).to.not.haveGraphQLErrors()
      expect(projects).to.exist
      expect(projects?.every((project) => project?.workspace?.id === workspace.id)).to
        .be.true
    })
  })
})
