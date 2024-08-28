import { AllScopes } from '@/modules/core/helpers/mainConstants'
import { grantStreamPermissions } from '@/modules/core/repositories/streams'
import {
  assignToWorkspace,
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUsers
} from '@/test/authHelper'
import {
  ActiveUserLeaveWorkspaceDocument,
  GetWorkspaceDocument,
  GetWorkspaceProjectsDocument,
  GetWorkspaceTeamDocument,
  UpdateWorkspaceRoleDocument
} from '@/test/graphql/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext, truncateTables } from '@/test/hooks'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'

describe('Workspaces Roles GQL', () => {
  let apollo: TestApolloServer

  const workspace: BasicTestWorkspace = {
    id: '',
    ownerId: '',
    name: 'My Test Workspace'
  }

  const testAdminUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-speckle-workspace-admin@example.org',
    role: Roles.Server.Admin
  }

  const testMemberUser: BasicTestUser = {
    id: '',
    name: 'James Speckle',
    email: 'james-speckle-workspace-member@example.org',
    role: Roles.Server.User
  }

  before(async () => {
    await beforeEachContext()
    await createTestUsers([testAdminUser, testMemberUser])
    const token = await createAuthTokenForUser(testAdminUser.id, AllScopes)
    apollo = await testApolloServer({
      context: createTestContext({
        auth: true,
        userId: testAdminUser.id,
        token,
        role: testAdminUser.role,
        scopes: AllScopes
      })
    })
    await createTestWorkspace(workspace, testAdminUser)
  })

  describe('update workspace role', () => {
    after(async () => {
      await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testMemberUser.id,
          workspaceId: workspace.id,
          role: null
        }
      })
    })

    it('should create a role if none exists', async () => {
      const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testMemberUser.id,
          workspaceId: workspace.id,
          role: Roles.Workspace.Admin
        }
      })

      const { data } = await apollo.execute(GetWorkspaceDocument, {
        workspaceId: workspace.id
      })
      const userRole = data?.workspace.team.items.find(
        (user) => user.id === testMemberUser.id
      )

      expect(res).to.not.haveGraphQLErrors()
      expect(userRole).to.exist
      expect(userRole?.role).to.equal(Roles.Workspace.Admin)
    })

    it('should update a role that exists', async () => {
      const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testMemberUser.id,
          workspaceId: workspace.id,
          role: Roles.Workspace.Member
        }
      })

      const roles = res.data?.workspaceMutations.updateRole.team

      expect(res).to.not.haveGraphQLErrors()
      expect(roles?.items.some((role) => role.id === testMemberUser.id)).to.be.true
    })

    it('should throw if setting an invalid role', async () => {
      const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testMemberUser.id,
          workspaceId: workspace.id,
          role: 'not-a-role'
        }
      })

      expect(res).to.haveGraphQLErrors('Invalid workspace role')
    })

    it('should throw if attempting to remove last admin', async () => {
      const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testAdminUser.id,
          workspaceId: workspace.id,
          role: Roles.Workspace.Member
        }
      })

      expect(res).to.haveGraphQLErrors('last admin')
    })
  })

  describe('delete workspace role', () => {
    before(async () => {
      await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testMemberUser.id,
          workspaceId: workspace.id,
          role: Roles.Workspace.Member
        }
      })
    })

    it('should delete the specified role', async () => {
      const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testMemberUser.id,
          workspaceId: workspace.id,
          role: null
        }
      })

      const roles = res.data?.workspaceMutations.updateRole.team

      expect(res).to.not.haveGraphQLErrors()
      expect(roles?.items.some((role) => role.id === testMemberUser.id)).to.be.false
    })

    it('should throw if attempting to remove last admin', async () => {
      const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testAdminUser.id,
          workspaceId: workspace.id,
          role: null
        }
      })

      expect(res).to.haveGraphQLErrors('last admin')
    })
  })

  describe('in a workspace with projects', () => {
    let workspaceMemberApollo: TestApolloServer

    const workspaceWithProjects: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      name: 'Test Workspace w/ Projects'
    }

    const workspaceProject: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Test Project',
      isPublic: true
    }

    before(async () => {
      const token = await createAuthTokenForUser(testMemberUser.id, AllScopes)
      workspaceMemberApollo = await testApolloServer({
        context: createTestContext({
          auth: true,
          userId: testMemberUser.id,
          token,
          role: testMemberUser.role,
          scopes: AllScopes
        })
      })
    })

    beforeEach(async () => {
      await createTestWorkspace(workspaceWithProjects, testAdminUser)
      workspaceProject.workspaceId = workspaceWithProjects.id
      await createTestStream(workspaceProject, testAdminUser)
    })

    afterEach(async () => {
      await truncateTables(['workspaces', 'streams'])
    })

    describe('when leaving the workspace as the last owner of a workspace project', () => {
      // User             Workspace Role    Project Role
      // testAdminUser    Admin             Reviewer
      // testMemberUser   Admin             Owner
      //
      // Action: `testMemberUser` leaves workspace

      beforeEach(async () => {
        await assignToWorkspace(
          workspaceWithProjects,
          testMemberUser,
          Roles.Workspace.Admin
        )
        await grantStreamPermissions({
          streamId: workspaceProject.id,
          userId: testAdminUser.id,
          role: Roles.Stream.Reviewer
        })
      })

      it('should throw and preserve all roles', async () => {
        const res = await workspaceMemberApollo.execute(
          ActiveUserLeaveWorkspaceDocument,
          { id: workspaceWithProjects.id }
        )

        const { data: workspaceTeamData } = await apollo.execute(
          GetWorkspaceTeamDocument,
          { workspaceId: workspaceWithProjects.id }
        )
        const { data: workspaceProjectsData } = await apollo.execute(
          GetWorkspaceProjectsDocument,
          { id: workspaceWithProjects.id }
        )

        const teamRoles = workspaceTeamData?.workspace.team.items
        const projectRoles = workspaceProjectsData?.workspace.projects.items[0].team

        expect(res).to.haveGraphQLErrors('Could not revoke permissions for last admin')
        expect(teamRoles).to.exist
        expect(teamRoles?.some((role) => role.id === testMemberUser.id)).to.be.true
        expect(projectRoles).to.exist
        expect(projectRoles?.some((role) => role.id === testMemberUser.id)).to.be.true
      })
    })

    describe('when removing a workspace member that is the last owner of a workspace project', () => {
      // User             Workspace Role    Project Role
      // testAdminUser    Admin             Reviewer
      // testMemberUser   Admin             Owner
      //
      // Action: `testAdminUser` removes `testMemberUser` from the workspace

      beforeEach(async () => {
        await assignToWorkspace(
          workspaceWithProjects,
          testMemberUser,
          Roles.Workspace.Admin
        )
        await grantStreamPermissions({
          streamId: workspaceProject.id,
          userId: testAdminUser.id,
          role: Roles.Stream.Reviewer
        })
      })

      it('should throw and preserve all roles', async () => {
        const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
          input: {
            userId: testMemberUser.id,
            role: null,
            workspaceId: workspaceWithProjects.id
          }
        })

        const { data: workspaceTeamData } = await apollo.execute(
          GetWorkspaceTeamDocument,
          { workspaceId: workspaceWithProjects.id }
        )
        const { data: workspaceProjectsData } = await apollo.execute(
          GetWorkspaceProjectsDocument,
          { id: workspaceWithProjects.id }
        )

        const teamRoles = workspaceTeamData?.workspace.team.items
        const projectRoles = workspaceProjectsData?.workspace.projects.items[0].team

        expect(res).to.haveGraphQLErrors('Could not revoke permissions for last admin')
        expect(teamRoles).to.exist
        expect(teamRoles?.some((role) => role.id === testMemberUser.id)).to.be.true
        expect(projectRoles).to.exist
        expect(projectRoles?.some((role) => role.id === testMemberUser.id)).to.be.true
      })
    })

    describe('when leaving a workspace without any project owner roles', () => {
      // User             Workspace Role    Project Role
      // testAdminUser    Admin             Owner
      // testMemberUser   Member            Reviewer
      //
      // Action: `testMemberUser` leaves workspace

      beforeEach(async () => {
        await assignToWorkspace(
          workspaceWithProjects,
          testMemberUser,
          Roles.Workspace.Member
        )
        await grantStreamPermissions({
          streamId: workspaceProject.id,
          userId: testMemberUser.id,
          role: Roles.Stream.Reviewer
        })
      })

      it('should remove all workspace and project roles for user', async () => {
        const res = await workspaceMemberApollo.execute(
          ActiveUserLeaveWorkspaceDocument,
          { id: workspaceWithProjects.id }
        )

        const { data: workspaceTeamData } = await apollo.execute(
          GetWorkspaceTeamDocument,
          { workspaceId: workspaceWithProjects.id }
        )
        const { data: workspaceProjectsData } = await apollo.execute(
          GetWorkspaceProjectsDocument,
          { id: workspaceWithProjects.id }
        )

        const teamRoles = workspaceTeamData?.workspace.team.items
        const projectRoles = workspaceProjectsData?.workspace.projects.items[0].team

        expect(res).to.not.haveGraphQLErrors()
        expect(teamRoles).to.exist
        expect(teamRoles?.some((role) => role.id === testMemberUser.id)).to.be.false
        expect(projectRoles).to.exist
        expect(projectRoles?.some((role) => role.id === testMemberUser.id)).to.be.false
      })
    })

    describe('when removing a workspace member that has no workspace project owner roles', () => {
      // User             Workspace Role    Project Role
      // testAdminUser    Admin             Owner
      // testMemberUser   Member            Reviewer
      //
      // Action: `testAdminUser` removes `testMemberUser` from the workspace

      beforeEach(async () => {
        await assignToWorkspace(
          workspaceWithProjects,
          testMemberUser,
          Roles.Workspace.Member
        )
        await grantStreamPermissions({
          streamId: workspaceProject.id,
          userId: testMemberUser.id,
          role: Roles.Stream.Reviewer
        })
      })

      it('should remove all workspace and project roles for removed member', async () => {
        const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
          input: {
            userId: testMemberUser.id,
            role: null,
            workspaceId: workspaceWithProjects.id
          }
        })

        const { data: workspaceTeamData } = await apollo.execute(
          GetWorkspaceTeamDocument,
          { workspaceId: workspaceWithProjects.id }
        )
        const { data: workspaceProjectsData } = await apollo.execute(
          GetWorkspaceProjectsDocument,
          { id: workspaceWithProjects.id }
        )

        const teamRoles = workspaceTeamData?.workspace.team.items
        const projectRoles = workspaceProjectsData?.workspace.projects.items[0].team

        expect(res).to.not.haveGraphQLErrors()
        expect(teamRoles).to.exist
        expect(teamRoles?.some((role) => role.id === testMemberUser.id)).to.be.false
        expect(projectRoles).to.exist
        expect(projectRoles?.some((role) => role.id === testMemberUser.id)).to.be.false
      })
    })
  })
})
