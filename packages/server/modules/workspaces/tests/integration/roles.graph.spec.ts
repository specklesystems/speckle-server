import { db } from '@/db/knex'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import { grantStreamPermissionsFactory } from '@/modules/core/repositories/streams'
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
import cryptoRandomString from 'crypto-random-string'
import { isUndefined } from 'lodash'

const grantStreamPermissions = grantStreamPermissionsFactory({ db })

describe('Workspaces Roles GQL', () => {
  let apollo: TestApolloServer

  const serverAdminUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-speckle-workspace-admin@example.org',
    role: Roles.Server.Admin
  }

  const serverMemberUser: BasicTestUser = {
    id: '',
    name: 'James Speckle',
    email: 'james-speckle-workspace-member@example.org',
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
  })

  describe('single role changes in a workspace without projects', () => {
    const workspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      slug: cryptoRandomString({ length: 10 }),
      name: 'My Test Workspace'
    }

    before(async () => {
      await createTestWorkspace(workspace, serverAdminUser)
    })

    describe('update workspace role', () => {
      after(async () => {
        await apollo.execute(UpdateWorkspaceRoleDocument, {
          input: {
            userId: serverMemberUser.id,
            workspaceId: workspace.id,
            role: null
          }
        })
      })

      it('should create a role if none exists', async () => {
        const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
          input: {
            userId: serverMemberUser.id,
            workspaceId: workspace.id,
            role: Roles.Workspace.Admin
          }
        })

        const { data } = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })
        const userRole = data?.workspace.team.items.find(
          (user) => user.id === serverMemberUser.id
        )

        expect(res).to.not.haveGraphQLErrors()
        expect(userRole).to.exist
        expect(userRole?.role).to.equal(Roles.Workspace.Admin)
      })

      it('should update a role that exists', async () => {
        const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
          input: {
            userId: serverMemberUser.id,
            workspaceId: workspace.id,
            role: Roles.Workspace.Member
          }
        })

        const roles = res.data?.workspaceMutations.updateRole.team.items

        expect(res).to.not.haveGraphQLErrors()
        expect(roles?.some((role) => role.id === serverMemberUser.id)).to.be.true
      })

      it('should throw if setting an invalid role', async () => {
        const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
          input: {
            userId: serverMemberUser.id,
            workspaceId: workspace.id,
            role: 'not-a-role'
          }
        })

        expect(res).to.haveGraphQLErrors('Invalid workspace role')
      })

      it('should throw if attempting to remove last admin', async () => {
        const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
          input: {
            userId: serverAdminUser.id,
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
            userId: serverMemberUser.id,
            workspaceId: workspace.id,
            role: Roles.Workspace.Member
          }
        })
      })

      it('should delete the specified role', async () => {
        const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
          input: {
            userId: serverMemberUser.id,
            workspaceId: workspace.id,
            role: null
          }
        })

        const roles = res.data?.workspaceMutations.updateRole.team.items

        expect(res).to.not.haveGraphQLErrors()
        expect(roles?.some((role) => role.id === serverMemberUser.id)).to.be.false
      })

      it('should throw if attempting to remove last admin', async () => {
        const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
          input: {
            userId: serverAdminUser.id,
            workspaceId: workspace.id,
            role: null
          }
        })

        expect(res).to.haveGraphQLErrors('last admin')
      })
    })
  })

  describe('single role changes in a workspace with projects', () => {
    const workspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      slug: cryptoRandomString({ length: 10 }),
      name: 'Test Workspace',
      defaultProjectRole: Roles.Stream.Reviewer
    }

    const workspaceAdminUser: BasicTestUser = {
      id: '',
      name: 'John "Owner" Specke',
      email: 'john-owner-speckle@example.org'
    }

    const workspaceMemberUser: BasicTestUser = {
      id: '',
      name: 'John "Member" Speckel',
      email: 'john-member-speckle@example.org'
    }

    const workspaceGuestUser: BasicTestUser = {
      id: '',
      name: 'John "Middle Child" Speckle',
      email: 'john-guest-speckle@example.org'
    }

    const workspaceProjectA: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Project A',
      isPublic: false
    }

    const workspaceProjectB: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Project B',
      isPublic: false
    }

    const workspaceProjectC: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Project C',
      isPublic: false
    }

    const workspaceProjectD: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Project D',
      isPublic: false
    }

    const workspaceProjects = [
      workspaceProjectA,
      workspaceProjectB,
      workspaceProjectC,
      workspaceProjectD
    ]

    before(async () => {
      await createTestUsers([
        workspaceAdminUser,
        workspaceMemberUser,
        workspaceGuestUser
      ])
    })

    beforeEach(async () => {
      await createTestWorkspace(workspace, serverAdminUser)
      await Promise.all([
        assignToWorkspace(workspace, workspaceAdminUser, Roles.Workspace.Admin),
        assignToWorkspace(workspace, workspaceMemberUser, Roles.Workspace.Member),
        assignToWorkspace(workspace, workspaceGuestUser, Roles.Workspace.Guest)
      ])
      for (const project of workspaceProjects) {
        project.workspaceId = workspace.id
        await createTestStream(project, serverAdminUser)
      }

      /**
       * Initial workspace roles:
       *
       * workspaceAdminUser   Admin
       * workspaceMemberUser  Member
       * workspaceGuestUser   Guest
       *
       * Initial workspace project roles:
       *
       * |                     | Project A   | Project B   | Project C | Project D |
       * |---------------------|-------------|-------------|-----------|-----------|
       * | workspaceAdminUser  | Owner       | Owner       | Owner     | Owner     |
       * | workspaceMemberUser | Owner       | Contributor | Reviewer  | None      |
       * | workspaceGuestUser  | Contributor | Reviewer    | None      | None      |
       */

      await Promise.all([
        // A
        grantStreamPermissions({
          streamId: workspaceProjectA.id,
          userId: workspaceAdminUser.id,
          role: Roles.Stream.Owner
        }),
        grantStreamPermissions({
          streamId: workspaceProjectA.id,
          userId: workspaceMemberUser.id,
          role: Roles.Stream.Owner
        }),
        grantStreamPermissions({
          streamId: workspaceProjectA.id,
          userId: workspaceGuestUser.id,
          role: Roles.Stream.Contributor
        }),
        // B
        grantStreamPermissions({
          streamId: workspaceProjectB.id,
          userId: workspaceAdminUser.id,
          role: Roles.Stream.Owner
        }),
        grantStreamPermissions({
          streamId: workspaceProjectB.id,
          userId: workspaceMemberUser.id,
          role: Roles.Stream.Contributor
        }),
        grantStreamPermissions({
          streamId: workspaceProjectB.id,
          userId: workspaceGuestUser.id,
          role: Roles.Stream.Reviewer
        }),
        // C
        grantStreamPermissions({
          streamId: workspaceProjectC.id,
          userId: workspaceAdminUser.id,
          role: Roles.Stream.Owner
        }),
        grantStreamPermissions({
          streamId: workspaceProjectC.id,
          userId: workspaceMemberUser.id,
          role: Roles.Stream.Reviewer
        }),
        // D
        grantStreamPermissions({
          streamId: workspaceProjectD.id,
          userId: workspaceAdminUser.id,
          role: Roles.Stream.Owner
        })
      ])
    })

    afterEach(async () => {
      await truncateTables(['workspaces', 'streams'])
    })

    describe('when changing workspace admin', () => {
      describe('to workspace member', () => {
        beforeEach(async () => {
          await apollo.execute(UpdateWorkspaceRoleDocument, {
            input: {
              userId: workspaceAdminUser.id,
              workspaceId: workspace.id,
              role: Roles.Workspace.Member
            }
          })
        })

        it('should grant default project role for all workspace projects', async () => {
          const res = await apollo.execute(GetWorkspaceProjectsDocument, {
            id: workspace.id
          })

          const projects = res.data?.workspace.projects.items

          expect(res).to.not.haveGraphQLErrors()
          expect(projects).to.exist
          expect(
            projects?.every((project) => {
              const team = project.team
              const role = team.find((acl) => acl.id === workspaceAdminUser.id)
              return role?.role === Roles.Stream.Reviewer
            })
          ).to.be.true
        })
      })

      describe('to workspace guest', () => {
        beforeEach(async () => {
          await apollo.execute(UpdateWorkspaceRoleDocument, {
            input: {
              userId: workspaceAdminUser.id,
              workspaceId: workspace.id,
              role: Roles.Workspace.Guest
            }
          })
        })

        it('should drop all workspace project roles', async () => {
          const res = await apollo.execute(GetWorkspaceProjectsDocument, {
            id: workspace.id
          })

          const projects = res.data?.workspace.projects.items

          expect(res).to.not.haveGraphQLErrors()
          expect(projects).to.exist
          expect(
            projects?.every((project) => {
              const team = project.team
              const role = team.find((acl) => acl.id === workspaceAdminUser.id)
              return isUndefined(role)
            })
          ).to.be.true
        })
      })
    })

    describe('when changing workspace member', () => {
      describe('to workspace admin', () => {
        beforeEach(async () => {
          await apollo.execute(UpdateWorkspaceRoleDocument, {
            input: {
              userId: workspaceMemberUser.id,
              workspaceId: workspace.id,
              role: Roles.Workspace.Admin
            }
          })
        })

        it('should grant project owner role for all workspace projects', async () => {
          const res = await apollo.execute(GetWorkspaceProjectsDocument, {
            id: workspace.id
          })

          const projects = res.data?.workspace.projects.items

          expect(res).to.not.haveGraphQLErrors()
          expect(projects).to.exist
          expect(
            projects?.every((project) => {
              const team = project.team
              const role = team.find((acl) => acl.id === workspaceMemberUser.id)
              return role?.role === Roles.Stream.Owner
            })
          ).to.be.true
        })
      })

      describe('to workspace guest', () => {
        beforeEach(async () => {
          await apollo.execute(UpdateWorkspaceRoleDocument, {
            input: {
              userId: workspaceMemberUser.id,
              workspaceId: workspace.id,
              role: Roles.Workspace.Guest
            }
          })
        })

        it('should drop all workspace project roles', async () => {
          const res = await apollo.execute(GetWorkspaceProjectsDocument, {
            id: workspace.id
          })

          const projects = res.data?.workspace.projects.items

          expect(res).to.not.haveGraphQLErrors()
          expect(projects).to.exist
          expect(
            projects?.every((project) => {
              const team = project.team
              const role = team.find((acl) => acl.id === workspaceMemberUser.id)
              return isUndefined(role)
            })
          ).to.be.true
        })
      })
    })

    describe('when changing workspace guest', () => {
      describe('to workspace admin', () => {
        beforeEach(async () => {
          await apollo.execute(UpdateWorkspaceRoleDocument, {
            input: {
              userId: workspaceGuestUser.id,
              workspaceId: workspace.id,
              role: Roles.Workspace.Admin
            }
          })
        })

        it('should grant project owner role for all workspace projects', async () => {
          const res = await apollo.execute(GetWorkspaceProjectsDocument, {
            id: workspace.id
          })

          const projects = res.data?.workspace.projects.items

          expect(res).to.not.haveGraphQLErrors()
          expect(projects).to.exist
          expect(
            projects?.every((project) => {
              const team = project.team
              const role = team.find((acl) => acl.id === workspaceGuestUser.id)
              return role?.role === Roles.Stream.Owner
            })
          ).to.be.true
        })
      })

      describe('to workspace member', () => {
        beforeEach(async () => {
          await apollo.execute(UpdateWorkspaceRoleDocument, {
            input: {
              userId: workspaceGuestUser.id,
              workspaceId: workspace.id,
              role: Roles.Workspace.Member
            }
          })
        })

        it('should grant default project role for all workspace projects', async () => {
          const res = await apollo.execute(GetWorkspaceProjectsDocument, {
            id: workspace.id
          })

          const projects = res.data?.workspace.projects.items

          expect(res).to.not.haveGraphQLErrors()
          expect(projects).to.exist
          expect(
            projects?.every((project) => {
              const team = project.team
              const role = team.find((acl) => acl.id === workspaceGuestUser.id)
              // TODO: This is a workspace setting
              return role?.role === Roles.Stream.Reviewer
            })
          ).to.be.true
        })
      })
    })
  })

  describe('composite role changes in a workspace with projects', () => {
    let workspaceMemberApollo: TestApolloServer

    const workspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      slug: cryptoRandomString({ length: 10 }),
      name: 'Test Workspace w/ Projects'
    }

    const workspaceProject: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Test Project',
      isPublic: true
    }

    before(async () => {
      const token = await createAuthTokenForUser(serverMemberUser.id, AllScopes)
      workspaceMemberApollo = await testApolloServer({
        context: await createTestContext({
          auth: true,
          userId: serverMemberUser.id,
          token,
          role: serverMemberUser.role,
          scopes: AllScopes
        })
      })
    })

    beforeEach(async () => {
      await createTestWorkspace(workspace, serverAdminUser)
      workspaceProject.workspaceId = workspace.id
      await createTestStream(workspaceProject, serverAdminUser)
    })

    afterEach(async () => {
      await truncateTables(['workspaces', 'streams'])
    })

    describe('when leaving the workspace as the last owner of a workspace project', () => {
      // User             Workspace Role    Project Role
      // serverAdminUser    Admin             Reviewer
      // serverMemberUser   Admin             Owner
      //
      // Action: `serverMemberUser` leaves workspace

      beforeEach(async () => {
        await assignToWorkspace(workspace, serverMemberUser, Roles.Workspace.Admin)
        await grantStreamPermissions({
          streamId: workspaceProject.id,
          userId: serverAdminUser.id,
          role: Roles.Stream.Reviewer
        })
      })

      it('should throw and preserve all roles', async () => {
        const res = await workspaceMemberApollo.execute(
          ActiveUserLeaveWorkspaceDocument,
          { id: workspace.id }
        )

        const { data: workspaceTeamData } = await apollo.execute(
          GetWorkspaceTeamDocument,
          { workspaceId: workspace.id }
        )
        const { data: workspaceProjectsData } = await apollo.execute(
          GetWorkspaceProjectsDocument,
          { id: workspace.id }
        )

        const teamRoles = workspaceTeamData?.workspace.team.items
        const projectRoles = workspaceProjectsData?.workspace.projects.items[0].team

        expect(res).to.haveGraphQLErrors('Could not revoke permissions for last admin')
        expect(teamRoles).to.exist
        expect(teamRoles?.some((role) => role.id === serverMemberUser.id)).to.be.true
        expect(projectRoles).to.exist
        expect(projectRoles?.some((role) => role.id === serverMemberUser.id)).to.be.true
      })
    })

    describe('when removing a workspace member that is the last owner of a workspace project', () => {
      // User             Workspace Role    Project Role
      // serverAdminUser    Admin             Reviewer
      // serverMemberUser   Admin             Owner
      //
      // Action: `serverAdminUser` removes `serverMemberUser` from the workspace

      beforeEach(async () => {
        await assignToWorkspace(workspace, serverMemberUser, Roles.Workspace.Admin)
        await grantStreamPermissions({
          streamId: workspaceProject.id,
          userId: serverAdminUser.id,
          role: Roles.Stream.Reviewer
        })
      })

      it('should throw and preserve all roles', async () => {
        const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
          input: {
            userId: serverMemberUser.id,
            role: null,
            workspaceId: workspace.id
          }
        })

        const { data: workspaceTeamData } = await apollo.execute(
          GetWorkspaceTeamDocument,
          { workspaceId: workspace.id }
        )
        const { data: workspaceProjectsData } = await apollo.execute(
          GetWorkspaceProjectsDocument,
          { id: workspace.id }
        )

        const teamRoles = workspaceTeamData?.workspace.team.items
        const projectRoles = workspaceProjectsData?.workspace.projects.items[0].team

        expect(res).to.haveGraphQLErrors('Could not revoke permissions for last admin')
        expect(teamRoles).to.exist
        expect(teamRoles?.some((role) => role.id === serverMemberUser.id)).to.be.true
        expect(projectRoles).to.exist
        expect(projectRoles?.some((role) => role.id === serverMemberUser.id)).to.be.true
      })
    })

    describe('when leaving a workspace without any project owner roles', () => {
      // User             Workspace Role    Project Role
      // serverAdminUser    Admin             Owner
      // serverMemberUser   Member            Reviewer
      //
      // Action: `serverMemberUser` leaves workspace

      beforeEach(async () => {
        await assignToWorkspace(workspace, serverMemberUser, Roles.Workspace.Member)
        await grantStreamPermissions({
          streamId: workspaceProject.id,
          userId: serverMemberUser.id,
          role: Roles.Stream.Reviewer
        })
      })

      it('should remove all workspace and project roles for user', async () => {
        const res = await workspaceMemberApollo.execute(
          ActiveUserLeaveWorkspaceDocument,
          { id: workspace.id }
        )

        const { data: workspaceTeamData } = await apollo.execute(
          GetWorkspaceTeamDocument,
          { workspaceId: workspace.id }
        )
        const { data: workspaceProjectsData } = await apollo.execute(
          GetWorkspaceProjectsDocument,
          { id: workspace.id }
        )

        const teamRoles = workspaceTeamData?.workspace.team.items
        const projectRoles = workspaceProjectsData?.workspace.projects.items[0].team

        expect(res).to.not.haveGraphQLErrors()
        expect(teamRoles).to.exist
        expect(teamRoles?.some((role) => role.id === serverMemberUser.id)).to.be.false
        expect(projectRoles).to.exist
        expect(projectRoles?.some((role) => role.id === serverMemberUser.id)).to.be
          .false
      })
    })

    describe('when removing a workspace member that has no workspace project owner roles', () => {
      // User             Workspace Role    Project Role
      // serverAdminUser    Admin             Owner
      // serverMemberUser   Member            Reviewer
      //
      // Action: `serverAdminUser` removes `serverMemberUser` from the workspace

      beforeEach(async () => {
        await assignToWorkspace(workspace, serverMemberUser, Roles.Workspace.Member)
        await grantStreamPermissions({
          streamId: workspaceProject.id,
          userId: serverMemberUser.id,
          role: Roles.Stream.Reviewer
        })
      })

      it('should remove all workspace and project roles for removed member', async () => {
        const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
          input: {
            userId: serverMemberUser.id,
            role: null,
            workspaceId: workspace.id
          }
        })

        const { data: workspaceTeamData } = await apollo.execute(
          GetWorkspaceTeamDocument,
          { workspaceId: workspace.id }
        )
        const { data: workspaceProjectsData } = await apollo.execute(
          GetWorkspaceProjectsDocument,
          { id: workspace.id }
        )

        const teamRoles = workspaceTeamData?.workspace.team.items
        const projectRoles = workspaceProjectsData?.workspace.projects.items[0].team

        expect(res).to.not.haveGraphQLErrors()
        expect(teamRoles).to.exist
        expect(teamRoles?.some((role) => role.id === serverMemberUser.id)).to.be.false
        expect(projectRoles).to.exist
        expect(projectRoles?.some((role) => role.id === serverMemberUser.id)).to.be
          .false
      })
    })
  })
})
