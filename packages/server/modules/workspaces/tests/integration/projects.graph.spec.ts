import { db } from '@/db/knex'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import { grantStreamPermissionsFactory } from '@/modules/core/repositories/streams'
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
  GetWorkspaceProjectsDocument,
  GetWorkspaceTeamDocument,
  MoveProjectToWorkspaceDocument
} from '@/test/graphql/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

const grantStreamPermissions = grantStreamPermissionsFactory({ db })

describe('Workspace project GQL CRUD', () => {
  let apollo: TestApolloServer

  const workspace: BasicTestWorkspace = {
    id: '',
    ownerId: '',
    slug: cryptoRandomString({ length: 10 }),
    name: 'My Test Workspace'
  }

  const serverAdminUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-speckle-workspace-project-admin@example.org',
    role: Roles.Server.Admin
  }

  const serverMemberUser: BasicTestUser = {
    id: '',
    name: 'John Nobody',
    email: 'john-nobody@example.org',
    role: Roles.Server.User
  }

  before(async () => {
    await beforeEachContext()
    await createTestUsers([serverAdminUser, serverMemberUser])
    const token = await createAuthTokenForUser(serverAdminUser.id, AllScopes)
    apollo = await testApolloServer({
      context: await createTestContext({
        auth: true,
        userId: serverAdminUser.id,
        token,
        role: serverAdminUser.role,
        scopes: AllScopes
      })
    })

    await createTestWorkspace(workspace, serverAdminUser)

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

  describe('when moving a project to a workspace', () => {
    const testProject: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Test Project',
      isPublic: false
    }

    const targetWorkspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      slug: cryptoRandomString({ length: 10 }),
      name: 'Target Workspace'
    }

    before(async () => {
      await createTestWorkspace(targetWorkspace, serverAdminUser)
    })

    beforeEach(async () => {
      await createTestStream(testProject, serverAdminUser)
      await grantStreamPermissions({
        streamId: testProject.id,
        userId: serverMemberUser.id,
        role: Roles.Stream.Contributor
      })
    })

    it('should move the project to the target workspace', async () => {
      const res = await apollo.execute(MoveProjectToWorkspaceDocument, {
        projectId: testProject.id,
        workspaceId: targetWorkspace.id
      })

      const { workspaceId } =
        res.data?.workspaceMutations.projects.moveToWorkspace ?? {}

      expect(res).to.not.haveGraphQLErrors()
      expect(workspaceId).to.equal(targetWorkspace.id)
    })

    it('should preserve project roles for project members', async () => {
      const res = await apollo.execute(MoveProjectToWorkspaceDocument, {
        projectId: testProject.id,
        workspaceId: targetWorkspace.id
      })

      const { team } = res.data?.workspaceMutations.projects.moveToWorkspace ?? {}

      const adminProjectRole = team?.find((role) => role.id === serverAdminUser.id)
      const memberProjectRole = team?.find((role) => role.id === serverMemberUser.id)

      expect(res).to.not.haveGraphQLErrors()
      expect(adminProjectRole?.role).to.equal(Roles.Stream.Owner)
      expect(memberProjectRole?.role).to.equal(Roles.Stream.Contributor)
    })

    it('should grant workspace roles to project members that are not already in the target workspace', async () => {
      const resA = await apollo.execute(MoveProjectToWorkspaceDocument, {
        projectId: testProject.id,
        workspaceId: targetWorkspace.id
      })
      const resB = await apollo.execute(GetWorkspaceTeamDocument, {
        workspaceId: targetWorkspace.id
      })

      const memberWorkspaceRole = resB.data?.workspace.team.items.find(
        (role) => role.id === serverMemberUser.id
      )

      expect(resA).to.not.haveGraphQLErrors()
      expect(resB).to.not.haveGraphQLErrors()
      expect(memberWorkspaceRole?.role).to.equal(Roles.Workspace.Member)
    })

    it('should preserve workspace roles for project members that are already in the target workspace', async () => {
      const resA = await apollo.execute(MoveProjectToWorkspaceDocument, {
        projectId: testProject.id,
        workspaceId: targetWorkspace.id
      })
      const resB = await apollo.execute(GetWorkspaceTeamDocument, {
        workspaceId: targetWorkspace.id
      })

      const adminWorkspaceRole = resB.data?.workspace.team.items.find(
        (role) => role.id === serverAdminUser.id
      )

      expect(resA).to.not.haveGraphQLErrors()
      expect(resB).to.not.haveGraphQLErrors()
      expect(adminWorkspaceRole?.role).to.equal(Roles.Workspace.Admin)
    })
  })
})
