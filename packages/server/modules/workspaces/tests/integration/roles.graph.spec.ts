import { Streams } from '@/modules/core/dbSchema'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import {
  assignToWorkspace,
  BasicTestWorkspace,
  createTestWorkspace,
  unassignFromWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import {
  ProjectImplicitRoleCheck,
  projectImplicitRoleCheck
} from '@/modules/workspaces/tests/helpers/rolesGraphql'
import { WorkspaceSeatType } from '@/modules/workspacesCore/domain/types'
import {
  WorkspaceAcl,
  Workspaces,
  WorkspaceSeats
} from '@/modules/workspacesCore/helpers/db'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUsers
} from '@/test/authHelper'
import {
  ActiveUserLeaveWorkspaceDocument,
  GetUserProjectsWithAccessChecksDocument,
  GetUserWorkspaceAccessDocument,
  GetUserWorkspaceProjectsWithAccessChecksDocument,
  GetWorkspaceDocument,
  UpdateWorkspaceRoleDocument,
  UpdateWorkspaceSeatTypeDocument
} from '@/modules/core/graph/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext, truncateTables } from '@/test/hooks'
import {
  addToStream,
  BasicTestStream,
  createTestStream
} from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('Workspaces Roles/Seats GQL', () => {
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

  const getWorkspaceProjects = async (params: {
    user: BasicTestUser
    workspace: BasicTestWorkspace
  }) => {
    const res = await apollo.execute(
      GetUserWorkspaceProjectsWithAccessChecksDocument,
      {
        id: params.workspace.id
      },
      { authUserId: params.user.id, assertNoErrors: true }
    )

    const projects = res.data?.workspace.projects.items || []
    expect(res.data?.workspace, 'Could not retrieve workspace for user').to.be.ok

    return {
      projects,
      workspace: res.data!.workspace,
      checkProject: (project: BasicTestStream) => {
        return projectImplicitRoleCheck(projects.find((p) => p.id === project.id))
      },
      checkAllProjects: (check: (project: ProjectImplicitRoleCheck) => boolean) => {
        return projects.map(projectImplicitRoleCheck).every(check)
      }
    }
  }

  const getUserProjects = async (params: { user: BasicTestUser }) => {
    const res = await apollo.execute(
      GetUserProjectsWithAccessChecksDocument,
      {
        filter: {
          includeImplicitAccess: true
        }
      },
      { authUserId: params.user.id, assertNoErrors: true }
    )

    const projects = res.data?.activeUser?.projects.items || []

    return {
      projects,
      checkProject: (project: BasicTestStream) => {
        return projectImplicitRoleCheck(projects.find((p) => p.id === project.id))
      },
      checkAllProjects: (check: (project: ProjectImplicitRoleCheck) => boolean) => {
        return projects.map(projectImplicitRoleCheck).every(check)
      }
    }
  }

  const getUserWorkspace = async (params: {
    user: BasicTestUser
    workspace: BasicTestWorkspace
  }) => {
    const res = await apollo.execute(
      GetUserWorkspaceAccessDocument,
      {
        id: params.workspace.id
      },
      { authUserId: params.user.id }
    )
    const workspace = res.data?.workspace

    return {
      workspace
    }
  }

  describe('single role changes in a workspace without projects', () => {
    const workspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      slug: cryptoRandomString({ length: 10 }),
      name: 'My Test Workspace'
    }

    before(async () => {
      await createTestWorkspace(workspace, serverAdminUser, {
        addPlan: {
          name: 'team',
          status: 'valid'
        }
      })
    })

    describe('update workspace role', () => {
      after(async () => {
        await apollo.execute(
          UpdateWorkspaceRoleDocument,
          {
            input: {
              userId: serverMemberUser.id,
              workspaceId: workspace.id,
              role: null
            }
          },
          { assertNoErrors: true }
        )
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
        await apollo.execute(
          UpdateWorkspaceRoleDocument,
          {
            input: {
              userId: serverMemberUser.id,
              workspaceId: workspace.id,
              role: Roles.Workspace.Member
            }
          },
          { assertNoErrors: true }
        )
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

  describe('in a workspace with projects', () => {
    const workspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      slug: cryptoRandomString({ length: 10 }),
      name: 'Test Workspace'
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

    const workspaceMemberViewerUser: BasicTestUser = {
      id: '',
      name: 'John "Member" Viewer Speckel',
      email: 'john-member-speckle-viewer@example.org'
    }

    const workspaceGuestViewerUser: BasicTestUser = {
      id: '',
      name: 'John "Middle Child" Viewer Speckle',
      email: 'john-guest-speckle-viewer@example.org'
    }

    const workspaceProjectA: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Project A',
      visibility: ProjectRecordVisibility.Workspace
    }

    const workspaceProjectB: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Project B',
      visibility: ProjectRecordVisibility.Workspace
    }

    const workspaceProjectC: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Project C',
      visibility: ProjectRecordVisibility.Workspace
    }

    const workspaceProjectD: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Project D',
      visibility: ProjectRecordVisibility.Workspace
    }

    const workspaceProjectE: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Project E (Fully private)',
      visibility: ProjectRecordVisibility.Private
    }

    const workspaceProjects = [
      workspaceProjectA,
      workspaceProjectB,
      workspaceProjectC,
      workspaceProjectD,
      workspaceProjectE
    ]

    before(async () => {
      await createTestUsers([
        workspaceAdminUser,
        workspaceMemberUser,
        workspaceGuestUser,
        workspaceMemberViewerUser,
        workspaceGuestViewerUser
      ])
    })

    beforeEach(async () => {
      await createTestWorkspace(workspace, serverAdminUser, {
        addPlan: {
          name: 'team',
          status: 'valid'
        }
      })

      await Promise.all([
        assignToWorkspace(
          workspace,
          workspaceAdminUser,
          Roles.Workspace.Admin,
          WorkspaceSeatType.Editor
        ),
        assignToWorkspace(
          workspace,
          workspaceMemberUser,
          Roles.Workspace.Member,
          WorkspaceSeatType.Editor
        ),
        assignToWorkspace(
          workspace,
          workspaceGuestUser,
          Roles.Workspace.Guest,
          WorkspaceSeatType.Editor
        ),
        assignToWorkspace(
          workspace,
          workspaceMemberViewerUser,
          Roles.Workspace.Member,
          WorkspaceSeatType.Viewer
        ),
        assignToWorkspace(
          workspace,
          workspaceGuestViewerUser,
          Roles.Workspace.Guest,
          WorkspaceSeatType.Viewer
        )
      ])

      for (const project of workspaceProjects) {
        project.workspaceId = workspace.id
        await createTestStream(project, serverAdminUser)
      }

      /**
       * Initial workspace roles:
       *
       * workspaceAdminUser   Admin (Editor)
       * workspaceMemberUser  Member (Editor)
       * workspaceGuestUser   Guest (Editor)
       * workspaceMemberViewerUser  Member (Viewer)
       * workspaceGuestViewerUser   Guest (Viewer)
       *
       * Initial explicit workspace project roles:
       *
       * |                           | Project A   | Project B   | Project C | Project D | Project E (private) |
       * |---------------------------|-------------|-------------|-----------|-----------|---------------------|
       * | workspaceAdminUser        | Owner       | None        | None      | None      | None
       * | workspaceMemberUser       | Owner       | Contributor | Reviewer  | None      | None
       * | workspaceGuestUser        | Contributor | Reviewer    | None      | None      | Reviewer
       * | workspaceMemberViewerUser | Reviewer    | None        | None      | None      | Reviewer
       * | workspaceGuestViewerUser  | None        | Reviewer    | None      | None      | Reviewer
       */

      await Promise.all([
        // A
        addToStream(workspaceProjectA, workspaceAdminUser, Roles.Stream.Owner),
        addToStream(workspaceProjectA, workspaceMemberUser, Roles.Stream.Owner),
        addToStream(workspaceProjectA, workspaceGuestUser, Roles.Stream.Contributor),
        addToStream(
          workspaceProjectA,
          workspaceMemberViewerUser,
          Roles.Stream.Reviewer
        ),
        // B
        addToStream(workspaceProjectB, workspaceMemberUser, Roles.Stream.Contributor),
        addToStream(workspaceProjectB, workspaceGuestUser, Roles.Stream.Reviewer),
        addToStream(workspaceProjectB, workspaceGuestViewerUser, Roles.Stream.Reviewer),
        // C
        addToStream(workspaceProjectC, workspaceMemberUser, Roles.Stream.Reviewer),
        // E
        addToStream(workspaceProjectE, workspaceGuestUser, Roles.Stream.Reviewer),
        addToStream(
          workspaceProjectE,
          workspaceMemberViewerUser,
          Roles.Stream.Reviewer
        ),
        addToStream(workspaceProjectE, workspaceGuestViewerUser, Roles.Stream.Reviewer)
      ])
    })

    afterEach(async () => {
      await truncateTables([
        Workspaces.name,
        Streams.name,
        WorkspaceAcl.name,
        WorkspaceSeats.name
      ])
    })

    const getProjects = async (params: { user: BasicTestUser }) =>
      getWorkspaceProjects({ user: params.user, workspace })

    describe('retrieving projects', () => {
      it('workspaceAdminUser is implicit owner of all of them and explicit owner in one', async () => {
        const { projects, checkProject, checkAllProjects } = await getProjects({
          user: workspaceAdminUser
        })

        expect(projects.length).to.eq(5)
        expect(checkAllProjects((p) => p.isOwner)).to.be.ok
        expect(checkProject(workspaceProjectA).isExplicitOwner).to.be.ok
        expect(checkProject(workspaceProjectB).hasExplicitRole).to.be.not.ok
        expect(checkProject(workspaceProjectC).hasExplicitRole).to.be.not.ok
        expect(checkProject(workspaceProjectD).hasExplicitRole).to.be.not.ok
        expect(checkProject(workspaceProjectE).hasExplicitRole).to.be.not.ok
      })

      it('workspaceMemberUser is implicit reviewer in all of them, except E, and also has explicit roles in some', async () => {
        const { projects, checkAllProjects, checkProject } = await getProjects({
          user: workspaceMemberUser
        })

        expect(projects.length).to.eq(4)
        expect(checkAllProjects((p) => p.isReviewer)).to.be.ok
        expect(checkProject(workspaceProjectA).isExplicitOwner).to.be.ok
        expect(checkProject(workspaceProjectB).isExplicitContributor).to.be.ok
        expect(checkProject(workspaceProjectC).isExplicitReviewer).to.be.ok
        expect(checkProject(workspaceProjectD).hasExplicitRole).to.be.not.ok
        expect(checkProject(workspaceProjectE).hasAccess).to.be.not.ok
      })

      it('workspaceGuestUser only has explicit roles in 3 projects', async () => {
        const { projects, checkProject } = await getProjects({
          user: workspaceGuestUser
        })

        expect(projects.length).to.eq(3)
        expect(checkProject(workspaceProjectA).isExplicitContributor).to.be.ok
        expect(checkProject(workspaceProjectB).isExplicitReviewer).to.be.ok
        expect(checkProject(workspaceProjectC).hasAccess).to.be.not.ok
        expect(checkProject(workspaceProjectD).hasAccess).to.be.not.ok
        expect(checkProject(workspaceProjectE).isExplicitReviewer).to.be.ok
      })

      it('workspaceMemberViewerUser is only explicit reviewer in 2 projects, and has implicit roles elsewhere', async () => {
        const { projects, checkAllProjects, checkProject } = await getProjects({
          user: workspaceMemberViewerUser
        })
        expect(projects.length).to.eq(5)
        expect(checkAllProjects((p) => p.isReviewer)).to.be.ok
        expect(checkProject(workspaceProjectA).isExplicitReviewer).to.be.ok
        expect(checkProject(workspaceProjectB).hasExplicitRole).to.be.not.ok
        expect(checkProject(workspaceProjectC).hasExplicitRole).to.be.not.ok
        expect(checkProject(workspaceProjectD).hasExplicitRole).to.be.not.ok
        expect(checkProject(workspaceProjectE).isExplicitReviewer).to.be.ok
      })

      it('workspaceGuestViewerUser is only explicit reviewer in 2 projects', async () => {
        const { projects, checkProject } = await getProjects({
          user: workspaceGuestViewerUser
        })

        expect(projects.length).to.eq(2)
        expect(checkProject(workspaceProjectB).isExplicitReviewer).to.be.ok
        expect(checkProject(workspaceProjectA).hasExplicitRole).to.be.not.ok
        expect(checkProject(workspaceProjectC).hasExplicitRole).to.be.not.ok
        expect(checkProject(workspaceProjectD).hasExplicitRole).to.be.not.ok
        expect(checkProject(workspaceProjectE).isExplicitReviewer).to.be.ok
      })
    })

    describe('doing single seat type changes', () => {
      it('cant change workspace admin to viewer', async () => {
        const res = await apollo.execute(UpdateWorkspaceSeatTypeDocument, {
          input: {
            userId: workspaceAdminUser.id,
            workspaceId: workspace.id,
            seatType: WorkspaceSeatType.Viewer
          }
        })

        expect(res).to.haveGraphQLErrors('cannot have a seat of type')
      })

      it('changing member editor to viewer, should downgrade all explicit roles to reviewer', async () => {
        await apollo.execute(
          UpdateWorkspaceSeatTypeDocument,
          {
            input: {
              userId: workspaceMemberUser.id,
              workspaceId: workspace.id,
              seatType: WorkspaceSeatType.Viewer
            }
          },
          { assertNoErrors: true }
        )

        const { projects, checkProject } = await getProjects({
          user: workspaceMemberUser
        })

        expect(projects.length).to.eq(4)
        expect(checkProject(workspaceProjectA).isExplicitReviewer).to.be.ok
        expect(checkProject(workspaceProjectB).isExplicitReviewer).to.be.ok
        expect(checkProject(workspaceProjectC).isExplicitReviewer).to.be.ok
        expect(checkProject(workspaceProjectD).hasExplicitRole).to.be.not.ok
      })

      it('changing guest editor to viewer, should downgrade all explicit roles to reviewer', async () => {
        await apollo.execute(
          UpdateWorkspaceSeatTypeDocument,
          {
            input: {
              userId: workspaceGuestUser.id,
              workspaceId: workspace.id,
              seatType: WorkspaceSeatType.Viewer
            }
          },
          { assertNoErrors: true }
        )

        const { projects, checkProject } = await getProjects({
          user: workspaceGuestUser
        })

        expect(projects.length).to.eq(3)
        expect(checkProject(workspaceProjectA).isExplicitReviewer).to.be.ok
        expect(checkProject(workspaceProjectB).isExplicitReviewer).to.be.ok
        expect(checkProject(workspaceProjectE).isExplicitReviewer).to.be.ok
      })
    })

    describe('doing single role changes', () => {
      describe('when changing workspace admin', () => {
        describe('to workspace member', () => {
          beforeEach(async () => {
            await apollo.execute(
              UpdateWorkspaceRoleDocument,
              {
                input: {
                  userId: workspaceAdminUser.id,
                  workspaceId: workspace.id,
                  role: Roles.Workspace.Member
                }
              },
              { assertNoErrors: true }
            )
          })

          it('should still remain explicit owner and be implicit reviewer elsewhere, except private E', async () => {
            const { projects, checkAllProjects, checkProject } = await getProjects({
              user: workspaceAdminUser
            })

            expect(projects.length).to.eq(4)
            expect(checkAllProjects((p) => p.isReviewer)).to.be.ok
            expect(checkProject(workspaceProjectA).isExplicitOwner).to.be.ok
            expect(checkProject(workspaceProjectB).hasExplicitRole).to.be.not.ok
            expect(checkProject(workspaceProjectC).hasExplicitRole).to.be.not.ok
            expect(checkProject(workspaceProjectD).hasExplicitRole).to.be.not.ok
            expect(checkProject(workspaceProjectE).hasAccess).to.be.not.ok
          })
        })

        describe('to workspace guest', () => {
          beforeEach(async () => {
            await apollo.execute(
              UpdateWorkspaceRoleDocument,
              {
                input: {
                  userId: workspaceAdminUser.id,
                  workspaceId: workspace.id,
                  role: Roles.Workspace.Guest
                }
              },
              { assertNoErrors: true }
            )
          })

          it('should only have 1 project access, and not owner, but contributor', async () => {
            const { projects, checkProject } = await getProjects({
              user: workspaceAdminUser
            })

            expect(projects.length).to.eq(1)
            expect(checkProject(workspaceProjectA).isOwner).to.not.be.ok
            expect(checkProject(workspaceProjectA).isExplicitContributor).to.be.ok
            expect(checkProject(workspaceProjectB).hasExplicitRole).to.be.not.ok
            expect(checkProject(workspaceProjectC).hasExplicitRole).to.be.not.ok
            expect(checkProject(workspaceProjectD).hasExplicitRole).to.be.not.ok
          })
        })
      })

      describe('when changing workspace member', () => {
        describe('to workspace admin', () => {
          beforeEach(async () => {
            await apollo.execute(
              UpdateWorkspaceRoleDocument,
              {
                input: {
                  userId: workspaceMemberUser.id,
                  workspaceId: workspace.id,
                  role: Roles.Workspace.Admin
                }
              },
              { assertNoErrors: true }
            )
          })

          it('should get implicit owner role everywhere and explicit upgraded to owner', async () => {
            const { projects, checkProject, checkAllProjects } = await getProjects({
              user: workspaceMemberUser
            })

            expect(projects.length).to.eq(5)
            expect(checkAllProjects((p) => p.isOwner)).to.be.ok
            expect(checkProject(workspaceProjectA).isExplicitOwner).to.be.ok
            expect(checkProject(workspaceProjectB).isExplicitOwner).to.be.ok
            expect(checkProject(workspaceProjectC).isExplicitOwner).to.be.ok
            expect(checkProject(workspaceProjectD).hasExplicitRole).to.not.be.ok
            expect(checkProject(workspaceProjectE).hasExplicitRole).to.not.be.ok
          })
        })

        describe('to workspace guest', () => {
          beforeEach(async () => {
            await apollo.execute(
              UpdateWorkspaceRoleDocument,
              {
                input: {
                  userId: workspaceMemberUser.id,
                  workspaceId: workspace.id,
                  role: Roles.Workspace.Guest
                }
              },
              { assertNoErrors: true }
            )
          })

          it('no implicit access and all explicit downgraded to contributor or less', async () => {
            const { projects, checkProject } = await getProjects({
              user: workspaceMemberUser
            })

            expect(projects.length).to.eq(3)
            expect(checkProject(workspaceProjectA).isExplicitContributor).to.be.ok
            expect(checkProject(workspaceProjectB).isExplicitContributor).to.be.ok
            expect(checkProject(workspaceProjectC).isExplicitReviewer).to.be.ok
            expect(checkProject(workspaceProjectD).hasExplicitRole).to.be.not.ok
            expect(checkProject(workspaceProjectE).hasExplicitRole).to.be.not.ok
          })
        })
      })

      describe('when changing workspace guest', () => {
        describe('to workspace admin', () => {
          beforeEach(async () => {
            await apollo.execute(
              UpdateWorkspaceRoleDocument,
              {
                input: {
                  userId: workspaceGuestUser.id,
                  workspaceId: workspace.id,
                  role: Roles.Workspace.Admin
                }
              },
              { assertNoErrors: true }
            )
          })

          it('should upgrade explicit role to owner, and have implicit owner everywhere', async () => {
            const { projects, checkProject, checkAllProjects } = await getProjects({
              user: workspaceGuestUser
            })

            expect(projects.length).to.eq(5)
            expect(checkAllProjects((p) => p.isOwner)).to.be.ok
            expect(checkProject(workspaceProjectA).isExplicitOwner).to.be.ok
            expect(checkProject(workspaceProjectB).isExplicitOwner).to.be.ok
            expect(checkProject(workspaceProjectC).hasExplicitRole).to.not.be.ok
            expect(checkProject(workspaceProjectD).hasExplicitRole).to.be.not.ok
            expect(checkProject(workspaceProjectE).isExplicitOwner).to.be.ok
          })
        })

        describe('to workspace member', () => {
          beforeEach(async () => {
            await apollo.execute(
              UpdateWorkspaceRoleDocument,
              {
                input: {
                  userId: workspaceGuestUser.id,
                  workspaceId: workspace.id,
                  role: Roles.Workspace.Member
                }
              },
              { assertNoErrors: true }
            )
          })

          it('should retain same explicit access and get full implicit acccess', async () => {
            const { projects, checkProject, checkAllProjects } = await getProjects({
              user: workspaceGuestUser
            })

            expect(projects.length).to.eq(5)
            expect(checkAllProjects((p) => p.isReviewer)).to.be.ok
            expect(checkProject(workspaceProjectA).isExplicitContributor).to.be.ok
            expect(checkProject(workspaceProjectB).isExplicitReviewer).to.be.ok
            expect(checkProject(workspaceProjectC).hasExplicitRole).to.be.not.ok
            expect(checkProject(workspaceProjectD).hasExplicitRole).to.be.not.ok
            expect(checkProject(workspaceProjectE).isExplicitReviewer).to.be.ok
          })
        })
      })

      describe('when changing workspace member viewer', () => {
        describe('to workspace admin', () => {
          beforeEach(async () => {
            await apollo.execute(
              UpdateWorkspaceRoleDocument,
              {
                input: {
                  userId: workspaceMemberViewerUser.id,
                  workspaceId: workspace.id,
                  role: Roles.Workspace.Admin
                }
              },
              { assertNoErrors: true }
            )
          })

          it('should get editor seat, implicit owner role everywhere and explicit upgraded to owner', async () => {
            const { workspace, projects, checkProject, checkAllProjects } =
              await getProjects({
                user: workspaceMemberViewerUser
              })

            expect(workspace.seatType).to.eq(WorkspaceSeatType.Editor)
            expect(projects.length).to.eq(5)
            expect(checkAllProjects((p) => p.isOwner)).to.be.ok
            expect(checkProject(workspaceProjectA).isExplicitOwner).to.be.ok
            expect(checkProject(workspaceProjectB).hasExplicitRole).to.not.be.ok
            expect(checkProject(workspaceProjectC).hasExplicitRole).to.not.be.ok
            expect(checkProject(workspaceProjectD).hasExplicitRole).to.not.be.ok
            expect(checkProject(workspaceProjectE).isExplicitOwner).to.be.ok
          })
        })

        describe('to workspace guest', () => {
          beforeEach(async () => {
            await apollo.execute(
              UpdateWorkspaceRoleDocument,
              {
                input: {
                  userId: workspaceMemberViewerUser.id,
                  workspaceId: workspace.id,
                  role: Roles.Workspace.Guest
                }
              },
              { assertNoErrors: true }
            )
          })

          it('retain viewer seat, no implicit access and all explicit at reviewer or less', async () => {
            const { projects, checkProject, workspace } = await getProjects({
              user: workspaceMemberViewerUser
            })

            expect(workspace.seatType).to.eq(WorkspaceSeatType.Viewer)
            expect(projects.length).to.eq(2)
            expect(checkProject(workspaceProjectA).isExplicitReviewer).to.be.ok
            expect(checkProject(workspaceProjectE).isExplicitReviewer).to.be.ok
          })
        })
      })

      describe('when changing workspace guest viewer', () => {
        describe('to workspace admin', () => {
          beforeEach(async () => {
            await apollo.execute(
              UpdateWorkspaceRoleDocument,
              {
                input: {
                  userId: workspaceGuestViewerUser.id,
                  workspaceId: workspace.id,
                  role: Roles.Workspace.Admin
                }
              },
              { assertNoErrors: true }
            )
          })

          it('should upgrade seatType to editor, explicit role to owner, and have implicit owner everywhere', async () => {
            const { workspace, projects, checkProject, checkAllProjects } =
              await getProjects({
                user: workspaceGuestViewerUser
              })

            expect(workspace.seatType).to.eq(WorkspaceSeatType.Editor)
            expect(projects.length).to.eq(5)
            expect(checkAllProjects((p) => p.isOwner)).to.be.ok
            expect(checkProject(workspaceProjectA).hasExplicitRole).to.not.be.ok
            expect(checkProject(workspaceProjectB).isExplicitOwner).to.be.ok
            expect(checkProject(workspaceProjectC).hasExplicitRole).to.not.be.ok
            expect(checkProject(workspaceProjectD).hasExplicitRole).to.be.not.ok
            expect(checkProject(workspaceProjectE).isExplicitOwner).to.be.ok
          })
        })

        describe('to workspace member', () => {
          beforeEach(async () => {
            await apollo.execute(
              UpdateWorkspaceRoleDocument,
              {
                input: {
                  userId: workspaceGuestViewerUser.id,
                  workspaceId: workspace.id,
                  role: Roles.Workspace.Member
                }
              },
              { assertNoErrors: true }
            )
          })

          it('should retain viewer seat, same explicit access and get full workspace visibility implicit acccess', async () => {
            const { workspace, projects, checkProject, checkAllProjects } =
              await getProjects({
                user: workspaceGuestViewerUser
              })

            expect(workspace.seatType).to.eq(WorkspaceSeatType.Viewer)
            expect(projects.length).to.eq(5)
            expect(checkAllProjects((p) => p.isReviewer)).to.be.ok
            expect(checkProject(workspaceProjectA).hasExplicitRole).to.be.not.ok
            expect(checkProject(workspaceProjectB).isExplicitReviewer).to.be.ok
            expect(checkProject(workspaceProjectC).hasExplicitRole).to.be.not.ok
            expect(checkProject(workspaceProjectD).hasExplicitRole).to.be.not.ok
            expect(checkProject(workspaceProjectE).isExplicitReviewer).to.be.ok
          })
        })
      })
    })
  })

  describe('doing composite role/seat changes', () => {
    const testWorkspace: BasicTestWorkspace = {
      id: '',
      ownerId: '',
      slug: '',
      name: 'Test Composite Role Change Workspace'
    }

    const workspaceAdminUser: BasicTestUser = {
      id: '',
      name: 'Composite John "Owner" Specke',
      email: 'composite-john-owner-speckle@example.org'
    }

    const workspaceMemberUser: BasicTestUser = {
      id: '',
      name: 'Composite John "Member" Speckel',
      email: 'composite-john-member-speckle@example.org'
    }

    before(async () => {
      await createTestUsers([workspaceAdminUser, workspaceMemberUser])
    })

    beforeEach(async () => {
      await createTestWorkspace(testWorkspace, serverAdminUser, {
        addPlan: {
          name: 'team',
          status: 'valid'
        }
      })

      await assignToWorkspace(
        testWorkspace,
        workspaceAdminUser,
        Roles.Workspace.Admin,
        WorkspaceSeatType.Editor
      )
      await assignToWorkspace(
        testWorkspace,
        workspaceMemberUser,
        Roles.Workspace.Member,
        WorkspaceSeatType.Editor
      )
    })

    afterEach(async () => {
      await truncateTables([
        Workspaces.name,
        Streams.name,
        WorkspaceAcl.name,
        WorkspaceSeats.name
      ])
    })

    it('downgrading admin->guest if last owner, sets new owner from workspace admins', async () => {
      // User             Workspace Role    Project Role
      // serverAdminUser       Admin             None
      // workspaceAdminUser    Admin             Owner
      //
      // Action: `workspaceAdminUser` downgraded to workspace guest

      const project: BasicTestStream = {
        id: '',
        ownerId: '',
        name: 'Test Composite Project',
        isPublic: false,
        workspaceId: testWorkspace.id
      }
      await createTestStream(project, workspaceAdminUser)
      const apollo = await testApolloServer({
        authUserId: serverAdminUser.id
      })

      const remove = await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: workspaceAdminUser.id,
          role: Roles.Workspace.Guest,
          workspaceId: testWorkspace.id
        }
      })
      expect(remove).to.not.haveGraphQLErrors()

      const { workspace, checkProject } = await getWorkspaceProjects({
        user: workspaceAdminUser,
        workspace: testWorkspace
      })
      expect(workspace?.role).to.eq(Roles.Workspace.Guest)
      expect(checkProject(project).isExplicitContributor).to.be.ok

      const { checkProject: checkProjectForAdmin } = await getUserProjects({
        user: serverAdminUser
      })
      expect(checkProjectForAdmin(project).isExplicitOwner).to.be.ok
    })

    it('downgrading member to viewer if last owner, sets new owner from workspace admins', async () => {
      // User             Workspace Role    Project Role
      // workspaceAdminUser       Admin             None
      // workspaceMemberUser      Member            Owner
      //
      // Action: `workspaceAdminUser` downgraded to workspace guest

      // ensure serverAdmin is no longer admin, so there's only 1 - workspaceAdmin
      await unassignFromWorkspace(testWorkspace, serverAdminUser)

      const project: BasicTestStream = {
        id: '',
        ownerId: '',
        name: 'Test Composite Project',
        isPublic: false,
        workspaceId: testWorkspace.id
      }
      await createTestStream(project, workspaceMemberUser)
      const apollo = await testApolloServer({
        authUserId: workspaceAdminUser.id
      })

      const downgrade = await apollo.execute(UpdateWorkspaceSeatTypeDocument, {
        input: {
          userId: workspaceMemberUser.id,
          workspaceId: testWorkspace.id,
          seatType: WorkspaceSeatType.Viewer
        }
      })
      expect(downgrade).to.not.haveGraphQLErrors()

      const { workspace, checkProject } = await getWorkspaceProjects({
        user: workspaceMemberUser,
        workspace: testWorkspace
      })
      expect(workspace?.role).to.eq(Roles.Workspace.Member)
      expect(workspace?.seatType).to.eq(WorkspaceSeatType.Viewer)
      expect(checkProject(project).isExplicitReviewer).to.be.ok

      const { checkProject: checkProjectForAdmin } = await getUserProjects({
        user: workspaceAdminUser
      })
      expect(checkProjectForAdmin(project).isExplicitOwner).to.be.ok
    })

    it('leaving workspace as last owner of a workspace, sets new owner from workspace admins', async () => {
      // User             Workspace Role    Project Role
      // workspaceAdminUser    Admin             None
      // workspaceMemberUser   Member            Owner
      //
      // Action: `workspaceMemberUser` leaves workspace

      // ensure serverAdmin is no longer admin, so there's only 1 - workspaceAdmin
      await unassignFromWorkspace(testWorkspace, serverAdminUser)

      const project: BasicTestStream = {
        id: '',
        ownerId: '',
        name: 'Test Leave Project',
        isPublic: false,
        workspaceId: testWorkspace.id
      }
      await createTestStream(project, workspaceMemberUser)
      const apollo = await testApolloServer({
        authUserId: workspaceMemberUser.id
      })

      const leave = await apollo.execute(ActiveUserLeaveWorkspaceDocument, {
        id: testWorkspace.id
      })
      expect(leave).to.not.haveGraphQLErrors()

      const { workspace } = await getUserWorkspace({
        user: workspaceMemberUser,
        workspace: testWorkspace
      })
      expect(workspace?.role).to.not.be.ok

      const { checkProject } = await getUserProjects({
        user: workspaceMemberUser
      })
      expect(checkProject(project).hasExplicitRole).to.be.not.ok

      const { checkProject: checkProjectForAdmin } = await getUserProjects({
        user: workspaceAdminUser
      })
      expect(checkProjectForAdmin(project).isExplicitOwner).to.be.ok
    })

    it('leaving workspace w/o owner roles works fine and removes all roles', async () => {
      // User             Workspace Role    Project Role
      // workspaceAdminUser    Admin             Owner
      // workspaceMemberUser   Member            Reviewer
      //
      // Action: `workspaceMemberUser` leaves workspace

      const project: BasicTestStream = {
        id: '',
        ownerId: '',
        name: 'Test Leave Project',
        isPublic: false,
        workspaceId: testWorkspace.id
      }
      await createTestStream(project, workspaceAdminUser)
      await addToStream(project, workspaceMemberUser, Roles.Stream.Reviewer)

      const apollo = await testApolloServer({
        authUserId: workspaceMemberUser.id
      })

      const leave = await apollo.execute(ActiveUserLeaveWorkspaceDocument, {
        id: testWorkspace.id
      })
      expect(leave).to.not.haveGraphQLErrors()
      expect(leave.data?.workspaceMutations.leave).to.be.ok

      const { checkProject } = await getUserProjects({
        user: workspaceMemberUser
      })
      expect(checkProject(project).hasExplicitRole).to.be.not.ok

      const { workspace } = await getUserWorkspace({
        user: workspaceMemberUser,
        workspace: testWorkspace
      })
      expect(workspace?.role).to.be.not.ok
    })

    it('removing a workspace member that is the last owner of a workspace project sets new owner from workspace admins', async () => {
      // User             Workspace Role    Project Role
      // workspaceAdminUser    Admin             None
      // workspaceMemberUser   Member            Owner
      //
      // Action: `workspaceAdminUser` removes `workspaceMemberUser` from the workspace

      // ensure serverAdmin is no longer admin, so there's only 1 - workspaceAdmin
      await unassignFromWorkspace(testWorkspace, serverAdminUser)

      const project: BasicTestStream = {
        id: '',
        ownerId: '',
        name: 'Test Remove Project',
        isPublic: false,
        workspaceId: testWorkspace.id
      }
      await createTestStream(project, workspaceMemberUser)
      const apollo = await testApolloServer({
        authUserId: workspaceAdminUser.id
      })

      const remove = await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: workspaceMemberUser.id,
          role: null,
          workspaceId: testWorkspace.id
        }
      })
      expect(remove).to.not.haveGraphQLErrors()
      expect(remove.data?.workspaceMutations.updateRole).to.be.ok

      const { checkProject } = await getUserProjects({
        user: workspaceMemberUser
      })
      expect(checkProject(project).hasExplicitRole).to.be.not.ok

      const { workspace } = await getUserWorkspace({
        user: workspaceMemberUser,
        workspace: testWorkspace
      })
      expect(workspace?.role).to.be.not.ok

      const { checkProject: checkProjectForAdmin } = await getUserProjects({
        user: workspaceAdminUser
      })
      expect(checkProjectForAdmin(project).isExplicitOwner).to.be.ok
    })

    it('removing a workspace member that is not the last owner of a workspace project works fine and removes all roles', async () => {
      // User             Workspace Role    Project Role
      // workspaceAdminUser    Admin             Owner
      // workspaceMemberUser   Member            Reviewer
      //
      // Action: `workspaceAdminUser` removes `workspaceMemberUser` from the workspace

      const project: BasicTestStream = {
        id: '',
        ownerId: '',
        name: 'Test Remove Project',
        isPublic: false,
        workspaceId: testWorkspace.id
      }
      await createTestStream(project, workspaceAdminUser)
      await addToStream(project, workspaceMemberUser, Roles.Stream.Reviewer)

      const apollo = await testApolloServer({
        authUserId: workspaceAdminUser.id
      })

      const remove = await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: workspaceMemberUser.id,
          role: null,
          workspaceId: testWorkspace.id
        }
      })
      expect(remove).to.not.haveGraphQLErrors()
      expect(remove.data?.workspaceMutations.updateRole).to.be.ok

      const { checkProject } = await getUserProjects({
        user: workspaceMemberUser
      })
      expect(checkProject(project).hasExplicitRole).to.be.not.ok

      const { workspace } = await getUserWorkspace({
        user: workspaceMemberUser,
        workspace: testWorkspace
      })
      expect(workspace?.role).to.be.not.ok
    })
  })
})
